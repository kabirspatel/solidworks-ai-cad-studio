# SolidWorks AI CAD Studio — Full Handoff

**Repo:** https://github.com/kabirspatel/solidworks-ai-cad-studio  
**Live URL:** https://kabirspatel.github.io/solidworks-ai-cad-studio/  
**Local path:** `/Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio`  
**Latest pushed version:** v=19 (use `git log -1 --oneline` for the current hash)

---

## What this app is

A static GitHub Pages dashboard for AI-assisted parametric CAD design. The user describes a part (or picks from 25 seed bottle variants), adjusts sliders, AI generates parameters, and the result routes through a CAD-neutral package to SolidWorks, Onshape, Autodesk/Fusion, AutoCAD, or the open geometry preview/export path.

**Stack:** Pure static HTML/CSS/JS — no build step, no Node at runtime.  
**Deploy:** `git add . && git commit && git push origin main` → GitHub Pages auto-builds.

---

## File map

```
index.html               — single-page shell, 5 focused sections
styles.css               — all styles
app.js                   — everything (~3000 lines): state, renders, AI, 3D viewer, SolidWorks bridge

cad-server/
  main.py                — FastAPI + numpy geometry server (generates real STL)
  requirements.txt       — fastapi, uvicorn, numpy

bridge/
  MacDevBridge/
    server.mjs           — Node.js local bridge (simulates SolidWorks responses on Mac)
  McpServer/
    server.mjs           — MCP server scaffold (NOT yet wired to dashboard)
  CloudBroker/
    server.mjs           — OAuth/push scaffold (NOT connected to real Dassault APIs)
  SolidWorksBridge/      — Windows COM scaffold (not tested)
  SolidWorksNativeHost/  — Windows WPF embed scaffold (not tested)

render.yaml              — Render.com deploy config for cad-server
CLAUDE_HANDOFF.md        — this file
```

---

## How to run locally

```sh
cd /Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio
python3 -m http.server 5174 --bind 127.0.0.1
# open http://127.0.0.1:5174
```

After any JS/CSS change: bump `?v=N` in `index.html` (currently v=19) to force GitHub Pages cache bust.

---

## Architecture: how app.js works

- Global `state` object — serialized to `localStorage` key `solidworks-ai-cad-studio-v4`
- `render()` redraws all 5 panels by setting innerHTML
- `persist(label)` = `saveOnly()` + `render()` + toast
- `saveOnly()` = direct `localStorage.setItem` without render (used by live sliders)
- `syncDraftFromDom()` — reads all form fields into state before any action
- Three.js scene lives in module-level `_three` variable, reused across renders via `mount3DViewer()`
- API keys in `sessionStorage` only (never persisted, clears on tab close)

---

## What WORKS (confirmed)

### AI Copilot
| Provider | Endpoint | Key storage | Notes |
|----------|----------|-------------|-------|
| **Server proxy** | `/api/ai/generate` or `/api/copilot` | backend env vars | New preferred production route; supports OpenAI, Gemini, Claude, or local fallback |
| **Gemini** | `generativelanguage.googleapis.com/v1beta/interactions`, default model `gemini-3.5-flash`, fallback to `generateContent` | `sessionStorage` SESSION_GEMINI_KEY | Browser key route now has real diagnostic via Check AI route |
| **Claude** | `api.anthropic.com/v1/messages`, model `claude-sonnet-4-6`, header `anthropic-dangerous-direct-browser-access: true` | `sessionStorage` SESSION_CLAUDE_KEY | Working |
| **OpenAI** | `api.openai.com/v1/chat/completions`, default model `gpt-4o-mini` | `sessionStorage` SESSION_AI_KEY | Working (was broken, fixed this session) |
| **Local parser** | No network call | — | Always available, returns deterministic output |

AI flow: prompt → `askCopilot()` → `callGemini/Claude/OpenAI()` → `parseJsonFromText()` → `applyAiPayload()` → `updateFromBlueprint()` → `persist()` → `render()`

### CAD broker foundation
- `cad-server/main.py` now exposes `/api/cad/providers`, `/api/cad/package`, and `/api/cad/push`.
- Provider registry includes `solidworks_desktop`, `solidworks_cloud`, `onshape`, `autodesk_fusion`, `autocad`, and `open_geometry`.
- Dashboard CAD panel has a target CAD platform selector plus "Push to selected CAD" and "Export CAD package" actions.
- `bridge/MacDevBridge/server.mjs` mirrors the same provider and AI routes for local testing.

### Bottle parametric design
- 25 seed variants B01–B25, each with full parameter set + morph family
- 5 morph families: `"01→03"`, `"04→06"`, `"07→08"`, `"08→09"`, `"07→09"`
- `morphBottleAtPct(famKey, pct)` — linearly interpolates all params between first/last seed in family
- 15 sliders: height, bodyDiameter, bodyDepth, shoulderHeight, superellipseN, wall, ribCount, ribDepth, ringCount, ringDepth, facetCount, facetDepth, helixRidges, helixDepth, helixTurns
- Slider changes call `setBottleParam()` + `saveOnly()` + `requestAnimationFrame(mount3DViewer)` — no full re-render, stays responsive

### 3D viewer (Three.js r128)
- OrbitControls: drag to rotate, scroll to zoom
- Bottle geometry: `LatheGeometry` profile + oval squeeze when `bodyDepth ≠ bodyDiameter`
- Bracket: `ExtrudeGeometry` L-shape
- Tray/Enclosure/Assembly: `BoxGeometry`
- If `state.cadServer.url` is set: fetches real STL from `/api/generate`, falls back to parametric on error
- Viewer applies bottle oval squeeze plus rib, ring, facet, and helix relief directly from slider parameters

### SolidWorks macro (VBA .swb)
- "Push to SolidWorks" in model panel → downloads `.swb` file
- In SolidWorks: **Tools → Macros → Run** → select the file
- Uses `EquationMgr.Add2` to set global variables
- Parameter keys map to `swDimension` field (e.g. `D1@HEIGHT`, `D12@RIB_COUNT`)
- Works with any SolidWorks license (including Georgia Tech student)

### MacDevBridge (local testing)
```sh
node bridge/MacDevBridge/server.mjs
# runs at http://127.0.0.1:8787
```
Implements: `/health`, `/api/simulate`, `/api/optimize`, `/api/material-assessment`, `/api/agents/run` — all return deterministic local estimates, writes to `bridge/MacDevBridge/runs/`

### Standards matching
- ~50 curated standards (bottle FDA/ISO, enclosure IP ratings, bracket load specs, etc.)
- `lookupStandards()` — keyword matches prompt + material + family against static catalog
- Selected standards feed constraints into AI system prompt and show in specs panel
- **NOT included in VBA macro export** (gap to fix)

### Design table / export
- Export CSV: SolidWorks-compatible design table, all params with `swDimension` names
- Export JSON: full model payload
- Export SW vars: `.swb` VBA macro

---

## What is STUB / NOT real

| Feature | Reality |
|---------|---------|
| FEA / "Run simulation" | Dedicated FEA panel. Uses `/api/simulate` through the bridge when available, otherwise falls back to a local screening estimate |
| Optimize | Local rule-based suggestions |
| Material/LCA | Local lookup table |
| Run agents | Local status strings |
| CloudBroker | OAuth scaffolding only — no Dassault API connection |
| MCP server | Exists at `bridge/McpServer/server.mjs` but not wired to dashboard or active Claude session |
| Cloud CAD embed | Shows iframe only if user manually pastes a URL |
| Image geometry extraction | Browser canvas pixel analysis — rough contour, not photogrammetry |

---

## Work done this session (July 2026)

### Breaking fixes
- **OpenAI API** was hitting wrong endpoint (`/v1/responses` with `store`/`instructions`/`input` fields) → fixed to `/v1/chat/completions` with `messages` array
- **Default model** was `gpt-5-mini` (doesn't exist) → `gpt-4o-mini`
- **`syncDraftFromDom` mode defaults** had `openai: "gpt-4o"` → `"gpt-4o-mini"`

### Hardcoding removed
- `loadBottleVariant()` was injecting "STREAMS" project name and long regulatory boilerplate into every bottle's prompt/requirements
- Hardcoded `material: "PLA + enzyme additive system"` in `loadBottleVariant()` → now uses `state.concept.material`
- `DEFAULT_CLOUD_SPACE_URL` was `"https://my.3dexperience.3ds.com/"` → now `""` so field starts blank

### UI rebuilt / cleaned
- **Model panel**: removed 4 fake analysis buttons (Run FEA / Optimize / Material-LCA / Run Agents), rebuilt as clean bridge config + 3D preview + collapsible cloud embed
- **AI Copilot panel**: cleaner provider labels, key-loaded badge indicator, correct default models per provider
- **Requirements panel**: removed cluttered workflow step chips (1 INPUT / 2 STANDARDS / 3 PARAMETERS / 4 CAD)
- **Variant dropdown**: hidden for non-bottle product types
- **Specs panel header**: shows design title instead of "Bottle parameters"
- **Model bar**: shows family label + param count instead of stale material/"Optional"
- **Error messages**: raw multi-line API error → truncated single line with actionable hint ("Quota exceeded — switch to OpenAI or Claude"), styled in distinct red box

### CSS fixes
- `label` elements globally inherited `text-transform: uppercase` — everything inside labels (slider values, hint text, morph family descriptions) was SHOUTING
- Fixed: `.bsl-label` gets `text-transform: none`, `.bsl-val` gets `text-transform: none; letter-spacing: 0`, `.bsl-note` same
- `.bsl-divider` was heavy all-caps → reduced to light normal-case separator
- Label hint spans in model panel now have `text-transform:none;letter-spacing:0` inline to prevent inheritance
- Morph family row: removed redundant value badge (the select already shows the family name)
- `bsl-dividers` renamed: "Editable body parameters" → "Body parameters", "Locked norms" → "Locked specs"

### 3D viewer improvement
- Bottle geometry now applies oval squeeze when `bodyDepth ≠ bodyDiameter` — previously always circular

### Default state cleanup
- `bridge.status` default: `"Optional"` → `"Not connected"`
- Bridge/cloud status messages: removed 3DEXPERIENCE-specific copy

### Follow-up fixes after handoff
- **State bleed between products fixed**: changing `templateSelect` now regenerates concept, parameters, design table rows, material assessment, SolidWorks target document, standards, and bottle morph state through `resetModelForTemplate()`.
- **Standards constraints added to VBA macro export**: `downloadSolidWorksMacro()` now includes selected standards, constraints, test notes, and label notes as a comment block in the generated `.swb`.
- **Macro text escaping hardened**: generated macro strings now escape double quotes and newlines in project/material/parameter/standard text.
- **Cache bust bumped**: `index.html` now loads `app.js?v=12`.
- **Bottle sketch features made functional**: the sample `preview (1).html` morph step-count slider, generated n-step morph strip, 5x5 seed matrix, reset-to-nearest-seed flow, feature-option list, code gates, live bottle metrics, SolidWorks surface-logic text, and n-step CSV export are now integrated into the dashboard.
- **Surface sliders now affect geometry**: ribs, rings, facets, helix ridges, and oval body depth deform the Three.js fallback mesh and the `cad-server` STL mesh instead of only changing text values.
- **Cache bust bumped again**: `index.html` now loads `app.js?v=13`.
- **CAD preview reacts more clearly to sliders**: slider changes now refresh design-table rows, material assessment, live preview telemetry, specs, and the browser mesh immediately without waiting on a configured geometry server.
- **Copilot image idea upload added**: the AI Copilot panel accepts image references, extracts contour profiles, lists image idea summaries, and passes them into AI payloads as visual/guide-curve context.
- **Design intent requirements section added**: Requirements & Standards now shows parsed requirements, inferred family/material, image idea count, and intent-matched standards based on the Copilot design intent before generation.
- **Cache bust bumped again**: `index.html` now loads `app.js?v=14`.
- **Major five-section UI cleanup**: app now centers on AI input/uploads, legal standards/requirements, parameter sliders, CAD/SolidWorks output, and FEA.
- **Uploads consolidated into AI input**: prompt, idea images, requirement files, and parameter spreadsheets are now in the AI panel; provider settings are collapsed.
- **Standards panel simplified**: requirements and matched legal/standards guidance are displayed without geometry controls or CAD actions mixed in.
- **Parameter section rebuilt**: product type, seed variants, bottle sliders, generic parameter sliders, design table export, and current model specs live together.
- **CAD section simplified**: preview is primary; SolidWorks push, macro export, design-table export, and preview refresh are the main actions; bridge/server/cloud settings are collapsed.
- **FEA panel restored**: run simulation and suggest geometry updates are visible again with safety factor, mass index, source, and recommendation readouts.
- **Cache bust bumped again**: `index.html` now loads `app.js?v=15`.
- **AI route troubleshooting added**: AI panel now shows local/browser-key/proxy/native routes, includes "Use bridge AI proxy", and checks bridge proxy health.
- **Bridge AI proxy fixed**: `bridge/MacDevBridge/server.mjs` now uses OpenAI Chat Completions with `gpt-4o-mini` instead of the old Responses payload.
- **Deployable AI proxy added**: `cad-server/main.py` now exposes `/api/copilot` and reports `aiProxy` from `/health`; set `OPENAI_API_KEY` on Render to make the public dashboard generative without browser keys.
- **CAD portal clarified**: CAD panel now displays display/import/export/automation lanes and adds bridge viewer + STL export actions.
- **Requirements library and patent/IP panel added**: Legal panel now shows current-family standards library entries and prior-art search links generated from the current idea.
- **LCA handoff added**: FEA panel now includes material/LCA screening plus links to SOLIDWORKS Simulation, SOLIDWORKS Help, and SOLIDWORKS AI overview.
- **Cache bust bumped again**: `index.html` now loads `app.js?v=16`.
- **Backend patent/IP route added**: `cad-server/main.py` exposes `/api/patents/search`, attempts PatentsView search, and falls back to search launchers when external search fails.
- **Backend LCA route added**: `cad-server/main.py` exposes `/api/lca` for material/process/LCA screening from the current payload.
- **Bridge endpoint aliases added**: `bridge/MacDevBridge/server.mjs` now exposes `/api/lca` and `/api/patents/search` for local dashboard testing.
- **Dashboard calls backend IP/LCA routes**: Patents/IP panel can run backend search; material/LCA screen tries bridge, then CAD server, then local fallback.
- **CAD server health check added**: CAD panel can check configured server health and capability state from `/health`.
- **Cache bust bumped again**: `index.html` now loads `app.js?v=17`.
- **Gemini route modernized**: Browser Gemini now defaults to `gemini-3.5-flash`, uses the Interactions API with structured JSON output, falls back to `generateContent`, and the Check AI route button makes a real diagnostic call.
- **Prompt hard constraints added**: Bottle prompts such as "wide", "smooth", "no spiral", and "without helix" now override stale seed/AI parameters by setting helix/rib/ring/facet dimensions appropriately.
- **Cache bust bumped again**: `index.html` now loads `app.js?v=18`.
- **CAD-neutral broker started**: Backend and Mac bridge expose provider registry, package, and push endpoints for SolidWorks, Onshape, Autodesk/Fusion, AutoCAD, and open geometry.
- **Server AI proxy expanded**: Backend now exposes `/api/ai/generate`, dispatches OpenAI/Gemini/Claude by env/model, and returns local fallback JSON when no provider key is configured.
- **Dashboard target CAD selector added**: CAD panel can export/push provider-specific neutral packages and switch AI to the server proxy.
- **Cache bust bumped again**: `index.html` now loads `app.js?v=19`.

---

## What still needs to be done

### HIGH PRIORITY

**1. Deploy backend server and configure provider keys**
Browser keys work for prototyping, but the production route is now server-side:
- Deploy `cad-server` and set one or more env vars: `OPENAI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, or `ANTHROPIC_API_KEY`.
- In the dashboard, paste the backend URL into Geometry server URL, click Check CAD server, then Use CAD server AI.
- Keep browser-key mode for personal prototyping only.

**2. Deploy cad-server to Render.com**
```sh
# Already configured in render.yaml:
# - name: solidworks-cad-server
# - buildCommand: pip install -r cad-server/requirements.txt  
# - startCommand: uvicorn cad-server.main:app --host 0.0.0.0 --port $PORT
# - healthCheckPath: /health
```
Go to render.com → New Web Service → connect `kabirspatel/solidworks-ai-cad-studio` → deploy.  
After deploy, copy the URL (e.g. `https://solidworks-cad-server.onrender.com`) → paste into dashboard "Geometry server" field → save → 3D viewer will fetch real STL.  
Note: free tier sleeps after 15 min, first request takes ~30s to wake.

**3. Implement real provider connectors**
- SolidWorks desktop: finish Windows bridge/COM host.
- Onshape: OAuth/API key connector for documents, Part Studios, features, and export.
- Autodesk/Fusion/AutoCAD: APS OAuth, Object Storage, Model Derivative, Viewer, and Design Automation jobs.
- Open geometry: add CadQuery/OpenCascade for STEP/BREP output.

### MEDIUM PRIORITY

**3. Morph slider overwrites manual edits**
If user manually edits a slider value, then drags the morph position slider, all manual edits are overwritten by the interpolated values. This is jarring.  
Fix: Add a "lock" toggle per slider — locked sliders are excluded from morph interpolation.

**4. MCP server not connected**
`bridge/McpServer/server.mjs` exists as a JSON-RPC 2.0 stdio server. If wired to a Claude Code session, Claude could call tools that directly push parameters to SolidWorks during prompting.  
To activate: run the MCP server, add it to `.claude/settings.json` under `mcpServers`. This would let Kabir use Claude Code itself as the AI that drives the dashboard parameters.

**5. AI parse failures need better fallback**
When AI returns prose instead of JSON, `parseJsonFromText()` throws "AI returned text instead of model JSON."  
Fix: On parse failure, try to extract the reply as a plain text message and display it in the AI output box rather than showing a red error box. Only show error box for network/auth failures.

**6. localStorage migration**
State is versioned at `solidworks-ai-cad-studio-v4`. If schema changes break old saved state (missing fields), `normalizeState()` fills defaults — but this doesn't always work cleanly.  
Fix: Add a schema version check in `normalizeState()` that fully resets state if the major structure doesn't match.

### LOW PRIORITY / NICE TO HAVE

**8. BOTTLE_LOCKS are still project-specific**
Lines ~335 in app.js. The "Locked specs" section in the bottle slider panel hardcodes things like "28 mm OD / 21 mm mouth ID" neck finish. These should either be configurable or loaded from the selected variant.

**9. Macro parameter key sanitization**
`downloadSolidWorksMacro()` does basic VBA string escaping but parameter keys from AI-generated state could contain characters that break VBA syntax. Add a `sanitizeVbaIdentifier(key)` function.

**10. No mobile layout**
The 4-panel grid is desktop-only. On mobile it stacks but overflows badly. Not a priority unless demoing on phone.

**11. Export JSON includes local-estimate analysis**
The `makeCurrentModelPayload()` includes `state.analysis` which contains local FEA/material estimates. A consumer of the exported JSON might think these are real values.  
Fix: Strip `analysis` from export or tag every field with `"source": "local-estimate"`.

**12. CloudBroker real API integration**
`bridge/CloudBroker/server.mjs` has placeholder OAuth endpoints. Requires:
- Dassault developer account
- 3DEXPERIENCE OAuth client credentials  
- Actual API to create models/upload files in a 3DEXPERIENCE tenant  
This is blocked on Kabir getting API access — can't be coded without credentials.

---

## Key constants in app.js

```javascript
// Line 4
const STORAGE_KEY = "solidworks-ai-cad-studio-v4";
const SESSION_AI_KEY = "solidworks-ai-openai-key";      // OpenAI key in sessionStorage
const SESSION_CLAUDE_KEY = "solidworks-ai-claude-key";  // Claude key in sessionStorage
const SESSION_GEMINI_KEY = "solidworks-ai-gemini-key";  // Gemini key in sessionStorage
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_BRIDGE_URL = "";               // http://127.0.0.1:8787 when bridge is running
const DEFAULT_AI_ENDPOINT = "";
const DEFAULT_CLOUD_SPACE_URL = "";

// Line 275 — 25 bottle variants with full parameter sets
const BOTTLE_VARIANTS = [ ... ]; // B01–B25

// Line ~320 — 15 slider configs
const BOTTLE_SLIDER_CONFIG = [ ... ];

// Line ~355 — 5 morph families
const BOTTLE_MORPH_FAMILIES = { ... };

// Line ~335 — locked specs shown in slider panel
const BOTTLE_LOCKS = [ ... ];
```

---

## AI system prompt structure (what gets sent to AI)

`makeAiInstruction()` returns the system prompt. It includes:
- Product family context
- SolidWorks dimension name format
- JSON schema the AI must return (title, family, material, parameters array, requirements, features, solidworksIntent)
- Selected standards and their constraints
- Current parameters (for revision context)

`makeCurrentModelPayload()` is the user message — full current state as JSON.

The AI must return a JSON object matching the schema. `parseJsonFromText()` strips markdown code fences then parses. On success, `applyAiPayload()` → `updateFromBlueprint()` updates state.

---

## SolidWorks connectivity: honest summary

| Path | Requires | Status |
|------|----------|--------|
| **VBA macro (.swb)** | SolidWorks installed, any platform | ✅ Working |
| **MacDevBridge** | Node.js on Mac | ✅ Working (returns mock data) |
| **MCP server** | Node.js + Claude Code | Exists, not wired |
| **Windows SolidWorksBridge** | Windows + .NET + SolidWorks | Scaffold only |
| **3DEXPERIENCE / xDesign** | Dassault OAuth credentials | Scaffold only |
| **Direct browser embed** | — | Impossible |

**The VBA macro is the only real SolidWorks integration path today.**

---

## Best continuation prompt for a new session

```
You are continuing work on SolidWorks AI CAD Studio.

Local path: /Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio
GitHub Pages: https://kabirspatel.github.io/solidworks-ai-cad-studio/
Latest pushed version: v=14 in index.html (use `git log -1 --oneline` for the current hash)

Read CLAUDE_HANDOFF.md first for full current state, what works, and what needs to be done.

The app is a static HTML/CSS/JS dashboard — no build step.
Run locally: cd to the repo root, then: python3 -m http.server 5174 --bind 127.0.0.1
Deploy: git add app.js index.html styles.css CLAUDE_HANDOFF.md && git commit -m "..." && git push origin main

Key files:
- app.js: all logic (~3000 lines), global `state` object, render functions, AI calls, 3D viewer
- styles.css: all styles
- cad-server/main.py: FastAPI geometry server (needs deploying to Render.com)
- bridge/MacDevBridge/server.mjs: local Node bridge for SolidWorks testing on Mac

What works: AI copilot (Gemini/Claude/OpenAI all correct), bottle parametric sliders,
Three.js 3D preview, VBA macro push to SolidWorks, standards matching, CSV/JSON export.

Highest priority next tasks:
1. Deploy cad-server/ to Render.com for real 3D mesh (render.yaml already configured)
2. Connect MCP server (bridge/McpServer/server.mjs) to enable Claude-native parameter control
3. Add server-side AI proxy so users don't need their own API keys
4. Add morph-slider parameter locks so manual slider edits are not overwritten
5. Extend the SolidWorks bridge/native host so launch, rebuild, export, drawing, and rendering buttons call real Windows SolidWorks APIs

Bump ?v=N in index.html after each significant change (currently v=14).
```
