# SolidWorks AI CAD Studio

A standalone dashboard prototype for turning uploaded requirements into a parameterized CAD concept, reviewing the resulting SolidWorks workspace plan, and triggering simulations, drawings, and renderings from one UI.

## What this prototype includes

- AI copilot prompt and requirement brief intake
- Text-based requirement file uploads (`.txt`, `.md`, `.json`, `.csv`)
- Automatic concept-family detection (`enclosure`, `bottle`, `bracket`, `tray`, `assembly`)
- Editable parameter table with revision tracking
- Embedded SolidWorks-style workspace mockup with feature tree and model preview
- Simulation, drawing-pack, and rendering artifact generation
- Local persistence in browser `localStorage`

## Open locally

From this folder:

```sh
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

If `localhost:8080` does not load, make sure you started the server from this exact folder:

```sh
cd /Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio
python3 -m http.server 8080 --bind 127.0.0.1
```

## Important integration boundary

This app is a browser prototype of the workflow, not a true native SolidWorks embed.

For production, the recommended architecture is:

1. Keep this dashboard as the orchestration and review surface.
2. Host the real SolidWorks window in a Windows desktop shell such as WPF + WebView2, Electron, or Tauri.
3. Add a local bridge service that can:
   - parse uploaded requirements
   - build or update SolidWorks parameters and feature edits
   - run simulation studies
   - generate drawings
   - generate renderings
4. Return run status and generated artifacts back to the dashboard.

## Suggested GitHub repository name

`solidworks-ai-cad-studio`

## GitHub Pages

This repo is set up to publish directly from the `main` branch root.

After the repository is pushed to GitHub:

1. Open **Settings -> Pages**.
2. Confirm the source is the `main` branch and the root folder (`/`).
3. GitHub Pages will publish the site automatically.
