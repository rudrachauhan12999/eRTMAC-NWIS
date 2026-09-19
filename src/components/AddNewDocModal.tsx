import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Calendar,
  Sparkles
} from 'lucide-react';
import { HistoricalIncident } from '../data/wellsData.ts';

interface AddNewDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDocument: (doc: HistoricalIncident) => void;
  availableFormations: string[];
}

const PRESET_TEMPLATES = [
  {
    label: 'Barail Formation High-Pressure Kick (WCR)',
    type: 'WCR (Well Completion Report)',
    title: 'OIL-WCR-NHK-89 Barail Gas Sand Completion Dossier',
    wellName: 'OIL-NHK-89',
    depthM: 3620,
    formation: 'Barail Coal-Shale',
    incidentType: 'Gas Kick / Pore Pressure Surge',
    section: 'Section 4.3 - Primary Gas Influx & Well Control Log',
    excerpt: 'Encountered unexpected gas-charged sand stringer at 3,620m TVD. Active mud weight 1.22 SG insufficient against 1.25 SG pore pressure; observed 18 bbl pit gain. Annular preventer actuated.',
    ocrConfidence: 0.98,
  },
  {
    label: 'Kopili Shale High Loss Daily Tour (DDR)',
    type: 'DDR (Daily Drilling Report)',
    title: 'OIL-DDR-DKL-15 Daily Drilling Tour #42',
    wellName: 'OIL-DKL-15',
    depthM: 3280,
    formation: 'Kopili Formation',
    incidentType: 'Severe Mud Losses / Fracturing',
    section: 'Daily Tour #42 - Mud Logging & Losses',
    excerpt: 'Total loss of 62 bbl/hr incurred while drilling 8-1/2" section at 3,280m into micro-fractured Kopili calcareous shale. Pumped 50 bbl medium Nutplug/Mica LCM pill. Returns restored.',
    ocrConfidence: 0.96,
  },
];

export const AddNewDocModal: React.FC<AddNewDocModalProps> = ({
  isOpen,
  onClose,
  onAddDocument,
  availableFormations,
}) => {
  const [reportType, setReportType] = useState<'WCR' | 'DDR'>('WCR');
  const [title, setTitle] = useState('');
  const [reportId, setReportId] = useState('');
  const [wellName, setWellName] = useState('OIL-NHK-');
  const [depthM, setDepthM] = useState<number>(3500);
  const [formation, setFormation] = useState<string>('Barail Coal-Shale');
  const [customFormation, setCustomFormation] = useState('');
  const [incidentType, setIncidentType] = useState('Mud Loss / Seepage');
  const [section, setSection] = useState('Section 3.2 - Drilling Operational Log');
  const [excerpt, setExcerpt] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState<number>(97);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: typeof PRESET_TEMPLATES[0]) => {
    setReportType(tmpl.type.includes('WCR') ? 'WCR' : 'DDR');
    setTitle(tmpl.title);
    setReportId(`OIL-${tmpl.type.includes('WCR') ? 'WCR' : 'DDR'}-${Date.now().toString().slice(-4)}`);
    setWellName(tmpl.wellName);
    setDepthM(tmpl.depthM);
    setFormation(tmpl.formation);
    setIncidentType(tmpl.incidentType);
    setSection(tmpl.section);
    setExcerpt(tmpl.excerpt);
    setOcrConfidence(Math.round(tmpl.ocrConfidence * 100));
    setFileName(`${tmpl.wellName}_archive_scanned.pdf`);
    setErrorMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').toUpperCase());
      }
      if (!reportId) {
        setReportId(`OIL-DOC-${Date.now().toString().slice(-5)}`);
      }
      if (!excerpt) {
        setExcerpt(`Extracted text from scanned document ${file.name}: Operational parameters verified for rig OIL-E2000.`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a document title.');
      return;
    }
    if (!wellName.trim()) {
      setErrorMsg('Please enter an offset well identifier.');
      return;
    }
    if (!excerpt.trim()) {
      setErrorMsg('Please provide an operational excerpt or summary.');
      return;
    }

    const finalReportId = reportId.trim() || `OIL-${reportType}-${Date.now().toString().slice(-4)}`;
    const finalFormation = formation === 'OTHER' ? (customFormation.trim() || 'Undifferentiated') : formation;
    const nowIso = new Date().toISOString().split('T')[0];

    const newIncident: HistoricalIncident = {
      id: `custom-inc-${Date.now()}`,
      wellId: `well-${wellName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      wellName: wellName.trim(),
      incidentType: (incidentType.includes('Loss') ? 'Mud Loss' : incidentType.includes('Kick') ? 'Gas Kick' : 'Stuck Pipe') as any,
      depthM: Number(depthM) || 3500,
      formation: finalFormation,
      reservoir: 'Barail / Tipam Sand Series',
      date: nowIso,
      severity: 'HIGH',
      summary: excerpt.trim(),
      rootCause: 'Geomechanical pressure fluctuation and stratigraphic variation',
      recommendedMitigation: 'Regulate mud density within operating envelope and monitor returns',
      actionTaken: 'Standard operating procedure enacted; logs cataloged into eRTMAC-NWIS',
      nptHours: 8.5,
      costImpactLakhs: 14.2,
      similarityScore: 0.94,
      drillingParams: {
        mudWeightSG: 1.22,
        ecdSG: 1.25,
        rpm: 85,
        torqueKNm: 14.5,
        sppPsi: 2400,
        wobTons: 12,
        flowRateLpm: 2400,
      },
      sourceReport: {
        reportId: finalReportId,
        title: title.trim(),
        date: nowIso,
        reportType: reportType === 'WCR' ? 'WCR (Well Completion Report)' : 'DDR (Daily Drilling Report)',
        page: Math.floor(Math.random() * 20) + 1,
        section: section.trim() || 'Operational Log',
        ocrConfidence: Math.min(1, Math.max(0.7, ocrConfidence / 100)),
        excerpt: excerpt.trim(),
        tableData: [
          { Parameter: 'Report Type', Value: reportType, Unit: '' },
          { Parameter: 'Drill Depth', Value: depthM.toString(), Unit: 'm' },
          { Parameter: 'Stratigraphy', Value: finalFormation, Unit: '' },
        ],
      },
    };

    onAddDocument(newIncident);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#3b322a] text-white px-4 py-3 flex items-center justify-between border-b border-[#2b241d] shrink-0">
          <div className="flex items-center gap-2.5">
            <img 
              src="/oil_india_logo.png" 
              alt="Oil India" 
              className="w-6 h-6 object-contain drop-shadow-xs" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-sm font-bold font-['Chakra_Petch',sans-serif] text-amber-300">
                Digitize & Index New Well Document
              </h3>
              <p className="text-[11px] text-stone-300 font-mono">
                Oil India Duliajan • WCR / DDR OCR Institutional Ingestion
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-mono text-[#2c241d]">
          {errorMsg && (
            <div className="p-2.5 rounded bg-red-100 border border-red-300 text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Preset Template Buttons */}
          <div className="bg-[#ede1d1] p-3 rounded-lg border border-[#c9baaa]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#4a3e33] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Quick-Load Oil India Archived Template:</span>
              </span>
              <span className="text-[10px] text-[#736454]">Click to auto-fill</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_TEMPLATES.map((tmpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="text-left p-2 rounded bg-[#fbf7f0] hover:bg-white border border-[#d2c2b0] hover:border-amber-700 text-[11px] transition-all cursor-pointer"
                >
                  <div className="font-bold text-[#1c1815] truncate">{tmpl.label}</div>
                  <div className="text-[10px] text-[#695c4d]">{tmpl.wellName} • {tmpl.depthM}m</div>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload / Drag & Drop Area */}
          <div className="border-2 border-dashed border-[#b5a794] hover:border-amber-700 rounded-lg p-3 text-center bg-[#fbf7f0] transition-colors relative cursor-pointer">
            <input 
              type="file" 
              accept=".pdf,.tiff,.tif,.txt,.csv,.doc,.docx"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <UploadCloud className="w-7 h-7 mx-auto text-amber-800 mb-1" />
            <div className="font-bold text-[#2b241d]">
              {fileName ? `Attached File: ${fileName}` : 'Drag & drop scanned WCR/DDR PDF or click to browse'}
            </div>
            <div className="text-[10px] text-[#7a6a58] mt-0.5">
              Supports scanned PDFs, TIFF log strips, and daily drilling tour sheets
            </div>
          </div>

          {/* Document Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-[#4a3e33]">DOCUMENT CATEGORY *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType('WCR')}
                  className={`p-2 rounded border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    reportType === 'WCR'
                      ? 'bg-[#3b322a] text-amber-300 border-amber-600 shadow-xs'
                      : 'bg-[#f4ebe0] text-[#4a3e33] border-[#c4b5a2] hover:bg-[#e8dcce]'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>WCR (Completion)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('DDR')}
                  className={`p-2 rounded border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    reportType === 'DDR'
                      ? 'bg-[#1e3a5f] text-cyan-200 border-cyan-500 shadow-xs'
                      : 'bg-[#f4ebe0] text-[#4a3e33] border-[#c4b5a2] hover:bg-[#e8dcce]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>DDR (Daily Tour)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-[#4a3e33]">REPORT ID / ARCHIVE CODE</label>
              <input
                type="text"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                placeholder="e.g. OIL-WCR-NHK89-SEC1"
                className="w-full p-2 bg-white border border-[#c4b5a2] rounded focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono text-xs"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold mb-1 text-[#4a3e33]">DOCUMENT TITLE *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. OIL-WCR-NHK-89 Well Completion Dossier"
              required
              className="w-full p-2 bg-white border border-[#c4b5a2] rounded focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono text-xs"
            />
          </div>

          {/* Well Name, Depth, Formation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold mb-1 text-[#4a3e33]">OFFSET WELL *</label>
              <input
                type="text"
                value={wellName}
                onChange={(e) => setWellName(e.target.value)}
                placeholder="e.g. OIL-NHK-89"
                required
                className="w-full p-2 bg-white border border-[#c4b5a2] rounded focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-[#4a3e33]">RECORDED DEPTH (M)</label>
              <input
                type="number"
                value={depthM}
                onChange={(e) => setDepthM(Number(e.target.value))}
                min={500}
                max={6000}
                className="w-full p-2 bg-white border border-[#c4b5a2] rounded focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-[#4a3e33]">STRATIGRAPHY</label>
              <select
                value={formation}
                onChange={(e) => setFormation(e.target.value)}
                className="w-full p-2 bg-white border border-[#c4b5a2] rounded focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono text-xs"
              >
                <option value="Barail Coal-Shale">Barail Coal-Shale</option>
                <option value="Tipam Sandstone">Tipam Sandstone</option>
                <option value="Girujan Clay">Girujan Clay</option>
                <option value="Kopili Formation">Kopili Formation</option>
                <option value="Surma Formation">Surma Formation</option>
                <option value="Disang Shale">Disang Shale</option>
                <option value="OTHER">Custom Formation...</option>
              </select>
            </div>
          </div>

          {formation === 'OTHER' && (
            <div>
              <label className="block font-bold mb-1 text-[#4a3e33]">CUSTOM FORMATION NAME</label>
              <input
                type="text"
                value={customFormation}
                onChange={(e) => setCustomFormation(e.target.value)}
                placeholder="e.g. Bokabil / Dhekiajuli Sand"
                className="w-full p-2 bg-white border border-[#c4b5a2] rounded focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono text-xs"
              />
            </div>
          )}

          {/* Section Ref & Incident Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-[#4a3e33]">SECTION / CHAPTER REFERENCE</label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. Section 4.2 - Casing & Mud Losses"
                className="w-full p-2 bg-white border border-[#c4b5a2] rounded focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-[#4a3e33]">PRIMARY INCIDENT / OBSERVATION</label>
              <input
                type="text"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                placeholder="e.g. Severe Mud Loss / Gas Influx"
                className="w-full p-2 bg-white border border-[#c4b5a2] rounded focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono text-xs"
              />
            </div>
          </div>

          {/* Excerpt / OCR Text */}
          <div>
            <label className="block font-bold mb-1 text-[#4a3e33]">OPERATIONAL EXCERPT / OCR TEXT *</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="Enter transcribed summary, geomechanical observations, casing depth, or mud logging notes..."
              required
              className="w-full p-2 bg-white border border-[#c4b5a2] rounded focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono text-xs"
            />
          </div>

          {/* OCR Confidence Slider */}
          <div className="bg-[#f4ebe0] p-3 rounded border border-[#dfd2c0] flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-[#3d3228] block">OCR Confidence Rating</span>
              <span className="text-[10px] text-[#736353]">Verification accuracy score based on scan fidelity</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={70}
                max={100}
                value={ocrConfidence}
                onChange={(e) => setOcrConfidence(Number(e.target.value))}
                className="w-28 accent-amber-700"
              />
              <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-xs">
                {ocrConfidence}%
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-[#dfd2c0] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-[#e8dcce] hover:bg-[#dbcebe] text-[#362b21] font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#3b322a] hover:bg-[#251e18] text-amber-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Index Document to Repository</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
