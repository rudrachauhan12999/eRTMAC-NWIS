import React, { useState } from 'react';
import { BookOpen, Database, Server, ShieldCheck, HelpCircle, Copy, Check } from 'lucide-react';
import { SYSTEM_DOCUMENTATION } from '../data/systemDocumentation.ts';

export const SystemDocsView: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex-1 p-4 max-w-7xl mx-auto w-full select-none flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-[#463d35] text-white p-4 rounded-lg border-2 border-[#352d26] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-['Chakra_Petch',sans-serif] tracking-wide">
              eRTMAC-NWIS Technical Specifications & Architecture
            </h2>
            <span className="bg-emerald-600 text-white text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
              Production Standard
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            System Architecture, SQLite Schema DDL, Docker Compose, and Geomechanical Defense FAQs for Oil India Operations.
          </p>
        </div>

        <div className="text-xs font-mono text-amber-300 bg-[#2b241d] px-3 py-1.5 rounded border border-[#524436]">
          Status: {SYSTEM_DOCUMENTATION.status}
        </div>
      </div>

      {/* 1. System Architecture Overview */}
      <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-[#1c1815] font-['Chakra_Petch',sans-serif] flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-700" />
            <span>Multi-Tier High-Availability Architecture</span>
          </div>
          <button
            onClick={() => handleCopy(SYSTEM_DOCUMENTATION.architectureMermaid, 'mermaid')}
            className="flex items-center gap-1 text-[11px] font-mono text-[#5c4f42] hover:text-[#1c1815] bg-[#ebdcc8] px-2 py-1 rounded"
          >
            {copiedKey === 'mermaid' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Mermaid</span>
          </button>
        </div>

        <p className="text-xs text-[#45372a] leading-relaxed mb-4">
          {SYSTEM_DOCUMENTATION.overview}
        </p>

        {/* Visual Architecture Flow Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#ebdcc8] p-3 rounded border border-[#c4b5a2]">
            <div className="font-bold text-[#1c1815] mb-1 font-['Chakra_Petch',sans-serif]">
              1. Operator Layer
            </div>
            <p className="text-[11px] text-[#554a3e]">
              React 19 + Tailwind, 360° Circular Proximity Radar, 3D Stratigraphy Cross-Section, WITSML Telemetry.
            </p>
          </div>

          <div className="bg-[#ebdcc8] p-3 rounded border border-[#c4b5a2]">
            <div className="font-bold text-[#1c1815] mb-1 font-['Chakra_Petch',sans-serif]">
              2. Backend Gateway
            </div>
            <p className="text-[11px] text-[#554a3e]">
              Express API proxy, RBAC auth, WITSML socket streaming, sub-second query dispatcher.
            </p>
          </div>

          <div className="bg-[#ebdcc8] p-3 rounded border border-[#c4b5a2]">
            <div className="font-bold text-[#1c1815] mb-1 font-['Chakra_Petch',sans-serif]">
              3. AI & Knowledge
            </div>
            <p className="text-[11px] text-[#554a3e]">
              Google Gemini 3.8 Flash + BM25 Hybrid Retrieval, Cross-Encoder Re-ranker, Anti-Hallucination Guardrails.
            </p>
          </div>

          <div className="bg-[#ebdcc8] p-3 rounded border border-[#c4b5a2]">
            <div className="font-bold text-[#1c1815] mb-1 font-['Chakra_Petch',sans-serif]">
              4. Data Store
            </div>
            <p className="text-[11px] text-[#554a3e]">
              Relational SQLite for metadata/events, ChromaDB vector store, PyMuPDF OCR archive.
            </p>
          </div>
        </div>
      </div>

      {/* 2. SQLite DDL Schema */}
      <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-[#1c1815] font-['Chakra_Petch',sans-serif] flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-700" />
            <span>SQLite Enterprise Relational Schema (DDL)</span>
          </div>
          <button
            onClick={() => handleCopy(SYSTEM_DOCUMENTATION.sqliteSchemaDDL, 'ddl')}
            className="flex items-center gap-1 text-[11px] font-mono text-[#5c4f42] hover:text-[#1c1815] bg-[#ebdcc8] px-2 py-1 rounded"
          >
            {copiedKey === 'ddl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy DDL</span>
          </button>
        </div>

        <pre className="bg-[#1c1815] text-[#a7f3d0] p-4 rounded-md overflow-x-auto text-[11px] font-mono max-h-64 leading-relaxed scrollbar-thin">
          {SYSTEM_DOCUMENTATION.sqliteSchemaDDL}
        </pre>
      </div>

      {/* 3. Docker Compose Deployment */}
      <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-[#1c1815] font-['Chakra_Petch',sans-serif] flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-700" />
            <span>Docker Compose Specification (docker-compose.yml)</span>
          </div>
          <button
            onClick={() => handleCopy(SYSTEM_DOCUMENTATION.dockerComposeYaml, 'docker')}
            className="flex items-center gap-1 text-[11px] font-mono text-[#5c4f42] hover:text-[#1c1815] bg-[#ebdcc8] px-2 py-1 rounded"
          >
            {copiedKey === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy YAML</span>
          </button>
        </div>

        <pre className="bg-[#1c1815] text-amber-200 p-4 rounded-md overflow-x-auto text-[11px] font-mono max-h-48 leading-relaxed scrollbar-thin">
          {SYSTEM_DOCUMENTATION.dockerComposeYaml}
        </pre>
      </div>

      {/* 4. Judge Defense FAQs */}
      <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-lg p-4 shadow-sm space-y-3">
        <div className="text-sm font-bold text-[#1c1815] font-['Chakra_Petch',sans-serif] flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-700" />
          <span>Operational FAQ & Technical Defenses</span>
        </div>

        <div className="space-y-3">
          {SYSTEM_DOCUMENTATION.judgeFaqs.map((faq, idx) => (
            <div key={idx} className="bg-[#fffdf9] p-3.5 rounded border border-[#c4b5a2] space-y-1.5">
              <h4 className="text-xs font-bold text-[#1a1612] font-['Chakra_Petch',sans-serif] flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-700 text-white flex items-center justify-center text-[10px] font-mono">
                  Q
                </span>
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-[#45372a] leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
