const STORAGE_KEY = "solidworks-ai-cad-studio-v1";
const DEFAULT_PROMPT = "Design a portable diagnostic enclosure for a point-of-care diagnostic device with cleanable surfaces, PCB mounting, cable exits, and a manufacturable two-part housing.";
const DEFAULT_REQUIREMENTS = `Project: Portable diagnostic enclosure
Requirements:
- Overall length 170 mm
- Overall width 95 mm
- Overall height 42 mm
- Wall thickness 2.5 mm
- Corner radius 8 mm
- Must fit a 120 x 70 mm PCB
- Include four M3 fastener bosses
- Material should be medical-grade PC-ABS
- Prioritize drop resistance, easy cleaning, and injection-molding readiness`;

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

const CAD_LIBRARY = {
  enclosure: {
    label: "Enclosure",
    defaultTitle: "Portable diagnostic enclosure",
    defaultMaterial: "PC-ABS",
    parameters: [
      { key: "length", label: "Overall length", unit: "mm", fallback: 170, aliases: ["overall length", "length"] },
      { key: "width", label: "Overall width", unit: "mm", fallback: 95, aliases: ["overall width", "width"] },
      { key: "height", label: "Overall height", unit: "mm", fallback: 42, aliases: ["overall height", "height"] },
      { key: "wall", label: "Wall thickness", unit: "mm", fallback: 2.5, aliases: ["wall thickness", "thickness"] },
      { key: "cornerRadius", label: "Corner radius", unit: "mm", fallback: 8, aliases: ["corner radius", "fillet radius", "radius"] },
      { key: "pcbLength", label: "PCB length", unit: "mm", fallback: 120, aliases: ["pcb length", "board length"] },
      { key: "pcbWidth", label: "PCB width", unit: "mm", fallback: 70, aliases: ["pcb width", "board width"] },
      { key: "bossCount", label: "Fastener bosses", unit: "count", fallback: 4, aliases: ["fastener bosses", "mounting bosses", "bosses"], type: "count" }
    ],
    baseFeatures: ["Base shell", "Lid interface", "PCB standoffs", "Fastener bosses", "Cable exit", "Drafted side walls"],
    simulationLabels: ["Drop and latch check", "Thermal clearance review", "Draft and tooling review"],
    drawingViews: ["General arrangement", "Section A-A", "Boss detail"],
    renderingPreset: "Studio isometric with matte polymer finish"
  },
  bottle: {
    label: "Bottle",
    defaultTitle: "Sustainable bottle concept",
    defaultMaterial: "PET",
    parameters: [
      { key: "height", label: "Overall height", unit: "mm", fallback: 210, aliases: ["overall height", "height"] },
      { key: "bodyDiameter", label: "Body diameter", unit: "mm", fallback: 68, aliases: ["body diameter", "diameter"] },
      { key: "neckDiameter", label: "Neck diameter", unit: "mm", fallback: 28, aliases: ["neck diameter"] },
      { key: "wall", label: "Wall thickness", unit: "mm", fallback: 1.8, aliases: ["wall thickness", "thickness"] },
      { key: "baseRadius", label: "Base radius", unit: "mm", fallback: 6, aliases: ["base radius", "corner radius"] },
      { key: "volume", label: "Target volume", unit: "ml", fallback: 500, aliases: ["volume", "capacity"] }
    ],
    baseFeatures: ["Bottle body", "Neck finish", "Base push-up", "Label panel", "Cap interface"],
    simulationLabels: ["Top-load estimate", "Panel collapse review", "Blow-molding feasibility"],
    drawingViews: ["Elevation", "Neck finish detail", "Base section"],
    renderingPreset: "Consumer packaging hero render"
  },
  bracket: {
    label: "Bracket",
    defaultTitle: "Mounting bracket",
    defaultMaterial: "Aluminum 6061-T6",
    parameters: [
      { key: "baseLength", label: "Base length", unit: "mm", fallback: 120, aliases: ["base length", "length"] },
      { key: "baseWidth", label: "Base width", unit: "mm", fallback: 48, aliases: ["base width", "width"] },
      { key: "legHeight", label: "Leg height", unit: "mm", fallback: 62, aliases: ["leg height", "height"] },
      { key: "thickness", label: "Thickness", unit: "mm", fallback: 4, aliases: ["thickness", "wall thickness"] },
      { key: "holeDiameter", label: "Hole diameter", unit: "mm", fallback: 8, aliases: ["hole diameter"] },
      { key: "holeSpacing", label: "Hole spacing", unit: "mm", fallback: 72, aliases: ["hole spacing"] },
      { key: "filletRadius", label: "Fillet radius", unit: "mm", fallback: 5, aliases: ["fillet radius", "corner radius"] }
    ],
    baseFeatures: ["Base plate", "Vertical leg", "Mounting holes", "Filleted bend", "Stiffening rib"],
    simulationLabels: ["Static load margin", "Deflection review", "Machining setup review"],
    drawingViews: ["Orthographic set", "Hole pattern detail", "Bend section"],
    renderingPreset: "Machined metal studio render"
  },
  tray: {
    label: "Tray",
    defaultTitle: "Parametric tray concept",
    defaultMaterial: "PP",
    parameters: [
      { key: "length", label: "Overall length", unit: "mm", fallback: 220, aliases: ["overall length", "length"] },
      { key: "width", label: "Overall width", unit: "mm", fallback: 140, aliases: ["overall width", "width"] },
      { key: "depth", label: "Depth", unit: "mm", fallback: 32, aliases: ["depth", "height"] },
      { key: "wall", label: "Wall thickness", unit: "mm", fallback: 2.2, aliases: ["wall thickness", "thickness"] },
      { key: "cornerRadius", label: "Corner radius", unit: "mm", fallback: 10, aliases: ["corner radius", "radius"] },
      { key: "pocketCount", label: "Pocket count", unit: "count", fallback: 6, aliases: ["pocket count", "cavity count"], type: "count" }
    ],
    baseFeatures: ["Outer tray shell", "Pocket array", "Drafted pockets", "Stacking lip", "Label zone"],
    simulationLabels: ["Stack compression estimate", "Thermal shrink review", "Forming draft review"],
    drawingViews: ["Top plan", "Pocket section", "Stacking lip detail"],
    renderingPreset: "Packaging tray presentation render"
  },
  assembly: {
    label: "Assembly",
    defaultTitle: "Parametric assembly concept",
    defaultMaterial: "Mixed materials",
    parameters: [
      { key: "length", label: "Overall length", unit: "mm", fallback: 180, aliases: ["overall length", "length"] },
      { key: "width", label: "Overall width", unit: "mm", fallback: 90, aliases: ["overall width", "width"] },
      { key: "height", label: "Overall height", unit: "mm", fallback: 60, aliases: ["overall height", "height"] },
      { key: "clearance", label: "Assembly clearance", unit: "mm", fallback: 1.5, aliases: ["clearance"] },
      { key: "fastenerCount", label: "Fastener count", unit: "count", fallback: 4, aliases: ["fastener count", "screws"], type: "count" },
      { key: "filletRadius", label: "Fillet radius", unit: "mm", fallback: 6, aliases: ["fillet radius", "corner radius"] }
    ],
    baseFeatures: ["Primary housing", "Secondary insert", "Fastening scheme", "Alignment features", "Access panel"],
    simulationLabels: ["Assembly interference review", "Stiffness estimate", "Manufacturing readiness review"],
    drawingViews: ["Assembly overview", "Exploded detail", "Critical section"],
    renderingPreset: "Exploded concept render"
  }
};

let state = loadState();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeState(saved || {});
  } catch {
    return normalizeState({});
  }
}

function createDefaultState() {
  const blueprint = buildModelBlueprint(DEFAULT_PROMPT, DEFAULT_REQUIREMENTS, "auto");
  return {
    prompt: DEFAULT_PROMPT,
    requirementText: DEFAULT_REQUIREMENTS,
    selectedTemplate: "auto",
    uploadedFiles: [],
    revision: 3,
    viewport: "isometric",
    concept: blueprint.concept,
    requirementItems: blueprint.requirements,
    parameters: blueprint.parameters,
    simulations: [],
    drawings: [],
    renderings: [],
    bridge: {
      connection: "Prototype ready",
      host: "Windows desktop host + SolidWorks API",
      targetDoc: `${sanitizeFilename(blueprint.concept.title)}.SLDPRT`,
      lastDeployAt: "",
      lastAction: "Waiting for model generation"
    },
    conversations: [
      {
        role: "agent",
        title: "AI copilot",
        message: "Paste or upload requirements and I will propose a parameterized concept, feature tree, deployment package, and downstream studies for SolidWorks.",
        timestamp: `${new Date().toISOString()}`
      }
    ],
    changeLog: [
      {
        title: "Standalone CAD studio scaffolded",
        detail: "Prototype mode is ready. Production deployment still requires a Windows desktop shell and a SolidWorks automation bridge.",
        timestamp: `${new Date().toISOString()}`
      }
    ]
  };
}

function normalizeState(saved) {
  const defaults = createDefaultState();
  return {
    ...defaults,
    ...saved,
    concept: { ...defaults.concept, ...(saved.concept || {}) },
    bridge: { ...defaults.bridge, ...(saved.bridge || {}) },
    uploadedFiles: Array.isArray(saved.uploadedFiles) ? saved.uploadedFiles : defaults.uploadedFiles,
    requirementItems: Array.isArray(saved.requirementItems) && saved.requirementItems.length ? saved.requirementItems : defaults.requirementItems,
    parameters: Array.isArray(saved.parameters) && saved.parameters.length ? saved.parameters : defaults.parameters,
    conversations: Array.isArray(saved.conversations) && saved.conversations.length ? saved.conversations : defaults.conversations,
    changeLog: Array.isArray(saved.changeLog) && saved.changeLog.length ? saved.changeLog : defaults.changeLog,
    simulations: Array.isArray(saved.simulations) ? saved.simulations : [],
    drawings: Array.isArray(saved.drawings) ? saved.drawings : [],
    renderings: Array.isArray(saved.renderings) ? saved.renderings : []
  };
}

function persist(message = "") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
  if (message) showToast(message);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);
}

function sanitizeFilename(value = "model") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "model";
}

function timestampLabel(value) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function nextId(prefix, collection) {
  const max = collection.reduce((value, item) => {
    const match = String(item.id || "").match(/(\d+)$/);
    return Math.max(value, match ? Number(match[1]) : 0);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function round(value, digits = 1) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatValue(value, unit) {
  if (unit === "count") return `${value}`;
  if (unit === "ml") return `${round(value, 0)} ml`;
  return `${round(value, value % 1 === 0 ? 0 : 1)} ${unit}`;
}

function getParam(key, fallback = 0) {
  const parameter = state.parameters.find(item => item.key === key);
  return parameter ? Number(parameter.value) : fallback;
}

function inferFamily(text, selectedTemplate) {
  if (selectedTemplate && selectedTemplate !== "auto") return selectedTemplate;
  const draft = text.toLowerCase();
  if (/(enclosure|housing|case|portable diagnostic|device shell)/.test(draft)) return "enclosure";
  if (/(bottle|vial|container|jar|neck finish)/.test(draft)) return "bottle";
  if (/(bracket|mount|fixture|clamp)/.test(draft)) return "bracket";
  if (/(tray|insert|package tray|blister|cavity)/.test(draft)) return "tray";
  return "assembly";
}

function extractRequirements(text) {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .filter(line => !/^requirements:?$/i.test(line));
  const preferred = lines.filter(line => !/^project:/i.test(line));
  if (preferred.length >= 3) return [...new Set(preferred)].slice(0, 8);
  return text
    .split(/[.;]\s+/)
    .map(segment => segment.trim())
    .filter(segment => segment.length > 12)
    .slice(0, 8);
}

function extractTitle(prompt, text, fallback) {
  const fromProject = text.match(/^project:\s*(.+)$/im);
  if (fromProject) return fromProject[1].trim();
  const seed = prompt.replace(/^(design|create|generate)\s+/i, "").split(/[.!?]/)[0].trim();
  return seed ? seed.charAt(0).toUpperCase() + seed.slice(1) : fallback;
}

function extractMaterial(text, fallback) {
  const entries = [
    ["pc-abs", "PC-ABS"],
    ["abs", "ABS"],
    ["petg", "PETG"],
    ["pet", "PET"],
    ["pp", "PP"],
    ["aluminum", "Aluminum 6061-T6"],
    ["stainless", "Stainless steel"],
    ["medical-grade pc-abs", "Medical-grade PC-ABS"]
  ];
  const match = entries.find(([token]) => text.toLowerCase().includes(token));
  return match ? match[1] : fallback;
}

function convertUnit(value, fromUnit, targetUnit) {
  if (!fromUnit || fromUnit === targetUnit) return value;
  const from = fromUnit.toLowerCase();
  if (targetUnit === "mm") {
    if (from === "cm") return value * 10;
    if (from === "in" || from === "inch" || from === "inches") return value * 25.4;
  }
  if (targetUnit === "ml") return value;
  return value;
}

function extractNumber(text, aliases, fallback, targetUnit) {
  for (const alias of aliases) {
    const token = alias.replace(/\s+/g, "\\s+");
    const patterns = [
      new RegExp(`${token}[^\\d]{0,18}(\\d+(?:\\.\\d+)?)\\s*(mm|cm|in|inch|inches|ml)?`, "i"),
      new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(mm|cm|in|inch|inches|ml)?[^\\n]{0,18}${token}`, "i")
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          value: round(convertUnit(Number(match[1]), match[2] || targetUnit, targetUnit), 1),
          source: "Requirement"
        };
      }
    }
  }
  return { value: fallback, source: "AI assumption" };
}

function extractCount(text, aliases, fallback) {
  for (const alias of aliases) {
    const token = alias.replace(/\s+/g, "\\s+");
    const patterns = [
      new RegExp(`${token}[^\\da-z]{0,18}(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)`, "i"),
      new RegExp(`(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)[^\\n]{0,18}${token}`, "i")
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const raw = match[1].toLowerCase();
        return { value: NUMBER_WORDS[raw] || Number(raw), source: "Requirement" };
      }
    }
  }
  return { value: fallback, source: "AI assumption" };
}

function buildFeatures(baseFeatures, text) {
  const featureFlags = [
    [/snap/i, "Snap-fit closure"],
    [/(cable|wire|connector)/i, "Cable routing feature"],
    [/vent/i, "Vent pattern"],
    [/gasket|seal/i, "Gasket channel"],
    [/window|display/i, "Inspection window"],
    [/handle/i, "Carry handle"],
    [/rib/i, "Stiffening ribs"],
    [/label/i, "Label landing zone"]
  ];
  const extras = featureFlags.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
  return [...new Set([...baseFeatures, ...extras])].slice(0, 8);
}

function buildModelBlueprint(prompt, requirementText, selectedTemplate) {
  const combined = `${prompt}\n${requirementText}`.trim();
  const family = inferFamily(combined, selectedTemplate);
  const library = CAD_LIBRARY[family];
  const parameters = library.parameters.map(definition => {
    const result = definition.type === "count"
      ? extractCount(combined, definition.aliases, definition.fallback)
      : extractNumber(combined, definition.aliases, definition.fallback, definition.unit);
    return {
      key: definition.key,
      label: definition.label,
      unit: definition.unit,
      value: result.value,
      source: result.source
    };
  });

  const title = extractTitle(prompt, requirementText, library.defaultTitle);
  const material = extractMaterial(combined, library.defaultMaterial);
  const requirements = extractRequirements(requirementText);
  const features = buildFeatures(library.baseFeatures, combined);
  const mainDimensions = parameters.slice(0, 3).map(item => formatValue(item.value, item.unit)).join(" × ");
  const assumptions = parameters
    .filter(item => item.source !== "Requirement")
    .slice(0, 4)
    .map(item => `${item.label} defaulted to ${formatValue(item.value, item.unit)} for the initial parametric setup.`);
  const summary = `AI translated the brief into a ${library.label.toLowerCase()} concept sized around ${mainDimensions}. The baseline material is ${material}, and the feature tree is staged for direct downstream editing inside SolidWorks.`;

  return {
    concept: {
      family,
      familyLabel: library.label,
      title,
      material,
      summary,
      featureTree: features,
      assumptions,
      drawingViews: library.drawingViews,
      renderingPreset: library.renderingPreset,
      agentChecklist: [
        `Lock the ${library.label.toLowerCase()} envelope before releasing drawings.`,
        `Validate ${material} against the target manufacturing route.`,
        `Run ${library.simulationLabels[0].toLowerCase()} after the next parameter revision.`,
        `Confirm mounting, sealing, and service access in the native SolidWorks session.`
      ]
    },
    requirements,
    parameters
  };
}

function badgeClass(value) {
  const normalized = String(value).toLowerCase();
  if (["pass", "generated", "ready", "deployed"].includes(normalized)) return "success";
  if (["review", "queued"].includes(normalized)) return "warning";
  if (["hold"].includes(normalized)) return "danger";
  return "neutral";
}

function addConversation(role, title, message) {
  state.conversations.push({
    role,
    title,
    message,
    timestamp: new Date().toISOString()
  });
  state.conversations = state.conversations.slice(-8);
}

function addLog(title, detail) {
  state.changeLog.unshift({
    title,
    detail,
    timestamp: new Date().toISOString()
  });
  state.changeLog = state.changeLog.slice(0, 12);
}

function syncDraftFromDom() {
  const promptInput = document.getElementById("promptInput");
  const requirementInput = document.getElementById("requirementText");
  const templateSelect = document.getElementById("templateSelect");
  const orientationSelect = document.getElementById("orientationSelect");
  if (promptInput) state.prompt = promptInput.value.trim();
  if (requirementInput) state.requirementText = requirementInput.value.trim();
  if (templateSelect) state.selectedTemplate = templateSelect.value;
  if (orientationSelect) state.viewport = orientationSelect.value;
}

function regenerateSummary() {
  const library = CAD_LIBRARY[state.concept.family] || CAD_LIBRARY.assembly;
  const dimensionLine = state.parameters.slice(0, 3).map(item => formatValue(item.value, item.unit)).join(" × ");
  state.concept.summary = `The current ${library.label.toLowerCase()} revision is sized around ${dimensionLine}, using ${state.concept.material} as the baseline material. This revision is ready for SolidWorks-side refinement, study setup, and downstream artifact generation.`;
}

function generateModel() {
  syncDraftFromDom();
  const blueprint = buildModelBlueprint(state.prompt, state.requirementText, state.selectedTemplate);
  state.revision += 1;
  state.concept = blueprint.concept;
  state.parameters = blueprint.parameters;
  state.requirementItems = blueprint.requirements;
  state.bridge.connection = "Model ready";
  state.bridge.targetDoc = `${sanitizeFilename(state.concept.title)}.SLDPRT`;
  state.bridge.lastAction = `Revision R${String(state.revision).padStart(2, "0")} generated from the current brief`;
  addConversation("user", "Design brief", state.prompt || "Requirements uploaded");
  addConversation("agent", "Model plan", `Created a ${state.concept.familyLabel.toLowerCase()} with ${state.parameters.length} live parameters and ${state.requirementItems.length} extracted requirements.`);
  addLog("AI generated parametric concept", `${state.concept.title} is ready for SolidWorks deployment as ${state.bridge.targetDoc}.`);
  persist("AI model plan generated");
}

function applyParameterChanges() {
  let changed = 0;
  state.parameters = state.parameters.map(parameter => {
    const input = document.getElementById(`param-${parameter.key}`);
    if (!input) return parameter;
    const nextValue = Number(input.value);
    if (!Number.isFinite(nextValue)) return parameter;
    if (round(nextValue, 2) !== round(Number(parameter.value), 2)) changed += 1;
    return {
      ...parameter,
      value: nextValue,
      source: round(nextValue, 2) !== round(Number(parameter.value), 2) ? "Manual override" : parameter.source
    };
  });

  if (!changed) {
    showToast("No parameter edits detected");
    return;
  }

  state.revision += 1;
  regenerateSummary();
  state.bridge.connection = "Parameters updated";
  state.bridge.lastAction = `${changed} parameter edits applied to revision R${String(state.revision).padStart(2, "0")}`;
  addConversation("agent", "Parameter update", `Applied ${changed} parameter edits and refreshed the current model envelope.`);
  addLog("Parameters revised", `${changed} parameter values changed before the next SolidWorks deployment.`);
  persist("Parameter changes applied");
}

function deployModel() {
  syncDraftFromDom();
  state.bridge.connection = "Deployed";
  state.bridge.lastDeployAt = new Date().toISOString();
  state.bridge.lastAction = `Revision R${String(state.revision).padStart(2, "0")} packaged for the SolidWorks bridge`;
  addConversation("agent", "Deployment package", "Prepared the current parameters, feature tree, and target document for the Windows-side SolidWorks automation bridge.");
  addLog("Model deployed to bridge", `${state.bridge.targetDoc} prepared for native SolidWorks update on the desktop host.`);
  persist("Model packaged for the SolidWorks bridge");
}

function runSimulations() {
  const span = Math.max(
    getParam("length", getParam("baseLength", 160)),
    getParam("width", getParam("baseWidth", 80)),
    getParam("height", getParam("legHeight", getParam("depth", 40)))
  );
  const wall = getParam("wall", getParam("thickness", 2.5));
  const radius = getParam("cornerRadius", getParam("filletRadius", 5));
  const clearance = getParam("height", getParam("depth", 42)) - wall * 4;
  const structural = round(clamp(1.05 + wall * 0.22 + radius * 0.02 - span * 0.0015, 0.85, 2.5), 2);
  const manufacturability = Math.round(clamp(84 + radius * 1.4 - wall * 4.5, 58, 98));
  const solverNames = (CAD_LIBRARY[state.concept.family] || CAD_LIBRARY.assembly).simulationLabels;

  state.simulations = [
    {
      id: nextId("SIM", state.simulations),
      title: solverNames[0],
      status: structural >= 1.45 ? "Pass" : structural >= 1.2 ? "Review" : "Hold",
      metric: `Safety factor ${structural}`,
      detail: "Static estimate generated from the current envelope and wall section.",
      generatedAt: new Date().toISOString()
    },
    {
      id: nextId("SIM", [...state.simulations, { id: "SIM-999" }]),
      title: solverNames[1],
      status: clearance >= 24 ? "Pass" : "Review",
      metric: `Clearance reserve ${round(clearance, 1)} mm`,
      detail: "Reserved internal clearance after subtracting shell thickness and mounting stack-up.",
      generatedAt: new Date().toISOString()
    },
    {
      id: nextId("SIM", [...state.simulations, { id: "SIM-999" }, { id: "SIM-998" }]),
      title: solverNames[2],
      status: manufacturability >= 86 ? "Pass" : manufacturability >= 74 ? "Review" : "Hold",
      metric: `Readiness ${manufacturability}/100`,
      detail: "Manufacturing-readiness proxy covering section thickness, fillets, and draft-friendliness.",
      generatedAt: new Date().toISOString()
    }
  ];

  state.bridge.lastAction = `Simulation pack generated for revision R${String(state.revision).padStart(2, "0")}`;
  addConversation("agent", "Simulation plan", `Generated ${state.simulations.length} study cards from the current model revision.`);
  addLog("Simulation pack created", `${state.simulations.length} downstream study cards are ready for SolidWorks Simulation or a connected solver.`);
  persist("Simulation pack generated");
}

function generateDrawings() {
  state.drawings.unshift({
    id: nextId("DRW", state.drawings),
    title: `${state.concept.title} drawing package`,
    status: "Generated",
    detail: `${state.concept.drawingViews.join(" · ")}`,
    generatedAt: new Date().toISOString()
  });
  state.bridge.lastAction = `Drawing pack created for revision R${String(state.revision).padStart(2, "0")}`;
  addLog("Drawing pack created", `Generated a 2D drawing package for ${state.bridge.targetDoc}.`);
  persist("Drawing pack generated");
}

function generateRenderings() {
  state.renderings.unshift({
    id: nextId("RND", state.renderings),
    title: `${state.concept.title} render set`,
    status: "Generated",
    detail: state.concept.renderingPreset,
    generatedAt: new Date().toISOString()
  });
  state.bridge.lastAction = `Render set created for revision R${String(state.revision).padStart(2, "0")}`;
  addLog("Rendering set created", `Prepared a visual presentation set using the ${state.concept.renderingPreset.toLowerCase()}.`);
  persist("Rendering set generated");
}

async function handleRequirementUpload(fileList) {
  const files = [...fileList];
  if (!files.length) return;

  const uploaded = [];
  const parsedChunks = [];

  for (const file of files) {
    const textLike = /^(text\/|application\/json)/.test(file.type) || /\.(txt|md|json|csv)$/i.test(file.name);
    let status = "Metadata stored";
    if (textLike) {
      const content = (await file.text()).trim();
      if (content) {
        parsedChunks.push(`File: ${file.name}\n${content}`);
        status = "Parsed into brief";
      }
    }

    uploaded.push({
      id: nextId("FILE", [...state.uploadedFiles, ...uploaded]),
      name: file.name,
      size: file.size,
      status,
      uploadedAt: new Date().toISOString()
    });
  }

  state.uploadedFiles = [...uploaded, ...state.uploadedFiles].slice(0, 10);
  if (parsedChunks.length) {
    state.requirementText = [state.requirementText, ...parsedChunks].filter(Boolean).join("\n\n");
  }
  addConversation("agent", "Requirements ingested", parsedChunks.length
    ? `Parsed ${parsedChunks.length} text-based upload${parsedChunks.length > 1 ? "s" : ""} into the active CAD brief.`
    : "Stored the uploaded file metadata. Production PDF and DOCX parsing belongs in the backend bridge.");
  addLog("Requirement files added", `${files.length} file${files.length > 1 ? "s were" : " was"} attached to the active design brief.`);
  persist(parsedChunks.length ? "Requirement files added to the design brief" : "File metadata stored");
}

function exportSnapshot() {
  syncDraftFromDom();
  const payload = {
    exportedAt: new Date().toISOString(),
    project: "SolidWorks AI CAD Studio",
    ...state
  };
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  link.download = `${sanitizeFilename(state.concept.title)}-workspace-snapshot.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  showToast("Workspace snapshot exported");
}

function loadDemo() {
  state = createDefaultState();
  persist("Demo brief loaded");
}

function renderMetrics() {
  const artifactCount = state.simulations.length + state.drawings.length + state.renderings.length;
  const metrics = [
    [state.requirementItems.length, "Requirements in scope", `${state.uploadedFiles.length} uploaded file${state.uploadedFiles.length === 1 ? "" : "s"}`],
    [state.concept.familyLabel, "Model family", state.concept.title],
    [`R${String(state.revision).padStart(2, "0")}`, "Current revision", state.bridge.lastAction],
    [artifactCount, "Generated outputs", `${state.simulations.length} simulations · ${state.drawings.length} drawings · ${state.renderings.length} renderings`]
  ];
  document.getElementById("metricGrid").innerHTML = metrics.map(([value, label, detail]) => `
    <article class="metric-card">
      <span class="eyebrow">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(detail)}</span>
    </article>
  `).join("");
}

function renderCopilot() {
  document.getElementById("copilotPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">AI copilot</span>
        <h2>Idea and requirements synthesis</h2>
      </div>
      <span class="badge neutral">Human review required</span>
    </div>
    <div class="copilot-body">
      <div class="field-stack">
        <div>
          <label for="promptInput">Design prompt</label>
          <textarea id="promptInput">${escapeHtml(state.prompt)}</textarea>
        </div>
        <div class="panel-actions">
          <button class="button primary small" data-action="generate-model">Generate model</button>
          <button class="button secondary small" data-action="run-simulations">Run simulations</button>
        </div>
        <div class="support-list">
          ${state.concept.agentChecklist.map(item => `
            <article class="support-card">
              <small>AI recommendation</small>
              <strong>${escapeHtml(item)}</strong>
            </article>
          `).join("")}
        </div>
        <div>
          <label>Conversation</label>
          <div class="conversation-list">
            ${state.conversations.slice().reverse().map(item => `
              <article class="conversation-item ${escapeHtml(item.role)}">
                <small>${escapeHtml(item.role.toUpperCase())} · ${escapeHtml(timestampLabel(item.timestamp))}</small>
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.message)}</p>
              </article>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderWorkspace() {
  document.getElementById("workspacePanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Embedded workspace concept</span>
        <h2>SolidWorks model window</h2>
      </div>
      <span class="badge ${badgeClass(state.bridge.connection)}">${escapeHtml(state.bridge.connection)}</span>
    </div>
    <div class="workspace-body">
      <div class="sw-note">This is a browser-side prototype of the native embed experience. Production should host the real SolidWorks window in a Windows desktop shell and drive updates through the SolidWorks API bridge.</div>
      <div class="sw-shell">
        <aside class="feature-tree">
          <strong>FeatureManager</strong>
          ${state.concept.featureTree.map((item, index) => `<div class="feature-node">${index + 1}. ${escapeHtml(item)}</div>`).join("")}
        </aside>
        <div class="sw-window">
          <div class="sw-bar">
            <div class="sw-dots"><span></span><span></span><span></span></div>
            <strong>${escapeHtml(state.bridge.targetDoc)}</strong>
          </div>
          <div class="sw-tabs">
            <span class="active">Part Studio</span>
            <span>Simulation</span>
            <span>Drawing</span>
            <span>Render</span>
          </div>
          <div class="sw-stage">${renderViewportSvg()}</div>
          <div class="sw-footer">
            <span>Orientation: ${escapeHtml(state.viewport)}</span>
            <span>Material: ${escapeHtml(state.concept.material)}</span>
            <span>Last deploy: ${escapeHtml(timestampLabel(state.bridge.lastDeployAt))}</span>
          </div>
        </div>
      </div>
      <div class="sw-stats">
        <article class="window-stat">
          <span>Design summary</span>
          <strong>${escapeHtml(state.concept.familyLabel)}</strong>
          <p>${escapeHtml(state.concept.summary)}</p>
        </article>
        <article class="window-stat">
          <span>Requirements mapped</span>
          <strong>${state.requirementItems.length}</strong>
          <p>${escapeHtml(state.requirementItems.slice(0, 2).join(" · "))}</p>
        </article>
        <article class="window-stat">
          <span>Live parameters</span>
          <strong>${state.parameters.length}</strong>
          <p>${escapeHtml(state.parameters.filter(item => item.source === "Requirement").length)} from the uploaded brief</p>
        </article>
      </div>
    </div>
  `;
}

function renderRequirements() {
  document.getElementById("requirementsPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Requirement intake</span>
        <h2>Upload and structure the brief</h2>
      </div>
    </div>
    <div class="requirements-body">
      <div class="field-stack">
        <div>
          <label for="templateSelect">Model template</label>
          <select id="templateSelect">
            <option value="auto" ${state.selectedTemplate === "auto" ? "selected" : ""}>Auto-detect</option>
            <option value="enclosure" ${state.selectedTemplate === "enclosure" ? "selected" : ""}>Enclosure</option>
            <option value="bottle" ${state.selectedTemplate === "bottle" ? "selected" : ""}>Bottle</option>
            <option value="bracket" ${state.selectedTemplate === "bracket" ? "selected" : ""}>Bracket</option>
            <option value="tray" ${state.selectedTemplate === "tray" ? "selected" : ""}>Tray</option>
            <option value="assembly" ${state.selectedTemplate === "assembly" ? "selected" : ""}>Assembly</option>
          </select>
        </div>
        <div>
          <label for="requirementText">Requirement brief</label>
          <textarea id="requirementText">${escapeHtml(state.requirementText)}</textarea>
        </div>
        <div>
          <label for="requirementFiles">Requirement uploads</label>
          <input id="requirementFiles" type="file" multiple>
          <p class="helper-text">This prototype parses text-like uploads such as <code>.txt</code>, <code>.md</code>, and <code>.json</code>. PDF and DOCX parsing should live in the production bridge service.</p>
        </div>
        <div class="uploaded-list">
          ${state.uploadedFiles.length ? state.uploadedFiles.map(file => `
            <article class="uploaded-card">
              <small>${escapeHtml(timestampLabel(file.uploadedAt))} · ${Math.max(1, Math.round(file.size / 1024))} KB</small>
              <strong>${escapeHtml(file.name)}</strong>
              <p>${escapeHtml(file.status)}</p>
            </article>
          `).join("") : '<div class="empty-state">No uploaded files yet. Paste a brief or attach a text-based requirement file to seed the model.</div>'}
        </div>
        <div>
          <label>Extracted requirements</label>
          <div class="requirement-list">
            ${state.requirementItems.map(item => `
              <article class="requirement-item">
                <small>Mapped to CAD logic</small>
                <strong>${escapeHtml(item)}</strong>
              </article>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderOperations() {
  document.getElementById("operationsPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Bridge orchestration</span>
        <h2>Deploy and downstream actions</h2>
      </div>
    </div>
    <div class="operations-body">
      <div class="field-stack">
        <div>
          <label for="orientationSelect">Viewport orientation</label>
          <select id="orientationSelect">
            <option value="isometric" ${state.viewport === "isometric" ? "selected" : ""}>Isometric</option>
            <option value="front" ${state.viewport === "front" ? "selected" : ""}>Front</option>
            <option value="top" ${state.viewport === "top" ? "selected" : ""}>Top</option>
            <option value="exploded" ${state.viewport === "exploded" ? "selected" : ""}>Exploded</option>
          </select>
        </div>
        <div class="connector-list">
          <article class="connector-item">
            <small>Bridge state</small>
            <strong>${escapeHtml(state.bridge.connection)}</strong>
            <p>${escapeHtml(state.bridge.lastAction)}</p>
          </article>
          <article class="connector-item">
            <small>Native host</small>
            <strong>${escapeHtml(state.bridge.host)}</strong>
            <p>Desktop-side automation target</p>
          </article>
          <article class="connector-item">
            <small>Target document</small>
            <strong>${escapeHtml(state.bridge.targetDoc)}</strong>
            <p>Part file prepared for deployment</p>
          </article>
          <article class="connector-item">
            <small>Last deploy</small>
            <strong>${escapeHtml(timestampLabel(state.bridge.lastDeployAt))}</strong>
            <p>Most recent bridge package time</p>
          </article>
        </div>
        <div class="operations-grid">
          <button class="button primary" data-action="generate-model">Generate model</button>
          <button class="button secondary" data-action="apply-parameters">Apply parameters</button>
          <button class="button secondary" data-action="deploy-model">Deploy to bridge</button>
          <button class="button secondary" data-action="run-simulations">Run simulations</button>
          <button class="button secondary" data-action="generate-drawings">Generate drawings</button>
          <button class="button secondary" data-action="generate-renderings">Generate renderings</button>
        </div>
        <div class="support-list">
          <article class="support-card">
            <small>Production connector contract</small>
            <strong>1. Parse requirements · 2. Generate parameters · 3. Push SolidWorks feature edits · 4. Run studies · 5. Emit artifacts</strong>
            <p>Those steps should be implemented as desktop-side actions against the SolidWorks API, with this dashboard serving as the orchestration and review surface.</p>
          </article>
        </div>
      </div>
    </div>
  `;
}

function renderParameters() {
  document.getElementById("parametersPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Parametric control</span>
        <h2>Editable dimensions and logic</h2>
      </div>
      <button class="button ghost small" data-action="apply-parameters">Apply parameter changes</button>
    </div>
    <div class="parameters-body">
      <div class="parameter-layout">
        <div class="table-wrap">
          <table class="param-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Value</th>
                <th>Unit</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              ${state.parameters.map(item => `
                <tr>
                  <td>${escapeHtml(item.label)}</td>
                  <td><input id="param-${item.key}" type="number" step="0.1" value="${escapeHtml(item.value)}"></td>
                  <td>${escapeHtml(item.unit)}</td>
                  <td><span class="badge ${badgeClass(item.source === "Requirement" ? "ready" : "queued")}">${escapeHtml(item.source)}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        <div class="support-list">
          <article class="support-card">
            <small>Material baseline</small>
            <strong>${escapeHtml(state.concept.material)}</strong>
            <p>${escapeHtml(state.concept.summary)}</p>
          </article>
          <article class="support-card">
            <small>Assumptions</small>
            <strong>${escapeHtml(state.concept.assumptions.length ? state.concept.assumptions[0] : "No open assumptions on this revision.")}</strong>
            <p>${escapeHtml(state.concept.assumptions.slice(1).join(" "))}</p>
          </article>
        </div>
      </div>
    </div>
  `;
}

function renderArtifacts() {
  const renderArtifactCards = items => items.length
    ? items.map(item => `
      <article class="artifact-card">
        <header>
          <div>
            <small>${escapeHtml(timestampLabel(item.generatedAt))}</small>
            <strong>${escapeHtml(item.title)}</strong>
          </div>
          <span class="badge ${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
        </header>
        <p>${escapeHtml(item.metric || item.detail)}</p>
      </article>
    `).join("")
    : '<div class="empty-state">Nothing generated yet for this category.</div>';

  document.getElementById("artifactsPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Downstream outputs</span>
        <h2>Simulation, drawing, and rendering artifacts</h2>
      </div>
    </div>
    <div class="artifacts-body">
      <div class="artifact-sections">
        <section class="artifact-group">
          <h3>Simulation studies</h3>
          <div class="artifact-list">${renderArtifactCards(state.simulations)}</div>
        </section>
        <section class="artifact-group">
          <h3>Drawing packs</h3>
          <div class="artifact-list">${renderArtifactCards(state.drawings)}</div>
        </section>
        <section class="artifact-group">
          <h3>Render sets</h3>
          <div class="artifact-list">${renderArtifactCards(state.renderings)}</div>
        </section>
      </div>
    </div>
  `;
}

function renderTimeline() {
  document.getElementById("timelinePanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Change log</span>
        <h2>What happened in this workspace</h2>
      </div>
    </div>
    <div class="timeline-body">
      <div class="timeline-list">
        ${state.changeLog.map(item => `
          <article class="timeline-item">
            <small>${escapeHtml(timestampLabel(item.timestamp))}</small>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.detail)}</p>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function renderViewportSvg() {
  const family = state.concept.family;
  const length = getParam("length", getParam("baseLength", 170));
  const width = getParam("width", getParam("baseWidth", getParam("bodyDiameter", 80)));
  const height = getParam("height", getParam("legHeight", getParam("depth", 42)));
  const wall = getParam("wall", getParam("thickness", 2.5));
  const radius = getParam("cornerRadius", getParam("filletRadius", getParam("baseRadius", 6)));

  if (family === "bottle") {
    const bodyWidth = clamp(width * 1.6, 90, 150);
    const neckWidth = clamp(getParam("neckDiameter", 28) * 1.8, 34, 70);
    return `
      <svg viewBox="0 0 420 280" aria-label="Bottle concept preview">
        <defs>
          <linearGradient id="bottleFill" x1="0%" x2="100%">
            <stop offset="0%" stop-color="#74a7b7"/>
            <stop offset="100%" stop-color="#2d6177"/>
          </linearGradient>
        </defs>
        <ellipse cx="210" cy="240" rx="${bodyWidth / 2}" ry="18" fill="rgba(23,55,71,.12)"/>
        <path d="M ${210 - bodyWidth / 2} 215 C ${210 - bodyWidth / 2} 150, ${210 - neckWidth / 2} 138, ${210 - neckWidth / 2} 98 L ${210 - neckWidth / 2} 62 L ${210 + neckWidth / 2} 62 L ${210 + neckWidth / 2} 98 C ${210 + neckWidth / 2} 138, ${210 + bodyWidth / 2} 150, ${210 + bodyWidth / 2} 215 Z" fill="url(#bottleFill)" stroke="#163644" stroke-width="4"/>
        <rect x="${210 - neckWidth / 2 - 8}" y="40" width="${neckWidth + 16}" height="22" rx="6" fill="#24495d" stroke="#163644" stroke-width="4"/>
        <text x="210" y="258" text-anchor="middle" fill="#36596a" font-size="14" font-family="Avenir Next">H ${round(height, 0)} mm · D ${round(getParam("bodyDiameter", width), 0)} mm</text>
      </svg>
    `;
  }

  if (family === "bracket") {
    return `
      <svg viewBox="0 0 420 280" aria-label="Bracket concept preview">
        <defs>
          <linearGradient id="bracketFill" x1="0%" x2="100%">
            <stop offset="0%" stop-color="#d5a05d"/>
            <stop offset="100%" stop-color="#b37531"/>
          </linearGradient>
        </defs>
        <ellipse cx="210" cy="235" rx="118" ry="20" fill="rgba(23,55,71,.12)"/>
        <path d="M 110 85 L 190 85 L 190 165 L 300 165 L 300 205 L 150 205 Q 122 205 122 178 L 122 97 Q 122 85 110 85 Z" fill="url(#bracketFill)" stroke="#6f4a1f" stroke-width="5" />
        <circle cx="165" cy="185" r="11" fill="#fffdf9" stroke="#6f4a1f" stroke-width="4"/>
        <circle cx="250" cy="185" r="11" fill="#fffdf9" stroke="#6f4a1f" stroke-width="4"/>
        <circle cx="168" cy="118" r="11" fill="#fffdf9" stroke="#6f4a1f" stroke-width="4"/>
        <text x="210" y="258" text-anchor="middle" fill="#36596a" font-size="14" font-family="Avenir Next">L ${round(getParam("baseLength", length), 0)} mm · H ${round(getParam("legHeight", height), 0)} mm</text>
      </svg>
    `;
  }

  if (family === "tray") {
    const trayWidth = clamp(length * 0.55, 150, 250);
    const trayHeight = clamp((getParam("depth", height) + width) * 0.28, 80, 130);
    return `
      <svg viewBox="0 0 420 280" aria-label="Tray concept preview">
        <defs>
          <linearGradient id="trayFill" x1="0%" x2="100%">
            <stop offset="0%" stop-color="#8bb5ad"/>
            <stop offset="100%" stop-color="#4f837d"/>
          </linearGradient>
        </defs>
        <ellipse cx="210" cy="238" rx="126" ry="18" fill="rgba(23,55,71,.12)"/>
        <rect x="${210 - trayWidth / 2}" y="${140 - trayHeight / 2}" width="${trayWidth}" height="${trayHeight}" rx="${clamp(radius * 1.5, 12, 26)}" fill="url(#trayFill)" stroke="#285c57" stroke-width="5"/>
        <rect x="${210 - trayWidth / 2 + 18}" y="${140 - trayHeight / 2 + 18}" width="${trayWidth - 36}" height="${trayHeight - 36}" rx="${clamp(radius, 8, 18)}" fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.38)" stroke-width="3"/>
        <g fill="rgba(255,255,255,.22)" stroke="rgba(255,255,255,.42)" stroke-width="2">
          <rect x="140" y="108" width="52" height="34" rx="10"/>
          <rect x="198" y="108" width="52" height="34" rx="10"/>
          <rect x="256" y="108" width="52" height="34" rx="10"/>
        </g>
        <text x="210" y="258" text-anchor="middle" fill="#36596a" font-size="14" font-family="Avenir Next">L ${round(length, 0)} mm · W ${round(width, 0)} mm · D ${round(getParam("depth", height), 0)} mm</text>
      </svg>
    `;
  }

  if (family === "assembly") {
    return `
      <svg viewBox="0 0 420 280" aria-label="Assembly concept preview">
        <defs>
          <linearGradient id="assyFill" x1="0%" x2="100%">
            <stop offset="0%" stop-color="#7da2b0"/>
            <stop offset="100%" stop-color="#365f71"/>
          </linearGradient>
        </defs>
        <ellipse cx="210" cy="238" rx="128" ry="18" fill="rgba(23,55,71,.12)"/>
        <rect x="118" y="118" width="184" height="74" rx="18" fill="url(#assyFill)" stroke="#163644" stroke-width="5"/>
        <rect x="144" y="88" width="132" height="42" rx="14" fill="#d8e5ea" stroke="#456c7c" stroke-width="4"/>
        <circle cx="158" cy="155" r="8" fill="#fffdf9" stroke="#163644" stroke-width="3"/>
        <circle cx="262" cy="155" r="8" fill="#fffdf9" stroke="#163644" stroke-width="3"/>
        <text x="210" y="258" text-anchor="middle" fill="#36596a" font-size="14" font-family="Avenir Next">L ${round(length, 0)} mm · W ${round(width, 0)} mm · H ${round(height, 0)} mm</text>
      </svg>
    `;
  }

  const shellWidth = clamp(length * 0.58, 150, 250);
  const shellHeight = clamp(width * 0.5, 86, 140);
  const pcbWidth = clamp(getParam("pcbLength", 120) * 0.62, 90, 150);
  const pcbHeight = clamp(getParam("pcbWidth", 70) * 0.52, 40, 84);
  return `
    <svg viewBox="0 0 420 280" aria-label="Enclosure concept preview">
      <defs>
        <linearGradient id="enclosureFill" x1="0%" x2="100%">
          <stop offset="0%" stop-color="#6c8fa2"/>
          <stop offset="100%" stop-color="#284f61"/>
        </linearGradient>
      </defs>
      <ellipse cx="210" cy="236" rx="128" ry="18" fill="rgba(23,55,71,.12)"/>
      <rect x="${210 - shellWidth / 2}" y="${140 - shellHeight / 2}" width="${shellWidth}" height="${shellHeight}" rx="${clamp(radius * 1.8, 16, 28)}" fill="url(#enclosureFill)" stroke="#163644" stroke-width="5"/>
      <rect x="${210 - shellWidth / 2 + 18}" y="${140 - shellHeight / 2 + 18}" width="${shellWidth - 36}" height="${shellHeight - 36}" rx="${clamp(radius, 10, 22)}" fill="rgba(255,255,255,.15)" stroke="rgba(255,255,255,.36)" stroke-width="3"/>
      <rect x="${210 - pcbWidth / 2}" y="${140 - pcbHeight / 2}" width="${pcbWidth}" height="${pcbHeight}" rx="10" fill="#d6e5dd" stroke="#5e7f70" stroke-width="3"/>
      <circle cx="${210 - shellWidth / 2 + 28}" cy="${140 - shellHeight / 2 + 28}" r="7" fill="#fffdf9" stroke="#163644" stroke-width="3"/>
      <circle cx="${210 + shellWidth / 2 - 28}" cy="${140 - shellHeight / 2 + 28}" r="7" fill="#fffdf9" stroke="#163644" stroke-width="3"/>
      <circle cx="${210 - shellWidth / 2 + 28}" cy="${140 + shellHeight / 2 - 28}" r="7" fill="#fffdf9" stroke="#163644" stroke-width="3"/>
      <circle cx="${210 + shellWidth / 2 - 28}" cy="${140 + shellHeight / 2 - 28}" r="7" fill="#fffdf9" stroke="#163644" stroke-width="3"/>
      <text x="210" y="258" text-anchor="middle" fill="#36596a" font-size="14" font-family="Avenir Next">L ${round(length, 0)} mm · W ${round(width, 0)} mm · H ${round(height, 0)} mm · t ${round(wall, 1)} mm</text>
    </svg>
  `;
}

function renderChrome() {
  document.getElementById("projectTitle").textContent = state.concept.title;
  document.getElementById("projectSubtitle").textContent = state.concept.summary;
  document.getElementById("revisionLabel").textContent = `R${String(state.revision).padStart(2, "0")}`;
  document.getElementById("connectionLabel").textContent = state.bridge.connection;
}

function render() {
  renderChrome();
  renderMetrics();
  renderCopilot();
  renderWorkspace();
  renderRequirements();
  renderOperations();
  renderParameters();
  renderArtifacts();
  renderTimeline();
}

document.addEventListener("click", event => {
  const action = event.target.closest("[data-action]");
  if (!action) return;

  const type = action.dataset.action;
  if (type === "load-demo") loadDemo();
  if (type === "generate-model") generateModel();
  if (type === "apply-parameters") applyParameterChanges();
  if (type === "deploy-model") deployModel();
  if (type === "run-simulations") runSimulations();
  if (type === "generate-drawings") generateDrawings();
  if (type === "generate-renderings") generateRenderings();
  if (type === "export-snapshot") exportSnapshot();
});

document.addEventListener("change", event => {
  if (event.target.id === "requirementFiles") handleRequirementUpload(event.target.files);
  if (event.target.id === "templateSelect") {
    state.selectedTemplate = event.target.value;
    persist("Model template updated");
  }
  if (event.target.id === "orientationSelect") {
    state.viewport = event.target.value;
    persist("Viewport orientation updated");
  }
});

window.addEventListener("beforeunload", () => {
  syncDraftFromDom();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});

render();
