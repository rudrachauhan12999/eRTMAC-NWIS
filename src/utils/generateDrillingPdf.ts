import { jsPDF } from 'jspdf';
import { ACTIVE_WELL, NEARBY_WELLS, PREDICTIVE_ALERTS } from '../data/wellsData.ts';

export interface DrillingSummaryPdfOptions {
  currentDepthM?: number;
  mudWeightSG?: number;
  activeFormation?: string;
  engineerName?: string;
  notes?: string;
}

export async function generateDrillingSummaryPdf(options: DrillingSummaryPdfOptions = {}): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const depth = options.currentDepthM ?? ACTIVE_WELL.depthM;
  const mudWeight = options.mudWeightSG ?? 1.24;
  const formation = options.activeFormation ?? ACTIVE_WELL.formation;
  const engineerName = options.engineerName || 'Er. R. Chauhan (Lead Drilling Engineer)';
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Try to load the Oil India logo image as data url
  try {
    const imgResp = await fetch('/oil_india_logo.png');
    if (imgResp.ok) {
      const blob = await imgResp.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      // Add logo image at top left: width 15mm, height 22mm
      doc.addImage(base64, 'PNG', margin, y - 2, 16, 22);
    }
  } catch (e) {
    console.warn('Could not embed logo image in PDF', e);
  }

  // Header Typography
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(139, 30, 34); // Oil India Maroon
  doc.text('OIL INDIA LIMITED', margin + 20, y + 4);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 40, 30);
  doc.text('DIRECTORATE OF DRILLING & SUBSURFACE OPERATIONS • DULIAJAN, ASSAM', margin + 20, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 90, 80);
  doc.text('eRTMAC-NWIS Autonomous Institutional Memory & Cross-Well Correlation', margin + 20, y + 13);
  doc.text('A Maharatna / Govt. of India Enterprise | Assam-Arakan Basin Division', margin + 20, y + 17);

  // Top Right Info Box
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 50, 40);
  doc.text(`DOC REF: OIL/DRL/DS-${dateStr.replace(/ /g, '')}`, pageWidth - margin, y + 4, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`DATE: ${dateStr} ${timeStr} IST`, pageWidth - margin, y + 8, { align: 'right' });
  doc.text('RIG: OIL-E2000 (2000 HP Cyber)', pageWidth - margin, y + 12, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 40, 40);
  doc.text('CLASSIFICATION: CONFIDENTIAL / RESTRICTED', pageWidth - margin, y + 16, { align: 'right' });

  y += 24;

  // Horizontal Accent Divider
  doc.setDrawColor(139, 30, 34);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Title Banner
  doc.setFillColor(245, 237, 225);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 30, 20);
  doc.text('DAILY DRILLING & GEOMECHANICAL SUMMARY REPORT (24-HR CYCLE)', margin + 3, y + 5.5);
  y += 11;

  // SECTION 1: WELLBORE PROFILE & DRILL RIG HEADER (Two-column key-value grid)
  const drawSectionHeader = (title: string, sectionNum: string) => {
    doc.setFillColor(60, 50, 40);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(250, 240, 220);
    doc.text(`${sectionNum}. ${title}`, margin + 3, y + 4.2);
    y += 7.5;
  };

  drawSectionHeader('WELLBORE PROFILE & CURRENT STATUS', '1');

  const col1W = 90;
  const col2W = contentWidth - col1W;

  const headerDataLeft = [
    ['Well Name', ACTIVE_WELL.name],
    ['Rig ID / Type', `${ACTIVE_WELL.rigName} (2,000 HP Cyber Rig)`],
    ['Field / Basin', 'Duliajan Greater Oilfield, Assam-Arakan Basin'],
    ['Spud Date', ACTIVE_WELL.spudDate],
    ['Target Formation', 'Eocene Kopili / Tipam Sandstone'],
  ];

  const progressPct = Math.round((depth / ACTIVE_WELL.targetDepthM) * 100);
  const headerDataRight = [
    ['Current Bit Depth (MD)', `${depth.toLocaleString()} m (${(depth * 3.28084).toFixed(0)} ft)`],
    ['Planned Target Depth (TD)', `${ACTIVE_WELL.targetDepthM.toLocaleString()} m (${progressPct}% completed)`],
    ['Current Stratigraphy', formation],
    ['Operational Status', 'DRILLING AHEAD - ROTARY WITH BHA-04'],
    ['Active Mud System', 'High-Temp Potassium Formate / Polymer (K-Poly)'],
  ];

  const renderKeyValueTable = (x: number, width: number, data: string[][]) => {
    let rowY = y;
    data.forEach(([key, val]) => {
      doc.setFillColor(248, 244, 238);
      doc.rect(x, rowY, width, 5, 'F');
      doc.setDrawColor(210, 200, 185);
      doc.setLineWidth(0.2);
      doc.rect(x, rowY, width, 5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(90, 75, 60);
      doc.text(key, x + 2, rowY + 3.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 15, 10);
      doc.text(val, x + width - 2, rowY + 3.5, { align: 'right' });
      rowY += 5;
    });
    return rowY;
  };

  const nextY1 = renderKeyValueTable(margin, col1W - 2, headerDataLeft);
  const nextY2 = renderKeyValueTable(margin + col1W, col2W, headerDataRight);
  y = Math.max(nextY1, nextY2) + 3;

  // SECTION 2: REAL-TIME DRILLING TELEMETRY & FLUID MECHANICS
  drawSectionHeader('REAL-TIME DRILLING TELEMETRY & FLUID HYDRAULICS', '2');

  const telemetryMetrics = [
    { label: 'Active Mud Density', value: `${mudWeight.toFixed(2)} SG`, sub: 'Target: 1.21 - 1.23 SG' },
    { label: 'Pore Pressure Gradient', value: '1.20 SG', sub: 'Barail Gas Sand' },
    { label: 'Fracture Pressure', value: '1.23 SG', sub: 'Depleted Sand LOT' },
    { label: 'Circulating ECD', value: `${(mudWeight + 0.03).toFixed(2)} SG`, sub: '@ 3,500m TVD' },
    { label: 'Rate of Penetration (ROP)', value: '12.4 m/hr', sub: 'Avg 12.1 m/hr' },
    { label: 'Weight on Bit (WOB)', value: '18.5 klbs', sub: 'Limit: 24 klbs' },
    { label: 'Rotary Speed', value: '88 RPM', sub: 'Torque: 14.2 kft-lb' },
    { label: 'Standpipe Pressure', value: '2,450 psi', sub: 'Pump Rate: 420 gpm' },
  ];

  const cardW = (contentWidth - 6) / 4;
  const cardH = 12;

  telemetryMetrics.forEach((m, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const cx = margin + col * (cardW + 2);
    const cy = y + row * (cardH + 2);

    doc.setFillColor(252, 250, 245);
    doc.rect(cx, cy, cardW, cardH, 'F');
    doc.setDrawColor(190, 180, 165);
    doc.setLineWidth(0.2);
    doc.rect(cx, cy, cardW, cardH, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(110, 95, 80);
    doc.text(m.label, cx + 2, cy + 3.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(25, 20, 15);
    doc.text(m.value, cx + 2, cy + 7.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(130, 80, 30);
    doc.text(m.sub, cx + 2, cy + 10.8);
  });

  y += 2 * (cardH + 2) + 3;

  // SECTION 3: GEOMECHANICAL HAZARD AUDIT & NEARBY WELL CORRELATIONS
  drawSectionHeader('PREDICTIVE RISK MATRIX (BAYESIAN OFFSET CORRELATION)', '3');

  // Table header
  doc.setFillColor(235, 220, 200);
  doc.rect(margin, y, contentWidth, 5, 'F');
  doc.setDrawColor(160, 145, 130);
  doc.rect(margin, y, contentWidth, 5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(40, 30, 20);
  doc.text('IDENTIFIED DRILLING HAZARD', margin + 2, y + 3.5);
  doc.text('SEVERITY', margin + 60, y + 3.5);
  doc.text('PROBABILITY', margin + 82, y + 3.5);
  doc.text('CORRELATED OFFSET WELL', margin + 108, y + 3.5);
  doc.text('TRIGGER MECHANISM & GEOMECHANICS', margin + 145, y + 3.5);
  y += 5;

  const hazardRows = [
    {
      name: 'Lost Circulation / Fracturing',
      severity: mudWeight > 1.23 ? 'CRITICAL' : 'HIGH',
      prob: `${(mudWeight > 1.23 ? 88.5 : 61.4).toFixed(1)}%`,
      well: 'NWIS-Calire-02 (1.4 km Updip)',
      cause: `Mud weight (${mudWeight.toFixed(2)} SG) exceeds depleted sand fracture limit (1.22 SG)`,
    },
    {
      name: 'Gas Kick / Influx Trigger',
      severity: mudWeight < 1.20 ? 'CRITICAL' : 'LOW',
      prob: `${(mudWeight < 1.20 ? 76.2 : 11.2).toFixed(1)}%`,
      well: 'NWIS-Colive-04 (2.1 km West)',
      cause: `Pore pressure (1.20 SG) vs current hydrostatic head (${mudWeight.toFixed(2)} SG)`,
    },
    {
      name: 'Differential Stuck Pipe',
      severity: 'MEDIUM',
      prob: '44.8%',
      well: 'NWIS-Colve-02 (2.8 km NE)',
      cause: 'Differential overbalance: 0.04 SG across depleted permeable Barail coal seam',
    },
    {
      name: 'Torque Spikes & Stick-Slip',
      severity: 'HIGH',
      prob: '85.0%',
      well: 'NWIS-Active-02 (4.5 km South)',
      cause: 'Brittle cleat micro-spalling in 3,450-3,600m interval causing ledging',
    },
  ];

  hazardRows.forEach((row, i) => {
    const rowH = 6;
    doc.setFillColor(i % 2 === 0 ? 255 : 248, 245, 240);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setDrawColor(210, 200, 185);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, rowH, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 15, 10);
    doc.text(row.name, margin + 2, y + 4.2);

    // Severity badge color
    if (row.severity === 'CRITICAL') doc.setTextColor(190, 20, 20);
    else if (row.severity === 'HIGH') doc.setTextColor(180, 80, 10);
    else doc.setTextColor(20, 100, 40);
    doc.text(row.severity, margin + 60, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 25, 20);
    doc.text(row.prob, margin + 82, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(50, 45, 40);
    doc.text(row.well, margin + 108, y + 4.2);

    doc.text(row.cause, margin + 145, y + 4.2, { maxWidth: contentWidth - 147 });
    y += rowH;
  });

  y += 4;

  // SECTION 4: REQUIRED OPERATIONAL ACTIONS & FIELD PROTOCOLS
  drawSectionHeader('MANDATORY RIG SITE MITIGATION DIRECTIVES (OIL-SOP-DRL-04)', '4');

  const directives = [
    'Mud Weight Optimization: Regulate active mud density to 1.21 - 1.22 SG to prevent exceeding 1.23 SG fracture gradient.',
    'Standby Loss Material: Keep 45 bbl of coarse calcium carbonate (LCM) pill pre-mixed on active pit #3.',
    'Flow Check Protocols: Execute 10-minute flow check at every drill pipe connection while in Barail Coal-Shale interval.',
    'Rotational Limits: Limit stationary survey time to < 3 minutes. Maintain continuous string rotation to prevent differential sticking.',
    'BOP Accumulator Readiness: Verify BOP accumulator pressure (> 3,000 psi) and choke manifold calibration once per tour.',
  ];

  directives.forEach((text, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(139, 30, 34);
    doc.text(`[4.${i + 1}]`, margin + 2, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 25, 20);
    doc.text(text, margin + 12, y + 3.8);
    y += 5;
  });

  y += 4;

  // SECTION 5: SIGN-OFF & OPERATIONAL HANDOVER BLOCK
  drawSectionHeader('OFFICIAL VERIFICATION & TOUR HANDOVER SIGN-OFF', '5');

  const signW = contentWidth / 3;
  const signH = 18;

  const signers = [
    { role: 'LEAD DRILLING ENGINEER', name: engineerName, status: 'VERIFIED & DIGITALLY TRANSMITTED' },
    { role: 'RIG SUPERINTENDENT (OIL-E2000)', name: 'Sh. K. Gogoi (Senior Toolpusher)', status: 'OPERATIONAL PROTOCOLS ACKNOWLEDGED' },
    { role: 'DIRECTORATE OF DRILLING HQ', name: 'Drilling Operation Center (Duliajan)', status: 'TELEMETRY SYNCED TO eRTMAC' },
  ];

  signers.forEach((s, idx) => {
    const sx = margin + idx * signW;
    doc.setFillColor(250, 246, 240);
    doc.rect(sx, y, signW, signH, 'F');
    doc.setDrawColor(180, 165, 150);
    doc.setLineWidth(0.2);
    doc.rect(sx, y, signW, signH, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(90, 75, 60);
    doc.text(s.role, sx + 2, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 15, 10);
    doc.text(s.name, sx + 2, y + 8.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(30, 120, 50);
    doc.text(`Status: ${s.status}`, sx + 2, y + 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(140, 130, 120);
    doc.text(`Signed: ${dateStr} ${timeStr}`, sx + 2, y + 15.8);
  });

  y += signH + 4;

  // Bottom Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 120, 110);
  doc.text('Oil India Limited • Directorate of Drilling Operations • Field HQ: Duliajan, Dibrugarh, Assam 786602', margin, 297 - 8);
  doc.text('Page 1 of 1 • System Generated by eRTMAC-NWIS Geomechanical Intelligence Engine', pageWidth - margin, 297 - 8, { align: 'right' });

  // Save the PDF
  const filename = `OIL_Drilling_Summary_${ACTIVE_WELL.name}_${dateStr.replace(/ /g, '_')}.pdf`;
  doc.save(filename);
}
