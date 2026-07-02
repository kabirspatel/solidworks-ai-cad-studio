const STORAGE_KEY = "solidworks-ai-cad-studio-v4";
const SESSION_AI_KEY = "solidworks-ai-openai-key";
const SESSION_CLAUDE_KEY = "solidworks-ai-claude-key";
const SESSION_GEMINI_KEY = "solidworks-ai-gemini-key";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
const LEGACY_GEMINI_MODEL = "gemini-2.0-flash";
const DEFAULT_BRIDGE_URL = "";
const DEFAULT_AI_ENDPOINT = "";
const DEFAULT_CLOUD_SPACE_URL = "";
const DEFAULT_XDESIGN_INFO_URL = "https://www.solidworks.com/product/solidworks-xdesign";
const DEFAULT_PROMPT = "";
const DEFAULT_REQUIREMENTS = "";

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

const STANDARDS_LIBRARY = {
  bottle: {
    all: [
      { id: "21 CFR 165.110", title: "Bottled water quality standards", category: "regulatory",
        scope: "US bottled water labeling, source ID, quality limits",
        labelRequired: "Water type; net quantity; manufacturer/packer/distributor address; lot/date code",
        testRequired: "Contaminant analysis; microbiological testing per NSF/ANSI 60",
        constraints: [
          { param: "closure", rule: "Tamper-evident closure required — PLA/CPLA cap with linerless plug" },
          { param: "neckDiameter", rule: "Standard tamper-evident finish recommended (28mm PCO-equivalent)" }
        ]
      },
      { id: "FDA 21 CFR 101", title: "Food labeling general requirements", category: "labeling",
        scope: "All packaged food-contact goods sold in the US",
        labelRequired: "Statement of identity; net quantity (oz + mL); manufacturer/packer/distributor address; lot/date code",
        testRequired: "Label compliance review before market launch",
        constraints: [
          { param: "labelArea", rule: "Label panel must accommodate statement of identity, net quantity, and full address block" }
        ]
      },
      { id: "ASTM D2463", title: "Drop impact resistance of plastic bottles", category: "mechanical",
        scope: "Plastic bottles up to 4L — drop impact qualification",
        labelRequired: "None",
        testRequired: "Drop from 1.8m (6ft) onto concrete; 6 specimens minimum; zero rupture pass criterion",
        constraints: [
          { param: "wall", rule: "min 0.65mm blow-molded PLA body wall; increase for H > 220mm" },
          { param: "base", rule: "min 1.4mm base thickness to pass drop resistance" }
        ]
      },
      { id: "California Prop 65", title: "Safe Drinking Water and Toxic Enforcement Act", category: "regulatory",
        scope: "California — chemical exposure warnings required above threshold levels",
        labelRequired: "Warning label if any listed chemical exceeds threshold (BPA, phthalates common triggers)",
        testRequired: "Leachability testing for SVHC substances in contact with contents",
        constraints: [
          { param: "material", rule: "Ensure PLA resin and enzyme additive have no Prop 65-listed chemicals above threshold" }
        ]
      }
    ],
    PLA: [
      { id: "ASTM D6400", title: "Standard specification for compostable plastics", category: "sustainability",
        scope: "Plastics designed for aerobic composting in industrial or municipal facilities",
        labelRequired: "BPI or equivalent compostability certification mark; RIC 7 PLA symbol",
        testRequired: "CO₂ evolution per ISO 14855; disintegration per ISO 16929; ecotoxicity; heavy metals analysis",
        constraints: [
          { param: "material", rule: "Must use certified PLA resin with compostability test data on file" }
        ]
      },
      { id: "EN 13432", title: "Packaging recoverable through composting (EU)", category: "sustainability",
        scope: "European compostable packaging — required for EU eco-label and seedling logo",
        labelRequired: "Seedling logo if certified by DIN CERTCO or TÜV Austria",
        testRequired: "Biodegradation per ISO 14855; disintegration per EN 14045; ecotoxicity",
        constraints: [
          { param: "material", rule: "Both PLA base resin and all additives must independently pass EN 13432 testing" }
        ]
      },
      { id: "FDA FCN 000178", title: "FDA food contact notification — polylactic acid", category: "food-contact",
        scope: "PLA polymers for food-contact use (NatureWorks Ingeo and equivalents)",
        labelRequired: "None additional",
        testRequired: "Migration testing with food simulants per FDA guidance; AA (acetaldehyde) level < 10µg/L",
        constraints: [
          { param: "material", rule: "Use NatureWorks Ingeo or equivalent PLA with active FDA FCN or GRAS status" },
          { param: "temperature", rule: "Max use temp ~40°C for cold-fill PLA food contact; not suitable for hot-fill" }
        ]
      }
    ],
    "PLA + enzyme additive system": [
      { id: "ASTM D6400", title: "Standard specification for compostable plastics", category: "sustainability",
        scope: "Plastics designed for aerobic composting in industrial or municipal facilities",
        labelRequired: "BPI or equivalent compostability certification mark; RIC 7 PLA symbol",
        testRequired: "CO₂ evolution per ISO 14855; disintegration per ISO 16929; ecotoxicity",
        constraints: [
          { param: "material", rule: "Both PLA base resin and enzyme additive package must independently pass compostability testing" }
        ]
      },
      { id: "EN 13432", title: "Packaging recoverable through composting (EU)", category: "sustainability",
        scope: "European compostable packaging",
        labelRequired: "Seedling logo if certified by DIN CERTCO or TÜV Austria",
        testRequired: "Biodegradation + disintegration + ecotoxicity — enzyme additive tested as part of formulation",
        constraints: [
          { param: "additive", rule: "Enzyme additive package must be declared and tested as part of the finished article" }
        ]
      },
      { id: "FDA FCN 000178", title: "FDA food contact notification — PLA polymers", category: "food-contact",
        scope: "PLA for food-contact use",
        labelRequired: "None additional",
        testRequired: "Migration testing with food simulants; confirm enzyme additive is GRAS or FCN-listed separately",
        constraints: [
          { param: "additive", rule: "Enzyme additive must have separate FDA FCN or GRAS determination for food contact" }
        ]
      }
    ],
    PET: [
      { id: "FDA 21 CFR 177.1630", title: "Polyethylene terephthalate resins for food contact", category: "food-contact",
        scope: "PET resins for direct food contact — beverage and water bottles",
        labelRequired: "RIC 1 (PETE/PET) symbol",
        testRequired: "Overall migration < 60mg/kg food simulant; AA level < 5µg/L for water",
        constraints: [
          { param: "material", rule: "PET intrinsic viscosity ≥ 0.72 dL/g for blow-molded bottles" }
        ]
      },
      { id: "ISBT 301", title: "28mm PCO 1881 neck finish standard", category: "manufacturing",
        scope: "Industry-standard 28mm neck finish for PET water and beverage bottles",
        labelRequired: "None",
        testRequired: "Neck finish gauging per ISBT 301 dimensional drawings",
        constraints: [
          { param: "neckDiameter", rule: "28mm PCO 1881 finish: T-dimension 34.925±0.15mm" },
          { param: "threadPitch", rule: "3.175mm pitch for standard PCO 1881 finish" }
        ]
      }
    ],
    PETG: [
      { id: "FDA 21 CFR 177.1315", title: "Copolymers of ethylene for food contact (PETG family)", category: "food-contact",
        scope: "PETG and copolyester materials for food packaging",
        labelRequired: "Material declaration if required by regional regulation",
        testRequired: "Migration testing per FDA guidance; simulate worst-case food contact conditions",
        constraints: []
      }
    ]
  },
  enclosure: {
    all: [
      { id: "IEC 60529", title: "Degrees of protection by enclosures (IP Code)", category: "mechanical",
        scope: "Solid and liquid ingress protection rating system",
        labelRequired: "IP rating marking on enclosure exterior",
        testRequired: "IP5X: dust-limited; IP6X: dust-tight; IPX4: splash proof; IPX7: 1m immersion 30min",
        constraints: [
          { param: "wall", rule: "min 2.5mm for IP54 rating in PC-ABS injection-molded enclosure" }
        ]
      },
      { id: "UL 94", title: "Tests for flammability of plastic materials", category: "safety",
        scope: "Flammability classification V-0 / V-1 / V-2 / HB for enclosure materials",
        labelRequired: "UL 94 flame class marking on enclosure or rating plate",
        testRequired: "Vertical burn test per UL 94; evaluate self-extinguishing time and drip behavior",
        constraints: [
          { param: "material", rule: "V-0 rated PC-ABS required for electronic enclosures near ignition sources" },
          { param: "wall", rule: "min 2.3mm for V-0 classification in standard PC-ABS grade" }
        ]
      },
      { id: "RoHS 2011/65/EU", title: "Restriction of hazardous substances in electrical equipment", category: "chemical",
        scope: "Electronic equipment sold in EU — restricted substances limits",
        labelRequired: "CE marking (RoHS compliance part of CE declaration)",
        testRequired: "Pb, Hg, Cd, Cr⁶⁺, PBB, PBDE below threshold in all homogeneous materials",
        constraints: [
          { param: "material", rule: "Use RoHS-compliant PC-ABS grade; verify colorant, stabilizer, and flame-retardant package" }
        ]
      },
      { id: "REACH Reg EC 1907/2006", title: "Registration, Evaluation, Authorisation of Chemicals", category: "chemical",
        scope: "EU chemical regulation — SVHC substance disclosure in articles ≥ 0.1% w/w",
        labelRequired: "SVHC content disclosure on request; supply-chain communication required",
        testRequired: "SVHC content testing; supplier declarations for all materials",
        constraints: [
          { param: "material", rule: "Request SVHC declaration from resin supplier; maintain on file" }
        ]
      }
    ],
    "Medical-grade PC-ABS": [
      { id: "ISO 13485:2016", title: "Medical devices — quality management systems", category: "quality",
        scope: "QMS requirements for medical device manufacturers and suppliers",
        labelRequired: "CE marking (EU MDR) or FDA 510(k) / De Novo clearance",
        testRequired: "Design V&V per documented procedures; risk management per ISO 14971",
        constraints: [
          { param: "cornerRadius", rule: "min 2mm internal radii for cleanability and stress reduction in molded enclosures" }
        ]
      },
      { id: "ISO 10993-1", title: "Biological evaluation of medical devices", category: "biocompatibility",
        scope: "Biocompatibility testing framework for patient-contact materials",
        labelRequired: "Biocompatibility summary in device technical file",
        testRequired: "Cytotoxicity (ISO 10993-5); sensitization (ISO 10993-10); genotoxicity if implant contact",
        constraints: [
          { param: "material", rule: "Medical-grade PC-ABS must have USP Class VI or ISO 10993 biocompatibility data" }
        ]
      },
      { id: "IEC 60601-1", title: "Medical electrical equipment — general safety requirements", category: "safety",
        scope: "Electrical medical devices — safety, EMC, and performance",
        labelRequired: "CE marking with IEC 60601-1 test report; Notified Body involvement for class IIa+",
        testRequired: "Dielectric strength; leakage current; mechanical robustness; EMC per CISPR 11",
        constraints: [
          { param: "wall", rule: "min 2.5mm for 2MOPP electrical isolation wall if located near mains voltage" }
        ]
      }
    ]
  },
  bracket: {
    all: [
      { id: "ISO 2768-1", title: "General tolerances for linear and angular dimensions", category: "manufacturing",
        scope: "Default dimensional tolerances for machined and formed parts when no individual tolerance is specified",
        labelRequired: "Drawing callout: ISO 2768-m (medium) or ISO 2768-f (fine)",
        testRequired: "CMM or gauge inspection per drawing callout",
        constraints: [
          { param: "holeDiameter", rule: "±0.1mm (medium class) for dimensions 3–30mm; ±0.2mm for 30–120mm" }
        ]
      },
      { id: "ASME B18.3", title: "Socket head cap screws — dimensional standard", category: "manufacturing",
        scope: "Fastener clearance hole and boss sizing for hex-socket cap screws",
        labelRequired: "None",
        testRequired: "Torque specification per installation procedure; pull-out load verification",
        constraints: [
          { param: "holeDiameter", rule: "Clearance holes: M4=4.5mm, M6=6.5mm, M8=8.5mm; boss height ≥ 1.5 × nominal diameter" }
        ]
      }
    ],
    "Aluminum 6061-T6": [
      { id: "ASTM B221", title: "Aluminum-alloy extruded products — 6061-T6", category: "material",
        scope: "6061-T6 extruded bars, rods, wire, and profiles",
        labelRequired: "Material certificate of conformance",
        testRequired: "Tensile strength ≥ 276 MPa; yield ≥ 241 MPa; elongation ≥ 10% per ASTM B221",
        constraints: [
          { param: "thickness", rule: "min 4mm for structural 6061-T6 bracket; minimum corner radius must equal or exceed end-mill radius" }
        ]
      }
    ]
  },
  tray: {
    all: [
      { id: "ISO 11607-1", title: "Packaging for terminally sterilized medical devices", category: "regulatory",
        scope: "Sterile barrier systems and protective packaging for medical trays",
        labelRequired: "Sterilization process indicator; lot/date traceability on label",
        testRequired: "Seal integrity; peel force consistency; bubble leak test; aging/stability",
        constraints: [
          { param: "wall", rule: "min 2.0mm for injection-molded sterile tray shell" },
          { param: "draft", rule: "min 2° draft on all pocket walls for cleanroom demoulding and sterilant penetration" }
        ]
      }
    ]
  },
  assembly: {
    all: [
      { id: "ISO 9001:2015", title: "Quality management systems — requirements", category: "quality",
        scope: "General quality management system applicable to any product type",
        labelRequired: "Quality declaration if ISO 9001 certified",
        testRequired: "Incoming inspection; in-process checks; final functional test",
        constraints: []
      }
    ]
  }
};

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

const BOTTLE_SLIDER_CONFIG = [
  { key:"height",        swKey:"D1@HEIGHT",           label:"Body height",           min:200,  max:235,  step:1,    unit:"mm",    integer:false },
  { key:"bodyDiameter",  swKey:"D2@BODY_DIAMETER",    label:"Max body width",        min:56,   max:88,   step:0.1,  unit:"mm",    integer:false },
  { key:"bodyDepth",     swKey:"D3@BODY_DEPTH",       label:"Body depth",            min:50,   max:80,   step:0.1,  unit:"mm",    integer:false },
  { key:"shoulderHeight",swKey:"D8@SHOULDER_H",       label:"Shoulder height",       min:20,   max:45,   step:1,    unit:"mm",    integer:true  },
  { key:"superellipseN", swKey:"D11@SUPERELLIPSE_N",  label:"Silhouette squareness", min:1.8,  max:4.2,  step:0.05, unit:"",      integer:false },
  { key:"wall",          swKey:"D4@WALL",             label:"Wall thickness",        min:0.65, max:0.85, step:0.01, unit:"mm",    integer:false },
  { key:"ribCount",      swKey:"D12@RIB_COUNT",       label:"Vertical rib count",    min:0,    max:60,   step:1,    unit:"",      integer:true  },
  { key:"ribDepth",      swKey:"D13@RIB_DEPTH",       label:"Vertical rib depth",    min:0,    max:1.5,  step:0.05, unit:"mm",    integer:false },
  { key:"ringCount",     swKey:"D19@RING_COUNT",      label:"Horizontal ring count", min:0,    max:12,   step:1,    unit:"",      integer:true  },
  { key:"ringDepth",     swKey:"D20@RING_DEPTH",      label:"Horizontal ring depth", min:0,    max:1.3,  step:0.05, unit:"mm",    integer:false },
  { key:"facetCount",    swKey:"D14@FACET_COUNT",     label:"Facet / panel count",   min:0,    max:16,   step:1,    unit:"",      integer:true  },
  { key:"facetDepth",    swKey:"D15@FACET_DEPTH",     label:"Facet depth",           min:0,    max:1.5,  step:0.05, unit:"mm",    integer:false },
  { key:"helixRidges",   swKey:"D16@HELIX_RIDGES",   label:"Helix ridge count",     min:0,    max:14,   step:1,    unit:"",      integer:true  },
  { key:"helixDepth",    swKey:"D17@HELIX_DEPTH",     label:"Helix ridge depth",     min:0,    max:1.5,  step:0.05, unit:"mm",    integer:false },
  { key:"helixTurns",    swKey:"D18@HELIX_TURNS",    label:"Helix turns",           min:0,    max:2.2,  step:0.05, unit:"turns", integer:false },
];

const BOTTLE_MORPH_FAMILIES = {
  "01→03": "Minimal cylinder → Sculpted icon",
  "04→06": "Ribbed cylinder → Structural ring",
  "07→08": "Lavender facets → Spiral grip",
  "08→09": "Spiral → Tapered icon",
  "07→09": "Full architecture-to-icon journey",
};

const BOTTLE_LOCKS = [
  ["Fill target",  "500 mL nominal / 530 mL overflow target"],
  ["Neck finish",  "28 mm OD / 21 mm mouth ID"],
  ["Thread pitch", "3 mm conceptual screw thread"],
  ["Cap envelope", "32 mm OD × 18 mm H"],
  ["Base control", "Standing ring locked; min base 1.4 mm"],
  ["Material",     "PLA + enzyme additive system"],
];

const BOTTLE_LOCK_VALUES = {
  targetFillMl: 500,
  overflowTargetMl: 530,
  overflowToleranceMl: 10,
  neckFinishOdMm: 28,
  mouthIdMm: 21,
  threadPitchMm: 3,
  neckHeightMm: 25,
  capOdMm: 32,
  capHeightMm: 18,
  capIdMm: 28.8,
  minBaseMm: 1.4,
  material: "PLA + enzyme additive system",
  capMaterial: "PLA / CPLA cap with linerless plug seal"
};

const BOTTLE_FEATURE_OPTIONS = [
  ["Body ridges", "Horizontal rings", "Vertical ribs", "Flowing wave ribs", "Increase stiffness and top-load strength"],
  ["Grip area", "Shallow grooves", "Deep grooves", "Wave-textured grip zone", "Improve handling"],
  ["Shoulder ridges", "None", "2 rings", "Ripple rings", "Prevent paneling"],
  ["Base geometry", "Smooth", "Radial ribs", "Radial wave pattern", "Load distribution and stability"],
  ["Neck ridges", "Standard threads", "Decorative ring", "Ripple ring", "Cap retention"],
  ["Vertical rib pattern", "Straight ribs", "Tapered ribs", "Stream-inspired curved ribs", "Improve sidewall stiffness"],
  ["Rib spacing", "Wide spacing", "Medium spacing", "Variable spacing", "Balance strength and material use"],
  ["Rib depth", "Shallow (0.5 mm)", "Medium (1.0 mm)", "Deep (1.5 mm)", "Structural reinforcement"],
  ["Label interface", "Full-wrap label", "Partial label panel", "Embossed logo area", "Ensure readability"],
  ["Material appearance", "Fully transparent", "Slight blue tint", "Slight green tint", "Product differentiation"],
  ["Cap color", "White", "Deep teal", "Matte seafoam", "Product differentiation"]
];

const BOTTLE_CODE_GATES = [
  ["Bottled water identity / quality", "21 CFR §165.110", "Bottle must hold water intended for human consumption; product and claims must match bottled-water identity and quality requirements."],
  ["Bottled drinking water CGMP", "21 CFR Part 129", "Container sanitation, bottling, lot/date coding, process controls, and inspection records remain release gates beyond CAD."],
  ["Net quantity labeling", "21 CFR §101.7", "PDP must carry net quantity; reserve label panel for 16.9 fl oz (500 mL)."],
  ["Food-contact material clearance", "FDA FCS / FCN logic", "PLA, enzyme additive, colorant, cap, plug/liner, ink, and adhesive require food-contact status review or migration package."],
  ["EU food-contact plastics", "Commission Regulation (EU) No 10/2011", "EU launch requires migration and Declaration of Compliance review for plastic food-contact articles."],
  ["Environmental claims", "16 CFR Part 260 / FTC Green Guides", "Compostable, biodegradable, or recyclable claims stay disabled unless substantiated for the finished package and sales market."],
  ["Compostability test target", "ASTM D6400 / EN 13432", "Enable compostable language only after finished bottle/cap/label system certification or equivalent substantiation."]
];

const AGENT_LANES = [
  { key: "design", label: "Design", role: "Generate geometry options and feature logic." },
  { key: "standards", label: "Standards", role: "Check requirements, manufacturing rules, and constraints." },
  { key: "solidworks", label: "SolidWorks", role: "Translate parameters into CAD operations." },
  { key: "fea", label: "FEA", role: "Run analysis and critique weak regions." },
  { key: "material", label: "Material", role: "Assess feasibility, process, and LCA." },
  { key: "lca", label: "LCA", role: "Compare sustainability and end-of-life impact." }
];

const AI_ROUTE_LIBRARY = [
  ["Fastest prototype", "Local parser", "Always works, but only extracts deterministic parameters from the prompt."],
  ["Working AI today", "Browser key", "User enters Gemini, Claude, or OpenAI key for this tab. Good for demos, not shared production."],
  ["Production route", "Server proxy", "Dashboard calls /api/copilot on a backend; backend stores the AI key and returns model JSON."],
  ["Native future", "SOLIDWORKS AI", "Use SOLIDWORKS Design AI companions when available in the licensed CAD environment."]
];

const CAD_PORTAL_LANES = [
  ["Display", "Three.js preview, bridge iframe, or pasted cloud CAD viewer URL."],
  ["Import", "SolidWorks macro download or bridge POST to /api/model."],
  ["Export", "SolidWorks macro, design-table CSV, JSON payload, and STL when a CAD server is configured."],
  ["Automate", "Windows SolidWorks host must run COM automation for true live model edits."]
];

const LCA_TOOL_LINKS = [
  {
    label: "SOLIDWORKS Simulation",
    url: "https://www.solidworks.com/domain/simulation",
    note: "Use for structural validation, FEA, plastics, CFD, and simulation workflows tied to CAD geometry."
  },
  {
    label: "SOLIDWORKS Help",
    url: "https://help.solidworks.com/",
    note: "Search for Sustainability, SustainabilityXpress, material impact, and environmental reports in your installed version."
  },
  {
    label: "SOLIDWORKS AI overview",
    url: "https://www.solidworks.com/product/solidworks-design/ai-overview",
    note: "Reference for native AI direction inside SOLIDWORKS Design; dashboard proxy remains separate."
  }
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

const CAD_AI_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "Short operator-facing summary" },
    title: { type: "string", description: "Model title" },
    family: { type: "string", enum: ["enclosure", "bottle", "bracket", "tray", "assembly"] },
    material: { type: "string" },
    requirements: { type: "array", items: { type: "string" } },
    parameters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          label: { type: "string" },
          unit: { type: "string" },
          value: { type: "number" },
          source: { type: "string" },
          swDimension: { type: "string" }
        },
        required: ["key", "label", "unit", "value"]
      }
    },
    features: { type: "array", items: { type: "string" } },
    solidworksIntent: {
      type: "object",
      properties: {
        documentType: { type: "string" },
        rebuildMode: { type: "string" },
        operations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              order: { type: "integer" },
              name: { type: "string" },
              action: { type: "string" }
            }
          }
        }
      }
    },
    analysis: {
      type: "object",
      properties: {
        summary: { type: "string" }
      }
    },
    agents: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          label: { type: "string" },
          status: { type: "string" },
          result: { type: "string" }
        }
      }
    }
  },
  required: ["title", "family", "parameters"]
};

const GEMINI_DIAGNOSTIC_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    provider: { type: "string" },
    model: { type: "string" }
  },
  required: ["ok", "provider", "model"]
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
  return {
    prompt: "",
    requirementText: "",
    selectedTemplate: "auto",
    uploadedFiles: [],
    revision: 1,
    ai: {
      mode: "parser",
      model: DEFAULT_MODEL,
      endpoint: DEFAULT_AI_ENDPOINT,
      status: "Local parser",
      lastReply: "Describe your part and click Generate, or pick a template to start with defaults."
    },
    bridge: {
      url: DEFAULT_BRIDGE_URL,
      status: "Not connected",
      embedUrl: "",
      activeDocument: "new-design.SLDPRT",
      lastSync: "",
      lastMessage: "Not connected. Run bridge/MacDevBridge/server.mjs locally to push parameters to SolidWorks."
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
      lastMessage: "Paste a public cloud CAD URL below to embed it in the preview window."
    },
    concept: {
      title: "New design",
      family: "assembly",
      familyLabel: "Assembly",
      material: "",
      features: [],
      revision: "R01"
    },
    requirements: [],
    parameters: [],
    solidworksIntent: { documentType: "part", rebuildMode: "parametric", operations: [] },
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
      material: buildMaterialAssessment("", [])
    },
    agents: AGENT_LANES.map(agent => ({
      ...agent,
      status: "Waiting",
      result: "Ready to run"
    })),
    standards: {
      matched: [],
      selected: [],
      note: ""
    },
    ip: {
      query: "",
      status: "Not searched",
      source: "Search launchers",
      results: [],
      lastMessage: "Use the patent/IP panel to launch or run a prior-art search."
    },
    cadServer: {
      url: "",
      status: "Not configured"
    }
  };
}

function normalizeState(saved) {
  const defaults = createDefaultState();
  const savedAi = { ...(saved.ai || {}) };
  const savedBridge = { ...(saved.bridge || {}) };
  const savedCloud = { ...(saved.cloud || {}) };
  if (!savedAi.endpoint) savedAi.endpoint = defaults.ai.endpoint;
  if (savedAi.mode === "gemini" && (!savedAi.model || savedAi.model === LEGACY_GEMINI_MODEL)) savedAi.model = DEFAULT_GEMINI_MODEL;
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
    agents: Array.isArray(saved.agents) && saved.agents.length ? saved.agents : defaults.agents,
    standards: {
      ...defaults.standards,
      ...(saved.standards || {}),
      matched: Array.isArray(saved.standards?.matched) ? saved.standards.matched : defaults.standards.matched,
      selected: Array.isArray(saved.standards?.selected) ? saved.standards.selected : defaults.standards.selected
    },
    ip: {
      ...defaults.ip,
      ...(saved.ip || {}),
      results: Array.isArray(saved.ip?.results) ? saved.ip.results : defaults.ip.results
    },
    cadServer: { ...defaults.cadServer, ...(saved.cadServer || {}) },
    _bottleMorph: saved._bottleMorph || null
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

function escapeVbaString(value = "") {
  return String(value).replace(/"/g, '""').replace(/\r?\n/g, " ");
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

function matchStandards(family, material) {
  const bank = STANDARDS_LIBRARY[family] || {};
  const byMaterial = bank[material] || [];
  const defaults = bank.all || [];
  const combined = [...defaults, ...byMaterial];
  const seen = new Set();
  return combined.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

function getSelectedStandards() {
  const selected = new Set(state.standards?.selected || []);
  return (state.standards?.matched || []).filter(s => selected.has(s.id));
}

function buildStandardsConstraints() {
  return getSelectedStandards().flatMap(s => s.constraints || []).map(c => `- ${c.param}: ${c.rule}`);
}

function buildStandardsLabelText() {
  const active = getSelectedStandards().filter(s => s.labelRequired);
  return [...new Set(active.map(s => s.labelRequired))].join("; ");
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

function promptIntentFlags(text = "") {
  return {
    wide: /\b(wide|broad|squat|large[-\s]?diameter|wide[-\s]?body)\b/i.test(text),
    noSpiral: /(\b(no|without|remove|avoid)\b[^.\n]{0,44}\b(spirals?|helix|helixes|helices|helical|twists?)\b)|(\b(spirals?|helix|helixes|helices|helical|twists?)\b[^.\n]{0,44}\b(off|none|remove|avoid)\b)/i.test(text),
    smooth: /\b(smooth|plain[-\s]?sided|unribbed|no texture|without texture|no ribs|without ribs)\b/i.test(text)
  };
}

function bottleParameterDefinition(key, fallback = {}) {
  const slider = BOTTLE_SLIDER_CONFIG.find(item => item.key === key);
  const library = CAD_LIBRARY.bottle.parameters.find(item => item.key === key);
  const base = slider || library || fallback;
  const unit = base.integer && !base.unit ? "count" : base.unit !== undefined ? base.unit : fallback.unit || "mm";
  return {
    key,
    label: base.label || fallback.label || key,
    unit,
    swDimension: base.swKey || base.swDimension || fallback.swDimension || ""
  };
}

function upsertPromptParameter(parameters, key, value, source = "Requirement") {
  const definition = bottleParameterDefinition(key);
  const index = parameters.findIndex(parameter => parameter.key === key);
  const next = {
    key,
    label: definition.label,
    unit: definition.unit,
    value,
    source,
    swDimension: definition.swDimension || toSolidWorksDimensionName(definition, Math.max(index, parameters.length)),
    aliases: []
  };
  if (index >= 0) {
    parameters[index] = { ...parameters[index], ...next };
  } else {
    parameters.push(next);
  }
}

function parameterValueFromList(parameters, key, fallback) {
  const match = parameters.find(parameter => parameter.key === key);
  const value = Number(match?.value);
  return Number.isFinite(value) ? value : fallback;
}

function applyPromptIntentOverrides(parameters, features, text, family) {
  const flags = promptIntentFlags(text);
  if (family !== "bottle") return { parameters, features, customBottle: false };

  const nextParameters = parameters.map(parameter => ({ ...parameter }));
  let nextFeatures = [...new Set(features || [])];
  let customBottle = false;

  if (flags.wide) {
    const diameter = Math.max(parameterValueFromList(nextParameters, "bodyDiameter", 68), 76);
    const depth = Math.max(parameterValueFromList(nextParameters, "bodyDepth", diameter), 70);
    upsertPromptParameter(nextParameters, "bodyDiameter", round(diameter, 1));
    upsertPromptParameter(nextParameters, "bodyDepth", round(depth, 1));
    if (!nextFeatures.some(feature => /wide body/i.test(feature))) nextFeatures.push("Wide body");
    customBottle = true;
  }

  if (flags.noSpiral) {
    upsertPromptParameter(nextParameters, "helixRidges", 0);
    upsertPromptParameter(nextParameters, "helixDepth", 0);
    upsertPromptParameter(nextParameters, "helixTurns", 0);
    nextFeatures = nextFeatures.filter(feature => !/(spiral|helix|helical|twist)/i.test(feature));
    if (!nextFeatures.some(feature => /smooth body/i.test(feature))) nextFeatures.push("Smooth body");
    customBottle = true;
  }

  if (flags.smooth) {
    for (const [key, value] of [["ribCount", 0], ["ribDepth", 0], ["ringCount", 0], ["ringDepth", 0], ["facetCount", 0], ["facetDepth", 0]]) {
      upsertPromptParameter(nextParameters, key, value);
    }
    nextFeatures = nextFeatures.filter(feature => !/(rib|ring|facet|texture|panel)/i.test(feature));
    if (!nextFeatures.some(feature => /smooth body/i.test(feature))) nextFeatures.push("Smooth body");
    customBottle = true;
  }

  return {
    parameters: nextParameters,
    features: nextFeatures.slice(0, 8),
    customBottle
  };
}

function buildModelBlueprint(prompt, requirementText, selectedTemplate) {
  const combined = `${prompt}\n${requirementText}`.trim();
  const family = inferFamily(combined, selectedTemplate);
  const library = CAD_LIBRARY[family] || CAD_LIBRARY.assembly;
  let parameters = library.parameters.map((definition, index) => {
    const result = definition.type === "count"
      ? extractCount(combined, definition.aliases, definition.fallback)
      : extractNumber(combined, definition.aliases, definition.fallback, definition.unit);
    return { ...definition, value: result.value, source: result.source, swDimension: toSolidWorksDimensionName(definition, index) };
  });
  const material = extractMaterial(combined, library.defaultMaterial);
  const title = extractTitle(prompt, requirementText, library.defaultTitle);
  const overrides = applyPromptIntentOverrides(parameters, buildFeatures(library.features, combined), combined, family);
  parameters = overrides.parameters;
  const features = overrides.features;

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

function deriveDesignIntent() {
  const combined = `${state.prompt || ""}\n${state.requirementText || ""}`.trim();
  const family = inferFamily(combined, state.selectedTemplate);
  const library = CAD_LIBRARY[family] || CAD_LIBRARY.assembly;
  const material = extractMaterial(combined, state.concept?.material || library.defaultMaterial || "");
  const requirements = extractRequirements(combined);
  const features = buildFeatures(library.features || [], combined);
  const standards = matchStandards(family, material);
  return {
    combined,
    family,
    familyLabel: library.label,
    material,
    requirements,
    features,
    standards
  };
}

function imageIdeaSummary() {
  const images = state.geometry?.images || [];
  if (!images.length) return [];
  return images.map(image => {
    const widths = (image.profile || []).map(point => Number(point.width)).filter(Number.isFinite);
    const widest = widths.length ? Math.max(...widths) : 0;
    const narrowest = widths.length ? Math.min(...widths) : 0;
    return {
      name: image.name,
      confidence: image.confidence,
      dimensions: `${image.originalWidth}x${image.originalHeight}`,
      contourPoints: image.profile?.length || 0,
      silhouette: widest && narrowest ? `width ratio ${round(widest / Math.max(narrowest, 0.01), 2)}` : "contour pending"
    };
  });
}

function ideaSearchQuery() {
  const intent = deriveDesignIntent();
  const parts = [
    state.concept?.title,
    intent.familyLabel,
    intent.material,
    ...(intent.features || []).slice(0, 3),
    ...(intent.requirements || []).slice(0, 2)
  ].filter(Boolean);
  const query = parts.join(" ").replace(/\s+/g, " ").trim();
  return query || "parametric CAD product design";
}

function patentSearchLinks() {
  const query = ideaSearchQuery();
  const encoded = encodeURIComponent(query);
  return [
    ["Google Patents", `https://patents.google.com/?q=${encoded}`, "Fast broad prior-art scan"],
    ["USPTO Patent Center", "https://patentcenter.uspto.gov/", "US filing and application portal"],
    ["USPTO Patent Public Search", "https://ppubs.uspto.gov/pubwebapp/", "Official US patent search"],
    ["Espacenet", `https://worldwide.espacenet.com/patent/search?q=${encoded}`, "International patent literature"],
    ["The Lens", `https://www.lens.org/lens/search/patent/list?q=${encoded}`, "Patent and scholarly landscape"]
  ];
}

function currentRequirementLibrary() {
  const intent = deriveDesignIntent();
  const bank = STANDARDS_LIBRARY[intent.family] || STANDARDS_LIBRARY.assembly || {};
  const groups = [];
  for (const [materialKey, entries] of Object.entries(bank)) {
    for (const entry of entries || []) {
      groups.push({
        ...entry,
        libraryGroup: materialKey === "all" ? "Baseline" : materialKey
      });
    }
  }
  return groups;
}

function bridgeAiEndpoint() {
  const base = state.bridge?.url ? normalizeBaseUrl(state.bridge.url) : "http://127.0.0.1:8787";
  return `${base}/api/copilot`;
}

function aiRouteStatus() {
  if (state.ai.mode === "parser") return ["Local parser", "Works offline, but not generative AI."];
  if (state.ai.mode === "bridge") return ["Server proxy", state.ai.endpoint ? state.ai.endpoint : "Endpoint URL required."];
  if (state.ai.mode === "gemini") return ["Browser Gemini key", sessionStorage.getItem(SESSION_GEMINI_KEY) ? `Key loaded for this tab. Run Check AI route to verify ${resolveGeminiModel()}.` : "Paste a Gemini API key."];
  if (state.ai.mode === "claude") return ["Browser Claude key", sessionStorage.getItem(SESSION_CLAUDE_KEY) ? "Key loaded for this tab." : "Paste an Anthropic key."];
  if (state.ai.mode === "openai") return ["Browser OpenAI key", sessionStorage.getItem(SESSION_AI_KEY) ? "Key loaded for this tab." : "Paste an OpenAI key."];
  return ["Unknown", "Select an AI route."];
}

function syncDraftFromDom() {
  const prompt = document.getElementById("promptInput");
  const requirements = document.getElementById("requirementText");
  const template = document.getElementById("templateSelect");
  const aiMode = document.getElementById("aiMode");
  const aiModel = document.getElementById("aiModel");
  const aiEndpoint = document.getElementById("aiEndpoint");
  const aiKey = document.getElementById("aiKey");
  const claudeKey = document.getElementById("claudeKey");
  const bridgeUrl = document.getElementById("bridgeUrl");
  const cloudBrokerUrl = document.getElementById("cloudBrokerUrl");
  const cloudSpaceUrl = document.getElementById("cloudSpaceUrl");

  if (prompt) state.prompt = prompt.value.trim();
  if (requirements) state.requirementText = requirements.value.trim();
  if (template) {
    const nextTemplate = template.value;
    if (nextTemplate !== state.selectedTemplate) {
      resetModelForTemplate(nextTemplate);
    } else {
      state.selectedTemplate = nextTemplate;
    }
  }
  if (aiMode) {
    const newMode = aiMode.value;
    if (newMode !== state.ai.mode) {
      const modeDefaults = { gemini: DEFAULT_GEMINI_MODEL, claude: "claude-sonnet-4-6", openai: "gpt-4o-mini", bridge: "", parser: "" };
      state.ai.model = modeDefaults[newMode] || "";
      if (aiModel) aiModel.value = state.ai.model;
    }
    state.ai.mode = newMode;
  }
  if (aiModel) state.ai.model = aiModel.value.trim() || state.ai.model;
  if (aiEndpoint) state.ai.endpoint = aiEndpoint.value.trim();
  if (aiKey && aiKey.value.trim()) sessionStorage.setItem(SESSION_AI_KEY, aiKey.value.trim());
  if (claudeKey && claudeKey.value.trim()) sessionStorage.setItem(SESSION_CLAUDE_KEY, claudeKey.value.trim());
  const geminiKey = document.getElementById("geminiKey");
  if (geminiKey && geminiKey.value.trim()) sessionStorage.setItem(SESSION_GEMINI_KEY, geminiKey.value.trim());
  const cadServerUrl = document.getElementById("cadServerUrl");
  if (cadServerUrl) state.cadServer.url = cadServerUrl.value.trim();
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
    imageIdeas: imageIdeaSummary(),
    designTable: state.designTable,
    analysis: state.analysis,
    agents: state.agents,
    cloud: state.cloud,
    solidworksIntent: state.solidworksIntent,
    targetDocument: state.bridge.activeDocument || `${sanitizeFilename(state.concept.title)}.SLDPRT`,
    standards: {
      matched: (state.standards?.matched || []).map(s => s.id),
      selected: state.standards?.selected || [],
      constraints: buildStandardsConstraints(),
      labelRequired: buildStandardsLabelText()
    }
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

function resetModelForTemplate(templateValue) {
  const blueprint = buildModelBlueprint(state.prompt, state.requirementText, templateValue);
  updateFromBlueprint(blueprint, "Template");
  state.selectedTemplate = templateValue;
  state._bottleMorph = null;
  state.standards = { matched: [], selected: [], note: "" };
  lookupStandards();
}

function generateModel() {
  syncDraftFromDom();
  const blueprint = buildModelBlueprint(state.prompt, state.requirementText, state.selectedTemplate);
  updateFromBlueprint(blueprint, "Requirements");
  state.ai.lastReply = `Generated ${blueprint.concept.familyLabel.toLowerCase()} model with ${blueprint.parameters.length} parameters.`;
  lookupStandards();
}

function lookupStandards() {
  const intent = deriveDesignIntent();
  const family = intent.family || state.concept?.family || "assembly";
  const material = intent.material || state.concept?.material || "";
  const matched = matchStandards(family, material);
  state.standards = state.standards || {};
  state.standards.matched = matched;
  if (!state.standards.selected || !state.standards.selected.length) {
    state.standards.selected = matched.map(s => s.id);
  } else {
    const existingIds = new Set(state.standards.selected);
    const newIds = matched.map(s => s.id);
    state.standards.selected = [...new Set([...existingIds].filter(id => newIds.includes(id)))];
    if (!state.standards.selected.length) state.standards.selected = newIds;
  }
  state.standards.note = matched.length
    ? `${matched.length} standard${matched.length !== 1 ? "s" : ""} matched for ${family} / ${material || "any material"}`
    : "No standards matched — try selecting a template or entering a material";
  persist(matched.length ? `${matched.length} standards matched` : "No standards matched");
}

function loadBottleVariant(variantId) {
  const variant = BOTTLE_VARIANTS.find(v => v.id === variantId);
  if (!variant) { showToast("Variant not found"); return; }
  const library = CAD_LIBRARY.bottle;
  const existingSteps = state._bottleMorph?.steps || 5;
  state.concept = {
    family: "bottle",
    familyLabel: library.label,
    title: `${variant.id} — ${variant.concept}`,
    material: state.concept.material || library.defaultMaterial || "",
    features: [...library.features]
  };
  state.parameters = [
    { key: "height",        label: "Height",         unit: "mm",    value: variant.H,           source: "Variant", swDimension: "D1@HEIGHT",        aliases: [] },
    { key: "bodyDiameter",  label: "Body diameter",  unit: "mm",    value: variant.W,           source: "Variant", swDimension: "D2@BODY_DIAMETER", aliases: [] },
    { key: "bodyDepth",     label: "Body depth",     unit: "mm",    value: variant.D,           source: "Variant", swDimension: "D3@BODY_DEPTH",    aliases: [] },
    { key: "wall",          label: "Wall",           unit: "mm",    value: variant.wall,        source: "Variant", swDimension: "D4@WALL",          aliases: [] },
    { key: "base",          label: "Base thickness", unit: "mm",    value: variant.base,        source: "Variant", swDimension: "D5@BASE",          aliases: [] },
    { key: "neckDiameter",  label: "Neck OD",        unit: "mm",    value: variant.neckOD,      source: "Variant", swDimension: "D6@NECK_OD",       aliases: [] },
    { key: "mouthDiameter", label: "Mouth ID",       unit: "mm",    value: variant.mouthID,     source: "Variant", swDimension: "D7@MOUTH_ID",      aliases: [] },
    { key: "shoulderHeight",label: "Shoulder H",     unit: "mm",    value: variant.shoulderH,   source: "Variant", swDimension: "D8@SHOULDER_H",    aliases: [] },
    { key: "neckHeight",    label: "Neck height",    unit: "mm",    value: variant.neckH,       source: "Variant", swDimension: "D9@NECK_H",        aliases: [] },
    { key: "volume",        label: "Volume",         unit: "ml",    value: 500,                 source: "Standard",swDimension: "D10@VOLUME",       aliases: [] },
    { key: "superellipseN", label: "Superellipse n", unit: "",      value: variant.supN,        source: "Variant", swDimension: "D11@SUPERELLIPSE_N",aliases: [] },
    { key: "ribCount",      label: "Rib count",      unit: "count", value: variant.ribCount,    source: "Variant", swDimension: "D12@RIB_COUNT",    aliases: [] },
    { key: "ribDepth",      label: "Rib depth",      unit: "mm",    value: variant.ribDepth,    source: "Variant", swDimension: "D13@RIB_DEPTH",    aliases: [] },
    { key: "ringCount",     label: "Ring count",     unit: "count", value: variant.ringCount || 0, source: "Variant", swDimension: "D19@RING_COUNT", aliases: [] },
    { key: "ringDepth",     label: "Ring depth",     unit: "mm",    value: variant.ringDepth || 0, source: "Variant", swDimension: "D20@RING_DEPTH", aliases: [] },
    { key: "facetCount",    label: "Facet count",    unit: "count", value: variant.facetCount,  source: "Variant", swDimension: "D14@FACET_COUNT",  aliases: [] },
    { key: "facetDepth",    label: "Facet depth",    unit: "mm",    value: variant.facetDepth,  source: "Variant", swDimension: "D15@FACET_DEPTH",  aliases: [] },
    { key: "helixRidges",   label: "Helix ridges",   unit: "count", value: variant.helixCount,  source: "Variant", swDimension: "D16@HELIX_RIDGES", aliases: [] },
    { key: "helixDepth",    label: "Helix depth",    unit: "mm",    value: variant.helixDepth,  source: "Variant", swDimension: "D17@HELIX_DEPTH",  aliases: [] },
    { key: "helixTurns",    label: "Helix turns",    unit: "",      value: variant.helixTurns,  source: "Variant", swDimension: "D18@HELIX_TURNS",  aliases: [] }
  ];
  state._bottleMorph = { family: variant.morph, pct: bottleVariantPct(variant), activeId: variant.id, steps: existingSteps };
  state.prompt = `Variant ${variant.id}: ${variant.concept} (morph ${variant.morph})`;
  state.requirementText = [
    `Variant: ${variant.id} — ${variant.concept}`,
    `Morph step: ${variant.morph}`,
    `Nominal fill volume: 500 mL`,
    `Overflow capacity target: 530 mL ±10 mL`,
    `Neck/closure: 28 mm tamper-evident screw finish`,
  ].join("\n");
  state.revision += 1;
  state.bridge.activeDocument = `${variant.id}-${sanitizeFilename(variant.concept)}.SLDPRT`;
  state.designTable.rows = buildDesignTableRows();
  state.analysis.material = buildMaterialAssessment(state.concept.material, state.parameters);
  state.analysis.simulation = null;
  state.analysis.optimization = null;
  lookupStandards();
}

function applyBottleMorphPercent(pct, fam = state._bottleMorph?.family || bottleFamilies()[0], options = {}) {
  const existingSteps = state._bottleMorph?.steps || 5;
  const clampedPct = clamp(Number(pct), 0, 100);
  const design = bottleDesignFromMorph(fam, clampedPct);
  const morphed = morphBottleAtPct(fam, clampedPct);
  if (!morphed) return;
  state.concept = {
    ...state.concept,
    family: "bottle",
    familyLabel: CAD_LIBRARY.bottle.label,
    title: `${bottleFamilyLabel(fam)} @ ${Math.round(clampedPct)}%`,
    material: state.concept.material || CAD_LIBRARY.bottle.defaultMaterial || BOTTLE_LOCK_VALUES.material,
    features: [...new Set([...(state.concept.features || CAD_LIBRARY.bottle.features), "Morph strip", bottleSurfaceLabel(design)])]
  };
  state._bottleMorph = { family: fam, pct: clampedPct, activeId: "", steps: existingSteps };
  applyMorphedVariant(morphed, "Morph");
  if (options.bumpRevision) state.revision += 1;
  state.bridge.activeDocument = `${sanitizeFilename(state.concept.title)}.SLDPRT`;
  syncModelDerivedState();
  state.analysis.simulation = null;
  state.analysis.optimization = null;
}

function resetBottleToNearestSeed() {
  const seed = nearestBottleVariantFromParams(currentBottleDesign());
  loadBottleVariant(seed.id);
}

function bottleDesignParameters(design) {
  return BOTTLE_SLIDER_CONFIG.map(cfg => ({
    key: cfg.key,
    label: cfg.label,
    value: design[cfg.key],
    unit: cfg.unit,
    swDimension: cfg.swKey
  }));
}

function bottleMorphCsv() {
  const steps = bottleGeneratedSteps();
  const headers = [
    "configuration",
    "morphFamily",
    "stepPercent",
    "estimatedOverflowMl",
    "recommendedBodyScale",
    "material",
    ...BOTTLE_SLIDER_CONFIG.map(cfg => cfg.swKey)
  ];
  const escapeCell = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = steps.map((design, index) => [
    `${sanitizeFilename(design.morph).replace(/-/g, "")}-${String(index + 1).padStart(2, "0")}`,
    design.morph,
    Math.round(design.pct),
    round(bottleEstimatedOverflow(design), 1),
    round(bottleRecommendedScale(design), 3),
    design.material || BOTTLE_LOCK_VALUES.material,
    ...BOTTLE_SLIDER_CONFIG.map(cfg => {
      const value = design[cfg.key];
      return cfg.integer ? Math.round(Number(value || 0)) : round(value || 0, cfg.step < 0.05 ? 2 : 2);
    })
  ]);
  return [headers, ...rows].map(row => row.map(escapeCell).join(",")).join("\n");
}

function exportBottleMorphCsv() {
  const fam = state._bottleMorph?.family || bottleFamilies()[0];
  downloadText(`${sanitizeFilename(fam)}-bottle-morph-steps.csv`, bottleMorphCsv(), "text/csv");
  showToast("Bottle n-step morph CSV exported");
}

function exportBottleActiveJson() {
  const design = currentBottleDesign();
  const payload = {
    ...makeCurrentModelPayload(),
    bottleDesign: {
      ...design,
      estimatedOverflowMl: round(bottleEstimatedOverflow(design), 1),
      recommendedBodyScale: round(bottleRecommendedScale(design), 3),
      lockedControls: BOTTLE_LOCK_VALUES,
      codeGates: BOTTLE_CODE_GATES,
      featureOptions: BOTTLE_FEATURE_OPTIONS
    },
    solidWorksSurfaceLogic: bottleFormulaText(design)
  };
  downloadText(`${sanitizeFilename(state.concept.title || "bottle-design")}-bottle-payload.json`, JSON.stringify(payload, null, 2), "application/json");
  showToast("Bottle JSON payload exported");
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

  let parameters = Array.isArray(payload.parameters) && payload.parameters.length
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
  const promptOverrides = applyPromptIntentOverrides(
    parameters,
    Array.isArray(payload.features) && payload.features.length ? payload.features.slice(0, 8) : localBlueprint.concept.features,
    `${state.prompt}\n${state.requirementText}`,
    family
  );
  parameters = promptOverrides.parameters;
  state.revision += 1;
  state.concept = {
    title,
    family,
    familyLabel: library.label,
    material: payload.material || localBlueprint.concept.material,
    features: promptOverrides.features
  };
  state.requirements = Array.isArray(payload.requirements) && payload.requirements.length ? payload.requirements.slice(0, 10) : localBlueprint.requirements;
  state.parameters = parameters;
  state.solidworksIntent = payload.solidworksIntent || localBlueprint.solidworksIntent;
  state.bridge.activeDocument = `${sanitizeFilename(title)}.SLDPRT`;
  state.bridge.lastMessage = `AI updated revision R${String(state.revision).padStart(2, "0")}`;
  state.ai.status = { openai: "OpenAI", claude: "Claude", gemini: "Gemini", bridge: "Endpoint" }[state.ai.mode] || "Parser";
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
  if (family === "bottle" && promptOverrides.customBottle) state._bottleMorph = null;
  state.designTable.rows = buildDesignTableRows();
}

function makeAiInstruction() {
  const lines = [
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
    "Use imageIdeas summaries as visual inspiration and cite which uploaded references influenced the model.",
    "Use designTable rows as SolidWorks dimension mappings when available.",
    "Keep parameters numeric and use millimeters unless another unit is required."
  ];
  const constraintLines = buildStandardsConstraints();
  if (constraintLines.length) {
    lines.push("Active regulatory standards constraints — parameters MUST satisfy these:");
    lines.push(...constraintLines);
  }
  const labelText = buildStandardsLabelText();
  if (labelText) {
    lines.push(`Required label text: ${labelText}`);
  }
  return lines.join("\n");
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

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model: state.ai.model || DEFAULT_MODEL,
      max_tokens: 1600,
      messages: [
        { role: "system", content: makeAiInstruction() },
        { role: "user", content: JSON.stringify(makeCurrentModelPayload(), null, 2) }
      ]
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.error?.message || `OpenAI request failed (${response.status})`;
    throw new Error(detail);
  }
  return parseJsonFromText(data.choices?.[0]?.message?.content || "");
}

async function callClaude() {
  const key = sessionStorage.getItem(SESSION_CLAUDE_KEY);
  if (!key) throw new Error("Add a Claude (Anthropic) API key for this browser session.");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: state.ai.model || "claude-sonnet-4-6",
      max_tokens: 1600,
      system: makeAiInstruction(),
      messages: [{ role: "user", content: JSON.stringify(makeCurrentModelPayload(), null, 2) }]
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.error?.message || `Claude request failed (${response.status})`;
    throw new Error(detail);
  }
  const text = data.content?.[0]?.text || "";
  return parseJsonFromText(text);
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
  if (data.error) throw new Error(data.error);
  return typeof data === "string" ? parseJsonFromText(data) : data;
}

function resolveGeminiModel() {
  return (state.ai.model || "").startsWith("gemini") ? state.ai.model : DEFAULT_GEMINI_MODEL;
}

function extractGeminiInteractionText(data = {}) {
  if (typeof data.output_text === "string") return data.output_text;
  const textParts = [];
  for (const step of data.steps || []) {
    for (const output of step.output || []) {
      if (typeof output.text === "string") textParts.push(output.text);
      for (const content of output.content || []) {
        if (typeof content.text === "string") textParts.push(content.text);
      }
    }
  }
  return textParts.join("\n").trim();
}

function geminiRequestError(data, status, route) {
  const detail = data.error?.message || `Gemini ${route} request failed (${status})`;
  const error = new Error(detail);
  error.status = status;
  error.route = route;
  error.provider = "gemini";
  return error;
}

function shouldFallbackGemini(error) {
  if ([401, 403, 429].includes(Number(error.status))) return false;
  if ([400, 404, 501].includes(Number(error.status))) return true;
  return /failed to fetch|interactions|not found|unsupported|unknown name|unrecognized|invalid json payload/i.test(error.message || "");
}

async function callGeminiInteractions(key, model, options = {}) {
  const diagnostic = options.diagnostic === true;
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key
    },
    body: JSON.stringify({
      model,
      system_instruction: diagnostic ? "Return only valid JSON." : makeAiInstruction(),
      input: diagnostic
        ? `Return {"ok":true,"provider":"gemini","model":"${model}"} as JSON only.`
        : `Generate or update the SolidWorks CAD model from this dashboard state:\n${JSON.stringify(makeCurrentModelPayload(), null, 2)}`,
      generation_config: { temperature: 0.2, thinking_level: "low", max_output_tokens: diagnostic ? 96 : 1600 },
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: diagnostic ? GEMINI_DIAGNOSTIC_SCHEMA : CAD_AI_RESPONSE_SCHEMA
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw geminiRequestError(data, response.status, "Interactions API");
  const text = extractGeminiInteractionText(data);
  if (!text) throw new Error("Gemini returned an empty response.");
  const parsed = parseJsonFromText(text);
  if (diagnostic) return { ...parsed, route: "Interactions API", model };
  return parsed;
}

async function callGeminiGenerateContent(key, model, options = {}) {
  const diagnostic = options.diagnostic === true;
  const legacyModel = model === DEFAULT_GEMINI_MODEL ? LEGACY_GEMINI_MODEL : model;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${legacyModel}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: diagnostic ? "Return only valid JSON." : makeAiInstruction() }] },
        contents: [{
          role: "user",
          parts: [{
            text: diagnostic
              ? `Return {"ok":true,"provider":"gemini","model":"${legacyModel}"} as JSON only.`
              : JSON.stringify(makeCurrentModelPayload(), null, 2)
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: diagnostic ? 96 : 1600,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw geminiRequestError(data, response.status, "generateContent API");
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("\n").trim() || "";
  if (!text) throw new Error("Gemini returned an empty response.");
  const parsed = parseJsonFromText(text);
  if (diagnostic) return { ...parsed, route: "generateContent API", model: legacyModel };
  return parsed;
}

async function callGemini(options = {}) {
  const key = sessionStorage.getItem(SESSION_GEMINI_KEY);
  if (!key) throw new Error("Add a Gemini API key. Get one free at aistudio.google.com.");
  const model = resolveGeminiModel();
  try {
    return await callGeminiInteractions(key, model, options);
  } catch (error) {
    if (!shouldFallbackGemini(error)) throw error;
    return await callGeminiGenerateContent(key, model, options);
  }
}

async function askCopilot() {
  syncDraftFromDom();
  loadingAction = "ask-ai";
  render();

  try {
    let payload;
    if (state.ai.mode === "openai") {
      payload = await callOpenAI();
    } else if (state.ai.mode === "claude") {
      payload = await callClaude();
    } else if (state.ai.mode === "gemini") {
      payload = await callGemini();
    } else if (state.ai.mode === "bridge") {
      payload = await callAiEndpoint();
    } else {
      const blueprint = buildModelBlueprint(state.prompt, state.requirementText, state.selectedTemplate);
      payload = {
        reply: "Local parser generated a deterministic model. Select Gemini, Claude, OpenAI, or a custom endpoint for generative reasoning.",
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
    const raw = error.message || "AI request failed";
    const firstLine = raw.split(/[\n*]/).map(s => s.trim()).find(Boolean) || raw;
    const brief = firstLine.length > 200 ? firstLine.slice(0, 200) + "…" : firstLine;
    const isQuota = /quota|rate.limit|billing/i.test(raw);
    const isGemini = state.ai.mode === "gemini";
    const hint = isQuota
      ? " (Quota exceeded - try a different Gemini key, switch providers, or use a server proxy.)"
      : isGemini
        ? " (Check that the key is enabled for the Gemini API, the model is available, and browser API calls are allowed. Custom endpoint is safer for production.)"
        : "";
    state.ai.status = "AI error";
    state.ai.lastReply = brief + hint;
    persist("AI error");
  } finally {
    loadingAction = "";
    render();
  }
}

async function testAiRoute() {
  syncDraftFromDom();
  if (state.ai.mode === "parser") {
    state.ai.status = "Local parser";
    state.ai.lastReply = "Local parser is available. For real generative AI, choose Custom endpoint and use the bridge /api/copilot proxy, or paste a provider key for this browser tab.";
    persist("AI route checked");
    return;
  }

  if (state.ai.mode === "bridge" && !state.ai.endpoint) {
    state.ai.endpoint = bridgeAiEndpoint();
  }

  loadingAction = "test-ai";
  render();

  try {
    if (state.ai.mode === "bridge") {
      const url = new URL(state.ai.endpoint);
      const healthUrl = url.pathname.endsWith("/api/copilot")
        ? `${url.origin}/health`
        : `${url.origin}${url.pathname.replace(/\/api\/copilot$/, "")}/health`;
      const response = await fetch(healthUrl);
      if (!response.ok) throw new Error(`Proxy health check failed (${response.status})`);
      state.ai.status = "Endpoint ready";
      state.ai.lastReply = `AI proxy route is reachable at ${state.ai.endpoint}. Set OPENAI_API_KEY on the bridge/backend for real generation.`;
    } else if (state.ai.mode === "gemini") {
      const result = await callGemini({ diagnostic: true });
      state.ai.status = "Gemini ready";
      state.ai.lastReply = `Gemini key works via ${result.route || "Gemini API"} using ${result.model || resolveGeminiModel()}.`;
    } else {
      const [route, detail] = aiRouteStatus();
      state.ai.status = route;
      state.ai.lastReply = detail;
    }
    persist("AI route checked");
  } catch (error) {
    state.ai.status = "AI error";
    state.ai.lastReply = error.message || "AI route check failed";
    persist("AI route failed");
  } finally {
    loadingAction = "";
    render();
  }
}

function useBridgeAiProxy() {
  syncDraftFromDom();
  state.ai.mode = "bridge";
  state.ai.endpoint = bridgeAiEndpoint();
  state.ai.model = state.ai.model || DEFAULT_MODEL;
  state.ai.status = "Endpoint selected";
  state.ai.lastReply = `Using bridge AI proxy: ${state.ai.endpoint}. Start the bridge with OPENAI_API_KEY set to make this route generative.`;
  persist("Bridge AI proxy selected");
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

function downloadSolidWorksMacro() {
  const title = state.concept.title || "New design";
  const params = state.parameters.filter(p => p.unit !== "count");
  const countParams = state.parameters.filter(p => p.unit === "count");
  const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
  const selectedStandards = getSelectedStandards();

  const varLines = params.map(p => {
    const val = Number(p.value);
    const mm = p.unit === "mm" ? "mm" : "";
    return `    eqMgr.Add2 -1, "${'"'}${escapeVbaString(p.key)}${'"'} = ${val}${mm}", True   '${escapeVbaString(p.label)}`;
  }).join("\n");

  const countLines = countParams.map(p =>
    `    eqMgr.Add2 -1, "${'"'}${escapeVbaString(p.key)}${'"'} = ${Number(p.value)}", True   '${escapeVbaString(p.label)}`
  ).join("\n");

  const dimHints = state.parameters.map(p =>
    `'   ${escapeVbaString(p.swDimension || p.key)} = ${p.value} ${p.unit}  (parameter: "${escapeVbaString(p.key)}")`
  ).join("\n");

  const standardHints = selectedStandards.length
    ? selectedStandards.flatMap(standard => [
        `'   ${escapeVbaString(standard.id)} - ${escapeVbaString(standard.title)}${standard.category ? ` (${escapeVbaString(standard.category)})` : ""}`,
        ...(standard.constraints || []).map(c => `'      * ${escapeVbaString(c.param)}: ${escapeVbaString(c.rule)}`),
        standard.testRequired ? `'      Test: ${escapeVbaString(standard.testRequired)}` : "",
        standard.labelRequired ? `'      Label: ${escapeVbaString(standard.labelRequired)}` : ""
      ].filter(Boolean)).join("\n")
    : "'   None selected";

  const macro = `' ==========================================================
' SolidWorks AI CAD Studio — Auto-generated macro
' Project : ${escapeVbaString(title)}
' Family  : ${escapeVbaString(state.concept.familyLabel || "")}
' Material: ${escapeVbaString(state.concept.material || "")}
' Generated: ${ts}
'
' HOW TO RUN:
'   1. Open your SolidWorks part or assembly
'   2. Tools > Macros > Run...  →  select this .swb file
'   3. Macro adds global variables and rebuilds the model
'
' LINK DIMENSIONS:
'   In SolidWorks, open Tools > Equations, then for each
'   dimension you want driven, enter:
'       "D1@Sketch1" = "height"
'   (use the variable names below instead of hard-coded values)
'
' Expected dimension names (swDimension @ feature):
${dimHints}
'
' Selected standards and CAD constraints:
${standardHints}
' ==========================================================

Dim swApp As Object
Dim swDoc As Object

Sub main()
    Set swApp = Application.SldWorks
    Set swDoc = swApp.ActiveDoc

    If swDoc Is Nothing Then
        MsgBox "No document is open in SolidWorks." & Chr(13) & _
               "Please open your part or assembly first.", 48, "AI CAD Studio"
        Exit Sub
    End If

    Dim eqMgr As Object
    Set eqMgr = swDoc.GetEquationMgr

    ' Remove previously injected AI Studio variables
    Dim i As Integer
    For i = eqMgr.GetCount() - 1 To 0 Step -1
        If eqMgr.Equation(i) <> "" Then
            Dim existing As String
            existing = eqMgr.Equation(i)
            ' Check if this is one of our keys
            ${state.parameters.map(p => `If InStr(existing, "${'"'}${escapeVbaString(p.key)}${'"'}") > 0 Then eqMgr.Delete i`).join("\n            ")}
        End If
    Next i

    ' ── Dimensional parameters (mm) ──────────────────────────
${varLines}

    ' ── Count / unitless parameters ──────────────────────────
${countLines}

    ' Rebuild
    Dim bRet As Boolean
    bRet = swDoc.EditRebuild3

    Dim msg As String
    msg = "AI CAD Studio applied ${state.parameters.length} parameters to:" & Chr(13) & swDoc.GetTitle()
    If Not bRet Then msg = msg & Chr(13) & Chr(13) & "Check SolidWorks warnings — some dimensions may need manual linking."
    MsgBox msg, 64, "AI CAD Studio"
End Sub
`;

  const blob = new Blob([macro], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${sanitizeFilename(title)}.swb`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast(`Macro downloaded — open SolidWorks → Tools > Macros > Run → select ${sanitizeFilename(title)}.swb`);
}

async function sendToSolidWorks() {
  syncDraftFromDom();

  // Always download the macro so the user can drive SW directly
  downloadSolidWorksMacro();

  // Also post to bridge if URL is configured
  if (!state.bridge.url) return;

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
    if (!response.ok) throw new Error(data.message || data.error || `Bridge returned ${response.status}`);
    state.bridge.status = "Synced";
    state.bridge.lastSync = new Date().toISOString();
    state.bridge.embedUrl = data.embedUrl || data.viewerUrl || state.bridge.embedUrl || `${baseUrl}/viewer`;
    state.bridge.activeDocument = data.activeDocument || data.document || state.bridge.activeDocument;
    state.bridge.lastMessage = data.message || "Model sent to SolidWorks bridge";
    persist("Model sent");
  } catch (error) {
    state.bridge.status = "Sync failed";
    state.bridge.lastMessage = error.message;
    persist(error.message);
  } finally {
    loadingAction = "";
    render();
  }
}

function openBridgeViewer() {
  syncDraftFromDom();
  const url = state.bridge.embedUrl || (state.bridge.url ? `${normalizeBaseUrl(state.bridge.url)}/viewer` : "");
  if (!url) {
    showToast("Connect the bridge or add a CAD viewer URL first");
    return;
  }
  window.open(url, "_blank", "noopener");
}

async function downloadStl() {
  syncDraftFromDom();
  const serverUrl = state.cadServer?.url?.trim();
  if (!serverUrl) {
    showToast("Add a geometry server URL to export STL");
    return;
  }

  loadingAction = "download-stl";
  render();

  try {
    const response = await fetch(`${normalizeBaseUrl(serverUrl)}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ family: state.concept.family, parameters: state.parameters })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(detail || `STL export failed (${response.status})`);
    }
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${sanitizeFilename(state.concept.title || "cad-model")}.stl`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    showToast("STL exported");
  } catch (error) {
    state.cadServer.status = `Error: ${error.message}`;
    persist("STL export failed");
  } finally {
    loadingAction = "";
    render();
  }
}

function cadServerBaseUrl() {
  return state.cadServer?.url?.trim() ? normalizeBaseUrl(state.cadServer.url.trim()) : "";
}

async function checkCadServer() {
  syncDraftFromDom();
  const baseUrl = cadServerBaseUrl();
  if (!baseUrl) {
    state.cadServer.status = "Not configured";
    persist("Add a CAD server URL first");
    return;
  }

  loadingAction = "check-cad-server";
  render();

  try {
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || `CAD server failed (${response.status})`);
    state.cadServer.status = data.aiProxy ? "Online + AI proxy" : "Online";
    state.bridge.lastMessage = `${data.service || "CAD server"} is reachable. AI proxy: ${data.aiProxy ? "configured" : "not configured"}.`;
    persist("CAD server connected");
  } catch (error) {
    state.cadServer.status = `Error: ${error.message}`;
    persist("CAD server check failed");
  } finally {
    loadingAction = "";
    render();
  }
}

async function postCadServer(endpoint, body, label) {
  const baseUrl = cadServerBaseUrl();
  if (!baseUrl) throw new Error("Add a CAD server URL");
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(data.error || data.message || `${label} failed (${response.status})`);
  state.cadServer.status = "Online";
  return data;
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
  state.cloud.lastMessage = "Showing 3D preview.";
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
    state.cloud.lastMessage = "No cloud broker configured. Open the cloud CAD URL and sign in first.";
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
  syncDraftFromDom();
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
  syncDraftFromDom();
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
  syncDraftFromDom();
  loadingAction = "material";
  render();
  try {
    const data = await postBridge("/api/material-assessment", "Material assessment");
    state.analysis.material = data.materialAssessment || data;
    state.analysis.material.source = state.analysis.material.source || "Bridge";
    persist("Material/LCA assessment complete");
  } catch (error) {
    try {
      const data = await postCadServer("/api/lca", makeCurrentModelPayload(), "LCA assessment");
      state.analysis.material = data.materialAssessment || data;
      state.analysis.material.source = state.analysis.material.source || "CAD server";
      persist("CAD server LCA screen complete");
    } catch (serverError) {
      state.analysis.material = { ...buildMaterialAssessment(state.concept.material, state.parameters), source: "Local material model" };
      state.bridge.lastMessage = `Bridge/CAD server unavailable; local material/LCA estimate used (${serverError.message})`;
      persist("Local material/LCA assessment generated");
    }
  } finally {
    loadingAction = "";
    render();
  }
}

async function searchPatents() {
  syncDraftFromDom();
  const query = ideaSearchQuery();
  const requestBody = {
    query,
    family: state.concept.family,
    material: state.concept.material,
    features: state.concept.features,
    requirements: state.requirements
  };
  state.ip = state.ip || {};
  state.ip.query = query;

  if (!cadServerBaseUrl() && !state.bridge.url) {
    state.ip.status = "Links only";
    state.ip.source = "Search launchers";
    state.ip.results = [];
    state.ip.lastMessage = "Add a CAD server URL or bridge URL to run backend patent search. External search launchers are still available.";
    persist("Patent search links ready");
    return;
  }

  loadingAction = "search-patents";
  render();

  try {
    let data;
    if (cadServerBaseUrl()) {
      data = await postCadServer("/api/patents/search", requestBody, "Patent search");
    } else {
      const baseUrl = normalizeBaseUrl(state.bridge.url);
      const response = await fetch(`${baseUrl}/api/patents/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) throw new Error(data.error || data.message || `Patent search failed (${response.status})`);
    }
    state.ip.status = data.results?.length ? "Results found" : "No backend results";
    state.ip.source = data.source || "CAD server";
    state.ip.results = Array.isArray(data.results) ? data.results : [];
    state.ip.lastMessage = data.message || `${state.ip.results.length} patent records returned`;
    persist("Patent search complete");
  } catch (error) {
    state.ip.status = "Search failed";
    state.ip.source = "Search launchers";
    state.ip.results = [];
    state.ip.lastMessage = error.message || "Patent search failed";
    persist("Patent search failed");
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
  const geminiKeyStored = Boolean(sessionStorage.getItem(SESSION_GEMINI_KEY));
  const claudeKeyStored = Boolean(sessionStorage.getItem(SESSION_CLAUDE_KEY));
  const openaiKeyStored = Boolean(sessionStorage.getItem(SESSION_AI_KEY));
  const imageIdeas = imageIdeaSummary();
  const uploadedFiles = state.uploadedFiles || [];
  const [routeLabel, routeDetail] = aiRouteStatus();
  const modelDefault = state.ai.mode === "gemini" ? DEFAULT_GEMINI_MODEL
    : state.ai.mode === "claude" ? "claude-sonnet-4-6"
    : state.ai.mode === "openai" ? "gpt-4o-mini"
    : DEFAULT_MODEL;

  document.getElementById("copilotPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">AI input</span>
        <h2>Idea to CAD intent</h2>
      </div>
      <span class="badge ${state.ai.mode === "parser" ? "warn" : ""}">
        ${state.ai.mode === "parser" ? "offline" : state.ai.mode === "gemini" ? "Gemini" : state.ai.mode === "claude" ? "Claude" : state.ai.mode === "openai" ? "OpenAI" : "endpoint"}
      </span>
    </div>
    <div class="panel-body fill-panel">
      <div class="field-grid">
        <p class="panel-intro">Start with a plain-language idea. Add reference images, requirement docs, or a parameter spreadsheet only if they help.</p>
        <div>
          <label for="promptInput">Design intent</label>
          <textarea id="promptInput" placeholder="Example: Create a lightweight PET bottle with a 500 ml fill volume, ribbed grip, 28 mm closure, food-contact compliance, and enough stiffness for drop handling.">${escapeHtml(state.prompt)}</textarea>
        </div>

        <div class="upload-grid">
          <div class="upload-card">
            <div class="standards-header">
              <label for="ideaImageFiles">Images</label>
              <span class="badge ${imageIdeas.length ? "good" : ""}">${imageIdeas.length ? `${imageIdeas.length} loaded` : "optional"}</span>
            </div>
            <input id="ideaImageFiles" type="file" accept="image/*" multiple>
            <p class="helper-text">Sketches, references, or silhouettes become contour summaries for geometry generation.</p>
            ${state.geometry?.lastMessage ? `<p class="helper-text">${escapeHtml(state.geometry.lastMessage)}</p>` : ""}
          </div>

          <div class="upload-card">
            <div class="standards-header">
              <label for="requirementFiles">Files</label>
              <span class="badge ${uploadedFiles.length ? "good" : ""}">${uploadedFiles.length ? `${uploadedFiles.length} loaded` : "optional"}</span>
            </div>
            <input id="requirementFiles" type="file" multiple>
            <p class="helper-text">Briefs, notes, transcripts, or specs are appended to the design requirements.</p>
          </div>

          <div class="upload-card">
            <div class="standards-header">
              <label for="tableFiles">Parameters</label>
              <span class="badge ${state.designTable?.rows?.length ? "good" : ""}">${state.designTable?.rows?.length ? `${state.designTable.rows.length} rows` : "optional"}</span>
            </div>
            <input id="tableFiles" type="file" accept=".csv,.tsv,.txt,.xlsx" multiple>
            <p class="helper-text">Import CSV/TSV/XLSX-style design-table data for SolidWorks variables.</p>
          </div>
        </div>

        ${imageIdeas.length || uploadedFiles.length ? `
          <div class="artifact-list">
            ${imageIdeas.map(image => `
              <div class="artifact-card">
                <b>${escapeHtml(image.name)}</b>
                <span>${escapeHtml(image.dimensions)} | ${image.contourPoints} contour pts | ${image.confidence}% confidence | ${escapeHtml(image.silhouette)}</span>
              </div>
            `).join("")}
            ${uploadedFiles.slice(0, 4).map(file => `
              <div class="artifact-card">
                <b>${escapeHtml(file.name)}</b>
                <span>${escapeHtml(file.kind || "Requirement file")} | ${escapeHtml(file.summary || "Included in design brief")}</span>
              </div>
            `).join("")}
          </div>
        ` : ""}

        <details class="settings-details">
          <summary>AI provider settings</summary>
          <div class="settings-grid">
            <div class="field-row">
              <div>
                <label for="aiMode">AI provider</label>
                <select id="aiMode">
                  <option value="gemini" ${state.ai.mode === "gemini" ? "selected" : ""}>Gemini (free key)</option>
                  <option value="claude" ${state.ai.mode === "claude" ? "selected" : ""}>Claude (Anthropic)</option>
                  <option value="openai" ${state.ai.mode === "openai" ? "selected" : ""}>OpenAI</option>
                  <option value="bridge" ${state.ai.mode === "bridge" ? "selected" : ""}>Custom endpoint</option>
                  <option value="parser" ${state.ai.mode === "parser" ? "selected" : ""}>Local parser (no key)</option>
                </select>
              </div>
              <div>
                <label for="aiModel">Model</label>
                <input id="aiModel" value="${escapeHtml(state.ai.model || modelDefault)}" placeholder="${modelDefault}">
              </div>
            </div>

            ${state.ai.mode === "gemini" ? `
            <div>
              <label for="geminiKey">Gemini API key ${geminiKeyStored ? '<span class="badge" style="font-weight:400">loaded</span>' : `<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="font-size:11px;color:var(--accent)">Get free key</a>`}</label>
              <input id="geminiKey" type="password" placeholder="${geminiKeyStored ? "Key saved for this tab - paste to replace" : "AIza..."}">
            </div>` : ""}

            ${state.ai.mode === "claude" ? `
            <div>
              <label for="claudeKey">Anthropic API key ${claudeKeyStored ? '<span class="badge" style="font-weight:400">loaded</span>' : ''}</label>
              <input id="claudeKey" type="password" placeholder="${claudeKeyStored ? "Key saved for this tab - paste to replace" : "sk-ant-..."}">
            </div>` : ""}

            ${state.ai.mode === "openai" ? `
            <div>
              <label for="aiKey">OpenAI API key ${openaiKeyStored ? '<span class="badge" style="font-weight:400">loaded</span>' : ''}</label>
              <input id="aiKey" type="password" placeholder="${openaiKeyStored ? "Key saved for this tab - paste to replace" : "sk-..."}">
            </div>` : ""}

            ${state.ai.mode === "bridge" ? `
            <div>
              <label for="aiEndpoint">Endpoint URL</label>
              <input id="aiEndpoint" value="${escapeHtml(state.ai.endpoint)}" placeholder="https://your-server.example.com/api/copilot">
            </div>` : ""}
          </div>
        </details>

        <details class="settings-details route-details" open>
          <summary>AI route diagnostics</summary>
          <div class="route-grid">
            <div class="route-card active">
              <span>Active route</span>
              <strong>${escapeHtml(routeLabel)}</strong>
              <p>${escapeHtml(routeDetail)}</p>
            </div>
            ${AI_ROUTE_LIBRARY.map(([label, route, note]) => `
              <div class="route-card">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(route)}</strong>
                <p>${escapeHtml(note)}</p>
              </div>
            `).join("")}
          </div>
          <div class="button-row">
            <button class="button secondary" data-action="use-bridge-ai">Use bridge AI proxy</button>
            <button class="button ghost" data-action="test-ai" ${loadingAction === "test-ai" ? "disabled" : ""}>${loadingAction === "test-ai" ? "Checking..." : "Check AI route"}</button>
          </div>
        </details>

        <div class="button-row">
          <button class="button primary" data-action="ask-ai" ${loadingAction === "ask-ai" ? "disabled" : ""}>
            ${loadingAction === "ask-ai" ? "Generating..." : "Generate with AI"}
          </button>
          <button class="button secondary" data-action="generate-model">Generate local draft</button>
          <button class="button ghost" data-action="reset-demo">Reset</button>
        </div>
        ${state.ai.lastReply ? `<div class="ai-output${state.ai.status === "AI error" ? " ai-output-error" : ""}">${escapeHtml(state.ai.lastReply)}</div>` : ""}
      </div>
    </div>
  `;
}

// ── bottle slider helpers ─────────────────────────────────────────────────────

function saveOnly() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getBottleParam(key) {
  const p = state.parameters.find(p => p.key === key);
  return p != null ? p.value : null;
}

function bottleFamilies() {
  return [...new Set(BOTTLE_VARIANTS.map(v => v.morph))];
}

function bottleFamilySeeds(famKey) {
  return BOTTLE_VARIANTS.filter(v => v.morph === famKey)
    .sort((a, b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)));
}

function bottleFamilyLabel(famKey) {
  return BOTTLE_MORPH_FAMILIES[famKey] || famKey;
}

function bottleVariantPct(variant) {
  const seeds = bottleFamilySeeds(variant.morph);
  const index = seeds.findIndex(v => v.id === variant.id);
  if (index <= 0) return 0;
  return Math.round((index / Math.max(1, seeds.length - 1)) * 100);
}

function setBottleParam(key, val, source = "Slider") {
  const p = state.parameters.find(p => p.key === key);
  if (p) { p.value = val; p.source = source; }
  else {
    const cfg = BOTTLE_SLIDER_CONFIG.find(c => c.key === key);
    if (cfg) state.parameters.push({ key, label: cfg.label, unit: cfg.unit, value: val, source, swDimension: cfg.swKey, aliases: [] });
  }
}

function morphBottleAtPct(famKey, pct) {
  const seeds = bottleFamilySeeds(famKey);
  if (!seeds.length) return null;
  const t = pct / 100;
  const a = seeds[0], b = seeds[seeds.length - 1];
  const lerp = (x, y) => x + (y - x) * t;
  return {
    H: lerp(a.H, b.H), W: lerp(a.W, b.W), D: lerp(a.D, b.D),
    wall: lerp(a.wall, b.wall), base: lerp(a.base, b.base),
    neckOD: a.neckOD, mouthID: a.mouthID, neckH: a.neckH,
    shoulderH: lerp(a.shoulderH, b.shoulderH),
    supN: lerp(a.supN, b.supN),
    ribCount:   Math.round(lerp(a.ribCount, b.ribCount)),
    ribDepth:   lerp(a.ribDepth, b.ribDepth),
    ringCount:  Math.round(lerp(a.ringCount || 0, b.ringCount || 0)),
    ringDepth:  lerp(a.ringDepth || 0, b.ringDepth || 0),
    facetCount: Math.round(lerp(a.facetCount, b.facetCount)),
    facetDepth: lerp(a.facetDepth, b.facetDepth),
    helixCount: Math.round(lerp(a.helixCount, b.helixCount)),
    helixDepth: lerp(a.helixDepth, b.helixDepth),
    helixTurns: lerp(a.helixTurns, b.helixTurns),
  };
}

function applyMorphedVariant(morphed, source = "Morph") {
  if (!morphed) return;
  const map = {
    height:"H", bodyDiameter:"W", bodyDepth:"D", wall:"wall", base:"base",
    neckDiameter:"neckOD", mouthDiameter:"mouthID", shoulderHeight:"shoulderH",
    neckHeight:"neckH", superellipseN:"supN",
    ribCount:"ribCount", ribDepth:"ribDepth", ringCount:"ringCount", ringDepth:"ringDepth",
    facetCount:"facetCount", facetDepth:"facetDepth",
    helixRidges:"helixCount", helixDepth:"helixDepth", helixTurns:"helixTurns",
  };
  for (const [pk, mk] of Object.entries(map)) {
    if (morphed[mk] !== undefined) setBottleParam(pk, morphed[mk], source);
  }
}

function bottleDesignFromVariant(variant) {
  return {
    id: variant.id,
    concept: variant.concept,
    morph: variant.morph,
    pct: bottleVariantPct(variant),
    height: Number(variant.H),
    bodyDiameter: Number(variant.W),
    bodyDepth: Number(variant.D),
    wall: Number(variant.wall),
    base: Number(variant.base),
    neckDiameter: Number(variant.neckOD),
    mouthDiameter: Number(variant.mouthID),
    shoulderHeight: Number(variant.shoulderH),
    neckHeight: Number(variant.neckH),
    superellipseN: Number(variant.supN),
    ribCount: Number(variant.ribCount || 0),
    ribDepth: Number(variant.ribDepth || 0),
    ringCount: Number(variant.ringCount || 0),
    ringDepth: Number(variant.ringDepth || 0),
    facetCount: Number(variant.facetCount || 0),
    facetDepth: Number(variant.facetDepth || 0),
    helixRidges: Number(variant.helixCount || 0),
    helixDepth: Number(variant.helixDepth || 0),
    helixTurns: Number(variant.helixTurns || 0),
    material: state.concept.material || BOTTLE_LOCK_VALUES.material
  };
}

function bottleDesignFromMorph(famKey, pct) {
  const morphed = morphBottleAtPct(famKey, pct);
  const seeds = bottleFamilySeeds(famKey);
  const first = seeds[0] || BOTTLE_VARIANTS[0];
  const last = seeds[seeds.length - 1] || first;
  const near = pct < 50 ? first : last;
  if (!morphed) return bottleDesignFromVariant(near);
  return {
    ...bottleDesignFromVariant(near),
    id: `${famKey.replace("→", "")}-${String(Math.round(pct)).padStart(3, "0")}`,
    concept: `${bottleFamilyLabel(famKey)} morph`,
    morph: famKey,
    pct,
    height: morphed.H,
    bodyDiameter: morphed.W,
    bodyDepth: morphed.D,
    wall: morphed.wall,
    base: morphed.base,
    neckDiameter: morphed.neckOD,
    mouthDiameter: morphed.mouthID,
    shoulderHeight: morphed.shoulderH,
    neckHeight: morphed.neckH,
    superellipseN: morphed.supN,
    ribCount: morphed.ribCount,
    ribDepth: morphed.ribDepth,
    ringCount: morphed.ringCount,
    ringDepth: morphed.ringDepth,
    facetCount: morphed.facetCount,
    facetDepth: morphed.facetDepth,
    helixRidges: morphed.helixCount,
    helixDepth: morphed.helixDepth,
    helixTurns: morphed.helixTurns
  };
}

function currentBottleDesign() {
  const variantId = state._bottleMorph?.activeId;
  const seed = BOTTLE_VARIANTS.find(v => v.id === variantId) || nearestBottleVariantFromParams();
  const fromSeed = seed ? bottleDesignFromVariant(seed) : bottleDesignFromVariant(BOTTLE_VARIANTS[0]);
  const value = (key, fallback) => {
    const raw = getBottleParam(key);
    return raw == null ? fallback : Number(raw);
  };
  return {
    ...fromSeed,
    id: state._bottleMorph?.activeId || fromSeed.id || "CUSTOM",
    concept: state.concept.title || fromSeed.concept,
    morph: state._bottleMorph?.family || fromSeed.morph,
    pct: Number(state._bottleMorph?.pct ?? fromSeed.pct ?? 0),
    height: value("height", fromSeed.height),
    bodyDiameter: value("bodyDiameter", fromSeed.bodyDiameter),
    bodyDepth: value("bodyDepth", fromSeed.bodyDepth),
    wall: value("wall", fromSeed.wall),
    base: value("base", fromSeed.base),
    neckDiameter: value("neckDiameter", fromSeed.neckDiameter),
    mouthDiameter: value("mouthDiameter", fromSeed.mouthDiameter),
    shoulderHeight: value("shoulderHeight", fromSeed.shoulderHeight),
    neckHeight: value("neckHeight", fromSeed.neckHeight),
    superellipseN: value("superellipseN", fromSeed.superellipseN),
    ribCount: value("ribCount", fromSeed.ribCount),
    ribDepth: value("ribDepth", fromSeed.ribDepth),
    ringCount: value("ringCount", fromSeed.ringCount),
    ringDepth: value("ringDepth", fromSeed.ringDepth),
    facetCount: value("facetCount", fromSeed.facetCount),
    facetDepth: value("facetDepth", fromSeed.facetDepth),
    helixRidges: value("helixRidges", fromSeed.helixRidges),
    helixDepth: value("helixDepth", fromSeed.helixDepth),
    helixTurns: value("helixTurns", fromSeed.helixTurns),
    material: state.concept.material || BOTTLE_LOCK_VALUES.material
  };
}

function nearestBottleVariantFromParams(design = null) {
  const d = design || {
    height: Number(getBottleParam("height") || 0),
    bodyDiameter: Number(getBottleParam("bodyDiameter") || 0),
    bodyDepth: Number(getBottleParam("bodyDepth") || 0),
    helixTurns: Number(getBottleParam("helixTurns") || 0)
  };
  let best = BOTTLE_VARIANTS[0];
  let bestScore = Infinity;
  for (const variant of BOTTLE_VARIANTS) {
    const score =
      Math.abs((variant.H || 0) - (d.height || 0)) +
      Math.abs((variant.W || 0) - (d.bodyDiameter || 0)) +
      Math.abs((variant.D || 0) - (d.bodyDepth || 0)) +
      4 * Math.abs((variant.helixTurns || 0) - (d.helixTurns || 0));
    if (score < bestScore) {
      best = variant;
      bestScore = score;
    }
  }
  return best;
}

function bottleEstimatedOverflow(design = currentBottleDesign()) {
  const seed = nearestBottleVariantFromParams(design);
  const denom = Math.max(1, Number(seed.H) * Number(seed.W) * Number(seed.D));
  const numer = Math.max(1, Number(design.height) * Number(design.bodyDiameter) * Number(design.bodyDepth));
  return BOTTLE_LOCK_VALUES.overflowTargetMl * (numer / denom);
}

function bottleRecommendedScale(design = currentBottleDesign()) {
  const overflow = bottleEstimatedOverflow(design);
  return Math.sqrt(BOTTLE_LOCK_VALUES.overflowTargetMl / Math.max(1, overflow));
}

function bottleSurfaceLabel(design = currentBottleDesign()) {
  const parts = [];
  if (Number(design.ribCount)) parts.push(`${Math.round(design.ribCount)} ribs`);
  if (Number(design.ringCount)) parts.push(`${Math.round(design.ringCount)} rings`);
  if (Number(design.facetCount)) parts.push(`${Math.round(design.facetCount)} facets`);
  if (Number(design.helixRidges)) parts.push(`${Math.round(design.helixRidges)} helix ribs`);
  return parts.join(" + ") || "smooth";
}

function syncModelDerivedState(message = "") {
  state.designTable.rows = buildDesignTableRows();
  state.analysis.material = buildMaterialAssessment(state.concept.material, state.parameters);
  if (state.concept.family === "bottle") {
    const design = currentBottleDesign();
    state.concept.features = [...new Set([...(state.concept.features || []), bottleSurfaceLabel(design)])].filter(Boolean).slice(0, 8);
    state.geometry.lastMessage = `Live CAD preview: ${round(design.height, 0)} x ${round(design.bodyDiameter, 1)} x ${round(design.bodyDepth, 1)} mm, ${bottleSurfaceLabel(design)}`;
  }
  if (message) state.bridge.lastMessage = message;
}

function previewTelemetryItems() {
  if (state.concept.family === "bottle") {
    const design = currentBottleDesign();
    return [
      ["Envelope", `${round(design.height, 0)} x ${round(design.bodyDiameter, 1)} x ${round(design.bodyDepth, 1)} mm`],
      ["Surface", bottleSurfaceLabel(design)],
      ["Overflow", `${round(bottleEstimatedOverflow(design), 0)} ml`],
      ["Preview", state.cadServer?.url ? (state.cadServer.status || "Geometry server") : "Live browser mesh"]
    ];
  }
  const length = getParameter("length", getParameter("baseLength", getParameter("bodyDiameter", 0)));
  const width = getParameter("width", getParameter("baseWidth", getParameter("bodyDepth", 0)));
  const height = getParameter("height", getParameter("legHeight", getParameter("depth", 0)));
  return [
    ["Envelope", [length, width, height].filter(Boolean).map(v => round(v, 1)).join(" x ") || "Pending"],
    ["Feature", state.concept.features?.[0] || state.concept.familyLabel || "Parametric"],
    ["Parameters", `${state.parameters.length} linked specs`],
    ["Preview", state.cadServer?.url ? (state.cadServer.status || "Geometry server") : "Live browser mesh"]
  ];
}

function renderPreviewTelemetry() {
  return `<div class="preview-telemetry" id="previewTelemetry">
    ${previewTelemetryItems().map(([label, value]) => `
      <div class="preview-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>
    `).join("")}
  </div>`;
}

function refreshPreviewTelemetry() {
  const slot = document.getElementById("previewTelemetry");
  if (slot) slot.outerHTML = renderPreviewTelemetry();
}

function fmtSliderVal(cfg, val) {
  const n = cfg.integer ? Math.round(val) : val;
  const decimals = cfg.step >= 1 ? 0 : cfg.step >= 0.05 ? 1 : 2;
  return `${Number(n).toFixed(decimals)}${cfg.unit ? " " + cfg.unit : ""}`;
}

function bottleStepCount() {
  return clamp(Number(state._bottleMorph?.steps || 5), 3, 25);
}

function bottleSvg(design, options = {}) {
  const W = options.w || 128;
  const H = options.h || 190;
  const uid = sanitizeFilename(options.uid || design.id || "bottle").replace(/-/g, "_");
  const cx = W / 2;
  const bodyTop = H * 0.25;
  const bodyBottom = H * 0.88;
  const bodyHeight = bodyBottom - bodyTop;
  const maxMm = Math.max(Number(design.bodyDiameter) || 65, 85);
  const scale = Math.min((W * 0.58) / maxMm, bodyHeight / (Number(design.height) || 220));
  const maxW = (Number(design.bodyDiameter) || 65) * scale;
  const depth = Number(design.bodyDepth) || Number(design.bodyDiameter) || 65;
  const shoulder = clamp((Number(design.shoulderHeight) || 30) * scale, 18, 58);
  const neckW = clamp((Number(design.neckDiameter) || BOTTLE_LOCK_VALUES.neckFinishOdMm) * scale * 1.1, 20, 42);
  const capW = clamp(BOTTLE_LOCK_VALUES.capOdMm * scale * 1.12, 28, 48);
  const capH = clamp(H * 0.045, 10, 16);
  const neckY = bodyTop - capH * 1.4;
  const capY = neckY - capH - 4;
  const isTaper = /taper|iconic/i.test(design.concept) || design.pct > 65;
  const isFlask = depth < (Number(design.bodyDiameter) || 65) * 0.86;
  const topW = Math.max(neckW * 1.2, maxW * (isTaper ? 0.48 : isFlask ? 0.72 : 0.82));
  const shoulderW = maxW * (isTaper ? 0.58 : isFlask ? 0.92 : 0.96);
  const midW = maxW * (isTaper ? 0.76 : isFlask ? 1.06 : 1);
  const bottomW = maxW * (isTaper ? 1.05 : isFlask ? 0.96 : 0.96);
  const y1 = bodyTop + shoulder;
  const y2 = bodyTop + bodyHeight * 0.58;
  const y3 = bodyBottom - 12;
  const path = `M ${cx - topW / 2} ${bodyTop}
    C ${cx - shoulderW / 2} ${bodyTop + shoulder * 0.25}, ${cx - midW / 2} ${bodyTop + shoulder * 0.75}, ${cx - midW / 2} ${y1}
    C ${cx - midW / 2} ${y1 + bodyHeight * 0.2}, ${cx - bottomW / 2} ${y2}, ${cx - bottomW / 2} ${y3}
    Q ${cx - bottomW / 2} ${bodyBottom}, ${cx} ${bodyBottom}
    Q ${cx + bottomW / 2} ${bodyBottom}, ${cx + bottomW / 2} ${y3}
    C ${cx + bottomW / 2} ${y2}, ${cx + midW / 2} ${y1 + bodyHeight * 0.2}, ${cx + midW / 2} ${y1}
    C ${cx + midW / 2} ${bodyTop + shoulder * 0.75}, ${cx + shoulderW / 2} ${bodyTop + shoulder * 0.25}, ${cx + topW / 2} ${bodyTop} Z`;
  const xLeft = cx - Math.max(midW, bottomW, shoulderW) / 2;
  const xRight = cx + Math.max(midW, bottomW, shoulderW) / 2;
  const detailStroke = options.small ? 0.65 : 1;
  let details = "";
  const ribCount = Math.min(Math.round(Number(design.ribCount) || 0), options.small ? 12 : 36);
  for (let i = 0; i < ribCount; i += 1) {
    const x = xLeft + (i + 1) * (xRight - xLeft) / (ribCount + 1);
    details += `<path d="M ${x} ${bodyTop + shoulder * .9} C ${x - 1.5} ${bodyTop + bodyHeight * .36}, ${x + 1.5} ${bodyTop + bodyHeight * .72}, ${x} ${bodyBottom - 8}" stroke="#51606a" stroke-width="${detailStroke}" opacity=".42" fill="none"/>`;
  }
  const ringCount = Math.min(Math.round(Number(design.ringCount) || 0), options.small ? 7 : 12);
  for (let i = 0; i < ringCount; i += 1) {
    const y = bodyTop + shoulder + 8 + i * (bodyHeight - shoulder - 28) / Math.max(1, ringCount - 1);
    details += `<path d="M ${xLeft + 8} ${y} C ${cx - maxW * .28} ${y + 3}, ${cx + maxW * .28} ${y + 3}, ${xRight - 8} ${y}" stroke="#39444d" stroke-width="${detailStroke * 1.5}" opacity=".46" fill="none"/>`;
  }
  const facetCount = Math.min(Math.round(Number(design.facetCount) || 0), options.small ? 7 : 14);
  for (let i = 0; i < facetCount; i += 1) {
    const x = xLeft + (i + 1) * (xRight - xLeft) / (facetCount + 1);
    const bias = (i % 2 === 0 ? -1 : 1) * maxW * .1;
    details += `<path d="M ${x} ${bodyTop + shoulder * .5} L ${x + bias} ${bodyTop + bodyHeight * .58} L ${x - bias * .45} ${bodyBottom - 10}" stroke="#39444d" stroke-width="${detailStroke}" opacity=".45" fill="none"/>`;
  }
  const helixCount = Math.max(0, Math.min(Math.round(Number(design.helixRidges) || 0), options.small ? 7 : 12));
  if (helixCount || Number(design.helixTurns) > 0.05) {
    const count = Math.max(4, helixCount || 6);
    for (let i = -1; i < count; i += 1) {
      const yStart = bodyTop + shoulder + i * 14;
      const yEnd = yStart + bodyHeight * .55 + Number(design.helixTurns || 0) * 13;
      details += `<path d="M ${xLeft + 6} ${yStart} C ${cx - maxW * .13} ${yStart + bodyHeight * .18}, ${cx + maxW * .08} ${yEnd - bodyHeight * .18}, ${xRight - 6} ${yEnd}" stroke="#1f2937" stroke-width="${detailStroke * 1.4}" opacity=".48" fill="none"/>`;
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(design.id)} ${escapeHtml(design.concept)}">
    <defs>
      <linearGradient id="g-${uid}" x1="0" x2="1"><stop offset="0" stop-color="#d7e0de" stop-opacity=".22"/><stop offset=".35" stop-color="#ffffff" stop-opacity=".62"/><stop offset="1" stop-color="#6d8581" stop-opacity=".34"/></linearGradient>
      <clipPath id="clip-${uid}"><path d="${path}"/></clipPath>
    </defs>
    <ellipse cx="${cx}" cy="${bodyBottom + 7}" rx="${Math.max(bottomW * .5, 22)}" ry="6" fill="#172225" opacity=".1"/>
    <path d="${path}" fill="url(#g-${uid})" stroke="#24383d" stroke-width="${options.small ? 1.3 : 1.8}"/>
    <g clip-path="url(#clip-${uid})">${details}<rect x="${cx - midW * .16}" y="${bodyTop + bodyHeight * .12}" width="${Math.max(4, midW * .08)}" height="${bodyHeight * .68}" rx="8" fill="#fff" opacity=".24"/></g>
    <path d="M ${cx - neckW / 2} ${neckY} L ${cx - neckW / 2} ${bodyTop + 4} C ${cx - neckW / 2} ${bodyTop + 7}, ${cx + neckW / 2} ${bodyTop + 7}, ${cx + neckW / 2} ${bodyTop + 4} L ${cx + neckW / 2} ${neckY} Z" fill="url(#g-${uid})" stroke="#24383d" stroke-width="${options.small ? 1 : 1.5}"/>
    <rect x="${cx - capW / 2}" y="${capY}" width="${capW}" height="${capH}" rx="4" fill="#24383d"/>
  </svg>`;
}

function bottleGeneratedSteps() {
  const fam = state._bottleMorph?.family || bottleFamilies()[0];
  const count = bottleStepCount();
  return Array.from({ length: count }, (_, index) => {
    const pct = count === 1 ? 0 : Math.round((index / Math.max(1, count - 1)) * 100);
    return bottleDesignFromMorph(fam, pct);
  });
}

function renderBottleMorphStrip() {
  const steps = bottleGeneratedSteps();
  return `<div class="bottle-strip" aria-label="Generated morph steps">
    ${steps.map((design, index) => `
      <button type="button" class="bottle-card ${Math.round(design.pct) === Math.round(state._bottleMorph?.pct || 0) ? "active" : ""}" data-action="load-bottle-morph-step" data-pct="${design.pct}">
        ${bottleSvg(design, { w: 104, h: 148, small: true, uid: `strip-${index}` })}
        <span><b>${index + 1}/${steps.length}</b>${Math.round(design.pct)}% · ${round(design.height, 0)}H × ${round(design.bodyDiameter, 1)}W</span>
      </button>
    `).join("")}
  </div>`;
}

function renderBottleMatrix() {
  return `<details class="bottle-matrix">
    <summary>5 × 5 seed matrix (${BOTTLE_VARIANTS.length} bottle concepts)</summary>
    <div class="bottle-grid">
      ${BOTTLE_VARIANTS.map((variant, index) => {
        const design = bottleDesignFromVariant(variant);
        return `<button type="button" class="bottle-tile ${state._bottleMorph?.activeId === variant.id ? "active" : ""}" data-action="load-bottle-matrix" data-variant-id="${variant.id}">
          ${bottleSvg(design, { w: 118, h: 160, small: true, uid: `tile-${index}` })}
          <b>${variant.id} · ${escapeHtml(variant.concept)}</b>
          <span>${escapeHtml(variant.morph)} · ${round(variant.H, 0)} × ${round(variant.W, 1)} × ${round(variant.D, 1)} mm</span>
          <em>${escapeHtml(bottleSurfaceLabel(design))}</em>
        </button>`;
      }).join("")}
    </div>
  </details>`;
}

function renderBottleFeatureOptions() {
  return `<details class="bottle-feature-options">
    <summary>Feature options from input sheet</summary>
    <div class="feature-option-grid">
      ${BOTTLE_FEATURE_OPTIONS.map(([feature, option1, option2, option3, purpose]) => `
        <div class="feature-option">
          <b>${escapeHtml(feature)}</b>
          <span>${escapeHtml([option1, option2, option3].join(" / "))}</span>
          <em>${escapeHtml(purpose)}</em>
        </div>
      `).join("")}
    </div>
  </details>`;
}

function bottleFormulaText(design = currentBottleDesign()) {
  return `"Design_ID" = "${design.id || "CUSTOM"}"
"Material" = "${design.material || BOTTLE_LOCK_VALUES.material}"
"H_body_mm" = ${round(design.height, 2)}
"Body_W_mm" = ${round(design.bodyDiameter, 2)}
"Body_D_mm" = ${round(design.bodyDepth, 2)}
"Wall_mm" = ${round(design.wall, 2)}
"Base_mm" = ${round(design.base, 2)}
"Shoulder_H_mm" = ${round(design.shoulderHeight, 2)}
"Superellipse_n" = ${round(design.superellipseN, 2)}
"Vertical_Rib_Count" = ${Math.round(design.ribCount || 0)}
"Vertical_Rib_Depth_mm" = ${round(design.ribDepth, 2)}
"Horizontal_Ring_Count" = ${Math.round(design.ringCount || 0)}
"Horizontal_Ring_Depth_mm" = ${round(design.ringDepth, 2)}
"Facet_Count" = ${Math.round(design.facetCount || 0)}
"Facet_Depth_mm" = ${round(design.facetDepth, 2)}
"Helix_Ridge_Count" = ${Math.round(design.helixRidges || 0)}
"Helix_Ridge_Depth_mm" = ${round(design.helixDepth, 2)}
"Helix_Turns" = ${round(design.helixTurns, 2)}

// Locked closure / base controls
"NeckFinish_OD_mm" = ${BOTTLE_LOCK_VALUES.neckFinishOdMm}
"Mouth_ID_mm" = ${BOTTLE_LOCK_VALUES.mouthIdMm}
"Thread_Pitch_mm" = ${BOTTLE_LOCK_VALUES.threadPitchMm}
"Cap_OD_mm" = ${BOTTLE_LOCK_VALUES.capOdMm}
"Cap_H_mm" = ${BOTTLE_LOCK_VALUES.capHeightMm}
"Base_min_mm" = ${BOTTLE_LOCK_VALUES.minBaseMm}

// Body surface equation
x = A(z) * sign(cos(theta + phi)) * |cos(theta + phi)|^(2/n) * [1 + Relief(z, theta)/R]
y = B(z) * sign(sin(theta + phi)) * |sin(theta + phi)|^(2/n) * [1 + Relief(z, theta)/R]
Relief = vertical ribs + horizontal rings + faceted panels + helical stream ribs`;
}

function renderBottleGatePanel() {
  const design = currentBottleDesign();
  const overflow = bottleEstimatedOverflow(design);
  const scale = bottleRecommendedScale(design);
  const overflowOk = overflow >= BOTTLE_LOCK_VALUES.overflowTargetMl - BOTTLE_LOCK_VALUES.overflowToleranceMl
    && overflow <= BOTTLE_LOCK_VALUES.overflowTargetMl + BOTTLE_LOCK_VALUES.overflowToleranceMl;
  const wallOk = design.wall >= 0.65 && design.wall <= 0.85;
  const baseOk = design.base >= BOTTLE_LOCK_VALUES.minBaseMm;
  const metrics = [
    ["Nominal fill", `${BOTTLE_LOCK_VALUES.targetFillMl} ml`, "locked label target"],
    ["Estimated overflow", `${round(overflow, 0)} ml`, overflowOk ? "inside concept gate" : `scale W/D × ${round(scale, 3)}`],
    ["Body envelope", `${round(design.height, 0)} × ${round(design.bodyDiameter, 1)} × ${round(design.bodyDepth, 1)} mm`, "H × W × D"],
    ["Wall / base", `${round(design.wall, 2)} / ${round(design.base, 1)} mm`, "body target / base"],
    ["Surface", bottleSurfaceLabel(design), "parametric relief"],
    ["Cap / neck", `${BOTTLE_LOCK_VALUES.capOdMm} mm / ${BOTTLE_LOCK_VALUES.neckFinishOdMm} mm`, "separate locked part"]
  ];
  const checks = [
    ["locked", "Product identity", "Water identity / quality is a release gate; CAD remains compatible with a 500 ml bottled-water package."],
    [overflowOk ? "pass" : "adjust", "Fill / overflow capacity", overflowOk ? `Estimated overflow ${round(overflow, 0)} ml is within ${BOTTLE_LOCK_VALUES.overflowTargetMl} ± ${BOTTLE_LOCK_VALUES.overflowToleranceMl} ml.` : `Estimated overflow ${round(overflow, 0)} ml is outside the concept gate; scale body W/D by ${round(scale, 3)} or adjust height.`],
    ["locked", "Neck / closure interface", `${BOTTLE_LOCK_VALUES.neckFinishOdMm} mm neck OD, ${BOTTLE_LOCK_VALUES.mouthIdMm} mm mouth ID, ${BOTTLE_LOCK_VALUES.threadPitchMm} mm pitch, and cap envelope are locked.`],
    [baseOk ? "locked" : "adjust", "Bottom / standing ring", baseOk ? `Base target ${round(design.base, 1)} mm clears the ${BOTTLE_LOCK_VALUES.minBaseMm} mm minimum.` : "Base target is below minimum; re-lock to approved base package."],
    [wallOk ? "pass" : "adjust", "Wall process window", wallOk ? `Wall target ${round(design.wall, 2)} mm is inside the concept window.` : `Wall target ${round(design.wall, 2)} mm needs engineering review.`],
    ["doc", "Food-contact material package", "Resin, enzyme/additive, colorants, cap, plug/liner, inks, coatings, and adhesives require food-contact authorization/migration review before release."],
    ["disabled", "Environmental claims", "Compostable, biodegradable, or recyclable claims stay disabled until the finished package is substantiated and qualified."]
  ];
  return `<div class="bottle-gates">
    <div class="bottle-metrics">${metrics.map(([label, value, note]) => `<div class="bottle-metric"><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b><span>${escapeHtml(note)}</span></div>`).join("")}</div>
    <div class="bottle-checks">${checks.map(([status, title, note]) => `<div class="bottle-check ${status}"><span>${escapeHtml(status)}</span><div><b>${escapeHtml(title)}</b><p>${escapeHtml(note)}</p></div></div>`).join("")}</div>
    <details class="formula-details">
      <summary>SolidWorks surface logic</summary>
      <pre>${escapeHtml(bottleFormulaText(design))}</pre>
    </details>
    <details class="formula-details">
      <summary>Code / compliance gates</summary>
      <div class="code-gate-list">${BOTTLE_CODE_GATES.map(([area, rule, gate]) => `<div><b>${escapeHtml(area)}</b><span>${escapeHtml(rule)}: ${escapeHtml(gate)}</span></div>`).join("")}</div>
    </details>
  </div>`;
}

function renderBottleSliders() {
  const morphFamilies = bottleFamilies();
  const curFam = state._bottleMorph?.family || morphFamilies[0];
  const curPct = state._bottleMorph?.pct ?? 0;
  const steps = bottleStepCount();

  const sliderRows = BOTTLE_SLIDER_CONFIG.map(cfg => {
    const raw = getBottleParam(cfg.key);
    const val = raw != null ? Math.max(cfg.min, Math.min(cfg.max, raw)) : cfg.min;
    return `
      <div class="bsl-row">
        <label class="bsl-label">
          <span>${cfg.label}</span>
          <span class="bsl-val" id="bslv-${cfg.key}">${fmtSliderVal(cfg, val)}</span>
        </label>
        <input type="range" class="bsl-input" data-bsl="${cfg.key}"
               min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${val}">
      </div>`;
  }).join("");

  const lockRows = BOTTLE_LOCKS.map(([k, v]) =>
    `<div class="bsl-lock"><b>🔒 ${k}</b><span>${v}</span></div>`
  ).join("");

  return `
    <div class="bsl-panel">
      <div class="bsl-row" style="border-bottom:none;padding-bottom:2px">
        <label class="bsl-label" style="margin-bottom:3px">Design family</label>
        <select id="bslMorphFam">
          ${morphFamilies.map(f => `<option value="${f}" ${f === curFam ? "selected" : ""}>${BOTTLE_MORPH_FAMILIES[f] || f}</option>`).join("")}
        </select>
      </div>
      <div class="bsl-row">
        <label class="bsl-label">
          <span>Morph position</span>
          <span class="bsl-val" id="bslMorphPctLabel">${curPct}%</span>
        </label>
        <input type="range" id="bslMorphPct" min="0" max="100" step="1" value="${curPct}">
        <p class="bsl-note">Drag to blend between the two seed designs.</p>
      </div>
      <div class="bsl-row">
        <label class="bsl-label">
          <span>Generated steps</span>
          <span class="bsl-val" id="bslStepCountLabel">${steps}</span>
        </label>
        <input type="range" id="bslStepCount" min="3" max="25" step="1" value="${steps}">
        <p class="bsl-note">Builds the n-step morph strip and CSV configurations from the selected family.</p>
      </div>
      <div class="bsl-divider">Body parameters</div>
      ${sliderRows}
      <details class="settings-details compact-details">
        <summary>Generated morph strip</summary>
        <div id="bottleMorphStripSlot">${renderBottleMorphStrip()}</div>
      </details>
      <details class="settings-details compact-details">
        <summary>Locked bottle specs</summary>
        <div class="bsl-locks">${lockRows}</div>
      </details>
      <div class="bsl-actions">
        <button class="button ghost" data-action="reset-bottle-nearest" type="button">Reset to nearest seed</button>
        <button class="button ghost" data-action="export-bottle-morph-csv" type="button">Export n-step CSV</button>
      </div>
      ${renderBottleMatrix()}
      ${renderBottleFeatureOptions()}
    </div>`;
}

function parameterSliderBounds(parameter) {
  const value = Number(parameter.value);
  const safeValue = Number.isFinite(value) ? value : 0;
  const isCount = parameter.unit === "count";
  const span = isCount ? Math.max(3, safeValue) : Math.max(Math.abs(safeValue) * 0.55, parameter.unit === "mm" ? 20 : 10);
  return {
    min: Math.max(0, round(safeValue - span, isCount ? 0 : 2)),
    max: round(safeValue + span, isCount ? 0 : 2),
    step: isCount ? 1 : parameter.unit === "mm" ? 0.1 : 0.5
  };
}

function renderGenericParameterSliders() {
  const numericParameters = state.parameters.filter(parameter => Number.isFinite(Number(parameter.value)));
  if (!numericParameters.length) {
    return `<p class="standards-empty">Generate a model or import a parameter table to unlock geometry sliders.</p>`;
  }

  return `
    <div class="generic-sliders">
      ${numericParameters.map(parameter => {
        const bounds = parameterSliderBounds(parameter);
        const value = clamp(Number(parameter.value), bounds.min, bounds.max);
        return `
          <div class="bsl-row">
            <label class="bsl-label">
              <span>${escapeHtml(parameter.label)}</span>
              <span class="bsl-val" id="pslv-${escapeHtml(parameter.key)}">${escapeHtml(formatValue(value, parameter.unit))}</span>
            </label>
            <input type="range" class="bsl-input" data-param-slider="${escapeHtml(parameter.key)}"
                   min="${bounds.min}" max="${bounds.max}" step="${bounds.step}" value="${value}">
          </div>`;
      }).join("")}
    </div>`;
}

function renderRequirements() {
  const intent = deriveDesignIntent();
  const imageIdeas = imageIdeaSummary();
  const matchedStandards = state.standards?.matched?.length ? state.standards.matched : intent.standards;
  const requirementLibrary = currentRequirementLibrary();
  const patentLinks = patentSearchLinks();
  const ipQuery = ideaSearchQuery();
  let selectedStandards = state.standards?.selected?.length ? state.standards.selected : matchedStandards.map(std => std.id);
  if (!matchedStandards.some(std => selectedStandards.includes(std.id))) selectedStandards = matchedStandards.map(std => std.id);
  const activeStandards = matchedStandards.filter(std => selectedStandards.includes(std.id));
  const activeConstraints = activeStandards.flatMap(std => std.constraints || []).map(c => `- ${c.param}: ${c.rule}`);
  const labelText = [...new Set(activeStandards.map(std => std.labelRequired).filter(Boolean))].join("; ");
  const intentRequirements = intent.requirements.length ? intent.requirements : (intent.combined ? [`Model intent: ${intent.combined.slice(0, 180)}${intent.combined.length > 180 ? "..." : ""}`] : []);

  document.getElementById("requirementsPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Legal standards</span>
        <h2>Rules around the idea</h2>
      </div>
      <button class="button ghost" data-action="lookup-standards">Auto-match</button>
    </div>
    <div class="panel-body fill-panel">
      <div class="field-grid">
        <p class="panel-intro">This section interprets the idea into requirements and applicable standards. It is a guide, not legal certification.</p>
        <section class="intent-section">
          <label>Design intent map</label>
          <div class="intent-chips">
            <span class="chip">Family: ${escapeHtml(intent.familyLabel)}</span>
            <span class="chip">Material: ${escapeHtml(intent.material || "Not specified")}</span>
            <span class="chip">Standards: ${matchedStandards.length}</span>
            <span class="chip">Images: ${imageIdeas.length}</span>
          </div>
          ${intentRequirements.length ? `
            <div class="intent-list">
              ${intentRequirements.slice(0, 5).map(item => `<div><b>Requirement</b><span>${escapeHtml(item)}</span></div>`).join("")}
            </div>
          ` : `<p class="standards-empty">Describe the design in the AI input panel to populate requirements and standards.</p>`}
          ${imageIdeas.length ? `
            <div class="intent-list compact">
              ${imageIdeas.slice(0, 3).map(image => `<div><b>Reference image</b><span>${escapeHtml(image.name)}: ${image.contourPoints} contour points, ${image.confidence}% confidence</span></div>`).join("")}
            </div>
          ` : ""}
        </section>

        <section class="standards-section">
          <div class="standards-header">
            <label>Matched standards</label>
            <span class="badge ${matchedStandards.length ? "good" : "warn"}">${matchedStandards.length || "none"}</span>
          </div>
          ${state.standards?.note ? `<p class="standards-note">${escapeHtml(state.standards.note)}</p>` : ""}
          <div class="standards-list">
            ${matchedStandards.length ? matchedStandards.map(std => `
              <label class="standard-item">
                <input type="checkbox" class="standard-checkbox" data-standard-id="${escapeHtml(std.id)}" ${selectedStandards.includes(std.id) ? "checked" : ""}>
                <div class="standard-info">
                  <div class="standard-id-row">
                    <span class="standard-id">${escapeHtml(std.id)}</span>
                    <span class="badge">${escapeHtml(std.category)}</span>
                  </div>
                  <span class="standard-title">${escapeHtml(std.title)}</span>
                  ${std.testRequired ? `<span class="standard-test">Tests: ${escapeHtml(std.testRequired)}</span>` : ""}
                </div>
              </label>
            `).join("") : `<p class="standards-empty">Click "Auto-match" or "Generate + match standards" to detect applicable standards from your prompt and material.</p>`}
          </div>
          ${activeConstraints.length ? `
            <div class="standards-constraints">
              <strong>Parameter constraints from selected standards:</strong>
              <ul>${activeConstraints.map(c => `<li>${escapeHtml(c.replace(/^- /, ""))}</li>`).join("")}</ul>
            </div>
          ` : ""}
          ${labelText ? `
            <div class="standards-labels">
              <strong>Required on label:</strong>
              <p>${escapeHtml(labelText)}</p>
            </div>
          ` : ""}
        </section>

        <details class="settings-details" open>
          <summary>Requirements library</summary>
          <div class="library-grid">
            ${requirementLibrary.length ? requirementLibrary.map(item => `
              <div class="library-card">
                <span>${escapeHtml(item.libraryGroup)} / ${escapeHtml(item.category)}</span>
                <strong>${escapeHtml(item.id)}</strong>
                <p>${escapeHtml(item.title)}</p>
                ${item.scope ? `<em>${escapeHtml(item.scope)}</em>` : ""}
              </div>
            `).join("") : `<p class="standards-empty">No requirement library entries found for this product type.</p>`}
          </div>
        </details>

        <details class="settings-details" open>
          <summary>Patents / IP landscape</summary>
          <div class="ip-panel">
            <div>
              <span class="meta-label">Prior-art query</span>
              <p>${escapeHtml(ipQuery)}</p>
            </div>
            <div class="button-row">
              <button class="button secondary" data-action="search-patents" ${loadingAction === "search-patents" ? "disabled" : ""}>${loadingAction === "search-patents" ? "Searching..." : "Run backend patent search"}</button>
              <span class="badge ${state.ip?.status === "Results found" ? "good" : state.ip?.status === "Search failed" ? "bad" : "warn"}">${escapeHtml(state.ip?.status || "Not searched")}</span>
            </div>
            ${state.ip?.lastMessage ? `<p class="helper-text">${escapeHtml(state.ip.lastMessage)}</p>` : ""}
            ${state.ip?.results?.length ? `
              <div class="patent-results">
                ${state.ip.results.slice(0, 6).map(result => `
                  <a class="patent-card" href="${escapeHtml(result.url || patentLinks[0][1])}" target="_blank" rel="noopener">
                    <span>${escapeHtml(result.source || state.ip.source || "Patent record")}</span>
                    <strong>${escapeHtml(result.title || "Untitled patent")}</strong>
                    <p>${escapeHtml([result.publication || result.patentNumber, result.date, result.assignee].filter(Boolean).join(" | ") || "Patent metadata pending")}</p>
                    ${result.abstract ? `<em>${escapeHtml(result.abstract.slice(0, 220))}${result.abstract.length > 220 ? "..." : ""}</em>` : ""}
                  </a>
                `).join("")}
              </div>
            ` : ""}
            <div class="link-grid">
              ${patentLinks.map(([label, url, note]) => `
                <a class="tool-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">
                  <strong>${escapeHtml(label)}</strong>
                  <span>${escapeHtml(note)}</span>
                </a>
              `).join("")}
            </div>
            <p class="helper-text">This is a search launcher, not freedom-to-operate advice. A real implementation should add a backend patent API, result scoring, claim clustering, and attorney review workflow.</p>
          </div>
        </details>

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
  const bridgeOk = state.bridge.status === "Connected" || state.bridge.status === "Synced" || state.bridge.status === "Bridge online";
  const docName = state.bridge.activeDocument || `${sanitizeFilename(state.concept.title)}.SLDPRT`;

  document.getElementById("modelPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">CAD / SolidWorks</span>
        <h2>${escapeHtml(docName)}</h2>
      </div>
      <span class="badge ${showCloud || showBridge ? "" : bridgeOk ? "" : "warn"}">${showCloud ? "cloud" : showBridge ? "bridge" : "3D preview"}</span>
    </div>
    <div class="panel-body fill-panel">
      <div class="model-frame">
        <div class="model-bar">
          <span>${escapeHtml(state.concept.family ? state.concept.familyLabel : "3D preview")}</span>
          <span style="opacity:.7">${state.parameters.length ? `${state.parameters.length} parameters` : "No parameters yet"}</span>
        </div>
        <div class="model-embed">
          ${showCloud && cloudViewer ? `
            <iframe title="Cloud CAD workspace" src="${escapeHtml(cloudViewer)}" allow="fullscreen"></iframe>
            <div class="embed-note">If the CAD tool blocks iframe embedding, click Open in new tab.</div>
          ` : showBridge ? `<iframe title="Bridge viewer" src="${escapeHtml(bridgeViewer)}"></iframe>` : `
            <div class="preview-stage" id="threeViewport"></div>
          `}
        </div>
      </div>

      ${renderPreviewTelemetry()}

      <div class="portal-grid">
        ${CAD_PORTAL_LANES.map(([label, note]) => `
          <div class="portal-card">
            <span>${escapeHtml(label)}</span>
            <p>${escapeHtml(note)}</p>
          </div>
        `).join("")}
      </div>

      <div class="button-row cad-action-row">
        <button class="button primary" data-action="send-model" ${loadingAction === "send-model" ? "disabled" : ""}>Import / push to SolidWorks</button>
        <button class="button secondary" data-action="download-sw-vars">Export SolidWorks macro</button>
        <button class="button secondary" data-action="export-design-table">Export design table</button>
        <button class="button secondary" data-action="download-stl" ${loadingAction === "download-stl" ? "disabled" : ""}>Export STL</button>
        <button class="button ghost" data-action="show-local-preview">Refresh CAD preview</button>
        <button class="button ghost" data-action="open-bridge-viewer">Open CAD portal</button>
      </div>

      <details class="settings-details">
        <summary>SolidWorks connection and CAD server settings</summary>
        <div class="settings-grid">
          <div class="field-row">
            <div>
              <label for="bridgeUrl">SolidWorks bridge URL</label>
              <input id="bridgeUrl" value="${escapeHtml(state.bridge.url)}" placeholder="http://127.0.0.1:8787">
              <p class="helper-text">Use the local Windows bridge for actual SolidWorks automation. On Mac this remains a preview/export flow.</p>
            </div>
            <div>
              <label for="cadServerUrl">Geometry server URL</label>
              <input id="cadServerUrl" value="${escapeHtml(state.cadServer?.url || "")}" placeholder="https://your-cad-server.onrender.com">
              <p class="helper-text">Optional service for server-generated meshes instead of browser fallback geometry.</p>
            </div>
          </div>
          <div class="button-row">
            <button class="button secondary" data-action="connect-bridge" ${loadingAction === "connect-bridge" ? "disabled" : ""}>${loadingAction === "connect-bridge" ? "Connecting..." : bridgeOk ? "Bridge connected" : "Connect bridge"}</button>
            <button class="button secondary" data-action="check-cad-server" ${loadingAction === "check-cad-server" ? "disabled" : ""}>${loadingAction === "check-cad-server" ? "Checking..." : "Check CAD server"}</button>
            <button class="button ghost" data-action="export-snapshot">Export payload</button>
          </div>
          ${state.bridge.lastMessage ? `<p class="bridge-msg">${escapeHtml(state.bridge.lastMessage)}</p>` : ""}
          <div class="field-row">
            <div>
              <label for="cloudSpaceUrl">Cloud CAD embed URL</label>
              <input id="cloudSpaceUrl" value="${state.cloud.spaceUrl && state.cloud.spaceUrl !== "https://my.3dexperience.3ds.com/" ? escapeHtml(state.cloud.spaceUrl) : ""}" placeholder="Paste a public Onshape, xDesign, or viewer URL">
            </div>
            <div class="button-stack">
              <button class="button ghost" data-action="show-cloud-frame">Embed cloud CAD</button>
              <button class="button ghost" data-action="open-cloud">Open cloud CAD</button>
            </div>
          </div>
          <div class="bridge-strip">
            <div class="bridge-card"><span>Bridge</span><strong>${escapeHtml(state.bridge.status)}</strong></div>
            <div class="bridge-card"><span>Last push</span><strong>${escapeHtml(formatDate(state.bridge.lastSync))}</strong></div>
            <div class="bridge-card"><span>Revision</span><strong>R${String(state.revision).padStart(2, "0")}</strong></div>
          </div>
        </div>
      </details>
    </div>
  `;
}

function renderSpecs() {
  const isBottle = state.concept?.family === "bottle" || state.selectedTemplate === "bottle";
  document.getElementById("specsPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Parameters</span>
        <h2>Geometry controls</h2>
      </div>
      <div class="button-row">
        <button class="button secondary" data-action="apply-parameters">Apply specs</button>
        <button class="button secondary" data-action="export-design-table">Export CSV</button>
        <button class="button ghost" data-action="${state.concept.family === "bottle" ? "export-bottle-json" : "export-snapshot"}">Export JSON</button>
      </div>
    </div>
    <div class="panel-body fill-panel parameter-body">
      <p class="panel-intro">Choose the model type, then tune the dimensions. Slider changes update the CAD preview immediately.</p>
      <div class="field-row parameter-selector-row">
        <div>
          <label for="templateSelect">Product type</label>
          <select id="templateSelect">
            <option value="auto" ${state.selectedTemplate === "auto" ? "selected" : ""}>Auto-detect</option>
            <option value="enclosure" ${state.selectedTemplate === "enclosure" ? "selected" : ""}>Enclosure</option>
            <option value="bottle" ${state.selectedTemplate === "bottle" ? "selected" : ""}>Bottle / container</option>
            <option value="bracket" ${state.selectedTemplate === "bracket" ? "selected" : ""}>Bracket</option>
            <option value="tray" ${state.selectedTemplate === "tray" ? "selected" : ""}>Tray</option>
            <option value="assembly" ${state.selectedTemplate === "assembly" ? "selected" : ""}>Assembly</option>
          </select>
        </div>
        ${isBottle ? `
        <div>
          <label for="variantSelect">Seed variant</label>
          <select id="variantSelect">
            <option value="">Pick a seed design</option>
            ${BOTTLE_VARIANTS.map(v => `<option value="${v.id}">${v.id}: ${escapeHtml(v.concept)}</option>`).join("")}
          </select>
        </div>` : `
        <div>
          <label>Current model</label>
          <div class="readout-box">${escapeHtml(state.concept.familyLabel || "Auto-detect")} | ${escapeHtml(state.concept.material || "material pending")}</div>
        </div>`}
      </div>

      ${isBottle ? renderBottleSliders() : renderGenericParameterSliders()}

      <details class="settings-details specs-table-details">
        <summary>SolidWorks parameter table</summary>
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
      </details>

      <aside class="spec-summary compact-summary">
        <div>
          <span class="meta-label">Current model</span>
          <h3>${escapeHtml(state.concept.title || "New design")}</h3>
        </div>
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
        ${state.concept.family === "bottle" ? `
          <details class="settings-details compact-details">
            <summary>Bottle release gates</summary>
            ${renderBottleGatePanel()}
          </details>
        ` : ""}
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

// ─── Three.js 3D viewer ──────────────────────────────────────────────────────

let _three = null;

function disposeThree() {
  if (_three) {
    cancelAnimationFrame(_three.animId);
    _three.renderer.dispose();
    _three.resizeObs.disconnect();
    _three = null;
  }
}

function getP(params, key, fallback) {
  const p = Array.isArray(params) ? params.find(p => p.key === key) : null;
  return p ? (Number(p.value) || fallback) : fallback;
}

function build3DGeometry(family, params) {
  if (family === "bottle") {
    const H   = getP(params, "height", 232);
    const R   = getP(params, "bodyDiameter", 58) / 2;
    const D   = getP(params, "bodyDepth", R * 2) / 2;  // depth radius; default = circular
    const nR  = getP(params, "neckDiameter", 28) / 2;
    const sH  = getP(params, "shoulderHeight", 28);
    const nH  = getP(params, "neckHeight", 25);
    const ribCount = getP(params, "ribCount", 0);
    const ribDepth = getP(params, "ribDepth", 0);
    const ringCount = getP(params, "ringCount", 0);
    const ringDepth = getP(params, "ringDepth", 0);
    const facetCount = getP(params, "facetCount", 0);
    const facetDepth = getP(params, "facetDepth", 0);
    const helixRidges = getP(params, "helixRidges", 0);
    const helixDepth = getP(params, "helixDepth", 0);
    const helixTurns = getP(params, "helixTurns", 0);
    const bH  = 8;
    const bodyTop = H - sH - nH;
    const pts = [
      new THREE.Vector2(R * 0.35, 0),
      new THREE.Vector2(R, bH),
      new THREE.Vector2(R, bodyTop),
      new THREE.Vector2(nR * 1.35, H - nH - 4),
      new THREE.Vector2(nR, H - nH),
      new THREE.Vector2(nR, H)
    ];
    const geom = new THREE.LatheGeometry(pts, 72);
    // Apply oval squeeze when depth differs from diameter
    if (Math.abs(D - R) > 2 || ribDepth || ringDepth || facetDepth || helixDepth) {
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const bodyRatio = Math.min(1, Math.max(0, (y - bH) / Math.max(1, bodyTop - bH)));
        const squash = D / R;
        let nx = x;
        let nz = z * (squash * bodyRatio + 1 * (1 - bodyRatio));
        const inBody = y >= bH && y <= bodyTop;
        if (inBody) {
          const theta = Math.atan2(nz, nx);
          const radius = Math.max(1, Math.sqrt(nx * nx + nz * nz));
          let relief = 0;
          if (ribCount > 0 && ribDepth > 0) {
            relief -= ribDepth * Math.pow(0.5 + 0.5 * Math.cos(theta * Math.round(ribCount)), 8);
          }
          if (ringCount > 0 && ringDepth > 0) {
            relief -= ringDepth * Math.pow(0.5 + 0.5 * Math.cos(bodyRatio * Math.round(ringCount) * Math.PI * 2), 10);
          }
          if (facetCount > 2 && facetDepth > 0) {
            relief -= facetDepth * (0.5 + 0.5 * Math.cos(theta * Math.round(facetCount)));
          }
          if ((helixRidges > 0 || helixTurns > 0) && helixDepth > 0) {
            const ridges = Math.max(1, Math.round(helixRidges || 8));
            relief -= helixDepth * Math.pow(0.5 + 0.5 * Math.cos(theta * ridges - bodyRatio * helixTurns * Math.PI * 2), 8);
          }
          const scaled = Math.max(0.72, (radius + relief) / radius);
          nx *= scaled;
          nz *= scaled;
        }
        pos.setX(i, nx);
        pos.setZ(i, nz);
      }
      pos.needsUpdate = true;
      geom.computeVertexNormals();
    }
    return geom;
  }
  if (family === "bracket") {
    const bL = getP(params, "baseLength", 120);
    const bW = getP(params, "baseWidth", 48);
    const lH = getP(params, "legHeight", 62);
    const t  = getP(params, "thickness", 4);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(bL, 0); shape.lineTo(bL, t);
    shape.lineTo(t, t); shape.lineTo(t, lH); shape.lineTo(0, lH); shape.lineTo(0, 0);
    return new THREE.ExtrudeGeometry(shape, { depth: bW, bevelEnabled: false });
  }
  if (family === "tray") {
    const L = getP(params, "length", 220);
    const W = getP(params, "width", 140);
    const D = getP(params, "depth", 32);
    return new THREE.BoxGeometry(L, D, W);
  }
  // enclosure + assembly + default
  const L = getP(params, "length", 170) || getP(params, "baseLength", 120);
  const W = getP(params, "width", 95)   || getP(params, "baseWidth", 80);
  const H = getP(params, "height", 42)  || getP(params, "legHeight", 40);
  return new THREE.BoxGeometry(L || 120, H || 42, W || 80);
}

function setupThreeScene(container) {
  const W = container.clientWidth  || 500;
  const H = container.clientHeight || 420;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a2420);
  scene.fog = new THREE.Fog(0x1a2420, 800, 1600);

  const camera = new THREE.PerspectiveCamera(42, W / H, 0.5, 3000);
  camera.position.set(0, 140, 340);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xaaccbb, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(120, 220, 140);
  sun.castShadow = true;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x5599ff, 0.25);
  fill.position.set(-100, 60, -120);
  scene.add(fill);

  const grid = new THREE.GridHelper(800, 32, 0x2d4038, 0x232e28);
  scene.add(grid);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.update();

  let animId;
  (function loop() {
    animId = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  })();

  const resizeObs = new ResizeObserver(() => {
    const nW = container.clientWidth;
    const nH = container.clientHeight;
    if (!nW || !nH) return;
    camera.aspect = nW / nH;
    camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });
  resizeObs.observe(container);

  _three = { renderer, animId, resizeObs, scene, camera, controls };
  return _three;
}

function addMeshToScene(geom, ctx) {
  const { scene, controls } = ctx;
  // remove old meshes
  const old = scene.getObjectByName("cadMesh");
  const oldW = scene.getObjectByName("cadWire");
  if (old) scene.remove(old);
  if (oldW) scene.remove(oldW);

  geom.computeBoundingBox();
  const box = new THREE.Box3();
  box.copy(geom.boundingBox);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);

  const mat = new THREE.MeshStandardMaterial({
    color: 0x4a9e7c, roughness: 0.28, metalness: 0.12, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = "cadMesh";
  mesh.castShadow = true;
  mesh.position.set(-center.x, -box.min.y, -center.z);
  scene.add(mesh);

  const edges = new THREE.EdgesGeometry(geom);
  const wire = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x7dd4ac, transparent: true, opacity: 0.20 }));
  wire.name = "cadWire";
  wire.position.copy(mesh.position);
  scene.add(wire);

  const camDist = maxDim * 1.8;
  ctx.camera.position.set(camDist * 0.6, camDist * 0.7, camDist);
  controls.target.set(0, size.y * 0.4, 0);
  controls.update();
}

function mount3DViewer(options = {}) {
  const container = document.getElementById("threeViewport");
  if (!container) return;
  if (typeof THREE === "undefined") {
    container.innerHTML = `
      <div class="preview-fallback">
        ${renderPreviewSvg()}
        <p>3D engine not loaded. The parameterized SVG fallback is shown here; refresh or check the Three.js CDN connection for the interactive mesh.</p>
      </div>`;
    return;
  }

  // Reuse existing scene if already mounted in this container
  if (!_three || !container.contains(_three.renderer.domElement)) {
    disposeThree();
    setupThreeScene(container);
  }

  const serverUrl = state.cadServer?.url?.trim();

  if (serverUrl && state.parameters.length && !options.forceLocal) {
    // ── fetch real STL from geometry server ──
    container.style.cursor = "wait";
    fetch(`${serverUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ family: state.concept.family, parameters: state.parameters })
    })
      .then(r => { if (!r.ok) throw new Error(`Server ${r.status}`); return r.arrayBuffer(); })
      .then(buf => {
        const loader = new THREE.STLLoader();
        const geom = loader.parse(buf);
        addMeshToScene(geom, _three);
        container.style.cursor = "";
        state.cadServer.status = "Loaded";
        refreshPreviewTelemetry();
      })
      .catch(err => {
        container.style.cursor = "";
        state.cadServer.status = `Error: ${err.message}`;
        // Fall back to parametric geometry
        addMeshToScene(build3DGeometry(state.concept.family, state.parameters), _three);
        refreshPreviewTelemetry();
      });
  } else {
    // ── parametric fallback (no server configured) ──
    if (state.parameters.length || state.concept.family) {
      addMeshToScene(build3DGeometry(state.concept.family, state.parameters), _three);
      state.cadServer.status = options.forceLocal && serverUrl ? "Live local preview" : state.cadServer.status;
      refreshPreviewTelemetry();
    }
  }
}

function renderFea() {
  const sim = state.analysis.simulation;
  const opt = state.analysis.optimization;
  const material = state.analysis.material || buildMaterialAssessment(state.concept.material, state.parameters);
  const simBadge = sim?.status === "Pass" ? "good" : sim?.status === "Hold" ? "bad" : sim ? "warn" : "warn";
  const recommendations = opt?.recommendations || [];

  document.getElementById("feaPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">FEA</span>
        <h2>Structural analysis</h2>
      </div>
      <span class="badge ${simBadge}">${sim ? escapeHtml(sim.status) : "not run"}</span>
    </div>
    <div class="panel-body fill-panel">
      <p class="panel-intro">Run a first-pass finite element check. If a SolidWorks bridge exposes /api/simulate, the result can come from SolidWorks Simulation; otherwise this dashboard uses a local screening estimate.</p>

      <div class="button-row">
        <button class="button primary" data-action="simulate" ${loadingAction === "simulate" ? "disabled" : ""}>${loadingAction === "simulate" ? "Running..." : "Run FEA"}</button>
        <button class="button secondary" data-action="optimize" ${loadingAction === "optimize" ? "disabled" : ""}>${loadingAction === "optimize" ? "Optimizing..." : "Suggest geometry updates"}</button>
      </div>

      <div class="fea-grid">
        <div class="fea-card">
          <span>Safety factor</span>
          <strong>${sim?.safetyFactor ? escapeHtml(sim.safetyFactor) : "Pending"}</strong>
          <p>${escapeHtml(sim?.critique || "Run FEA after generating or adjusting the model.")}</p>
        </div>
        <div class="fea-card">
          <span>Mass index</span>
          <strong>${sim?.massIndex ? escapeHtml(sim.massIndex) : "Pending"}</strong>
          <p>Relative mass proxy from envelope, wall, and material assumptions.</p>
        </div>
        <div class="fea-card">
          <span>Source</span>
          <strong>${escapeHtml(sim?.source || "Not run")}</strong>
          <p>${sim?.generatedAt ? escapeHtml(formatDate(sim.generatedAt)) : "Connect the bridge for real SolidWorks Simulation."}</p>
        </div>
        <div class="fea-card">
          <span>Material screen</span>
          <strong>${escapeHtml(`${material.feasibility}/100`)}</strong>
          <p>${escapeHtml(material.notes || material.recommendation || "Material data pending.")}</p>
        </div>
      </div>

      <details class="settings-details lca-details" open>
        <summary>Lifecycle assessment handoff</summary>
        <div class="lca-grid">
          <div class="lca-score">
            <span>Dashboard LCA screen</span>
            <strong>${escapeHtml(`${material.lca}/100`)}</strong>
            <p>${escapeHtml(material.decomposition)} end-of-life review. ${escapeHtml(material.recommendation || "")}</p>
            <button class="button secondary" data-action="material" ${loadingAction === "material" ? "disabled" : ""}>${loadingAction === "material" ? "Assessing..." : "Run material / LCA screen"}</button>
          </div>
          <div class="link-grid">
            ${LCA_TOOL_LINKS.map(link => `
              <a class="tool-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">
                <strong>${escapeHtml(link.label)}</strong>
                <span>${escapeHtml(link.note)}</span>
              </a>
            `).join("")}
          </div>
        </div>
      </details>

      ${recommendations.length ? `
        <div class="recommendation-list">
          <strong>FEA-driven changes</strong>
          ${recommendations.map(item => `<p>${escapeHtml(item)}</p>`).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────

function render() {
  renderHeader();
  renderCopilot();
  renderRequirements();
  renderSpecs();
  renderModel();
  renderFea();
  requestAnimationFrame(mount3DViewer);
}

document.addEventListener("click", event => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "ask-ai") askCopilot();
  if (action === "test-ai") testAiRoute();
  if (action === "use-bridge-ai") useBridgeAiProxy();
  if (action === "generate-model") generateModel();
  if (action === "apply-parameters") applyParameterChanges();
  if (action === "connect-bridge") connectBridge();
  if (action === "check-cad-server") checkCadServer();
  if (action === "send-model") sendToSolidWorks();
  if (action === "download-stl") downloadStl();
  if (action === "open-bridge-viewer") openBridgeViewer();
  if (action === "open-cloud") openCloudWorkspace();
  if (action === "show-cloud-frame") showCloudFrame();
  if (action === "show-local-preview") showLocalPreview();
  if (action === "connect-cloud") connectCloud();
  if (action === "push-cloud") pushToCloud();
  if (action === "export-cloud-package") exportCloudPackage();
  if (action === "export-design-table") exportDesignTable();
  if (action === "export-snapshot") exportSnapshot();
  if (action === "export-bottle-json") exportBottleActiveJson();
  if (action === "export-bottle-morph-csv") exportBottleMorphCsv();
  if (action === "reset-bottle-nearest") resetBottleToNearestSeed();
  if (action === "load-bottle-morph-step") {
    applyBottleMorphPercent(Number(target.dataset.pct), state._bottleMorph?.family || bottleFamilies()[0], { bumpRevision: true });
    persist("Morph step loaded");
  }
  if (action === "load-bottle-matrix" && target.dataset.variantId) {
    loadBottleVariant(target.dataset.variantId);
  }
  if (action === "reset-demo") resetDemo();
  if (action === "lookup-standards") lookupStandards();
  if (action === "search-patents") searchPatents();
  if (action === "download-sw-vars") downloadSolidWorksMacro();
  if (action === "simulate") runSimulation();
  if (action === "optimize") optimizeModel();
  if (action === "material") assessMaterial();
});

// ── bottle slider live input ──────────────────────────────────────────────────
document.addEventListener("input", event => {
  if (event.target.id === "promptInput") {
    state.prompt = event.target.value.trim();
    saveOnly();
    renderRequirements();
    return;
  }
  if (event.target.id === "requirementText") {
    state.requirementText = event.target.value.trim();
    saveOnly();
    return;
  }
  const paramSliderKey = event.target.dataset?.paramSlider;
  if (paramSliderKey) {
    const parameter = state.parameters.find(item => item.key === paramSliderKey);
    if (!parameter) return;
    const nextValue = parameter.unit === "count" ? Math.round(Number(event.target.value)) : Number(event.target.value);
    parameter.value = nextValue;
    parameter.source = "Slider";
    syncModelDerivedState("Slider updated CAD preview");
    const valueLabel = document.getElementById("pslv-" + paramSliderKey);
    if (valueLabel) valueLabel.textContent = formatValue(nextValue, parameter.unit);
    const tableInput = document.getElementById("param-" + paramSliderKey);
    if (tableInput) tableInput.value = nextValue;
    saveOnly();
    refreshPreviewTelemetry();
    requestAnimationFrame(() => mount3DViewer({ forceLocal: true }));
    return;
  }
  const bslKey = event.target.dataset?.bsl;
  if (bslKey) {
    const cfg = BOTTLE_SLIDER_CONFIG.find(c => c.key === bslKey);
    if (!cfg) return;
    let val = Number(event.target.value);
    if (cfg.integer) val = Math.round(val);
    setBottleParam(bslKey, val);
    syncModelDerivedState("Slider updated CAD preview");
    const lbl = document.getElementById("bslv-" + bslKey);
    if (lbl) lbl.textContent = fmtSliderVal(cfg, val);
    saveOnly();
    renderSpecs();
    refreshPreviewTelemetry();
    requestAnimationFrame(() => mount3DViewer({ forceLocal: true }));
    return;
  }
  if (event.target.id === "bslMorphPct") {
    const pct = Number(event.target.value);
    state._bottleMorph = state._bottleMorph || {};
    const fam = state._bottleMorph.family || bottleFamilies()[0];
    applyBottleMorphPercent(pct, fam);
    const pctLbl = document.getElementById("bslMorphPctLabel");
    if (pctLbl) pctLbl.textContent = `${pct}%`;
    const stripSlot = document.getElementById("bottleMorphStripSlot");
    if (stripSlot) stripSlot.innerHTML = renderBottleMorphStrip();
    // Sync all sliders to new interpolated values without re-render
    for (const cfg of BOTTLE_SLIDER_CONFIG) {
      const v = getBottleParam(cfg.key);
      if (v == null) continue;
      const clamped = Math.max(cfg.min, Math.min(cfg.max, v));
      const slEl = document.querySelector(`[data-bsl="${cfg.key}"]`);
      const lblEl = document.getElementById("bslv-" + cfg.key);
      if (slEl) slEl.value = clamped;
      if (lblEl) lblEl.textContent = fmtSliderVal(cfg, clamped);
    }
    saveOnly();
    renderSpecs();
    refreshPreviewTelemetry();
    requestAnimationFrame(() => mount3DViewer({ forceLocal: true }));
    return;
  }
  if (event.target.id === "bslStepCount") {
    const steps = Math.round(Number(event.target.value));
    state._bottleMorph = state._bottleMorph || { family: bottleFamilies()[0], pct: 0 };
    state._bottleMorph.steps = steps;
    const label = document.getElementById("bslStepCountLabel");
    if (label) label.textContent = steps;
    const stripSlot = document.getElementById("bottleMorphStripSlot");
    if (stripSlot) stripSlot.innerHTML = renderBottleMorphStrip();
    saveOnly();
  }
});

document.addEventListener("change", event => {
  if (event.target.id === "requirementFiles") handleRequirementUpload(event.target.files);
  if (event.target.id === "imageFiles") handleImageUpload(event.target.files);
  if (event.target.id === "ideaImageFiles") handleImageUpload(event.target.files);
  if (event.target.id === "tableFiles") handleTableUpload(event.target.files);
  if (event.target.id === "variantSelect" && event.target.value) {
    loadBottleVariant(event.target.value);
    event.target.value = "";
  }
  if (event.target.id === "bslMorphFam") {
    const fam = event.target.value;
    const steps = state._bottleMorph?.steps || 5;
    state._bottleMorph = { family: fam, pct: 0, steps };
    const seeds = bottleFamilySeeds(fam);
    if (seeds.length) loadBottleVariant(seeds[0].id);
    else persist();
  }
  if (event.target.classList.contains("standard-checkbox")) {
    const id = event.target.dataset.standardId;
    if (!id) return;
    state.standards = state.standards || { matched: [], selected: [] };
    if (!state.standards.matched?.length) state.standards.matched = deriveDesignIntent().standards;
    if (!state.standards.selected?.length) state.standards.selected = state.standards.matched.map(std => std.id);
    if (event.target.checked) {
      if (!state.standards.selected.includes(id)) state.standards.selected = [...state.standards.selected, id];
    } else {
      state.standards.selected = state.standards.selected.filter(sid => sid !== id);
    }
    persist();
  }
  if (["aiMode", "aiModel", "aiEndpoint", "templateSelect", "bridgeUrl", "cloudBrokerUrl", "cloudSpaceUrl", "cadServerUrl"].includes(event.target.id)) {
    syncDraftFromDom();
    persist();
  }
});

window.addEventListener("beforeunload", syncDraftFromDom);

render();
