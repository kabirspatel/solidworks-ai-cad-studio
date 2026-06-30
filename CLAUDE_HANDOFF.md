# Claude Handoff: SolidWorks AI CAD Studio

## Project Snapshot

Repo: `https://github.com/kabirspatel/solidworks-ai-cad-studio`

Live dashboard: `https://kabirspatel.github.io/solidworks-ai-cad-studio/`

Local path on Kabir's Mac:

```sh
/Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio
```
Latest known commit at handoff:

```text
dc6d17c Make cloud workflow online first
```

The app began as a dashboard concept for AI-assisted SolidWorks CAD generation. It is now a static GitHub Pages dashboard with several integration scaffolds:

- Online-first cloud workflow for 3DEXPERIENCE / SOLIDWORKS xDesign.
- Optional Mac development bridge for local testing without SolidWorks.
- Optional Windows SolidWorks bridge scaffold for desktop COM automation.
- Optional Windows native host scaffold for embedding desktop SolidWorks beside the dashboard.
- CloudBroker scaffold for future Dassault/3DEXPERIENCE OAuth and API calls.

## User Goal

The user wants a shareable web dashboard where someone can log into their SOLIDWORKS account and work inside the dashboard without installing/running a local app.

Important reality:

- Desktop SOLIDWORKS cannot be embedded/controlled directly by a normal website.
- A no-local-app workflow must use SOLIDWORKS cloud/3DEXPERIENCE apps such as xDesign, plus Dassault-approved OAuth/API access.
- Vendor pages may block third-party iframe embedding. The dashboard can attempt an iframe, but must fall back to opening the official workspace in a secure tab.

The product direction should be:

1. Make the dashboard online-first.
2. Use 3DEXPERIENCE/xDesign as the cloud CAD surface.
3. Use a backend CloudBroker for OAuth, token exchange, access control, and model package push.
4. Keep local bridges only as dev/Windows fallback paths.

## Current UX

The dashboard is intentionally four-pane:

- AI copilot
- Requirements intake
- Model
- Current model specs

The Model panel includes:

- `Online cloud mode`
- `Open / log in`
- `Show inside`
- `Connect cloud`
- `Push package`
- `Show preview`
- `Export cloud package`

Current behavior:

- `Open / log in` opens `https://my.3dexperience.3ds.com/` in a new tab by default.
- `Show inside` attempts to load the cloud workspace in the model frame.
- If 3DEXPERIENCE blocks iframe embedding, the user must use `Open / log in`.
- `Push package` sends the current model package to `CloudBroker` if configured; otherwise it exports a JSON cloud package.

## Key Files

Dashboard:

```text
index.html
styles.css
app.js
README.md
package.json
```

Cloud account integration scaffold:

```text
bridge/CloudBroker/server.mjs
bridge/CloudBroker/README.md
```

Mac local test bridge:

```text
bridge/MacDevBridge/server.mjs
bridge/MacDevBridge/README.md
```

Windows SolidWorks desktop bridge:

```text
bridge/SolidWorksBridge/Program.cs
bridge/SolidWorksBridge/SolidWorksBridge.csproj
bridge/SolidWorksBridge/README.md
```

Windows native host for desktop SolidWorks embedding:

```text
bridge/SolidWorksNativeHost/
```

## Implemented Capabilities

### Dashboard

- Static GitHub Pages app.
- AI copilot with three modes:
  - browser OpenAI key
  - AI endpoint
  - local parser
- Requirements text intake.
- Requirement file upload.
- Reference image upload.
- Browser-side image contour extraction.
- Transition matrix generation from multiple reference image profiles.
- CSV/TSV/TXT/simple XLSX parameter import.
- SolidWorks-style design table export.
- Model parameter table with SolidWorks dimension names.
- Local preview SVG.
- Cloud package export.
- Bridge payload export.
- Local fallback simulation/optimization/material/LCA/agent outputs.

### CloudBroker

Current scaffold:

- `GET /api/cloud/status`
- `GET /api/cloud/auth/start`
- `GET /api/cloud/auth/callback`
- `POST /api/cloud/push`
- Stores pushed cloud packages under `bridge/CloudBroker/runs/`.
- Supports environment variables for future OAuth:

```sh
THREEDS_AUTH_URL
THREEDS_TOKEN_URL
THREEDS_CLIENT_ID
THREEDS_CLIENT_SECRET
THREEDS_REDIRECT_URI
THREEDS_SPACE_URL
THREEDS_SCOPE
```

What it does not yet do:

- It does not call real Dassault/3DEXPERIENCE APIs.
- It does not create xDesign models.
- It does not create files in a user's 3DEXPERIENCE tenant.
- It only stores packages and provides OAuth scaffolding.

### MacDevBridge

Purpose:

- Lets Kabir test the dashboard on a Mac without SolidWorks.
- Serves the dashboard at `http://127.0.0.1:8787/`.
- Implements the same bridge endpoints as the Windows bridge.
- Writes design tables, payloads, operations, and summaries to `bridge/MacDevBridge/runs/`.

Run:

```sh
node bridge/MacDevBridge/server.mjs
```

If `npm` is unavailable on Kabir's Mac, use bundled node:

```sh
/Users/kabirpatel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node bridge/MacDevBridge/server.mjs
```

### Windows SolidWorksBridge

Purpose:

- Future real desktop SolidWorks automation through Windows COM.
- Current implementation is a scaffold with deterministic local outputs.
- It attempts late-bound COM access to `SldWorks.Application`.

Run on Windows:

```powershell
cd bridge\SolidWorksBridge
dotnet run --urls "https://localhost:8787"
```

### Windows SolidWorksNativeHost

Purpose:

- Native WPF app that reparents an Edge dashboard window and SolidWorks desktop window into one shell.
- Only useful on Windows with installed/licensed SolidWorks.

Run on Windows:

```powershell
cd bridge\SolidWorksNativeHost
dotnet run
```

## Current Constraints / Truths To Preserve

Do not claim:

- that the static GitHub Pages dashboard can directly control a user's desktop SolidWorks.
- that 3DEXPERIENCE/xDesign can definitely be embedded in an iframe.
- that OAuth/account integration is finished.
- that CAD generation into xDesign is live.

Do claim:

- the dashboard can prepare CAD payloads, design tables, operations, and cloud packages.
- the cloud-account path requires Dassault/3DEXPERIENCE OAuth/API credentials.
- the online workflow depends on the user's cloud SOLIDWORKS entitlement, likely xDesign or related 3DEXPERIENCE apps.
- the CloudBroker is the right architectural location for account integration.

## Recommended Next Build Steps

### 1. Make CloudBroker production-shaped

Add:

- persistent session storage instead of in-memory `Map`
- cookie/session management
- secure OAuth state + PKCE
- refresh token handling
- per-user package history
- hosted deployment target, likely Render/Fly.io/Railway/Vercel serverless if compatible

Keep secrets server-side only.

### 2. Confirm Dassault/3DEXPERIENCE API path

The next human task is not coding. It is platform access:

- Register a Dassault/3DEXPERIENCE developer/OAuth application.
- Determine the correct auth/token URLs for the user's tenant.
- Determine whether APIs can create/upload CAD files, xDesign-compatible geometry, or 3DXML/STEP-derived assets.
- Confirm whether there is any supported embeddable viewer/editor URL.
- Confirm what scopes are required.

Without this, only package export and workspace launch are possible.

### 3. Improve cloud package format

Current package includes:

- dashboard payload
- design-table CSV
- SolidWorks-ish operations
- image contour profiles
- transition matrix

Next:

- Add `manifest.json` with schema/version.
- Add `parameters.csv`.
- Add `requirements.md`.
- Add `geometry-profiles.json`.
- Add a neutral CAD exchange plan, probably STEP/3DXML once a real geometry engine exists.

### 4. Add a real geometry service

The dashboard currently infers parameters and creates operation plans; it does not generate actual CAD solids.

Possible paths:

- Use a server-side CAD kernel or scriptable modeler to generate STEP.
- Use OpenCascade/CadQuery on a backend.
- Use xDesign/3DEXPERIENCE APIs if available.
- Use SolidWorks desktop automation only on Windows.

Recommended near-term:

- Add a Python CadQuery service for simple enclosures/brackets/trays.
- Return STEP/STL previews and attach them to cloud packages.

### 5. Add real AI backend

Current browser can call OpenAI directly if key is entered, but production should use a backend.

Implement in CloudBroker or a separate `AiBroker`:

- `/api/copilot`
- server-side `OPENAI_API_KEY`
- JSON schema validation
- revision history
- model operation validation before push

### 6. Replace local estimates with real analysis

Current FEA/material/LCA are deterministic estimates.

Future:

- FEA: SolidWorks Simulation API on Windows, or cloud simulation API if available.
- Material: real material database.
- LCA: real data source or curated project-specific factors.

## Commands

Check JavaScript syntax with bundled Node:

```sh
/Users/kabirpatel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check app.js
/Users/kabirpatel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check bridge/MacDevBridge/server.mjs
/Users/kabirpatel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check bridge/CloudBroker/server.mjs
```

Run Mac bridge:

```sh
/Users/kabirpatel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node bridge/MacDevBridge/server.mjs
```

Run CloudBroker scaffold:

```sh
/Users/kabirpatel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node bridge/CloudBroker/server.mjs
```

Deploy:

```sh
git add .
git commit -m "..."
git push origin main
```

GitHub Pages deploys from `main`.

## Known User Pain Point

Kabir tried:

```sh
npm run mac:dev
```

and got:

```text
zsh: command not found: npm
```

This means Node/npm is not installed on the Mac PATH. Do not treat this as an app failure.

Options:

- Tell Kabir to install Node.js from `https://nodejs.org/`.
- Use the bundled Codex Node path shown above.
- Avoid local bridge entirely and use the hosted dashboard + cloud workflow.

## Best Continuation Prompt For Claude

```text
You are continuing SolidWorks AI CAD Studio.

Goal: make the app online-first so a user can sign into their SOLIDWORKS/3DEXPERIENCE account and use cloud CAD/xDesign from the dashboard without local SolidWorks.

Do not claim browser-only GitHub Pages can directly control desktop SolidWorks. Use CloudBroker for OAuth/API integration and preserve honest iframe fallback behavior because 3DEXPERIENCE may block embedding.

Start by reading:
- README.md
- app.js
- bridge/CloudBroker/server.mjs
- bridge/CloudBroker/README.md
- bridge/MacDevBridge/server.mjs

Current latest commit: dc6d17c Make cloud workflow online first.

Next tasks:
1. Productionize CloudBroker OAuth flow with PKCE/session persistence.
2. Add a real package manifest format for cloud CAD handoff.
3. Add a server-side AI endpoint so browser keys are not needed.
4. Add a CadQuery/OpenCascade geometry service to generate STEP/STL from dashboard parameters.
5. Integrate with real Dassault/3DEXPERIENCE APIs once credentials/scopes are available.
```
