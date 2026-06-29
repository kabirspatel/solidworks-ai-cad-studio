# SolidWorksBridge

Windows-side bridge for the GitHub Pages dashboard.

## Requirements

- Windows
- SolidWorks installed and licensed
- .NET 8 SDK

## Run

```powershell
cd bridge\SolidWorksBridge
dotnet run --urls "https://localhost:8787"
```

The dashboard expects:

- `GET /health`
- `POST /api/model`
- `POST /api/simulate`
- `POST /api/optimize`
- `POST /api/material-assessment`
- `POST /api/agents/run`
- `GET /viewer`

This scaffold writes each received payload under `runs/`, generates a SolidWorks design-table CSV, and attempts to connect to `SldWorks.Application` through late-bound COM. Replace the scaffold analysis logic with formal SolidWorks feature creation, SolidWorks Simulation studies, and project-specific material/LCA databases as those become available.
