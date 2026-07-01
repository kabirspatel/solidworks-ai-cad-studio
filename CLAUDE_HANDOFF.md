# SolidWorks AI CAD Studio — Full Handoff

**Repo:** https://github.com/kabirspatel/solidworks-ai-cad-studio  
**Live URL:** https://kabirspatel.github.io/solidworks-ai-cad-studio/  
**Local path:** `/Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio`  
**Latest commit:** `483373b` (v=11)

---

## What this app is

A static GitHub Pages dashboard for AI-assisted parametric CAD design. The user describes a part (or picks from 25 seed bottle variants), adjusts sliders, AI generates parameters, and the result pushes to local SolidWorks via a VBA macro or is previewed live in a Three.js 3D viewer.

**Stack:** Pure static HTML/CSS/JS — no build step, no Node at runtime.  
**Deploy:** `git add . && git commit && git push origin main` → GitHub Pages auto-builds.

---

## File map

```
index.html               — single-page shell, 4 panel sections
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

After any JS/CSS change: bump `?v=N` in `index.html` (currently v=11) to force GitHub Pages cache bust.

---

## Architecture: how app.js works

- Global `state` object — serialized to `localStorage` key `solidworks-ai-cad-studio-v4`
- `render()` redraws all 4 panels by setting innerHTML
- `persist(label)` = `saveOnly()` + `render()` + toast
- `saveOnly()` = direct `localStorage.setItem` without render (used by live sliders)
- `syncDraftFromDom()` — reads all form fields into state before any action
- Three.js scene lives in module-level `_three` variable, reused across renders via `mount3DViewer()`
- API keys in `sessionStorage` only (never persisted, clears on tab close)

---

## What WORKS (confirmed)

### AI Copilot — all three modes correct
| Provider | Endpoint | Key storage | Notes |
|----------|----------|-------------|-------|
| **Gemini** | `generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` | `sessionStorage` SESSION_GEMINI_KEY | Free tier quota exhausted for Kabir's key |
| **Claude** | `api.anthropic.com/v1/messages`, model `claude-sonnet-4-6`, header `anthropic-dangerous-direct-browser-access: true` | `sessionStorage` SESSION_CLAUDE_KEY | Working |
| **OpenAI** | `api.openai.com/v1/chat/completions`, default model `gpt-4o-mini` | `sessionStorage` SESSION_AI_KEY | Working (was broken, fixed this session) |
| **Local parser** | No network call | — | Always available, returns deterministic output |

AI flow: prompt → `askCopilot()` → `callGemini/Claude/OpenAI()` → `parseJsonFromText()` → `applyAiPayload()` → `updateFromBlueprint()` → `persist()` → `render()`

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
- Viewer does NOT show ribs, facets, or helix features (only lathe profile)

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
| FEA / "Run simulation" | Local formula estimate. Buttons removed from UI — only results shown in specs if bridge returns them |
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

---

## What still needs to be done

### HIGH PRIORITY

**1. AI key situation — Gemini free quota is hit**  
Kabir's Gemini free-tier key is exhausted. Options:
- Add a server-side AI proxy endpoint (backend holds the key, browser calls `/api/copilot`) — no per-user key needed
- Or tell Kabir to add an OpenAI or Claude key via the AI Provider dropdown
- The `callAiEndpoint()` function already supports a custom bridge endpoint — just needs a deployed backend

**2. 3D viewer doesn't show surface features**  
Ribs (`ribCount`/`ribDepth`), facets (`facetCount`/`facetDepth`), helix ridges — none appear in Three.js preview. The viewer only shows the lathe revolution profile.  
Fix paths:
- Option A: Deploy `cad-server/` to Render.com — it returns a real STL. Paste the URL into "Geometry server" field in the dashboard. The `mount3DViewer()` will fetch it automatically.
- Option B: Add Three.js surface deformation to `build3DGeometry()` for bottle — create rib indentations using vertex displacement along the lathe profile. Hard but no server needed.

**3. Deploy cad-server to Render.com**
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

**4. Standards constraints not in VBA macro**  
`lookupStandards()` finds applicable standards and shows them in the UI. Selected standards generate constraints (`buildStandardsConstraints()`). But `downloadSolidWorksMacro()` doesn't include them.  
Fix: Add a VB comment block to the `.swb` file listing the selected standards and their key constraints.

### MEDIUM PRIORITY

**5. State bleed between products**  
If user previously worked on a bottle and now types "create house", the bottle sliders still show because `state.concept.family === "bottle"` persists in localStorage. Switching product type should clear/reset `state.concept` and `state.parameters`.  
Fix: In `syncDraftFromDom()`, when `templateSelect` changes to a different family, reset `state.concept` and `state.parameters` to defaults for that family.

**6. Morph slider overwrites manual edits**  
If user manually edits a slider value, then drags the morph position slider, all manual edits are overwritten by the interpolated values. This is jarring.  
Fix: Add a "lock" toggle per slider — locked sliders are excluded from morph interpolation.

**7. MCP server not connected**  
`bridge/McpServer/server.mjs` exists as a JSON-RPC 2.0 stdio server. If wired to a Claude Code session, Claude could call tools that directly push parameters to SolidWorks during prompting.  
To activate: run the MCP server, add it to `.claude/settings.json` under `mcpServers`. This would let Kabir use Claude Code itself as the AI that drives the dashboard parameters.

**8. AI parse failures need better fallback**  
When AI returns prose instead of JSON, `parseJsonFromText()` throws "AI returned text instead of model JSON."  
Fix: On parse failure, try to extract the reply as a plain text message and display it in the AI output box rather than showing a red error box. Only show error box for network/auth failures.

**9. localStorage migration**  
State is versioned at `solidworks-ai-cad-studio-v4`. If schema changes break old saved state (missing fields), `normalizeState()` fills defaults — but this doesn't always work cleanly.  
Fix: Add a schema version check in `normalizeState()` that fully resets state if the major structure doesn't match.

### LOW PRIORITY / NICE TO HAVE

**10. BOTTLE_LOCKS are still project-specific**  
Lines ~335 in app.js. The "Locked specs" section in the bottle slider panel hardcodes things like "28 mm OD / 21 mm mouth ID" neck finish. These should either be configurable or loaded from the selected variant.

**11. Macro parameter key sanitization**  
`downloadSolidWorksMacro()` does basic VBA string escaping but parameter keys from AI-generated state could contain characters that break VBA syntax. Add a `sanitizeVbaIdentifier(key)` function.

**12. No mobile layout**  
The 4-panel grid is desktop-only. On mobile it stacks but overflows badly. Not a priority unless demoing on phone.

**13. Export JSON includes local-estimate analysis**  
The `makeCurrentModelPayload()` includes `state.analysis` which contains local FEA/material estimates. A consumer of the exported JSON might think these are real values.  
Fix: Strip `analysis` from export or tag every field with `"source": "local-estimate"`.

**14. CloudBroker real API integration**  
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
const SESSION_AI_KEY = "sw-ai-key";          // OpenAI key in sessionStorage
const SESSION_CLAUDE_KEY = "sw-claude-key";   // Claude key in sessionStorage
const SESSION_GEMINI_KEY = "sw-gemini-key";   // Gemini key in sessionStorage
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
Latest commit: 483373b (v=11 in index.html)

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
4. Fix state bleed between products (switching template should reset concept + parameters)
5. Add selected standards constraints to VBA macro export

Bump ?v=N in index.html after each significant change (currently v=11).
```
