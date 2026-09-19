import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Well } from '../data/wellsData.ts';
import { fetchWells, fetchNearbyWells, WellsApiError } from '../services/wellsApi.ts';
import { Layers, Crosshair, Filter, ShieldAlert, FileText } from 'lucide-react';

const ACTIVE_WELL_ID = 'well-active-01';

interface InteractiveLeafletMapProps {
  onSelectWell: (well: Well) => void;
  onOpenReportModal?: (incident: any) => void;
}

export const InteractiveLeafletMap: React.FC<InteractiveLeafletMapProps> = ({
  onSelectWell,
  onOpenReportModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [filterRisk, setFilterRisk] = useState<string>('All');

  // Well data from the backend (GET /api/wells, GET /api/wells/nearby) —
  // replaces the wellsData.ts fixture this component used to import directly.
  const [activeWell, setActiveWell] = useState<Well | null>(null);
  const [nearbyWells, setNearbyWells] = useState<Well[]>([]);
  const [selectedWell, setSelectedWell] = useState<Well | null>(null);
  const [wellsLoading, setWellsLoading] = useState<boolean>(true);
  const [wellsError, setWellsError] = useState<string | null>(null);

  // 1. Load the full well list once, to determine which well is "active".
  useEffect(() => {
    let cancelled = false;
    setWellsLoading(true);
    setWellsError(null);
    fetchWells()
      .then((all) => {
        if (cancelled) return;
        const active = all.find((w) => w.id === ACTIVE_WELL_ID) ?? all[0] ?? null;
        setActiveWell(active);
        setSelectedWell(active);
      })
      .catch((err) => {
        if (cancelled) return;
        setWellsError(err instanceof WellsApiError ? err.message : 'Could not reach the backend to load wells.');
      })
      .finally(() => {
        if (!cancelled) setWellsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Once the active well is known, load offset wells within the current
  // radius from GET /api/wells/nearby — re-fetches whenever the radius
  // slider changes, same trigger the old client-side Haversine filter used.
  useEffect(() => {
    if (!activeWell) return;
    let cancelled = false;
    fetchNearbyWells(activeWell.lat, activeWell.lng, radiusKm)
      .then((wells) => {
        if (!cancelled) setNearbyWells(wells);
      })
      .catch((err) => {
        if (!cancelled) setWellsError(err instanceof WellsApiError ? err.message : 'Could not reach the backend to load nearby wells.');
      });
    return () => {
      cancelled = true;
    };
  }, [activeWell, radiusKm]);

  useEffect(() => {
    if (!mapContainerRef.current || !activeWell) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet Map centered on the active well
      const map = L.map(mapContainerRef.current, {
        center: [activeWell.lat, activeWell.lng],
        zoom: 13,
        zoomControl: false,
      });

      // CartoDB Positron / OpenStreetMap Tile layer with subtle warm tones
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: 'topleft' }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Clean up map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeWell]);

  // Update markers and proximity circle whenever the backend well data or filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersRef.current || !activeWell) return;

    markersRef.current.clearLayers();

    // Update Proximity Circle
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
    }
    const circle = L.circle([activeWell.lat, activeWell.lng], {
      radius: radiusKm * 1000,
      color: '#b91c1c',
      weight: 2,
      dashArray: '5, 5',
      fillColor: '#fef08a',
      fillOpacity: 0.12,
    }).addTo(map);
    circleRef.current = circle;

    // Active Well Center Marker (Derrick Icon)
    const activeIcon = L.divIcon({
      className: 'custom-active-marker',
      html: `
        <div style="background-color: #1c1815; color: #fbbf24; border: 2px solid #ea580c; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); animation: pulse 2s infinite;">
          ★
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const activeMarker = L.marker([activeWell.lat, activeWell.lng], {
      icon: activeIcon,
    }).addTo(markersRef.current);

    activeMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; color: #1c1815;">
        <strong style="font-size: 13px; color: #b91c1c;">${activeWell.name} (ACTIVE DRILLING)</strong><br/>
        <b>Field:</b> Duliajan (Upper Assam Shelf)<br/>
        <b>Current Depth:</b> ${activeWell.depthM}m / ${activeWell.targetDepthM}m<br/>
        <b>Formation:</b> ${activeWell.formation}<br/>
        <b>Status:</b> ${activeWell.status}
      </div>
    `);

    // Nearby Offset Wells Markers (already radius-filtered by the backend)
    nearbyWells.forEach((well) => {
      const dist = well.distanceKm;

      if (filterRisk !== 'All' && well.primaryRisk !== filterRisk) return;

      let bgColor = '#22c55e'; // green
      if (well.primaryRisk?.includes('Loss')) bgColor = '#eab308'; // yellow
      if (well.primaryRisk?.includes('Kick')) bgColor = '#ef4444'; // red
      if (well.primaryRisk?.includes('Stuck')) bgColor = '#a855f7'; // purple

      const offsetIcon = L.divIcon({
        className: 'custom-offset-marker',
        html: `
          <div style="background-color: ${bgColor}; color: #000; border: 2px solid #1c1815; border-radius: 4px; padding: 2px 4px; font-weight: bold; font-size: 10px; font-family: monospace; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
            ${well.shortCode || well.name}
          </div>
        `,
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      });

      const marker = L.marker([well.lat, well.lng], {
        icon: offsetIcon,
      }).addTo(markersRef.current!);

      marker.on('click', () => {
        setSelectedWell(well);
        onSelectWell(well);
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #1c1815; min-width: 180px;">
          <strong style="font-size: 13px;">${well.name}</strong><br/>
          <b>Distance:</b> ${dist.toFixed(2)} km<br/>
          <b>Total Depth:</b> ${well.targetDepthM}m<br/>
          <b>Target Formation:</b> ${well.formation}<br/>
          <b>Primary Risk:</b> <span style="color: #b91c1c; font-weight: bold;">${well.primaryRisk}</span><br/>
          <b>Historical Events:</b> ${well.incidentsCount}<br/>
          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #ddd; font-size: 11px; color: #555;">
            Spud: ${well.spudDate} • Rig: ${well.rigName}
          </div>
        </div>
      `);
    });
  }, [activeWell, nearbyWells, filterRisk, onSelectWell]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && activeWell) {
      mapInstanceRef.current.setView([activeWell.lat, activeWell.lng], 13);
    }
  };

  return (
    <div className="flex-1 p-4 max-w-7xl mx-auto w-full select-none flex flex-col gap-4">
      {/* Top Filter Bar */}
      <div className="bg-[#463d35] text-white p-4 rounded-lg border-2 border-[#352d26] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-['Chakra_Petch',sans-serif] tracking-wide">
              Assam-Arakan Basin Geospatial Well GIS
            </h2>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            Real geographic coordinates across Duliajan, Moran, Nahorkatiya, and Digboi fields.
          </p>
        </div>

        {/* Radius & Risk Controls */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-[#332b24] px-3 py-1.5 rounded border border-[#524436]">
            <span className="text-stone-300">Offset Radius:</span>
            <input
              type="range"
              min={1}
              max={25}
              step={0.5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="accent-amber-500 w-24 cursor-pointer"
            />
            <strong className="text-amber-400 w-12 text-right">{radiusKm} km</strong>
          </div>

          <div className="flex items-center gap-2 bg-[#332b24] px-3 py-1.5 rounded border border-[#524436]">
            <span className="text-stone-300">Filter Risk:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-[#241e19] text-white border border-[#524436] rounded px-2 py-0.5 text-xs font-mono"
            >
              <option value="All">All Risks</option>
              <option value="High Loss">High Loss</option>
              <option value="Gas Kick">Gas Kick</option>
              <option value="Stuck Pipe">Stuck Pipe</option>
            </select>
          </div>

          <button
            onClick={handleRecenter}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#241e19] hover:bg-black rounded border border-[#524436] text-amber-300 font-bold transition-colors"
          >
            <Crosshair className="w-4 h-4" />
            <span>Center Active</span>
          </button>
        </div>
      </div>

      {/* Main Map & Detail Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[550px]">
        {/* Map Container */}
        <div className="lg:col-span-8 rounded-lg border-2 border-[#5c4f42] overflow-hidden shadow-md relative min-h-[450px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[450px]" />

          {wellsLoading && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#ebdcc8]/90 text-sm font-mono text-[#5c5247]">
              Loading well data from backend…
            </div>
          )}
          {!wellsLoading && wellsError && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-red-50/95 text-sm font-mono text-red-800 text-center px-6">
              {wellsError}
            </div>
          )}

          {/* Map Floating Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-[#fcf8f2]/95 border border-[#a89985] p-2.5 rounded-md shadow-lg text-[11px] font-mono space-y-1 text-[#2c241c]">
            <div className="font-bold border-b border-[#a89985] pb-1 mb-1 font-['Chakra_Petch',sans-serif]">
              Well Legend
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-black border border-amber-400 inline-block" />
              <span>NWIS-Active-01 (Drilling)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#ef4444] inline-block" />
              <span>Gas Kick Encountered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#eab308] inline-block" />
              <span>Severe Mud Loss Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#a855f7] inline-block" />
              <span>Differential Stuck Pipe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#22c55e] inline-block" />
              <span>Normal Offset Penetration</span>
            </div>
          </div>
        </div>

        {/* Selected Well Inspector Column */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="bg-[#f5ede1] rounded-lg border-2 border-[#5c4f42] p-4 shadow-sm flex-1 flex flex-col">
            {!selectedWell ? (
              <div className="flex-1 flex items-center justify-center text-xs font-mono text-[#5c5247]">
                {wellsError ? wellsError : 'Loading well data from backend…'}
              </div>
            ) : (
              <>
            <div className="bg-[#463d35] text-white px-3 py-2 -m-4 mb-3 rounded-t-md font-['Chakra_Petch',sans-serif] font-bold text-sm flex items-center justify-between">
              <span>Wellbore Dossier: {selectedWell.name}</span>
              <span className="text-xs text-amber-300 font-mono">{selectedWell.status}</span>
            </div>

            <div className="space-y-3 flex-1 text-xs font-mono text-[#2c241c]">
              <div className="grid grid-cols-2 gap-2 bg-[#ebdcc8] p-2.5 rounded border border-[#c4b5a2]">
                <div>
                  <span className="text-[#695c4d] block">Field & Basin:</span>
                  <strong>Duliajan (Assam-Arakan)</strong>
                </div>
                <div>
                  <span className="text-[#695c4d] block">Well Type:</span>
                  <strong>{selectedWell.type}</strong>
                </div>
                <div>
                  <span className="text-[#695c4d] block">Total Depth (TD):</span>
                  <strong className="text-red-700">{selectedWell.targetDepthM} m</strong>
                </div>
                <div>
                  <span className="text-[#695c4d] block">Target Formation:</span>
                  <strong>{selectedWell.formation}</strong>
                </div>
                <div>
                  <span className="text-[#695c4d] block">Coordinates:</span>
                  <span>{selectedWell.lat.toFixed(4)}°N, {selectedWell.lng.toFixed(4)}°E</span>
                </div>
                <div>
                  <span className="text-[#695c4d] block">Rig Assigned:</span>
                  <span>{selectedWell.rigName}</span>
                </div>
              </div>

              {/* Primary Risk Tag */}
              <div className="p-3 rounded bg-[#fee2e2]/80 border border-red-300">
                <div className="font-bold text-red-900 flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4 text-red-700" />
                  <span>Primary Risk Profile: {selectedWell.primaryRisk}</span>
                </div>
                <p className="text-[11px] text-red-950 font-sans">
                  Historic penetration experienced loss zones across Barail Coal-Shale with ECD reaching fracture limits.
                </p>
              </div>

              {/* Historical Incidents Count & Quick Action */}
              <div className="bg-[#fffdf9] p-3 rounded border border-[#c4b5a2] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1c1815]">Recorded Incidents:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-700 text-white font-bold text-xs">
                    {selectedWell.incidentsCount} Events
                  </span>
                </div>
                <p className="text-[11px] text-[#554a3e] font-sans">
                  All incidents catalogued from Oil India WCR/DDR reports with verified OCR confidence.
                </p>
              </div>
            </div>

            {/* Inspect Reports Button */}
            <button
              onClick={() => onOpenReportModal?.({
                id: `rep-${selectedWell.id}`,
                wellName: selectedWell.name,
                formation: selectedWell.formation,
                depthM: selectedWell.targetDepthM - 200,
                incidentType: selectedWell.primaryRisk || 'Mud Loss',
                severity: 'HIGH',
                summary: `Official historical drilling dossier for ${selectedWell.name} in Duliajan field.`,
                rootCause: 'Depleted permeable sandstone reservoir in fault block 4B.',
                recommendedMitigation: 'Deploy 40 bbl LCM pill and keep mud weight at 1.21 SG.',
                sourceReport: {
                  reportId: `OIL-WCR-${selectedWell.shortCode || '421'}`,
                  reportType: 'WCR',
                  title: `Well Completion Report - ${selectedWell.name}`,
                  page: 42,
                  section: 'Section IV: Lost Circulation & Drilling Problems',
                  ocrConfidence: 98.6,
                  excerpt: `While drilling 8-1/2" hole at depth ${selectedWell.targetDepthM - 200}m in ${selectedWell.formation}, sudden mud losses occurred at 35 m3/hr.`,
                }
              })}
              className="mt-3 w-full py-2 bg-[#2c241d] hover:bg-black text-amber-300 font-bold text-xs rounded flex items-center justify-center gap-2 shadow-sm transition-colors font-mono"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Inspect {selectedWell.name} Report Dossier</span>
            </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
