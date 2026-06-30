const STORAGE_KEY = "solidworks-ai-cad-studio-v4";
const SESSION_AI_KEY = "solidworks-ai-openai-key";
const SESSION_CLAUDE_KEY = "solidworks-ai-claude-key";
const SESSION_GEMINI_KEY = "solidworks-ai-gemini-key";
const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_BRIDGE_URL = "";
const DEFAULT_AI_ENDPOINT = "";
const DEFAULT_CLOUD_SPACE_URL = "https://my.3dexperience.3ds.com/";
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
      status: "Optional",
      embedUrl: "",
      activeDocument: "new-design.SLDPRT",
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
    }
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
    agents: Array.isArray(saved.agents) && saved.agents.length ? saved.agents : defaults.agents,
    standards: {
      ...defaults.standards,
      ...(saved.standards || {}),
      matched: Array.isArray(saved.standards?.matched) ? saved.standards.matched : defaults.standards.matched,
      selected: Array.isArray(saved.standards?.selected) ? saved.standards.selected : defaults.standards.selected
    }
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

function buildStandardsConstraints() {
  const active = (state.standards?.matched || []).filter(s => (state.standards?.selected || []).includes(s.id));
  return active.flatMap(s => s.constraints || []).map(c => `- ${c.param}: ${c.rule}`);
}

function buildStandardsLabelText() {
  const active = (state.standards?.matched || []).filter(s => (state.standards?.selected || []).includes(s.id) && s.labelRequired);
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
  const claudeKey = document.getElementById("claudeKey");
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
  if (claudeKey && claudeKey.value.trim()) sessionStorage.setItem(SESSION_CLAUDE_KEY, claudeKey.value.trim());
  const geminiKey = document.getElementById("geminiKey");
  if (geminiKey && geminiKey.value.trim()) sessionStorage.setItem(SESSION_GEMINI_KEY, geminiKey.value.trim());
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

function generateModel() {
  syncDraftFromDom();
  const blueprint = buildModelBlueprint(state.prompt, state.requirementText, state.selectedTemplate);
  updateFromBlueprint(blueprint, "Requirements");
  state.ai.lastReply = `Generated ${blueprint.concept.familyLabel.toLowerCase()} model with ${blueprint.parameters.length} parameters.`;
  lookupStandards();
}

function lookupStandards() {
  const family = state.concept?.family || inferFamily(`${state.prompt} ${state.requirementText}`, state.selectedTemplate);
  const material = state.concept?.material || extractMaterial(`${state.prompt} ${state.requirementText}`, "");
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
  state.concept = {
    family: "bottle",
    familyLabel: library.label,
    title: `${variant.id} — ${variant.concept}`,
    material: "PLA + enzyme additive system",
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
    { key: "facetCount",    label: "Facet count",    unit: "count", value: variant.facetCount,  source: "Variant", swDimension: "D14@FACET_COUNT",  aliases: [] },
    { key: "facetDepth",    label: "Facet depth",    unit: "mm",    value: variant.facetDepth,  source: "Variant", swDimension: "D15@FACET_DEPTH",  aliases: [] },
    { key: "helixRidges",   label: "Helix ridges",   unit: "count", value: variant.helixCount,  source: "Variant", swDimension: "D16@HELIX_RIDGES", aliases: [] },
    { key: "helixDepth",    label: "Helix depth",    unit: "mm",    value: variant.helixDepth,  source: "Variant", swDimension: "D17@HELIX_DEPTH",  aliases: [] },
    { key: "helixTurns",    label: "Helix turns",    unit: "",      value: variant.helixTurns,  source: "Variant", swDimension: "D18@HELIX_TURNS",  aliases: [] }
  ];
  state.prompt = `Load STREAMS bottle variant ${variant.id}: ${variant.concept}`;
  state.requirementText = [
    `Project: STREAMS ${variant.id} — ${variant.concept}`,
    `Morph step: ${variant.morph}`,
    `Nominal fill volume: 500 mL`,
    `Overflow capacity target: 530 mL ±10 mL`,
    `Material: PLA + enzyme additive system; food-contact grade`,
    `Neck/closure: 28mm tamper-evident screw; PLA/CPLA cap; linerless plug`,
    `Required label/code pack: Statement of identity; net quantity; manufacturer/packer/distributor address; lot/date; RIC 7 PLA; compostability qualifier if certified`,
    `Compliance validation: Food-contact migration; seal/leak; top-load/drop; ASTM D6400 or EN 13432 for compostability claims`
  ].join("\n");
  state.revision += 1;
  state.bridge.activeDocument = `${variant.id}-${sanitizeFilename(variant.concept)}.SLDPRT`;
  state.designTable.rows = buildDesignTableRows();
  state.analysis.material = buildMaterialAssessment("PLA + enzyme additive system", state.parameters);
  state.analysis.simulation = null;
  state.analysis.optimization = null;
  lookupStandards();
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
  return typeof data === "string" ? parseJsonFromText(data) : data;
}

async function callGemini() {
  const key = sessionStorage.getItem(SESSION_GEMINI_KEY);
  if (!key) throw new Error("Add a Gemini API key. Get one free at aistudio.google.com.");
  const model = (state.ai.model || "").startsWith("gemini") ? state.ai.model : "gemini-2.0-flash";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: makeAiInstruction() }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(makeCurrentModelPayload(), null, 2) }] }],
        generationConfig: { maxOutputTokens: 1600 }
      })
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.error?.message || `Gemini request failed (${response.status})`;
    throw new Error(detail);
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return parseJsonFromText(text);
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
        reply: "Local parser generated a deterministic model. Select Claude or OpenAI in the AI source dropdown for generative reasoning.",
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

function downloadSolidWorksMacro() {
  const title = state.concept.title || "New design";
  const params = state.parameters.filter(p => p.unit !== "count");
  const countParams = state.parameters.filter(p => p.unit === "count");
  const ts = new Date().toISOString().slice(0, 19).replace("T", " ");

  const varLines = params.map(p => {
    const val = Number(p.value);
    const mm = p.unit === "mm" ? "mm" : "";
    return `    eqMgr.Add2 -1, "${'"'}${p.key}${'"'} = ${val}${mm}", True   '${p.label}`;
  }).join("\n");

  const countLines = countParams.map(p =>
    `    eqMgr.Add2 -1, "${'"'}${p.key}${'"'} = ${Number(p.value)}", True   '${p.label}`
  ).join("\n");

  const dimHints = state.parameters.map(p =>
    `'   ${p.swDimension || p.key} = ${p.value} ${p.unit}  (parameter: "${p.key}")`
  ).join("\n");

  const macro = `' ==========================================================
' SolidWorks AI CAD Studio — Auto-generated macro
' Project : ${title}
' Family  : ${state.concept.familyLabel || ""}
' Material: ${state.concept.material || ""}
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
            ${state.parameters.map(p => `If InStr(existing, "${'"'}${p.key}${'"'}") > 0 Then eqMgr.Delete i`).join("\n            ")}
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
              <option value="gemini" ${state.ai.mode === "gemini" ? "selected" : ""}>Gemini (free)</option>
              <option value="claude" ${state.ai.mode === "claude" ? "selected" : ""}>Claude (Anthropic)</option>
              <option value="openai" ${state.ai.mode === "openai" ? "selected" : ""}>OpenAI</option>
              <option value="bridge" ${state.ai.mode === "bridge" ? "selected" : ""}>AI endpoint</option>
              <option value="parser" ${state.ai.mode === "parser" ? "selected" : ""}>Local parser</option>
            </select>
          </div>
          <div>
            <label for="aiModel">Model</label>
            <input id="aiModel" value="${escapeHtml(state.ai.model || DEFAULT_MODEL)}" placeholder="${state.ai.mode === "gemini" ? "gemini-2.0-flash" : state.ai.mode === "claude" ? "claude-sonnet-4-6" : state.ai.mode === "openai" ? "gpt-4o" : "model-name"}">
          </div>
        </div>
        <div class="field-grid">
          ${state.ai.mode === "gemini" ? `
          <div>
            <label for="geminiKey">Gemini API key <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="font-size:11px;color:var(--accent)">Get free key ↗</a></label>
            <input id="geminiKey" type="password" placeholder="${sessionStorage.getItem(SESSION_GEMINI_KEY) ? "Key loaded for this tab" : "AIza..."}">
          </div>` : state.ai.mode === "claude" ? `
          <div>
            <label for="claudeKey">Anthropic API key</label>
            <input id="claudeKey" type="password" placeholder="${sessionStorage.getItem(SESSION_CLAUDE_KEY) ? "Key loaded for this tab" : "sk-ant-..."}">
          </div>` : state.ai.mode === "openai" ? `
          <div>
            <label for="aiKey">OpenAI API key</label>
            <input id="aiKey" type="password" placeholder="${keyPresent ? "Key loaded for this tab" : "sk-..."}">
          </div>` : ""}
          ${state.ai.mode === "bridge" ? `
          <div>
            <label for="aiEndpoint">AI endpoint URL</label>
            <input id="aiEndpoint" value="${escapeHtml(state.ai.endpoint)}" placeholder="https://your-server.example.com/api/copilot">
          </div>` : ""}
        </div>
        <div class="button-row">
          <button class="button primary" data-action="ask-ai" ${loadingAction === "ask-ai" ? "disabled" : ""}>
            ${loadingAction === "ask-ai" ? "Generating…" : "Generate with AI"}
          </button>
        </div>
        ${state.ai.lastReply ? `<div class="ai-output">${escapeHtml(state.ai.lastReply)}</div>` : ""}
      </div>
    </div>
  `;
}

function renderRequirements() {
  const matchedStandards = state.standards?.matched || [];
  const selectedStandards = state.standards?.selected || [];
  const activeConstraints = buildStandardsConstraints();
  const labelText = buildStandardsLabelText();

  document.getElementById("requirementsPanel").innerHTML = `
    <div class="panel-header">
      <div>
        <span class="eyebrow">Requirements intake</span>
        <h2>Brief, standards &amp; files</h2>
      </div>
      <div class="workflow-steps">
        <div class="workflow-step ${state.prompt ? "done" : ""}"><span class="step-num">1</span><span>Input</span></div>
        <div class="workflow-step ${matchedStandards.length ? "done" : ""}"><span class="step-num">2</span><span>Standards</span></div>
        <div class="workflow-step ${state.parameters.length ? "done" : ""}"><span class="step-num">3</span><span>Parameters</span></div>
        <div class="workflow-step ${state.bridge.status === "Synced" || state.cloud.status === "Synced" ? "done" : ""}"><span class="step-num">4</span><span>CAD</span></div>
      </div>
    </div>
    <div class="panel-body fill-panel">
      <div class="field-grid">

        <div class="field-row">
          <div>
            <label for="templateSelect">Template</label>
            <select id="templateSelect">
              <option value="auto" ${state.selectedTemplate === "auto" ? "selected" : ""}>Auto-detect</option>
              <option value="enclosure" ${state.selectedTemplate === "enclosure" ? "selected" : ""}>Enclosure</option>
              <option value="bottle" ${state.selectedTemplate === "bottle" ? "selected" : ""}>Bottle</option>
              <option value="bracket" ${state.selectedTemplate === "bracket" ? "selected" : ""}>Bracket</option>
              <option value="tray" ${state.selectedTemplate === "tray" ? "selected" : ""}>Tray</option>
              <option value="assembly" ${state.selectedTemplate === "assembly" ? "selected" : ""}>Assembly</option>
            </select>
          </div>
          ${(state.concept?.family === "bottle" || state.selectedTemplate === "bottle") ? `
          <div>
            <label for="variantSelect">Variant</label>
            <select id="variantSelect">
              <option value="">— Load variant —</option>
              ${BOTTLE_VARIANTS.map(v => `<option value="${v.id}">${v.id}: ${escapeHtml(v.concept)}</option>`).join("")}
            </select>
          </div>` : ""}
        </div>

        <div class="field-row">
          <div>
            <label for="imageFiles">Images</label>
            <input id="imageFiles" type="file" accept="image/*" multiple>
          </div>
          <div>
            <label for="tableFiles">Spreadsheet</label>
            <input id="tableFiles" type="file" accept=".csv,.tsv,.txt,.xlsx" multiple>
          </div>
          <div>
            <label for="requirementFiles">Brief files</label>
            <input id="requirementFiles" type="file" multiple>
          </div>
        </div>

        <div>
          <label for="requirementText">Requirements</label>
          <textarea id="requirementText" placeholder="Describe the part: dimensions, material, features, constraints…">${escapeHtml(state.requirementText)}</textarea>
        </div>

        <div class="button-row">
          <button class="button primary" data-action="generate-model">Generate</button>
          <button class="button secondary" data-action="ask-ai">Ask AI</button>
          <button class="button secondary" data-action="export-design-table">Export CSV</button>
          <button class="button ghost" data-action="reset-demo">Reset</button>
        </div>

        <div class="standards-section">
          <div class="standards-header">
            <label>Standards &amp; compliance</label>
            <button class="button ghost" data-action="lookup-standards">Auto-match</button>
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
          <label for="bridgeUrl">MacDevBridge URL <span style="font-size:11px;font-weight:400;color:var(--quiet)">(optional — run bridge/MacDevBridge/server.mjs locally)</span></label>
          <input id="bridgeUrl" value="${escapeHtml(state.bridge.url)}" placeholder="http://127.0.0.1:8787">
        </div>
        <button class="button secondary" data-action="connect-bridge" ${loadingAction === "connect-bridge" ? "disabled" : ""}>Connect</button>
        <button class="button primary" data-action="send-model" ${loadingAction === "send-model" ? "disabled" : ""} title="Downloads a .swb macro — run it in SolidWorks via Tools › Macros › Run">↓ SolidWorks macro</button>
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
            <div class="preview-stage" id="threeViewport"></div>
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
    const H  = getP(params, "height", 232);
    const R  = getP(params, "bodyDiameter", 58) / 2;
    const nR = getP(params, "neckDiameter", 28) / 2;
    const sH = getP(params, "shoulderHeight", 28);
    const nH = getP(params, "neckHeight", 25);
    const bH = 8;
    const bodyTop = H - sH - nH;
    const pts = [
      new THREE.Vector2(R * 0.35, 0),
      new THREE.Vector2(R, bH),
      new THREE.Vector2(R, bodyTop),
      new THREE.Vector2(nR * 1.35, H - nH - 4),
      new THREE.Vector2(nR, H - nH),
      new THREE.Vector2(nR, H)
    ];
    return new THREE.LatheGeometry(pts, 72);
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

function mount3DViewer() {
  const container = document.getElementById("threeViewport");
  if (!container) return;
  disposeThree();
  if (typeof THREE === "undefined") {
    container.innerHTML = `<p style="color:#6b8a7a;padding:24px;font-size:13px">Three.js not loaded — check network.</p>`;
    return;
  }

  const W = container.clientWidth  || 500;
  const H = container.clientHeight || 420;

  const scene    = new THREE.Scene();
  scene.background = new THREE.Color(0x1a2420);
  scene.fog = new THREE.Fog(0x1a2420, 600, 1200);

  const camera = new THREE.PerspectiveCamera(42, W / H, 0.5, 2000);
  camera.position.set(0, 140, 340);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // Lights
  scene.add(new THREE.AmbientLight(0xaaccbb, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(120, 220, 140);
  sun.castShadow = true;
  scene.add(sun);
  scene.add(Object.assign(new THREE.DirectionalLight(0x5599ff, 0.25), { position: { x: -100, y: 60, z: -120, set() {} } }));
  const fill = new THREE.DirectionalLight(0x5599ff, 0.25);
  fill.position.set(-100, 60, -120);
  scene.add(fill);

  // Ground grid
  const grid = new THREE.GridHelper(600, 24, 0x2d4038, 0x232e28);
  grid.position.y = 0;
  scene.add(grid);

  // Geometry
  const geom = build3DGeometry(state.concept.family, state.parameters);
  geom.computeBoundingBox();
  const box = geom.boundingBox;
  const midY = (box.max.y + box.min.y) / 2;
  const minY = box.min.y;

  const mat = new THREE.MeshStandardMaterial({
    color: 0x4a9e7c, roughness: 0.28, metalness: 0.12, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.position.y = -minY;
  scene.add(mesh);

  const edges = new THREE.EdgesGeometry(geom);
  const wire  = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x7dd4ac, transparent: true, opacity: 0.22 }));
  wire.position.y = -minY;
  scene.add(wire);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor  = 0.07;
  controls.target.set(0, (midY - minY) * 0.9, 0);
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

  _three = { renderer, animId, resizeObs };
}

// ─────────────────────────────────────────────────────────────────────────────

function render() {
  renderHeader();
  renderCopilot();
  renderRequirements();
  renderModel();
  renderSpecs();
  requestAnimationFrame(mount3DViewer);
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
  if (action === "lookup-standards") lookupStandards();
});

document.addEventListener("change", event => {
  if (event.target.id === "requirementFiles") handleRequirementUpload(event.target.files);
  if (event.target.id === "imageFiles") handleImageUpload(event.target.files);
  if (event.target.id === "tableFiles") handleTableUpload(event.target.files);
  if (event.target.id === "variantSelect" && event.target.value) {
    loadBottleVariant(event.target.value);
    event.target.value = "";
  }
  if (event.target.classList.contains("standard-checkbox")) {
    const id = event.target.dataset.standardId;
    if (!id) return;
    state.standards = state.standards || { matched: [], selected: [] };
    if (event.target.checked) {
      if (!state.standards.selected.includes(id)) state.standards.selected = [...state.standards.selected, id];
    } else {
      state.standards.selected = state.standards.selected.filter(sid => sid !== id);
    }
    persist();
  }
  if (["aiMode", "aiModel", "aiEndpoint", "templateSelect", "bridgeUrl", "cloudBrokerUrl", "cloudSpaceUrl"].includes(event.target.id)) {
    syncDraftFromDom();
    persist();
  }
});

window.addEventListener("beforeunload", syncDraftFromDom);

render();
