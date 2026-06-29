# SolidWorks AI CAD Studio

A focused dashboard for four jobs:

- AI copilot
- requirements intake
- SolidWorks model window
- current model specs

The GitHub Pages app is static, so it cannot contain private server secrets or directly host a native SolidWorks desktop process. It now exposes real connector points for both.

## Open locally

```sh
cd /Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio
python3 -m http.server 8080 --bind 127.0.0.1
```

Then open [http://localhost:8080](http://localhost:8080).

## AI integration

The copilot supports three modes:

- `OpenAI key`: calls the OpenAI Responses API from the browser with a key entered for the current tab session.
- `AI endpoint`: posts the current model payload to your own backend endpoint.
- `Local parser`: deterministic fallback for offline demos.

For production, prefer the `AI endpoint` mode so API keys stay server-side.

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

The bridge should enable CORS for the GitHub Pages origin and serve `/viewer` as the live SolidWorks viewport, usually through a Windows desktop shell, WebView2 host, remote stream, or local viewer service.

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

The workflow publishes `index.html`, `styles.css`, `app.js`, and `.nojekyll` automatically on each push to `main`.
