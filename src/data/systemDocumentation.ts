export const SYSTEM_DOCUMENTATION = {
  projectName: 'eRTMAC-NWIS | AI-Powered Nearby Wells Intelligence System',
  organization: 'Oil India Limited - Directorate of Drilling & Subsurface Engineering, Assam-Arakan Basin',
  division: 'Duliajan Central Well Operations & Geoscience Command',
  status: 'Production Release',
  overview: `eRTMAC-NWIS (Nearby Wells Intelligence System) acts as the autonomous institutional memory for Oil India Limited's drilling engineering division. By synthesizing decades of historical drilling reports (WCR, DDR, Mud Logs, Wellbore Lithology Logs) across thousands of wells in the Assam-Arakan Basin, NWIS provides real-time geospatial cross-well correlation, RAG-grounded decision support, predictive risk scoring (Mud Loss, Gas Kick, Stuck Pipe, Torque Spikes), and automated mitigation synthesis directly at the rig site and central control room.`,

  architectureMermaid: `graph TD
    subgraph ClientLayer ["Operator Interface (Industrial Control Center)"]
        UI["React 19 + Vite Dashboard (Palantir Industrial UI)"]
        MapEngine["Leaflet / GeoJSON Proximity Engine (360° Radius)"]
        CrossSection["3D Subsurface Stratigraphy Viewer"]
        AI_Copilot["Multi-Turn Drilling Intelligence Copilot"]
        SimStream["Real-time WITSML / Telemetry Simulator"]
    end

    subgraph APILayer ["Backend Intelligence Gateway"]
        Server["Express + Vite Backend Middleware /api"]
        AuthZ["OIL Active Directory / RBAC Layer"]
        Router["Query Dispatcher & Telemetry Streamer"]
    end

    subgraph AIRAGLayer ["Hybrid AI & Knowledge Layer"]
        Gemini38["Google Gemini 3.8 Flash (Reasoning & Synthesis)"]
        HybridEngine["Hybrid Retrieval (BM25 + Vector Cosine)"]
        CrossEncoder["Cross-Encoder Semantic Re-Ranker"]
        Guardrails["Anti-Hallucination & Evidence Verifier"]
        KG["Geomechanical Knowledge Graph"]
    end

    subgraph DataPersistence ["Enterprise Data Infrastructure"]
        SQLiteDB["Relational SQLite / Cloud SQL (Wells, Events, Parameters)"]
        ChromaStore["Vector ChromaDB (Chunk Embeddings 384-dim)"]
        DocStore["OCR Document Archive (PyMuPDF, Camelot Tables)"]
    end

    UI --> Server
    Server --> Router
    Router --> HybridEngine
    HybridEngine --> SQLiteDB
    HybridEngine --> ChromaStore
    HybridEngine --> CrossEncoder
    CrossEncoder --> Gemini38
    Gemini38 --> Guardrails
    Guardrails --> UI
    SimStream --> Server`,

  sqliteSchemaDDL: `-- eRTMAC-NWIS Enterprise SQLite Schema
-- Oil India Limited Drilling Operations Database

CREATE TABLE IF NOT EXISTS wells (
    well_id TEXT PRIMARY KEY,
    well_name TEXT NOT NULL UNIQUE,
    short_code TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    basin TEXT DEFAULT 'Assam-Arakan',
    field TEXT DEFAULT 'Duliajan',
    spud_date DATE,
    completion_date DATE,
    total_depth_m REAL NOT NULL,
    current_depth_m REAL,
    status TEXT CHECK(status IN ('Active', 'Drilling', 'Completed', 'Suspended', 'Workover', 'Shut-in')),
    well_type TEXT CHECK(well_type IN ('Exploration', 'Development', 'Delineation', 'Injection')),
    rig_assigned TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS formations (
    formation_id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    age_era TEXT,
    lithology_desc TEXT,
    depth_top_nominal_m REAL,
    depth_base_nominal_m REAL,
    pore_pressure_gradient_sg REAL,
    fracture_gradient_sg REAL,
    hazard_profile TEXT
);

CREATE TABLE IF NOT EXISTS reports (
    report_id TEXT PRIMARY KEY,
    well_id TEXT REFERENCES wells(well_id),
    report_type TEXT CHECK(report_type IN ('WCR', 'DDR', 'MUD_LOG', 'GEO_PROGNOSIS', 'CASING_CEMENT')),
    report_title TEXT NOT NULL,
    report_date DATE,
    total_pages INTEGER,
    file_path TEXT,
    ocr_status TEXT DEFAULT 'COMPLETED',
    ocr_confidence REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chunks (
    chunk_id TEXT PRIMARY KEY,
    report_id TEXT REFERENCES reports(report_id),
    well_id TEXT REFERENCES wells(well_id),
    page_number INTEGER NOT NULL,
    section_name TEXT,
    depth_start_m REAL,
    depth_end_m REAL,
    formation_name TEXT,
    content_text TEXT NOT NULL,
    embedding_id TEXT,
    bm25_tokens TEXT
);

CREATE TABLE IF NOT EXISTS historical_events (
    event_id TEXT PRIMARY KEY,
    well_id TEXT REFERENCES wells(well_id),
    event_type TEXT NOT NULL,
    depth_m REAL NOT NULL,
    formation TEXT NOT NULL,
    reservoir TEXT,
    severity TEXT CHECK(severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    root_cause TEXT NOT NULL,
    recommended_mitigation TEXT NOT NULL,
    action_taken TEXT,
    npt_hours REAL DEFAULT 0,
    cost_impact_lakhs REAL DEFAULT 0,
    mud_weight_sg REAL,
    ecd_sg REAL,
    torque_knm REAL,
    spp_psi REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS live_telemetry (
    reading_id INTEGER PRIMARY KEY AUTOINCREMENT,
    well_id TEXT REFERENCES wells(well_id),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    depth_m REAL NOT NULL,
    rop_mhr REAL,
    wob_tons REAL,
    rpm REAL,
    torque_knm REAL,
    spp_psi REAL,
    mud_flow_in_lpm REAL,
    mud_flow_out_lpm REAL,
    pit_volume_m3 REAL,
    mud_weight_in_sg REAL,
    mud_weight_out_sg REAL,
    gas_units REAL
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id TEXT PRIMARY KEY,
    well_id TEXT REFERENCES wells(well_id),
    severity TEXT CHECK(severity IN ('CRITICAL', 'HIGH', 'WARNING', 'INFO')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    trigger_depth_m REAL,
    formation TEXT,
    offset_well_reference TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Strategic Indexes for Sub-Second Retrieval
CREATE INDEX idx_wells_coords ON wells(latitude, longitude);
CREATE INDEX idx_events_formation_depth ON historical_events(formation, depth_m);
CREATE INDEX idx_chunks_well_depth ON chunks(well_id, depth_start_m, depth_end_m);
CREATE INDEX idx_telemetry_well_time ON live_telemetry(well_id, recorded_at DESC);`,

  dockerComposeYaml: `services:
  nwis-frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ertmac-nwis-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
    volumes:
      - nwis_data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 15s
      timeout: 5s
      retries: 3

  chroma-vector-db:
    image: chromadb/chroma:0.5.5
    container_name: ertmac-chromadb
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE

volumes:
  nwis_data:
  chroma_data:`,

  judgeFaqs: [
    {
      q: 'How does eRTMAC-NWIS prevent LLM hallucinations during critical drilling emergencies?',
      a: 'NWIS enforces a strict 4-tier Anti-Hallucination Guardrail: 1) Retrieval Grounding - No LLM inference is run in vacuum; answers are bounded strictly to retrieved and verified OCR report chunks. 2) Numeric Constraint Verifier - Depth, mud weights (SG), and fracture gradients are cross-checked against the lithology database. 3) Confidence Gate - If the hybrid BM25 + Vector similarity score falls below 65%, the system immediately returns an "INSUFFICIENT INFORMATION" verdict and advises wireline logging instead of guessing. 4) Source Attribution - Every single recommendation must provide a clickable citation with document ID, page number, and extracted text snippet.',
    },
    {
      q: 'Why is this superior to generic RAG or standard search tools?',
      a: 'Generic RAG lacks geomechanical domain awareness. NWIS understands cross-well spatial decay (nearby wells in the same structural fault block have higher predictive weight than distant wells even in the same formation), stratigraphy-depth correlation (accounting for formation dip and structural elevation), and narrow drilling margins (pore pressure vs fracture gradient). Furthermore, the OCR engine is fine-tuned to extract tabular drilling parameters (bit nozzles, mud rheology, casing seat) which typical vector embeddings compress into noise.',
    },
    {
      q: 'Can NWIS operate offline on remote rigs in Upper Assam with intermittent satellite internet?',
      a: 'Yes! NWIS has full offline edge capability. The core BM25 search, SQLite relational queries, geospatial distance calculations, and deterministic rule-based geomechanical safety algorithms run 100% locally on the rig workstation without requiring any external internet connectivity. When satellite uplink is active, Google Gemini 3.8 Flash is seamlessly activated for advanced natural-language reasoning and multi-turn drilling copilot queries.',
    },
    {
      q: 'How does the system calculate similarity between the active well and nearby wells?',
      a: 'The Cross-Well Correlation Engine uses a multi-factor weighted Euclidean & cosine metric: 35% Stratigraphic Formation & Depth equivalence, 25% Spatial proximity (distance decay function), 20% Lithological fluid pressure regime (pore pressure & fracture gradient match), 10% Wellbore trajectory/inclination, and 10% Mud weight & drilling parameter window.',
    }
  ]
};
