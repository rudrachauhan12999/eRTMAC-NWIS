export interface Well {
  id: string;
  name: string;
  shortCode: string;
  lat: number;
  lng: number;
  distanceKm: number;
  direction: string;
  angleDeg: number;
  depthM: number;
  targetDepthM: number;
  formation: string;
  reservoir: string;
  status: 'Active' | 'Drilling' | 'Completed' | 'Suspended' | 'Workover' | 'Shut-in';
  type: 'Exploration' | 'Development' | 'Delineation' | 'Injection';
  rigName: string;
  spudDate: string;
  incidentsCount: number;
  primaryRisk: 'High Loss' | 'Gas Kick' | 'Stuck Pipe' | 'Overpressure' | 'Stable';
  colorTag: string;
}

export interface FormationLayer {
  name: string;
  depthStartM: number;
  depthEndM: number;
  lithology: string;
  color: string;
  hazardSeverity: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  hazardDescription: string;
  porePressureSG: number;
  fracGradientSG: number;
  recommendedMudWeightSG: number;
}

export interface HistoricalIncident {
  id: string;
  wellId: string;
  wellName: string;
  incidentType: 'Mud Loss' | 'Gas Kick' | 'Stuck Pipe' | 'Torque Spike' | 'Casing Problem' | 'Packoff' | 'Fishing' | 'NPT Event';
  depthM: number;
  formation: string;
  reservoir: string;
  date: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  rootCause: string;
  recommendedMitigation: string;
  actionTaken: string;
  nptHours: number;
  costImpactLakhs: number;
  similarityScore: number;
  drillingParams: {
    mudWeightSG: number;
    ecdSG: number;
    rpm: number;
    torqueKNm: number;
    sppPsi: number;
    wobTons: number;
    flowRateLpm: number;
  };
  sourceReport: {
    reportId: string;
    reportType: 'WCR (Well Completion Report)' | 'DDR (Daily Drilling Report)' | 'Mud Logging Master' | 'Geological Prognosis';
    title: string;
    date: string;
    page: number;
    section: string;
    ocrConfidence: number;
    excerpt: string;
    tableData?: { [key: string]: string | number }[];
  };
  // Added for real backend integration (Historical Events round): every
  // record the backend returns carries provenance so the UI can badge
  // real vs. labeled-demo evidence honestly (docs/DATA_SOURCES.md).
  // Optional so the 12 literal HISTORICAL_INCIDENTS entries below (still
  // used as demo fixtures/types elsewhere) don't need updating.
  sourceType?: 'public_document' | 'government_data' | 'geospatial_data' | 'derived' | 'synthetic_demo';
}

export interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  recommendation: string;
  depthM: number;
  formation: string;
  wellRef: string;
  timestamp: string;
  acknowledged: boolean;
  triggerCondition: string;
  mitigationSteps: string[];
  // Added for real backend integration (Alerts Intelligence round): a
  // backend-generated alert populates these; the 5 originally-seeded demo
  // alerts predate them, so they're optional rather than backfilled with
  // invented values.
  wellId?: string;
  type?: string;
  status?: 'active' | 'acknowledged' | 'resolved';
  signals?: string[];
  evidence?: Array<{
    type: 'historical_event' | 'document';
    sourceType: 'public_document' | 'government_data' | 'geospatial_data' | 'derived' | 'synthetic_demo';
    eventId?: string;
    wellId?: string;
    wellName?: string;
    depthM?: number;
    eventType?: string;
    matchedOn?: string[];
    documentId?: string;
    documentName?: string;
    page?: number;
    excerpt?: string;
  }>;
  sourceTypes?: string[];
  isSimulation?: boolean;
}

export interface TelemetryReading {
  timestamp: string;
  depthM: number;
  ropMhr: number;
  wobTons: number;
  rpm: number;
  torqueKNm: number;
  sppPsi: number;
  mudFlowInLpm: number;
  mudFlowOutLpm: number;
  pitVolumeM3: number;
  gasUnits: number;
  mudWeightInSG: number;
  mudWeightOutSG: number;
}

// Active Well definition matching the UI layout (NWIS-Active-01 in center)
export const ACTIVE_WELL: Well = {
  id: 'well-active-01',
  name: 'NWIS-Active-01',
  shortCode: 'ACT-01',
  lat: 27.3389,
  lng: 95.3195,
  distanceKm: 0.0,
  direction: 'Center',
  angleDeg: 0,
  depthM: 3500,
  targetDepthM: 4850,
  formation: 'Barail Coal-Shale & Sandstone',
  reservoir: 'Barail Main Pay',
  status: 'Drilling',
  type: 'Development',
  rigName: 'OIL Rig #E-2000-VI (Duliajan Deep)',
  spudDate: '2026-07-12',
  incidentsCount: 3,
  primaryRisk: 'High Loss',
  colorTag: '#f97316',
};

// 22 realistic Nearby / Offset Wells in the Upper Assam Basin (Duliajan - Moran - Nahorkatiya - Digboi belt)
export const NEARBY_WELLS: Well[] = [
  ACTIVE_WELL,
  {
    id: 'well-calire-02',
    name: 'NWIS-Calire-02',
    shortCode: 'CAL-02',
    lat: 27.3512,
    lng: 95.3089,
    distanceKm: 1.4,
    direction: 'NW',
    angleDeg: 315,
    depthM: 3620,
    targetDepthM: 3950,
    formation: 'Barail Sand-4',
    reservoir: 'Barail Main',
    status: 'Completed',
    type: 'Development',
    rigName: 'OIL Rig #M-1400',
    spudDate: '2024-03-10',
    incidentsCount: 4,
    primaryRisk: 'High Loss',
    colorTag: '#eab308',
  },
  {
    id: 'well-active-02-north',
    name: 'NWIS-Active-02',
    shortCode: 'ACT-02N',
    lat: 27.3621,
    lng: 95.3210,
    distanceKm: 2.1,
    direction: 'N',
    angleDeg: 5,
    depthM: 4100,
    targetDepthM: 4200,
    formation: 'Barail Coal-Shale',
    reservoir: 'Barail 5th Sand',
    status: 'Active',
    type: 'Development',
    rigName: 'OIL Rig #E-1400-II',
    spudDate: '2023-11-04',
    incidentsCount: 6,
    primaryRisk: 'Gas Kick',
    colorTag: '#22c55e',
  },
  {
    id: 'well-active-02-ne',
    name: 'NWIS-Active-02B',
    shortCode: 'ACT-02NE',
    lat: 27.3540,
    lng: 95.3380,
    distanceKm: 2.3,
    direction: 'NE',
    angleDeg: 48,
    depthM: 3820,
    targetDepthM: 4000,
    formation: 'Barail Arenaceous',
    reservoir: 'Barail Pay',
    status: 'Shut-in',
    type: 'Exploration',
    rigName: 'OIL Rig #F-2000',
    spudDate: '2023-05-18',
    incidentsCount: 5,
    primaryRisk: 'Stuck Pipe',
    colorTag: '#f97316',
  },
  {
    id: 'well-active-02-east',
    name: 'NWIS-Active-02C',
    shortCode: 'ACT-02E',
    lat: 27.3401,
    lng: 95.3485,
    distanceKm: 2.9,
    direction: 'E',
    angleDeg: 88,
    depthM: 3950,
    targetDepthM: 4300,
    formation: 'Barail Lower',
    reservoir: 'Barail Main',
    status: 'Completed',
    type: 'Development',
    rigName: 'OIL Rig #M-1200',
    spudDate: '2024-01-22',
    incidentsCount: 3,
    primaryRisk: 'High Loss',
    colorTag: '#ef4444',
  },
  {
    id: 'well-colive-04',
    name: 'NWIS-Colive-04',
    shortCode: 'COL-04',
    lat: 27.3245,
    lng: 95.3340,
    distanceKm: 1.9,
    direction: 'SE',
    angleDeg: 132,
    depthM: 3740,
    targetDepthM: 4150,
    formation: 'Barail Main Pay',
    reservoir: 'Barail Main',
    status: 'Workover',
    type: 'Development',
    rigName: 'OIL Rig #W-750',
    spudDate: '2024-08-01',
    incidentsCount: 7,
    primaryRisk: 'Gas Kick',
    colorTag: '#eab308',
  },
  {
    id: 'well-colov-01',
    name: 'NWIS-Colov-01',
    shortCode: 'CLV-01',
    lat: 27.3170,
    lng: 95.3120,
    distanceKm: 2.5,
    direction: 'SW',
    angleDeg: 200,
    depthM: 2750,
    targetDepthM: 3100,
    formation: 'Tipam Sandstone',
    reservoir: 'Tipam Upper',
    status: 'Active',
    type: 'Development',
    rigName: 'OIL Rig #E-900',
    spudDate: '2025-02-14',
    incidentsCount: 2,
    primaryRisk: 'Stable',
    colorTag: '#06b6d4',
  },
  {
    id: 'well-colve-02',
    name: 'NWIS-Colve-02',
    shortCode: 'CLV-02',
    lat: 27.3320,
    lng: 95.2910,
    distanceKm: 2.8,
    direction: 'W',
    angleDeg: 260,
    depthM: 3890,
    targetDepthM: 4200,
    formation: 'Barail Sand-4',
    reservoir: 'Barail 4th Pay',
    status: 'Suspended',
    type: 'Exploration',
    rigName: 'OIL Rig #E-2000-I',
    spudDate: '2023-08-09',
    incidentsCount: 5,
    primaryRisk: 'Stuck Pipe',
    colorTag: '#a855f7',
  },
  // Selt-OW series matching the screenshot table
  {
    id: 'well-selt-ow-01',
    name: 'Selt-OW-01',
    shortCode: 'SOW-01',
    lat: 27.3460,
    lng: 95.3280,
    distanceKm: 1.1,
    direction: 'NNE',
    angleDeg: 35,
    depthM: 200,
    targetDepthM: 3750,
    formation: 'Dhekiajuli Clay',
    reservoir: 'Surface Spud',
    status: 'Completed',
    type: 'Development',
    rigName: 'OIL Rig #E-1400',
    spudDate: '2024-05-12',
    incidentsCount: 2,
    primaryRisk: 'Stable',
    colorTag: '#64748b',
  },
  {
    id: 'well-selt-ow-02',
    name: 'Selt-OW-02',
    shortCode: 'SOW-02',
    lat: 27.3485,
    lng: 95.3120,
    distanceKm: 1.3,
    direction: 'NW',
    angleDeg: 320,
    depthM: 100,
    targetDepthM: 3800,
    formation: 'Alluvium Gravels',
    reservoir: 'Surface Casing',
    status: 'Completed',
    type: 'Delineation',
    rigName: 'OIL Rig #E-1400',
    spudDate: '2024-06-20',
    incidentsCount: 3,
    primaryRisk: 'Stuck Pipe',
    colorTag: '#64748b',
  },
  {
    id: 'well-selt-ow-03',
    name: 'Selt-OW-03',
    shortCode: 'SOW-03',
    lat: 27.3290,
    lng: 95.3050,
    distanceKm: 1.7,
    direction: 'WSW',
    angleDeg: 240,
    depthM: 200,
    targetDepthM: 3900,
    formation: 'Dhekiajuli Sand',
    reservoir: 'Surface Section',
    status: 'Completed',
    type: 'Development',
    rigName: 'OIL Rig #E-2000',
    spudDate: '2024-07-15',
    incidentsCount: 2,
    primaryRisk: 'Stuck Pipe',
    colorTag: '#64748b',
  },
  {
    id: 'well-selt-ow-04',
    name: 'Selt-OW-04',
    shortCode: 'SOW-04',
    lat: 27.3260,
    lng: 95.3390,
    distanceKm: 2.2,
    direction: 'SE',
    angleDeg: 125,
    depthM: 250,
    targetDepthM: 4050,
    formation: 'Dhekiajuli Claystone',
    reservoir: 'Surface Section',
    status: 'Completed',
    type: 'Exploration',
    rigName: 'OIL Rig #M-1400',
    spudDate: '2024-09-02',
    incidentsCount: 4,
    primaryRisk: 'Stuck Pipe',
    colorTag: '#64748b',
  },
  {
    id: 'well-selt-ow-05',
    name: 'Selt-OW-05',
    shortCode: 'SOW-05',
    lat: 27.3580,
    lng: 95.3260,
    distanceKm: 2.1,
    direction: 'N',
    angleDeg: 12,
    depthM: 250,
    targetDepthM: 4100,
    formation: 'Dhekiajuli Lower',
    reservoir: 'Surface Section',
    status: 'Completed',
    type: 'Development',
    rigName: 'OIL Rig #E-900',
    spudDate: '2024-10-18',
    incidentsCount: 2,
    primaryRisk: 'Stuck Pipe',
    colorTag: '#64748b',
  },
  {
    id: 'well-selt-ow-06',
    name: 'Selt-OW-06',
    shortCode: 'SOW-06',
    lat: 27.3420,
    lng: 95.3340,
    distanceKm: 1.5,
    direction: 'ENE',
    angleDeg: 65,
    depthM: 150,
    targetDepthM: 3600,
    formation: 'Alluvium Boulder Bed',
    reservoir: 'Conductor Shoe',
    status: 'Completed',
    type: 'Development',
    rigName: 'OIL Rig #E-1400',
    spudDate: '2024-11-25',
    incidentsCount: 3,
    primaryRisk: 'Stuck Pipe',
    colorTag: '#64748b',
  },
  // Additional regional Oil India wells
  {
    id: 'well-oil-nhk-421',
    name: 'OIL-NHK-421',
    shortCode: 'NHK-421',
    lat: 27.3100,
    lng: 95.3500,
    distanceKm: 4.3,
    direction: 'SE',
    angleDeg: 145,
    depthM: 4320,
    targetDepthM: 4500,
    formation: 'Kopili Shale',
    reservoir: 'Nahorkatiya Deeper Pay',
    status: 'Active',
    type: 'Development',
    rigName: 'OIL Rig #E-2000-IV',
    spudDate: '2022-09-15',
    incidentsCount: 8,
    primaryRisk: 'Overpressure',
    colorTag: '#ef4444',
  },
  {
    id: 'well-oil-mor-188',
    name: 'OIL-MOR-188',
    shortCode: 'MOR-188',
    lat: 27.2890,
    lng: 95.2750,
    distanceKm: 6.8,
    direction: 'SW',
    angleDeg: 220,
    depthM: 3950,
    targetDepthM: 4100,
    formation: 'Barail Sandstone',
    reservoir: 'Moran Main Sand',
    status: 'Active',
    type: 'Development',
    rigName: 'OIL Rig #E-1400-I',
    spudDate: '2021-04-19',
    incidentsCount: 6,
    primaryRisk: 'High Loss',
    colorTag: '#f97316',
  },
  {
    id: 'well-oil-bgj-07',
    name: 'OIL-BGJ-07',
    shortCode: 'BGJ-07',
    lat: 27.5800,
    lng: 95.3850,
    distanceKm: 18.2,
    direction: 'NNE',
    angleDeg: 15,
    depthM: 3850,
    targetDepthM: 4000,
    formation: 'Barail HPHT Gas',
    reservoir: 'Baghjan Gas Sands',
    status: 'Shut-in',
    type: 'Exploration',
    rigName: 'OIL Rig #E-2000-V',
    spudDate: '2020-03-01',
    incidentsCount: 9,
    primaryRisk: 'Gas Kick',
    colorTag: '#dc2626',
  },
  {
    id: 'well-oil-kus-14',
    name: 'OIL-KUS-14',
    shortCode: 'KUS-14',
    lat: 27.3820,
    lng: 95.3780,
    distanceKm: 7.2,
    direction: 'NE',
    angleDeg: 55,
    depthM: 4210,
    targetDepthM: 4350,
    formation: 'Barail / Kopili Transition',
    reservoir: 'Kusijan South Pay',
    status: 'Completed',
    type: 'Development',
    rigName: 'OIL Rig #M-1200',
    spudDate: '2023-01-11',
    incidentsCount: 4,
    primaryRisk: 'High Loss',
    colorTag: '#eab308',
  }
];

// Geological stratigraphy in the Upper Assam Shelf (Duliajan/Nahorkatiya/Moran)
export const STRATIGRAPHIC_FORMATIONS: FormationLayer[] = [
  {
    name: 'Alluvium & Dhekiajuli',
    depthStartM: 0,
    depthEndM: 800,
    lithology: 'Unconsolidated sands, gravels, pebbles, soft clays',
    color: '#d4a373',
    hazardSeverity: 'low',
    hazardDescription: 'Surface hole boulder beds causing bit bouncing & hole enlargement.',
    porePressureSG: 1.03,
    fracGradientSG: 1.55,
    recommendedMudWeightSG: 1.06,
  },
  {
    name: 'Girujan Clay Formation',
    depthStartM: 800,
    depthEndM: 2100,
    lithology: 'Variegated clays, soft silty mudstones, mottled claystone',
    color: '#9381ff',
    hazardSeverity: 'moderate',
    hazardDescription: 'Highly reactive smectite clays causing swelling, bit balling, and tight hole during trips.',
    porePressureSG: 1.06,
    fracGradientSG: 1.62,
    recommendedMudWeightSG: 1.12,
  },
  {
    name: 'Tipam Sandstone Formation',
    depthStartM: 2100,
    depthEndM: 3050,
    lithology: 'Coarse to medium grained permeable sandstone with minor shale intercalations',
    color: '#f4a261',
    hazardSeverity: 'moderate',
    hazardDescription: 'High permeability thief zones prone to differential sticking when overbalanced (>0.15 SG).',
    porePressureSG: 1.08,
    fracGradientSG: 1.58,
    recommendedMudWeightSG: 1.15,
  },
  {
    name: 'Surma Group (Transition)',
    depthStartM: 3050,
    depthEndM: 3350,
    lithology: 'Interbedded hard calcareous sandstones, siltstones, dark shales',
    color: '#e76f51',
    hazardSeverity: 'high',
    hazardDescription: 'Microfractured hard stringers causing rapid torque fluctuations and ROP drops.',
    porePressureSG: 1.14,
    fracGradientSG: 1.50,
    recommendedMudWeightSG: 1.20,
  },
  {
    name: 'Barail Coal-Shale & Sandstone',
    depthStartM: 3350,
    depthEndM: 4200,
    lithology: 'Sub-bituminous coal seams, carbonaceous shales, tight fine sandstones',
    color: '#e63946', // Highlighted hazard zone in UI
    hazardSeverity: 'critical',
    hazardDescription: 'CRITICAL HAZARD ZONE: Sub-hydrostatic depleted sands adjacent to overpressured coal beds. Narrow drilling margin (0.05 SG). Prone to massive mud loss followed by sudden gas influx!',
    porePressureSG: 1.28,
    fracGradientSG: 1.34,
    recommendedMudWeightSG: 1.24,
  },
  {
    name: 'Kopili Shale Formation',
    depthStartM: 4200,
    depthEndM: 4800,
    lithology: 'Dark splintery fissile shale with calcareous marl bands',
    color: '#457b9d',
    hazardSeverity: 'high',
    hazardDescription: 'Abnormally high pore pressure sloughing shale prone to packoff, tight hole, and pipe sticking.',
    porePressureSG: 1.38,
    fracGradientSG: 1.72,
    recommendedMudWeightSG: 1.42,
  },
  {
    name: 'Sylhet Limestone (Eocene)',
    depthStartM: 4800,
    depthEndM: 5400,
    lithology: 'Fossiliferous massive crystalline limestone, dolomitic dolomite',
    color: '#1d3557',
    hazardSeverity: 'moderate',
    hazardDescription: 'Cavernous vugular porosity prone to total lost circulation (dry drilling risks).',
    porePressureSG: 1.22,
    fracGradientSG: 1.85,
    recommendedMudWeightSG: 1.28,
  },
  {
    name: 'Basal Sandstone & Basement',
    depthStartM: 5400,
    depthEndM: 5800,
    lithology: 'Arkosic gritty quartzite & granitic metamorphic basement complex',
    color: '#2b2d42',
    hazardSeverity: 'low',
    hazardDescription: 'Abrasive hard rock causing severe PDC cutter wear and high vibrations.',
    porePressureSG: 1.10,
    fracGradientSG: 2.10,
    recommendedMudWeightSG: 1.25,
  }
];

// Historical drilling incidents database (300+ incidents indexed, 24 highlighted benchmark events with complete RAG reports)
export const HISTORICAL_INCIDENTS: HistoricalIncident[] = [
  {
    id: 'inc-001',
    wellId: 'well-calire-02',
    wellName: 'NWIS-Calire-02',
    incidentType: 'Mud Loss',
    depthM: 3480,
    formation: 'Barail Coal-Shale',
    reservoir: 'Barail Main Pay',
    date: '2024-04-18',
    severity: 'CRITICAL',
    summary: 'Sudden total loss of circulation (48 m³/hr) while drilling 8-1/2" section at 3,480m.',
    rootCause: 'Drilled into induced fractures in sub-hydrostatic Barail sandstone with excessive ECD (1.29 SG vs 1.22 SG fracture gradient).',
    recommendedMitigation: 'Immediately reduce flow rate to 1,200 LPM, spot 45 bbl heavy LCM pill (coarse nut plug 25 ppb + calcium carbonate 15 ppb), decrease active mud weight to 1.21 SG.',
    actionTaken: 'Pumped 50 bbl LCM pill, hesitated for 4 hours, restored circulation at 75% flow rate. Cased off with 7" liner at 3,510m.',
    nptHours: 54,
    costImpactLakhs: 72.4,
    similarityScore: 98,
    drillingParams: {
      mudWeightSG: 1.26,
      ecdSG: 1.31,
      rpm: 120,
      torqueKNm: 18.5,
      sppPsi: 2850,
      wobTons: 14,
      flowRateLpm: 2100,
    },
    sourceReport: {
      reportId: 'OIL-WCR-CAL-02-SEC4',
      reportType: 'WCR (Well Completion Report)',
      title: 'Well Completion Report: NWIS-Calire-02 (Duliajan Field)',
      date: '2024-05-10',
      page: 47,
      section: 'Section 4.3: Lost Circulation Incident at 3,480m MD',
      ocrConfidence: 0.96,
      excerpt: 'At 14:30 hrs while drilling ahead in Barail Coal-Shale at 3,480m, active pit volume showed rapid depletion (-48 m3/hr). Flow out sensor dropped to 0%. SPP dropped from 2,850 psi to 1,400 psi indicating loss of hydrostatic head.',
      tableData: [
        { Parameter: 'Mud Density In', Value: '1.26 SG', Unit: 'g/cm³' },
        { Parameter: 'Pit Volume Loss', Value: '38.5', Unit: 'm³' },
        { Parameter: 'LCM Pill Density', Value: '1.30', Unit: 'SG' },
        { Parameter: 'Total NPT Incurred', Value: '54', Unit: 'Hours' },
      ],
    },
  },
  {
    id: 'inc-002',
    wellId: 'well-colive-04',
    wellName: 'NWIS-Colive-04',
    incidentType: 'Gas Kick',
    depthM: 3495,
    formation: 'Barail Main Pay',
    reservoir: 'Barail Main Pay',
    date: '2024-08-22',
    severity: 'CRITICAL',
    summary: 'Severe 18 bbl gas influx during connection at 3,495m. Shut-in drill pipe pressure (SIDPP) 450 psi, SICP 620 psi.',
    rootCause: 'Swabbing during pipe connection combined with underbalanced mud weight (1.18 SG) against 1.27 SG Barail gas sandstone pore pressure.',
    recommendedMitigation: 'Shut in well immediately on Annular BOP, calculate Kill Mud Weight (1.26 SG), circulate kick out using Wait & Weight method with choke manifold monitoring.',
    actionTaken: 'Well shut in, killed using 1.26 SG potassium-chloride polymer mud, displaced hole completely before resuming drilling.',
    nptHours: 72,
    costImpactLakhs: 98.0,
    similarityScore: 96,
    drillingParams: {
      mudWeightSG: 1.18,
      ecdSG: 1.22,
      rpm: 95,
      torqueKNm: 14.2,
      sppPsi: 2400,
      wobTons: 10,
      flowRateLpm: 1800,
    },
    sourceReport: {
      reportId: 'OIL-DDR-COL04-DAY32',
      reportType: 'DDR (Daily Drilling Report)',
      title: 'Daily Drilling Report #32: NWIS-Colive-04',
      date: '2024-08-23',
      page: 3,
      section: 'Well Control Log: Connection Gas Influx at 3,495m',
      ocrConfidence: 0.98,
      excerpt: 'Flow check positive after breaking joint at 3,495m. Well flowed at 6 bbl/min. Annular preventer closed in 28 seconds. SIDPP: 450 psi, SICP: 620 psi. Pit gain: 18.2 bbl.',
      tableData: [
        { Parameter: 'Initial SIDPP', Value: '450', Unit: 'psi' },
        { Parameter: 'Initial SICP', Value: '620', Unit: 'psi' },
        { Parameter: 'Kill Mud Weight', Value: '1.26', Unit: 'SG' },
        { Parameter: 'Strokes to Kill', Value: '4,850', Unit: 'strokes' },
      ],
    },
  },
  {
    id: 'inc-003',
    wellId: 'well-colve-02',
    wellName: 'NWIS-Colve-02',
    incidentType: 'Stuck Pipe',
    depthM: 3410,
    formation: 'Barail Sand-4',
    reservoir: 'Barail 4th Pay',
    date: '2023-09-14',
    severity: 'HIGH',
    summary: 'Differential pipe sticking across depleted Barail sandstone after 25 min stationary surveying.',
    rootCause: 'Drillstring left stationary against permeable depleted sand with 0.16 SG overbalance; thick filter cake adhered to drill collars.',
    recommendedMitigation: 'Spot 60 bbl diesel/asphaltic freeing pill with surfactant across stuck interval, jar downward with max allowable impact (180 klbs), maintain low pump rate.',
    actionTaken: 'Spotted organic pipe-freeing agent, worked string for 16 hours, successfully freed drill collars, pulled out of hole to change BHA stabilizers.',
    nptHours: 42,
    costImpactLakhs: 55.0,
    similarityScore: 94,
    drillingParams: {
      mudWeightSG: 1.25,
      ecdSG: 1.28,
      rpm: 0,
      torqueKNm: 32.0,
      sppPsi: 1100,
      wobTons: 0,
      flowRateLpm: 600,
    },
    sourceReport: {
      reportId: 'OIL-WCR-CLV-02-P28',
      reportType: 'WCR (Well Completion Report)',
      title: 'Geotechnical Drillstring Incident Report: NWIS-Colve-02',
      date: '2023-10-01',
      page: 28,
      section: 'Section 6.1: Differential Sticking Mechanics & Liberation',
      ocrConfidence: 0.94,
      excerpt: 'Following MWD survey at 3,410m, rotation could not be established. Overpull peaked at 180,000 lbs with zero string rotation. Pump pressure 1,100 psi with full circulation confirming differential sticking rather than mechanical packoff.',
    },
  },
  {
    id: 'inc-004',
    wellId: 'well-active-02-north',
    wellName: 'NWIS-Active-02',
    incidentType: 'Torque Spike',
    depthM: 3520,
    formation: 'Barail Coal-Shale',
    reservoir: 'Barail 5th Sand',
    date: '2023-12-05',
    severity: 'HIGH',
    summary: 'Erratic torque fluctuations (peaking to 29.5 kNm) and stick-slip vibrations at 3,520m.',
    rootCause: 'Micro-fractured coal bed sloughing causing ledge development and bit jamming in gauge hole.',
    recommendedMitigation: 'Reduce RPM from 130 to 70, pump 30 bbl high-viscosity sweep pill, ream section slowly with back-reaming BHA, add 3% liquid lubricant to mud system.',
    actionTaken: 'Circulated sweeps, back-reamed 30m interval twice, torque normalized to 11.5 kNm.',
    nptHours: 18,
    costImpactLakhs: 22.0,
    similarityScore: 92,
    drillingParams: {
      mudWeightSG: 1.22,
      ecdSG: 1.27,
      rpm: 130,
      torqueKNm: 29.5,
      sppPsi: 2700,
      wobTons: 16,
      flowRateLpm: 2050,
    },
    sourceReport: {
      reportId: 'OIL-MLG-ACT02-LOG',
      reportType: 'Mud Logging Master',
      title: 'Mud Logging Real-Time Parameter Analysis: NWIS-Active-02',
      date: '2023-12-06',
      page: 15,
      section: 'Log Interval: 3,500m - 3,550m MD',
      ocrConfidence: 0.97,
      excerpt: 'Torque sensor recorded periodic stick-slip cycles. Coal cavings observed at shaker screens measuring 2-4 inches with blocky geometry indicative of mechanical stress failure.',
    },
  },
  // Selt-OW rows exactly matching the screenshot table
  {
    id: 'inc-selt-02',
    wellId: 'well-selt-ow-02',
    wellName: 'Selt-OW-02',
    incidentType: 'Stuck Pipe',
    depthM: 100,
    formation: 'Alluvium Gravels',
    reservoir: 'Surface Spud',
    date: '2024-06-22',
    severity: 'MEDIUM',
    summary: 'Historical Stuck Pipe Incidents - Boulder bed keyseating during 17-1/2" hole section.',
    rootCause: 'Unconsolidated river pebble gravels collapsing around drill collars at 100m spud depth.',
    recommendedMitigation: 'Pump high gel bentonite pill, back-ream slowly with minimal pull, ensure annular velocity > 150 ft/min.',
    actionTaken: 'Pumped viscous pill, worked string loose, cased with 13-3/8" conductor casing.',
    nptHours: 12,
    costImpactLakhs: 9.5,
    similarityScore: 88,
    drillingParams: {
      mudWeightSG: 1.05,
      ecdSG: 1.08,
      rpm: 60,
      torqueKNm: 19.0,
      sppPsi: 950,
      wobTons: 6,
      flowRateLpm: 2400,
    },
    sourceReport: {
      reportId: 'OIL-DDR-SOW02-SPUD',
      reportType: 'DDR (Daily Drilling Report)',
      title: 'Daily Drilling Report: Selt-OW-02 Conductor Section',
      date: '2024-06-23',
      page: 2,
      section: 'Shallow Hole Dynamics',
      ocrConfidence: 0.95,
      excerpt: 'Pebble bed collapsed into borehole during trip out for bit change at 100m. String freed after pumping 20 bbl viscous guar gum pill.',
    },
  },
  {
    id: 'inc-selt-03',
    wellId: 'well-selt-ow-03',
    wellName: 'Selt-OW-03',
    incidentType: 'Stuck Pipe',
    depthM: 200,
    formation: 'Dhekiajuli Sand',
    reservoir: 'Surface Casing',
    date: '2024-07-18',
    severity: 'MEDIUM',
    summary: 'Historical Stuck Pipe Incidents - Mechanical bridging in unconsolidated sand.',
    rootCause: 'Inadequate mud yield point allowing sand cuttings to bed around BHA when pumps were stopped.',
    recommendedMitigation: 'Maintain Yield Point > 18 lb/100ft², circulate hole clean before connections, rotate string continuously.',
    actionTaken: 'Circulated hole for 3 cycles, pulled pipe with 40,000 lbs overpull, cleared bridge.',
    nptHours: 8,
    costImpactLakhs: 6.2,
    similarityScore: 86,
    drillingParams: {
      mudWeightSG: 1.06,
      ecdSG: 1.09,
      rpm: 70,
      torqueKNm: 16.5,
      sppPsi: 1100,
      wobTons: 8,
      flowRateLpm: 2200,
    },
    sourceReport: {
      reportId: 'OIL-WCR-SOW03-SEC2',
      reportType: 'WCR (Well Completion Report)',
      title: 'Well Completion Report: Selt-OW-03 Surface Section',
      date: '2024-08-05',
      page: 12,
      section: 'Section 2.1: Surface Casing Setting',
      ocrConfidence: 0.93,
      excerpt: 'Bridging encountered at 200m depth while pulling out. Mud rheology adjusted with XC polymer to enhance cuttings carrying capacity.',
    },
  },
  {
    id: 'inc-selt-04',
    wellId: 'well-selt-ow-04',
    wellName: 'Selt-OW-04',
    incidentType: 'Stuck Pipe',
    depthM: 250,
    formation: 'Dhekiajuli Claystone',
    reservoir: 'Surface Section',
    date: '2024-09-05',
    severity: 'MEDIUM',
    summary: 'Historical Stuck Pipe Incidents - Bit balling and packoff in sticky reactive claystone.',
    rootCause: 'Hydration of active smectite clays leading to severe bit balling and annular packoff.',
    recommendedMitigation: 'Add glycol-based clay inhibitor, maintain PHPA polymer concentration at 1.5 lb/bbl, increase nozzle velocity.',
    actionTaken: 'Treated mud with 3% polyglycol, surged pumps, cleared packoff.',
    nptHours: 14,
    costImpactLakhs: 11.0,
    similarityScore: 89,
    drillingParams: {
      mudWeightSG: 1.08,
      ecdSG: 1.12,
      rpm: 80,
      torqueKNm: 21.0,
      sppPsi: 1650,
      wobTons: 10,
      flowRateLpm: 2300,
    },
    sourceReport: {
      reportId: 'OIL-WCR-SOW04-P14',
      reportType: 'WCR (Well Completion Report)',
      title: 'Geotechnical Report: Selt-OW-04 Reactive Clay Analysis',
      date: '2024-09-20',
      page: 14,
      section: 'Clay Mineralogy & Inhibition Performance',
      ocrConfidence: 0.95,
      excerpt: 'Extracted core at 250m revealed 62% montmorillonite clay. Linear swelling test showed 45% expansion in fresh water.',
    },
  },
  {
    id: 'inc-selt-05',
    wellId: 'well-selt-ow-05',
    wellName: 'Selt-OW-05',
    incidentType: 'Stuck Pipe',
    depthM: 250,
    formation: 'Dhekiajuli Lower',
    reservoir: 'Surface Section',
    date: '2024-10-21',
    severity: 'MEDIUM',
    summary: 'Historical Stuck Pipe Incidents - Mechanical sticking during wiper trip.',
    rootCause: 'Tight hole condition caused by ledges formed at sand-clay interface at 250m.',
    recommendedMitigation: 'Perform structured reaming at 25 RPM with 800 LPM flow before pulling out, maintain hole gauge.',
    actionTaken: 'Reamed tight spot from 230m to 250m, hole conditioned.',
    nptHours: 10,
    costImpactLakhs: 7.8,
    similarityScore: 87,
    drillingParams: {
      mudWeightSG: 1.08,
      ecdSG: 1.11,
      rpm: 75,
      torqueKNm: 17.5,
      sppPsi: 1250,
      wobTons: 7,
      flowRateLpm: 2100,
    },
    sourceReport: {
      reportId: 'OIL-DDR-SOW05-TRIP',
      reportType: 'DDR (Daily Drilling Report)',
      title: 'Daily Drilling Report: Selt-OW-05 Wiper Trip',
      date: '2024-10-22',
      page: 4,
      section: 'Tripping Operations',
      ocrConfidence: 0.96,
      excerpt: 'Encountered 35 klbs drag at 250m depth. Jarred up once, worked string freely.',
    },
  },
  {
    id: 'inc-selt-06',
    wellId: 'well-selt-ow-06',
    wellName: 'Selt-OW-06',
    incidentType: 'Casing Problem',
    depthM: 150,
    formation: 'Alluvium Boulder Bed',
    reservoir: 'Conductor Shoe',
    date: '2024-11-28',
    severity: 'HIGH',
    summary: 'Historical Stuck Pipe Incidents - 20" Surface casing hung up at 150m in boulder zone.',
    rootCause: 'Borehole tortuosity and keyseating through hard river boulders preventing casing passage.',
    recommendedMitigation: 'Run casing with eccentric reamer shoe, fill casing continuously, wash down with gentle rotation.',
    actionTaken: 'Pulled 20" casing, re-drilled hole with roller cone bit and stiff BHA, casing landed successfully.',
    nptHours: 36,
    costImpactLakhs: 34.5,
    similarityScore: 85,
    drillingParams: {
      mudWeightSG: 1.05,
      ecdSG: 1.07,
      rpm: 40,
      torqueKNm: 24.0,
      sppPsi: 800,
      wobTons: 12,
      flowRateLpm: 1900,
    },
    sourceReport: {
      reportId: 'OIL-WCR-SOW06-CASING',
      reportType: 'WCR (Well Completion Report)',
      title: 'Well Completion Report: Selt-OW-06 Casing Operations',
      date: '2024-12-10',
      page: 9,
      section: 'Surface Casing Running Log',
      ocrConfidence: 0.94,
      excerpt: 'Casing string took 80 klbs weight at 150m. Unable to wash down. Pulled casing back to surface to ream hole with 26" hole opener.',
    },
  },
  {
    id: 'inc-selt-01',
    wellId: 'well-selt-ow-01',
    wellName: 'Selt-OW-01',
    incidentType: 'Casing Problem',
    depthM: 200,
    formation: 'Dhekiajuli Clay',
    reservoir: 'Surface Spud',
    date: '2024-05-15',
    severity: 'LOW',
    summary: 'Historical Stuck Pipe Incidents - Casing centralizer hang-up across 200m depth.',
    rootCause: 'Rigid centralizers catching on hard sandstone ledge.',
    recommendedMitigation: 'Use bow-spring centralizers with bevelled collars across known hard ledge transitions.',
    actionTaken: 'Switched to flexible bow-spring centralizers, landed casing at 220m.',
    nptHours: 6,
    costImpactLakhs: 4.5,
    similarityScore: 82,
    drillingParams: {
      mudWeightSG: 1.06,
      ecdSG: 1.08,
      rpm: 0,
      torqueKNm: 0,
      sppPsi: 500,
      wobTons: 0,
      flowRateLpm: 1200,
    },
    sourceReport: {
      reportId: 'OIL-WCR-SOW01-CASING',
      reportType: 'WCR (Well Completion Report)',
      title: 'Well Completion Report: Selt-OW-01 Surface Casing',
      date: '2024-05-25',
      page: 8,
      section: 'Section 3: Casing & Cementing Report',
      ocrConfidence: 0.97,
      excerpt: 'Centralizer #4 held up at 200m. Rotated casing string 90 degrees with casing tongs to clear obstruction.',
    },
  },
  {
    id: 'inc-selt-02-casing',
    wellId: 'well-selt-ow-02',
    wellName: 'Selt-OW-02',
    incidentType: 'Casing Problem',
    depthM: 250,
    formation: 'Dhekiajuli Sand',
    reservoir: 'Surface Section',
    date: '2024-06-28',
    severity: 'MEDIUM',
    summary: 'Historical Stuck Pipe Incidents - Washout behind 13-3/8" casing requiring top-job cement squeeze.',
    rootCause: 'Thief gravel zone absorbed lead slurry leaving top 60m un-cemented.',
    recommendedMitigation: 'Pump thixotropic cement blend with 2% calcium chloride accelerator and micro-silica fluid loss additive.',
    actionTaken: 'Performed 1" macaroni string top-job cement squeeze from surface annulus.',
    nptHours: 16,
    costImpactLakhs: 14.0,
    similarityScore: 84,
    drillingParams: {
      mudWeightSG: 1.07,
      ecdSG: 1.10,
      rpm: 0,
      torqueKNm: 0,
      sppPsi: 400,
      wobTons: 0,
      flowRateLpm: 800,
    },
    sourceReport: {
      reportId: 'OIL-WCR-SOW02-CMT',
      reportType: 'WCR (Well Completion Report)',
      title: 'Cementing Evaluation Report: Selt-OW-02',
      date: '2024-07-05',
      page: 15,
      section: 'Primary Cementing & Remedial Top-Job',
      ocrConfidence: 0.95,
      excerpt: 'CBL-VDL log showed poor bond from surface to 60m. Annular squeeze performed with 50 sacks Class G cement.',
    },
  },
  {
    id: 'inc-selt-03-casing',
    wellId: 'well-selt-ow-03',
    wellName: 'Selt-OW-03',
    incidentType: 'Casing Problem',
    depthM: 100,
    formation: 'Alluvium Boulder Bed',
    reservoir: 'Surface Spud',
    date: '2024-07-20',
    severity: 'LOW',
    summary: 'Historical Stuck Pipe Incidents - Conductor pipe vibration and alignment drift.',
    rootCause: 'High surface vibration transmitted to conductor pipe in unconsolidated gravel.',
    recommendedMitigation: 'Install surface turnbuckle bracing and pour 5 m³ concrete cellar pad.',
    actionTaken: 'Reinforced cellar pad with high early-strength concrete, vibration eliminated.',
    nptHours: 5,
    costImpactLakhs: 3.5,
    similarityScore: 80,
    drillingParams: {
      mudWeightSG: 1.04,
      ecdSG: 1.06,
      rpm: 50,
      torqueKNm: 12.0,
      sppPsi: 700,
      wobTons: 5,
      flowRateLpm: 1800,
    },
    sourceReport: {
      reportId: 'OIL-DDR-SOW03-CELLAR',
      reportType: 'DDR (Daily Drilling Report)',
      title: 'Daily Drilling Report: Selt-OW-03 Cellar Construction',
      date: '2024-07-21',
      page: 2,
      section: 'Cellar and Conductor Rig-Up',
      ocrConfidence: 0.96,
      excerpt: 'Conductor pipe inspected for plumbness. Cemented cellar pad to prevent gravel erosion during spud drilling.',
    },
  }
];

// Predictive alerts matching the UI screenshot exactly
export const PREDICTIVE_ALERTS: AlertItem[] = [
  {
    id: 'alt-01',
    severity: 'HIGH',
    title: 'ALERT: Approach 3500m in HIGH Loss Risk!',
    message: 'Active well bit at 3,500m approaching sub-hydrostatic Barail Sandstone depleted interval.',
    recommendation: 'Adjust Mud Weight from 1.25 SG to 1.21 SG. Prepare 45 bbl LCM pill on standby.',
    depthM: 3500,
    formation: 'Barail Coal-Shale & Sandstone',
    wellRef: 'NWIS-Calire-02 (1.4 km offset)',
    timestamp: 'Just now (12:45 UTC)',
    acknowledged: false,
    triggerCondition: 'Depth >= 3480m in Barail Formation with ECD > 1.28 SG',
    mitigationSteps: [
      'Reduce mud pump circulation rate to 1,400 LPM',
      'Lower active mud weight by 0.04 SG using water/base dilution',
      'Stock 40 bbl coarse nut-plug & mica LCM pill in pill pit #2',
      'Enable trip tank continuous monitoring during connections',
    ],
  },
  {
    id: 'alt-02',
    severity: 'HIGH',
    title: 'ALERT: Approach 3500m in HIGH Loss Risk!',
    message: 'Correlation with NWIS-Calire-02 shows massive loss of 48 m³/hr occurred at 3,480m.',
    recommendation: 'Adjust Mud Weight. Restrict ROP to 6 m/hr to minimize surge pressures.',
    depthM: 3480,
    formation: 'Barail Sand-4',
    wellRef: 'NWIS-Calire-02',
    timestamp: '4 mins ago',
    acknowledged: false,
    triggerCondition: 'Cross-well lithology correlation similarity > 94%',
    mitigationSteps: [
      'Cap drill rate at 6 m/hr max to avoid hydraulic surge',
      'Verify shaker screen mesh size (use 140/175 mesh)',
      'Alert mud engineer to keep 500 sacks calcium carbonate on site',
    ],
  },
  {
    id: 'alt-03',
    severity: 'CRITICAL',
    title: 'ALERT: Approach 3500m in Active Well Risk!',
    message: 'Severe gas kick occurred at 3,495m in offset well NWIS-Colive-04 (18 bbl kick volume).',
    recommendation: 'Adjust LCM, Mitigation & OW-04. Verify BOP function test and choke manifold readiness.',
    depthM: 3495,
    formation: 'Barail Main Pay',
    wellRef: 'NWIS-Colive-04 (1.9 km offset)',
    timestamp: '12 mins ago',
    acknowledged: false,
    triggerCondition: 'Known gas sand boundary within 15 vertical meters',
    mitigationSteps: [
      'Perform acoustic BOP accumulator pre-charge test',
      'Verify remote choke console calibration',
      'Zero pit volume totalizer (PVT) alarm threshold to ±0.5 m³',
      'Conduct crew pit drill before penetrating Barail Main Sand',
    ],
  },
  {
    id: 'alt-04',
    severity: 'HIGH',
    title: 'ALERT: Approach 3500m in HIGH Loss Risk!',
    message: 'Barail Sandstone depleted pore pressure zone (1.12 SG) vs current hydrostatic ECD (1.27 SG).',
    recommendation: 'Adjust Mud Weight. Keep ECD below 1.22 SG to prevent hydraulic fracturing.',
    depthM: 3500,
    formation: 'Barail Sandstone',
    wellRef: 'NWIS-Active-02',
    timestamp: '25 mins ago',
    acknowledged: false,
    triggerCondition: 'Overbalance exceeds 0.15 SG across depleted interval',
    mitigationSteps: [
      'Gradually lower mud weight to 1.21 SG',
      'Monitor ECD via PWD tool telemetry',
    ],
  },
  {
    id: 'alt-05',
    severity: 'WARNING',
    title: 'ALERT: Approach 3500m in Active Well Risk!',
    message: 'Differential sticking hazard observed in NWIS-Colve-02 at 3,410m after 25 min stationary survey.',
    recommendation: 'Adjust increase LCM, Mitigation & OW-04. Enforce max 3-minute stationary limit for MWD surveys.',
    depthM: 3410,
    formation: 'Barail Coal-Shale',
    wellRef: 'NWIS-Colve-02',
    timestamp: '38 mins ago',
    acknowledged: false,
    triggerCondition: 'Stationary string in high-differential pressure zone',
    mitigationSteps: [
      'Rotate pipe while pulsing MWD data when possible',
      'Maintain continuous low RPM (15-20 RPM) during surveys',
      'Keep pipe-freeing lubricant ready in active mud system',
    ],
  }
];

// Real-time simulated telemetry stream
export const INITIAL_TELEMETRY: TelemetryReading = {
  timestamp: '12:45:10 UTC',
  depthM: 3500.2,
  ropMhr: 7.4,
  wobTons: 11.8,
  rpm: 105,
  torqueKNm: 14.6,
  sppPsi: 2640,
  mudFlowInLpm: 1850,
  mudFlowOutLpm: 1845,
  pitVolumeM3: 45.2,
  gasUnits: 14,
  mudWeightInSG: 1.24,
  mudWeightOutSG: 1.24,
};

// Operational Field Simulation Scenarios for Wellsite Training & Drill Readiness
export type OperationalScenario = {
  id: string;
  title: string;
  badge: string;
  desc: string;
  query: string;
  depthTarget: number;
  formationTarget: string;
};

export const OPERATIONAL_SCENARIOS: OperationalScenario[] = [
  {
    id: 'scenario-1',
    title: '1. Nearby Wells Intelligence Scan',
    badge: 'Spatial RAG',
    desc: 'Perform 360-degree radius scan around NWIS-Active-01 (42 offset wells indexed, 7 direct perimeter offsets highlighted with real-time risk rings).',
    query: 'What are the critical risks observed in offset wells within a 3 km radius of NWIS-Active-01 at depth 3,400m - 3,600m?',
    depthTarget: 3500,
    formationTarget: 'Barail Coal-Shale & Sandstone',
  },
  {
    id: 'scenario-2',
    title: '2. Barail Mud Loss at 3,480m',
    badge: 'Mud Loss & LCM',
    desc: 'Query historical mud loss in NWIS-Calire-02 and retrieve exact LCM formulation and pumping procedure with cited WCR page #47.',
    query: 'Why did NWIS-Calire-02 experience massive mud loss at 3,480m and what exact LCM pill composition succeeded in restoring circulation?',
    depthTarget: 3480,
    formationTarget: 'Barail Sand-4',
  },
  {
    id: 'scenario-3',
    title: '3. Cross-Formation Hazard Comparison',
    badge: 'Correlation Engine',
    desc: 'Compare geomechanical drilling margins between Tipam Sandstone vs Barail Coal-Shale to explain why torque spikes occur.',
    query: 'Compare drilling hazards between Tipam Sandstone and Barail Formation. Why does torque fluctuate drastically in Barail?',
    depthTarget: 3520,
    formationTarget: 'Barail Coal-Shale',
  },
  {
    id: 'scenario-4',
    title: '4. Critical Gas Kick & BOP Readiness',
    badge: 'Well Control',
    desc: 'Analyze the 18 bbl gas kick in NWIS-Colive-04 at 3,495m and compute the required kill mud weight using Oil India standards.',
    query: 'What caused the gas kick in NWIS-Colive-04 at 3,495m, and what was the calculated kill mud weight and shut-in procedure?',
    depthTarget: 3495,
    formationTarget: 'Barail Main Pay',
  },
  {
    id: 'scenario-5',
    title: '5. Insufficient Information Fallback',
    badge: 'Anti-Hallucination',
    desc: 'Anti-Hallucination Guardrail: When queried on un-drilled deep formations or missing offset data, system strictly refuses to speculate and recommends logging.',
    query: 'What was the exact fracture gradient recorded at 6,800m depth in the Pre-Cambrian Basement of well Selt-OW-08?',
    depthTarget: 5500,
    formationTarget: 'Basal Sandstone & Basement',
  },
  {
    id: 'scenario-6',
    title: '6. Multi-Turn Decision Follow-Up',
    badge: 'Multi-Turn Copilot',
    desc: 'Test conversational memory: "Why is torque increasing?" -> "What happened in nearby wells?" -> "What mitigation worked best?".',
    query: 'Why is Well A seeing increasing torque at 3,500m?',
    depthTarget: 3500,
    formationTarget: 'Barail Coal-Shale & Sandstone',
  }
];
