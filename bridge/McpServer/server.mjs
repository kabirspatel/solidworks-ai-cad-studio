#!/usr/bin/env node
// SolidWorks AI CAD Studio — MCP stdio server
// Exposes SolidWorks bridge operations and standards lookup as MCP tools
//
// Usage:
//   node bridge/McpServer/server.mjs [bridge-url]
//   Default bridge URL: http://127.0.0.1:8787 (MacDevBridge or Windows SolidWorksBridge)
//
// Register in ~/.claude/settings.json:
// {
//   "mcpServers": {
//     "solidworks-cad": {
//       "command": "/Users/kabirpatel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node",
//       "args": ["/Users/kabirpatel/Documents/Playground/solidworks-ai-cad-studio/bridge/McpServer/server.mjs"]
//     }
//   }
// }

import * as readline from 'readline';

const BRIDGE_URL = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/$/, '');

// ── Bottle variants (25 STREAMS concepts, B01–B25) ──────────────────────────
const BOTTLE_VARIANTS = [
  { id:"B01", concept:"Minimal cylinder",      morph:"01→03", H:232,  W:58.52, D:58.52, wall:0.65, base:1.4, neckOD:28, mouthID:21, shoulderH:26, neckH:25, supN:2.2,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B02", concept:"Soft-shoulder cylinder", morph:"01→03", H:226,  W:60.33, D:60.33, wall:0.65, base:1.4, neckOD:28, mouthID:21, shoulderH:30, neckH:25, supN:2.2,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B03", concept:"Rounded cylinder",       morph:"01→03", H:220,  W:61.65, D:61.65, wall:0.70, base:1.5, neckOD:28, mouthID:21, shoulderH:34, neckH:25, supN:2.3,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B04", concept:"Oval shoulder",          morph:"01→03", H:214,  W:67.50, D:55.80, wall:0.75, base:1.6, neckOD:28, mouthID:21, shoulderH:38, neckH:25, supN:3.0,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B05", concept:"Sculpted flask",         morph:"01→03", H:205,  W:76.89, D:51.85, wall:0.80, base:1.8, neckOD:28, mouthID:21, shoulderH:42, neckH:26, supN:3.8,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:8,  facetDepth:0.80, helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B06", concept:"Micro-rib cylinder",     morph:"04→06", H:232,  W:59.65, D:59.65, wall:0.70, base:1.5, neckOD:28, mouthID:21, shoulderH:26, neckH:25, supN:2.0,  ribCount:48, ribDepth:0.45, ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B07", concept:"Ribbed soft shoulder",   morph:"04→06", H:228,  W:60.13, D:60.13, wall:0.70, base:1.5, neckOD:28, mouthID:21, shoulderH:28, neckH:25, supN:2.05, ribCount:52, ribDepth:0.65, ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B08", concept:"Rib-facet hybrid",       morph:"04→06", H:220,  W:61.45, D:61.45, wall:0.75, base:1.6, neckOD:28, mouthID:21, shoulderH:30, neckH:25, supN:2.1,  ribCount:36, ribDepth:0.45, ringCount:0, ringDepth:0,    facetCount:14, facetDepth:0.55, helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B09", concept:"Crystal panel",          morph:"04→06", H:216,  W:62.10, D:62.10, wall:0.80, base:1.8, neckOD:28, mouthID:21, shoulderH:34, neckH:25, supN:2.2,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:10, facetDepth:1.10, helixCount:10, helixDepth:0.25, helixTurns:0.7 },
  { id:"B10", concept:"Horizontal ring",        morph:"04→06", H:202,  W:64.39, D:64.39, wall:0.70, base:1.7, neckOD:28, mouthID:21, shoulderH:22, neckH:24, supN:2.0,  ribCount:0,  ribDepth:0,    ringCount:9, ringDepth:1.05, facetCount:0,  facetDepth:0,    helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B11", concept:"Lavender facet",         morph:"07→08", H:225,  W:64.11, D:54.68, wall:0.75, base:1.6, neckOD:28, mouthID:21, shoulderH:30, neckH:25, supN:3.0,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:10, facetDepth:0.90, helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B12", concept:"Facet-twist I",          morph:"07→08", H:224,  W:64.28, D:54.83, wall:0.75, base:1.6, neckOD:28, mouthID:21, shoulderH:30, neckH:25, supN:3.0,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:10, facetDepth:0.85, helixCount:10, helixDepth:0.25, helixTurns:0.7 },
  { id:"B13", concept:"Spiral transition",      morph:"07→08", H:222,  W:66.09, D:57.21, wall:0.80, base:1.7, neckOD:28, mouthID:21, shoulderH:30, neckH:25, supN:2.7,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:10, facetDepth:0.60, helixCount:10, helixDepth:0.60, helixTurns:1.1 },
  { id:"B14", concept:"Spiral grip",            morph:"07→08", H:218,  W:62.44, D:62.44, wall:0.80, base:1.8, neckOD:28, mouthID:21, shoulderH:28, neckH:25, supN:2.3,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:12, helixDepth:1.00, helixTurns:1.5 },
  { id:"B15", concept:"Full spiral",            morph:"07→08", H:214,  W:63.06, D:63.06, wall:0.85, base:1.8, neckOD:28, mouthID:21, shoulderH:28, neckH:25, supN:2.2,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:12, helixDepth:1.25, helixTurns:1.9 },
  { id:"B16", concept:"Spiral start",           morph:"08→09", H:215,  W:62.88, D:62.88, wall:0.85, base:1.8, neckOD:28, mouthID:21, shoulderH:28, neckH:25, supN:2.2,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:12, helixDepth:1.20, helixTurns:1.9 },
  { id:"B17", concept:"Slim twirl",             morph:"08→09", H:218,  W:64.28, D:64.28, wall:0.80, base:1.7, neckOD:28, mouthID:21, shoulderH:30, neckH:25, supN:2.15, ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:12, helixDepth:0.95, helixTurns:1.5 },
  { id:"B18", concept:"Twirl-taper hybrid",     morph:"08→09", H:222,  W:75.45, D:67.07, wall:0.75, base:1.7, neckOD:28, mouthID:21, shoulderH:32, neckH:25, supN:2.4,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:10, helixDepth:0.55, helixTurns:1.0 },
  { id:"B19", concept:"Smooth taper I",         morph:"08→09", H:226,  W:76.93, D:76.93, wall:0.70, base:1.6, neckOD:28, mouthID:21, shoulderH:28, neckH:25, supN:2.15, ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B20", concept:"Iconic taper",           morph:"08→09", H:230,  W:75.48, D:75.48, wall:0.70, base:1.7, neckOD:28, mouthID:21, shoulderH:28, neckH:25, supN:2.2,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B21", concept:"Purple facet base",      morph:"07→09", H:225,  W:64.11, D:54.68, wall:0.75, base:1.6, neckOD:28, mouthID:21, shoulderH:30, neckH:25, supN:3.0,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:10, facetDepth:0.90, helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B22", concept:"Soft taper facet",       morph:"07→09", H:226,  W:72.10, D:63.36, wall:0.75, base:1.6, neckOD:28, mouthID:21, shoulderH:31, neckH:25, supN:2.8,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:10, facetDepth:0.65, helixCount:10, helixDepth:0.20, helixTurns:0.5 },
  { id:"B23", concept:"Twist-taper",            morph:"07→09", H:222,  W:71.15, D:71.15, wall:0.80, base:1.7, neckOD:28, mouthID:21, shoulderH:31, neckH:25, supN:2.4,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:10, facetDepth:0.20, helixCount:10, helixDepth:0.65, helixTurns:1.1 },
  { id:"B24", concept:"Tapered olive base",     morph:"07→09", H:228,  W:75.98, D:75.98, wall:0.70, base:1.6, neckOD:28, mouthID:21, shoulderH:28, neckH:25, supN:2.2,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:0,  helixDepth:0,    helixTurns:0   },
  { id:"B25", concept:"Final iconic taper",     morph:"07→09", H:230,  W:75.48, D:75.48, wall:0.70, base:1.7, neckOD:28, mouthID:21, shoulderH:28, neckH:25, supN:2.2,  ribCount:0,  ribDepth:0,    ringCount:0, ringDepth:0,    facetCount:0,  facetDepth:0,    helixCount:0,  helixDepth:0,    helixTurns:0   }
];

// ── Standards library ────────────────────────────────────────────────────────
const STANDARDS_LIBRARY = {
  bottle: {
    all: [
      { id: "21 CFR 165.110", title: "Bottled water quality standards", category: "regulatory",
        constraints: [{ param: "closure", rule: "Tamper-evident closure required" }] },
      { id: "FDA 21 CFR 101", title: "Food labeling general requirements", category: "labeling",
        constraints: [] },
      { id: "ASTM D2463", title: "Drop impact resistance of plastic bottles", category: "mechanical",
        constraints: [{ param: "wall", rule: "min 0.65mm body wall" }, { param: "base", rule: "min 1.4mm base thickness" }] },
      { id: "California Prop 65", title: "Safe Drinking Water and Toxic Enforcement Act", category: "regulatory",
        constraints: [{ param: "material", rule: "No Prop 65-listed chemicals above threshold" }] }
    ],
    "PLA + enzyme additive system": [
      { id: "ASTM D6400", title: "Standard specification for compostable plastics", category: "sustainability",
        constraints: [{ param: "material", rule: "PLA + enzyme additive must have compostability test data" }] },
      { id: "EN 13432", title: "Packaging recoverable through composting (EU)", category: "sustainability",
        constraints: [] },
      { id: "FDA FCN 000178", title: "FDA food contact notification — PLA polymers", category: "food-contact",
        constraints: [{ param: "additive", rule: "Enzyme additive needs separate FDA FCN or GRAS status" }] }
    ],
    PLA: [
      { id: "ASTM D6400", title: "Standard specification for compostable plastics", category: "sustainability",
        constraints: [{ param: "material", rule: "Certified PLA resin with compostability data required" }] },
      { id: "EN 13432", title: "Packaging recoverable through composting (EU)", category: "sustainability",
        constraints: [] },
      { id: "FDA FCN 000178", title: "FDA food contact notification — PLA polymers", category: "food-contact",
        constraints: [{ param: "temperature", rule: "Max use temp ~40°C for cold-fill PLA" }] }
    ],
    PET: [
      { id: "FDA 21 CFR 177.1630", title: "PET resins for food contact", category: "food-contact",
        constraints: [{ param: "material", rule: "IV ≥ 0.72 dL/g for blow-molded PET bottles" }] },
      { id: "ISBT 301", title: "28mm PCO 1881 neck finish standard", category: "manufacturing",
        constraints: [{ param: "neckDiameter", rule: "28mm PCO 1881 finish T-dim 34.925±0.15mm" }] }
    ]
  },
  enclosure: {
    all: [
      { id: "IEC 60529", title: "IP Code — degrees of protection", category: "mechanical",
        constraints: [{ param: "wall", rule: "min 2.5mm for IP54 in PC-ABS" }] },
      { id: "UL 94", title: "Flammability of plastic materials", category: "safety",
        constraints: [{ param: "wall", rule: "min 2.3mm for V-0 in PC-ABS" }] },
      { id: "RoHS 2011/65/EU", title: "Restriction of hazardous substances", category: "chemical",
        constraints: [{ param: "material", rule: "RoHS-compliant resin + colorant required" }] }
    ],
    "Medical-grade PC-ABS": [
      { id: "ISO 13485:2016", title: "Medical devices — QMS", category: "quality",
        constraints: [{ param: "cornerRadius", rule: "min 2mm internal radii" }] },
      { id: "ISO 10993-1", title: "Biological evaluation of medical devices", category: "biocompatibility",
        constraints: [{ param: "material", rule: "USP Class VI or ISO 10993 data required" }] }
    ]
  },
  bracket: {
    all: [
      { id: "ISO 2768-1", title: "General tolerances", category: "manufacturing",
        constraints: [{ param: "holeDiameter", rule: "±0.1mm (medium class) for 3–30mm" }] }
    ],
    "Aluminum 6061-T6": [
      { id: "ASTM B221", title: "6061-T6 aluminum extruded products", category: "material",
        constraints: [{ param: "thickness", rule: "min 4mm for structural bracket" }] }
    ]
  },
  tray: {
    all: [
      { id: "ISO 11607-1", title: "Packaging for sterile medical devices", category: "regulatory",
        constraints: [{ param: "wall", rule: "min 2.0mm for sterile tray" }, { param: "draft", rule: "min 2° draft on pocket walls" }] }
    ]
  },
  assembly: {
    all: [
      { id: "ISO 9001:2015", title: "Quality management systems", category: "quality", constraints: [] }
    ]
  }
};

function matchStandards(family, material) {
  const bank = STANDARDS_LIBRARY[family] || {};
  const byMaterial = bank[material] || [];
  const defaults = bank.all || [];
  const seen = new Set();
  return [...defaults, ...byMaterial].filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

function variantToParams(variant) {
  return [
    { key: 'height',        label: 'Height',         unit: 'mm',    value: variant.H,          swDimension: 'D1@HEIGHT' },
    { key: 'bodyDiameter',  label: 'Body diameter',  unit: 'mm',    value: variant.W,          swDimension: 'D2@BODY_DIAMETER' },
    { key: 'bodyDepth',     label: 'Body depth',     unit: 'mm',    value: variant.D,          swDimension: 'D3@BODY_DEPTH' },
    { key: 'wall',          label: 'Wall',           unit: 'mm',    value: variant.wall,       swDimension: 'D4@WALL' },
    { key: 'base',          label: 'Base thickness', unit: 'mm',    value: variant.base,       swDimension: 'D5@BASE' },
    { key: 'neckDiameter',  label: 'Neck OD',        unit: 'mm',    value: variant.neckOD,     swDimension: 'D6@NECK_OD' },
    { key: 'mouthID',       label: 'Mouth ID',       unit: 'mm',    value: variant.mouthID,    swDimension: 'D7@MOUTH_ID' },
    { key: 'shoulderH',     label: 'Shoulder H',     unit: 'mm',    value: variant.shoulderH,  swDimension: 'D8@SHOULDER_H' },
    { key: 'neckH',         label: 'Neck height',    unit: 'mm',    value: variant.neckH,      swDimension: 'D9@NECK_H' },
    { key: 'superellipseN', label: 'Superellipse n', unit: '',      value: variant.supN,       swDimension: 'D10@SUPERELLIPSE_N' },
    { key: 'ribCount',      label: 'Rib count',      unit: 'count', value: variant.ribCount,   swDimension: 'D11@RIB_COUNT' },
    { key: 'ribDepth',      label: 'Rib depth',      unit: 'mm',    value: variant.ribDepth,   swDimension: 'D12@RIB_DEPTH' },
    { key: 'ringCount',     label: 'Ring count',     unit: 'count', value: variant.ringCount,  swDimension: 'D13@RING_COUNT' },
    { key: 'ringDepth',     label: 'Ring depth',     unit: 'mm',    value: variant.ringDepth,  swDimension: 'D14@RING_DEPTH' },
    { key: 'facetCount',    label: 'Facet count',    unit: 'count', value: variant.facetCount, swDimension: 'D15@FACET_COUNT' },
    { key: 'facetDepth',    label: 'Facet depth',    unit: 'mm',    value: variant.facetDepth, swDimension: 'D16@FACET_DEPTH' },
    { key: 'helixRidges',   label: 'Helix ridges',   unit: 'count', value: variant.helixCount, swDimension: 'D17@HELIX_RIDGES' },
    { key: 'helixDepth',    label: 'Helix depth',    unit: 'mm',    value: variant.helixDepth, swDimension: 'D18@HELIX_DEPTH' },
    { key: 'helixTurns',    label: 'Helix turns',    unit: '',      value: variant.helixTurns, swDimension: 'D19@HELIX_TURNS' }
  ];
}

// ── Bridge HTTP helpers ──────────────────────────────────────────────────────
async function bridgeGet(path) {
  const res = await fetch(`${BRIDGE_URL}${path}`);
  if (!res.ok) throw new Error(`Bridge ${path} → ${res.status}`);
  return res.json();
}

async function bridgePost(path, body) {
  const res = await fetch(`${BRIDGE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Bridge ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ── Tool definitions ─────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'solidworks_status',
    description: 'Check the SolidWorks bridge connection status and currently active document.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'solidworks_push_model',
    description: 'Push CAD model parameters to the SolidWorks bridge. Sends parameters as a model payload; the bridge writes a SolidWorks design table and triggers a rebuild.',
    inputSchema: {
      type: 'object',
      properties: {
        title:      { type: 'string', description: 'Model title / document name (e.g. "B14 Spiral grip")' },
        material:   { type: 'string', description: 'Material specification (e.g. "PLA + enzyme additive system")' },
        parameters: {
          type: 'array',
          description: 'Array of dimension parameters — each needs key, label, value, unit, swDimension',
          items: {
            type: 'object',
            properties: {
              key:         { type: 'string' },
              label:       { type: 'string' },
              value:       { type: 'number' },
              unit:        { type: 'string' },
              swDimension: { type: 'string' }
            },
            required: ['key', 'value', 'unit']
          }
        }
      },
      required: ['parameters']
    }
  },
  {
    name: 'solidworks_run_simulation',
    description: 'Run a structural FEA simulation on the current model via the SolidWorks bridge. Returns safety factor, mass index, and critique.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'solidworks_run_optimization',
    description: 'Run design optimization on the current model parameters via the bridge. Returns recommendations and revised parameter set.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'solidworks_material_assessment',
    description: 'Run material and LCA assessment for the current model.',
    inputSchema: {
      type: 'object',
      properties: {
        material: { type: 'string', description: 'Material to assess (leave empty to use current model material)' }
      },
      required: []
    }
  },
  {
    name: 'get_relevant_standards',
    description: 'Get applicable design standards and compliance requirements for a product family and material. Returns standard IDs, titles, scopes, test requirements, and parameter constraints.',
    inputSchema: {
      type: 'object',
      properties: {
        family:   { type: 'string', enum: ['bottle', 'enclosure', 'bracket', 'tray', 'assembly'], description: 'Product family' },
        material: { type: 'string', description: 'Material name e.g. "PLA + enzyme additive system", "PC-ABS", "Aluminum 6061-T6"' }
      },
      required: ['family']
    }
  },
  {
    name: 'list_bottle_variants',
    description: 'List all 25 STREAMS bottle CAD variants (B01–B25) with their concept names, morph paths, and key dimensional parameters.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_bottle_variant',
    description: 'Get full CAD parameters for a specific STREAMS bottle variant, ready to push directly to SolidWorks.',
    inputSchema: {
      type: 'object',
      properties: {
        variant_id: { type: 'string', description: 'Bottle variant ID — B01 through B25' }
      },
      required: ['variant_id']
    }
  },
  {
    name: 'push_bottle_variant_to_solidworks',
    description: 'Load a STREAMS bottle variant (B01–B25) and push all its parameters directly to the SolidWorks bridge in one step.',
    inputSchema: {
      type: 'object',
      properties: {
        variant_id: { type: 'string', description: 'Bottle variant ID — B01 through B25' }
      },
      required: ['variant_id']
    }
  },
  {
    name: 'export_design_table_csv',
    description: 'Convert a parameter array into a SolidWorks-compatible design table CSV string.',
    inputSchema: {
      type: 'object',
      properties: {
        parameters: {
          type: 'array',
          items: { type: 'object' },
          description: 'Parameter objects with key, label, value, unit, swDimension'
        }
      },
      required: ['parameters']
    }
  }
];

// ── Tool implementations ──────────────────────────────────────────────────────
async function callTool(name, args) {
  switch (name) {

    case 'solidworks_status': {
      try {
        const data = await bridgeGet('/health');
        return text(JSON.stringify(data, null, 2));
      } catch (err) {
        return error(`Bridge not reachable at ${BRIDGE_URL}: ${err.message}\n\nTo start MacDevBridge:\n  node bridge/MacDevBridge/server.mjs`);
      }
    }

    case 'solidworks_push_model': {
      try {
        const payload = {
          concept: { title: args.title || 'Model', material: args.material || '' },
          parameters: (args.parameters || []).map(p => ({
            key: p.key, label: p.label || p.key, unit: p.unit,
            value: p.value, source: 'MCP', swDimension: p.swDimension || p.key
          })),
          revision: 1,
          solidworksIntent: {
            documentType: 'part',
            rebuildMode: 'parametric',
            operations: []
          }
        };
        const data = await bridgePost('/api/model', payload);
        return text(`Model pushed to SolidWorks bridge.\n\n${JSON.stringify(data, null, 2)}`);
      } catch (err) {
        return error(`Push failed: ${err.message}`);
      }
    }

    case 'solidworks_run_simulation': {
      try {
        const data = await bridgePost('/api/simulate', {});
        return text(JSON.stringify(data, null, 2));
      } catch (err) {
        return error(`Simulation failed: ${err.message}`);
      }
    }

    case 'solidworks_run_optimization': {
      try {
        const data = await bridgePost('/api/optimize', {});
        return text(JSON.stringify(data, null, 2));
      } catch (err) {
        return error(`Optimization failed: ${err.message}`);
      }
    }

    case 'solidworks_material_assessment': {
      try {
        const data = await bridgePost('/api/material-assessment', args.material ? { material: args.material } : {});
        return text(JSON.stringify(data, null, 2));
      } catch (err) {
        return error(`Material assessment failed: ${err.message}`);
      }
    }

    case 'get_relevant_standards': {
      const family = args.family || 'assembly';
      const material = args.material || '';
      const standards = matchStandards(family, material);
      return text(JSON.stringify({ family, material, count: standards.length, standards }, null, 2));
    }

    case 'list_bottle_variants': {
      const list = BOTTLE_VARIANTS.map(v => ({
        id: v.id,
        concept: v.concept,
        morph: v.morph,
        H_mm: v.H,
        W_mm: v.W,
        wall_mm: v.wall,
        base_mm: v.base,
        surface: [
          v.ribCount   ? `${v.ribCount} ribs (depth ${v.ribDepth}mm)`   : '',
          v.ringCount  ? `${v.ringCount} rings (depth ${v.ringDepth}mm)` : '',
          v.facetCount ? `${v.facetCount} facets (depth ${v.facetDepth}mm)` : '',
          v.helixCount ? `${v.helixCount} helix ridges (depth ${v.helixDepth}mm, ${v.helixTurns} turns)` : ''
        ].filter(Boolean).join('; ') || 'smooth'
      }));
      return text(JSON.stringify(list, null, 2));
    }

    case 'get_bottle_variant': {
      const variant = BOTTLE_VARIANTS.find(v => v.id === args.variant_id);
      if (!variant) return error(`Variant "${args.variant_id}" not found. Valid IDs: B01–B25`);
      const params = variantToParams(variant);
      const standards = matchStandards('bottle', 'PLA + enzyme additive system');
      return text(JSON.stringify({
        variant: variant.id,
        concept: variant.concept,
        morph: variant.morph,
        material: 'PLA + enzyme additive system',
        document: `${variant.id}-${variant.concept.toLowerCase().replace(/\s+/g, '-')}.SLDPRT`,
        parameters: params,
        applicableStandards: standards.map(s => s.id)
      }, null, 2));
    }

    case 'push_bottle_variant_to_solidworks': {
      const variant = BOTTLE_VARIANTS.find(v => v.id === args.variant_id);
      if (!variant) return error(`Variant "${args.variant_id}" not found. Valid IDs: B01–B25`);
      const params = variantToParams(variant);
      try {
        const payload = {
          concept: {
            title: `${variant.id} — ${variant.concept}`,
            family: 'bottle',
            material: 'PLA + enzyme additive system',
            features: ['Bottle body', 'Neck finish', 'Base push-up', 'Label panel']
          },
          parameters: params.map(p => ({ ...p, source: 'Variant' })),
          revision: 1,
          solidworksIntent: {
            documentType: 'part',
            rebuildMode: 'parametric',
            operations: [
              { order: 1, name: 'Base loft', action: 'create_or_update' },
              { order: 2, name: 'Neck finish', action: 'create_or_update' },
              { order: 3, name: 'Surface features', action: 'create_or_update' }
            ]
          }
        };
        const data = await bridgePost('/api/model', payload);
        return text(`Pushed ${variant.id} (${variant.concept}) to SolidWorks.\n\n${JSON.stringify(data, null, 2)}`);
      } catch (err) {
        return error(`Push failed for ${variant.id}: ${err.message}`);
      }
    }

    case 'export_design_table_csv': {
      const params = args.parameters || [];
      const headers = ['configuration', 'parameter', 'label', 'value', 'unit', 'swDimension'];
      const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = params.map(p => [
        esc('Default'), esc(p.key), esc(p.label || p.key),
        esc(p.value), esc(p.unit || 'mm'), esc(p.swDimension || p.key)
      ].join(','));
      return text([headers.join(','), ...rows].join('\n'));
    }

    default:
      return error(`Unknown tool: ${name}`);
  }
}

// ── MCP response helpers ─────────────────────────────────────────────────────
function text(str) {
  return { content: [{ type: 'text', text: String(str) }] };
}
function error(str) {
  return { content: [{ type: 'text', text: String(str) }], isError: true };
}

// ── JSON-RPC 2.0 stdio transport ─────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

rl.on('line', async line => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try { msg = JSON.parse(trimmed); } catch { return; }

  const { id, method, params } = msg;

  if (method === 'initialize') {
    send({ jsonrpc: '2.0', id, result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'solidworks-cad-studio', version: '1.0.0' }
    }});

  } else if (method === 'initialized') {
    // notification — no response needed

  } else if (method === 'tools/list') {
    send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });

  } else if (method === 'tools/call') {
    const toolName = params?.name;
    const toolArgs = params?.arguments || {};
    try {
      const result = await callTool(toolName, toolArgs);
      send({ jsonrpc: '2.0', id, result });
    } catch (err) {
      send({ jsonrpc: '2.0', id, error: { code: -32603, message: err.message } });
    }

  } else if (method === 'ping') {
    send({ jsonrpc: '2.0', id, result: {} });

  } else if (id !== undefined) {
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
  }
});

process.stderr.write(`SolidWorks AI CAD Studio MCP server started (bridge: ${BRIDGE_URL})\n`);
