import PDFDocument from 'pdfkit';
import { IKundali } from '../model/kundali.model';

// Colors
const GOLD = '#C8A45A';
const DARK_MAROON = '#7B1A38';
const DARK_BG = '#1A0A14';
const LIGHT_BG = '#FDF8F0';
const BORDER = '#E8D5B0';
const TEXT_DARK = '#2C1810';
const TEXT_MUTED = '#8B7355';
const WHITE = '#FFFFFF';
const TABLE_ALT = '#F9F3E8';

// North Indian chart house positions in a 4×4 grid
// houses 5,6 are at row=2,3 col=3 and row=3,col=3
// Format: houseNumber → { row, col }
const NI_POSITIONS: Record<number, { row: number; col: number }> = {
  12: { row: 0, col: 0 },
  1:  { row: 0, col: 1 },
  2:  { row: 0, col: 2 },
  3:  { row: 0, col: 3 },
  4:  { row: 1, col: 3 },
  5:  { row: 2, col: 3 },
  6:  { row: 3, col: 3 },
  7:  { row: 3, col: 2 },
  8:  { row: 3, col: 1 },
  9:  { row: 3, col: 0 },
  10: { row: 2, col: 0 },
  11: { row: 1, col: 0 },
};

function drawNorthIndianChart(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number,
  lagnaSign: string,
  houses: Array<{ number: number; sign: string; planets: string[] }>,
  title: string
) {
  const cell = size / 4;

  // Title
  doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK_MAROON)
     .text(title, x, y - 18, { width: size, align: 'center' });

  // Draw 4×4 grid outer border
  doc.rect(x, y, size, size).strokeColor(GOLD).lineWidth(1.5).stroke();

  // Draw all internal grid lines
  doc.strokeColor(BORDER).lineWidth(0.5);
  for (let i = 1; i < 4; i++) {
    doc.moveTo(x + i * cell, y).lineTo(x + i * cell, y + size).stroke();
    doc.moveTo(x, y + i * cell).lineTo(x + size, y + i * cell).stroke();
  }

  // Fill center 2×2 with light background
  doc.rect(x + cell, y + cell, cell * 2, cell * 2)
     .fillColor('#F5EDE0').fill()
     .strokeColor(GOLD).lineWidth(1).stroke();

  // Center label
  doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK_MAROON)
     .text('VedicScan', x + cell + 2, y + cell + cell * 0.5 - 10, { width: cell * 2 - 4, align: 'center' })
     .font('Helvetica').fontSize(7).fillColor(TEXT_MUTED)
     .text('Birth Chart', x + cell + 2, y + cell + cell * 0.5 + 2, { width: cell * 2 - 4, align: 'center' });

  // Draw diagonal lines in center corners (for visual effect)
  doc.strokeColor(GOLD).lineWidth(0.8);
  // Top-left corner of center → diagonals
  doc.moveTo(x + cell, y + cell).lineTo(x + cell * 2, y + cell * 2).stroke();
  doc.moveTo(x + cell * 3, y + cell).lineTo(x + cell * 2, y + cell * 2).stroke();
  doc.moveTo(x + cell, y + cell * 3).lineTo(x + cell * 2, y + cell * 2).stroke();
  doc.moveTo(x + cell * 3, y + cell * 3).lineTo(x + cell * 2, y + cell * 2).stroke();

  // Fill each house cell
  for (const house of houses) {
    const pos = NI_POSITIONS[house.number];
    if (!pos) continue;

    const cx = x + pos.col * cell;
    const cy = y + pos.row * cell;

    // Highlight Lagna (House 1)
    if (house.number === 1) {
      doc.rect(cx, cy, cell, cell).fillColor('#FEF4E8').fill();
      doc.rect(cx, cy, cell, cell).strokeColor(GOLD).lineWidth(1.5).stroke();
    }

    // House number (top-left small)
    doc.font('Helvetica').fontSize(6).fillColor(TEXT_MUTED)
       .text(`H${house.number}`, cx + 3, cy + 3);

    // Sign name (center top)
    doc.font('Helvetica-Bold').fontSize(7).fillColor(TEXT_DARK)
       .text(house.sign.substring(0, 3).toUpperCase(), cx + 3, cy + 13, { width: cell - 6, align: 'center' });

    // Planets (below sign name)
    if (house.planets.length > 0) {
      const planetAbbr = house.planets.map(p => p.substring(0, 2)).join(' ');
      doc.font('Helvetica').fontSize(6.5).fillColor(DARK_MAROON)
         .text(planetAbbr, cx + 3, cy + 24, { width: cell - 6, align: 'center' });

      // Show full names if space allows
      if (house.planets.length <= 2) {
        doc.font('Helvetica').fontSize(6).fillColor(DARK_MAROON)
           .text(house.planets.join('\n'), cx + 3, cy + 34, { width: cell - 6, align: 'center' });
      }
    }
  }
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, y?: number) {
  const yPos = y ?? doc.y + 12;
  doc.rect(doc.page.margins.left, yPos, doc.page.width - doc.page.margins.left - doc.page.margins.right, 24)
     .fillColor(DARK_MAROON).fill();
  doc.font('Helvetica-Bold').fontSize(11).fillColor(WHITE)
     .text(title, doc.page.margins.left + 10, yPos + 6,
       { width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 20 });
  doc.moveDown(0.5);
}

function drawKeyValue(doc: PDFKit.PDFDocument, label: string, value: string, col1X: number, col2X: number) {
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(TEXT_MUTED)
     .text(label, col1X, y, { continued: false });
  doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_DARK)
     .text(value, col2X, y, { continued: false });
  doc.moveDown(0.4);
}

function ensureSpace(doc: PDFKit.PDFDocument, neededPx: number) {
  if (doc.y + neededPx > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

export function generateKundaliPDF(kundali: IKundali): Promise<Buffer> {
  return new Promise((resolve, reject) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 45, right: 45 },
    info: { Title: `Kundali Report — ${kundali.name}`, Author: 'VedicScan' },
  });

  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));
  doc.on('error', reject);

  const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const L = doc.page.margins.left;

  // ─── COVER PAGE ─────────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, doc.page.height).fillColor(DARK_BG).fill();

  // Top gold bar
  doc.rect(0, 0, doc.page.width, 6).fillColor(GOLD).fill();
  doc.rect(0, doc.page.height - 6, doc.page.width, 6).fillColor(GOLD).fill();

  doc.moveDown(4);
  doc.font('Helvetica').fontSize(12).fillColor(GOLD)
     .text('✦  VEDICSCAN  ✦', L, 80, { width: pageW, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(28).fillColor(WHITE)
     .text('Personal Kundali Report', L, 120, { width: pageW, align: 'center' });

  doc.font('Helvetica').fontSize(13).fillColor(GOLD)
     .text('Vedic Astrology • Lahiri Ayanamsa • Swiss Ephemeris', L, 162, { width: pageW, align: 'center' });

  // Divider
  doc.rect(L + 60, 192, pageW - 120, 1).fillColor(GOLD).fill();

  // Name
  doc.font('Helvetica-Bold').fontSize(24).fillColor(WHITE)
     .text(kundali.name, L, 210, { width: pageW, align: 'center' });

  // Birth Details Box
  doc.rect(L + 40, 255, pageW - 80, 110)
     .fillColor('#2A1228').fill()
     .strokeColor(GOLD).lineWidth(1).stroke();

  const bx = L + 60;
  const by = 272;
  const bw = (pageW - 80) / 2 - 20;
  const labelColor = '#C8A45A';
  const valColor = WHITE;

  const infoItems = [
    ['Date of Birth', kundali.dateOfBirth],
    ['Time of Birth', kundali.timeOfBirth],
    ['Place of Birth', kundali.placeOfBirth],
    ['Generated on', new Date(kundali.generatedAt).toLocaleDateString('en-IN')],
  ];
  infoItems.forEach(([label, val], i) => {
    const col = i % 2 === 0 ? bx : bx + bw + 40;
    const row = by + Math.floor(i / 2) * 38;
    doc.font('Helvetica').fontSize(8).fillColor(labelColor).text(label.toUpperCase(), col, row);
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(valColor).text(val, col, row + 12);
  });

  // Key Signs
  doc.rect(L + 40, 378, pageW - 80, 80)
     .fillColor('#1E0D1A').fill()
     .strokeColor(GOLD).lineWidth(0.8).stroke();

  const signs = [
    ['Lagna', kundali.lagna.sign, '↑'],
    ['Moon Sign', kundali.moonSign, '☽'],
    ['Sun Sign', kundali.sunSign, '☀'],
    ['Nakshatra', kundali.moonNakshatra, '✦'],
  ];
  const signW = (pageW - 80) / 4;
  signs.forEach(([label, val, sym], i) => {
    const sx = L + 40 + i * signW + signW / 2;
    doc.font('Helvetica').fontSize(16).fillColor(GOLD).text(sym, sx - 10, 392, { width: 20, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE).text(val, L + 40 + i * signW + 4, 416, { width: signW - 8, align: 'center' });
    doc.font('Helvetica').fontSize(7).fillColor(labelColor).text(label, L + 40 + i * signW + 4, 430, { width: signW - 8, align: 'center' });
  });

  doc.font('Helvetica').fontSize(8).fillColor(TEXT_MUTED)
     .text('This report is for spiritual guidance purposes only. Not medical or financial advice.', L, doc.page.height - 70, { width: pageW, align: 'center' });

  // ─── PAGE 2: BIRTH CHART ───────────────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 40).fillColor(DARK_MAROON).fill();
  doc.font('Helvetica-Bold').fontSize(14).fillColor(WHITE)
     .text('BIRTH CHART (D1) & NAVAMSA (D9)', L, 12, { width: pageW, align: 'center' });

  const chartSize = 220;
  const chartY = 60;

  // D1 Chart
  const housesArr = Array.isArray(kundali.houses)
    ? kundali.houses
    : Object.values(kundali.houses as any || {});

  drawNorthIndianChart(doc, L, chartY, chartSize, kundali.lagna.sign, housesArr as any, 'D1 — Rashi Chart (Birth Chart)');

  // D9 Navamsa Chart (to the right)
  const navamsa = kundali.navamsa;
  const navHouses: Array<{ number: number; sign: string; planets: string[] }> = [];
  const rashis = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const navLagnaIdx = rashis.indexOf(navamsa?.lagnaSign || 'Aries');

  for (let h = 1; h <= 12; h++) {
    const signIdx = (navLagnaIdx + h - 1) % 12;
    const sign = rashis[signIdx];
    const planetsInHouse = navamsa?.planets
      ? Object.entries(navamsa.planets as any).filter(([, p]: any) => p.houseNumber === h).map(([name]) => name)
      : [];
    navHouses.push({ number: h, sign, planets: planetsInHouse });
  }

  drawNorthIndianChart(doc, L + chartSize + 30, chartY, chartSize, navamsa?.lagnaSign || '', navHouses, 'D9 — Navamsa Chart');

  // Lagna details below charts
  doc.y = chartY + chartSize + 20;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_DARK)
     .text(`Lagna: ${kundali.lagna.sign} ${kundali.lagna.degree.toFixed(2)}°  |  Navamsa Lagna: ${navamsa?.lagnaSign || 'N/A'}  |  Moon Pada: ${kundali.moonPada}`, L, doc.y, { align: 'center', width: pageW });

  doc.moveDown(1);

  // ─── PAGE 3: PLANETARY POSITIONS ──────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 40).fillColor(DARK_MAROON).fill();
  doc.font('Helvetica-Bold').fontSize(14).fillColor(WHITE)
     .text('PLANETARY POSITIONS', L, 12, { width: pageW, align: 'center' });

  doc.y = 55;

  const colWidths = [70, 70, 75, 65, 40, 70];
  const headers = ['Planet', 'Sign (Rashi)', 'Nakshatra', 'Degree', 'House', 'Navamsa Sign'];

  // Table header
  let tx = L;
  doc.rect(L, doc.y, pageW, 22).fillColor(DARK_MAROON).fill();
  headers.forEach((h, i) => {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(WHITE)
       .text(h, tx + 4, doc.y + 7, { width: colWidths[i] - 4 });
    tx += colWidths[i];
  });
  doc.moveDown(0.3);
  doc.y += 14;

  const PLANET_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  let rowAlt = false;
  for (const pname of PLANET_ORDER) {
    const p = (kundali.planets as any)?.[pname] || (kundali.planets as any)?.get?.(pname);
    if (!p) continue;

    tx = L;
    const rowY = doc.y;
    if (rowAlt) {
      doc.rect(L, rowY, pageW, 20).fillColor(TABLE_ALT).fill();
    }
    rowAlt = !rowAlt;

    const cols = [
      pname,
      p.rashi || 'N/A',
      p.nakshatra || 'N/A',
      `${(p.degree || 0).toFixed(2)}°`,
      `${p.houseNumber || 'N/A'}`,
      p.navamsaSign || 'N/A',
    ];
    cols.forEach((val, i) => {
      doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(9).fillColor(TEXT_DARK)
         .text(val, tx + 4, rowY + 6, { width: colWidths[i] - 4 });
      tx += colWidths[i];
    });
    doc.y = rowY + 20;
  }

  doc.moveDown(1);

  // Houses Summary
  drawSectionHeader(doc, 'HOUSE PLACEMENTS');
  doc.y += 8;

  const houseRows: [string, string, string][] = (housesArr as any[]).map(h => [
    `House ${h.number}`,
    h.sign,
    h.planets?.join(', ') || '—',
  ]);

  let houseAlt = false;
  for (const [hNum, hSign, hPlanets] of houseRows) {
    const hy = doc.y;
    if (houseAlt) doc.rect(L, hy, pageW, 18).fillColor(TABLE_ALT).fill();
    houseAlt = !houseAlt;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEXT_DARK).text(hNum, L + 4, hy + 4, { width: 60 });
    doc.font('Helvetica').fontSize(8.5).fillColor(TEXT_DARK).text(hSign, L + 70, hy + 4, { width: 90 });
    doc.font('Helvetica').fontSize(8.5).fillColor(DARK_MAROON).text(hPlanets, L + 170, hy + 4, { width: pageW - 175 });
    doc.y = hy + 18;
  }

  // ─── PAGE 4: YOGAS & DOSHAS ───────────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 40).fillColor(DARK_MAROON).fill();
  doc.font('Helvetica-Bold').fontSize(14).fillColor(WHITE)
     .text('YOGAS & DOSHAS', L, 12, { width: pageW, align: 'center' });
  doc.y = 55;

  // Yogas
  drawSectionHeader(doc, '✦ AUSPICIOUS YOGAS IN YOUR CHART');
  doc.y += 8;
  const presentYogas = kundali.yogas.filter(y => y.isPresent);
  if (presentYogas.length === 0) {
    doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_MUTED)
       .text('No major yogas are formed in your birth chart. The chart shows a balanced energy.', L, doc.y, { width: pageW });
    doc.moveDown(1);
  } else {
    for (const yoga of presentYogas) {
      ensureSpace(doc, 70);
      doc.rect(L, doc.y, pageW, 20).fillColor('#FEF4E8').fill().strokeColor(GOLD).lineWidth(0.5).stroke();
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_MAROON)
         .text(`${yoga.name}  —  ${yoga.strength}`, L + 8, doc.y + 5, { width: pageW - 16 });
      doc.y += 22;
      doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK)
         .text(yoga.description, L + 8, doc.y, { width: pageW - 16 });
      doc.moveDown(0.8);
    }
  }

  doc.moveDown(0.5);

  // Doshas
  drawSectionHeader(doc, '⚠ DOSHAS & KARMIC PATTERNS');
  doc.y += 8;

  const presentDoshas = kundali.doshas.filter(d => d.isPresent);
  if (presentDoshas.length === 0) {
    doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_MUTED)
       .text('No significant doshas found in your chart. This is a highly auspicious indication.', L, doc.y, { width: pageW });
    doc.moveDown(1);
  } else {
    for (const dosha of presentDoshas) {
      ensureSpace(doc, 90);
      const sevColor = dosha.severity === 'High' ? '#8B0000' : dosha.severity === 'Medium' ? '#7B4F00' : DARK_MAROON;
      doc.rect(L, doc.y, pageW, 20).fillColor('#FFF5F5').fill().strokeColor('#DFA0A0').lineWidth(0.5).stroke();
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(sevColor)
         .text(`${dosha.name}  —  Severity: ${dosha.severity}`, L + 8, doc.y + 5, { width: pageW - 16 });
      doc.y += 22;
      doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK)
         .text(dosha.description, L + 8, doc.y, { width: pageW - 16 });
      doc.moveDown(0.5);
      if (dosha.remedy) {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK_MAROON).text('Remedy: ', L + 8, doc.y, { continued: true });
        doc.font('Helvetica').fontSize(8.5).fillColor(TEXT_DARK).text(dosha.remedy, { width: pageW - 20 });
      }
      doc.moveDown(0.8);
    }
  }

  // ─── PAGE 5: DASHA TIMELINE ───────────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 40).fillColor(DARK_MAROON).fill();
  doc.font('Helvetica-Bold').fontSize(14).fillColor(WHITE)
     .text('VIMSHOTTARI DASHA ANALYSIS', L, 12, { width: pageW, align: 'center' });
  doc.y = 55;

  // Current periods box
  doc.rect(L, doc.y, pageW, 70).fillColor(LIGHT_BG).fill().strokeColor(GOLD).lineWidth(1).stroke();
  const d = kundali.dasha;
  const bY = doc.y + 10;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK_MAROON)
     .text('CURRENT PLANETARY PERIODS', L + 10, bY, { width: pageW - 20, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_MUTED).text('Mahadasha:', L + 10, bY + 18);
  doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK).text(`${d.currentMahadasha}  (${d.mahadashaStartDate} → ${d.mahadashaEndDate})`, L + 90, bY + 18);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_MUTED).text('Antardasha:', L + 10, bY + 32);
  doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK).text(`${d.currentAntardasha}  (${d.antardashaStartDate} → ${d.antardashaEndDate})`, L + 90, bY + 32);
  if (d.currentPratyantar) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_MUTED).text('Pratyantar:', L + 10, bY + 46);
    doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK).text(`${d.currentPratyantar}  (ends ${d.pratyantarEndDate})`, L + 90, bY + 46);
  }
  doc.y += 80;

  // Mahadasha timeline table
  drawSectionHeader(doc, 'MAHADASHA TIMELINE');
  doc.y += 8;

  const mdHeaders = ['Mahadasha (Planet)', 'Start Date', 'End Date', 'Duration', 'Status'];
  const mdWidths = [130, 80, 80, 65, 60];
  let mdX = L;
  doc.rect(L, doc.y, pageW, 20).fillColor(DARK_MAROON).fill();
  mdHeaders.forEach((h, i) => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE)
       .text(h, mdX + 4, doc.y + 6, { width: mdWidths[i] - 4 });
    mdX += mdWidths[i];
  });
  doc.y += 20;

  let mdAlt = false;
  for (const md of (d.timeline || []).slice(0, 18)) {
    ensureSpace(doc, 20);
    const mdY = doc.y;
    if (mdAlt) doc.rect(L, mdY, pageW, 18).fillColor(TABLE_ALT).fill();
    if (md.isCurrent) doc.rect(L, mdY, pageW, 18).fillColor('#FFF8E8').fill();
    mdAlt = !mdAlt;

    mdX = L;
    const mdYear = Math.round(
      (new Date(md.endDate).getTime() - new Date(md.startDate).getTime()) / (365.25 * 24 * 3600 * 1000)
    );
    const mCols = [
      md.isCurrent ? `► ${md.planet}` : md.planet,
      md.startDate,
      md.endDate,
      `${mdYear} yrs`,
      md.isCurrent ? 'Active' : '',
    ];
    mCols.forEach((val, i) => {
      doc.font(md.isCurrent ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(8.5)
         .fillColor(md.isCurrent ? DARK_MAROON : TEXT_DARK)
         .text(val, mdX + 4, mdY + 4, { width: mdWidths[i] - 4 });
      mdX += mdWidths[i];
    });
    doc.y = mdY + 18;
  }

  // Current MD Antardasha table
  const currentMD = d.timeline?.find(m => m.isCurrent);
  if (currentMD?.antardashas?.length) {
    doc.moveDown(1);
    ensureSpace(doc, 200);
    drawSectionHeader(doc, `ANTARDASHA IN ${currentMD.planet.toUpperCase()} MAHADASHA`);
    doc.y += 8;

    const adHeaders = ['Antardasha', 'Start Date', 'End Date', 'Status'];
    const adWidths = [140, 100, 100, 80];
    let adX = L;
    doc.rect(L, doc.y, pageW, 20).fillColor(DARK_MAROON).fill();
    adHeaders.forEach((h, i) => {
      doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE)
         .text(h, adX + 4, doc.y + 6, { width: adWidths[i] - 4 });
      adX += adWidths[i];
    });
    doc.y += 20;

    let adAlt = false;
    for (const ad of currentMD.antardashas) {
      ensureSpace(doc, 18);
      const adY = doc.y;
      if (adAlt) doc.rect(L, adY, pageW, 18).fillColor(TABLE_ALT).fill();
      if (ad.isCurrent) doc.rect(L, adY, pageW, 18).fillColor('#FFF8E8').fill();
      adAlt = !adAlt;
      adX = L;
      [ad.isCurrent ? `► ${ad.planet}` : ad.planet, ad.startDate, ad.endDate, ad.isCurrent ? 'Active' : ''].forEach((val, i) => {
        doc.font(ad.isCurrent ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(8.5).fillColor(ad.isCurrent ? DARK_MAROON : TEXT_DARK)
           .text(val, adX + 4, adY + 4, { width: adWidths[i] - 4 });
        adX += adWidths[i];
      });
      doc.y = adY + 18;
    }
  }

  // ─── PAGE 6+: LIFE ANALYSIS ───────────────────────────────────────────────
  const sections: Array<{ title: string; key: keyof IKundali['interpretations'] }> = [
    { title: 'PERSONALITY ANALYSIS', key: 'personality' },
    { title: 'CAREER & PROFESSION', key: 'career' },
    { title: 'FINANCIAL OUTLOOK', key: 'finance' },
    { title: 'MARRIAGE & RELATIONSHIPS', key: 'marriage' },
    { title: 'HEALTH & WELL-BEING', key: 'health' },
    { title: 'EDUCATION & INTELLECT', key: 'education' },
    { title: 'CHILDREN & CREATIVITY', key: 'children' },
    { title: 'SPIRITUALITY & LIBERATION', key: 'spirituality' },
  ];

  const interp = kundali.interpretations as any;

  doc.addPage();
  doc.rect(0, 0, doc.page.width, 40).fillColor(DARK_MAROON).fill();
  doc.font('Helvetica-Bold').fontSize(14).fillColor(WHITE)
     .text('LIFE ANALYSIS & INSIGHTS', L, 12, { width: pageW, align: 'center' });
  doc.y = 55;

  for (const { title, key } of sections) {
    const text = interp?.[key] || '';
    if (!text) continue;

    ensureSpace(doc, 80);
    drawSectionHeader(doc, title);
    doc.y += 8;
    doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_DARK).lineGap(3)
       .text(text, L, doc.y, { width: pageW, align: 'justify' });
    doc.moveDown(0.8);
  }

  // Strengths & Challenges
  ensureSpace(doc, 100);
  drawSectionHeader(doc, 'STRENGTHS & CHALLENGES');
  doc.y += 8;

  const midX = L + pageW / 2 + 10;
  const startY = doc.y;

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1A5C1A').text('Natural Strengths', L, doc.y);
  doc.y += 16;
  for (const s of (interp?.strengths || [])) {
    doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK).text(`✓  ${s}`, L + 8, doc.y, { width: pageW / 2 - 20 });
    doc.moveDown(0.4);
  }

  const endY = doc.y;
  doc.y = startY;
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#8B0000').text('Areas to Work On', midX, doc.y);
  doc.y += 16;
  for (const c of (interp?.challenges || [])) {
    doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK).text(`→  ${c}`, midX + 8, doc.y, { width: pageW / 2 - 20 });
    doc.moveDown(0.4);
  }
  doc.y = Math.max(doc.y, endY) + 10;

  // ─── LAST PAGE: RECOMMENDATIONS ──────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 40).fillColor(DARK_MAROON).fill();
  doc.font('Helvetica-Bold').fontSize(14).fillColor(WHITE)
     .text('VEDIC RECOMMENDATIONS', L, 12, { width: pageW, align: 'center' });
  doc.y = 55;

  const recSections = [
    { title: '✦ MANTRAS', items: interp?.mantras || [], note: 'Chant 108 times daily or on the prescribed day.' },
    { title: '◈ GEMSTONES', items: interp?.gemstones || [], note: 'Wear after proper energization by a learned astrologer. Consult before wearing.' },
    { title: '✧ FASTING RECOMMENDATIONS', items: interp?.fastingDays || [], note: 'Observing fast invokes planetary blessings.' },
    { title: '❋ CHARITY & SERVICE', items: interp?.charities || [], note: 'Regular charity neutralizes negative karmic patterns.' },
  ];

  for (const { title, items, note } of recSections) {
    ensureSpace(doc, 80);
    drawSectionHeader(doc, title);
    doc.y += 8;
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(TEXT_MUTED).text(note, L, doc.y, { width: pageW });
    doc.moveDown(0.5);
    for (const item of items) {
      doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_DARK).text(`•  ${item}`, L + 8, doc.y, { width: pageW - 16 });
      doc.moveDown(0.5);
    }
    doc.moveDown(0.5);
  }

  // Disclaimer
  doc.moveDown(1);
  doc.rect(L, doc.y, pageW, 50).fillColor('#F5EDE0').fill().strokeColor(BORDER).lineWidth(0.5).stroke();
  doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK_MAROON)
     .text('IMPORTANT DISCLAIMER', L + 10, doc.y + 8, { width: pageW - 20, align: 'center' });
  doc.font('Helvetica').fontSize(7.5).fillColor(TEXT_MUTED)
     .text('This Kundali report is provided for spiritual guidance and self-understanding only. It is NOT medical advice, financial advice, or legal advice. Astrological interpretations are symbolic and traditional in nature. VedicScan does not guarantee outcomes based on this report.', L + 10, doc.y + 20, { width: pageW - 20, align: 'center' });

  doc.on('end', () => resolve(Buffer.concat(buffers)));
  doc.end();
  }); // end Promise
}
