const STORAGE_KEY = "solidworks-ai-cad-studio-v3";
const SESSION_AI_KEY = "solidworks-ai-openai-key";
const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_BRIDGE_URL = "";
const DEFAULT_AI_ENDPOINT = "";
const DEFAULT_CLOUD_SPACE_URL = "https://my.3dexperience.3ds.com/";
const DEFAULT_XDESIGN_INFO_URL = "https://www.solidworks.com/product/solidworks-xdesign";
const DEFAULT_PROMPT = "Design a portable diagnostic enclosure for a point-of-care diagnostic device.";
const DEFAULT_REQUIREMENTS = `Project: Portable diagnostic enclosure
Overall length 170 mm
Overall width 95 mm
Overall height 42 mm
Wall thickness 2.5 mm
Corner radius 8 mm
Fit a 120 x 70 mm PCB
Include four M3 fastener bosses
Material: medical-grade PC-ABS`;

const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10
};

const MATERIAL_LIBRARY = {
  "PC-ABS": { process: "Injection molding", feasibility: 88, lca: 62, notes: "Strong enclosure baseline; petrochemical resin and end-of-life recovery need review." },
  "Medical-grade PC-ABS": { process: "Injection molding", feasibility: 84, lca: 58, notes: "Good cleanability and impact behavior; verify medical compliance and resin availability." },
  ABS: { process: "Injection molding", feasibility: 82, lca: 55, notes: "Easy to tool and prototype; weaker sustainability profile." },
  PET: { process: "Blow molding", feasibility: 86, lca: 70, notes: "Strong bottle baseline; high recycling familiarity." },
  PETG: { process: "Thermoforming or additive prototyping", feasibility: 76, lca: 61, notes: "Useful for prototypes; production route needs closer review." },
  PP: { process: "Injection molding or thermoforming", feasibility: 81, lca: 68, notes: "Low density and good processability; stiffness tradeoffs need FEA." },
  "Aluminum 6061-T6": { process: "CNC machining or forming", feasibility: 79, lca: 64, notes: "High stiffness and recyclability; embodied energy is high." },
  "Stainless steel": { process: "Sheet forming or machining", feasibility: 74, lca: 60, notes: "Durable and cleanable; mass and process energy are concerns." },
  "Mixed materials": { process: "Assembly", feasibility: 66, lca: 48, notes: "Separability and end-of-life strategy need definition." }
};

const AGENT_LANES = [
  { key: "design", label: "Design", role: "Generate geometry options and feature logic." },
  { key: "standards", label: "Standards", role: "Check requirements, manufacturing rules, and constraints." },
  { key: "solidworks", label: "SolidWorks", role: "Translate parameters into CAD operations." },
  { key: "fea", label: "FEA", role: "Run analysis and critique weak regions." },
  { key: "material", label: "Material", role: "Assess feasibility, process, and LCA." },
  { key: "lca", label: "LCA", role: "Compare sustainability and end-of-life impact." }
];

const CAD_LIBRARY = {
  enclosure: {
    label: "Enclosure",
    defaultTitle: "Portable diagnostic enclosure",
    defaultMaterial: "PC-ABS",
    parameters: [
      { key: "length", label: "Length", unit: "mm", fallback: 170, aliases: ["overall length", "length"] },
      { key: "width", label: "Width", unit: "mm", fallback: 95, aliases: ["overall width", "width"] },
      { key: "height", label: "Height", unit: "mm", fallback: 42, aliases: ["overall height", "height"] },
      { key: "wall", label: "Wall", unit: "mm", fallback: 2.5, aliases: ["wall thickness", "wall"] },
      { key: "cornerRadius", label: "Corner radius", unit: "mm", fallback: 8, aliases: ["corner radius", "fillet radius", "radius"] },
      { key: "pcbLength", label: "PCB length", unit: "mm", fallback: 120, aliases: ["pcb length", "board length"] },
      { key: "pcbWidth", label: "PCB width", unit: "mm", fallback: 70, aliases: ["pcb width", "board width"] },
      { key: "bossCount", label: "Fastener bosses", unit: "count", fallback: 4, aliases: ["fastener bosses", "bosses"], type: "count" }
    ],
    features: ["Base shell", "Lid interface", "PCB standoffs", "Fastener bosses", "Cable exit"]
  },
  bottle: {
    label: "Bottle",
    defaultTitle: "Bottle concept",
    defaultMaterial: "PET",
    parameters: [
      { key: "height", label: "Height", unit: "mm", fallback: 210, aliases: ["overall height", "height"] },
      { key: "bodyDiameter", label: "Body diameter", unit: "mm", fallback: 68, aliases: ["body diameter", "diameter"] },
      { key: "neckDiameter", label: "Neck diameter", unit: "mm", fallback: 28, aliases: ["neck diameter"] },
      { key: "wall", label: "Wall", unit: "mm", fallback: 1.8, aliases: ["wall thickness", "wall"] },
      { key: "baseRadius", label: "Base radius", unit: "mm", fallback: 6, aliases: ["base radius", "corner radius"] },
      { key: "volume", label: "Volume", unit: "ml", fallback: 500, aliases: ["volume", "capacity"] }
    ],
    features: ["Bottle body", "Neck finish", "Base push-up", "Label panel"]
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
      { key: "holeSpacing", label: "Hole spacing", unit: "mm", fallback: 72, aliases: ["hole spacing"] }
    ],
    features: ["Base plate", "Vertical leg", "Mounting holes", "Filleted bend", "Stiffening rib"]
  },
  tray: {
    label: "Tray",
    defaultTitle: "Parametric tray",
    defaultMaterial: "PP",
    parameters: [
      { key: "length", label: "Length", unit: "mm", fallback: 220, aliases: ["overall length", "length"] },
      { key: "width", label: "Width", unit: "mm", fallback: 140, aliases: ["overall width", "width"] },
      { key: "depth", label: "Depth", unit: "mm", fallback: 32, aliases: ["depth", "height"] },
      { key: "wall", label: "Wall", unit: "mm", fallback: 2.2, aliases: ["wall thickness", "wall"] },
      { key: "cornerRadius", label: "Corner radius", unit: "mm", fallback: 10, aliases: ["corner radius", "radius"] },
      { key: "pocketCount", label: "Pockets", unit: "count", fallback: 6, aliases: ["pocket count", "pockets"], type: "count" }
    ],
    features: ["Outer tray shell", "Pocket array", "Drafted pockets", "Stacking lip"]
  },
  assembly: {
    label: "Assembly",
    defaultTitle: "Parametric assembly",
    defaultMaterial: "Mixed materials",
    parameters: [
      { key: "length", label: "Length", unit: "mm", fallback: 180, aliases: ["overall length", "length"] },
      { key: "width", label: "Width", unit: "mm", fallback: 90, aliases: ["overall width", "width"] },
      { key: "height", label: "Height", unit: "mm", fallback: 60, aliases: ["overall height", "height"] },
      { key: "clearance", label: "Clearance", unit: "mm", fallback: 1.5, aliases: ["clearance"] },
      { key: "fastenerCount", label: "Fasteners", unit: "count", fallback: 4, aliases: ["fastener count", "fasteners"], type: "count" }
    ],
    features: ["Primary housing", "Secondary insert", "Fastening scheme", "Alignment features"]
  }
};

let state = loadState();
let loadingAction = "";

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
    revision: 1,
    ai: {
      mode: "parser",
      model: DEFAULT_MODEL,
      endpoint: DEFAULT_AI_ENDPOINT,
      status: "Local parser",
      lastReply: "Use the local parser, add an OpenAI key, or connect an AI endpoint to generate and revise the model."
    },
    bridge: {
      url: DEFAULT_BRIDGE_URL,
      status: "Optional",
      embedUrl: "",
      activeDocument: blueprint.targetDoc,
      lastSync: "",
      lastMessage: "Local SolidWorks bridge is optional. Use cloud mode for browser-based CAD."
    },
    cloud: {
      provider: "3DEXPERIENCE / SOLIDWORKS xDesign",
      status: "Not connected",
      brokerUrl: "",
      spaceUrl: DEFAULT_CLOUD_SPACE_URL,
      launchUrl: DEFAULT_CLOUD_SPACE_URL,
      embedUrl: "",
      displayMode: "preview",
      infoUrl: DEFAULT_XDESIGN_INFO_URL,
      lastSync: "",
      lastMessage: "Sign in to 3DEXPERIENCE/xDesign for browser-based CAD without local SolidWorks."
    },
    concept: blueprint.concept,
    requirements: blueprint.requirements,
    parameters: blueprint.parameters,
    solidworksIntent: blueprint.solidworksIntent,
    geometry: {
      images: [],
      transitionMatrix: [],
      lastMessage: "No image geometry extracted yet"
    },
    designTable: {
      rows: [],
      lastImport: "",
      lastMessage: "No spreadsheet linked yet"
    },
    analysis: {
      simulation: null,
      optimization: null,
      material: buildMaterialAssessment(blueprint.concept.material, blueprint.parameters)
    },
    agents: AGENT_LANES.map(agent => ({
      ...agent,
      status: "Waiting",
      result: "Ready to run"
    }))
  };
}

function normalizeState(saved) {
  const defaults = createDefaultState();
  const savedAi = { ...(saved.ai || {}) };
  const savedBridge = { ...(saved.bridge || {}) };
  const savedCloud = { ...(saved.cloud || {}) };
  if (!savedAi.endpoint) savedAi.endpoint = defaults.ai.endpoint;
  if (savedBridge.url === "https://localhost:8787") savedBridge.url = "http://127.0.0.1:8787";
  if (!savedCloud.spaceUrl) savedCloud.spaceUrl = defaults.cloud.spaceUrl;
  if (!savedCloud.launchUrl) savedCloud.launchUrl = savedCloud.spaceUrl;
  if (!savedCloud.displayMode) savedCloud.displayMode = defaults.cloud.displayMode;
  return {
    ...defaults,
    ...saved,
    ai: { ...defaults.ai, ...savedAi },
    bridge: { ...defaults.bridge, ...savedBridge },
    cloud: { ...defaults.cloud, ...savedCloud },
    concept: { ...defaults.concept, ...(saved.concept || {}) },
    uploadedFiles: Array.isArray(saved.uploadedFiles) ? saved.uploadedFiles : [],
    requirements: Array.isArray(saved.requirements) && saved.requirements.length ? saved.requirements : defaults.requirements,
    parameters: Array.isArray(saved.parameters) && saved.parameters.length ? saved.parameters : defaults.parameters,
    solidworksIntent: saved.solidworksIntent || defaults.solidworksIntent,
    geometry: {
      ...defaults.geometry,
      ...(saved.geometry || {}),
      images: Array.isArray(saved.geometry?.images) ? saved.geometry.images : defaults.geometry.images,
      transitionMatrix: Array.isArray(saved.geometry?.transitionMatrix) ? saved.geometry.transitionMatrix : defaults.geometry.transitionMatrix
    },
    designTable: {
      ...defaults.designTable,
      ...(saved.designTable || {}),
      rows: Array.isArray(saved.designTable?.rows) ? saved.designTable.rows : defaults.designTable.rows
    },
    analysis: { ...defaults.analysis, ...(saved.analysis || {}) },
    agents: Array.isArray(saved.agents) && saved.agents.length ? saved.agents : defaults.agents
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
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);
}

function sanitizeFilename(value = "model") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "model";
}

function toSolidWorksDimensionName(parameter, index) {
  const clean = sanitizeFilename(parameter.key || parameter.label || `dimension-${index + 1}`)
    .replace(/-/g, "_")
    .toUpperCase();
  return `D${index + 1}@${clean}`;
}

function round(value, digits = 1) {
  const multiplier = 10 ** digits;
  return Math.round(Number(value) * multiplier) / multiplier;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatDate(value) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatValue(value, unit) {
  if (unit === "count") return `${round(value, 0)}`;
  if (unit === "ml") return `${round(value, 0)} ml`;
  return `${round(value, Number(value) % 1 === 0 ? 0 : 1)} ${unit}`;
}

function getParameter(key, fallback = 0) {
  const match = state.parameters.find(item => item.key === key);
  return match ? Number(match.value) : fallback;
}

function materialRecord(material) {
  return MATERIAL_LIBRARY[material] || MATERIAL_LIBRARY[Object.keys(MATERIAL_LIBRARY).find(key => material?.includes(key))] || MATERIAL_LIBRARY["Mixed materials"];
}

function buildMaterialAssessment(material, parameters = []) {
  const record = materialRecord(material);
  const wall = Number(parameters.find(item => /wall|thickness/i.test(item.key))?.value || 2.5);
  const countPenalty = parameters.filter(item => item.unit === "count").reduce((sum, item) => sum + Math.max(0, Number(item.value) - 4), 0);
  const feasibility = clamp(Math.round(record.feasibility + wall * 1.2 - countPenalty * 1.5), 35, 98);
  const lca = clamp(Math.round(record.lca - Math.max(0, wall - 2.5) * 3 - countPenalty), 20, 96);
  return {
    material,
    process: record.process,
    feasibility,
    lca,
    decomposition: lca >= 70 ? "Favorable" : lca >= 55 ? "Review" : "Constrained",
    recommendation: feasibility >= 82 && lca >= 65 ? "Proceed to bridge validation" : "Review material/process tradeoffs before release",
    notes: record.notes
  };
}

function buildSimulationResult() {
  const length = getParameter("length", getParameter("baseLength", 160));
  const width = getParameter("width", getParameter("baseWidth", getParameter("bodyDiameter", 80)));
  const height = getParameter("height", getParameter("legHeight", getParameter("depth", 42)));
  const wall = getParameter("wall", getParameter("thickness", 2.5));
  const radius = getParameter("cornerRadius", getParameter("filletRadius", getParameter("baseRadius", 6)));
  const span = Math.max(length, width, height);
  const safetyFactor = round(clamp(1.05 + wall * 0.22 + radius * 0.02 - span * 0.0014, 0.75, 2.8), 2);
  const massIndex = round(clamp((length * width * Math.max(height, 1) * Math.max(wall, 0.8)) / 100000, 0.1, 99), 2);
  const status = safetyFactor >= 1.45 ? "Pass" : safetyFactor >= 1.15 ? "Review" : "Hold";
  return {
    status,
    safetyFactor,
    massIndex,
    critique: status === "Pass" ? "Local estimate clears the first structural screen." : "Increase wall, soften high-curvature transitions, or reduce unsupported span.",
    generatedAt: new Date().toISOString(),
    source: "Local estimate"
  };
}

function buildOptimizationResult(simulation = state.analysis.simulation || buildSimulationResult()) {
  const recommendations = [];
  if (simulation.safetyFactor < 1.45) recommendations.push("Increase wall thickness by 0.3 mm or add ribs near long spans.");
  if ((state.analysis.material?.lca || 0) < 65) recommendations.push("Compare PP, PET, or recycled-content alternatives for lifecycle impact.");
  if (state.geometry.images.length) recommendations.push("Use extracted contour profiles as guide curves before committing feature edits.");
  if (!recommendations.length) recommendations.push("Proceed to SolidWorks rebuild and formal simulation.");
  return {
    status: simulation.status === "Pass" ? "Ready" : "Needs review",
    recommendations,
    nextRevision: `R${String(state.revision + 1).padStart(2, "0")}`,
    generatedAt: new Date().toISOString(),
    source: "Local optimization"
  };
}

function parseDelimitedTable(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delimiter).map(item => item.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(item => item.trim());
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
}

function decodeXmlEntities(value = "") {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function xmlAttribute(xml, name) {
  const match = xml.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match ? decodeXmlEntities(match[1]) : "";
}

function columnIndexFromCellRef(cellRef = "") {
  const column = cellRef.replace(/\d+/g, "").toUpperCase();
  return [...column].reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

async function inflateZipEntry(bytes, method) {
  if (method === 0) return bytes;
  if (method !== 8) throw new Error("Unsupported XLSX compression method");
  if (!("DecompressionStream" in window)) throw new Error("This browser cannot unpack compressed XLSX files");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipTextEntries(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  let eocdOffset = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 66000); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Invalid XLSX archive");

  const entryCount = view.getUint16(eocdOffset + 10, true);
  let centralOffset = view.getUint32(eocdOffset + 16, true);
  const decoder = new TextDecoder();
  const entries = {};

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(centralOffset, true) !== 0x02014b50) break;
    const method = view.getUint16(centralOffset + 10, true);
    const compressedSize = view.getUint32(centralOffset + 20, true);
    const filenameLength = view.getUint16(centralOffset + 28, true);
    const extraLength = view.getUint16(centralOffset + 30, true);
    const commentLength = view.getUint16(centralOffset + 32, true);
    const localOffset = view.getUint32(centralOffset + 42, true);
    const name = decoder.decode(bytes.slice(centralOffset + 46, centralOffset + 46 + filenameLength));
    const shouldRead = /(^xl\/.*\.(xml|rels)$)|(^\[Content_Types\]\.xml$)/i.test(name);
    if (shouldRead) {
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);
      const inflated = await inflateZipEntry(compressed, method);
      entries[name] = decoder.decode(inflated);
    }
    centralOffset += 46 + filenameLength + extraLength + commentLength;
  }

  return entries;
}

function parseSharedStrings(xml = "") {
  return [...xml.matchAll(/<si\b[\s\S]*?<\/si>/gi)].map(match => {
    const textParts = [...match[0].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)].map(textMatch => decodeXmlEntities(textMatch[1]));
    return textParts.join("");
  });
}

function resolveFirstWorksheet(entries) {
  const workbook = entries["xl/workbook.xml"] || "";
  const rels = entries["xl/_rels/workbook.xml.rels"] || "";
  const firstSheet = workbook.match(/<sheet\b[^>]*>/i)?.[0] || "";
  const relationId = xmlAttribute(firstSheet, "r:id");
  if (relationId && rels) {
    const relation = [...rels.matchAll(/<Relationship\b[^>]*>/gi)]
      .map(match => match[0])
      .find(node => xmlAttribute(node, "Id") === relationId);
    const target = relation ? xmlAttribute(relation, "Target").replace(/^\/?xl\//, "") : "";
    if (target && entries[`xl/${target}`]) return entries[`xl/${target}`];
  }

  const worksheetName = Object.keys(entries).find(name => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name));
  return worksheetName ? entries[worksheetName] : "";
}

function parseWorksheetRows(xml, sharedStrings) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gi)) {
    const row = [];
    let nextIndex = 0;
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/gi)) {
      const attributes = cellMatch[1];
      const cellXml = cellMatch[2];
      const cellRef = xmlAttribute(attributes, "r");
      const columnIndex = cellRef ? columnIndexFromCellRef(cellRef) : nextIndex;
      const type = xmlAttribute(attributes, "t");
      const valueMatch = cellXml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i);
      const inlineText = [...cellXml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)].map(match => decodeXmlEntities(match[1])).join("");
      const rawValue = valueMatch ? decodeXmlEntities(valueMatch[1]) : inlineText;
      row[columnIndex] = type === "s" ? sharedStrings[Number(rawValue)] || "" : rawValue;
      nextIndex = columnIndex + 1;
    }
    while (row.length && !String(row[row.length - 1] ?? "").trim()) row.pop();
    if (row.some(value => String(value ?? "").trim())) rows.push(row);
  }
  return rows;
}

async function parseXlsxTable(file) {
  const entries = await readZipTextEntries(await file.arrayBuffer());
  const worksheet = resolveFirstWorksheet(entries);
  if (!worksheet) throw new Error("No worksheet found in Excel file");
  const sharedStrings = parseSharedStrings(entries["xl/sharedStrings.xml"]);
  const rows = parseWorksheetRows(worksheet, sharedStrings);
  if (rows.length < 2) return [];
  const headers = rows[0].map(value => String(value || "").trim().toLowerCase());
  return rows.slice(1).map(values => headers.reduce((row, header, index) => {
    if (header) row[header] = String(values[index] ?? "").trim();
    return row;
  }, {}));
}

function rowValue(row, keys) {
  for (const key of keys) {
    const normalized = key.toLowerCase();
    const compact = normalized.replace(/[^a-z0-9]/g, "");
    const match = Object.entries(row).find(([rowKey, value]) => {
      const rowCompact = rowKey.toLowerCase().replace(/[^a-z0-9]/g, "");
      return value !== "" && (rowKey.toLowerCase() === normalized || rowCompact === compact);
    });
    if (match) return match[1];
  }
  return "";
}

function importParameterRows(rows) {
  let changed = 0;
  state.parameters = state.parameters.map(parameter => {
    const match = rows.find(row => {
      const name = rowValue(row, ["parameter", "param", "key", "name", "spec", "label"]);
      const sw = rowValue(row, ["swDimension", "SW dimension", "SolidWorks dimension", "dimension", "solidworks", "sw"]);
      return name.toLowerCase() === parameter.key.toLowerCase()
        || name.toLowerCase() === parameter.label.toLowerCase()
        || sw.toLowerCase() === String(parameter.swDimension || "").toLowerCase();
    });
    if (!match) return parameter;
    const value = Number(rowValue(match, ["value", "val", "mm", "dimensionValue", "dimension value", "value mm", "value (mm)"]));
    if (!Number.isFinite(value)) return parameter;
    changed += 1;
    return {
      ...parameter,
      value,
      unit: rowValue(match, ["unit", "units"]) || parameter.unit,
      source: "Spreadsheet"
    };
  });
  if (changed) {
    state.revision += 1;
    state.designTable.rows = buildDesignTableRows();
    state.analysis.material = buildMaterialAssessment(state.concept.material, state.parameters);
  }
  return changed;
}

function buildDesignTableRows() {
  return state.parameters.map((parameter, index) => ({
    parameter: parameter.key,
    label: parameter.label,
    value: parameter.value,
    unit: parameter.unit,
    swDimension: parameter.swDimension || toSolidWorksDimensionName(parameter, index),
    configuration: "Default",
    source: parameter.source
  }));
}

function designTableCsv() {
  const rows = state.designTable.rows.length ? state.designTable.rows : buildDesignTableRows();
  const headers = ["configuration", "parameter", "label", "value", "unit", "swDimension", "source"];
  const escapeCell = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map(row => headers.map(header => escapeCell(row[header])).join(","))].join("\n");
}

function downloadText(filename, text, type = "text/plain") {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

async function handleTableUpload(fileList) {
  const files = [...fileList];
  if (!files.length) return;
  let imported = 0;
  const messages = [];

  for (const file of files) {
    if (/\.(csv|tsv|txt)$/i.test(file.name)) {
      const rows = parseDelimitedTable(await file.text());
      const changed = importParameterRows(rows);
      imported += changed;
      messages.push(`${file.name}: ${changed} specs linked`);
    } else if (/\.xlsx$/i.test(file.name)) {
      try {
        const rows = await parseXlsxTable(file);
        const changed = importParameterRows(rows);
        imported += changed;
        messages.push(`${file.name}: ${changed} Excel specs linked`);
      } catch (error) {
        messages.push(`${file.name}: bridge-side parsing needed (${error.message})`);
      }
    } else {
      messages.push(`${file.name}: unsupported table format`);
    }
  }

  state.designTable.rows = buildDesignTableRows();
  state.designTable.lastImport = new Date().toISOString();
  state.designTable.lastMessage = messages.join("; ");
  persist(imported ? `${imported} spreadsheet specs imported` : "Spreadsheet stored for bridge");
}

function exportDesignTable() {
  syncDraftFromDom();
  state.designTable.rows = buildDesignTableRows();
  state.designTable.lastMessage = "Design table CSV exported";
  persist();
  downloadText(`${sanitizeFilename(state.concept.title)}-solidworks-design-table.csv`, designTableCsv(), "text/csv");
  showToast("SolidWorks design table exported");
}

function readImageDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function extractContourProfile(file) {
  const dataUrl = await readImageDataUrl(file);
  const image = await loadImage(dataUrl);
  const width = 180;
  const height = Math.max(120, Math.round(image.height * (width / image.width)));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  const profile = [];
  let edgeCount = 0;
  const rowStep = Math.max(2, Math.floor(height / 44));

  for (let y = rowStep; y < height - rowStep; y += rowStep) {
    let left = null;
    let right = null;
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;
      const prev = (y * width + x - 1) * 4;
      const next = (y * width + x + 1) * 4;
      const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
      const grayPrev = data[prev] * 0.299 + data[prev + 1] * 0.587 + data[prev + 2] * 0.114;
      const grayNext = data[next] * 0.299 + data[next + 1] * 0.587 + data[next + 2] * 0.114;
      const contrast = Math.abs(gray - grayPrev) + Math.abs(gray - grayNext);
      if (contrast > 54) {
        edgeCount += 1;
        if (left === null) left = x;
        right = x;
      }
    }
    if (left !== null && right !== null && right - left > width * 0.08) {
      profile.push({
        y: round(y / height, 3),
        left: round((left / width - 0.5) * 2, 3),
        right: round((right / width - 0.5) * 2, 3),
        width: round((right - left) / width, 3)
      });
    }
  }

  return {
    name: file.name,
    originalWidth: image.width,
    originalHeight: image.height,
    sampleWidth: width,
    sampleHeight: height,
    edgeCount,
    confidence: clamp(Math.round((profile.length / 40) * 100), 0, 100),
    profile: profile.slice(0, 48),
    extractedAt: new Date().toISOString()
  };
}

function buildTransitionMatrix(images = state.geometry.images) {
  if (images.length < 2) return [];
  const [from, to] = images;
  const steps = 5;
  const count = Math.min(from.profile.length, to.profile.length, 32);
  return Array.from({ length: steps }, (_, stepIndex) => {
    const t = round(stepIndex / (steps - 1), 2);
    return {
      step: stepIndex + 1,
      blend: t,
      profile: Array.from({ length: count }, (_, index) => {
        const a = from.profile[index];
        const b = to.profile[index];
        return {
          y: round(a.y * (1 - t) + b.y * t, 3),
          left: round(a.left * (1 - t) + b.left * t, 3),
          right: round(a.right * (1 - t) + b.right * t, 3),
          width: round(a.width * (1 - t) + b.width * t, 3)
        };
      })
    };
  });
}

async function handleImageUpload(fileList) {
  const files = [...fileList].filter(file => /^image\//.test(file.type));
  if (!files.length) {
    showToast("Upload image files for contour extraction");
    return;
  }

  loadingAction = "image-geometry";
  render();

  try {
    const profiles = [];
    for (const file of files) {
      profiles.push(await extractContourProfile(file));
    }
    state.geometry.images = [...profiles, ...state.geometry.images].slice(0, 4);
    state.geometry.transitionMatrix = buildTransitionMatrix(state.geometry.images);
    state.geometry.lastMessage = `${profiles.length} image${profiles.length === 1 ? "" : "s"} converted to contour profiles`;
    persist("Image geometry extracted");
  } catch (error) {
    state.geometry.lastMessage = error.message;
    persist(error.message);
  } finally {
    loadingAction = "";
    render();
  }
}

function inferFamily(text, selectedTemplate) {
  if (selectedTemplate && selectedTemplate !== "auto" && CAD_LIBRARY[selectedTemplate]) return selectedTemplate;
  const draft = text.toLowerCase();
  if (/(enclosure|housing|case|shell|device)/.test(draft)) return "enclosure";
  if (/(bottle|vial|jar|neck|cap)/.test(draft)) return "bottle";
  if (/(bracket|mount|fixture|clamp)/.test(draft)) return "bracket";
  if (/(tray|insert|blister|pocket|cavity)/.test(draft)) return "tray";
  return "assembly";
}

function extractRequirements(text) {
  return text
    .split(/\r?\n|[.;]\s+/)
    .map(line => line.replace(/^[-*]\s*/, "").trim())
    .filter(line => line && !/^project:/i.test(line))
    .slice(0, 10);
}

function extractTitle(prompt, text, fallback) {
  const fromProject = text.match(/^project:\s*(.+)$/im);
  if (fromProject) return fromProject[1].trim();
  const seed = prompt.replace(/^(design|create|generate)\s+/i, "").split(/[.!?]/)[0].trim();
  return seed ? seed.charAt(0).toUpperCase() + seed.slice(1) : fallback;
}

function extractMaterial(text, fallback) {
  const entries = [
    ["medical-grade pc-abs", "Medical-grade PC-ABS"],
    ["pc-abs", "PC-ABS"],
    ["aluminum", "Aluminum 6061-T6"],
    ["stainless", "Stainless steel"],
    ["petg", "PETG"],
    ["pet", "PET"],
    ["abs", "ABS"],
    ["pp", "PP"]
  ];
  const lower = text.toLowerCase();
  const match = entries.find(([token]) => lower.includes(token));
  return match ? match[1] : fallback;
}

function convertUnit(value, fromUnit, targetUnit) {
  if (!fromUnit || fromUnit === targetUnit) return value;
  const unit = fromUnit.toLowerCase();
  if (targetUnit === "mm") {
    if (unit === "cm") return value * 10;
    if (unit === "in" || unit === "inch" || unit === "inches") return value * 25.4;
  }
  return value;
}

function extractNumber(text, aliases, fallback, targetUnit) {
  for (const alias of aliases) {
    const token = alias.replace(/\s+/g, "\\s+");
    const patterns = [
      new RegExp(`${token}[^\\d]{0,24}(\\d+(?:\\.\\d+)?)\\s*(mm|cm|in|inch|inches|ml)?`, "i"),
      new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(mm|cm|in|inch|inches|ml)?[^\\n]{0,24}${token}`, "i")
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          value: round(convertUnit(Number(match[1]), match[2] || targetUnit, targetUnit), 2),
          source: "Requirement"
        };
      }
    }
  }
  return { value: fallback, source: "Assumption" };
}

function extractCount(text, aliases, fallback) {
  for (const alias of aliases) {
    const token = alias.replace(/\s+/g, "\\s+");
    const patterns = [
      new RegExp(`${token}[^\\da-z]{0,24}(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)`, "i"),
      new RegExp(`(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)[^\\n]{0,24}${token}`, "i")
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const raw = match[1].toLowerCase();
        return { value: NUMBER_WORDS[raw] || Number(raw), source: "Requirement" };
      }
    }
  }
  return { value: fallback, source: "Assumption" };
}

function buildFeatures(baseFeatures, text) {
  const extras = [
    [/snap/i, "Snap-fit closure"],
    [/(cable|wire|connector)/i, "Cable routing"],
    [/vent/i, "Vent pattern"],
    [/gasket|seal/i, "Gasket channel"],
    [/window|display/i, "Inspection window"],
    [/handle/i, "Handle"],
    [/rib/i, "Ribs"]
  ].filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
  return [...new Set([...baseFeatures, ...extras])].slice(0, 8);
}

function buildModelBlueprint(prompt, requirementText, selectedTemplate) {
  const combined = `${prompt}\n${requirementText}`.trim();
  const family = inferFamily(combined, selectedTemplate);
  const library = CAD_LIBRARY[family] || CAD_LIBRARY.assembly;
  const parameters = library.parameters.map((definition, index) => {
    const result = definition.type === "count"
      ? extractCount(combined, definition.aliases, definition.fallback)
      : extractNumber(combined, definition.aliases, definition.fallback, definition.unit);
    return { ...definition, value: result.value, source: result.source, swDimension: toSolidWorksDimensionName(definition, index) };
  });
  const material = extractMaterial(combined, library.defaultMaterial);
  const title = extractTitle(prompt, requirementText, library.defaultTitle);
  const features = buildFeatures(library.features, combined);

  return {
    targetDoc: `${sanitizeFilename(title)}.SLDPRT`,
    requirements: extractRequirements(requirementText),
    parameters,
    concept: {
      title,
      family,
      familyLabel: library.label,
      material,
      features
    },
    solidworksIntent: {
      documentType: "part",
      rebuildMode: "parametric",
      operations: features.map((feature, index) => ({
        order: index + 1,
        name: feature,
        action: "create_or_update"
      }))
    }
  };
}

function syncDraftFromDom() {
  const prompt = document.getElementById("promptInput");
  const requirements = document.getElementById("requirementText");
  const template = document.getElementById("templateSelect");
  const aiMode = document.getElementById("aiMode");
  const aiModel = document.getElementById("aiModel");
  const aiEndpoint = document.getElementById("aiEndpoint");
  const aiKey = document.getElementById("aiKey");
  const bridgeUrl = document.getElementById("bridgeUrl");
  const cloudBrokerUrl = document.getElementById("cloudBrokerUrl");
  const cloudSpaceUrl = document.getElementById("cloudSpaceUrl");

  if (prompt) state.prompt = prompt.value.trim();
  if (requirements) state.requirementText = requirements.value.trim();
  if (template) state.selectedTemplate = template.value;
  if (aiMode) state.ai.mode = aiMode.value;
  if (aiModel) state.ai.model = aiModel.value.trim() || DEFAULT_MODEL;
  if (aiEndpoint) state.ai.endpoint = aiEndpoint.value.trim();
  if (aiKey && aiKey.value.trim()) sessionStorage.setItem(SESSION_AI_KEY, aiKey.value.trim());
  if (bridgeUrl) state.bridge.url = bridgeUrl.value.trim();
  if (cloudBrokerUrl) state.cloud.brokerUrl = cloudBrokerUrl.value.trim();
  if (cloudSpaceUrl) {
    state.cloud.spaceUrl = cloudSpaceUrl.value.trim() || DEFAULT_CLOUD_SPACE_URL;
    state.cloud.launchUrl = state.cloud.launchUrl || state.cloud.spaceUrl;
  }
}

function statusClass(value) {
  const lower = String(value).toLowerCase();
  if (/(connected|ready|synced|deployed|online|ok)/.test(lower)) return "connected";
  if (/(needs|fallback|waiting|parser)/.test(lower)) return "warning";
  if (/(fail|error|disconnected|offline)/.test(lower)) return "bad";
  return "";
}

function sourceBadge(source) {
  return source === "Requirement" ? "good" : source === "AI" ? "warn" : "";
}

function makeCurrentModelPayload() {
  return {
    revision: state.revision,
    prompt: state.prompt,
    requirementsText: state.requirementText,
    extractedRequirements: state.requirements,
    concept: state.concept,
    parameters: state.parameters.map(({ key, label, unit, value, source, swDimension }) => ({ key, label, unit, value, source, swDimension })),
    imageGeometry: state.geometry,
    designTable: state.designTable,
    analysis: state.analysis,
    agents: state.agents,
    cloud: state.cloud,
    solidworksIntent: state.solidworksIntent,
    targetDocument: state.bridge.activeDocument || `${sanitizeFilename(state.concept.title)}.SLDPRT`
  };
}

function updateFromBlueprint(blueprint, source = "Local parser") {
  state.revision += 1;
  state.concept = blueprint.concept;
  state.requirements = blueprint.requirements;
  state.parameters = blueprint.parameters;
  state.solidworksIntent = blueprint.solidworksIntent;
  state.bridge.activeDocument = blueprint.targetDoc;
  state.bridge.lastMessage = `${source} updated revision R${String(state.revision).padStart(2, "0")}`;
  state.analysis.material = buildMaterialAssessment(state.concept.material, state.parameters);
  state.analysis.simulation = null;
  state.analysis.optimization = null;
  state.designTable.rows = buildDesignTableRows();
}

function generateModel() {
  syncDraftFromDom();
  const blueprint = buildModelBlueprint(state.prompt, state.requirementText, state.selectedTemplate);
  updateFromBlueprint(blueprint, "Requirements");
  state.ai.lastReply = `Generated ${blueprint.concept.familyLabel.toLowerCase()} model with ${blueprint.parameters.length} parameters.`;
  persist("Model generated");
}

function applyParameterChanges() {
  syncDraftFromDom();
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
      source: round(nextValue, 2) !== round(Number(parameter.value), 2) ? "Manual" : parameter.source
    };
  });

  if (!changed) {
    showToast("No spec changes detected");
    return;
  }

  state.revision += 1;
  state.bridge.lastMessage = `${changed} specs changed on R${String(state.revision).padStart(2, "0")}`;
  state.designTable.rows = buildDesignTableRows();
  state.analysis.material = buildMaterialAssessment(state.concept.material, state.parameters);
  state.analysis.simulation = null;
  state.analysis.optimization = null;
  persist("Specs updated");
}

function applyAiPayload(payload, fallbackReply) {
  const family = CAD_LIBRARY[payload.family] ? payload.family : inferFamily(`${payload.title || ""} ${state.requirementText}`, state.selectedTemplate);
  const library = CAD_LIBRARY[family];
  const localBlueprint = buildModelBlueprint(state.prompt, state.requirementText, family);

  const parameters = Array.isArray(payload.parameters) && payload.parameters.length
    ? payload.parameters.map((item, index) => {
      const base = localBlueprint.parameters[index] || library.parameters[index] || {};
      return {
        key: String(item.key || base.key || `p${index}`),
        label: String(item.label || base.label || item.key || `Parameter ${index + 1}`),
        unit: String(item.unit || base.unit || "mm"),
        value: Number.isFinite(Number(item.value)) ? Number(item.value) : Number(base.value || base.fallback || 0),
        source: item.source || "AI",
        swDimension: item.swDimension || base.swDimension || toSolidWorksDimensionName(item, index)
      };
    })
    : localBlueprint.parameters.map((item, index) => ({
      ...item,
      source: item.source === "Requirement" ? "Requirement" : "AI",
      swDimension: item.swDimension || toSolidWorksDimensionName(item, index)
    }));

  const title = payload.title || localBlueprint.concept.title;
  state.revision += 1;
  state.concept = {
    title,
    family,
    familyLabel: library.label,
    material: payload.material || localBlueprint.concept.material,
    features: Array.isArray(payload.features) && payload.features.length ? payload.features.slice(0, 8) : localBlueprint.concept.features
  };
  state.requirements = Array.isArray(payload.requirements) && payload.requirements.length ? payload.requirements.slice(0, 10) : localBlueprint.requirements;
  state.parameters = parameters;
  state.solidworksIntent = payload.solidworksIntent || localBlueprint.solidworksIntent;
  state.bridge.activeDocument = `${sanitizeFilename(title)}.SLDPRT`;
  state.bridge.lastMessage = `AI updated revision R${String(state.revision).padStart(2, "0")}`;
  state.ai.status = state.ai.mode === "openai" ? "OpenAI connected" : state.ai.mode === "bridge" ? "Endpoint connected" : "Parser";
  state.ai.lastReply = payload.reply || fallbackReply || "AI updated the current model.";
  state.analysis.material = buildMaterialAssessment(state.concept.material, state.parameters);
  if (payload.analysis) {
    state.analysis = {
      ...state.analysis,
      ...payload.analysis,
      material: payload.analysis.material || state.analysis.material
    };
  }
  if (Array.isArray(payload.agents) && payload.agents.length) state.agents = payload.agents;
  state.designTable.rows = buildDesignTableRows();
}

function makeAiInstruction() {
  return [
    "You are a CAD copilot for SolidWorks parametric design.",
    "Return only valid JSON.",
    "Schema: {",
    '  "reply": "short operator-facing summary",',
    '  "title": "model title",',
    '  "family": "enclosure|bottle|bracket|tray|assembly",',
    '  "material": "material",',
    '  "requirements": ["requirement"],',
    '  "parameters": [{"key":"length","label":"Length","unit":"mm","value":170,"source":"AI"}],',
    '  "features": ["SolidWorks feature"],',
    '  "solidworksIntent": {"documentType":"part","rebuildMode":"parametric","operations":[{"order":1,"name":"Base shell","action":"create_or_update"}]},',
    '  "analysis": {"simulation": null, "optimization": null, "material": null},',
    '  "agents": [{"key":"design","label":"Design","status":"Ready","result":"summary"}]',
    "}",
    "Use imageGeometry profiles as guide-curve inputs when available.",
    "Use designTable rows as SolidWorks dimension mappings when available.",
    "Keep parameters numeric and use millimeters unless another unit is required."
  ].join("\n");
}

function extractResponseText(response) {
  if (typeof response.output_text === "string") return response.output_text;
  const parts = [];
  for (const output of response.output || []) {
    for (const content of output.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
      if (content.type === "text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

function parseJsonFromText(text) {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("AI returned text instead of model JSON.");
  }
}

async function callOpenAI() {
  const key = sessionStorage.getItem(SESSION_AI_KEY);
  if (!key) throw new Error("Add an OpenAI API key for this browser session.");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model: state.ai.model || DEFAULT_MODEL,
      store: false,
      instructions: makeAiInstruction(),
      input: JSON.stringify(makeCurrentModelPayload(), null, 2),
      max_output_tokens: 1600
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.error?.message || `OpenAI request failed (${response.status})`;
    throw new Error(detail);
  }
  return parseJsonFromText(extractResponseText(data));
}

async function callAiEndpoint() {
  if (!state.ai.endpoint) throw new Error("Add an AI endpoint URL.");
  const response = await fetch(state.ai.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instructions: makeAiInstruction(),
      model: state.ai.model,
      payload: makeCurrentModelPayload()
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || `AI endpoint failed (${response.status})`);
  return typeof data === "string" ? parseJsonFromText(data) : data;
}

async function askCopilot() {
  syncDraftFromDom();
  loadingAction = "ask-ai";
  render();

  try {
    let payload;
    if (state.ai.mode === "openai") {
      payload = await callOpenAI();
    } else if (state.ai.mode === "bridge") {
      payload = await callAiEndpoint();
    } else {
      const blueprint = buildModelBlueprint(state.prompt, state.requirementText, state.selectedTemplate);
      payload = {
        reply: "Local parser generated a deterministic model. Connect OpenAI or an AI endpoint for generative reasoning.",
        title: blueprint.concept.title,
        family: blueprint.concept.family,
        material: blueprint.concept.material,
        requirements: blueprint.requirements,
        parameters: blueprint.parameters,
        features: blueprint.concept.features,
        solidworksIntent: blueprint.solidworksIntent
      };
      state.ai.status = "Local parser";
    }
    applyAiPayload(payload, "AI generated the current model.");
    persist("AI model updated");
  } catch (error) {
    state.ai.status = "AI error";
    state.ai.lastReply = error.message;
    persist(error.message);
  } finally {
    loadingAction = "";
    render();
  }
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

async function connectBridge() {
  syncDraftFromDom();
  if (!state.bridge.url) {
    showToast("Add a SolidWorks bridge URL");
    return;
  }

  loadingAction = "connect-bridge";
  render();

  try {
    const baseUrl = normalizeBaseUrl(state.bridge.url);
    const response = await fetch(`${baseUrl}/health`, { method: "GET" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Bridge returned ${response.status}`);
    state.bridge.status = data.solidworksRunning === false ? "Bridge online" : "Connected";
    state.bridge.embedUrl = data.embedUrl || data.viewerUrl || `${baseUrl}/viewer`;
    state.bridge.activeDocument = data.activeDocument || state.bridge.activeDocument;
    state.bridge.lastMessage = data.message || "SolidWorks bridge connected";
    persist("SolidWorks bridge connected");
  } catch (error) {
    state.bridge.status = "Connection failed";
    state.bridge.lastMessage = error.message;
    persist(error.message);
  } finally {
    loadingAction = "";
    render();
  }
}

async function sendToSolidWorks() {
  syncDraftFromDom();
  if (!state.bridge.url) {
    showToast("Add a SolidWorks bridge URL");
    return;
  }

  loadingAction = "send-model";
  render();

  try {
    const baseUrl = normalizeBaseUrl(state.bridge.url);
    const response = await fetch(`${baseUrl}/api/model`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(makeCurrentModelPayload())
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || `SolidWorks bridge returned ${response.status}`);
    state.bridge.status = "Synced";
    state.bridge.lastSync = new Date().toISOString();
    state.bridge.embedUrl = data.embedUrl || data.viewerUrl || state.bridge.embedUrl || `${baseUrl}/viewer`;
    state.bridge.activeDocument = data.activeDocument || data.document || state.bridge.activeDocument;
    state.bridge.lastMessage = data.message || "Model sent to SolidWorks";
    persist("Model sent to SolidWorks");
  } catch (error) {
    state.bridge.status = "Sync failed";
    state.bridge.lastMessage = error.message;
    persist(error.message);
  } finally {
    loadingAction = "";
    render();
  }
}

async function postBridge(endpoint, actionLabel) {
  syncDraftFromDom();
  if (!state.bridge.url) throw new Error("Add a SolidWorks bridge URL");
  const baseUrl = normalizeBaseUrl(state.bridge.url);
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(makeCurrentModelPayload())
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `${actionLabel} failed (${response.status})`);
  state.bridge.status = "Synced";
  state.bridge.lastSync = new Date().toISOString();
  state.bridge.embedUrl = data.embedUrl || data.viewerUrl || state.bridge.embedUrl || `${baseUrl}/viewer`;
  state.bridge.lastMessage = data.message || `${actionLabel} completed`;
  return data;
}

function cloudPackage() {
  const payload = makeCurrentModelPayload();
  return {
    source: "SolidWorks AI CAD Studio",
    createdAt: new Date().toISOString(),
    provider: state.cloud.provider,
    target: {
      platform: "3DEXPERIENCE",
      app: "SOLIDWORKS xDesign or 3DEXPERIENCE SOLIDWORKS",
      workspaceUrl: state.cloud.spaceUrl
    },
    payload,
    designTableCsv: designTableCsv(),
    operations: {
      documentType: payload.solidworksIntent?.documentType || "part",
      featureOperations: payload.solidworksIntent?.operations || [],
      dimensionOperations: payload.parameters.map(parameter => ({
        type: "set_dimension",
        parameter: parameter.key,
        swDimension: parameter.swDimension,
        value: parameter.value,
        unit: parameter.unit
      })),
      imageGeometryOperations: (payload.imageGeometry?.images || []).map(image => ({
        type: "guide_curve_profile",
        name: image.name,
        confidence: image.confidence,
        points: image.profile || []
      })),
      transitionMatrix: payload.imageGeometry?.transitionMatrix || []
    }
  };
}

function openCloudWorkspace() {
  syncDraftFromDom();
  const target = state.cloud.launchUrl || state.cloud.spaceUrl || DEFAULT_CLOUD_SPACE_URL;
  window.open(target, "_blank", "noopener,noreferrer");
  state.cloud.status = "Opened";
  state.cloud.launchUrl = target;
  state.cloud.lastMessage = "Opened cloud workspace in a secure tab. If your plan includes xDesign, launch it there.";
  persist("Cloud workspace opened");
}

function showCloudFrame() {
  syncDraftFromDom();
  const target = state.cloud.launchUrl || state.cloud.spaceUrl || DEFAULT_CLOUD_SPACE_URL;
  state.cloud.embedUrl = target;
  state.cloud.launchUrl = target;
  state.cloud.displayMode = "cloud";
  state.cloud.status = "Frame requested";
  state.cloud.lastMessage = "Trying to show the cloud workspace inside the dashboard. If the provider blocks embedding, use Open / log in.";
  persist("Cloud frame requested");
}

function showLocalPreview() {
  state.cloud.displayMode = "preview";
  state.cloud.lastMessage = "Showing dashboard preview. Use cloud mode to launch 3DEXPERIENCE/xDesign.";
  persist("Preview shown");
}

function exportCloudPackage() {
  syncDraftFromDom();
  const title = sanitizeFilename(state.concept.title);
  downloadText(`${title}-3dexperience-cloud-package.json`, JSON.stringify(cloudPackage(), null, 2), "application/json");
  state.cloud.status = "Package exported";
  state.cloud.lastSync = new Date().toISOString();
  state.cloud.lastMessage = "Cloud package exported for a 3DEXPERIENCE/xDesign broker or manual import workflow.";
  persist("Cloud package exported");
}

async function connectCloud() {
  syncDraftFromDom();
  if (!state.cloud.brokerUrl) {
    state.cloud.status = "Manual login";
    state.cloud.lastMessage = "No cloud broker configured. Open 3DEXPERIENCE and sign in with your SOLIDWORKS account.";
    persist("Open cloud workspace to sign in");
    openCloudWorkspace();
    return;
  }

  loadingAction = "connect-cloud";
  render();

  try {
    const baseUrl = normalizeBaseUrl(state.cloud.brokerUrl);
    const response = await fetch(`${baseUrl}/api/cloud/status`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || `Cloud broker returned ${response.status}`);
    state.cloud.status = data.connected ? "Connected" : "Broker online";
    state.cloud.launchUrl = data.launchUrl || data.spaceUrl || state.cloud.spaceUrl;
    state.cloud.embedUrl = data.embedUrl || state.cloud.embedUrl;
    state.cloud.lastMessage = data.message || "Cloud broker is ready.";
    persist("Cloud broker connected");
  } catch (error) {
    state.cloud.status = "Cloud error";
    state.cloud.lastMessage = error.message;
    persist(error.message);
  } finally {
    loadingAction = "";
    render();
  }
}

async function pushToCloud() {
  syncDraftFromDom();
  if (!state.cloud.brokerUrl) {
    exportCloudPackage();
    return;
  }

  loadingAction = "push-cloud";
  render();

  try {
    const baseUrl = normalizeBaseUrl(state.cloud.brokerUrl);
    const response = await fetch(`${baseUrl}/api/cloud/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cloudPackage())
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || `Cloud push failed (${response.status})`);
    state.cloud.status = "Synced";
    state.cloud.lastSync = new Date().toISOString();
    state.cloud.launchUrl = data.launchUrl || state.cloud.launchUrl;
    state.cloud.lastMessage = data.message || "Cloud package sent to broker.";
    persist("Cloud package sent");
  } catch (error) {
    state.cloud.status = "Cloud sync failed";
    state.cloud.lastMessage = error.message;
    persist(error.message);
  } finally {
    loadingAction = "";
    render();
  }
}

async function runSimulation() {
  loadingAction = "simulate";
  render();
  try {
    const data = await postBridge("/api/simulate", "Simulation");
    state.analysis.simulation = data.simulation || data;
    state.analysis.simulation.source = state.analysis.simulation.source || "SolidWorks bridge";
    persist("Simulation complete");
  } catch (error) {
    state.analysis.simulation = buildSimulationResult();
    state.bridge.lastMessage = `Bridge unavailable; ${state.analysis.simulation.source.toLowerCase()} used`;
    persist("Local simulation estimate generated");
  } finally {
    loadingAction = "";
    render();
  }
}

async function optimizeModel() {
  loadingAction = "optimize";
  render();
  try {
    const data = await postBridge("/api/optimize", "Optimization");
    state.analysis.optimization = data.optimization || data;
    state.analysis.optimization.source = state.analysis.optimization.source || "SolidWorks bridge";
    if (Array.isArray(data.parameters) && data.parameters.length) {
      state.parameters = data.parameters;
      state.designTable.rows = buildDesignTableRows();
    }
    persist("Optimization complete");
  } catch (error) {
    state.analysis.optimization = buildOptimizationResult();
    state.bridge.lastMessage = `Bridge unavailable; ${state.analysis.optimization.source.toLowerCase()} used`;
    persist("Local optimization suggestions generated");
  } finally {
    loadingAction = "";
    render();
  }
}

async function assessMaterial() {
  loadingAction = "material";
  render();
  try {
    const data = await postBridge("/api/material-assessment", "Material assessment");
    state.analysis.material = data.materialAssessment || data;
    state.analysis.material.source = state.analysis.material.source || "Bridge";
    persist("Material/LCA assessment complete");
  } catch (error) {
    state.analysis.material = { ...buildMaterialAssessment(state.concept.material, state.parameters), source: "Local material model" };
    state.bridge.lastMessage = "Bridge unavailable; local material/LCA estimate used";
    persist("Local material/LCA assessment generated");
  } finally {
    loadingAction = "";
    render();
  }
}

async function runAgents() {
  loadingAction = "agents";
  render();
  try {
    const data = await postBridge("/api/agents/run", "Agent workflow");
    state.agents = Array.isArray(data.agents) ? data.agents : state.agents;
    persist("Agent workflow complete");
  } catch (error) {
    state.agents = AGENT_LANES.map(agent => {
      const result = {
        design: `${state.concept.features.length} features queued from current parameters`,
        standards: `${state.requirements.length} requirements mapped`,
        solidworks: `${state.designTable.rows.length || state.parameters.length} design-table rows ready`,
        fea: state.analysis.simulation ? `${state.analysis.simulation.status} safety factor ${state.analysis.simulation.safetyFactor || "pending"}` : "Run simulation next",
        material: `${state.analysis.material.material}: feasibility ${state.analysis.material.feasibility}/100`,
        lca: `LCA ${state.analysis.material.lca}/100, decomposition ${state.analysis.material.decomposition}`
      }[agent.key];
      return { ...agent, status: "Local", result };
    });
    state.bridge.lastMessage = "Bridge unavailable; local agent workflow used";
    persist("Local agent workflow generated");
  } finally {
    loadingAction = "";
    render();
  }
}

async function handleRequirementUpload(fileList) {
  const files = [...fileList];
  if (!files.length) return;

  const uploads = [];
  const chunks = [];

  for (const file of files) {
    const textLike = /^(text\/|application\/json)/.test(file.type) || /\.(txt|md|json|csv)$/i.test(file.name);
    if (textLike) {
      const content = (await file.text()).trim();
      if (content) chunks.push(`File: ${file.name}\n${content}`);
    }
    uploads.push({
      name: file.name,
      size: file.size,
      parsed: textLike,
      uploadedAt: new Date().toISOString()
    });
  }

  state.uploadedFiles = [...uploads, ...state.uploadedFiles].slice(0, 8);
  if (chunks.length) state.requirementText = [state.requirementText, ...chunks].filter(Boolean).join("\n\n");
  persist(chunks.length ? "Requirements added" : "Upload noted");
}

function exportSnapshot() {
  syncDraftFromDom();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(makeCurrentModelPayload(), null, 2)], { type: "application/json" }));
  link.download = `${sanitizeFilename(state.concept.title)}-solidworks-payload.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  showToast("Model payload exported");
}

function resetDemo() {
  state = createDefaultState();
  persist("Demo reset");
}

function renderHeader() {
  document.getElementById("projectTitle").textContent = `${state.concept.title} - R${String(state.revision).padStart(2, "0")}`;
  const aiStatus = document.getElementById("aiStatus");
  const bridgeStatus = document.getElementById("bridgeStatus");
  aiStatus.textContent = `AI: ${state.ai.status}`;
  bridgeStatus.textContent = `CAD: ${state.cloud.status || state.bridge.status}`;
  aiStatus.className = `status-pill ${statusClass(state.ai.status)}`;
  bridgeStatus.className = `status-pill ${statusClass(state.cloud.status || state.bridge.status)}`;
}

function renderCopilot() {
  const keyPresent = Boolean(sessionStorage.getItem(SESSION_AI_KEY));
  document.getElementById("copilotPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">AI copilot</span>
        <h2>Generate and revise</h2>
      </div>
      <span class="badge ${state.ai.mode === "parser" ? "warn" : ""}">${escapeHtml(state.ai.mode)}</span>
    </div>
    <div class="panel-body fill-panel">
      <div class="field-grid">
        <div>
          <label for="promptInput">Prompt</label>
          <textarea id="promptInput">${escapeHtml(state.prompt)}</textarea>
        </div>
        <div class="field-row">
          <div>
            <label for="aiMode">AI source</label>
            <select id="aiMode">
              <option value="openai" ${state.ai.mode === "openai" ? "selected" : ""}>OpenAI key</option>
              <option value="bridge" ${state.ai.mode === "bridge" ? "selected" : ""}>AI endpoint</option>
              <option value="parser" ${state.ai.mode === "parser" ? "selected" : ""}>Local parser</option>
            </select>
          </div>
          <div>
            <label for="aiModel">Model</label>
            <input id="aiModel" value="${escapeHtml(state.ai.model || DEFAULT_MODEL)}">
          </div>
        </div>
        <div class="field-grid">
          <div>
            <label for="aiKey">OpenAI API key</label>
            <input id="aiKey" type="password" placeholder="${keyPresent ? "Key loaded for this tab" : "sk-..."}">
          </div>
          <div>
            <label for="aiEndpoint">AI endpoint</label>
            <input id="aiEndpoint" value="${escapeHtml(state.ai.endpoint)}" placeholder="https://your-server.example.com/api/copilot">
          </div>
        </div>
        <div class="button-row">
          <button class="button primary" data-action="ask-ai" ${loadingAction === "ask-ai" ? "disabled" : ""}>Ask AI</button>
          <button class="button secondary" data-action="generate-model">Local generate</button>
        </div>
        <div class="ai-output">${escapeHtml(state.ai.lastReply)}</div>
        <div>
          <label>Agent lanes</label>
          <div class="agent-grid">
            ${state.agents.map(agent => `
              <article class="agent-card">
                <span>${escapeHtml(agent.label)}</span>
                <strong>${escapeHtml(agent.status)}</strong>
                <p>${escapeHtml(agent.result || agent.role)}</p>
              </article>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderRequirements() {
  document.getElementById("requirementsPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Requirements intake</span>
        <h2>Brief and files</h2>
      </div>
    </div>
    <div class="panel-body fill-panel">
      <div class="field-grid">
        <div class="field-row">
          <div>
            <label for="templateSelect">Template</label>
            <select id="templateSelect">
              <option value="auto" ${state.selectedTemplate === "auto" ? "selected" : ""}>Auto</option>
              <option value="enclosure" ${state.selectedTemplate === "enclosure" ? "selected" : ""}>Enclosure</option>
              <option value="bottle" ${state.selectedTemplate === "bottle" ? "selected" : ""}>Bottle</option>
              <option value="bracket" ${state.selectedTemplate === "bracket" ? "selected" : ""}>Bracket</option>
              <option value="tray" ${state.selectedTemplate === "tray" ? "selected" : ""}>Tray</option>
              <option value="assembly" ${state.selectedTemplate === "assembly" ? "selected" : ""}>Assembly</option>
            </select>
          </div>
          <div>
            <label for="requirementFiles">Upload</label>
            <input id="requirementFiles" type="file" multiple>
          </div>
        </div>
        <div class="field-row">
          <div>
            <label for="imageFiles">Reference images</label>
            <input id="imageFiles" type="file" accept="image/*" multiple>
          </div>
          <div>
            <label for="tableFiles">Spreadsheet/design table</label>
            <input id="tableFiles" type="file" accept=".csv,.tsv,.txt,.xlsx" multiple>
          </div>
        </div>
        <div>
          <label for="requirementText">Requirements</label>
          <textarea id="requirementText">${escapeHtml(state.requirementText)}</textarea>
        </div>
        <div class="button-row">
          <button class="button primary" data-action="generate-model">Generate model</button>
          <button class="button secondary" data-action="ask-ai">Send to AI</button>
          <button class="button secondary" data-action="export-design-table">Export design table</button>
          <button class="button ghost" data-action="reset-demo">Reset</button>
        </div>
        <div class="intake-grid">
          <div class="upload-list">
            ${state.uploadedFiles.length ? state.uploadedFiles.map(file => `
              <div class="upload-item">
                <strong>${escapeHtml(file.name)}</strong>
                <span>${file.parsed ? "parsed" : "stored"}</span>
              </div>
            `).join("") : `<div class="upload-item"><strong>No brief files</strong><span>txt, md, json, csv</span></div>`}
          </div>
          <div class="upload-list">
            ${state.geometry.images.length ? state.geometry.images.map(image => `
              <div class="upload-item">
                <strong>${escapeHtml(image.name)}</strong>
                <span>${image.confidence}% contour</span>
              </div>
            `).join("") : `<div class="upload-item"><strong>No image profiles</strong><span>contours</span></div>`}
          </div>
          <div class="upload-list">
            <div class="upload-item">
              <strong>${escapeHtml(state.designTable.lastMessage)}</strong>
              <span>${state.designTable.rows.length || state.parameters.length} rows</span>
            </div>
            <div class="upload-item">
              <strong>${escapeHtml(state.geometry.lastMessage)}</strong>
              <span>${state.geometry.transitionMatrix.length} matrix steps</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderModel() {
  const baseUrl = state.bridge.url ? normalizeBaseUrl(state.bridge.url) : "";
  const bridgeViewer = state.bridge.embedUrl || (baseUrl ? `${baseUrl}/viewer` : "");
  const cloudViewer = state.cloud.embedUrl || state.cloud.launchUrl || state.cloud.spaceUrl;
  const showCloud = state.cloud.displayMode === "cloud" && cloudViewer;
  const showBridge = !showCloud && state.bridge.embedUrl;
  document.getElementById("modelPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Model</span>
        <h2>SolidWorks window</h2>
      </div>
      <span class="badge ${showCloud || showBridge ? "good" : "warn"}">${showCloud ? "cloud" : showBridge ? "bridge" : "preview"}</span>
    </div>
    <div class="panel-body fill-panel">
      <div class="model-tools">
        <div>
          <label for="bridgeUrl">SolidWorks bridge URL</label>
          <input id="bridgeUrl" value="${escapeHtml(state.bridge.url)}" placeholder="https://localhost:8787">
        </div>
        <button class="button secondary" data-action="connect-bridge" ${loadingAction === "connect-bridge" ? "disabled" : ""}>Connect</button>
        <button class="button primary" data-action="send-model" ${loadingAction === "send-model" ? "disabled" : ""}>Send model</button>
      </div>
      <div class="button-row">
        <button class="button secondary" data-action="simulate" ${loadingAction === "simulate" ? "disabled" : ""}>Run FEA</button>
        <button class="button secondary" data-action="optimize" ${loadingAction === "optimize" ? "disabled" : ""}>Optimize</button>
        <button class="button secondary" data-action="material" ${loadingAction === "material" ? "disabled" : ""}>Material/LCA</button>
        <button class="button secondary" data-action="run-agents" ${loadingAction === "agents" ? "disabled" : ""}>Run agents</button>
      </div>
      <div class="cloud-panel">
        <div>
          <label>Online cloud mode</label>
          <strong>${escapeHtml(state.cloud.provider)}</strong>
          <p>${escapeHtml(state.cloud.lastMessage)}</p>
        </div>
        <div class="field-row">
          <div>
            <label for="cloudSpaceUrl">3DEXPERIENCE workspace URL</label>
            <input id="cloudSpaceUrl" value="${escapeHtml(state.cloud.spaceUrl)}" placeholder="https://my.3dexperience.3ds.com/">
          </div>
          <div>
            <label for="cloudBrokerUrl">Cloud broker URL</label>
            <input id="cloudBrokerUrl" value="${escapeHtml(state.cloud.brokerUrl)}" placeholder="https://your-cloud-broker.example.com">
          </div>
        </div>
        <div class="button-row">
          <button class="button primary" data-action="open-cloud">Open / log in</button>
          <button class="button secondary" data-action="show-cloud-frame">Show inside</button>
          <button class="button secondary" data-action="connect-cloud" ${loadingAction === "connect-cloud" ? "disabled" : ""}>Connect cloud</button>
          <button class="button secondary" data-action="push-cloud" ${loadingAction === "push-cloud" ? "disabled" : ""}>Push package</button>
          <button class="button ghost" data-action="show-local-preview">Show preview</button>
          <button class="button ghost" data-action="export-cloud-package">Export cloud package</button>
        </div>
      </div>
      <div class="model-frame">
        <div class="model-bar">
          <span>${escapeHtml(showCloud ? "3DEXPERIENCE / xDesign workspace" : state.bridge.activeDocument || `${sanitizeFilename(state.concept.title)}.SLDPRT`)}</span>
          <span>${escapeHtml(showCloud ? "SOLIDWORKS account" : state.concept.material)}</span>
        </div>
        <div class="model-embed">
          ${showCloud ? `
            <iframe title="3DEXPERIENCE cloud workspace" src="${escapeHtml(cloudViewer)}"></iframe>
            <div class="embed-note">
              Some SOLIDWORKS/3DEXPERIENCE pages block third-party iframe embedding. If this area refuses to load, use <button class="link-button" data-action="open-cloud">Open / log in</button>.
            </div>
          ` : showBridge ? `<iframe title="Embedded SolidWorks bridge viewer" src="${escapeHtml(bridgeViewer)}"></iframe>` : `
            <div class="preview-stage">${renderPreviewSvg()}</div>
          `}
        </div>
      </div>
      <div class="bridge-strip">
        <div class="bridge-card"><span>Status</span><strong>${escapeHtml(state.bridge.status)}</strong></div>
        <div class="bridge-card"><span>Last sync</span><strong>${escapeHtml(formatDate(state.bridge.lastSync))}</strong></div>
        <div class="bridge-card"><span>Bridge message</span><strong>${escapeHtml(state.bridge.lastMessage)}</strong></div>
        <div class="bridge-card"><span>FEA</span><strong>${escapeHtml(state.analysis.simulation ? `${state.analysis.simulation.status} SF ${state.analysis.simulation.safetyFactor || "-"}` : "Not run")}</strong></div>
        <div class="bridge-card"><span>Optimization</span><strong>${escapeHtml(state.analysis.optimization ? state.analysis.optimization.status : "Not run")}</strong></div>
        <div class="bridge-card"><span>Material/LCA</span><strong>${escapeHtml(`${state.analysis.material.feasibility}/100 - LCA ${state.analysis.material.lca}/100`)}</strong></div>
        <div class="bridge-card"><span>Cloud</span><strong>${escapeHtml(state.cloud.status)}</strong></div>
        <div class="bridge-card"><span>Cloud sync</span><strong>${escapeHtml(formatDate(state.cloud.lastSync))}</strong></div>
      </div>
    </div>
  `;
}

function renderSpecs() {
  document.getElementById("specsPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Current model specs</span>
        <h2>${escapeHtml(state.concept.familyLabel)} parameters</h2>
      </div>
      <div class="button-row">
        <button class="button secondary" data-action="apply-parameters">Apply specs</button>
        <button class="button ghost" data-action="export-snapshot">Export JSON</button>
      </div>
    </div>
    <div class="specs-body">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Spec</th>
              <th>Value</th>
              <th>Unit</th>
              <th>SolidWorks</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            ${state.parameters.map((parameter, index) => `
              <tr>
                <td>${escapeHtml(parameter.label)}</td>
                <td><input id="param-${escapeHtml(parameter.key)}" type="number" step="0.1" value="${escapeHtml(parameter.value)}"></td>
                <td>${escapeHtml(parameter.unit)}</td>
                <td><code>${escapeHtml(parameter.swDimension || toSolidWorksDimensionName(parameter, index))}</code></td>
                <td><span class="badge ${sourceBadge(parameter.source)}">${escapeHtml(parameter.source)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <aside class="spec-summary">
        <div>
          <span class="meta-label">Document</span>
          <h3>${escapeHtml(state.bridge.activeDocument)}</h3>
        </div>
        <p>${escapeHtml(state.requirements.slice(0, 3).join(" "))}</p>
        <div class="mini-list">
          <div class="mini-item"><strong>Design table</strong><span>${state.designTable.rows.length || state.parameters.length} rows</span></div>
          <div class="mini-item"><strong>Image profiles</strong><span>${state.geometry.images.length}</span></div>
          <div class="mini-item"><strong>FEA</strong><span>${escapeHtml(state.analysis.simulation ? state.analysis.simulation.status : "Pending")}</span></div>
          <div class="mini-item"><strong>LCA</strong><span>${escapeHtml(`${state.analysis.material.lca}/100`)}</span></div>
        </div>
        <p>${escapeHtml(state.analysis.optimization?.recommendations?.[0] || state.analysis.material.recommendation)}</p>
        <div class="chip-list">
          ${state.concept.features.map(feature => `<span class="chip">${escapeHtml(feature)}</span>`).join("")}
        </div>
      </aside>
    </div>
  `;
}

function renderPreviewSvg() {
  const family = state.concept.family;
  const length = getParameter("length", getParameter("baseLength", 170));
  const width = getParameter("width", getParameter("baseWidth", getParameter("bodyDiameter", 80)));
  const height = getParameter("height", getParameter("legHeight", getParameter("depth", 42)));
  const wall = getParameter("wall", getParameter("thickness", 2.5));

  if (family === "bottle") {
    const bodyWidth = clamp(width * 1.5, 86, 150);
    const neckWidth = clamp(getParameter("neckDiameter", 28) * 1.7, 34, 72);
    return `
      <svg viewBox="0 0 420 280" role="img" aria-label="Bottle model preview">
        <defs><linearGradient id="bottleFill" x1="0%" x2="100%"><stop offset="0%" stop-color="#8fbeb6"/><stop offset="100%" stop-color="#487d76"/></linearGradient></defs>
        <ellipse cx="210" cy="240" rx="${bodyWidth / 2}" ry="18" fill="rgba(23,34,37,.12)"/>
        <path d="M ${210 - bodyWidth / 2} 215 C ${210 - bodyWidth / 2} 150, ${210 - neckWidth / 2} 138, ${210 - neckWidth / 2} 98 L ${210 - neckWidth / 2} 62 L ${210 + neckWidth / 2} 62 L ${210 + neckWidth / 2} 98 C ${210 + neckWidth / 2} 138, ${210 + bodyWidth / 2} 150, ${210 + bodyWidth / 2} 215 Z" fill="url(#bottleFill)" stroke="#24383d" stroke-width="4"/>
        <text x="210" y="260" text-anchor="middle" fill="#405458" font-size="13">H ${round(height, 0)} mm</text>
      </svg>
    `;
  }

  if (family === "bracket") {
    return `
      <svg viewBox="0 0 420 280" role="img" aria-label="Bracket model preview">
        <defs><linearGradient id="bracketFill" x1="0%" x2="100%"><stop offset="0%" stop-color="#d0a45f"/><stop offset="100%" stop-color="#916c35"/></linearGradient></defs>
        <ellipse cx="210" cy="235" rx="118" ry="20" fill="rgba(23,34,37,.12)"/>
        <path d="M 110 85 L 190 85 L 190 165 L 300 165 L 300 205 L 150 205 Q 122 205 122 178 L 122 97 Q 122 85 110 85 Z" fill="url(#bracketFill)" stroke="#594628" stroke-width="5"/>
        <circle cx="165" cy="185" r="11" fill="#fff" stroke="#594628" stroke-width="4"/>
        <circle cx="250" cy="185" r="11" fill="#fff" stroke="#594628" stroke-width="4"/>
        <circle cx="168" cy="118" r="11" fill="#fff" stroke="#594628" stroke-width="4"/>
        <text x="210" y="260" text-anchor="middle" fill="#405458" font-size="13">L ${round(getParameter("baseLength", length), 0)} mm</text>
      </svg>
    `;
  }

  if (family === "tray") {
    const trayWidth = clamp(length * .62, 150, 250);
    return `
      <svg viewBox="0 0 420 280" role="img" aria-label="Tray model preview">
        <defs><linearGradient id="trayFill" x1="0%" x2="100%"><stop offset="0%" stop-color="#9cc8bf"/><stop offset="100%" stop-color="#557f78"/></linearGradient></defs>
        <ellipse cx="210" cy="238" rx="134" ry="20" fill="rgba(23,34,37,.12)"/>
        <path d="M ${210 - trayWidth / 2} 102 L ${210 + trayWidth / 2} 102 L ${210 + trayWidth / 2 - 24} 210 L ${210 - trayWidth / 2 + 24} 210 Z" fill="url(#trayFill)" stroke="#315651" stroke-width="4"/>
        <g fill="rgba(255,255,255,.58)" stroke="#315651" stroke-width="3">
          <rect x="134" y="128" width="52" height="54" rx="9"/>
          <rect x="198" y="128" width="52" height="54" rx="9"/>
          <rect x="262" y="128" width="52" height="54" rx="9"/>
        </g>
        <text x="210" y="260" text-anchor="middle" fill="#405458" font-size="13">${round(length, 0)} x ${round(width, 0)} mm</text>
      </svg>
    `;
  }

  const bodyWidth = clamp(length * .9, 160, 250);
  const bodyHeight = clamp(height * 2.2, 76, 130);
  return `
    <svg viewBox="0 0 420 280" role="img" aria-label="Enclosure model preview">
      <defs><linearGradient id="shellFill" x1="0%" x2="100%"><stop offset="0%" stop-color="#93b6b1"/><stop offset="100%" stop-color="#3f6965"/></linearGradient></defs>
      <ellipse cx="210" cy="238" rx="134" ry="20" fill="rgba(23,34,37,.12)"/>
      <path d="M ${210 - bodyWidth / 2} ${145 - bodyHeight / 2} L ${210 + bodyWidth / 2} ${145 - bodyHeight / 2} L ${210 + bodyWidth / 2 + 34} ${145 - bodyHeight / 2 + 38} L ${210 + bodyWidth / 2 - 4} ${145 + bodyHeight / 2} L ${210 - bodyWidth / 2 - 34} ${145 + bodyHeight / 2 - 38} Z" fill="url(#shellFill)" stroke="#24383d" stroke-width="4"/>
      <path d="M ${210 - bodyWidth / 2 + 24} ${145 - bodyHeight / 2 + 20} L ${210 + bodyWidth / 2 - 24} ${145 - bodyHeight / 2 + 20}" stroke="#dbe8e5" stroke-width="${clamp(wall * 2, 3, 8)}" stroke-linecap="round"/>
      <circle cx="154" cy="166" r="9" fill="#edf3f2" stroke="#24383d" stroke-width="3"/>
      <circle cx="266" cy="166" r="9" fill="#edf3f2" stroke="#24383d" stroke-width="3"/>
      <text x="210" y="260" text-anchor="middle" fill="#405458" font-size="13">${round(length, 0)} x ${round(width, 0)} x ${round(height, 0)} mm</text>
    </svg>
  `;
}

function render() {
  renderHeader();
  renderCopilot();
  renderRequirements();
  renderModel();
  renderSpecs();
}

document.addEventListener("click", event => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "ask-ai") askCopilot();
  if (action === "generate-model") generateModel();
  if (action === "apply-parameters") applyParameterChanges();
  if (action === "connect-bridge") connectBridge();
  if (action === "send-model") sendToSolidWorks();
  if (action === "simulate") runSimulation();
  if (action === "optimize") optimizeModel();
  if (action === "material") assessMaterial();
  if (action === "run-agents") runAgents();
  if (action === "open-cloud") openCloudWorkspace();
  if (action === "show-cloud-frame") showCloudFrame();
  if (action === "show-local-preview") showLocalPreview();
  if (action === "connect-cloud") connectCloud();
  if (action === "push-cloud") pushToCloud();
  if (action === "export-cloud-package") exportCloudPackage();
  if (action === "export-design-table") exportDesignTable();
  if (action === "export-snapshot") exportSnapshot();
  if (action === "reset-demo") resetDemo();
});

document.addEventListener("change", event => {
  if (event.target.id === "requirementFiles") handleRequirementUpload(event.target.files);
  if (event.target.id === "imageFiles") handleImageUpload(event.target.files);
  if (event.target.id === "tableFiles") handleTableUpload(event.target.files);
  if (["aiMode", "aiModel", "aiEndpoint", "templateSelect", "bridgeUrl", "cloudBrokerUrl", "cloudSpaceUrl"].includes(event.target.id)) {
    syncDraftFromDom();
    persist();
  }
});

window.addEventListener("beforeunload", syncDraftFromDom);

render();
