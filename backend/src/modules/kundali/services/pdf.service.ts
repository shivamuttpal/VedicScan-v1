import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { IKundali } from "../model/kundali.model";
import {
  Lang, T, labels, planetList, yogaName, doshaName, formatDate, phaseName, sadeSatiCounsel,
} from "./kundali.pdf.i18n";

const FONT_DIR = path.join(__dirname, "../../../../assets/fonts/");
const FONT_OVERRIDES: Record<string, string> = {
  "Times-Roman": "NotoSerifDevanagari-Regular.ttf",
  "Times-Bold": "NotoSerifDevanagari-Bold.ttf",
  "Times-Italic": "NotoSerifDevanagari-Regular.ttf",
  "Helvetica": "NotoSansDevanagari-Regular.ttf",
  "Helvetica-Bold": "NotoSansDevanagari-Bold.ttf",
};

// Logo image — prefer PNG (transparent), fall back to JPEG
const LOGO_PATH = (() => {
  const png = path.join(__dirname, "../../../../assets/logo.png");
  const jpeg = path.join(__dirname, "../../../../assets/logo.jpeg");
  if (fs.existsSync(png)) return png;
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
  gold: "#C8A45A",
  goldLight: "#E6CE94",
  goldDeep: "#A07C32",
  maroon: "#6E142F",
  maroonDeep: "#4A0C1F",
  ink: "#2C1810",
  inkSoft: "#5A4636",
  muted: "#8B7355",
  cream: "#FDF8EF",
  creamAlt: "#F7EEDD",
  card: "#FBF4E6",
  rule: "#E3D2AE",
  night: "#1A0A14",
  nightAlt: "#2A1228",
  white: "#FFFFFF",
  green: "#1F6B33",
  red: "#8E1B1B",
};

/* ── Fonts (serif for prose/headings, sans for data) ───────────────────── */
const SERIF = "Times-Roman";
const SERIF_B = "Times-Bold";
const SERIF_I = "Times-Italic";
const SANS = "Helvetica";
const SANS_B = "Helvetica-Bold";

const PLANET_ABBR: Record<string, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
};
const RASHIS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];
const PLANET_ORDER = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
];

type Doc = PDFKit.PDFDocument;

/* ════════════════════════════════════════════════════════════════════════
   VECTOR ORNAMENTS  (always render — no glyph/font dependency)
   ════════════════════════════════════════════════════════════════════════ */

function star(
  doc: Doc,
  cx: number,
  cy: number,
  r: number,
  color: string,
  points = 8,
) {
  const inner = r * 0.42;
  doc.save();
  let started = false;
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (!started) {
      doc.moveTo(px, py);
      started = true;
    } else {
      doc.lineTo(px, py);
    }
  }
  doc.closePath().fillColor(color).fill();
  doc.restore();
}

function diamondDot(
  doc: Doc,
  cx: number,
  cy: number,
  r: number,
  color: string,
) {
  doc.save();
  doc
    .moveTo(cx, cy - r)
    .lineTo(cx + r, cy)
    .lineTo(cx, cy + r)
    .lineTo(cx - r, cy)
    .closePath()
    .fillColor(color)
    .fill();
  doc.restore();
}

/* Ornamental divider: a centred line broken by a small diamond + flanking dots */
function divider(
  doc: Doc,
  cx: number,
  y: number,
  halfWidth: number,
  color = C.gold,
) {
  doc.save();
  doc.lineWidth(0.8).strokeColor(color);
  doc
    .moveTo(cx - halfWidth, y)
    .lineTo(cx - 14, y)
    .stroke();
  doc
    .moveTo(cx + 14, y)
    .lineTo(cx + halfWidth, y)
    .stroke();
  diamondDot(doc, cx, y, 4, color);
  diamondDot(doc, cx - 22, y, 1.6, color);
  diamondDot(doc, cx + 22, y, 1.6, color);
  doc.restore();
}

/* Lotus-petal rosette used on the cover */
function lotus(
  doc: Doc,
  cx: number,
  cy: number,
  r: number,
  color: string,
  petals = 8,
) {
  doc.save();
  doc.lineWidth(1).strokeColor(color);
  for (let i = 0; i < petals; i++) {
    const a = ((Math.PI * 2) / petals) * i;
    const tipX = cx + Math.cos(a) * r;
    const tipY = cy + Math.sin(a) * r;
    const c1x = cx + Math.cos(a - 0.32) * r * 0.62;
    const c1y = cy + Math.sin(a - 0.32) * r * 0.62;
    const c2x = cx + Math.cos(a + 0.32) * r * 0.62;
    const c2y = cy + Math.sin(a + 0.32) * r * 0.62;
    doc
      .moveTo(cx, cy)
      .quadraticCurveTo(c1x, c1y, tipX, tipY)
      .quadraticCurveTo(c2x, c2y, cx, cy)
      .stroke();
  }
  doc
    .circle(cx, cy, r * 0.22)
    .fillColor(color)
    .fill();
  doc.restore();
}

/* Concentric mandala ring for the cover */
function mandala(doc: Doc, cx: number, cy: number, r: number) {
  doc.save();
  doc.lineWidth(0.8).strokeColor(C.gold).circle(cx, cy, r).stroke();
  doc
    .lineWidth(0.5)
    .strokeColor(C.goldDeep)
    .circle(cx, cy, r * 0.82)
    .stroke();
  // outer ticks
  const ticks = 48;
  doc.lineWidth(0.5).strokeColor(C.gold);
  for (let i = 0; i < ticks; i++) {
    const a = ((Math.PI * 2) / ticks) * i;
    doc
      .moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      .lineTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9)
      .stroke();
  }
  lotus(doc, cx, cy, r * 0.58, C.gold, 12);
  doc.restore();
}

/* Corner flourish (quarter ornament). corner: 'tl'|'tr'|'bl'|'br' */
function cornerFlourish(
  doc: Doc,
  x: number,
  y: number,
  s: number,
  corner: string,
  color = C.gold,
) {
  doc.save();
  doc.lineWidth(1).strokeColor(color);
  const fx = corner.includes("r") ? -1 : 1;
  const fy = corner.includes("b") ? -1 : 1;
  doc.translate(x, y).scale(fx, fy);
  doc.moveTo(0, s).quadraticCurveTo(0, 0, s, 0).stroke();
  doc.moveTo(4, s).quadraticCurveTo(4, 4, s, 4).stroke();
  diamondDot(doc, s * 0.5, s * 0.5, 2.4, color);
  doc.circle(2.5, 2.5, 1.6).fillColor(color).fill();
  doc.restore();
}

/* Small celestial symbols drawn as vectors (sun / crescent / ascendant / star) */
function symbol(
  doc: Doc,
  kind: string,
  cx: number,
  cy: number,
  r: number,
  color: string,
) {
  doc.save();
  if (kind === "sun") {
    doc
      .lineWidth(1.2)
      .strokeColor(color)
      .circle(cx, cy, r * 0.55)
      .stroke();
    doc.circle(cx, cy, 1.2).fillColor(color).fill();
    for (let i = 0; i < 8; i++) {
      const a = ((Math.PI * 2) / 8) * i;
      doc
        .moveTo(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72)
        .lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
        .lineWidth(1)
        .strokeColor(color)
        .stroke();
    }
  } else if (kind === "moon") {
    doc
      .circle(cx, cy, r * 0.7)
      .fillColor(color)
      .fill();
    doc
      .circle(cx + r * 0.32, cy - r * 0.1, r * 0.62)
      .fillColor(C.nightAlt)
      .fill();
  } else if (kind === "asc") {
    doc.lineWidth(1.4).strokeColor(color);
    doc
      .moveTo(cx, cy + r * 0.7)
      .lineTo(cx, cy - r * 0.7)
      .stroke();
    doc
      .moveTo(cx - r * 0.45, cy - r * 0.2)
      .lineTo(cx, cy - r * 0.7)
      .lineTo(cx + r * 0.45, cy - r * 0.2)
      .stroke();
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
  1: [0.5, 0.235],
  2: [0.255, 0.115],
  3: [0.115, 0.255],
  4: [0.235, 0.5],
  5: [0.115, 0.745],
  6: [0.255, 0.885],
  7: [0.5, 0.765],
  8: [0.745, 0.885],
  9: [0.885, 0.745],
  10: [0.765, 0.5],
  11: [0.885, 0.255],
  12: [0.745, 0.115],
};

function drawNorthIndianChart(
  doc: Doc,
  x: number,
  y: number,
  size: number,
  houses: Array<{ number: number; sign: string; planets: string[] }>,
  title: string,
  retroSet: Set<string> = new Set(),
) {
  const S = size;
  const mid = S / 2;

  // Title
  doc
    .font(SERIF_B)
    .fontSize(10.5)
    .fillColor(C.maroon)
    .text(title, x, y - 20, { width: S, align: "center" });

  // Soft parchment fill behind the chart
  doc.rect(x, y, S, S).fill(C.cream);

  // Outer frame (double line)
  doc.lineWidth(2).strokeColor(C.gold).rect(x, y, S, S).stroke();
  doc
    .lineWidth(0.6)
    .strokeColor(C.goldDeep)
    .rect(x + 3.5, y + 3.5, S - 7, S - 7)
    .stroke();

  // Diagonals + inner diamond
  doc.lineWidth(0.9).strokeColor(C.gold);
  doc
    .moveTo(x, y)
    .lineTo(x + S, y + S)
    .stroke();
  doc
    .moveTo(x + S, y)
    .lineTo(x, y + S)
    .stroke();
  doc
    .moveTo(x + mid, y)
    .lineTo(x + S, y + mid)
    .lineTo(x + mid, y + S)
    .lineTo(x, y + mid)
    .closePath()
    .stroke();

  // Centre seal
  doc.save();
  diamondDot(doc, x + mid, y + mid, 13, C.creamAlt);
  doc.lineWidth(0.8).strokeColor(C.goldDeep);
  doc
    .moveTo(x + mid, y + mid - 13)
    .lineTo(x + mid + 13, y + mid)
    .lineTo(x + mid, y + mid + 13)
    .lineTo(x + mid - 13, y + mid)
    .closePath()
    .stroke();
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
    doc
      .font(SANS)
      .fontSize(6)
      .fillColor(lagna ? C.maroon : C.muted)
      .text(rNum > 0 ? String(rNum) : "", cx - 18, cy - 16, {
        width: 36,
        align: "center",
      });

    // Planets (primary content of a North-Indian house)
    if (h.planets.length) {
      const labels = h.planets.map((p) => {
        const ab = PLANET_ABBR[p] || p.slice(0, 2);
        return retroSet.has(p) ? `${ab}(R)` : ab;
      });
      // wrap to max 3 per line
      const lines: string[] = [];
      for (let i = 0; i < labels.length; i += 3)
        lines.push(labels.slice(i, i + 3).join(" "));
      doc
        .font(SANS_B)
        .fontSize(7.5)
        .fillColor(C.maroon)
        .text(lines.join("\n"), cx - 26, cy - 4, {
          width: 52,
          align: "center",
          lineGap: 1,
        });
    } else {
      diamondDot(doc, cx, cy + 2, 1.4, C.rule);
    }

    if (lagna) {
      // "Asc" marker for house 1
      doc
        .font(SANS_B)
        .fontSize(5.5)
        .fillColor(C.goldDeep)
        .text("ASC", cx - 18, cy + 14, { width: 36, align: "center" });
    }
  }
}

/* ════════════════════════════════════════════════════════════════════════
   PAGE FURNITURE
   ════════════════════════════════════════════════════════════════════════ */

function contentHeader(doc: Doc, L: number, pageW: number, title: string, lang: Lang = "en") {
  // maroon band with gold rule + side flourishes
  doc.rect(0, 0, doc.page.width, 46).fill(C.maroon);
  doc.rect(0, 46, doc.page.width, 2.2).fill(C.gold);
  doc
    .font(SERIF_B)
    .fontSize(15)
    .fillColor(C.white)
    .text(title, L, 15, { width: pageW, align: "center", characterSpacing: lang === "hi" ? 0 : 1 });
  const cx = doc.page.width / 2;
  const half = doc.widthOfString(title) / 2 + 18;
  doc.lineWidth(0.8).strokeColor(C.goldLight);
  diamondDot(doc, cx - half, 23, 2.2, C.goldLight);
  diamondDot(doc, cx + half, 23, 2.2, C.goldLight);
}

function pageFrame(doc: Doc) {
  const m = 22;
  doc
    .lineWidth(0.8)
    .strokeColor(C.rule)
    .rect(m, m + 30, doc.page.width - m * 2, doc.page.height - m * 2 - 30)
    .stroke();
  const s = 16;
  const x0 = m,
    y0 = m + 30,
    x1 = doc.page.width - m,
    y1 = doc.page.height - m;
  cornerFlourish(doc, x0, y0, s, "tl");
  cornerFlourish(doc, x1, y0, s, "tr");
  cornerFlourish(doc, x0, y1, s, "bl");
  cornerFlourish(doc, x1, y1, s, "br");
}

function sectionHeader(
  doc: Doc,
  L: number,
  pageW: number,
  title: string,
  y?: number,
  accent = C.maroon,
  lang: Lang = "en",
) {
  const yPos = y ?? doc.y + 10;
  const g = doc.linearGradient(L, yPos, L + pageW, yPos + 24);
  g.stop(0, accent).stop(1, C.maroonDeep);
  doc.rect(L, yPos, pageW, 25).fill(g);
  doc.rect(L, yPos, 3.5, 25).fill(C.gold);
  doc
    .font(SERIF_B)
    .fontSize(11.5)
    .fillColor(C.white)
    .text(title, L + 14, yPos + 7, {
      width: pageW - 28,
      characterSpacing: lang === "hi" ? 0 : 0.5,
      lineBreak: false,
    });
  diamondDot(doc, L + pageW - 12, yPos + 12.5, 2.6, C.goldLight);
  doc.y = yPos + 32;
}

/* ════════════════════════════════════════════════════════════════════════
   TABLE HELPER
   ════════════════════════════════════════════════════════════════════════ */
function tableHeader(
  doc: Doc,
  L: number,
  pageW: number,
  headers: string[],
  widths: number[],
) {
  const y = doc.y;
  doc.rect(L, y, pageW, 22).fill(C.maroon);
  doc.rect(L, y + 21, pageW, 1).fill(C.gold);
  let tx = L;
  headers.forEach((h, i) => {
    doc
      .font(SANS_B)
      .fontSize(8.5)
      .fillColor(C.white)
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
export function generateKundaliPDF(rawKundali: IKundali, lang: Lang = "en"): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const kundali: any = JSON.parse(JSON.stringify(rawKundali));
    const S = labels(lang);
    const s = (k: string) => S[k] as string; // static-label helper
    // Heavy interpretive prose is stored bilingually on the document.
    const interp = (lang === "hi" ? kundali.interpretationsHi : kundali.interpretations) || kundali.interpretations || {};

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 50, left: 48, right: 48 },
      bufferPages: true,
      info: { Title: `Kundali Report — ${kundali.name}`, Author: "VedicScan" },
    });

    // Hindi mode: override PDFKit's built-in Times/Helvetica with Noto Devanagari,
    // clearing the pre-cached default so every existing .font() call renders Devanagari.
    if (lang === "hi") {
      for (const [std, file] of Object.entries(FONT_OVERRIDES)) {
        doc.registerFont(std, path.join(FONT_DIR, file));
        delete (doc as any)._fontFamilies[std];
      }
    }

    const buffers: Buffer[] = [];
    doc.on("data", (c: Buffer) => buffers.push(c));
    doc.on("error", reject);

    // ── Watermark: drawn first on each content page so it sits under all content ─
    if (LOGO_PATH) {
      doc.on("pageAdded", () => {
        doc.save();
        (doc as any).opacity(0.2); // ~5.5% — visible but non-intrusive
        const wmSize = 190;
        const wmX = (doc.page.width - wmSize) / 2;
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
    const PW = doc.page.width,
      PH = doc.page.height;
    // night radial glow
    const glow = doc.radialGradient(
      cx,
      PH * 0.42,
      40,
      cx,
      PH * 0.42,
      PH * 0.65,
    );
    glow.stop(0, C.nightAlt).stop(1, C.night);
    doc.rect(0, 0, PW, PH).fill(glow);

    // double gold frame
    doc
      .lineWidth(2)
      .strokeColor(C.gold)
      .rect(26, 26, PW - 52, PH - 52)
      .stroke();
    doc
      .lineWidth(0.7)
      .strokeColor(C.goldDeep)
      .rect(31, 31, PW - 62, PH - 62)
      .stroke();
    cornerFlourish(doc, 38, 38, 22, "tl");
    cornerFlourish(doc, PW - 38, 38, 22, "tr");
    cornerFlourish(doc, 38, PH - 38, 22, "bl");
    cornerFlourish(doc, PW - 38, PH - 38, 22, "br");

    // ── Logo medallion: image clipped inside double golden rings ────────────
    const logoCY = 118,
      outerR = 56,
      innerR = 47;
    if (LOGO_PATH) {
      // 1. Clip image to circle and fill the medallion
      doc.save();
      doc.circle(cx, logoCY, innerR - 1).clip();
      doc.image(LOGO_PATH, cx - (innerR - 1), logoCY - (innerR - 1), {
        width: (innerR - 1) * 2,
        height: (innerR - 1) * 2,
      });
      doc.restore();
    } else {
      mandala(doc, cx, logoCY, innerR);
    }
    // 2. Outer thick gold ring
    doc.lineWidth(2.2).strokeColor(C.gold).circle(cx, logoCY, outerR).stroke();
    // 3. Inner thinner ring (sits just outside the clipped logo edge)
    doc
      .lineWidth(1)
      .strokeColor(C.goldDeep)
      .circle(cx, logoCY, innerR)
      .stroke();
    // 4. Tiny tick marks around the outer ring for detail
    doc.lineWidth(0.6).strokeColor(C.gold);
    for (let i = 0; i < 36; i++) {
      const a = ((Math.PI * 2) / 36) * i;
      const r1 = outerR + 3,
        r2 = outerR + 7;
      doc
        .moveTo(cx + Math.cos(a) * r1, logoCY + Math.sin(a) * r1)
        .lineTo(cx + Math.cos(a) * r2, logoCY + Math.sin(a) * r2)
        .stroke();
    }
    // 5. Outermost decorative circle enclosing the ticks
    doc
      .lineWidth(0.5)
      .strokeColor(C.goldDeep)
      .circle(cx, logoCY, outerR + 8)
      .stroke();

    doc
      .font(SERIF)
      .fontSize(12)
      .fillColor(C.gold)
      .text(s("brand"), L, 196, {
        width: pageW,
        align: "center",
        characterSpacing: lang === "hi" ? 0 : 3,
      });
    doc
      .font(SERIF_B)
      .fontSize(lang === "hi" ? 26 : 30)
      .fillColor(C.white)
      .text(s("reportTitle"), L, 218, {
        width: pageW,
        align: "center",
      });
    doc
      .font(SERIF_I)
      .fontSize(11.5)
      .fillColor(C.goldLight)
      .text(s("coverTagline"), L, 258, { width: pageW, align: "center" });
    divider(doc, cx, 286, 150);

    // Name
    doc
      .font(SERIF_B)
      .fontSize(23)
      .fillColor(C.white)
      .text(kundali.name, L, 302, { width: pageW, align: "center" });

    // Birth details card
    const cardX = L + 26,
      cardY = 348,
      cardW = pageW - 52,
      cardH = 118;
    const cardG = doc.linearGradient(cardX, cardY, cardX, cardY + cardH);
    cardG.stop(0, C.nightAlt).stop(1, "#22101D");
    doc.roundedRect(cardX, cardY, cardW, cardH, 6).fill(cardG);
    doc
      .lineWidth(1)
      .strokeColor(C.gold)
      .roundedRect(cardX, cardY, cardW, cardH, 6)
      .stroke();

    const info: [string, string][] = [
      [s("dob"), kundali.dateOfBirth],
      [s("tob"), kundali.timeOfBirth],
      [s("pob"), kundali.placeOfBirth],
      [s("reportGenerated"), formatDate(kundali.generatedAt, lang)],
    ];
    const colW = cardW / 2;
    info.forEach(([label, val], i) => {
      const col = cardX + 22 + (i % 2) * colW;
      const row = cardY + 20 + Math.floor(i / 2) * 50;
      doc
        .font(SANS)
        .fontSize(7.5)
        .fillColor(C.gold)
        .text(lang === "hi" ? label : label.toUpperCase(), col, row, { characterSpacing: lang === "hi" ? 0 : 1 });
      doc
        .font(SERIF_B)
        .fontSize(11)
        .fillColor(C.white)
        .text(String(val), col, row + 12, { width: colW - 36 });
    });

    // Key signs strip
    const stripY = 488;
    const items: [string, string, string][] = [
      [s("lagna"), T.rashi(kundali.lagna.sign, lang), "asc"],
      [s("moonSign"), T.rashi(kundali.moonSign, lang), "moon"],
      [s("sunSign"), T.rashi(kundali.sunSign, lang), "sun"],
      [s("nakshatra"), T.nakshatra(kundali.moonNakshatra, lang), "star"],
    ];
    const sw = pageW / 4;
    items.forEach(([label, val, sym], i) => {
      const bx = L + i * sw;
      symbol(doc, sym, bx + sw / 2, stripY, 12, C.gold);
      doc
        .font(SERIF_B)
        .fontSize(11)
        .fillColor(C.white)
        .text(val, bx, stripY + 18, { width: sw, align: "center" });
      doc
        .font(SANS)
        .fontSize(7)
        .fillColor(C.gold)
        .text(lang === "hi" ? label : label.toUpperCase(), bx, stripY + 34, {
          width: sw,
          align: "center",
          characterSpacing: lang === "hi" ? 0 : 1,
        });
      if (i < 3)
        doc
          .lineWidth(0.5)
          .strokeColor(C.goldDeep)
          .moveTo(bx + sw, stripY - 8)
          .lineTo(bx + sw, stripY + 40)
          .stroke();
    });

    divider(doc, cx, 556, 150);
    doc
      .font(SERIF_I)
      .fontSize(8.5)
      .fillColor(C.muted)
      .text(s("coverNote"), L, PH - 92, { width: pageW, align: "center", lineGap: 2 });

    /* ── PAGE 2: CHARTS (vertical stacked, full-width) ────────────────── */
    doc.addPage();
    contentHeader(doc, L, pageW, s("hdrCharts"), lang);
    pageFrame(doc);

    const retroSet = new Set<string>(
      Object.entries(kundali.planets || {})
        .filter(([, p]: any) => p?.retrograde)
        .map(([n]) => n),
    );

    // Two charts stacked vertically — size chosen so both + summary fit on one page.
    // Available vertical space: ~742 pts (below header 48 → above footer 808).
    // Title draws at y-20, so gap must be >20 to avoid overlap with chart above.
    // Layout: d1Y(62) + chartSz + gap(28) + d9Y + chartSz + gap(14) + summary(86) + legend(20) ≤ 800
    const chartSz  = 270;
    const chartX   = L + (pageW - chartSz) / 2;   // centered horizontally
    const d1Y      = 76;   // title at y=56, safely below the 46pt maroon header band
    const d9Y      = d1Y + chartSz + 28;  // D9 title at d1Bottom+8, 8pt clear of D1 box

    // D1 — Rashi Birth Chart
    const housesArr: any[] = Array.isArray(kundali.houses)
      ? kundali.houses
      : Object.values(kundali.houses || {});
    drawNorthIndianChart(doc, chartX, d1Y, chartSz, housesArr, s("d1Title"), retroSet);

    // D9 — Navamsa Chart
    const nav = kundali.navamsa;
    const navIdx = RASHIS.indexOf(nav?.lagnaSign || "Aries");
    const navHouses = Array.from({ length: 12 }, (_, k) => {
      const h = k + 1;
      const sign = RASHIS[(navIdx + h - 1) % 12];
      const navPlanets = nav?.planets
        ? Object.entries(nav.planets)
            .filter(([, p]: any) => p?.houseNumber === h)
            .map(([n]) => n)
        : [];
      return { number: h, sign, planets: navPlanets };
    });
    drawNorthIndianChart(doc, chartX, d9Y, chartSz, navHouses, s("d9Title"), retroSet);

    // ── Chart summary card — pinned below D9 ─────────────────────────────
    const sumCardY = d9Y + chartSz + 14;
    const sumCardH = 86;
    doc.roundedRect(L, sumCardY, pageW, sumCardH, 5).fill(C.card);
    doc.lineWidth(0.8).strokeColor(C.gold).roundedRect(L, sumCardY, pageW, sumCardH, 5).stroke();
    doc.rect(L, sumCardY, 3.5, sumCardH).fill(C.gold);
    doc.font(SERIF_B).fontSize(10).fillColor(C.maroon).text(s("chartSummary"), L + 14, sumCardY + 10);

    const sumPairs: [string, string][] = [
      [s("lagnaAscendant"),  `${T.rashi(kundali.lagna.sign, lang)}  ${kundali.lagna.degree.toFixed(2)}°`],
      [s("navamsaLagna"),    nav?.lagnaSign ? T.rashi(nav.lagnaSign, lang) : "N/A"],
      [s("moonSign"),        `${T.rashi(kundali.moonSign, lang)}`],
      [s("moonNakshatraLbl"),`${T.nakshatra(kundali.moonNakshatra, lang)} (${s("pada")} ${kundali.moonPada})`],
    ];
    const sumLblW = lang === "hi" ? 96 : 118;
    sumPairs.forEach((pr, i) => {
      const colx = L + 14 + (i % 2) * (pageW / 2);
      const rowy = sumCardY + 28 + Math.floor(i / 2) * 18;
      doc.font(SANS).fontSize(7.5).fillColor(C.muted).text(pr[0] + ":", colx, rowy, { width: sumLblW });
      doc.font(SANS_B).fontSize(8.5).fillColor(C.ink).text(pr[1], colx + sumLblW, rowy, { width: pageW / 2 - sumLblW - 14 });
    });

    // ── Legend ────────────────────────────────────────────────────────────
    doc.font(SANS).fontSize(7.5).fillColor(C.muted)
      .text(s("legend"), L, sumCardY + sumCardH + 10, { width: pageW, align: "center" });

    /* ── PAGE 3: PLANETARY POSITIONS ───────────────────────────────────── */
    doc.addPage();
    contentHeader(doc, L, pageW, s("hdrPositions"), lang);
    pageFrame(doc);
    doc.y = 66;

    const pw = [62, 78, 92, 58, 44, pageW - 62 - 78 - 92 - 58 - 44];
    tableHeader(
      doc,
      L,
      pageW,
      [s("colPlanet"), s("colRashi"), s("colNakshatra"), s("colDegree"), s("colHouse"), s("colNavamsa")],
      pw,
    );

    let alt = false;
    for (const name of PLANET_ORDER) {
      const p = kundali.planets?.[name];
      if (!p) continue;
      const y = doc.y;
      if (alt) doc.rect(L, y, pageW, 21).fill(C.creamAlt);
      alt = !alt;
      const retro = p.retrograde ? " (R)" : "";
      const cols = [
        T.planet(name, lang) + retro,
        p.rashi ? T.rashi(p.rashi, lang) : "—",
        p.nakshatra ? T.nakshatra(p.nakshatra, lang) : "—",
        `${(p.degree || 0).toFixed(2)}°`,
        `${p.houseNumber || "—"}`,
        p.navamsaSign ? T.rashi(p.navamsaSign, lang) : "—",
      ];
      let tx = L;
      cols.forEach((v, i) => {
        doc
          .font(i === 0 ? SANS_B : SANS)
          .fontSize(9)
          .fillColor(i === 0 ? C.maroon : C.ink)
          .text(v, tx + 6, y + 6, { width: pw[i] - 8 });
        tx += pw[i];
      });
      doc.y = y + 21;
    }
    doc
      .lineWidth(0.8)
      .strokeColor(C.gold)
      .moveTo(L, doc.y)
      .lineTo(L + pageW, doc.y)
      .stroke();

    doc.moveDown(1.2);
    sectionHeader(doc, L, pageW, s("housePlacements"), undefined, C.maroon, lang);
    doc.moveDown(0.3);
    const hw = [70, 110, pageW - 180];
    tableHeader(doc, L, pageW, [s("colHouse"), s("colSign"), s("colPlanets")], hw);
    alt = false;
    for (const h of housesArr) {
      const y = doc.y;
      if (alt) doc.rect(L, y, pageW, 19).fill(C.creamAlt);
      alt = !alt;
      doc
        .font(SANS_B)
        .fontSize(8.5)
        .fillColor(C.ink)
        .text(`${s("house")} ${h.number}`, L + 6, y + 5, { width: hw[0] - 8 });
      doc
        .font(SANS)
        .fontSize(8.5)
        .fillColor(C.ink)
        .text(T.rashi(h.sign, lang), L + hw[0] + 6, y + 5, { width: hw[1] - 8 });
      doc
        .font(SANS)
        .fontSize(8.5)
        .fillColor(C.maroon)
        .text(h.planets?.length ? planetList(h.planets.join(", "), lang) : "—", L + hw[0] + hw[1] + 6, y + 5, {
          width: hw[2] - 8,
        });
      doc.y = y + 19;
    }

    /* ── PAGE 4: YOGAS & DOSHAS ────────────────────────────────────────── */
    doc.addPage();
    contentHeader(doc, L, pageW, s("hdrYogasDoshas"), lang);
    pageFrame(doc);
    doc.y = 66;

    sectionHeader(doc, L, pageW, s("auspiciousYogas"), undefined, C.maroon, lang);
    doc.moveDown(0.4);
    const yogas = (kundali.yogas || []).filter((y: any) => y.isPresent);
    if (!yogas.length) {
      doc
        .font(SERIF)
        .fontSize(10)
        .fillColor(C.muted)
        .text(s("noYogas"), L + 6, doc.y, { width: pageW - 12 });
      doc.moveDown(1.2);
    } else {
      for (const yg of yogas) {
        ensureSpace(doc, 80, () => {
          contentHeader(doc, L, pageW, s("hdrYogasDoshasCont"), lang);
          pageFrame(doc);
          doc.y = 66;
        });
        const top = doc.y;
        star(doc, L + 4, top + 6, 4, C.gold, 6);
        doc
          .font(SERIF_B)
          .fontSize(11)
          .fillColor(C.maroon)
          .text(yogaName(yg.name, lang), L + 14, top, { width: pageW - 100, lineBreak: false });
        doc
          .font(SANS_B)
          .fontSize(8)
          .fillColor(C.goldDeep)
          .text(lang === "hi" ? T.strength(yg.strength, lang) : (yg.strength || "").toUpperCase(), L + pageW - 80, top + 2, {
            width: 76,
            align: "right",
            lineBreak: false,
          });
        doc.y = top + 18;
        doc
          .font(SERIF)
          .fontSize(9.5)
          .fillColor(C.inkSoft)
          .lineGap(2)
          .text(yg.description || "", L + 14, doc.y, {
            width: pageW - 20,
            align: "justify",
          });
        doc.moveDown(0.5);
        divider(doc, cx, doc.y + 2, pageW / 2 - 6, C.rule);
        doc.moveDown(0.7);
      }
    }

    doc.moveDown(0.3);
    sectionHeader(doc, L, pageW, s("doshasKarmic"), undefined, "#7A2433", lang);
    doc.moveDown(0.4);
    const doshas = (kundali.doshas || []).filter((d: any) => d.isPresent);
    if (!doshas.length) {
      doc
        .font(SERIF)
        .fontSize(10)
        .fillColor(C.muted)
        .text(s("noDoshas"), L + 6, doc.y, { width: pageW - 12 });
    } else {
      for (const ds of doshas) {
        ensureSpace(doc, 100, () => {
          contentHeader(doc, L, pageW, s("hdrYogasDoshasCont"), lang);
          pageFrame(doc);
          doc.y = 66;
        });
        const sev =
          ds.severity === "High"
            ? C.red
            : ds.severity === "Moderate"
              ? "#9A5A00"
              : C.goldDeep;
        const top = doc.y;
        doc.roundedRect(L, top, pageW, 20, 3).fill("#FBEEEE");
        doc.rect(L, top, 4, 20).fill(sev);
        doc
          .font(SERIF_B)
          .fontSize(10)
          .fillColor(sev)
          .text(doshaName(ds.name || "", lang), L + 14, top + 5, {
            width: pageW - 120,
            lineBreak: false,
          });
        doc
          .font(SANS_B)
          .fontSize(7.5)
          .fillColor(sev)
          .text(
            `${s("severity")}: ${lang === "hi" ? T.severity(ds.severity, lang) : (ds.severity || "").toUpperCase()}`,
            L + pageW - 100,
            top + 6,
            { width: 96, align: "right", lineBreak: false },
          );
        doc.y = top + 24;
        doc
          .font(SERIF)
          .fontSize(9.5)
          .fillColor(C.inkSoft)
          .lineGap(2)
          .text(ds.description || "", L + 14, doc.y, {
            width: pageW - 20,
            align: "justify",
          });
        if (ds.remedy) {
          doc.moveDown(0.4);

          doc
            .font(SANS_B)
            .fontSize(8.5)
            .fillColor(C.green)
            .text(s("remedy"), L + 14, doc.y, {
              continued: true,
            });

          doc
            .font(SERIF_I)
            .fontSize(9)
            .fillColor(C.inkSoft)
            .text(ds.remedy, {
              width: pageW - 82,
              lineGap: 1,
            });
        }
        doc.moveDown(0.9);
      }
    }

    /* ── PAGE 5: DASHA ─────────────────────────────────────────────────── */
    doc.addPage();
    contentHeader(doc, L, pageW, s("hdrDasha"), lang);
    pageFrame(doc);
    doc.y = 66;

    const d = kundali.dasha;

    // Build period cards data
    const periodCards: Array<{ label: string; planet: string; range: string; accent: string }> = [
      { label: s('mahadasha'),  planet: T.planet(d.currentMahadasha, lang),  range: `${d.mahadashaStartDate}  –  ${d.mahadashaEndDate}`,    accent: C.maroon   },
      { label: s('antardasha'), planet: T.planet(d.currentAntardasha, lang), range: `${d.antardashaStartDate}  –  ${d.antardashaEndDate}`,  accent: C.goldDeep },
    ];
    if (d.currentPratyantar) {
      periodCards.push({ label: s('pratyantar'), planet: T.planet(d.currentPratyantar, lang), range: `${s('ends')}  ${d.pratyantarEndDate}`, accent: '#3B6E2A' });
    }

    const nPeriods   = periodCards.length;
    const dpHdrH     = 34;
    const dpSubH     = 72;
    const dpSubGap   = 10;
    const dpSubPad   = 8;
    const dpCardH    = dpHdrH + dpSubPad + dpSubH + dpSubPad + 4;
    const dpSubW     = (pageW - dpSubGap * (nPeriods - 1)) / nPeriods;
    const dpCardY    = doc.y;

    // 1. Outer card (cream bg)
    doc.roundedRect(L, dpCardY, pageW, dpCardH, 7).fill(C.card);

    // 2. Maroon header strip — clipped to rounded card shape
    doc.save();
    doc.roundedRect(L, dpCardY, pageW, dpCardH, 7).clip();
    doc.rect(L, dpCardY, pageW, dpHdrH).fill(C.maroon);
    doc.restore();

    // 3. Card border
    doc.lineWidth(1.2).strokeColor(C.gold).roundedRect(L, dpCardY, pageW, dpCardH, 7).stroke();

    // 4. Header text
    doc.font(SANS_B).fontSize(9.5).fillColor(C.goldLight)
      .text(s('currentPeriods'), L, dpCardY + 11, { width: pageW, align: 'center', characterSpacing: lang === 'hi' ? 0 : 1.2 });

    // Thin gold rule below header
    doc.lineWidth(0.7).strokeColor(C.gold)
      .moveTo(L + 20, dpCardY + dpHdrH).lineTo(L + pageW - 20, dpCardY + dpHdrH).stroke();

    // 5. Sub-cards (one per period)
    const dpSubY = dpCardY + dpHdrH + dpSubPad;
    periodCards.forEach(({ label, planet, range, accent }, i) => {
      const sx  = L + i * (dpSubW + dpSubGap);
      const iX  = sx + 12;
      const iW  = dpSubW - 16;

      // Sub-card bg + border
      doc.roundedRect(sx, dpSubY, dpSubW, dpSubH, 5).fill('#FFFFFF');
      doc.lineWidth(0.6).strokeColor(C.rule).roundedRect(sx, dpSubY, dpSubW, dpSubH, 5).stroke();

      // Left accent bar clipped to sub-card shape
      doc.save();
      doc.roundedRect(sx, dpSubY, dpSubW, dpSubH, 5).clip();
      doc.rect(sx, dpSubY, 4, dpSubH).fill(accent);
      doc.restore();

      // Period label (small caps style)
      doc.font(SANS_B).fontSize(6.5).fillColor(accent)
        .text(label, iX, dpSubY + 9, { width: iW, characterSpacing: lang === 'hi' ? 0 : 0.9, lineBreak: false });

      // Planet name (large serif)
      doc.font(SERIF_B).fontSize(15).fillColor(C.ink)
        .text(planet, iX, dpSubY + 20, { width: iW, lineBreak: false });

      // Thin rule
      doc.lineWidth(0.5).strokeColor(C.rule)
        .moveTo(iX, dpSubY + 42).lineTo(sx + dpSubW - 6, dpSubY + 42).stroke();

      // Date range
      doc.font(SANS).fontSize(7).fillColor(C.muted)
        .text(range, iX, dpSubY + 47, { width: iW, lineBreak: false });
    });

    doc.y = dpCardY + dpCardH + 14;

    sectionHeader(doc, L, pageW, s("mahadashaTimeline"), undefined, C.maroon, lang);
    doc.moveDown(0.3);
    const mw = [pageW - 80 - 80 - 64 - 56, 80, 80, 64, 56];
    tableHeader(
      doc,
      L,
      pageW,
      [s("colMahadasha"), s("colStart"), s("colEnd"), s("colDuration"), s("colStatus")],
      mw,
    );
    alt = false;
    for (const md of (d.timeline || []).slice(0, 18)) {
      ensureSpace(doc, 19, () => {
        contentHeader(doc, L, pageW, s("hdrDashaCont"), lang);
        pageFrame(doc);
        doc.y = 66;
      });
      const y = doc.y;
      if (md.isCurrent) doc.rect(L, y, pageW, 19).fill("#FBF1D8");
      else if (alt) doc.rect(L, y, pageW, 19).fill(C.creamAlt);
      alt = !alt;
      if (md.isCurrent) doc.rect(L, y, 3, 19).fill(C.gold);
      const yrs = Math.round(
        (new Date(md.endDate).getTime() - new Date(md.startDate).getTime()) /
          (365.25 * 864e5),
      );
      const cells = [
        T.planet(md.planet, lang),
        md.startDate,
        md.endDate,
        `${yrs} ${s("yrs")}`,
        md.isCurrent ? s("active") : "",
      ];
      let tx = L;
      cells.forEach((v, i) => {
        doc
          .font(md.isCurrent ? SANS_B : SANS)
          .fontSize(8.5)
          .fillColor(md.isCurrent ? C.maroon : C.ink)
          .text(v, tx + 6, y + 5, { width: mw[i] - 8 });
        tx += mw[i];
      });
      doc.y = y + 19;
    }

    const curMD = (d.timeline || []).find((m: any) => m.isCurrent);
    if (curMD?.antardashas?.length) {
      doc.moveDown(1);
      ensureSpace(doc, 140, () => {
        contentHeader(doc, L, pageW, s("hdrDashaCont"), lang);
        pageFrame(doc);
        doc.y = 66;
      });
      sectionHeader(
        doc,
        L,
        pageW,
        (S["antardashaWithin"] as (p: string) => string)(lang === "hi" ? T.planet(curMD.planet, lang) : String(curMD.planet).toUpperCase()),
        undefined,
        C.maroon,
        lang,
      );
      doc.moveDown(0.3);
      const aw = [pageW - 110 - 110 - 70, 110, 110, 70];
      tableHeader(doc, L, pageW, [s("colAntardasha"), s("colStart"), s("colEnd"), s("colStatus")], aw);
      alt = false;
      for (const ad of curMD.antardashas) {
        ensureSpace(doc, 18, () => {
          contentHeader(doc, L, pageW, s("hdrDashaCont"), lang);
          pageFrame(doc);
          doc.y = 66;
        });
        const y = doc.y;
        if (ad.isCurrent) doc.rect(L, y, pageW, 18).fill("#FBF1D8");
        else if (alt) doc.rect(L, y, pageW, 18).fill(C.creamAlt);
        alt = !alt;
        if (ad.isCurrent) doc.rect(L, y, 3, 18).fill(C.gold);
        const cells = [
          T.planet(ad.planet, lang),
          ad.startDate,
          ad.endDate,
          ad.isCurrent ? s("active") : "",
        ];
        let tx = L;
        cells.forEach((v, i) => {
          doc
            .font(ad.isCurrent ? SANS_B : SANS)
            .fontSize(8.5)
            .fillColor(ad.isCurrent ? C.maroon : C.ink)
            .text(v, tx + 6, y + 5, { width: aw[i] - 8 });
          tx += aw[i];
        });
        doc.y = y + 18;
      }
    }

    /* ── PAGE: SHANI SADE SATI & DHAIYA ───────────────────────────────── */
    const ss: any = (kundali as any).sadeSati;
    if (ss && ss.moon_sign) {
      doc.addPage();
      contentHeader(doc, L, pageW, s("hdrSadeSati"), lang);
      pageFrame(doc);
      doc.y = 66;

      const cs = ss.current_status || {};
      const inSS     = !!cs.in_sade_sati;
      const inDhaiya = !!cs.in_dhaiya;

      // ── Status banner ────────────────────────────────────────────────────
      const bannerH = 82;
      const bannerBg = inSS ? "#4A0A0A" : inDhaiya ? "#3B2000" : "#0D3320";
      const bannerAccent = inSS ? C.gold : inDhaiya ? "#F5A623" : "#27AE60";
      doc.roundedRect(L, doc.y, pageW, bannerH, 6).fill(bannerBg);
      doc.rect(L, doc.y, 4, bannerH).fill(bannerAccent);

      let statusLine1: string;
      let statusLine2: string;
      if (inSS) {
        statusLine1 = `${s("sadeSatiActive")}  ·  ${phaseName(cs.phase || "", lang)} ${s("phase")}  (${cs.phase_sanskrit || ""})`;
        statusLine2 = `${s("cycle")}: ${cs.cycle_start_date || ""}  –  ${cs.cycle_end_date || ""}     ${s("phaseEnds")}: ${cs.phase_end_date || ""}`;
      } else if (inDhaiya) {
        statusLine1 = `${s("dhaiyaActive")}  ·  ${cs.in_dhaiya?.type || ""}`;
        statusLine2 = `${s("period")}: ${cs.in_dhaiya?.startDate || ""}  –  ${cs.in_dhaiya?.endDate || ""}`;
      } else {
        statusLine1 = s("freeSadeSati");
        statusLine2 = cs.next_cycle_start_date
          ? `${s("nextCycle")}: ${cs.next_cycle_start_date}  –  ${cs.next_cycle_end_date || ""}`
          : s("noUpcoming");
      }

      const bannerY = doc.y;
      doc.font(SERIF_B).fontSize(12).fillColor(bannerAccent)
        .text(statusLine1, L + 14, bannerY + 14, { width: pageW - 28 });
      doc.font(SANS).fontSize(8.5).fillColor("#EDEDCF")
        .text(statusLine2, L + 14, bannerY + 33, { width: pageW - 28 });

      const satNow = ss.saturn_now || {};
      const satLine = `${s("saturnNow")}  ${T.rashi(satNow.sign || "", lang)}  ${(satNow.degree_in_sign || 0).toFixed(2)}°${satNow.retrograde ? `  (${s("retrograde")})` : ""}   ·   ${s("asOf")} ${satNow.as_of || ""}`;
      doc.font(SANS).fontSize(7.5).fillColor("#AEAEAE")
        .text(satLine, L + 14, bannerY + 52, { width: pageW - 28 });
      doc.y = bannerY + bannerH + 12;

      // ── Three-column info row ──────────────────────────────────────────
      const colW = (pageW - 16) / 3;
      const infoCards: [string, string, string][] = [
        [s("janmaRashi"), T.rashi(ss.moon_sign || "", lang), `(${ss.moon_sign_sanskrit || ""})`],
        [s("sadeSatiSigns"),
          `${T.rashi(ss.sade_sati_signs?.twelfth_from_moon || "", lang)} · ${T.rashi(ss.sade_sati_signs?.moon_sign || "", lang)} · ${T.rashi(ss.sade_sati_signs?.second_from_moon || "", lang)}`, ""],
        [s("dhaiyaSigns"),
          `4th: ${T.rashi(ss.dhaiya_signs?.kantaka_shani_4th || "", lang)}`, `8th: ${T.rashi(ss.dhaiya_signs?.ashtama_shani_8th || "", lang)}`],
      ];
      const infoY = doc.y;
      const infoH = 56;
      infoCards.forEach(([label, val1, val2], ci) => {
        const cx = L + ci * (colW + 8);
        doc.roundedRect(cx, infoY, colW, infoH, 4).fill(C.card);
        doc.lineWidth(0.7).strokeColor(C.gold).roundedRect(cx, infoY, colW, infoH, 4).stroke();
        doc.font(SANS).fontSize(7).fillColor(C.muted)
          .text(label, cx + 8, infoY + 8, { width: colW - 16 });
        doc.font(SERIF_B).fontSize(9.5).fillColor(C.maroon)
          .text(val1, cx + 8, infoY + 22, { width: colW - 16 });
        if (val2) {
          doc.font(SANS).fontSize(8.5).fillColor(C.ink)
            .text(val2, cx + 8, infoY + 36, { width: colW - 16 });
        }
      });
      doc.y = infoY + infoH + 14;

      // ── Sade Sati Lifecycle table ──────────────────────────────────────
      sectionHeader(doc, L, pageW, s("sadeSatiLifecycle"), undefined, C.maroon, lang);
      doc.moveDown(0.3);

      // Table columns: Cycle | Period | Rising | Peak | Setting | Status  (sum = pageW 499)
      const ssColW = [30, 110, 92, 92, 92, 83];
      const ssCols = ["#", s("colCyclePeriod"), s("colRising"), s("colPeak"), s("colSetting"), s("colStatus")];
      tableHeader(doc, L, pageW, ssCols, ssColW);

      const cycles: any[] = (ss.cycles || []);
      // Show last past cycle + current + next 2 upcoming (max 4)
      const pastCycles = cycles.filter((c: any) => c.is_past);
      const currentCycles = cycles.filter((c: any) => c.is_current);
      const futureCycles = cycles.filter((c: any) => !c.is_past && !c.is_current);
      const displayCycles = [
        ...pastCycles.slice(-1),
        ...currentCycles,
        ...futureCycles.slice(0, 2),
      ];

      let ssAlt = false;
      for (const cyc of displayCycles) {
        const rowH = 19;
        const ry = doc.y;
        const phasesMap: Record<string, any> = {};
        (cyc.phases || []).forEach((p: any) => { phasesMap[p.phase] = p; });

        const rowBg = cyc.is_current ? "#FBF1D8" : cyc.is_past ? "#F7F4F0" : (ssAlt ? C.creamAlt : "#FFFFFF");
        doc.rect(L, ry, pageW, rowH).fill(rowBg);
        if (cyc.is_current) doc.rect(L, ry, 3, rowH).fill(C.gold);

        const statusLabel = cyc.is_current ? s("active") : cyc.is_past ? s("past") : s("upcoming");
        const statusColor = cyc.is_current ? C.maroon : cyc.is_past ? C.muted : C.ink;

        const rowVals = [
          String(cyc.cycle_number),
          `${cyc.startDate} –\n${cyc.endDate}`,
          phasesMap["Rising"] ? `${phasesMap["Rising"].startDate} –\n${phasesMap["Rising"].endDate}` : "—",
          phasesMap["Peak"]   ? `${phasesMap["Peak"].startDate} –\n${phasesMap["Peak"].endDate}`   : "—",
          phasesMap["Setting"]? `${phasesMap["Setting"].startDate} –\n${phasesMap["Setting"].endDate}` : "—",
          statusLabel,
        ];

        let tx = L;
        rowVals.forEach((val, ci) => {
          const fnt = ci === 5 ? SANS_B : SANS;
          const fColor = ci === 5 ? statusColor : (cyc.is_current ? C.ink : ci === 0 ? C.goldDeep : C.ink);
          doc.font(fnt).fontSize(7.5).fillColor(fColor)
            .text(val, tx + 4, ry + 4, { width: ssColW[ci] - 6, lineBreak: true, lineGap: -1 });
          tx += ssColW[ci];
        });
        doc.rect(L, ry + rowH - 0.5, pageW, 0.5).fill("#E8E0D0");
        doc.y = ry + rowH;
        ssAlt = !ssAlt;
      }
      doc.y += 10;

      // ── Dhaiya periods ────────────────────────────────────────────────
      sectionHeader(doc, L, pageW, s("dhaiyaSmallPanoti"), undefined, C.maroon, lang);
      doc.moveDown(0.3);

      const dhaiya = ss.dhaiya || {};
      const dhHalf = (pageW - 12) / 2;
      const dhY = doc.y;

      const drawDhaiyaCol = (ox: number, title: string, sign: string, periods: any[]) => {
        doc.roundedRect(ox, dhY, dhHalf, 90, 4).fill(C.card);
        doc.lineWidth(0.6).strokeColor(C.gold).roundedRect(ox, dhY, dhHalf, 90, 4).stroke();
        doc.rect(ox, dhY, 3, 90).fill(C.goldDeep);
        doc.font(SANS_B).fontSize(8).fillColor(C.maroon)
          .text(title, ox + 10, dhY + 8, { width: dhHalf - 16 });
        doc.font(SANS).fontSize(7).fillColor(C.muted)
          .text(`${s("saturnIn")} ${T.rashi(sign, lang)}`, ox + 10, dhY + 20, { width: dhHalf - 16 });
        const list = (periods || []).slice(0, 4);
        list.forEach((p: any, i: number) => {
          const py = dhY + 32 + i * 14;
          const dot = p.is_current ? "●" : "○";
          const fColor = p.is_current ? C.maroon : C.ink;
          doc.font(SANS).fontSize(7.5).fillColor(fColor)
            .text(`${dot}  ${p.startDate}  –  ${p.endDate}${p.is_current ? `  ← ${s("active")}` : ""}`,
              ox + 10, py, { width: dhHalf - 16 });
        });
        if (!list.length) {
          doc.font(SANS).fontSize(7.5).fillColor(C.muted)
            .text(s("noOccurrences"), ox + 10, dhY + 32, { width: dhHalf - 16 });
        }
      };

      drawDhaiyaCol(L,          s("kantakaShani"), ss.dhaiya_signs?.kantaka_shani_4th || "", dhaiya.kantaka_shani_4th || []);
      drawDhaiyaCol(L + dhHalf + 12, s("ashtamaShani"), ss.dhaiya_signs?.ashtama_shani_8th || "", dhaiya.ashtama_shani_8th || []);
      doc.y = dhY + 90 + 14;

      // ── Shani's Counsel (insight) ─────────────────────────────────────
      sectionHeader(doc, L, pageW, s("shanisCounsel"), undefined, C.maroon, lang);
      doc.moveDown(0.3);

      const counsel = sadeSatiCounsel({
        inSS, inDhaiya,
        moonSign: ss.moon_sign || "",
        phase: cs.phase || "",
        phaseEndDate: cs.phase_end_date,
        significance: cs.significance,
        dhaiyaType: cs.in_dhaiya?.type || "",
        dhaiyaEnd: cs.in_dhaiya?.endDate,
        nextStart: cs.next_cycle_start_date || "",
      }, lang);

      const counselY = doc.y;
      const counselH = 82;
      doc.roundedRect(L, counselY, pageW, counselH, 5).fill(C.card);
      doc.lineWidth(0.8).strokeColor(C.gold).roundedRect(L, counselY, pageW, counselH, 5).stroke();
      doc.rect(L, counselY, 3.5, counselH).fill(C.maroon);
      doc.font(SANS).fontSize(8).fillColor(C.ink)
        .text(counsel, L + 14, counselY + 10, { width: pageW - 24, lineGap: 2 });
      doc.y = counselY + counselH + 8;

      // Remedies note
      doc.font(SANS).fontSize(7.5).fillColor(C.muted)
        .text(s("sadeSatiRemedies"), L, doc.y, { width: pageW, align: "left", lineGap: 1 });
    }

    /* ── LIFE ANALYSIS ─────────────────────────────────────────────────── */
    const sections: Array<{ titleKey: string; key: string }> = [
      { titleKey: "secPersonality", key: "personality" },
      { titleKey: "secCareer", key: "career" },
      { titleKey: "secFinance", key: "finance" },
      { titleKey: "secMarriage", key: "marriage" },
      { titleKey: "secHealth", key: "health" },
      { titleKey: "secEducation", key: "education" },
      { titleKey: "secChildren", key: "children" },
      { titleKey: "secSpirituality", key: "spirituality" },
    ];

    doc.addPage();
    contentHeader(doc, L, pageW, s("hdrLifeAnalysis"), lang);
    pageFrame(doc);
    doc.y = 66;

    for (const sec of sections) {
      const text = interp[sec.key];
      if (!text) continue;
      // Ensure room for the header bar + at least 3 lines of body text before adding
      ensureSpace(doc, 100, () => {
        contentHeader(doc, L, pageW, s("hdrLifeAnalysisCont"), lang);
        pageFrame(doc);
        doc.y = 66;
      });
      sectionHeader(doc, L, pageW, s(sec.titleKey), undefined, C.maroon, lang);
      doc
        .font(SERIF)
        .fontSize(10)
        .fillColor(C.ink)
        .lineGap(3)
        .text(text, L + 6, doc.y, { width: pageW - 12, align: "justify" });
      doc.moveDown(1.2);
    }

    // Strengths & challenges
    const strCount =
      (interp.strengths || []).length + (interp.challenges || []).length;
    ensureSpace(doc, 60 + strCount * 18, () => {
      contentHeader(doc, L, pageW, s("hdrLifeAnalysisCont"), lang);
      pageFrame(doc);
      doc.y = 66;
    });
    sectionHeader(doc, L, pageW, s("strengthsAreas"), undefined, C.maroon, lang);
    doc.moveDown(0.4);
    const colGap = 20;
    const colWid = (pageW - colGap) / 2;
    const sxL = L,
      sxR = L + colWid + colGap;
    const startY = doc.y;

    // Left column — strengths
    doc
      .font(SERIF_B)
      .fontSize(10)
      .fillColor(C.green)
      .text(s("naturalStrengths"), sxL, startY, { width: colWid });
    let ly = startY + 18;
    for (const item of interp.strengths || []) {
      star(doc, sxL + 4, ly + 5, 3, C.green, 5);
      doc
        .font(SERIF)
        .fontSize(9.5)
        .fillColor(C.ink)
        .text(item, sxL + 14, ly, { width: colWid - 18, lineGap: 1 });
      ly = doc.y + 4;
    }
    const leftEnd = ly;

    // Right column — challenges (rendered at same startY, independent cursor)
    doc
      .font(SERIF_B)
      .fontSize(10)
      .fillColor(C.red)
      .text(s("areasToWork"), sxR, startY, { width: colWid });
    ly = startY + 18;
    for (const c of interp.challenges || []) {
      diamondDot(doc, sxR + 4, ly + 5, 2.4, C.red);
      doc
        .font(SERIF)
        .fontSize(9.5)
        .fillColor(C.ink)
        .text(c, sxR + 14, ly, { width: colWid - 18, lineGap: 1 });
      ly = doc.y + 4;
    }
    // Advance past whichever column is taller
    doc.y = Math.max(leftEnd, ly) + 10;

    /* ── RECOMMENDATIONS ───────────────────────────────────────────────── */
    doc.addPage();
    contentHeader(doc, L, pageW, s("hdrRecommendations"), lang);
    pageFrame(doc);
    doc.y = 66;

    const recs = [
      { title: s("recMantras"),   items: interp.mantras || [],    note: s("noteMantras") },
      { title: s("recGemstones"), items: interp.gemstones || [],  note: s("noteGemstones") },
      { title: s("recFasting"),   items: interp.fastingDays || [], note: s("noteFasting") },
      { title: s("recCharity"),   items: interp.charities || [],  note: s("noteCharity") },
    ];
    for (const r of recs) {
      if (!r.items.length) continue;
      // Ensure enough room for the header + note + at least one item before starting the section
      ensureSpace(doc, 110, () => {
        contentHeader(doc, L, pageW, s("hdrRecommendationsCont"), lang);
        pageFrame(doc);
        doc.y = 66;
      });
      sectionHeader(doc, L, pageW, r.title, undefined, C.maroon, lang);
      doc
        .font(SERIF_I)
        .fontSize(9)
        .fillColor(C.muted)
        .text(r.note, L + 6, doc.y, { width: pageW - 12, lineGap: 1 });
      doc.moveDown(0.6);
      for (const it of r.items) {
        ensureSpace(doc, 28, () => {
          contentHeader(doc, L, pageW, s("hdrRecommendationsCont"), lang);
          pageFrame(doc);
          doc.y = 66;
        });
        const iy = doc.y;
        diamondDot(doc, L + 7, iy + 6, 2.8, C.gold);
        doc
          .font(SERIF)
          .fontSize(10)
          .fillColor(C.ink)
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
    doc
      .lineWidth(0.8)
      .strokeColor(C.gold)
      .roundedRect(L, dy, pageW, 56, 5)
      .stroke();
    doc
      .font(SANS_B)
      .fontSize(8)
      .fillColor(C.maroon)
      .text(s("importantDisclaimer"), L + 12, dy + 9, {
        width: pageW - 24,
        align: "center",
        characterSpacing: lang === "hi" ? 0 : 1,
      });
    doc
      .font(SERIF)
      .fontSize(8.5)
      .fillColor(C.inkSoft)
      .lineGap(1.5)
      .text(s("disclaimerText"), L + 14, dy + 22, { width: pageW - 28, align: "center" });

    /* ── FOOTERS (all content pages) ───────────────────────────────────── */
    const range = doc.bufferedPageRange();
    const total = range.count;
    for (let i = 1; i < total; i++) {
      // skip cover (page 0)
      doc.switchToPage(i);
      doc.page.margins.bottom = 0; // prevent text-flow from adding new pages
      const fy = PH - 34;
      doc
        .lineWidth(0.6)
        .strokeColor(C.rule)
        .moveTo(L, fy)
        .lineTo(L + pageW, fy)
        .stroke();
      diamondDot(doc, cx, fy, 2, C.gold);
      doc
        .font(SERIF_I)
        .fontSize(8)
        .fillColor(C.muted)
        .text(s("footerBrand"), L, fy + 6, {
          width: pageW / 2,
          align: "left",
          lineBreak: false,
        });
      doc
        .font(SANS)
        .fontSize(8)
        .fillColor(C.muted)
        .text(`${s("page")} ${i + 1} ${s("of")} ${total}`, L + pageW / 2, fy + 6, {
          width: pageW / 2,
          align: "right",
          lineBreak: false,
        });
    }

    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.end();
  });
}
