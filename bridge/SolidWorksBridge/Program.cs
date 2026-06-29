using System.Reflection;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
var dashboardOrigin = builder.Configuration["DashboardOrigin"] ?? "https://kabirspatel.github.io";

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(dashboardOrigin, "http://localhost:8080", "http://127.0.0.1:8080")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddSingleton<SolidWorksAutomation>();

var app = builder.Build();
app.UseCors();

app.MapGet("/health", (SolidWorksAutomation solidworks, HttpRequest request) =>
{
    var status = solidworks.GetStatus();
    return Results.Json(new
    {
        solidworksRunning = status.Running,
        activeDocument = status.ActiveDocument,
        embedUrl = BuildUrl(request, "/viewer"),
        message = status.Message
    });
});

app.MapPost("/api/model", async (JsonElement payload, SolidWorksAutomation solidworks, HttpRequest request) =>
{
    var result = await solidworks.ApplyModelAsync(payload);
    return Results.Json(new
    {
        activeDocument = result.ActiveDocument,
        embedUrl = BuildUrl(request, "/viewer"),
        message = result.Message,
        designTablePath = result.DesignTablePath
    });
});

app.MapPost("/api/simulate", async (JsonElement payload, SolidWorksAutomation solidworks) =>
{
    var simulation = await solidworks.RunSimulationAsync(payload);
    return Results.Json(new
    {
        message = "Simulation workflow completed",
        simulation
    });
});

app.MapPost("/api/optimize", async (JsonElement payload, SolidWorksAutomation solidworks) =>
{
    var optimization = await solidworks.OptimizeAsync(payload);
    return Results.Json(new
    {
        message = "Optimization workflow completed",
        optimization
    });
});

app.MapPost("/api/material-assessment", async (JsonElement payload, SolidWorksAutomation solidworks) =>
{
    var materialAssessment = await solidworks.AssessMaterialAsync(payload);
    return Results.Json(new
    {
        message = "Material and LCA workflow completed",
        materialAssessment
    });
});

app.MapPost("/api/agents/run", async (JsonElement payload, SolidWorksAutomation solidworks) =>
{
    var agents = await solidworks.RunAgentsAsync(payload);
    return Results.Json(new
    {
        message = "Agent workflow completed",
        agents
    });
});

app.MapGet("/viewer", (SolidWorksAutomation solidworks) => Results.Content(RenderViewer(solidworks.GetStatus()), "text/html"));

app.Run();

static string BuildUrl(HttpRequest request, string path)
{
    return $"{request.Scheme}://{request.Host}{path}";
}

static string RenderViewer(SolidWorksStatus status)
{
    return $$"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SolidWorks Bridge Viewer</title>
  <style>
    body { margin: 0; font-family: Segoe UI, Arial, sans-serif; color: #172225; background: #edf3f2; }
    main { display: grid; place-items: center; min-height: 100vh; padding: 24px; }
    section { width: min(720px, 100%); border: 1px solid #b9c7c9; background: white; padding: 18px; }
    h1 { margin: 0 0 8px; font-size: 20px; }
    p { margin: 6px 0; color: #5d696b; }
    code { color: #24383d; }
  </style>
</head>
<body>
  <main>
    <section>
      <h1>SolidWorks Bridge</h1>
      <p>Status: <code>{{status.Message}}</code></p>
      <p>Active document: <code>{{status.ActiveDocument}}</code></p>
      <p>This iframe is the dashboard-facing viewer endpoint. For a true native working window, run SolidWorksNativeHost so Edge and SolidWorks are embedded into one Windows shell.</p>
    </section>
  </main>
</body>
</html>
""";
}

public sealed class SolidWorksAutomation
{
    private readonly string _workspace;

    public SolidWorksAutomation(IWebHostEnvironment environment)
    {
        _workspace = Path.Combine(environment.ContentRootPath, "runs");
        Directory.CreateDirectory(_workspace);
    }

    public SolidWorksStatus GetStatus()
    {
        try
        {
            dynamic? app = GetSolidWorksApplication(createIfMissing: false);
            if (app is null) return new SolidWorksStatus(false, "No active SolidWorks document", "SolidWorks is not running");
            dynamic? activeDoc = app.ActiveDoc;
            string activeName = activeDoc is null ? "No active SolidWorks document" : Convert.ToString(activeDoc.GetTitle()) ?? "Active SolidWorks document";
            return new SolidWorksStatus(true, activeName, "SolidWorks connected");
        }
        catch (Exception error)
        {
            return new SolidWorksStatus(false, "Unavailable", error.Message);
        }
    }

    public async Task<ModelResult> ApplyModelAsync(JsonElement payload)
    {
        var activeDocument = ReadString(payload, "targetDocument", "solidworks-model.SLDPRT");
        var runFolder = CreateRunFolder(payload);
        var designTablePath = Path.Combine(runFolder, "solidworks-design-table.csv");
        await File.WriteAllTextAsync(Path.Combine(runFolder, "model-payload.json"), payload.GetRawText());
        await File.WriteAllTextAsync(designTablePath, BuildDesignTableCsv(payload));

        try
        {
            dynamic app = GetSolidWorksApplication(createIfMissing: true) ?? throw new InvalidOperationException("SolidWorks COM application is unavailable.");
            app.Visible = true;
            dynamic? model = app.ActiveDoc;
            if (model is null)
            {
                app.NewPart();
                model = app.ActiveDoc;
            }
            TryForceRebuild(model);
            activeDocument = Convert.ToString(model?.GetTitle()) ?? activeDocument;
            return new ModelResult(activeDocument, $"Model payload applied. Design table written to {designTablePath}", designTablePath);
        }
        catch (Exception error)
        {
            return new ModelResult(activeDocument, $"Bridge stored payload and design table; SolidWorks automation needs attention: {error.Message}", designTablePath);
        }
    }

    public async Task<object> RunSimulationAsync(JsonElement payload)
    {
        await WriteRunArtifactAsync(payload, "simulation-payload.json");
        var wall = ReadParameter(payload, "wall", ReadParameter(payload, "thickness", 2.5));
        var length = ReadParameter(payload, "length", ReadParameter(payload, "baseLength", 160));
        var safetyFactor = Math.Round(Math.Clamp(1.1 + wall * 0.24 - length * 0.0014, 0.7, 2.8), 2);
        return new
        {
            status = safetyFactor >= 1.45 ? "Pass" : safetyFactor >= 1.15 ? "Review" : "Hold",
            safetyFactor,
            critique = safetyFactor >= 1.45 ? "First-pass bridge simulation cleared." : "Review wall thickness, ribs, and unsupported spans.",
            source = "SolidWorks bridge scaffold",
            generatedAt = DateTimeOffset.UtcNow
        };
    }

    public async Task<object> OptimizeAsync(JsonElement payload)
    {
        await WriteRunArtifactAsync(payload, "optimization-payload.json");
        return new
        {
            status = "Ready",
            recommendations = new[]
            {
                "Rebuild model with current design table.",
                "Run formal SolidWorks Simulation study.",
                "Apply geometry changes only after material/process review."
            },
            source = "SolidWorks bridge scaffold",
            generatedAt = DateTimeOffset.UtcNow
        };
    }

    public async Task<object> AssessMaterialAsync(JsonElement payload)
    {
        await WriteRunArtifactAsync(payload, "material-payload.json");
        var material = ReadNestedString(payload, "concept", "material", "Mixed materials");
        return new
        {
            material,
            feasibility = material.Contains("PET", StringComparison.OrdinalIgnoreCase) ? 86 : 78,
            lca = material.Contains("PET", StringComparison.OrdinalIgnoreCase) ? 70 : 58,
            process = material.Contains("PET", StringComparison.OrdinalIgnoreCase) ? "Blow molding" : "Bridge review",
            recommendation = "Replace scaffold scores with project-specific material and LCA database values.",
            source = "SolidWorks bridge scaffold",
            generatedAt = DateTimeOffset.UtcNow
        };
    }

    public async Task<object[]> RunAgentsAsync(JsonElement payload)
    {
        await WriteRunArtifactAsync(payload, "agents-payload.json");
        return new object[]
        {
            new { key = "design", label = "Design", status = "Ready", result = "Geometry and features packaged." },
            new { key = "standards", label = "Standards", status = "Review", result = "Manufacturing constraints need formal rules." },
            new { key = "solidworks", label = "SolidWorks", status = "Ready", result = "Design table and payload written." },
            new { key = "fea", label = "FEA", status = "Queued", result = "Simulation endpoint prepared." },
            new { key = "material", label = "Material", status = "Review", result = "Material assessment scaffold complete." },
            new { key = "lca", label = "LCA", status = "Review", result = "Connect LCA data source for final scoring." }
        };
    }

    private dynamic? GetSolidWorksApplication(bool createIfMissing)
    {
        var type = Type.GetTypeFromProgID("SldWorks.Application");
        if (type is null) return null;
        try
        {
            return MarshalGetActiveObject("SldWorks.Application");
        }
        catch
        {
            return createIfMissing ? Activator.CreateInstance(type) : null;
        }
    }

    private static object MarshalGetActiveObject(string progId)
    {
        var type = Type.GetType("System.Runtime.InteropServices.Marshal");
        var method = type?.GetMethod("GetActiveObject", BindingFlags.Public | BindingFlags.Static);
        if (method is null) throw new InvalidOperationException("Marshal.GetActiveObject is unavailable.");
        return method.Invoke(null, new object[] { progId }) ?? throw new InvalidOperationException("Active COM object not found.");
    }

    private static void TryForceRebuild(dynamic? model)
    {
        try
        {
            model?.ForceRebuild3(false);
        }
        catch
        {
            // Some document states do not support rebuild through late-bound COM.
        }
    }

    private string CreateRunFolder(JsonElement payload)
    {
        var revision = ReadInt(payload, "revision", 0);
        var folder = Path.Combine(_workspace, $"run-{DateTimeOffset.UtcNow:yyyyMMdd-HHmmss}-r{revision}");
        Directory.CreateDirectory(folder);
        return folder;
    }

    private async Task WriteRunArtifactAsync(JsonElement payload, string filename)
    {
        var folder = CreateRunFolder(payload);
        await File.WriteAllTextAsync(Path.Combine(folder, filename), payload.GetRawText());
    }

    private static string BuildDesignTableCsv(JsonElement payload)
    {
        var builder = new StringBuilder();
        builder.AppendLine("configuration,parameter,label,value,unit,swDimension,source");
        if (!payload.TryGetProperty("parameters", out var parameters) || parameters.ValueKind != JsonValueKind.Array) return builder.ToString();
        foreach (var parameter in parameters.EnumerateArray())
        {
            builder.AppendLine(string.Join(",", new[]
            {
                Csv("Default"),
                Csv(ReadString(parameter, "key", "")),
                Csv(ReadString(parameter, "label", "")),
                Csv(ReadDouble(parameter, "value", 0).ToString("0.###")),
                Csv(ReadString(parameter, "unit", "")),
                Csv(ReadString(parameter, "swDimension", "")),
                Csv(ReadString(parameter, "source", ""))
            }));
        }
        return builder.ToString();
    }

    private static string Csv(string value) => $"\"{value.Replace("\"", "\"\"")}\"";

    private static double ReadParameter(JsonElement payload, string key, double fallback)
    {
        if (!payload.TryGetProperty("parameters", out var parameters) || parameters.ValueKind != JsonValueKind.Array) return fallback;
        foreach (var parameter in parameters.EnumerateArray())
        {
            if (ReadString(parameter, "key", "").Equals(key, StringComparison.OrdinalIgnoreCase))
            {
                return ReadDouble(parameter, "value", fallback);
            }
        }
        return fallback;
    }

    private static string ReadNestedString(JsonElement payload, string parent, string child, string fallback)
    {
        return payload.TryGetProperty(parent, out var node) ? ReadString(node, child, fallback) : fallback;
    }

    private static string ReadString(JsonElement element, string key, string fallback)
    {
        return element.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() ?? fallback : fallback;
    }

    private static int ReadInt(JsonElement element, string key, int fallback)
    {
        return element.TryGetProperty(key, out var value) && value.TryGetInt32(out var result) ? result : fallback;
    }

    private static double ReadDouble(JsonElement element, string key, double fallback)
    {
        return element.TryGetProperty(key, out var value) && value.TryGetDouble(out var result) ? result : fallback;
    }
}

public sealed record SolidWorksStatus(bool Running, string ActiveDocument, string Message);

public sealed record ModelResult(string ActiveDocument, string Message, string DesignTablePath);
