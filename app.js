const STORAGE_KEY = "solidworks-ai-cad-studio-v3";
const SESSION_AI_KEY = "solidworks-ai-openai-key";
const DEFAULT_MODEL = "gpt-5-mini";
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
      mode: "openai",
      model: DEFAULT_MODEL,
      endpoint: "",
      status: "Needs key",
      lastReply: "Enter an AI key or endpoint, then ask the copilot to generate or revise the model."
    },
    bridge: {
      url: "https://localhost:8787",
      status: "Disconnected",
      embedUrl: "",
      activeDocument: blueprint.targetDoc,
      lastSync: "",
      lastMessage: "No SolidWorks bridge connected"
    },
    concept: blueprint.concept,
    requirements: blueprint.requirements,
    parameters: blueprint.parameters,
    solidworksIntent: blueprint.solidworksIntent
  };
}

function normalizeState(saved) {
  const defaults = createDefaultState();
  return {
    ...defaults,
    ...saved,
    ai: { ...defaults.ai, ...(saved.ai || {}) },
    bridge: { ...defaults.bridge, ...(saved.bridge || {}) },
    concept: { ...defaults.concept, ...(saved.concept || {}) },
    uploadedFiles: Array.isArray(saved.uploadedFiles) ? saved.uploadedFiles : [],
    requirements: Array.isArray(saved.requirements) && saved.requirements.length ? saved.requirements : defaults.requirements,
    parameters: Array.isArray(saved.parameters) && saved.parameters.length ? saved.parameters : defaults.parameters,
    solidworksIntent: saved.solidworksIntent || defaults.solidworksIntent
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
  const parameters = library.parameters.map(definition => {
    const result = definition.type === "count"
      ? extractCount(combined, definition.aliases, definition.fallback)
      : extractNumber(combined, definition.aliases, definition.fallback, definition.unit);
    return { ...definition, value: result.value, source: result.source };
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

  if (prompt) state.prompt = prompt.value.trim();
  if (requirements) state.requirementText = requirements.value.trim();
  if (template) state.selectedTemplate = template.value;
  if (aiMode) state.ai.mode = aiMode.value;
  if (aiModel) state.ai.model = aiModel.value.trim() || DEFAULT_MODEL;
  if (aiEndpoint) state.ai.endpoint = aiEndpoint.value.trim();
  if (aiKey && aiKey.value.trim()) sessionStorage.setItem(SESSION_AI_KEY, aiKey.value.trim());
  if (bridgeUrl) state.bridge.url = bridgeUrl.value.trim();
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
    parameters: state.parameters.map(({ key, label, unit, value, source }) => ({ key, label, unit, value, source })),
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
        source: item.source || "AI"
      };
    })
    : localBlueprint.parameters.map(item => ({ ...item, source: item.source === "Requirement" ? "Requirement" : "AI" }));

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
    '  "solidworksIntent": {"documentType":"part","rebuildMode":"parametric","operations":[{"order":1,"name":"Base shell","action":"create_or_update"}]}',
    "}",
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
  bridgeStatus.textContent = `SolidWorks: ${state.bridge.status}`;
  aiStatus.className = `status-pill ${statusClass(state.ai.status)}`;
  bridgeStatus.className = `status-pill ${statusClass(state.bridge.status)}`;
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
        <div>
          <label for="requirementText">Requirements</label>
          <textarea id="requirementText">${escapeHtml(state.requirementText)}</textarea>
        </div>
        <div class="button-row">
          <button class="button primary" data-action="generate-model">Generate model</button>
          <button class="button secondary" data-action="ask-ai">Send to AI</button>
          <button class="button ghost" data-action="reset-demo">Reset</button>
        </div>
        <div class="upload-list">
          ${state.uploadedFiles.length ? state.uploadedFiles.map(file => `
            <div class="upload-item">
              <strong>${escapeHtml(file.name)}</strong>
              <span>${file.parsed ? "parsed" : "stored"}</span>
            </div>
          `).join("") : `<div class="upload-item"><strong>No files</strong><span>txt, md, json, csv</span></div>`}
        </div>
      </div>
    </div>
  `;
}

function renderModel() {
  const baseUrl = state.bridge.url ? normalizeBaseUrl(state.bridge.url) : "";
  const bridgeViewer = state.bridge.embedUrl || (baseUrl ? `${baseUrl}/viewer` : "");
  document.getElementById("modelPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Model</span>
        <h2>SolidWorks window</h2>
      </div>
      <span class="badge ${state.bridge.embedUrl ? "good" : "warn"}">${state.bridge.embedUrl ? "embedded" : "preview"}</span>
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
      <div class="model-frame">
        <div class="model-bar">
          <span>${escapeHtml(state.bridge.activeDocument || `${sanitizeFilename(state.concept.title)}.SLDPRT`)}</span>
          <span>${escapeHtml(state.concept.material)}</span>
        </div>
        <div class="model-embed">
          ${state.bridge.embedUrl ? `<iframe title="Embedded SolidWorks bridge viewer" src="${escapeHtml(bridgeViewer)}"></iframe>` : `
            <div class="preview-stage">${renderPreviewSvg()}</div>
          `}
        </div>
      </div>
      <div class="bridge-strip">
        <div class="bridge-card"><span>Status</span><strong>${escapeHtml(state.bridge.status)}</strong></div>
        <div class="bridge-card"><span>Last sync</span><strong>${escapeHtml(formatDate(state.bridge.lastSync))}</strong></div>
        <div class="bridge-card"><span>Bridge message</span><strong>${escapeHtml(state.bridge.lastMessage)}</strong></div>
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
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            ${state.parameters.map(parameter => `
              <tr>
                <td>${escapeHtml(parameter.label)}</td>
                <td><input id="param-${escapeHtml(parameter.key)}" type="number" step="0.1" value="${escapeHtml(parameter.value)}"></td>
                <td>${escapeHtml(parameter.unit)}</td>
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
  if (action === "export-snapshot") exportSnapshot();
  if (action === "reset-demo") resetDemo();
});

document.addEventListener("change", event => {
  if (event.target.id === "requirementFiles") handleRequirementUpload(event.target.files);
  if (["aiMode", "aiModel", "aiEndpoint", "templateSelect", "bridgeUrl"].includes(event.target.id)) {
    syncDraftFromDom();
    persist();
  }
});

window.addEventListener("beforeunload", syncDraftFromDom);

render();
