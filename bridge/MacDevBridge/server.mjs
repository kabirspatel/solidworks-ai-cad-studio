import { createServer } from "node:http";
import { writeFile, mkdir, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const runRoot = path.join(__dirname, "runs");
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";
const dashboardOrigin = process.env.DASHBOARD_ORIGIN || "https://kabirspatel.github.io";
const allowedOrigins = new Set([
  dashboardOrigin,
  "https://kabirspatel.github.io",
  "https://kabirspatel.github.io/solidworks-ai-cad-studio",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8787",
  "http://127.0.0.1:8787"
]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

const cadProviders = {
  solidworks_desktop: {
    label: "SOLIDWORKS desktop",
    category: "desktop",
    status: "requires-host",
    viewer: "Bridge iframe or exported macro",
    auth: "Windows host with licensed SOLIDWORKS and COM automation",
    outputs: ["SWB macro", "design-table CSV", "STEP/STL via host"],
    nextSteps: [
      "Run the Windows SolidWorks bridge on a licensed workstation or VM.",
      "POST the neutral CAD package to /api/model on that bridge.",
      "Use the generated macro/design table when direct COM access is unavailable."
    ]
  },
  solidworks_cloud: {
    label: "3DEXPERIENCE / SOLIDWORKS xDesign",
    category: "cloud",
    status: "broker-required",
    viewer: "Provider workspace or shared model iframe when allowed",
    auth: "3DEXPERIENCE OAuth/session broker",
    outputs: ["neutral CAD package", "STEP/STL handoff", "xDesign workspace link"],
    nextSteps: ["Create a Dassault cloud broker with user login.", "Fallback to STEP/STL import when feature-level APIs are unavailable."]
  },
  onshape: {
    label: "Onshape",
    category: "cloud",
    status: "api-ready",
    viewer: "Onshape document/Part Studio iframe or shared URL",
    auth: "Onshape OAuth or API key/secret",
    outputs: ["Part Studio feature JSON", "STEP", "STL", "DXF"],
    nextSteps: ["Provision Onshape OAuth/API credentials.", "Push feature/parameter updates through the Onshape REST API."]
  },
  autodesk_fusion: {
    label: "Autodesk Fusion / APS",
    category: "cloud",
    status: "api-ready",
    viewer: "Autodesk Platform Services Viewer",
    auth: "Autodesk Platform Services OAuth",
    outputs: ["SVF/Viewer URN", "STEP", "STL", "Fusion automation job"],
    nextSteps: ["Provision APS credentials and storage.", "Translate with Model Derivative and automate with Design Automation."]
  },
  autocad: {
    label: "AutoCAD / DWG",
    category: "cloud",
    status: "api-ready",
    viewer: "Autodesk Platform Services Viewer",
    auth: "Autodesk Platform Services OAuth",
    outputs: ["DWG/DXF package", "Design Automation work item", "Viewer URN"],
    nextSteps: ["Convert profiles into DXF/DWG entities.", "Run AutoCAD Design Automation work items for scripted drawings."]
  },
  open_geometry: {
    label: "Open geometry server",
    category: "server",
    status: "available",
    viewer: "Three.js/STL",
    auth: "none",
    outputs: ["STL", "neutral parameter JSON", "analysis package"],
    nextSteps: ["Use local preview/export immediately.", "Add STEP/BREP-quality output later with CadQuery/OpenCascade."]
  }
};

let lastRun = {
  activeDocument: "portable-diagnostic-enclosure.SLDPRT",
  message: "Mac development bridge is ready",
  folder: "",
  payload: null,
  simulation: null,
  optimization: null,
  materialAssessment: null,
  agents: null
};

await mkdir(runRoot, { recursive: true });

const server = createServer(async (request, response) => {
  try {
    setCors(request, response);
    const method = request.method || "GET";

    if (method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);

    if ((method === "GET" || method === "HEAD") && url.pathname === "/health") {
      json(response, {
        solidworksRunning: false,
        activeDocument: lastRun.activeDocument,
        embedUrl: absoluteUrl(request, "/viewer"),
        aiProxy: Boolean(process.env.OPENAI_API_KEY),
        aiProviders: {
          openai: Boolean(process.env.OPENAI_API_KEY),
          gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
          claude: Boolean(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY)
        },
        cadProviders: Object.keys(cadProviders),
        message: "Mac dev bridge online. Native SolidWorks embedding still requires the Windows host."
      }, 200, method === "HEAD");
      return;
    }

    if ((method === "GET" || method === "HEAD") && url.pathname === "/viewer") {
      html(response, renderViewer(), 200, method === "HEAD");
      return;
    }

    if ((method === "GET" || method === "HEAD") && url.pathname.startsWith("/runs/")) {
      await serveRunFile(response, url.pathname, method === "HEAD");
      return;
    }

    if (method === "POST" && url.pathname === "/api/model") {
      const payload = await readJson(request);
      const run = await persistRun(payload, "model");
      lastRun = {
        ...lastRun,
        activeDocument: readString(payload, "targetDocument", `${slug(readNested(payload, "concept", "title", "solidworks-model"))}.SLDPRT`),
        message: `Mac bridge captured model payload in ${path.basename(run.folder)}`,
        folder: run.folder,
        payload
      };
      json(response, {
        activeDocument: lastRun.activeDocument,
        embedUrl: absoluteUrl(request, "/viewer"),
        message: lastRun.message,
        designTablePath: run.artifacts.designTable,
        artifacts: run.publicArtifacts
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/simulate") {
      const payload = await readJson(request);
      const simulation = buildSimulation(payload);
      const run = await persistRun(payload, "simulation", { "simulation-report.json": simulation });
      lastRun = { ...lastRun, payload, simulation, folder: run.folder, message: "Mac simulation estimate completed" };
      json(response, { message: lastRun.message, simulation, artifacts: run.publicArtifacts });
      return;
    }

    if (method === "POST" && url.pathname === "/api/optimize") {
      const payload = await readJson(request);
      const simulation = lastRun.simulation || buildSimulation(payload);
      const optimization = buildOptimization(payload, simulation);
      const run = await persistRun(payload, "optimization", { "optimization-report.json": optimization });
      lastRun = { ...lastRun, payload, optimization, folder: run.folder, message: "Mac optimization pass completed" };
      json(response, { message: lastRun.message, optimization, artifacts: run.publicArtifacts });
      return;
    }

    if (method === "POST" && url.pathname === "/api/material-assessment") {
      const payload = await readJson(request);
      const materialAssessment = buildMaterialAssessment(payload);
      const run = await persistRun(payload, "material", { "material-lca-report.json": materialAssessment });
      lastRun = { ...lastRun, payload, materialAssessment, folder: run.folder, message: "Mac material/LCA estimate completed" };
      json(response, { message: lastRun.message, materialAssessment, artifacts: run.publicArtifacts });
      return;
    }

    if (method === "POST" && url.pathname === "/api/lca") {
      const payload = await readJson(request);
      const materialAssessment = buildMaterialAssessment(payload);
      const run = await persistRun(payload, "lca", { "material-lca-report.json": materialAssessment });
      lastRun = { ...lastRun, payload, materialAssessment, folder: run.folder, message: "Mac LCA screen completed" };
      json(response, { message: lastRun.message, materialAssessment, artifacts: run.publicArtifacts });
      return;
    }

    if (method === "POST" && url.pathname === "/api/patents/search") {
      const payload = await readJson(request);
      const result = buildPatentSearch(payload);
      json(response, result);
      return;
    }

    if (method === "POST" && url.pathname === "/api/agents/run") {
      const payload = await readJson(request);
      const agents = buildAgents(payload, lastRun);
      const run = await persistRun(payload, "agents", { "agent-report.json": agents });
      lastRun = { ...lastRun, payload, agents, folder: run.folder, message: "Mac multi-agent pass completed" };
      json(response, { message: lastRun.message, agents, artifacts: run.publicArtifacts });
      return;
    }

    if (method === "POST" && url.pathname === "/api/copilot") {
      const requestBody = await readJson(request);
      const copilot = await runCopilot(requestBody);
      json(response, copilot);
      return;
    }

    if (method === "POST" && url.pathname === "/api/ai/generate") {
      const requestBody = await readJson(request);
      const copilot = await runCopilot(requestBody);
      json(response, copilot);
      return;
    }

    if ((method === "GET" || method === "HEAD") && url.pathname === "/api/cad/providers") {
      json(response, {
        providers: Object.entries(cadProviders).map(([key, value]) => ({ key, ...value })),
        message: "Mac bridge CAD provider registry loaded."
      }, 200, method === "HEAD");
      return;
    }

    if (method === "POST" && url.pathname === "/api/cad/package") {
      const requestBody = await readJson(request);
      const providerKey = requestBody.provider || requestBody.providerKey || "open_geometry";
      const payload = requestBody.payload || requestBody;
      const packageBody = cadPackage(payload, providerKey);
      json(response, {
        status: "packaged",
        message: `CAD-neutral package generated for ${packageBody.provider.label}.`,
        package: packageBody
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/cad/push") {
      const requestBody = await readJson(request);
      const providerKey = requestBody.provider || requestBody.providerKey || "open_geometry";
      const payload = requestBody.payload || requestBody;
      const packageBody = cadPackage(payload, providerKey);
      json(response, {
        status: providerKey === "open_geometry" ? "ready" : "needs-credentials",
        provider: packageBody.provider,
        message: providerKey === "open_geometry"
          ? "Open geometry package is ready for local preview/export."
          : `${packageBody.provider.label} package created; real push needs credentials or a host bridge.`,
        package: packageBody
      });
      return;
    }

    if (method === "GET" || method === "HEAD") {
      await serveStatic(response, url.pathname, method === "HEAD");
      return;
    }

    json(response, { error: "Not found" }, 404);
  } catch (error) {
    json(response, { error: error.message || String(error) }, 500);
  }
});

server.listen(port, host, () => {
  console.log(`SolidWorks AI CAD Studio Mac bridge: http://${host}:${port}/`);
  console.log("Set OPENAI_API_KEY to enable /api/copilot with OpenAI.");
});

function setCors(request, response) {
  const origin = request.headers.origin;
  response.setHeader("Access-Control-Allow-Origin", origin && allowedOrigins.has(origin) ? origin : dashboardOrigin);
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function absoluteUrl(request, pathname) {
  return `http://${request.headers.host || `${host}:${port}`}${pathname}`;
}

function json(response, payload, status = 200, headOnly = false) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(headOnly ? undefined : JSON.stringify(payload, null, 2));
}

function html(response, content, status = 200, headOnly = false) {
  response.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  response.end(headOnly ? undefined : content);
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

async function serveStatic(response, pathname, headOnly = false) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const target = path.normalize(path.join(repoRoot, cleanPath));
  if (!target.startsWith(repoRoot)) {
    json(response, { error: "Invalid path" }, 400);
    return;
  }

  await streamFile(response, target, headOnly);
}

async function serveRunFile(response, pathname, headOnly = false) {
  const target = path.normalize(path.join(__dirname, pathname.replace(/^\/runs\//, "runs/")));
  if (!target.startsWith(runRoot)) {
    json(response, { error: "Invalid run path" }, 400);
    return;
  }

  await streamFile(response, target, headOnly);
}

async function streamFile(response, target, headOnly = false) {
  try {
    const info = await stat(target);
    if (!info.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(target)] || "application/octet-stream",
      "Content-Length": info.size
    });
    if (headOnly) {
      response.end();
    } else {
      createReadStream(target).pipe(response);
    }
  } catch {
    json(response, { error: "Not found" }, 404);
  }
}

async function persistRun(payload, kind, extraArtifacts = {}) {
  const revision = Number(payload.revision || 0);
  const folderName = `${timestamp()}-${kind}-r${String(revision).padStart(2, "0")}`;
  const folder = path.join(runRoot, folderName);
  await mkdir(folder, { recursive: true });

  const artifacts = {
    payload: path.join(folder, "model-payload.json"),
    designTable: path.join(folder, "solidworks-design-table.csv"),
    operations: path.join(folder, "solidworks-operations.json"),
    summary: path.join(folder, "handoff-summary.md")
  };

  await writeFile(artifacts.payload, JSON.stringify(payload, null, 2));
  await writeFile(artifacts.designTable, designTableCsv(payload));
  await writeFile(artifacts.operations, JSON.stringify(buildSolidWorksOperations(payload), null, 2));
  await writeFile(artifacts.summary, handoffSummary(payload, kind));

  for (const [filename, value] of Object.entries(extraArtifacts)) {
    artifacts[filename] = path.join(folder, filename);
    await writeFile(artifacts[filename], JSON.stringify(value, null, 2));
  }

  return {
    folder,
    artifacts,
    publicArtifacts: Object.fromEntries(
      Object.entries(artifacts).map(([key, value]) => [key, `/runs/${folderName}/${path.basename(value)}`])
    )
  };
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function slug(value = "model") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "model";
}

function readString(object, key, fallback = "") {
  return typeof object?.[key] === "string" && object[key] ? object[key] : fallback;
}

function readNested(object, parent, key, fallback = "") {
  return readString(object?.[parent] || {}, key, fallback);
}

function parameters(payload) {
  return Array.isArray(payload.parameters) ? payload.parameters : [];
}

function parameterValue(payload, keys, fallback) {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const match = parameters(payload).find(parameter => keyList.includes(parameter.key));
  const value = Number(match?.value);
  return Number.isFinite(value) ? value : fallback;
}

function materialName(payload) {
  return readNested(payload, "concept", "material", "Mixed materials");
}

function designTableCsv(payload) {
  const rows = parameters(payload);
  const headers = ["configuration", "parameter", "label", "value", "unit", "swDimension", "source"];
  const csvRows = rows.map(parameter => [
    "Default",
    parameter.key || "",
    parameter.label || parameter.key || "",
    parameter.value ?? "",
    parameter.unit || "",
    parameter.swDimension || "",
    parameter.source || ""
  ]);
  return [headers, ...csvRows].map(row => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildSolidWorksOperations(payload) {
  const intentOps = Array.isArray(payload.solidworksIntent?.operations) ? payload.solidworksIntent.operations : [];
  const dimensionOps = parameters(payload).map(parameter => ({
    type: "set_dimension",
    parameter: parameter.key,
    swDimension: parameter.swDimension,
    value: parameter.value,
    unit: parameter.unit
  }));
  const contourOps = (payload.imageGeometry?.images || []).map(image => ({
    type: "guide_curve_profile",
    name: image.name,
    confidence: image.confidence,
    points: image.profile || []
  }));

  return {
    targetDocument: payload.targetDocument,
    documentType: payload.solidworksIntent?.documentType || "part",
    rebuildMode: payload.solidworksIntent?.rebuildMode || "parametric",
    featureOperations: intentOps,
    dimensionOperations: dimensionOps,
    imageGeometryOperations: contourOps,
    transitionMatrix: payload.imageGeometry?.transitionMatrix || []
  };
}

function cadPackage(payload, providerKey = "open_geometry") {
  const provider = cadProviders[providerKey] || cadProviders.open_geometry;
  const concept = payload.concept || {};
  const title = concept.title || payload.title || "CAD concept";
  const rows = parameters(payload).map((parameter, index) => ({
    configuration: "Default",
    parameter: parameter.key || `p${index + 1}`,
    label: parameter.label || parameter.key || `Parameter ${index + 1}`,
    value: parameter.value,
    unit: parameter.unit || "mm",
    cadDimension: parameter.swDimension || `D${index + 1}@${String(parameter.key || `p${index + 1}`).toUpperCase()}`,
    source: parameter.source || "CAD package"
  }));
  return {
    version: "cad-neutral-v1",
    createdAt: new Date().toISOString(),
    providerKey,
    provider,
    target: {
      family: concept.family || payload.family || "assembly",
      title,
      documentName: payload.targetDocument || `${slug(title)}.SLDPRT`,
      material: concept.material || payload.material || "Mixed materials"
    },
    payload,
    designTable: rows,
    operations: buildSolidWorksOperations(payload),
    exportFormats: provider.outputs,
    nextSteps: provider.nextSteps
  };
}

function buildSimulation(payload) {
  const length = parameterValue(payload, ["length", "baseLength"], 170);
  const width = parameterValue(payload, ["width", "baseWidth", "bodyDiameter"], 90);
  const height = parameterValue(payload, ["height", "legHeight", "depth"], 42);
  const wall = parameterValue(payload, ["wall", "thickness"], 2.5);
  const radius = parameterValue(payload, ["cornerRadius", "baseRadius"], 6);
  const unsupportedSpan = Math.max(length, width, height);
  const stiffnessIndex = clamp((wall * 18 + radius * 1.5) / Math.max(unsupportedSpan / 100, 1), 10, 95);
  const safetyFactor = round(clamp(0.8 + wall * 0.26 + radius * 0.025 - unsupportedSpan * 0.0011, 0.7, 3.2), 2);
  const displacementMm = round(clamp(unsupportedSpan / Math.max(wall * 45, 1), 0.1, 8), 2);
  const status = safetyFactor >= 1.5 ? "Pass" : safetyFactor >= 1.15 ? "Review" : "Hold";

  return {
    status,
    safetyFactor,
    displacementMm,
    stiffnessIndex: round(stiffnessIndex, 1),
    loadCase: "Mac estimate: 25 N distributed service load",
    critique: status === "Pass"
      ? "Mac estimate clears the first-pass structural screen."
      : "Increase wall thickness, add ribs, reduce unsupported span, or soften sharp transitions before formal SolidWorks Simulation.",
    source: "MacDevBridge estimate",
    generatedAt: new Date().toISOString()
  };
}

function buildOptimization(payload, simulation) {
  const recommendations = [];
  if (simulation.safetyFactor < 1.5) recommendations.push("Increase wall/thickness by 0.3 mm and regenerate the design table.");
  if ((payload.imageGeometry?.images || []).length > 0) recommendations.push("Convert extracted contour profiles into SolidWorks guide curves before feature rebuild.");
  if ((payload.designTable?.rows || []).length === 0) recommendations.push("Export a design table before Windows SolidWorks handoff.");
  if (buildMaterialAssessment(payload).lca < 65) recommendations.push("Compare PP, PET, aluminum, or recycled-content alternatives for lifecycle impact.");
  if (!recommendations.length) recommendations.push("Proceed to Windows SolidWorks rebuild and formal simulation.");

  return {
    status: simulation.status === "Pass" ? "Ready" : "Needs review",
    recommendations,
    nextRevision: `R${String(Number(payload.revision || 0) + 1).padStart(2, "0")}`,
    source: "MacDevBridge optimizer",
    generatedAt: new Date().toISOString()
  };
}

function buildMaterialAssessment(payload) {
  const material = materialName(payload);
  const lower = material.toLowerCase();
  const base = lower.includes("pet") ? { process: "Blow molding or thermoforming", feasibility: 86, lca: 70 }
    : lower.includes("pp") ? { process: "Injection molding or thermoforming", feasibility: 82, lca: 68 }
      : lower.includes("aluminum") ? { process: "CNC machining or forming", feasibility: 78, lca: 64 }
        : lower.includes("steel") ? { process: "Sheet forming or machining", feasibility: 74, lca: 60 }
          : lower.includes("pc-abs") ? { process: "Injection molding", feasibility: 84, lca: 58 }
            : { process: "Bridge review", feasibility: 68, lca: 52 };
  const wall = parameterValue(payload, ["wall", "thickness"], 2.5);
  const featureCount = Array.isArray(payload.concept?.features) ? payload.concept.features.length : 0;
  const feasibility = Math.round(clamp(base.feasibility + Math.min(wall, 4) - featureCount * 0.8, 35, 96));
  const lca = Math.round(clamp(base.lca - Math.max(0, wall - 2.5) * 3, 20, 94));

  return {
    material,
    process: base.process,
    feasibility,
    lca,
    decomposition: lca >= 70 ? "Favorable" : lca >= 55 ? "Review" : "Constrained",
    recommendation: feasibility >= 80 && lca >= 65
      ? "Proceed to supplier/process validation."
      : "Review material, resin content, wall thickness, and end-of-life strategy.",
    source: "MacDevBridge material model",
    generatedAt: new Date().toISOString()
  };
}

function buildPatentSearch(payload) {
  const query = [
    payload.query,
    payload.family,
    payload.material,
    ...(Array.isArray(payload.features) ? payload.features : []),
    ...(Array.isArray(payload.requirements) ? payload.requirements.slice(0, 2) : [])
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim() || "parametric CAD product design";
  const encoded = encodeURIComponent(query);
  return {
    query,
    source: "MacDevBridge search launchers",
    results: [],
    links: [
      { label: "Google Patents", url: `https://patents.google.com/?q=${encoded}`, note: "Fast broad prior-art scan" },
      { label: "USPTO Patent Public Search", url: "https://ppubs.uspto.gov/pubwebapp/", note: "Official US patent search" },
      { label: "Espacenet", url: `https://worldwide.espacenet.com/patent/search?q=${encoded}`, note: "International patent literature" },
      { label: "The Lens", url: `https://www.lens.org/lens/search/patent/list?q=${encoded}`, note: "Patent and scholarly landscape" }
    ],
    message: "Local bridge returned patent search launchers. Deploy cad-server for PatentsView-backed search."
  };
}

function buildAgents(payload, runState) {
  const simulation = runState.simulation || buildSimulation(payload);
  const material = runState.materialAssessment || buildMaterialAssessment(payload);
  const designRows = payload.designTable?.rows?.length || parameters(payload).length;
  return [
    { key: "design", label: "Design", status: "Ready", result: `${parameters(payload).length} parameters and ${(payload.concept?.features || []).length} features packaged.` },
    { key: "standards", label: "Standards", status: "Review", result: `${(payload.extractedRequirements || []).length} requirements mapped; formal standards rules still need project input.` },
    { key: "solidworks", label: "SolidWorks", status: "Queued", result: `${designRows} design-table rows and ${buildSolidWorksOperations(payload).featureOperations.length} feature operations ready for Windows.` },
    { key: "fea", label: "FEA", status: simulation.status, result: `Estimated safety factor ${simulation.safetyFactor}; formal SolidWorks Simulation required.` },
    { key: "material", label: "Material", status: material.feasibility >= 80 ? "Ready" : "Review", result: `${material.material}: feasibility ${material.feasibility}/100 via ${material.process}.` },
    { key: "lca", label: "LCA", status: material.lca >= 65 ? "Ready" : "Review", result: `LCA ${material.lca}/100; decomposition ${material.decomposition}.` }
  ];
}

async function runCopilot(requestBody) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return localCopilotResponse(requestBody.payload || {});

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: requestBody.model || "gpt-4o-mini",
      max_tokens: 1600,
      messages: [
        { role: "system", content: requestBody.instructions || "Return valid JSON for the CAD model." },
        { role: "user", content: JSON.stringify(requestBody.payload || {}, null, 2) }
      ]
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `OpenAI request failed (${response.status})`);
  return parseJson(data.choices?.[0]?.message?.content || "");
}

function localCopilotResponse(payload) {
  const concept = payload.concept || {};
  const features = Array.isArray(concept.features) && concept.features.length ? concept.features : ["Base feature", "Parametric dimensions", "Manufacturing review"];
  const simulation = buildSimulation(payload);
  const material = buildMaterialAssessment(payload);
  const optimization = buildOptimization(payload, simulation);
  return {
    reply: "Mac bridge local copilot packaged the current model. Set OPENAI_API_KEY for generative AI.",
    title: concept.title || "Mac bridge CAD concept",
    family: concept.family || "assembly",
    material: concept.material || "Mixed materials",
    requirements: payload.extractedRequirements || [],
    parameters: parameters(payload).map(parameter => ({ ...parameter, source: parameter.source || "Bridge" })),
    features,
    solidworksIntent: payload.solidworksIntent || {
      documentType: "part",
      rebuildMode: "parametric",
      operations: features.map((feature, index) => ({ order: index + 1, name: feature, action: "create_or_update" }))
    },
    analysis: {
      simulation,
      optimization,
      material
    },
    agents: buildAgents(payload, { simulation, materialAssessment: material })
  };
}

function extractResponseText(response) {
  if (typeof response.output_text === "string") return response.output_text;
  const parts = [];
  for (const output of response.output || []) {
    for (const content of output.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
      if (content.type === "text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

function parseJson(text) {
  const cleaned = String(text || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("AI returned non-JSON content.");
  }
}

function handoffSummary(payload, kind) {
  return [
    `# SolidWorks Handoff - ${kind}`,
    "",
    `Document: ${payload.targetDocument || "solidworks-model.SLDPRT"}`,
    `Revision: R${String(payload.revision || 0).padStart(2, "0")}`,
    `Concept: ${payload.concept?.title || "Untitled"}`,
    `Family: ${payload.concept?.familyLabel || payload.concept?.family || "assembly"}`,
    `Material: ${materialName(payload)}`,
    "",
    "## Windows handoff",
    "",
    "1. Copy this run folder to the Windows SolidWorks workstation.",
    "2. Start `bridge/SolidWorksBridge` on Windows.",
    "3. Import `solidworks-design-table.csv` or send `model-payload.json` to `/api/model`.",
    "4. Rebuild, run SolidWorks Simulation, and export CAD/drawings/renderings.",
    "",
    "## Parameters",
    "",
    ...parameters(payload).map(parameter => `- ${parameter.label || parameter.key}: ${parameter.value} ${parameter.unit || ""} (${parameter.swDimension || "unmapped"})`)
  ].join("\n");
}

function renderViewer() {
  const payload = lastRun.payload || {};
  const params = parameters(payload).slice(0, 8);
  const artifactBase = lastRun.folder ? `/runs/${path.basename(lastRun.folder)}` : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MacDevBridge Viewer</title>
  <style>
    body { margin: 0; font-family: Avenir Next, Trebuchet MS, sans-serif; color: #172225; background: #edf3f2; }
    main { display: grid; min-height: 100vh; grid-template-rows: auto 1fr; }
    header { padding: 14px 16px; color: white; background: #24383d; }
    h1 { margin: 0; font-size: 18px; }
    p { margin: 6px 0 0; color: #dfe9e6; }
    section { display: grid; grid-template-columns: 1fr 260px; gap: 14px; padding: 16px; }
    .stage, .card { border: 1px solid #b9c7c9; border-radius: 8px; background: white; }
    .stage { display: grid; place-items: center; min-height: 360px; }
    .card { padding: 12px; }
    svg { width: min(90%, 520px); filter: drop-shadow(0 16px 28px rgba(36, 56, 61, .18)); }
    code, a { color: #2c6b4f; }
    li { margin: 7px 0; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(lastRun.activeDocument)}</h1>
      <p>${escapeHtml(lastRun.message)}</p>
    </header>
    <section>
      <div class="stage">${previewSvg(payload)}</div>
      <aside class="card">
        <strong>Current specs</strong>
        <ul>${params.map(parameter => `<li>${escapeHtml(parameter.label || parameter.key)}: <code>${escapeHtml(parameter.value)} ${escapeHtml(parameter.unit || "")}</code></li>`).join("") || "<li>No payload sent yet.</li>"}</ul>
        <strong>Artifacts</strong>
        <ul>
          ${artifactBase ? `<li><a href="${artifactBase}/model-payload.json">model-payload.json</a></li>` : ""}
          ${artifactBase ? `<li><a href="${artifactBase}/solidworks-design-table.csv">design table CSV</a></li>` : ""}
          ${artifactBase ? `<li><a href="${artifactBase}/solidworks-operations.json">operations JSON</a></li>` : ""}
          ${artifactBase ? `<li><a href="${artifactBase}/handoff-summary.md">handoff summary</a></li>` : ""}
        </ul>
      </aside>
    </section>
  </main>
</body>
</html>`;
}

function previewSvg(payload) {
  const length = parameterValue(payload, ["length", "baseLength"], 170);
  const width = parameterValue(payload, ["width", "baseWidth", "bodyDiameter"], 95);
  const height = parameterValue(payload, ["height", "legHeight", "depth"], 42);
  const bodyWidth = clamp(length * 0.92, 170, 280);
  const bodyHeight = clamp(height * 2.4, 78, 150);
  return `<svg viewBox="0 0 420 280" role="img" aria-label="Mac bridge model preview">
    <defs><linearGradient id="fill" x1="0%" x2="100%"><stop offset="0%" stop-color="#93b6b1"/><stop offset="100%" stop-color="#3f6965"/></linearGradient></defs>
    <ellipse cx="210" cy="238" rx="134" ry="20" fill="rgba(23,34,37,.12)"/>
    <path d="M ${210 - bodyWidth / 2} ${145 - bodyHeight / 2} L ${210 + bodyWidth / 2} ${145 - bodyHeight / 2} L ${210 + bodyWidth / 2 + 34} ${145 - bodyHeight / 2 + 38} L ${210 + bodyWidth / 2 - 4} ${145 + bodyHeight / 2} L ${210 - bodyWidth / 2 - 34} ${145 + bodyHeight / 2 - 38} Z" fill="url(#fill)" stroke="#24383d" stroke-width="4"/>
    <text x="210" y="260" text-anchor="middle" fill="#405458" font-size="13">${round(length, 0)} x ${round(width, 0)} x ${round(height, 0)} mm</text>
  </svg>`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

function round(value, digits = 1) {
  const multiplier = 10 ** digits;
  return Math.round(Number(value) * multiplier) / multiplier;
}
