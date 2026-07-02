"""
CAD geometry server — generates real STL meshes from parametric inputs.
Uses only numpy (no CadQuery / OpenCascade) so it deploys on Render.com free tier.
Deploy: render.yaml in repo root points here.
"""
from fastapi import FastAPI
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import asyncio
import json
import os
import struct
import urllib.error
import urllib.parse
import urllib.request

app = FastAPI(title="SolidWorks AI CAD Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

MATERIAL_LIBRARY = {
    "PC-ABS": {"process": "Injection molding", "feasibility": 88, "lca": 62, "notes": "Strong enclosure baseline; petrochemical resin and end-of-life recovery need review."},
    "Medical-grade PC-ABS": {"process": "Injection molding", "feasibility": 84, "lca": 58, "notes": "Good cleanability and impact behavior; verify medical compliance and resin availability."},
    "ABS": {"process": "Injection molding", "feasibility": 82, "lca": 55, "notes": "Easy to tool and prototype; weaker sustainability profile."},
    "PET": {"process": "Blow molding", "feasibility": 86, "lca": 70, "notes": "Strong bottle baseline; high recycling familiarity."},
    "PETG": {"process": "Thermoforming or additive prototyping", "feasibility": 76, "lca": 61, "notes": "Useful for prototypes; production route needs closer review."},
    "PP": {"process": "Injection molding or thermoforming", "feasibility": 81, "lca": 68, "notes": "Low density and good processability; stiffness tradeoffs need FEA."},
    "Aluminum 6061-T6": {"process": "CNC machining or forming", "feasibility": 79, "lca": 64, "notes": "High stiffness and recyclability; embodied energy is high."},
    "Stainless steel": {"process": "Sheet forming or machining", "feasibility": 74, "lca": 60, "notes": "Durable and cleanable; mass and process energy are concerns."},
    "Mixed materials": {"process": "Assembly", "feasibility": 66, "lca": 48, "notes": "Separability and end-of-life strategy need definition."},
}


# ── geometry primitives ───────────────────────────────────────────────────────

def revolve(profile, n=72):
    """Revolve a list of (r, z) tuples around the Z-axis."""
    angles = np.linspace(0, 2 * np.pi, n, endpoint=False)
    verts = []
    for r, z in profile:
        for a in angles:
            verts.append([r * np.cos(a), r * np.sin(a), z])
    verts = np.array(verts, dtype=np.float32)

    faces = []
    nr = len(profile)
    for ring in range(nr - 1):
        for seg in range(n):
            ns = (seg + 1) % n
            i00 = ring * n + seg
            i01 = ring * n + ns
            i10 = (ring + 1) * n + seg
            i11 = (ring + 1) * n + ns
            faces.append([i00, i10, i01])
            faces.append([i01, i10, i11])

    # Close bottom cap (fan from first ring)
    cx_b = np.array([0.0, 0.0, float(profile[0][1])], dtype=np.float32)
    cap_center_idx = len(verts)
    verts = np.vstack([verts, [cx_b]])
    for seg in range(n):
        ns = (seg + 1) % n
        faces.append([cap_center_idx, seg, ns])

    # Close top cap
    cx_t = np.array([0.0, 0.0, float(profile[-1][1])], dtype=np.float32)
    cap_top_idx = len(verts)
    verts = np.vstack([verts, [cx_t]])
    base = (nr - 1) * n
    for seg in range(n):
        ns = (seg + 1) % n
        faces.append([cap_top_idx, base + ns, base + seg])

    return verts, np.array(faces, dtype=np.int32)


def extrude(path2d, depth):
    """Extrude a closed 2D polygon along Z."""
    path = np.array(path2d, dtype=np.float32)
    n = len(path)
    bottom = np.column_stack([path, np.zeros(n)])
    top = np.column_stack([path, np.full(n, depth)])
    verts = np.vstack([bottom, top])

    faces = []
    # Side quads
    for i in range(n):
        ni = (i + 1) % n
        faces += [[i, ni, i + n], [ni, ni + n, i + n]]
    # Bottom fan
    for i in range(1, n - 1):
        faces.append([0, i + 1, i])
    # Top fan
    for i in range(1, n - 1):
        faces.append([n, n + i, n + i + 1])

    return verts, np.array(faces, dtype=np.int32)


def box_hollow(L, W, H, wall):
    """Outer box with open top (tray / enclosure shell)."""
    outer_path = [(-L/2, -W/2), (L/2, -W/2), (L/2, W/2), (-L/2, W/2)]
    ov, of = extrude(outer_path, H)
    inner_L, inner_W = L - 2*wall, W - 2*wall
    if inner_L <= 0 or inner_W <= 0:
        return ov, of
    inner_path = [(-inner_L/2, -inner_W/2), (inner_L/2, -inner_W/2),
                  (inner_L/2, inner_W/2), (-inner_L/2, inner_W/2)]
    iv, if_ = extrude(inner_path, H - wall)
    iv[:, 2] += wall
    # Merge: outer faces + inner faces (reversed winding to face inward)
    iv_offset = len(ov)
    inner_faces_flipped = if_[:, ::-1] + iv_offset
    verts = np.vstack([ov, iv])
    faces = np.vstack([of, inner_faces_flipped])
    return verts, faces


def to_stl(verts, faces):
    """Pack vertices+faces into binary STL bytes."""
    header = b'\0' * 80
    chunks = [header, struct.pack('<I', len(faces))]
    v = verts.astype(np.float32)
    for f in faces:
        v0, v1, v2 = v[f[0]], v[f[1]], v[f[2]]
        n = np.cross(v1 - v0, v2 - v0)
        nl = np.linalg.norm(n)
        n = (n / nl) if nl > 0 else n
        chunks.append(struct.pack('<fff', *n))
        chunks.append(struct.pack('<fff', *v0))
        chunks.append(struct.pack('<fff', *v1))
        chunks.append(struct.pack('<fff', *v2))
        chunks.append(b'\x00\x00')
    return b''.join(chunks)


# ── parameter helpers ─────────────────────────────────────────────────────────

def gp(params, key, fallback):
    for p in params:
        if p.get("key") == key:
            try:
                return float(p["value"])
            except (ValueError, TypeError):
                pass
    return float(fallback)


# ── geometry builders per family ──────────────────────────────────────────────

def gen_bottle(params):
    H  = gp(params, "height", 232)
    R  = gp(params, "bodyDiameter", 58) / 2
    D  = gp(params, "bodyDepth", R * 2) / 2
    nR = gp(params, "neckDiameter", 28) / 2
    sH = gp(params, "shoulderHeight", 28)
    nH = gp(params, "neckHeight", 25)
    bH = min(10.0, H * 0.04)
    body_top = H - sH - nH
    profile = [
        (R * 0.30, 0),
        (R, bH),
        (R, body_top),
        (nR * 1.40, H - nH - 5),
        (nR, H - nH),
        (nR, H),
    ]
    verts, faces = revolve(profile, n=96)
    return deform_bottle_surface(verts, faces, params, R, D, bH, body_top)


def deform_bottle_surface(verts, faces, params, radius, depth_radius, base_h, body_top):
    """Apply oval depth, ribs, rings, facets, and helix relief to bottle body vertices."""
    rib_count = gp(params, "ribCount", 0)
    rib_depth = gp(params, "ribDepth", 0)
    ring_count = gp(params, "ringCount", 0)
    ring_depth = gp(params, "ringDepth", 0)
    facet_count = gp(params, "facetCount", 0)
    facet_depth = gp(params, "facetDepth", 0)
    helix_count = gp(params, "helixRidges", 0)
    helix_depth = gp(params, "helixDepth", 0)
    helix_turns = gp(params, "helixTurns", 0)
    squash = depth_radius / radius if radius else 1.0
    span = max(1.0, body_top - base_h)

    for i in range(len(verts)):
        x, y, z = verts[i]
        body_ratio = min(1.0, max(0.0, (z - base_h) / span))
        y *= squash * body_ratio + (1.0 - body_ratio)
        if base_h <= z <= body_top:
            theta = np.arctan2(y, x)
            r = max(1.0, np.sqrt(x * x + y * y))
            relief = 0.0
            if rib_count > 0 and rib_depth > 0:
                relief -= rib_depth * (0.5 + 0.5 * np.cos(theta * round(rib_count))) ** 8
            if ring_count > 0 and ring_depth > 0:
                relief -= ring_depth * (0.5 + 0.5 * np.cos(body_ratio * round(ring_count) * np.pi * 2)) ** 10
            if facet_count > 2 and facet_depth > 0:
                relief -= facet_depth * (0.5 + 0.5 * np.cos(theta * round(facet_count)))
            if (helix_count > 0 or helix_turns > 0) and helix_depth > 0:
                ridges = max(1, round(helix_count or 8))
                relief -= helix_depth * (0.5 + 0.5 * np.cos(theta * ridges - body_ratio * helix_turns * np.pi * 2)) ** 8
            scale = max(0.72, (r + relief) / r)
            x *= scale
            y *= scale
        verts[i] = [x, y, z]

    return verts, faces


def gen_enclosure(params):
    L    = gp(params, "length", 170)
    W    = gp(params, "width", 95)
    H    = gp(params, "height", 42)
    wall = gp(params, "wall", 2.5)
    return box_hollow(L, W, H, wall)


def gen_bracket(params):
    bL = gp(params, "baseLength", 120)
    bW = gp(params, "baseWidth", 48)
    lH = gp(params, "legHeight", 62)
    t  = gp(params, "thickness", 4)
    path = [(0, 0), (bL, 0), (bL, t), (t, t), (t, lH), (0, lH)]
    return extrude(path, bW)


def gen_tray(params):
    L    = gp(params, "length", 220)
    W    = gp(params, "width", 140)
    D    = gp(params, "depth", 32)
    wall = gp(params, "wall", 2.2)
    return box_hollow(L, W, D, wall)


def gen_assembly(params):
    L = gp(params, "length", 200) or gp(params, "baseLength", 120)
    W = gp(params, "width", 150)  or gp(params, "baseWidth", 80)
    H = gp(params, "height", 60)  or gp(params, "legHeight", 40)
    path = [(-L/2, -W/2), (L/2, -W/2), (L/2, W/2), (-L/2, W/2)]
    return extrude(path, max(H, 10))


BUILDERS = {
    "bottle":    gen_bottle,
    "enclosure": gen_enclosure,
    "bracket":   gen_bracket,
    "tray":      gen_tray,
    "assembly":  gen_assembly,
}


# ── AI proxy helpers ─────────────────────────────────────────────────────────

def parse_json_text(text):
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:].strip()
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            return json.loads(cleaned[start:end + 1])
        raise ValueError("AI returned text instead of model JSON.")


def call_openai_copilot(body, api_key):
    payload = {
        "model": body.get("model") or os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        "max_tokens": 1600,
        "messages": [
            {
                "role": "system",
                "content": body.get("instructions") or "Return only valid JSON for a SolidWorks CAD model.",
            },
            {
                "role": "user",
                "content": json.dumps(body.get("payload") or {}, indent=2),
            },
        ],
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(detail or f"OpenAI request failed ({exc.code})")

    text = (((data.get("choices") or [{}])[0].get("message") or {}).get("content") or "")
    return parse_json_text(text)


# ── analysis / IP helpers ────────────────────────────────────────────────────

def clamp(value, lower, upper):
    return min(upper, max(lower, value))


def material_record(material):
    if material in MATERIAL_LIBRARY:
        return MATERIAL_LIBRARY[material]
    for key, record in MATERIAL_LIBRARY.items():
        if material and key.lower() in str(material).lower():
            return record
    return MATERIAL_LIBRARY["Mixed materials"]


def material_assessment(payload):
    concept = payload.get("concept") or {}
    params = payload.get("parameters") or []
    material = concept.get("material") or payload.get("material") or "Mixed materials"
    record = material_record(material)
    wall = 2.5
    for param in params:
        key = str(param.get("key", ""))
        if "wall" in key.lower() or "thickness" in key.lower():
            try:
                wall = float(param.get("value"))
            except (TypeError, ValueError):
                pass
            break
    count_penalty = 0
    for param in params:
        if param.get("unit") == "count":
            try:
                count_penalty += max(0, float(param.get("value", 0)) - 4)
            except (TypeError, ValueError):
                pass
    feasibility = int(clamp(round(record["feasibility"] + wall * 1.2 - count_penalty * 1.5), 35, 98))
    lca = int(clamp(round(record["lca"] - max(0, wall - 2.5) * 3 - count_penalty), 20, 96))
    return {
        "material": material,
        "process": record["process"],
        "feasibility": feasibility,
        "lca": lca,
        "decomposition": "Favorable" if lca >= 70 else "Review" if lca >= 55 else "Constrained",
        "recommendation": "Proceed to bridge validation" if feasibility >= 82 and lca >= 65 else "Review material/process tradeoffs before release",
        "notes": record["notes"],
        "source": "CAD server LCA screen",
    }


def patent_links(query):
    encoded = urllib.parse.quote(query)
    return [
        {"label": "Google Patents", "url": f"https://patents.google.com/?q={encoded}", "note": "Fast broad prior-art scan"},
        {"label": "USPTO Patent Public Search", "url": "https://ppubs.uspto.gov/pubwebapp/", "note": "Official US patent search"},
        {"label": "Espacenet", "url": f"https://worldwide.espacenet.com/patent/search?q={encoded}", "note": "International patent literature"},
        {"label": "The Lens", "url": f"https://www.lens.org/lens/search/patent/list?q={encoded}", "note": "Patent and scholarly landscape"},
    ]


def normalize_patentsview_result(item):
    number = item.get("patent_number") or item.get("patent_id") or item.get("publication_number") or ""
    title = item.get("patent_title") or item.get("title") or "Untitled patent"
    return {
        "source": "PatentsView",
        "patentNumber": number,
        "publication": number,
        "title": title,
        "date": item.get("patent_date") or item.get("publication_date") or "",
        "assignee": ", ".join(a.get("assignee_organization", "") for a in item.get("assignees", []) if a.get("assignee_organization")) if isinstance(item.get("assignees"), list) else "",
        "abstract": item.get("patent_abstract") or item.get("abstract") or "",
        "url": f"https://patents.google.com/patent/US{number}" if number else "https://patents.google.com/",
    }


def search_patentsview(query, limit=8):
    q = {
        "_or": [
            {"_text_any": {"patent_title": query}},
            {"_text_any": {"patent_abstract": query}},
        ]
    }
    fields = [
        "patent_number",
        "patent_title",
        "patent_date",
        "patent_abstract",
        "assignees.assignee_organization",
    ]
    options = {"per_page": limit}
    params = urllib.parse.urlencode({
        "q": json.dumps(q),
        "f": json.dumps(fields),
        "o": json.dumps(options),
    })
    url = f"https://api.patentsview.org/patents/query?{params}"
    request = urllib.request.Request(url, headers={"User-Agent": "solidworks-ai-cad-studio/1.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        data = json.loads(response.read().decode("utf-8"))
    patents = data.get("patents") or []
    return [normalize_patentsview_result(item) for item in patents[:limit]]


# ── routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "CAD geometry server",
        "aiProxy": bool(os.environ.get("OPENAI_API_KEY")),
        "capabilities": ["geometry", "stl", "ai-proxy", "lca-screen", "patent-search"],
    }


@app.post("/api/copilot")
async def copilot(body: dict):
    """Server-side AI proxy so GitHub Pages does not need browser-stored shared keys."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return {
            "error": "OPENAI_API_KEY is not configured on this server.",
            "reply": "AI proxy is reachable, but no server-side OpenAI key is configured.",
        }

    return await asyncio.to_thread(call_openai_copilot, body, api_key)


@app.post("/api/lca")
async def lca(body: dict):
    assessment = material_assessment(body)
    return {
        "message": "CAD server material/LCA screen complete. Use SOLIDWORKS Sustainability tooling for a formal report.",
        "materialAssessment": assessment,
    }


@app.post("/api/patents/search")
async def patents_search(body: dict):
    query = " ".join(str(part) for part in [
        body.get("query", ""),
        body.get("family", ""),
        body.get("material", ""),
        " ".join(body.get("features") or []),
    ] if part).strip() or "parametric CAD product design"
    links = patent_links(query)

    try:
        results = await asyncio.to_thread(search_patentsview, query, int(body.get("limit", 8)))
        return {
            "query": query,
            "source": "PatentsView",
            "results": results,
            "links": links,
            "message": f"{len(results)} patent records returned from PatentsView.",
        }
    except Exception as exc:
        return {
            "query": query,
            "source": "Search launchers",
            "results": [],
            "links": links,
            "message": f"Backend patent search unavailable: {exc}. Use the launcher links for manual search.",
        }


@app.post("/api/generate")
async def generate(body: dict):
    family = body.get("family", "assembly")
    params = body.get("parameters", [])

    builder = BUILDERS.get(family, gen_assembly)
    try:
        verts, faces = builder(params)
        stl = to_stl(verts, faces)
    except Exception as exc:
        return {"error": str(exc)}, 500

    return Response(
        content=stl,
        media_type="application/octet-stream",
        headers={"Content-Disposition": 'attachment; filename="model.stl"'},
    )
