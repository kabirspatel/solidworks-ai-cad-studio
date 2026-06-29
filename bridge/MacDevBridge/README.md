# MacDevBridge

Mac development bridge for SolidWorks AI CAD Studio.

This does not embed or automate native SolidWorks. SolidWorks desktop automation still requires Windows. The Mac bridge gives you a real local backend while working on a MacBook:

- serves the dashboard at `http://127.0.0.1:8787/`
- implements the same bridge endpoints as the Windows SolidWorks bridge
- stores each model/simulation/material/agent run under `runs/`
- generates `solidworks-design-table.csv`
- generates `solidworks-operations.json` for Windows handoff
- provides `/api/copilot` as a server-side AI endpoint

## Run

```sh
cd /Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio
node bridge/MacDevBridge/server.mjs
```

Then open:

```text
http://127.0.0.1:8787/
```

Use these dashboard settings:

- `AI source`: `AI endpoint`
- `AI endpoint`: `http://127.0.0.1:8787/api/copilot`
- `SolidWorks bridge URL`: `http://127.0.0.1:8787`

## Optional OpenAI proxy

Set an API key before starting the server:

```sh
export OPENAI_API_KEY="sk-..."
node bridge/MacDevBridge/server.mjs
```

Without `OPENAI_API_KEY`, `/api/copilot` uses a deterministic local response so the workflow still works offline.

## Windows handoff

Every run writes a folder under:

```text
bridge/MacDevBridge/runs/
```

Copy a run folder to the Windows SolidWorks workstation and use:

- `model-payload.json`
- `solidworks-design-table.csv`
- `solidworks-operations.json`
- `handoff-summary.md`

Those files are the practical handoff from Mac development to real SolidWorks automation.
