import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { IKundali } from '../model/kundali.model';

// Logo image — prefer PNG (transparent), fall back to JPEG
const LOGO_PATH = (() => {
  const png  = path.join(__dirname, '../../../../assets/logo.png');
  const jpeg = path.join(__dirname, '../../../../assets/logo.jpeg');
  if (fs.existsSync(png))  return png;
  if (fs.existsSync(jpeg)) return jpeg;
  return null;
})();

/* ────────────────────────────────────────────────────────────────────────
   VedicScan — Kundali Report Generator (v2)
   Drop-in replacement for generateKundaliPDF.
   Zero new dependencies: uses PDFKit's built-in Times/Helvetica families and
   vector-drawn ornaments, so it renders identically on any server.
   ──────────────────────────────────────────────────────────────────────── */

/* ── Palette ───────────────────────────────────────────────────────────── */
const C = {
  gold:       '#C8A45A',
  goldLight:  '#E6CE94',
  goldDeep:   '#A07C32',
  maroon:     '#6E142F',
  maroonDeep: '#4A0C1F',
  ink:        '#2C1810',
  inkSoft:    '#5A4636',
  muted:      '#8B7355',
  cream:      '#FDF8EF',
  creamAlt:   '#F7EEDD',
  card:       '#FBF4E6',
  rule:       '#E3D2AE',
  night:      '#1A0A14',
  nightAlt:   '#2A1228',
  white:      '#FFFFFF',
  green:      '#1F6B33',
  red:        '#8E1B1B',
};

/* ── Fonts (serif for prose/headings, sans for data) ───────────────────── */
const SERIF = 'Times-Roman';
const SERIF_B = 'Times-Bold';
const SERIF_I = 'Times-Italic';
const SANS = 'Helvetica';
const SANS_B = 'Helvetica-Bold';

const PLANET_ABBR: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju',
  Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};
const RASHIS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PLANET_ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

type Doc = PDFKit.PDFDocument;

/* ════════════════════════════════════════════════════════════════════════
   VECTOR ORNAMENTS  (always render — no glyph/font dependency)
   ════════════════════════════════════════════════════════════════════════ */

function star(doc: Doc, cx: number, cy: number, r: number, color: string, points = 8) {
  const inner = r * 0.42;
  doc.save();
  let started = false;
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (!started) { doc.moveTo(px, py); started = true; } else { doc.lineTo(px, py); }
  }
  doc.closePath().fillColor(color).fill();
  doc.restore();
}

function diamondDot(doc: Doc, cx: number, cy: number, r: number, color: string) {
  doc.save();
  doc.moveTo(cx, cy - r).lineTo(cx + r, cy).lineTo(cx, cy + r).lineTo(cx - r, cy)
     .closePath().fillColor(color).fill();
  doc.restore();
}

/* Ornamental divider: a centred line broken by a small diamond + flanking dots */
function divider(doc: Doc, cx: number, y: number, halfWidth: number, color = C.gold) {
  doc.save();
  doc.lineWidth(0.8).strokeColor(color);
  doc.moveTo(cx - halfWidth, y).lineTo(cx - 14, y).stroke();
  doc.moveTo(cx + 14, y).lineTo(cx + halfWidth, y).stroke();
  diamondDot(doc, cx, y, 4, color);
  diamondDot(doc, cx - 22, y, 1.6, color);
  diamondDot(doc, cx + 22, y, 1.6, color);
  doc.restore();
}

/* Lotus-petal rosette used on the cover */
function lotus(doc: Doc, cx: number, cy: number, r: number, color: string, petals = 8) {
  doc.save();
  doc.lineWidth(1).strokeColor(color);
  for (let i = 0; i < petals; i++) {
    const a = (Math.PI * 2 / petals) * i;
    const tipX = cx + Math.cos(a) * r;
    const tipY = cy + Math.sin(a) * r;
    const c1x = cx + Math.cos(a - 0.32) * r * 0.62;
    const c1y = cy + Math.sin(a - 0.32) * r * 0.62;
    const c2x = cx + Math.cos(a + 0.32) * r * 0.62;
    const c2y = cy + Math.sin(a + 0.32) * r * 0.62;
    doc.moveTo(cx, cy).quadraticCurveTo(c1x, c1y, tipX, tipY)
       .quadraticCurveTo(c2x, c2y, cx, cy).stroke();
  }
  doc.circle(cx, cy, r * 0.22).fillColor(color).fill();
  doc.restore();
}

/* Concentric mandala ring for the cover */
function mandala(doc: Doc, cx: number, cy: number, r: number) {
  doc.save();
  doc.lineWidth(0.8).strokeColor(C.gold).circle(cx, cy, r).stroke();
  doc.lineWidth(0.5).strokeColor(C.goldDeep).circle(cx, cy, r * 0.82).stroke();
  // outer ticks
  const ticks = 48;
  doc.lineWidth(0.5).strokeColor(C.gold);
  for (let i = 0; i < ticks; i++) {
    const a = (Math.PI * 2 / ticks) * i;
    doc.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
       .lineTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9).stroke();
  }
  lotus(doc, cx, cy, r * 0.58, C.gold, 12);
  doc.restore();
}

/* Corner flourish (quarter ornament). corner: 'tl'|'tr'|'bl'|'br' */
function cornerFlourish(doc: Doc, x: number, y: number, s: number, corner: string, color = C.gold) {
  doc.save();
  doc.lineWidth(1).strokeColor(color);
  const fx = corner.includes('r') ? -1 : 1;
  const fy = corner.includes('b') ? -1 : 1;
  doc.translate(x, y).scale(fx, fy);
  doc.moveTo(0, s).quadraticCurveTo(0, 0, s, 0).stroke();
  doc.moveTo(4, s).quadraticCurveTo(4, 4, s, 4).stroke();
  diamondDot(doc, s * 0.5, s * 0.5, 2.4, color);
  doc.circle(2.5, 2.5, 1.6).fillColor(color).fill();
  doc.restore();
}

/* Small celestial symbols drawn as vectors (sun / crescent / ascendant / star) */
function symbol(doc: Doc, kind: string, cx: number, cy: number, r: number, color: string) {
  doc.save();
  if (kind === 'sun') {
    doc.lineWidth(1.2).strokeColor(color).circle(cx, cy, r * 0.55).stroke();
    doc.circle(cx, cy, 1.2).fillColor(color).fill();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 / 8) * i;
      doc.moveTo(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72)
         .lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r).lineWidth(1).strokeColor(color).stroke();
    }
  } else if (kind === 'moon') {
    doc.circle(cx, cy, r * 0.7).fillColor(color).fill();
    doc.circle(cx + r * 0.32, cy - r * 0.1, r * 0.62).fillColor(C.nightAlt).fill();
  } else if (kind === 'asc') {
    doc.lineWidth(1.4).strokeColor(color);
    doc.moveTo(cx, cy + r * 0.7).lineTo(cx, cy - r * 0.7).stroke();
    doc.moveTo(cx - r * 0.45, cy - r * 0.2).lineTo(cx, cy - r * 0.7).lineTo(cx + r * 0.45, cy - r * 0.2).stroke();
  } else {
    star(doc, cx, cy, r * 0.85, color, 6);
  }
  doc.restore();
}

/* ════════════════════════════════════════════════════════════════════════
   NORTH INDIAN DIAMOND CHART  (authentic layout)
   ════════════════════════════════════════════════════════════════════════ */

// Text-anchor positions for the 12 fixed houses, as fractions of the square.
const NI: Record<number, [number, number]> = {
  1:  [0.50, 0.235], 2:  [0.255, 0.115], 3:  [0.115, 0.255], 4:  [0.235, 0.50],
  5:  [0.115, 0.745], 6:  [0.255, 0.885], 7:  [0.50, 0.765], 8:  [0.745, 0.885],
  9:  [0.885, 0.745], 10: [0.765, 0.50], 11: [0.885, 0.255], 12: [0.745, 0.115],
};

function drawNorthIndianChart(
  doc: Doc, x: number, y: number, size: number,
  houses: Array<{ number: number; sign: string; planets: string[] }>,
  title: string,
  retroSet: Set<string> = new Set(),
) {
  const S = size;
  const mid = S / 2;

  // Title
  doc.font(SERIF_B).fontSize(10.5).fillColor(C.maroon)
     .text(title, x, y - 20, { width: S, align: 'center' });

  // Soft parchment fill behind the chart
  doc.rect(x, y, S, S).fill(C.cream);

  // Outer frame (double line)
  doc.lineWidth(2).strokeColor(C.gold).rect(x, y, S, S).stroke();
  doc.lineWidth(0.6).strokeColor(C.goldDeep).rect(x + 3.5, y + 3.5, S - 7, S - 7).stroke();

  // Diagonals + inner diamond
  doc.lineWidth(0.9).strokeColor(C.gold);
  doc.moveTo(x, y).lineTo(x + S, y + S).stroke();
  doc.moveTo(x + S, y).lineTo(x, y + S).stroke();
  doc.moveTo(x + mid, y).lineTo(x + S, y + mid)
     .lineTo(x + mid, y + S).lineTo(x, y + mid).closePath().stroke();

  // Centre seal
  doc.save();
  diamondDot(doc, x + mid, y + mid, 13, C.creamAlt);
  doc.lineWidth(0.8).strokeColor(C.goldDeep);
  doc.moveTo(x + mid, y + mid - 13).lineTo(x + mid + 13, y + mid)
     .lineTo(x + mid, y + mid + 13).lineTo(x + mid - 13, y + mid).closePath().stroke();
  star(doc, x + mid, y + mid, 5, C.gold, 8);
  doc.restore();

  // House contents
  for (const h of houses) {
    const pos = NI[h.number];
    if (!pos) continue;
    const cx = x + pos[0] * S;
    const cy = y + pos[1] * S;
    const lagna = h.number === 1;

    // Rashi number (small, muted) just above the anchor
    const rNum = RASHIS.indexOf(h.sign) + 1;
    doc.font(SANS).fontSize(6).fillColor(lagna ? C.maroon : C.muted)
       .text(rNum > 0 ? String(rNum) : '', cx - 18, cy - 16, { width: 36, align: 'center' });

    // Planets (primary content of a North-Indian house)
    if (h.planets.length) {
      const labels = h.planets.map(p => {
        const ab = PLANET_ABBR[p] || p.slice(0, 2);
        return retroSet.has(p) ? `${ab}(R)` : ab;
      });
      // wrap to max 3 per line
      const lines: string[] = [];
      for (let i = 0; i < labels.length; i += 3) lines.push(labels.slice(i, i + 3).join(' '));
      doc.font(SANS_B).fontSize(7.5).fillColor(C.maroon)
         .text(lines.join('\n'), cx - 26, cy - 4, { width: 52, align: 'center', lineGap: 1 });
    } else {
      diamondDot(doc, cx, cy + 2, 1.4, C.rule);
    }

    if (lagna) {
      // "Asc" marker for house 1
      doc.font(SANS_B).fontSize(5.5).fillColor(C.goldDeep)
         .text('ASC', cx - 18, cy + 14, { width: 36, align: 'center' });
    }
  }
}

/* ════════════════════════════════════════════════════════════════════════
   PAGE FURNITURE
   ════════════════════════════════════════════════════════════════════════ */

function contentHeader(doc: Doc, L: number, pageW: number, title: string) {
  // maroon band with gold rule + side flourishes
  doc.rect(0, 0, doc.page.width, 46).fill(C.maroon);
  doc.rect(0, 46, doc.page.width, 2.2).fill(C.gold);
  doc.font(SERIF_B).fontSize(15).fillColor(C.white)
     .text(title, L, 15, { width: pageW, align: 'center', characterSpacing: 1 });
  const cx = doc.page.width / 2;
  const half = doc.widthOfString(title) / 2 + 18;
  doc.lineWidth(0.8).strokeColor(C.goldLight);
  diamondDot(doc, cx - half, 23, 2.2, C.goldLight);
  diamondDot(doc, cx + half, 23, 2.2, C.goldLight);
}

function pageFrame(doc: Doc) {
  const m = 22;
  doc.lineWidth(0.8).strokeColor(C.rule)
     .rect(m, m + 30, doc.page.width - m * 2, doc.page.height - m * 2 - 30).stroke();
  const s = 16;
  const x0 = m, y0 = m + 30, x1 = doc.page.width - m, y1 = doc.page.height - m;
  cornerFlourish(doc, x0, y0, s, 'tl');
  cornerFlourish(doc, x1, y0, s, 'tr');
  cornerFlourish(doc, x0, y1, s, 'bl');
  cornerFlourish(doc, x1, y1, s, 'br');
}

function sectionHeader(doc: Doc, L: number, pageW: number, title: string, y?: number, accent = C.maroon) {
  const yPos = y ?? doc.y + 10;
  const g = doc.linearGradient(L, yPos, L + pageW, yPos + 24);
  g.stop(0, accent).stop(1, C.maroonDeep);
  doc.rect(L, yPos, pageW, 25).fill(g);
  doc.rect(L, yPos, 3.5, 25).fill(C.gold);
  doc.font(SERIF_B).fontSize(11.5).fillColor(C.white)
     .text(title, L + 14, yPos + 7, { width: pageW - 28, characterSpacing: 0.5, lineBreak: false });
  diamondDot(doc, L + pageW - 12, yPos + 12.5, 2.6, C.goldLight);
  doc.y = yPos + 32;
}

/* ════════════════════════════════════════════════════════════════════════
   TABLE HELPER
   ════════════════════════════════════════════════════════════════════════ */
function tableHeader(doc: Doc, L: number, pageW: number, headers: string[], widths: number[]) {
  const y = doc.y;
  doc.rect(L, y, pageW, 22).fill(C.maroon);
  doc.rect(L, y + 21, pageW, 1).fill(C.gold);
  let tx = L;
  headers.forEach((h, i) => {
    doc.font(SANS_B).fontSize(8.5).fillColor(C.white)
       .text(h, tx + 6, y + 7, { width: widths[i] - 8 });
    tx += widths[i];
  });
  doc.y = y + 22;
}

function ensureSpace(doc: Doc, needed: number, onNewPage?: () => void) {
  if (doc.y + needed > doc.page.height - 50) {
    doc.addPage();
    onNewPage?.();
  }
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════════════════ */
export function generateKundaliPDF(rawKundali: IKundali): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const kundali: any = JSON.parse(JSON.stringify(rawKundali));

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 50, left: 48, right: 48 },
      bufferPages: true,
      info: { Title: `Kundali Report — ${kundali.name}`, Author: 'VedicScan' },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (c: Buffer) => buffers.push(c));
    doc.on('error', reject);

    // ── Watermark: drawn first on each content page so it sits under all content ─
    if (LOGO_PATH) {
      doc.on('pageAdded', () => {
        doc.save();
        (doc as any).opacity(0.055); // ~5.5% — visible but non-intrusive
        const wmSize = 190;
        const wmX = (doc.page.width  - wmSize) / 2;
        const wmY = (doc.page.height - wmSize) / 2;
        doc.image(LOGO_PATH!, wmX, wmY, { width: wmSize, height: wmSize });
        doc.restore();
      });
    }

    const L = doc.page.margins.left;
    const R = doc.page.margins.right;
    const pageW = doc.page.width - L - R;
    const cx = doc.page.width / 2;

    /* ── COVER ─────────────────────────────────────────────────────────── */
    const PW = doc.page.width, PH = doc.page.height;
    // night radial glow
    const glow = doc.radialGradient(cx, PH * 0.42, 40, cx, PH * 0.42, PH * 0.65);
    glow.stop(0, C.nightAlt).stop(1, C.night);
    doc.rect(0, 0, PW, PH).fill(glow);

    // double gold frame
    doc.lineWidth(2).strokeColor(C.gold).rect(26, 26, PW - 52, PH - 52).stroke();
    doc.lineWidth(0.7).strokeColor(C.goldDeep).rect(31, 31, PW - 62, PH - 62).stroke();
    cornerFlourish(doc, 38, 38, 22, 'tl');
    cornerFlourish(doc, PW - 38, 38, 22, 'tr');
    cornerFlourish(doc, 38, PH - 38, 22, 'bl');
    cornerFlourish(doc, PW - 38, PH - 38, 22, 'br');

    // ── Logo medallion: image clipped inside double golden rings ────────────
    const logoCY = 132, outerR = 56, innerR = 47;
    if (LOGO_PATH) {
      // 1. Clip image to circle and fill the medallion
      doc.save();
      doc.circle(cx, logoCY, innerR - 1).clip();
      doc.image(LOGO_PATH, cx - (innerR - 1), logoCY - (innerR - 1),
        { width: (innerR - 1) * 2, height: (innerR - 1) * 2 });
      doc.restore();
    } else {
      mandala(doc, cx, logoCY, innerR);
    }
    // 2. Outer thick gold ring
    doc.lineWidth(2.2).strokeColor(C.gold).circle(cx, logoCY, outerR).stroke();
    // 3. Inner thinner ring (sits just outside the clipped logo edge)
    doc.lineWidth(1).strokeColor(C.goldDeep).circle(cx, logoCY, innerR).stroke();
    // 4. Tiny tick marks around the outer ring for detail
    doc.lineWidth(0.6).strokeColor(C.gold);
    for (let i = 0; i < 36; i++) {
      const a = (Math.PI * 2 / 36) * i;
      const r1 = outerR + 3, r2 = outerR + 7;
      doc.moveTo(cx + Math.cos(a) * r1, logoCY + Math.sin(a) * r1)
         .lineTo(cx + Math.cos(a) * r2, logoCY + Math.sin(a) * r2).stroke();
    }
    // 5. Outermost decorative circle enclosing the ticks
    doc.lineWidth(0.5).strokeColor(C.goldDeep).circle(cx, logoCY, outerR + 8).stroke();

    doc.font(SERIF).fontSize(12).fillColor(C.gold)
       .text('V E D I C S C A N', L, 196, { width: pageW, align: 'center', characterSpacing: 3 });
    doc.font(SERIF_B).fontSize(30).fillColor(C.white)
       .text('Personal Kundali Report', L, 218, { width: pageW, align: 'center' });
    doc.font(SERIF_I).fontSize(11.5).fillColor(C.goldLight)
       .text('ॐ  —  Ancient Wisdom · Precise Calculations · Modern Insights  —  ॐ', L, 258, { width: pageW, align: 'center' });
    divider(doc, cx, 286, 150);

    // Name
    doc.font(SERIF_B).fontSize(23).fillColor(C.white)
       .text(kundali.name, L, 302, { width: pageW, align: 'center' });

    // Birth details card
    const cardX = L + 26, cardY = 348, cardW = pageW - 52, cardH = 118;
    const cardG = doc.linearGradient(cardX, cardY, cardX, cardY + cardH);
    cardG.stop(0, C.nightAlt).stop(1, '#22101D');
    doc.roundedRect(cardX, cardY, cardW, cardH, 6).fill(cardG);
    doc.lineWidth(1).strokeColor(C.gold).roundedRect(cardX, cardY, cardW, cardH, 6).stroke();

    const info: [string, string][] = [
      ['Date of Birth', kundali.dateOfBirth],
      ['Time of Birth', kundali.timeOfBirth],
      ['Place of Birth', kundali.placeOfBirth],
      ['Report Generated', new Date(kundali.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
    ];
    const colW = cardW / 2;
    info.forEach(([label, val], i) => {
      const col = cardX + 22 + (i % 2) * colW;
      const row = cardY + 20 + Math.floor(i / 2) * 50;
      doc.font(SANS).fontSize(7.5).fillColor(C.gold).text(label.toUpperCase(), col, row, { characterSpacing: 1 });
      doc.font(SERIF_B).fontSize(11).fillColor(C.white).text(String(val), col, row + 12, { width: colW - 36 });
    });

    // Key signs strip
    const stripY = 488;
    const items: [string, string, string][] = [
      ['Lagna', kundali.lagna.sign, 'asc'],
      ['Moon Sign', kundali.moonSign, 'moon'],
      ['Sun Sign', kundali.sunSign, 'sun'],
      ['Nakshatra', kundali.moonNakshatra, 'star'],
    ];
    const sw = pageW / 4;
    items.forEach(([label, val, sym], i) => {
      const bx = L + i * sw;
      symbol(doc, sym, bx + sw / 2, stripY, 12, C.gold);
      doc.font(SERIF_B).fontSize(11).fillColor(C.white).text(val, bx, stripY + 18, { width: sw, align: 'center' });
      doc.font(SANS).fontSize(7).fillColor(C.gold).text(label.toUpperCase(), bx, stripY + 34, { width: sw, align: 'center', characterSpacing: 1 });
      if (i < 3) doc.lineWidth(0.5).strokeColor(C.goldDeep).moveTo(bx + sw, stripY - 8).lineTo(bx + sw, stripY + 40).stroke();
    });

    divider(doc, cx, 556, 150);
    doc.font(SERIF_I).fontSize(8.5).fillColor(C.muted)
       .text('Prepared for spiritual guidance and self-understanding.\nNot a substitute for medical, financial, or legal advice.',
         L, PH - 92, { width: pageW, align: 'center', lineGap: 2 });

    /* ── PAGE 2: CHARTS ────────────────────────────────────────────────── */
    doc.addPage();
    contentHeader(doc, L, pageW, 'BIRTH CHART  (D1)  &  NAVAMSA  (D9)');
    pageFrame(doc);

    const retroSet = new Set<string>(
      Object.entries(kundali.planets || {}).filter(([, p]: any) => p?.retrograde).map(([n]) => n)
    );

    const chartSize = 215;
    const gap = (pageW - chartSize * 2) > 0 ? (pageW - chartSize * 2) : 24;
    const chartY = 90;
    const x1 = L + (pageW - (chartSize * 2 + gap)) / 2;
    const x2 = x1 + chartSize + gap;

    const housesArr: any[] = Array.isArray(kundali.houses) ? kundali.houses : Object.values(kundali.houses || {});
    drawNorthIndianChart(doc, x1, chartY, chartSize, housesArr, 'D1 · Rashi (Birth Chart)', retroSet);

    // build navamsa houses
    const nav = kundali.navamsa;
    const navIdx = RASHIS.indexOf(nav?.lagnaSign || 'Aries');
    const navHouses = Array.from({ length: 12 }, (_, k) => {
      const h = k + 1;
      const sign = RASHIS[(navIdx + h - 1) % 12];
      const planets = nav?.planets
        ? Object.entries(nav.planets).filter(([, p]: any) => p?.houseNumber === h).map(([n]) => n)
        : [];
      return { number: h, sign, planets };
    });
    drawNorthIndianChart(doc, x2, chartY, chartSize, navHouses, 'D9 · Navamsa Chart', retroSet);

    // legend + summary band
    let infoY = chartY + chartSize + 34;
    doc.roundedRect(L, infoY, pageW, 70, 5).fill(C.card);
    doc.lineWidth(0.8).strokeColor(C.gold).roundedRect(L, infoY, pageW, 70, 5).stroke();
    doc.font(SERIF_B).fontSize(10).fillColor(C.maroon)
       .text('Chart Summary', L + 14, infoY + 10);
    const sumPairs: [string, string][] = [
      ['Lagna (Ascendant)', `${kundali.lagna.sign}  ${kundali.lagna.degree.toFixed(2)}°`],
      ['Navamsa Lagna', nav?.lagnaSign || 'N/A'],
      ['Moon Nakshatra', `${kundali.moonNakshatra} (Pada ${kundali.moonPada})`],
      ['Moon / Sun Sign', `${kundali.moonSign} / ${kundali.sunSign}`],
    ];
    sumPairs.forEach((pr, i) => {
      const colx = L + 14 + (i % 2) * (pageW / 2);
      const rowy = infoY + 30 + Math.floor(i / 2) * 18;
      doc.font(SANS).fontSize(8).fillColor(C.muted).text(pr[0] + ':', colx, rowy, { width: 110 });
      doc.font(SANS_B).fontSize(8.5).fillColor(C.ink).text(pr[1], colx + 110, rowy, { width: pageW / 2 - 124 });
    });

    // planet abbreviation legend
    infoY += 84;
    doc.font(SANS).fontSize(7.5).fillColor(C.muted)
       .text('Legend:  Su Sun · Mo Moon · Ma Mars · Me Mercury · Ju Jupiter · Ve Venus · Sa Saturn · Ra Rahu · Ke Ketu · (R) Retrograde',
         L, infoY, { width: pageW, align: 'center' });

    /* ── PAGE 3: PLANETARY POSITIONS ───────────────────────────────────── */
    doc.addPage();
    contentHeader(doc, L, pageW, 'PLANETARY POSITIONS');
    pageFrame(doc);
    doc.y = 66;

    const pw = [62, 78, 92, 58, 44, pageW - 62 - 78 - 92 - 58 - 44];
    tableHeader(doc, L, pageW, ['Planet', 'Rashi', 'Nakshatra', 'Degree', 'House', 'Navamsa'], pw);

    let alt = false;
    for (const name of PLANET_ORDER) {
      const p = kundali.planets?.[name];
      if (!p) continue;
      const y = doc.y;
      if (alt) doc.rect(L, y, pageW, 21).fill(C.creamAlt);
      alt = !alt;
      const retro = p.retrograde ? ' (R)' : '';
      const cols = [name + retro, p.rashi || '—', p.nakshatra || '—', `${(p.degree || 0).toFixed(2)}°`, `${p.houseNumber || '—'}`, p.navamsaSign || '—'];
      let tx = L;
      cols.forEach((v, i) => {
        doc.font(i === 0 ? SANS_B : SANS).fontSize(9).fillColor(i === 0 ? C.maroon : C.ink)
           .text(v, tx + 6, y + 6, { width: pw[i] - 8 });
        tx += pw[i];
      });
      doc.y = y + 21;
    }
    doc.lineWidth(0.8).strokeColor(C.gold).moveTo(L, doc.y).lineTo(L + pageW, doc.y).stroke();

    doc.moveDown(1.2);
    sectionHeader(doc, L, pageW, 'HOUSE PLACEMENTS');
    doc.moveDown(0.3);
    const hw = [70, 110, pageW - 180];
    tableHeader(doc, L, pageW, ['House', 'Sign', 'Planets'], hw);
    alt = false;
    for (const h of housesArr) {
      const y = doc.y;
      if (alt) doc.rect(L, y, pageW, 19).fill(C.creamAlt);
      alt = !alt;
      doc.font(SANS_B).fontSize(8.5).fillColor(C.ink).text(`House ${h.number}`, L + 6, y + 5, { width: hw[0] - 8 });
      doc.font(SANS).fontSize(8.5).fillColor(C.ink).text(h.sign, L + hw[0] + 6, y + 5, { width: hw[1] - 8 });
      doc.font(SANS).fontSize(8.5).fillColor(C.maroon).text(h.planets?.join(', ') || '—', L + hw[0] + hw[1] + 6, y + 5, { width: hw[2] - 8 });
      doc.y = y + 19;
    }

    /* ── PAGE 4: YOGAS & DOSHAS ────────────────────────────────────────── */
    doc.addPage();
    contentHeader(doc, L, pageW, 'YOGAS  &  DOSHAS');
    pageFrame(doc);
    doc.y = 66;

    sectionHeader(doc, L, pageW, 'AUSPICIOUS YOGAS');
    doc.moveDown(0.4);
    const yogas = (kundali.yogas || []).filter((y: any) => y.isPresent);
    if (!yogas.length) {
      doc.font(SERIF).fontSize(10).fillColor(C.muted)
         .text('No major yogas are formed in this chart; the energies are balanced and steady.', L + 6, doc.y, { width: pageW - 12 });
      doc.moveDown(1.2);
    } else {
      for (const yg of yogas) {
        ensureSpace(doc, 80, () => { contentHeader(doc, L, pageW, 'YOGAS  &  DOSHAS  (cont.)'); pageFrame(doc); doc.y = 66; });
        const top = doc.y;
        star(doc, L + 4, top + 6, 4, C.gold, 6);
        doc.font(SERIF_B).fontSize(11).fillColor(C.maroon)
           .text(yg.name, L + 14, top, { width: pageW - 100, lineBreak: false });
        doc.font(SANS_B).fontSize(8).fillColor(C.goldDeep)
           .text((yg.strength || '').toUpperCase(), L + pageW - 80, top + 2, { width: 76, align: 'right', lineBreak: false });
        doc.y = top + 18;
        doc.font(SERIF).fontSize(9.5).fillColor(C.inkSoft).lineGap(2)
           .text(yg.description || '', L + 14, doc.y, { width: pageW - 20, align: 'justify' });
        doc.moveDown(0.5);
        divider(doc, cx, doc.y + 2, pageW / 2 - 6, C.rule);
        doc.moveDown(0.7);
      }
    }

    doc.moveDown(0.3);
    sectionHeader(doc, L, pageW, 'DOSHAS & KARMIC PATTERNS', undefined, '#7A2433');
    doc.moveDown(0.4);
    const doshas = (kundali.doshas || []).filter((d: any) => d.isPresent);
    if (!doshas.length) {
      doc.font(SERIF).fontSize(10).fillColor(C.muted)
         .text('No significant doshas were found — an auspicious indication.', L + 6, doc.y, { width: pageW - 12 });
    } else {
      for (const ds of doshas) {
        ensureSpace(doc, 100, () => { contentHeader(doc, L, pageW, 'YOGAS  &  DOSHAS  (cont.)'); pageFrame(doc); doc.y = 66; });
        const sev = ds.severity === 'High' ? C.red : ds.severity === 'Moderate' ? '#9A5A00' : C.goldDeep;
        const top = doc.y;
        doc.roundedRect(L, top, pageW, 20, 3).fill('#FBEEEE');
        doc.rect(L, top, 4, 20).fill(sev);
        doc.font(SERIF_B).fontSize(10).fillColor(sev)
           .text(ds.name || '', L + 14, top + 5, { width: pageW - 120, lineBreak: false });
        doc.font(SANS_B).fontSize(7.5).fillColor(sev)
           .text(`SEVERITY: ${(ds.severity || '').toUpperCase()}`, L + pageW - 100, top + 6, { width: 96, align: 'right', lineBreak: false });
        doc.y = top + 24;
        doc.font(SERIF).fontSize(9.5).fillColor(C.inkSoft).lineGap(2)
           .text(ds.description || '', L + 14, doc.y, { width: pageW - 20, align: 'justify' });
        if (ds.remedy) {
          doc.moveDown(0.4);
          doc.font(SANS_B).fontSize(8.5).fillColor(C.green)
             .text('Remedy:', L + 14, doc.y, { width: 52, lineBreak: false });
          doc.font(SERIF_I).fontSize(9).fillColor(C.inkSoft)
             .text(ds.remedy, L + 68, doc.y, { width: pageW - 76, lineGap: 1 });
        }
        doc.moveDown(0.9);
      }
    }

    /* ── PAGE 5: DASHA ─────────────────────────────────────────────────── */
    doc.addPage();
    contentHeader(doc, L, pageW, 'VIMSHOTTARI DASHA ANALYSIS');
    pageFrame(doc);
    doc.y = 66;

    const d = kundali.dasha;
    doc.roundedRect(L, doc.y, pageW, 78, 5).fill(C.card);
    doc.lineWidth(1).strokeColor(C.gold).roundedRect(L, doc.y, pageW, 78, 5).stroke();
    const by = doc.y + 10;
    doc.font(SERIF_B).fontSize(10.5).fillColor(C.maroon)
       .text('Current Planetary Periods', L, by, { width: pageW, align: 'center' });
    const periods: [string, string][] = [
      ['Mahadasha', `${d.currentMahadasha}   (${d.mahadashaStartDate} – ${d.mahadashaEndDate})`],
      ['Antardasha', `${d.currentAntardasha}   (${d.antardashaStartDate} – ${d.antardashaEndDate})`],
    ];
    if (d.currentPratyantar) periods.push(['Pratyantar', `${d.currentPratyantar}   (ends ${d.pratyantarEndDate})`]);
    periods.forEach((pr, i) => {
      const ry = by + 24 + i * 17;
      doc.font(SANS_B).fontSize(9).fillColor(C.goldDeep).text(pr[0], L + 16, ry, { width: 90, lineBreak: false });
      doc.font(SANS).fontSize(9).fillColor(C.ink).text(pr[1], L + 108, ry, { width: pageW - 120, lineBreak: false });
    });
    doc.y += 92;

    sectionHeader(doc, L, pageW, 'MAHADASHA TIMELINE');
    doc.moveDown(0.3);
    const mw = [pageW - 80 - 80 - 64 - 56, 80, 80, 64, 56];
    tableHeader(doc, L, pageW, ['Mahadasha', 'Start', 'End', 'Duration', 'Status'], mw);
    alt = false;
    for (const md of (d.timeline || []).slice(0, 18)) {
      ensureSpace(doc, 19, () => { contentHeader(doc, L, pageW, 'VIMSHOTTARI DASHA  (cont.)'); pageFrame(doc); doc.y = 66; });
      const y = doc.y;
      if (md.isCurrent) doc.rect(L, y, pageW, 19).fill('#FBF1D8');
      else if (alt) doc.rect(L, y, pageW, 19).fill(C.creamAlt);
      alt = !alt;
      if (md.isCurrent) doc.rect(L, y, 3, 19).fill(C.gold);
      const yrs = Math.round((new Date(md.endDate).getTime() - new Date(md.startDate).getTime()) / (365.25 * 864e5));
      const cells = [md.planet, md.startDate, md.endDate, `${yrs} yrs`, md.isCurrent ? 'Active' : ''];
      let tx = L;
      cells.forEach((v, i) => {
        doc.font(md.isCurrent ? SANS_B : SANS).fontSize(8.5).fillColor(md.isCurrent ? C.maroon : C.ink)
           .text(v, tx + 6, y + 5, { width: mw[i] - 8 });
        tx += mw[i];
      });
      doc.y = y + 19;
    }

    const curMD = (d.timeline || []).find((m: any) => m.isCurrent);
    if (curMD?.antardashas?.length) {
      doc.moveDown(1);
      ensureSpace(doc, 140, () => { contentHeader(doc, L, pageW, 'VIMSHOTTARI DASHA  (cont.)'); pageFrame(doc); doc.y = 66; });
      sectionHeader(doc, L, pageW, `ANTARDASHA WITHIN ${String(curMD.planet).toUpperCase()} MAHADASHA`);
      doc.moveDown(0.3);
      const aw = [pageW - 110 - 110 - 70, 110, 110, 70];
      tableHeader(doc, L, pageW, ['Antardasha', 'Start', 'End', 'Status'], aw);
      alt = false;
      for (const ad of curMD.antardashas) {
        ensureSpace(doc, 18, () => { contentHeader(doc, L, pageW, 'VIMSHOTTARI DASHA  (cont.)'); pageFrame(doc); doc.y = 66; });
        const y = doc.y;
        if (ad.isCurrent) doc.rect(L, y, pageW, 18).fill('#FBF1D8');
        else if (alt) doc.rect(L, y, pageW, 18).fill(C.creamAlt);
        alt = !alt;
        if (ad.isCurrent) doc.rect(L, y, 3, 18).fill(C.gold);
        const cells = [ad.planet, ad.startDate, ad.endDate, ad.isCurrent ? 'Active' : ''];
        let tx = L;
        cells.forEach((v, i) => {
          doc.font(ad.isCurrent ? SANS_B : SANS).fontSize(8.5).fillColor(ad.isCurrent ? C.maroon : C.ink)
             .text(v, tx + 6, y + 5, { width: aw[i] - 8 });
          tx += aw[i];
        });
        doc.y = y + 18;
      }
    }

    /* ── LIFE ANALYSIS ─────────────────────────────────────────────────── */
    const sections: Array<{ title: string; key: string }> = [
      { title: 'PERSONALITY', key: 'personality' },
      { title: 'CAREER & PROFESSION', key: 'career' },
      { title: 'FINANCIAL OUTLOOK', key: 'finance' },
      { title: 'MARRIAGE & RELATIONSHIPS', key: 'marriage' },
      { title: 'HEALTH & WELL-BEING', key: 'health' },
      { title: 'EDUCATION & INTELLECT', key: 'education' },
      { title: 'CHILDREN & CREATIVITY', key: 'children' },
      { title: 'SPIRITUALITY & LIBERATION', key: 'spirituality' },
    ];
    const interp = kundali.interpretations || {};

    doc.addPage();
    contentHeader(doc, L, pageW, 'LIFE ANALYSIS & INSIGHTS');
    pageFrame(doc);
    doc.y = 66;

    for (const s of sections) {
      const text = interp[s.key];
      if (!text) continue;
      // Ensure room for the header bar + at least 3 lines of body text before adding
      ensureSpace(doc, 100, () => { contentHeader(doc, L, pageW, 'LIFE ANALYSIS  (cont.)'); pageFrame(doc); doc.y = 66; });
      sectionHeader(doc, L, pageW, s.title);
      doc.font(SERIF).fontSize(10).fillColor(C.ink).lineGap(3)
         .text(text, L + 6, doc.y, { width: pageW - 12, align: 'justify' });
      doc.moveDown(1.2);
    }

    // Strengths & challenges
    const strCount = (interp.strengths || []).length + (interp.challenges || []).length;
    ensureSpace(doc, 60 + strCount * 18, () => { contentHeader(doc, L, pageW, 'LIFE ANALYSIS  (cont.)'); pageFrame(doc); doc.y = 66; });
    sectionHeader(doc, L, pageW, 'STRENGTHS & AREAS TO WORK ON');
    doc.moveDown(0.4);
    const colGap = 20;
    const colWid = (pageW - colGap) / 2;
    const sxL = L, sxR = L + colWid + colGap;
    const startY = doc.y;

    // Left column — strengths
    doc.font(SERIF_B).fontSize(10).fillColor(C.green).text('Natural Strengths', sxL, startY, { width: colWid });
    let ly = startY + 18;
    for (const s of (interp.strengths || [])) {
      star(doc, sxL + 4, ly + 5, 3, C.green, 5);
      doc.font(SERIF).fontSize(9.5).fillColor(C.ink)
         .text(s, sxL + 14, ly, { width: colWid - 18, lineGap: 1 });
      ly = doc.y + 4;
    }
    const leftEnd = ly;

    // Right column — challenges (rendered at same startY, independent cursor)
    doc.font(SERIF_B).fontSize(10).fillColor(C.red).text('Areas to Work On', sxR, startY, { width: colWid });
    ly = startY + 18;
    for (const c of (interp.challenges || [])) {
      diamondDot(doc, sxR + 4, ly + 5, 2.4, C.red);
      doc.font(SERIF).fontSize(9.5).fillColor(C.ink)
         .text(c, sxR + 14, ly, { width: colWid - 18, lineGap: 1 });
      ly = doc.y + 4;
    }
    // Advance past whichever column is taller
    doc.y = Math.max(leftEnd, ly) + 10;

    /* ── RECOMMENDATIONS ───────────────────────────────────────────────── */
    doc.addPage();
    contentHeader(doc, L, pageW, 'VEDIC RECOMMENDATIONS');
    pageFrame(doc);
    doc.y = 66;

    const recs = [
      { title: 'MANTRAS', items: interp.mantras || [], note: 'Chant 108 times daily or on the prescribed day for best effect.' },
      { title: 'GEMSTONES', items: interp.gemstones || [], note: 'Wear only after energisation; consult a learned astrologer before wearing.' },
      { title: 'FASTING', items: interp.fastingDays || [], note: 'Observing the fast invokes the blessings of the ruling planet.' },
      { title: 'CHARITY & SERVICE', items: interp.charities || [], note: 'Regular charity helps neutralise challenging karmic patterns.' },
    ];
    for (const r of recs) {
      if (!r.items.length) continue;
      // Ensure enough room for the header + note + at least one item before starting the section
      ensureSpace(doc, 110, () => { contentHeader(doc, L, pageW, 'VEDIC RECOMMENDATIONS  (cont.)'); pageFrame(doc); doc.y = 66; });
      sectionHeader(doc, L, pageW, r.title);
      doc.font(SERIF_I).fontSize(9).fillColor(C.muted)
         .text(r.note, L + 6, doc.y, { width: pageW - 12, lineGap: 1 });
      doc.moveDown(0.6);
      for (const it of r.items) {
        ensureSpace(doc, 28, () => { contentHeader(doc, L, pageW, 'VEDIC RECOMMENDATIONS  (cont.)'); pageFrame(doc); doc.y = 66; });
        const iy = doc.y;
        diamondDot(doc, L + 7, iy + 6, 2.8, C.gold);
        doc.font(SERIF).fontSize(10).fillColor(C.ink)
           .text(String(it), L + 18, iy, { width: pageW - 26, lineGap: 2 });
        doc.moveDown(0.5);
      }
      doc.moveDown(0.6);
    }

    // Disclaimer
    ensureSpace(doc, 70);
    doc.moveDown(0.5);
    const dy = doc.y;
    doc.roundedRect(L, dy, pageW, 56, 5).fill(C.creamAlt);
    doc.lineWidth(0.8).strokeColor(C.gold).roundedRect(L, dy, pageW, 56, 5).stroke();
    doc.font(SANS_B).fontSize(8).fillColor(C.maroon)
       .text('IMPORTANT DISCLAIMER', L + 12, dy + 9, { width: pageW - 24, align: 'center', characterSpacing: 1 });
    doc.font(SERIF).fontSize(8.5).fillColor(C.inkSoft).lineGap(1.5)
       .text('This report is provided for spiritual guidance and self-understanding only. It is not medical, financial, or legal advice. Astrological interpretations are symbolic and traditional in nature; VedicScan does not guarantee outcomes based on this report.',
         L + 14, dy + 22, { width: pageW - 28, align: 'center' });

    /* ── FOOTERS (all content pages) ───────────────────────────────────── */
    const range = doc.bufferedPageRange();
    const total = range.count;
    for (let i = 1; i < total; i++) { // skip cover (page 0)
      doc.switchToPage(i);
      doc.page.margins.bottom = 0; // prevent text-flow from adding new pages
      const fy = PH - 34;
      doc.lineWidth(0.6).strokeColor(C.rule).moveTo(L, fy).lineTo(L + pageW, fy).stroke();
      diamondDot(doc, cx, fy, 2, C.gold);
      doc.font(SERIF_I).fontSize(8).fillColor(C.muted)
         .text('VedicScan  ·  Personal Kundali Report', L, fy + 6, { width: pageW / 2, align: 'left', lineBreak: false });
      doc.font(SANS).fontSize(8).fillColor(C.muted)
         .text(`Page ${i + 1} of ${total}`, L + pageW / 2, fy + 6, { width: pageW / 2, align: 'right', lineBreak: false });
    }

    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.end();
  });
}
