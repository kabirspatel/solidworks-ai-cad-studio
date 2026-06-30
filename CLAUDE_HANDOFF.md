# SolidWorks AI CAD Studio — Handoff

**Repo:** `https://github.com/kabirspatel/solidworks-ai-cad-studio`  
**Live URL:** `https://kabirspatel.github.io/solidworks-ai-cad-studio/`  
**Local path:** `/Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio`

---

## What this app is

A static GitHub Pages dashboard for AI-assisted parametric CAD design. The user describes a part (or picks a seed variant for bottles), adjusts sliders, AI generates parameters, and the result is either pushed to local SolidWorks via a VBA macro, previewed in an embedded 3D viewer, or exported as a CSV design table.

**Platform:** pure static HTML/CSS/JS — no build step, no Node at runtime. Deploy = `git push`.

---

## File map

```
index.html          — single-page shell (4 panel sections)
styles.css          — all styles
app.js              — everything: state, renders, AI calls, SolidWorks bridge, 3D viewer

bridge/
  MacDevBridge/
    server.mjs      — Node.js local bridge (run on Mac to test without SolidWorks)
    README.md
  CloudBroker/
    server.mjs      — OAuth/push scaffold (not wired to real Dassault APIs yet)
    README.md

cad-server/
  main.py           — FastAPI + numpy geometry server (generates real STL from params)
  requirements.txt  — fastapi, uvicorn, numpy

render.yaml         — Render.com free-tier deploy config for cad-server
```

---

## What WORKS today

### AI Copilot
All three provider modes are wired and correct:

| Mode | Endpoint | Key storage | Status |
|------|----------|-------------|--------|
| **Gemini** | `generativelanguage.googleapis.com/v1beta/.../gemini-2.0-flash` | `sessionStorage` | ✅ Working |
| **Claude** | `api.anthropic.com/v1/messages` — model `claude-sonnet-4-6`, header `anthropic-dangerous-direct-browser-access: true` | `sessionStorage` | ✅ Working |
| **OpenAI** | `api.openai.com/v1/chat/completions` — default model `gpt-4o-mini` | `sessionStorage` | ✅ Fixed (was using wrong /v1/responses endpoint) |

> **Keys are session-only** — stored in `sessionStorage`, never `localStorage`, never sent to any server. They clear when the browser tab closes.

How AI is used: user types a design intent prompt → copilot calls the selected AI → AI returns JSON → parameters populate the specs table.

### Bottle parametric design (the main workflow)
- 25 seed variants B01–B25, each with a concept + morph family assignment
- 5 morph families for interpolation (e.g. "01→03: Minimal cylinder → Sculpted icon")
- 15 parameter sliders (height, body diameter, depth, shoulder height, wall, rib count/depth, ring count/depth, facet count/depth, helix ridges/depth/turns, superellipse n)
- Morph position slider linearly interpolates all numeric params between seed designs
- All slider changes update the 3D viewer in real time (no full re-render)
- State persists to `localStorage` under key `solidworks-ai-cad-studio-v4`

### 3D viewer (Three.js r128)
- OrbitControls — drag to rotate, scroll to zoom
- Renders parametric geometry from the current parameters
- Bottle: `LatheGeometry` with body radius, neck radius, shoulder height, neck height + oval squeeze when bodyDepth ≠ bodyDiameter
- Bracket: `ExtrudeGeometry` L-shape
- Tray/Enclosure/Assembly: `BoxGeometry`
- If a geometry server URL is configured: fetches real STL via POST to `/api/generate`, falls back to parametric if server is unavailable

### Push to SolidWorks (VBA macro)
- "Push to SolidWorks" downloads a `.swb` macro file
- In SolidWorks: **Tools → Macros → Run** → select the file
- Macro uses `EquationMgr.Add2` to set global variables matching the parameter keys
- SolidWorks dimension names use `swDimension` field (e.g. `D1@HEIGHT`)

### Local SolidWorks bridge (MacDevBridge)
- Run `node bridge/MacDevBridge/server.mjs` on your Mac
- Default URL: `http://127.0.0.1:8787`
- Type that URL in the "Local bridge" field and click "Connect bridge"
- Implements `/api/simulate`, `/api/optimize`, `/api/material-assessment`, `/api/agents/run` — all return deterministic local estimates
- Writes payloads to `bridge/MacDevBridge/runs/`

### Standards & compliance
- ~50 curated standards across bottle, enclosure, bracket, tray families
- "Auto-match" infers applicable standards from prompt text + material
- Checkboxes let user select active standards
- Selected standards generate constraints (character limits, test requirements) that feed into the AI system prompt

### Design table
- "Export CSV" downloads a SolidWorks-compatible design table
- All parameters with `swDimension` names, one configuration row per variant

---

## What is STUB / not real yet

| Feature | Reality |
|---------|---------|
| FEA (Run simulation) | Local formula estimates only — bridge endpoints not connected to real SolidWorks Simulation |
| Optimize | Local rule-based suggestions — no real optimization engine |
| Material/LCA | Local lookup table — no real material database or LCA API |
| Run agents | Local status strings — no real agent execution |
| CloudBroker | OAuth scaffolding only — not connected to Dassault APIs |
| Cloud CAD embed | Only shows iframe if user pastes a URL manually; no auth |
| Image geometry extraction | Browser-side contour approximation from image files — not real photogrammetry |

> The analysis buttons (FEA, Optimize, Material, Agents) were removed from the UI in the current version. Their results only appear in the Specs panel via the status strip if the MacDevBridge returns them.

---

## Geometry server (cad-server)

A FastAPI/numpy server that generates actual STL binary for the 5 product families.

**Run locally:**
```sh
cd cad-server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Deploy to Render.com (free tier):**
- `render.yaml` is already configured
- Go to render.com → New Web Service → connect the repo
- After deploy, paste the `https://xxx.onrender.com` URL into the "Geometry server" field in the dashboard
- Free tier spins down after 15 min inactivity — first request takes ~30s

**API:**
```
POST /api/generate
  Body: { "family": "bottle|enclosure|bracket|tray|assembly", "parameters": [...] }
  Returns: binary STL (Content-Type: application/octet-stream)

GET /health
  Returns: { "status": "ok" }
```

---

## How to run locally

```sh
cd /Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio
python3 -m http.server 5174 --bind 127.0.0.1
# Open http://127.0.0.1:5174
```

No build step. Edit `app.js` or `styles.css`, reload the browser.

Bump `?v=N` in `index.html` after significant JS changes to force cache-bust on GitHub Pages.

---

## How to deploy

```sh
cd /Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio
git add app.js index.html styles.css CLAUDE_HANDOFF.md
git commit -m "describe change"
git push origin main
```

GitHub Pages deploys from `main` automatically. Takes ~60 seconds.

---

## AI keys

Keys are entered in the AI Copilot panel and stored in `sessionStorage` only:

| Provider | Key format | Where to get |
|----------|-----------|--------------|
| Gemini | `AIza…` | https://aistudio.google.com/app/apikey (free) |
| Claude | `sk-ant-…` | https://console.anthropic.com |
| OpenAI | `sk-…` | https://platform.openai.com/api-keys |

Default models: `gemini-2.0-flash`, `claude-sonnet-4-6`, `gpt-4o-mini`

---

## State storage

- `localStorage` key: `solidworks-ai-cad-studio-v4`
- Contains: all parameters, requirements, AI settings, bridge URLs, geometry server URL, revision number, morph state, standards selections
- API keys: `sessionStorage` only (3 separate keys)
- Reset: click "Reset" in requirements panel, or clear `localStorage` in DevTools

---

## SolidWorks connectivity — honest summary

| Path | Requires | Status |
|------|----------|--------|
| **VBA macro (.swb)** | SolidWorks installed (any platform) | ✅ Working — download and run via Tools → Macros |
| **MacDevBridge** | Node.js on Mac | ✅ Working — local bridge, returns mock analysis |
| **Windows SolidWorksBridge** | Windows + .NET + SolidWorks | Scaffold only — COM calls not tested |
| **Direct browser embed** | Nothing | ✗ Impossible — browser cannot control desktop SolidWorks |
| **3DEXPERIENCE/xDesign** | Dassault OAuth credentials | Scaffold only — no real API integration |

The VBA macro path is the only currently functional SolidWorks integration. It is also the most practical for Georgia Tech student license users who have SolidWorks on Windows but work on Mac.

---

## Known issues / next steps

### High priority
1. **MCP server** (`bridge/McpServer/server.mjs`) — exists but never wired to the dashboard. This would allow Claude to call tools that push to SolidWorks directly during a Claude Code session. To activate: run the MCP server, configure it in Claude Code settings, then use it as a tool during prompting.

2. **3D viewer doesn't show ribs/facets** — the `LatheGeometry` is a solid of revolution and can't represent surface features. The viewer shows overall proportions but not rib count, facet panels, or helix ridges. Fix options:
   - Deploy the cad-server and configure it — it generates STL with actual geometry for the server-side path
   - Or add a note/badge in the viewer overlay ("Surface features visible in SolidWorks only")

3. **Bottle morph family interpolation uses seed data but ignores non-variant sliders** — if you manually edit a slider after loading a variant, then drag the morph slider, manual edits are overwritten. This is a UX issue.

4. **Key persistence across renders** — if anything triggers a full `render()` while the user has typed a key but not yet clicked "Generate", the key field clears (it re-renders empty). User must type the key and immediately click Generate without doing anything else that triggers a re-render.

### Medium priority
5. **`cad-server/main.py` STL quality** — the bottle STL is a lathe revolution without surface features. Needs numpy or shapely-based rib/facet geometry.

6. **Standards constraints not fed to VBA macro** — selected standards' constraints (character limits, test notes) appear in the specs panel but are not included in the `.swb` macro output.

7. **Export JSON payload** includes analysis fields that are just local estimates — these could mislead a downstream consumer. Consider stripping `analysis` from the exported JSON or tagging fields as `"source": "local-estimate"`.

### Nice to have
8. **BOTTLE_LOCKS** constants in `app.js` (lines ~335) still reference specific material terms. These only appear in the bottle slider panel's "Locked norms" section — acceptable for now but should become configurable.

9. **Image geometry extraction** (`handleImageUpload`) — browser-side canvas pixel analysis. Works as a rough contour capture but is not a real photogrammetry pipeline.

---

## App architecture in one paragraph

`app.js` is a ~3000-line single-file app. State lives in a global `state` object (serialized to `localStorage`). `render()` re-draws all 4 panels by setting innerHTML. The 3D viewer (`mount3DViewer`) is mounted after each render via `requestAnimationFrame` and reuses the Three.js scene across renders via a module-level `_three` variable. Bottle sliders use live `input` events that update `state.parameters` and call `saveOnly()` (direct `localStorage.setItem`) without triggering a full re-render, keeping the viewport responsive during slider drag. AI calls flow through `askCopilot()` → `callOpenAI/callClaude/callGemini()` → `updateFromBlueprint()` → `persist()` → `render()`.

---

## Best continuation prompt

```
You are continuing work on SolidWorks AI CAD Studio.
Local path: /Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio
GitHub Pages: https://kabirspatel.github.io/solidworks-ai-cad-studio/

Read CLAUDE_HANDOFF.md first for full current state.

The app is a static HTML/CSS/JS dashboard — no build step.
Run locally: python3 -m http.server 5174 (from the repo root)
Deploy: git add app.js index.html styles.css && git commit && git push origin main

Key files:
- app.js: all logic (~3000 lines), one global `state` object
- styles.css: all styles
- cad-server/main.py: FastAPI geometry server (deploy to Render.com for real STL)
- bridge/MacDevBridge/server.mjs: local Node bridge for SolidWorks simulation

What works: AI copilot (Gemini/Claude/OpenAI all wired), bottle parametric sliders,
Three.js 3D preview, VBA macro push to SolidWorks, standards matching, CSV export.

What doesn't: FEA/optimization/LCA are local estimates only. No real Dassault API.
The VBA macro is the only real SolidWorks path.

Current JS version tag in index.html: v=10
Bump this after each significant change to force cache bust on GitHub Pages.
```
