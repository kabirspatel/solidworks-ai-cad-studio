"""
CAD geometry server — generates real STL meshes from parametric inputs.
Uses only numpy (no CadQuery / OpenCascade) so it deploys on Render.com free tier.
Deploy: render.yaml in repo root points here.
"""
from fastapi import FastAPI
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import struct

app = FastAPI(title="SolidWorks AI CAD Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


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


# ── routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "CAD geometry server"}


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
