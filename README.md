# SolidWorks AI CAD Studio

A focused dashboard for four jobs:

- AI copilot
- requirements intake
- SolidWorks model window
- current model specs

The GitHub Pages app is static, so it cannot contain private server secrets or directly host a native SolidWorks desktop process. It now exposes connector points for AI, image-to-geometry, spreadsheet/design-table handoff, SolidWorks automation, FEA feedback, material/LCA checks, and multi-agent review.

## Online-first workflow

Use the hosted dashboard when you do not want a local app:

[https://kabirspatel.github.io/solidworks-ai-cad-studio/](https://kabirspatel.github.io/solidworks-ai-cad-studio/)

In the `Model` panel, use `Online cloud mode`:

- `Open / log in`: opens the user's 3DEXPERIENCE workspace so they can sign in with their SOLIDWORKS account.
- `Show inside`: attempts to display the workspace inside the dashboard.
- `Push package`: sends the current CAD package to a configured cloud broker.
- `Export cloud package`: downloads a handoff package if no broker is configured.

Important: some 3DEXPERIENCE/SOLIDWORKS pages may block iframe embedding for security. In that case the dashboard can still open the cloud workspace in a secure tab and push/export model packages, but the vendor page cannot be forced into an iframe by our app.

## Open locally

```sh
cd /Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio
python3 -m http.server 8080 --bind 127.0.0.1
```

Then open [http://localhost:8080](http://localhost:8080).

## Mac development mode

Mac development mode is optional. Use it only if you want to run the local test bridge instead of the online workflow:

```sh
cd /Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio
npm run mac:dev
```

Or, without npm:

```sh
node bridge/MacDevBridge/server.mjs
```

If your terminal says `zsh: command not found: npm`, install Node.js or use the absolute Node runtime bundled with this Codex environment:

```sh
/Users/kabirpatel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node bridge/MacDevBridge/server.mjs
```

Then open [http://127.0.0.1:8787/](http://127.0.0.1:8787/).

The Mac bridge serves the dashboard and implements the same backend contract as the Windows bridge:

- `GET /health`
- `POST /api/model`
- `POST /api/simulate`
- `POST /api/optimize`
- `POST /api/material-assessment`
- `POST /api/agents/run`
- `POST /api/copilot`
- `GET /viewer`

Each run writes payloads, design-table CSVs, operation plans, and handoff summaries under `bridge/MacDevBridge/runs/`.

Optional AI proxy:

```sh
export OPENAI_API_KEY="sk-..."
npm run mac:dev
```

Without `OPENAI_API_KEY`, the bridge uses deterministic local responses so the workflow still runs offline.

## Online cloud mode

For a no-local-SolidWorks workflow, use SOLIDWORKS/3DEXPERIENCE cloud services or browser CAD such as xDesign. The dashboard now includes an `Online cloud mode` section in the Model panel:

- `Open / log in`: opens the user's 3DEXPERIENCE workspace in a new tab.
- `Cloud broker URL`: points to a backend that performs OAuth and platform API calls.
- `Push package`: sends the current model package to the broker, or exports a package if no broker is configured.
- `Export cloud package`: downloads the current requirements, parameters, design-table CSV, operations, and image-geometry data for a cloud integration.

Cloud broker scaffold:

```sh
node bridge/CloudBroker/server.mjs
```

Or with npm:

```sh
npm run cloud:broker
```

The broker exposes:

- `GET /api/cloud/status`
- `GET /api/cloud/auth/start`
- `GET /api/cloud/auth/callback`
- `POST /api/cloud/push`

To make this truly account-connected, register a Dassault/3DEXPERIENCE OAuth application and configure:

```sh
export THREEDS_AUTH_URL="https://..."
export THREEDS_TOKEN_URL="https://..."
export THREEDS_CLIENT_ID="..."
export THREEDS_CLIENT_SECRET="..."
export THREEDS_REDIRECT_URI="https://your-broker.example.com/api/cloud/auth/callback"
export THREEDS_SPACE_URL="https://my.3dexperience.3ds.com/"
```

Important limitation: desktop SOLIDWORKS itself is not a browser app. A pure online/no-local workflow needs the user's licensed 3DEXPERIENCE/SOLIDWORKS cloud apps, such as xDesign, plus approved platform APIs. The dashboard can open the workspace and prepare/push model packages, but real in-browser CAD editing depends on the user's cloud entitlement and Dassault API access.

## AI integration

The copilot supports three modes:

- `OpenAI key`: calls the OpenAI Responses API from the browser with a key entered for the current tab session.
- `AI endpoint`: posts the current model payload to your own backend endpoint.
- `Local parser`: deterministic fallback for offline demos.

For production, prefer the `AI endpoint` mode so API keys stay server-side.

The AI payload includes:

- requirements text and extracted requirements
- current parameters and SolidWorks dimension names
- image contour profiles and transition matrices
- SolidWorks design-table rows
- simulation, optimization, material/LCA, and agent-state context

Expected AI endpoint request:

```json
{
  "instructions": "JSON-only CAD copilot instructions",
  "model": "gpt-5-mini",
  "payload": {
    "revision": 1,
    "prompt": "Design prompt",
    "requirementsText": "Raw requirements",
    "concept": {},
    "parameters": [],
    "solidworksIntent": {}
  }
}
```

Expected AI response:

```json
{
  "reply": "Short summary",
  "title": "Model title",
  "family": "enclosure",
  "material": "PC-ABS",
  "requirements": ["Overall length 170 mm"],
  "parameters": [
    { "key": "length", "label": "Length", "unit": "mm", "value": 170, "source": "AI" }
  ],
  "features": ["Base shell"],
  "solidworksIntent": {
    "documentType": "part",
    "rebuildMode": "parametric",
    "operations": [
      { "order": 1, "name": "Base shell", "action": "create_or_update" }
    ]
  }
}
```

## SolidWorks bridge

A public browser page cannot embed the native SolidWorks desktop window by itself. The dashboard expects a Windows-side bridge that owns SolidWorks and returns a browser-embeddable viewer URL.

Bridge scaffold:

```sh
bridge/SolidWorksBridge
```

Mac bridge scaffold:

```sh
bridge/MacDevBridge
```

Cloud broker scaffold:

```sh
bridge/CloudBroker
```

Native embedded-window host scaffold:

```sh
bridge/SolidWorksNativeHost
```

`SolidWorksNativeHost` is the Windows path for a literal embedded SolidWorks working window. It opens the dashboard in an Edge app window, reparents that dashboard window and the native SolidWorks desktop window into a WPF host surface, and can run alongside `SolidWorksBridge` when you need both embedded windows and automation endpoints.

Required bridge endpoints:

```http
GET /health
```

Expected response:

```json
{
  "solidworksRunning": true,
  "activeDocument": "portable-diagnostic-enclosure.SLDPRT",
  "embedUrl": "https://localhost:8787/viewer",
  "message": "SolidWorks bridge connected"
}
```

```http
POST /api/model
```

Request body is the dashboard model payload. Expected response:

```json
{
  "activeDocument": "portable-diagnostic-enclosure.SLDPRT",
  "embedUrl": "https://localhost:8787/viewer",
  "message": "Model rebuilt in SolidWorks"
}
```

The bridge should enable CORS for the GitHub Pages origin and serve `/viewer` as the live SolidWorks viewport, usually through the included Windows native host, a remote stream, or another local viewer service.

Additional workflow endpoints:

```http
POST /api/simulate
POST /api/optimize
POST /api/material-assessment
POST /api/agents/run
```

The included bridge scaffold writes each received payload under `runs/`, generates a SolidWorks design-table CSV, and attempts to connect to `SldWorks.Application` through late-bound COM on Windows.

## Image-to-geometry

Reference image upload runs in the browser. The dashboard samples each image, extracts normalized left/right contour profiles, and builds a transition matrix when two or more images are available.

Those profiles are included in `imageGeometry` in every AI and SolidWorks bridge payload.

## Excel and design tables

The dashboard imports CSV/TSV/TXT files and simple `.xlsx` workbooks locally. It maps rows to parameters by headers such as `parameter`, `key`, `name`, `spec`, `label`, `dimension`, `SW dimension`, `SolidWorks dimension`, or `swDimension`, then applies `value` / `dimension value` into the active specs.

Advanced Excel workbooks can still be parsed bridge-side if needed. The dashboard can always export a SolidWorks design-table CSV from the active specs.

## Feedback loop

The dashboard now has compact actions for:

- `Run FEA`: calls `/api/simulate`, with a local estimate fallback
- `Optimize`: calls `/api/optimize`, with local recommendations fallback
- `Material/LCA`: calls `/api/material-assessment`, with local feasibility/LCA fallback
- `Run agents`: calls `/api/agents/run`, with local agent-lane fallback

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

The workflow publishes `index.html`, `styles.css`, `app.js`, and `.nojekyll` automatically on each push to `main`.
