import PDFDocument from "pdfkit";
import path from "path";
import { NakshatraData } from "../service/koota.service";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CompatibilityPDFInput {
  boy: { name: string; dateOfBirth: string; timeOfBirth: string; placeOfBirth: string };
  girl: { name: string; dateOfBirth: string; timeOfBirth: string; placeOfBirth: string };
  boyNakshatra: NakshatraData;
  girlNakshatra: NakshatraData;
  gunaMilan: {
    total_score: number;
    max_score: number;
    percentage: number;
    verdict: string;
    koota_breakdown: Array<{
      koota: string;
      score: number;
      max_score: number;
      description: string;
      passed: boolean;
    }>;
  };
  doshas: Array<{
    dosha_name: string;
    severity: string;
    description: string;
    classical_reference: string;
    cancellable: boolean;
  }>;
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  gold: "#C8A45A", goldLight: "#E6CE94", goldDeep: "#A07C32",
  maroon: "#6E142F", maroonDeep: "#4A0C1F",
  ink: "#2C1810", inkSoft: "#5A4636", muted: "#8B7355",
  cream: "#FDF8EF", creamAlt: "#F7EEDD", card: "#FBF4E6",
  rule: "#E3D2AE", white: "#FFFFFF",
  green: "#1F6B33", greenBg: "#EAF5EB",
  red: "#8E1B1B", redBg: "#FFF0F0",
  amber: "#B87B10", amberBg: "#FFF8E1",
  rose: "#7D2B3E",
};
const SERIF = "Times-Roman";
const SERIF_B = "Times-Bold";
const SERIF_I = "Times-Italic";
const SANS = "Helvetica";
const SANS_B = "Helvetica-Bold";
const SANS_I = "Helvetica-Oblique";
const PW = 595.28;
const PH = 841.89;
const ML = 48;
const MR = 48;
const W = PW - ML - MR;

// ─── Nakshatra Profiles ───────────────────────────────────────────────────────
const NX: Record<string, { deity: string; symbol: string; essence: string; traits: string; shadow: string }> = {
  "Ashwini": { deity: "Ashwini Kumaras (Divine Physicians)", symbol: "Horse Head", essence: "Swift healing, renewal, pioneering spirit", traits: "Dynamic, quick-minded, adventurous, healing", shadow: "Impatience, restlessness, scattered focus" },
  "Bharani": { deity: "Yama (Lord of Dharma)", symbol: "Yoni (Sacred Womb)", essence: "Transformation, responsibility, bearing life's burdens", traits: "Determined, creative, passionate, courageous", shadow: "Possessiveness, stubbornness, extremism" },
  "Krittika": { deity: "Agni (God of Sacred Fire)", symbol: "Razor / Flame", essence: "Purification, illumination, cutting through illusion", traits: "Sharp intellect, authoritative, ambitious, protective", shadow: "Aggression, over-criticism, pride" },
  "Rohini": { deity: "Brahma (The Creator)", symbol: "Cart / Chariot", essence: "Fertility, beauty, abundance, creative manifestation", traits: "Sensual, artistic, nurturing, materially gifted", shadow: "Possessiveness, materialism, jealousy" },
  "Mrigashira": { deity: "Soma (Moon God)", symbol: "Deer Head", essence: "Gentle curiosity, eternal quest, tender seeking", traits: "Intellectual, sensitive, multi-talented, gentle", shadow: "Anxiety, indecision, excessive searching" },
  "Ardra": { deity: "Rudra (Storm God)", symbol: "Teardrop / Diamond", essence: "Transformation through storm, intense emotional renewal", traits: "Sharp mind, intense, empathetic to suffering", shadow: "Destructiveness, emotional turbulence, rage" },
  "Punarvasu": { deity: "Aditi (Mother of Gods)", symbol: "Quiver of Arrows", essence: "Return to goodness, renewal, optimistic restoration", traits: "Philosophical, generous, optimistic, adaptable", shadow: "Inconsistency, over-idealism, naivety" },
  "Pushya": { deity: "Brihaspati (Jupiter, Divine Teacher)", symbol: "Cow Udder / Lotus", essence: "Nourishment, spiritual wisdom, divine abundance", traits: "Protective, spiritual, generous, responsible", shadow: "Dogmatism, self-righteousness, rigid conservatism" },
  "Ashlesha": { deity: "Nagas (Serpent Deities)", symbol: "Coiled Serpent", essence: "Mystical insight, kundalini awakening, hidden wisdom", traits: "Perceptive, magnetic, psychic, strategic", shadow: "Cunning, emotional manipulation, secretiveness" },
  "Magha": { deity: "Pitrus (Ancestral Spirits)", symbol: "Royal Throne", essence: "Ancestral power, royal authority, noble heritage", traits: "Leadership, dignity, proud, traditionally oriented", shadow: "Arrogance, elitism, ancestor-fixation" },
  "Purva Phalguni": { deity: "Bhaga (God of Prosperity)", symbol: "Front Legs of a Bed", essence: "Creative pleasure, rest, youthful love and joy", traits: "Charming, artistic, sensual, socially gifted", shadow: "Laziness, indulgence, vanity" },
  "Uttara Phalguni": { deity: "Aryaman (God of Contracts)", symbol: "Rear Legs of a Bed", essence: "Marital union, patronage, fulfillment of social contracts", traits: "Reliable, magnanimous, organized, socially gifted", shadow: "Dependency on approval, rigidity" },
  "Hasta": { deity: "Savitar (Sun in its Creative Aspect)", symbol: "Open Hand / Five Fingers", essence: "Skillful creation, healing touch, artistry and craft", traits: "Clever, dexterous, witty, healing-oriented", shadow: "Scheming wit, restlessness, manipulative charm" },
  "Chitra": { deity: "Vishwakarma (Celestial Architect)", symbol: "Bright Jewel / Pearl", essence: "Creative brilliance, beauty in form, divine design", traits: "Artistic, charismatic, skilled, perceptive", shadow: "Vanity, superficiality, scattered creativity" },
  "Swati": { deity: "Vayu (God of Wind)", symbol: "Coral / Young Shoot in Wind", essence: "Independence, flexibility, far-reaching trade and communication", traits: "Independent, diplomatic, idealistic, charming", shadow: "Restlessness, evasiveness, indecision" },
  "Vishakha": { deity: "Indra-Agni (Power and Sacred Fire)", symbol: "Triumphal Arch / Potter's Wheel", essence: "Purposeful achievement, triumph through sustained effort", traits: "Ambitious, focused, determined, goal-oriented", shadow: "Envy, competitive excess, relationship neglect" },
  "Anuradha": { deity: "Mitra (God of Friendship and Contracts)", symbol: "Lotus / Staff", essence: "Devotion, deep friendship, teamwork, celestial love", traits: "Devoted, diplomatic, friendly, quietly determined", shadow: "Over-dependence, self-suppression, clinging" },
  "Jyeshtha": { deity: "Indra (King of the Gods)", symbol: "Circular Amulet / Umbrella", essence: "Seniority, authority, protective elder-like wisdom", traits: "Wise, authoritative, protective, spiritually deep", shadow: "Jealousy, arrogance, manipulative use of power" },
  "Mula": { deity: "Nirriti (Goddess of Dissolution)", symbol: "Bundle of Roots / Lion's Tail", essence: "Root investigation, dissolution of the old, seeking foundations", traits: "Research-oriented, philosophical, investigative, transformative", shadow: "Destructive tendencies, uprooting stability, extremism" },
  "Purva Ashadha": { deity: "Apas (Water Goddess)", symbol: "Elephant Tusk / Fan", essence: "Invincibility, purification, early and sustained victory", traits: "Optimistic, proud, independent, influential", shadow: "Inflexibility, over-confidence, boastfulness" },
  "Uttara Ashadha": { deity: "Vishvadevas (Universal Gods)", symbol: "Elephant Tusk / Plank Bed", essence: "Final victory, universal values, dharmic completion", traits: "Leadership, integrity, refined, determined", shadow: "Single-mindedness, difficulty compromising" },
  "Shravana": { deity: "Vishnu (The Preserver)", symbol: "Three Footprints / Trident", essence: "Learning through listening, sacred connection, preservation", traits: "Intelligent, learned, perceptive, communicative", shadow: "Over-sensitivity to gossip, restlessness" },
  "Dhanishta": { deity: "Ashta Vasus (Eight Elemental Gods)", symbol: "Drum / Flute", essence: "Wealth, music, prosperity, material abundance", traits: "Ambitious, musical, confident, prosperity-oriented", shadow: "Greed, marital friction, excessive ambition" },
  "Shatabhisha": { deity: "Varuna (Lord of Cosmic Order)", symbol: "Empty Circle / Hundred Stars", essence: "Healing through mysticism, cosmic law, solitary wisdom", traits: "Scientific, reclusive, healing, original", shadow: "Isolation, eccentricity, emotional detachment" },
  "Purva Bhadrapada": { deity: "Aja Ekapad (One-Footed Dragon)", symbol: "Sword / Front Legs of Funeral Cot", essence: "Purification through fire, transformative and passionate devotion", traits: "Passionate, intense, reforming, spiritually driven", shadow: "Recklessness, extremism, uncontrolled emotions" },
  "Uttara Bhadrapada": { deity: "Ahir Budhnya (Serpent of the Depths)", symbol: "Two Rear Legs of Funeral Cot", essence: "Depth wisdom, patient endurance, compassionate completion", traits: "Wise, restrained, charitable, deeply empathetic", shadow: "Laziness, over-caution, withdrawal from the world" },
  "Revati": { deity: "Pushan (Divine Nurturer and Guide)", symbol: "Fish / Drum", essence: "Safe passage, divine nourishment, celestial journey home", traits: "Nurturing, creative, spiritual, deeply compassionate", shadow: "Over-sensitivity, naivety, otherworldliness" },
};

// ─── Guna Metadata ───────────────────────────────────────────────────────────
const GM: Record<string, { sanskrit: string; max: number; measures: string; classical: string; full: string; partial: string; poor: string }> = {
  "Varna": {
    sanskrit: "(Varna)", max: 1,
    measures: "Ego, spiritual evolution & work-ethic alignment",
    classical: "Varna koota, drawn from Brihat Parashara Hora Shastra, assesses whether both partners share compatible social dharma and work ethic. Aligned Varna ensures the couple understands each other's duties, ambitions, and place in the social order — reducing friction in daily responsibilities.",
    full: "Their social dharma and work ethic are in perfect alignment. The couple shares united values of duty, ambition, and spiritual responsibility — they will naturally stand side-by-side in life's obligations.",
    partial: "A minor difference in social orientation exists. With conscious mutual respect for each other's approach to duty and responsibility, this couple can bridge any Varna gap through open communication.",
    poor: "Different approaches to social hierarchy and duty may create friction in shared responsibilities. Conscious honoring of each other's unique perspective transforms this difference into a source of complementary strength.",
  },
  "Vashya": {
    sanskrit: "(Vashya)", max: 2,
    measures: "Mutual attraction, magnetic pull & natural dominance",
    classical: "Vashya koota governs the natural magnetism and power dynamic between partners. It indicates who naturally draws whom, and whether the pull is mutual — essential for creating a balanced, attractive relationship where neither partner feels controlled.",
    full: "An exceptional magnetic attraction flows between these two souls. Their influence over each other is beautifully balanced — neither dominates unduly, and both feel naturally compelled to love and support the other.",
    partial: "A pleasant natural attraction exists, with manageable differences in the power dynamic. Conscious communication and deliberate admiration for each other's strengths will harmonize any imbalance.",
    poor: "The natural magnetic pull between these partners needs active cultivation. Consciously celebrating each other's gifts and practicing daily appreciation will build the attraction Vashya seeks.",
  },
  "Tara": {
    sanskrit: "(Tara)", max: 3,
    measures: "Destiny, luck, fortune & life-trajectory alignment",
    classical: "Tara koota examines the relationship between both birth stars across nine divisions of the zodiac. It assesses whether the celestial timing, life opportunities, and overall fortune of both partners will tend to arrive in synchrony — or if they will frequently experience contrary timing.",
    full: "Their stars are divinely aligned for a fortunate journey together. Life's blessings, opportunities, and auspicious timing will tend to arrive in synchrony — making this union a vehicle for mutual growth and abundance.",
    partial: "Moderate star alignment indicates an overall fortunate partnership with occasional timing differences. Patience during periods of seeming misalignment will reveal the deeper cosmic plan at work in their union.",
    poor: "Celestial timing may occasionally feel out of synchrony between the partners. Shared spiritual practice, patience with each other's life rhythms, and conscious celebration of the other's victories will harmonize their destinies.",
  },
  "Yoni": {
    sanskrit: "(Yoni)", max: 4,
    measures: "Physical compatibility, intimate harmony & biological resonance",
    classical: "Yoni koota is among the most intimate of all compatibility factors in classical Jyotisha. It governs the depth of physical attraction, biological harmony, and the quality of energetic exchange between partners — considered essential for a fulfilling marital bond.",
    full: "Exceptional physical and energetic compatibility graces this union. Their bodies, rhythms, and intimate energy naturally flow together — creating a powerful and deeply satisfying foundation for physical and emotional closeness.",
    partial: "Good physical compatibility with complementary energies. Their intimate connection can deepen beautifully with patience, loving communication, and a genuine commitment to understanding each other's needs.",
    poor: "Physical compatibility requires conscious nurturing. With patience, open communication, and mutual respect, the couple can build a deeply fulfilling intimate connection that grows richer over years of shared life.",
  },
  "Maitri": {
    sanskrit: "(Graha Maitri)", max: 5,
    measures: "Intellectual friendship, mental rapport & psychological harmony",
    classical: "Graha Maitri examines the friendship between the ruling planets of both moon signs. A strong Maitri indicates that partners think similarly, find intellectual exchange stimulating, and experience a natural psychological harmony — the foundation of lasting companionship.",
    full: "Their minds are beautifully attuned. The planetary lords of their moon signs are deep friends — creating effortless intellectual resonance and psychological harmony. These two will understand each other without needing to explain themselves.",
    partial: "Good intellectual compatibility with some areas of natural difference. Their minds work in complementary ways — and with genuine curiosity about each other's perspectives, their mental friendship will flourish over time.",
    poor: "Their minds approach problems quite differently. Celebrating this diversity of thought — rather than seeking sameness — will transform intellectual differences into a stimulating source of growth and mutual discovery.",
  },
  "Gana": {
    sanskrit: "(Gana)", max: 6,
    measures: "Core temperament, behavioral disposition & attitudinal harmony",
    classical: "Gana koota represents the most fundamental level of a person's temperament — whether divine (Deva: generous, light), human (Manushya: balanced, complex), or wild (Rakshasa: fierce, intense). Compatible Ganas ensure effortless daily interaction and a natural understanding of each other's fundamental nature.",
    full: "A remarkable gift — their core temperaments are perfectly matched. Both partners approach life, relationships, and challenges with the same fundamental energy, creating effortless daily harmony and genuine mutual understanding.",
    partial: "Complementary temperaments create a rich, textured partnership. Their different core energies — when consciously appreciated rather than judged — become strengths that balance and elevate each other.",
    poor: "Significant temperamental differences require deep conscious bridging. Partners must genuinely honor and even celebrate each other's fundamental nature — not seek to change it — for this union to reach its potential.",
  },
  "Bhakut": {
    sanskrit: "(Bhakut)", max: 7,
    measures: "Life force, emotional health, prosperity & family wellbeing",
    classical: "Bhakut is one of the most powerful kootas in the Ashta Koota system, carrying 7 of the 36 points. It governs the flow of combined life energy (prana), emotional health, material prosperity, and the overall vitality of the family unit that this couple will create together.",
    full: "An extraordinarily auspicious Bhakut — their combined life force flows powerfully toward mutual prosperity, emotional wellbeing, and abundant family blessings. This couple's union is energetically potent and life-giving.",
    partial: "Generally favorable life force alignment. The couple's combined energy supports overall wellbeing and can build prosperity through conscious mutual support and aligned financial goals.",
    poor: "A Bhakut Dosha is present and requires serious attention (see Dosha Analysis section). With proper remedial measures, spiritual foundation, and conscious effort, this couple can navigate the challenges and build a meaningful, prosperous life.",
  },
  "Nadi": {
    sanskrit: "(Nadi)", max: 8,
    measures: "Genetic compatibility, health harmony & progeny wellbeing",
    classical: "Nadi is the most important koota in the Ashta Koota system, carrying the highest weight of 8 points out of 36. It governs the fundamental level of energetic and physiological compatibility — the body's life-current (nadi), health, and the genetic compatibility essential for healthy offspring.",
    full: "The most auspicious Nadi result — their life-energy currents are perfectly complementary. This bodes beautifully for their individual health, combined vitality, longevity together, and the health and brightness of their children.",
    partial: "Good Nadi harmony providing solid health compatibility. Their combined energetic constitutions are generally supportive of each other's wellbeing and overall health.",
    poor: "A Nadi Dosha is present — the most significant of all doshas (see Dosha Analysis section). Many couples with Nadi Dosha live long, healthy lives with proper remedial measures and dedicated spiritual practice.",
  },
};

// ─── Dosha Remedies ──────────────────────────────────────────────────────────
const DR: Record<string, { mantras: Array<{ text: string; instruction: string }>; puja: string; cancellation: string[]; gemstone: string; fasting: string; charity: string }> = {
  "Nadi Dosha": {
    mantras: [
      { text: "Om Tryambakam Yajamahe Sugandhim Pushtivardhanam\nUrvarukamiva Bandhanan Mrityor Mukshiya Mamritat", instruction: "Mahamrityunjaya Mantra — chant 108 times daily for 40 consecutive days before marriage" },
      { text: "Om Namo Bhagavate Vasudevaya", instruction: "Vishnu Mantra — recite 108 times every morning for 21 days" },
    ],
    puja: "Nadi Dosha Nivarana Puja should be performed by a learned Vedic priest at a Shiva temple — ideally at Kashi (Varanasi), Trimbakeshwar (Nashik), or Tirupati. The puja involves Abhishek of the Shiva linga, recitation of Mahamrityunjaya mantra, and specific havan (fire ritual) with offerings of til (sesame), ghee, and honey.",
    cancellation: [
      "If both partners share the same Moon Rashi (sign) but are born in different Nakshatras",
      "If both partners are born in the same Nakshatra but in different Padas (quarters)",
      "If Jupiter (Guru) is exalted, in its own sign, or in the 5th/9th house of either chart",
      "If the Moon is exalted (in Taurus) or in its own sign (Cancer) in either birth chart",
      "If Venus (Shukra) occupies a Kendra (1st, 4th, 7th, 10th house) in the Navamsa chart of both",
      "When the Nadi Dosha Puja is properly performed before the wedding ceremony",
    ],
    gemstone: "Natural Pearl (Moti) — at least 5 carats, set in pure silver, worn on the little finger of the right hand. Energize by immersing in raw milk and Ganges water on a Monday at sunrise, then wear after reciting the Chandra mantra 108 times.",
    fasting: "Monday Vrat (Somvar fast) — both partners fast on Mondays, offering milk and white flowers to Lord Shiva. Observe for 16 consecutive Mondays after the wedding.",
    charity: "Donate a cow (or its value in money) to a temple or Brahmin on the day of the wedding. White items — milk, rice, white cloth, silver — donated on Mondays are especially purifying for Nadi Dosha.",
  },
  "Bhakut Dosha": {
    mantras: [
      { text: "Om Shram Shrim Shraum Sah Chandraaya Namah", instruction: "Chandra (Moon) Mantra — chant 108 times every Monday, especially on Purnima (Full Moon)" },
      { text: "Om Namo Narayanaya", instruction: "Vishnu Mantra — both partners recite together 108 times on the wedding day" },
    ],
    puja: "Navagraha Shanti Puja with special emphasis on Chandra Puja (Moon worship) should be performed before the marriage ceremony. The puja is ideally conducted on a Monday or Purnima by a learned Jyotishi-priest. Additionally, a Vishnu Puja for marital harmony and shared prosperity is highly recommended.",
    cancellation: [
      "If the Moon sign lords of both partners are mutual friends (e.g., Moon+Venus, Venus+Mercury)",
      "If both partners share the same Moon Rashi (same sign, different Nakshatra)",
      "If Venus (Shukra) is strongly placed (own sign Taurus/Libra, or exalted in Pisces) in either chart",
      "If Jupiter (Guru) aspects the Moon in either or both charts",
      "If benefic planets (Jupiter, Venus, Moon, Mercury) occupy the 7th house in both birth charts",
      "If both partners were born during the same Gotra (family lineage)",
    ],
    gemstone: "Natural Pearl or Moonstone — set in silver, worn on the little finger of the right hand on a Monday. Alternatively, a white Zircon in silver for those who cannot obtain genuine pearl.",
    fasting: "Purnima (Full Moon) fast observed by both partners together — with joint Satyanarayan Katha or Vishnu Puja on each full moon. This shared ritual creates powerful marital harmony and mitigates Bhakut effects.",
    charity: "Donate white clothing, silver items, or white sesame seeds (shwet til) to a Brahmin or temple on Mondays and on every Purnima. Feeding white cows and offering white sweets in temples on full moon days is highly auspicious.",
  },
};

const LOGO_PATH = path.join(__dirname, '../../../../assets/logo.png');

// ─── Drawing Helpers ─────────────────────────────────────────────────────────
function hRule(doc: InstanceType<typeof PDFDocument>, x: number, y: number, width: number, color = C.rule, thick = 0.5) {
  doc.save().strokeColor(color).lineWidth(thick).moveTo(x, y).lineTo(x + width, y).stroke().restore();
}

function ornamentRow(doc: InstanceType<typeof PDFDocument>, x: number, y: number, width: number) {
  const cx = x + width / 2;
  doc.save().fillColor(C.gold).font(SERIF).fontSize(9);
  doc.text("*", cx - 50, y - 5, { width: 15, align: "center", lineBreak: false });
  doc.text("-  -  -  -  -  -", cx - 40, y - 4, { width: 80, align: "center", lineBreak: false });
  doc.text("*", cx + 36, y - 5, { width: 15, align: "center", lineBreak: false });
  doc.restore();
}

function sectionBadge(doc: InstanceType<typeof PDFDocument>, x: number, y: number, label: string) {
  const pad = { h: 5, v: 3 };
  doc.save().font(SANS_B).fontSize(7).fillColor(C.maroon);
  const tw = doc.widthOfString(label) + pad.h * 2;
  doc.roundedRect(x, y, tw, 16, 3).fill(C.creamAlt);
  doc.fillColor(C.maroon).text(label, x + pad.h, y + pad.v + 1, { lineBreak: false });
  doc.restore();
  return tw;
}

function scoreBar(doc: InstanceType<typeof PDFDocument>, x: number, y: number, width: number, percent: number, color: string) {
  doc.save().roundedRect(x, y, width, 7, 3.5).fill(C.rule);
  const fillW = Math.max(0, Math.min(width, width * (percent / 100)));
  if (fillW > 0) doc.roundedRect(x, y, fillW, 7, 3.5).fill(color);
  doc.restore();
}

function scoreColor(pct: number): string {
  if (pct >= 70) return C.green;
  if (pct >= 50) return C.amber;
  return C.red;
}

function pageFooter(doc: InstanceType<typeof PDFDocument>, pageNum: number, total: number) {
  const y = PH - 30;
  hRule(doc, ML, y, W, C.rule, 0.4);
  doc.save().font(SANS).fontSize(7.5).fillColor(C.muted);
  doc.text("VedicScan · Vivah Compatibility Report · Confidential", ML, y + 5, { width: W / 2, lineBreak: false });
  doc.text(`Page ${pageNum} of ${total}`, ML + W / 2, y + 5, { width: W / 2, align: "right", lineBreak: false });
  doc.restore();
}

function pageHeader(doc: InstanceType<typeof PDFDocument>, title: string) {
  doc.save().font(SANS).fontSize(7.5).fillColor(C.muted);
  doc.text("VEDICSCAN  ·  PREMIUM COMPATIBILITY REPORT", ML, 22, { width: W, align: "center", lineBreak: false });
  doc.restore();
  hRule(doc, ML, 34, W, C.rule, 0.4);
}

// ─── Watermark ───────────────────────────────────────────────────────────────
function drawWatermark(doc: InstanceType<typeof PDFDocument>, isDark = false) {
  try {
    const logoSize = 160;
    doc.save();
    doc.opacity(isDark ? 0.08 : 0.05);
    doc.image(LOGO_PATH, PW / 2 - logoSize / 2, PH / 2 - logoSize / 2, { width: logoSize, height: logoSize });
    doc.restore();
  } catch (_) { /* skip watermark if logo file unavailable */ }
}

// ─── Cover Page ──────────────────────────────────────────────────────────────
function drawCoverPage(doc: InstanceType<typeof PDFDocument>, d: CompatibilityPDFInput) {
  const score = d.gunaMilan.total_score;
  const pct   = d.gunaMilan.percentage;
  const bName = d.boy.name  || "Groom";
  const gName = d.girl.name || "Bride";

  // ── Background + watermark ──────────────────────────────────────────────────
  doc.rect(0, 0, PW, PH).fill(C.maroonDeep);
  drawWatermark(doc, true);

  // ── Double border ───────────────────────────────────────────────────────────
  doc.save().strokeColor(C.gold).lineWidth(1.2)
    .rect(16, 16, PW - 32, PH - 32).stroke().restore();
  doc.save().strokeColor(C.goldDeep).lineWidth(0.4)
    .rect(22, 22, PW - 44, PH - 44).stroke().restore();

  // ── Corner flourishes (each corner drawn correctly) ─────────────────────────
  const cL = 14;
  // top-left
  doc.save().strokeColor(C.gold).lineWidth(0.8)
    .moveTo(28, 28 + cL).lineTo(28, 28).lineTo(28 + cL, 28).stroke().restore();
  // top-right
  doc.save().strokeColor(C.gold).lineWidth(0.8)
    .moveTo(PW - 28 - cL, 28).lineTo(PW - 28, 28).lineTo(PW - 28, 28 + cL).stroke().restore();
  // bottom-left
  doc.save().strokeColor(C.gold).lineWidth(0.8)
    .moveTo(28, PH - 28 - cL).lineTo(28, PH - 28).lineTo(28 + cL, PH - 28).stroke().restore();
  // bottom-right
  doc.save().strokeColor(C.gold).lineWidth(0.8)
    .moveTo(PW - 28 - cL, PH - 28).lineTo(PW - 28, PH - 28).lineTo(PW - 28, PH - 28 - cL).stroke().restore();

  // ── Brand name ──────────────────────────────────────────────────────────────
  doc.save().font(SANS_B).fontSize(7.5).fillColor(C.goldLight)
    .text("V E D I C S C A N", 0, 38, { width: PW, align: "center", lineBreak: false }).restore();
  doc.save().strokeColor(C.goldDeep).lineWidth(0.4)
    .moveTo(PW / 2 - 48, 54).lineTo(PW / 2 + 48, 54).stroke().restore();

  // ── Logo emblem ─────────────────────────────────────────────────────────────
  try {
    const logoSize = 104;
    const lx = PW / 2 - logoSize / 2, ly = 66;
    const lcx = PW / 2, lcy = ly + logoSize / 2;
    // Outer decorative ring with 8 dot accents
    doc.save().strokeColor(C.goldDeep).lineWidth(0.3)
      .circle(lcx, lcy, logoSize / 2 + 18).stroke().restore();
    doc.save().strokeColor(C.gold).lineWidth(0.8)
      .circle(lcx, lcy, logoSize / 2 + 10).stroke().restore();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const rx = lcx + Math.cos(angle) * (logoSize / 2 + 10);
      const ry = lcy + Math.sin(angle) * (logoSize / 2 + 10);
      doc.save().fillColor(C.gold).circle(rx, ry, 1.8).fill().restore();
    }
    // Logo clipped to circle
    doc.save().circle(lcx, lcy, logoSize / 2).clip()
      .image(LOGO_PATH, lx, ly, { width: logoSize, height: logoSize }).restore();
  } catch (_) {}

  // ── Title block ─────────────────────────────────────────────────────────────
  const titleY = 210;
  doc.save().font(SERIF_B).fontSize(28).fillColor(C.cream)
    .text("Vivah Compatibility Report", 0, titleY, { width: PW, align: "center", lineBreak: false }).restore();
  doc.save().font(SERIF_I).fontSize(12).fillColor(C.gold)
    .text("Vivah Sangata Vishleshan", 0, titleY + 40, { width: PW, align: "center", lineBreak: false }).restore();

  // ── Ornamental divider (lines + diamond) ────────────────────────────────────
  const divY = titleY + 70;
  doc.save().strokeColor(C.gold).lineWidth(0.6)
    .moveTo(PW / 2 - 96, divY).lineTo(PW / 2 - 12, divY).stroke().restore();
  doc.save().strokeColor(C.gold).lineWidth(0.6)
    .moveTo(PW / 2 + 12, divY).lineTo(PW / 2 + 96, divY).stroke().restore();
  const ds = 5;
  doc.save().strokeColor(C.gold).lineWidth(0.9)
    .moveTo(PW / 2, divY - ds).lineTo(PW / 2 + ds, divY)
    .lineTo(PW / 2, divY + ds).lineTo(PW / 2 - ds, divY)
    .closePath().stroke().restore();

  // ── Names ───────────────────────────────────────────────────────────────────
  const namesY = divY + 18;
  const nameSideW = PW / 2 - 52;
  doc.save().font(SERIF_B).fontSize(21).fillColor(C.cream)
    .text(bName, 36, namesY, { width: nameSideW, align: "right", lineBreak: false }).restore();
  doc.save().font(SERIF_I).fontSize(21).fillColor(C.gold)
    .text("&", PW / 2 - 11, namesY, { width: 22, align: "center", lineBreak: false }).restore();
  doc.save().font(SERIF_B).fontSize(21).fillColor(C.cream)
    .text(gName, PW / 2 + 16, namesY, { width: nameSideW, align: "left", lineBreak: false }).restore();

  // Nakshatra subtitles
  const nkY = namesY + 30;
  doc.save().font(SERIF_I).fontSize(9.5).fillColor(C.goldDeep)
    .text(`${d.boyNakshatra.name} · ${d.boyNakshatra.rashi_english}`, 36, nkY, { width: nameSideW, align: "right", lineBreak: false }).restore();
  doc.save().font(SERIF_I).fontSize(9.5).fillColor(C.goldDeep)
    .text(`${d.girlNakshatra.name} · ${d.girlNakshatra.rashi_english}`, PW / 2 + 16, nkY, { width: nameSideW, align: "left", lineBreak: false }).restore();

  // ── Score Panel ─────────────────────────────────────────────────────────────
  const spW = 248, spH = 144;
  const spX = PW / 2 - spW / 2, spY = nkY + 42;
  doc.save().fillOpacity(0.22).roundedRect(spX, spY, spW, spH, 12).fill('#000000').restore();
  doc.save().strokeColor(C.gold).lineWidth(0.9).roundedRect(spX, spY, spW, spH, 12).stroke().restore();
  doc.save().strokeColor(C.goldDeep).lineWidth(0.3)
    .roundedRect(spX + 4, spY + 4, spW - 8, spH - 8, 10).stroke().restore();

  doc.save().font(SANS_B).fontSize(7.5).fillColor(C.muted)
    .text("ASHTA KOOTA SCORE", spX, spY + 16, { width: spW, align: "center", characterSpacing: 1.5, lineBreak: false }).restore();

  // Measure score + "/36" widths to center them together without overlap
  const scoreStr = `${score}`;
  doc.font(SERIF_B).fontSize(50);
  const scoreW = doc.widthOfString(scoreStr);
  doc.font(SERIF).fontSize(18);
  const denom36W = doc.widthOfString("/ 36");
  const gap = 10;
  const totalScoreW = scoreW + gap + denom36W;
  const scoreStartX = spX + (spW - totalScoreW) / 2;

  doc.save().font(SERIF_B).fontSize(50).fillColor(C.goldLight)
    .text(scoreStr, scoreStartX, spY + 26, { lineBreak: false }).restore();
  doc.save().font(SERIF).fontSize(18).fillColor(C.muted)
    .text("/ 36", scoreStartX + scoreW + gap, spY + 52, { lineBreak: false }).restore();

  // Harmony bar
  const barX = spX + 24, barY = spY + 96, barW = spW - 48;
  doc.save().fillOpacity(0.15).roundedRect(barX, barY, barW, 6, 3).fill('#FFFFFF').restore();
  const fillW = barW * (pct / 100);
  if (fillW > 0) doc.save().roundedRect(barX, barY, fillW, 6, 3).fill(C.gold).restore();
  doc.save().font(SANS).fontSize(9).fillColor(C.goldLight)
    .text(`${pct}% Harmony`, spX, spY + 114, { width: spW, align: "center", lineBreak: false }).restore();

  // ── Verdict badge ────────────────────────────────────────────────────────────
  const vBadgeY = spY + spH + 16;
  const vBadgeW = 264;
  doc.save().roundedRect(PW / 2 - vBadgeW / 2, vBadgeY, vBadgeW, 30, 6).fill(C.maroon).restore();
  doc.save().strokeColor(C.gold).lineWidth(0.6)
    .roundedRect(PW / 2 - vBadgeW / 2, vBadgeY, vBadgeW, 30, 6).stroke().restore();
  doc.save().font(SERIF_B).fontSize(12).fillColor(C.goldLight)
    .text(d.gunaMilan.verdict, PW / 2 - vBadgeW / 2, vBadgeY + 10, { width: vBadgeW, align: "center", lineBreak: false }).restore();

  // ── Birth details ────────────────────────────────────────────────────────────
  const detDivY = vBadgeY + 50;
  doc.save().strokeColor(C.goldDeep).lineWidth(0.4)
    .moveTo(ML + 24, detDivY).lineTo(PW - ML - 24, detDivY).stroke().restore();
  doc.save().font(SANS_B).fontSize(7).fillColor(C.muted)
    .text("BIRTH DETAILS", 0, detDivY + 10, { width: PW, align: "center", characterSpacing: 1.5, lineBreak: false }).restore();

  const col1x = ML + 14, col2x = PW / 2 + 8;
  const colValW = PW / 2 - ML - 58;
  const detItems = [
    { label: "Name",  b: bName,                      g: gName },
    { label: "Date",  b: d.boy.dateOfBirth  || "—",  g: d.girl.dateOfBirth  || "—" },
    { label: "Time",  b: d.boy.timeOfBirth  || "—",  g: d.girl.timeOfBirth  || "—" },
    { label: "Place", b: d.boy.placeOfBirth || "—",  g: d.girl.placeOfBirth || "—" },
  ];
  let diy = detDivY + 26;
  detItems.forEach(item => {
    doc.save().font(SANS).fontSize(8).fillColor(C.muted)
      .text(item.label + ":", col1x, diy, { width: 36, lineBreak: false }).restore();
    doc.save().font(SANS_B).fontSize(8).fillColor(C.cream)
      .text(item.b, col1x + 40, diy, { width: colValW, lineBreak: false }).restore();
    doc.save().font(SANS).fontSize(8).fillColor(C.muted)
      .text(item.label + ":", col2x, diy, { width: 36, lineBreak: false }).restore();
    doc.save().font(SANS_B).fontSize(8).fillColor(C.cream)
      .text(item.g, col2x + 40, diy, { width: colValW, lineBreak: false }).restore();
    diy += 16;
  });

  // ── Bottom rule + generated date ────────────────────────────────────────────
  doc.save().strokeColor(C.goldDeep).lineWidth(0.4)
    .moveTo(PW / 2 - 70, PH - 58).lineTo(PW / 2 + 70, PH - 58).stroke().restore();
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  doc.save().font(SANS).fontSize(7.5).fillColor(C.muted)
    .text(`Generated on ${dateStr}  ·  Powered by VedicScan`, 0, PH - 46, { width: PW, align: "center", lineBreak: false }).restore();
}

// ─── Page 2: Executive Summary & Scores ──────────────────────────────────────
function drawSummaryPage(doc: InstanceType<typeof PDFDocument>, d: CompatibilityPDFInput) {
  doc.rect(0, 0, PW, PH).fill(C.cream);
  drawWatermark(doc);
  pageHeader(doc, "Ashta Koota Summary");
  pageFooter(doc, 2, 11);

  let y = 48;

  // Title
  doc.save().font(SERIF_B).fontSize(18).fillColor(C.maroon)
    .text("Ashta Koota Milan — At a Glance", ML, y, { width: W, lineBreak: false }).restore();
  y += 28;
  hRule(doc, ML, y, W);
  y += 14;

  // Score summary card
  const milan = d.gunaMilan;
  const pct = milan.percentage;
  const vColor = pct >= 75 ? C.green : pct >= 55 ? C.amber : C.red;

  doc.save().roundedRect(ML, y, W, 100, 8).fill(C.white).restore();
  doc.save().strokeColor(C.rule).lineWidth(0.6).roundedRect(ML, y, W, 100, 8).stroke().restore();

  // Big score
  doc.save().font(SERIF_B).fontSize(52).fillColor(vColor)
    .text(`${milan.total_score}`, ML + 18, y + 16, { lineBreak: false }).restore();
  doc.save().font(SERIF).fontSize(18).fillColor(C.muted)
    .text("/ 36", ML + 78, y + 36, { lineBreak: false }).restore();
  doc.save().font(SANS_B).fontSize(8).fillColor(C.muted)
    .text("TOTAL GUNA SCORE", ML + 18, y + 74, { characterSpacing: 1, lineBreak: false }).restore();

  // Verdict
  doc.save().font(SERIF_B).fontSize(15).fillColor(C.ink)
    .text(milan.verdict, ML + 160, y + 18, { width: W - 180, lineBreak: false }).restore();
  doc.save().font(SANS).fontSize(9).fillColor(C.muted)
    .text("Harmony Rating", ML + 160, y + 40, { lineBreak: false }).restore();
  // Harmony bar
  scoreBar(doc, ML + 160, y + 56, W - 180, pct, vColor);
  doc.save().font(SANS_B).fontSize(9).fillColor(vColor)
    .text(`${pct}%`, ML + 160, y + 68, { lineBreak: false }).restore();
  y += 116;

  // Partner summary row
  const halfW = (W - 16) / 2;
  const drawPartnerCard = (x: number, nk: NakshatraData, person: any, label: string): number => {
    const rows: [string, string][] = [
      ["Nakshatra", nk.name],
      ["Rashi", nk.rashi_english],
      ["Gana", nk.gana],
      ["Nadi", nk.nadi],
      ["Lord", nk.lord],
    ];
    // Pre-calculate name height so the card expands if a long name wraps
    doc.font(SERIF_B).fontSize(14);
    const nameH = Math.max(18, doc.heightOfString(person.name || label, { width: halfW - 24 }));
    const rowsStartY = y + 24 + nameH + 6;
    const cardH = (rowsStartY - y) + rows.length * 13 + 10;

    doc.save().roundedRect(x, y, halfW, cardH, 6).fill(C.white).restore();
    doc.save().strokeColor(C.rule).lineWidth(0.5).roundedRect(x, y, halfW, cardH, 6).stroke().restore();
    // Accent strip — clipped so it respects the top rounded corners
    doc.save().roundedRect(x, y, halfW, cardH, 6).clip()
      .fillColor(label === "GROOM" ? "#D4A84B" : C.rose).rect(x, y, halfW, 4).fill().restore();

    doc.save().font(SANS_B).fontSize(7.5).fillColor(C.muted)
      .text(label, x + 12, y + 12, { characterSpacing: 1, lineBreak: false }).restore();
    doc.save().font(SERIF_B).fontSize(14).fillColor(C.ink)
      .text(person.name || label, x + 12, y + 24, { width: halfW - 24 }).restore();

    let ry = rowsStartY;
    rows.forEach(([lbl, val]) => {
      doc.save().font(SANS).fontSize(8).fillColor(C.muted)
        .text(lbl + ":", x + 12, ry, { lineBreak: false }).restore();
      doc.save().font(SANS_B).fontSize(8).fillColor(C.inkSoft)
        .text(val, x + 70, ry, { width: halfW - 84, lineBreak: false }).restore();
      ry += 13;
    });
    return cardH;
  };
  const groomH = drawPartnerCard(ML, d.boyNakshatra, d.boy, "GROOM");
  const brideH = drawPartnerCard(ML + halfW + 16, d.girlNakshatra, d.girl, "BRIDE");
  y += Math.max(groomH, brideH) + 16;

  // Koota overview table
  doc.save().font(SERIF_B).fontSize(13).fillColor(C.maroon)
    .text("Koota Score Overview", ML, y, { lineBreak: false }).restore();
  y += 20;

  // Table header
  const cols = { name: ML, max: ML + 156, score: ML + 220, status: ML + 280 };
  doc.save().rect(ML, y, W, 20).fill(C.maroon).restore();
  doc.save().font(SANS_B).fontSize(8).fillColor(C.white)
    .text("Koota (Quality Measured)", cols.name + 8, y + 6, { width: 150, lineBreak: false })
    .text("Max", cols.max, y + 6, { width: 60, align: "center", lineBreak: false })
    .text("Score", cols.score, y + 6, { width: 56, align: "center", lineBreak: false })
    .text("Rating", cols.status, y + 6, { width: W - (cols.status - ML), lineBreak: false })
    .restore();
  y += 20;

  d.gunaMilan.koota_breakdown.forEach((k, i) => {
    const meta = GM[k.koota];
    const rowPct = (k.score / k.max_score) * 100;
    const rColor = scoreColor(rowPct);
    const rating = rowPct >= 75 ? "Excellent" : rowPct >= 50 ? "Good" : rowPct > 0 ? "Fair" : "Poor";
    const bg = i % 2 === 0 ? C.white : C.creamAlt;

    doc.save().rect(ML, y, W, 26).fill(bg).restore();
    doc.save().strokeColor(C.rule).lineWidth(0.3).moveTo(ML, y + 26).lineTo(ML + W, y + 26).stroke().restore();

    doc.save().font(SANS_B).fontSize(9).fillColor(C.ink)
      .text(k.koota, cols.name + 8, y + 4, { width: 100, lineBreak: false }).restore();
    if (meta) {
      doc.save().font(SANS).fontSize(7.5).fillColor(C.muted)
        .text(meta.sanskrit.split(" ")[0], cols.name + 8, y + 15, { width: 150, lineBreak: false }).restore();
    }
    doc.save().font(SANS_B).fontSize(9).fillColor(C.muted)
      .text(`${k.max_score}`, cols.max, y + 9, { width: 60, align: "center", lineBreak: false }).restore();
    doc.save().font(SANS_B).fontSize(11).fillColor(rColor)
      .text(`${k.score}`, cols.score, y + 7, { width: 56, align: "center", lineBreak: false }).restore();

    // Mini score bar
    scoreBar(doc, cols.status, y + 8, 80, rowPct, rColor);
    doc.save().font(SANS_B).fontSize(8).fillColor(rColor)
      .text(rating, cols.status + 86, y + 9, { lineBreak: false }).restore();

    y += 26;
  });

  // Total row
  doc.save().rect(ML, y, W, 24).fill(C.maroon).restore();
  doc.save().font(SANS_B).fontSize(10).fillColor(C.white)
    .text("Total", cols.name + 8, y + 7, { lineBreak: false })
    .text("36", cols.max, y + 7, { width: 60, align: "center", lineBreak: false })
    .text(`${milan.total_score}`, cols.score, y + 7, { width: 56, align: "center", lineBreak: false })
    .text(`${pct}% Harmony`, cols.status, y + 7, { lineBreak: false })
    .restore();
}

// ─── Pages 3–6: Guna Deep Dive (2 kootas per page, dynamic card height) ────────
function drawGunaPage(doc: InstanceType<typeof PDFDocument>, d: CompatibilityPDFInput, from: number, to: number, pageNum: number) {
  doc.rect(0, 0, PW, PH).fill(C.cream);
  drawWatermark(doc);
  pageHeader(doc, "Guna Analysis");
  pageFooter(doc, pageNum, 11);

  const kootas = d.gunaMilan.koota_breakdown.slice(from, to);
  let y = 48;

  doc.save().font(SERIF_B).fontSize(17).fillColor(C.maroon)
    .text("The Eight Gunas — In-Depth Analysis", ML, y, { width: W, lineBreak: false }).restore();
  y += 26;
  hRule(doc, ML, y, W);
  y += 12;

  kootas.forEach((k) => {
    const meta = GM[k.koota];
    if (!meta) return;
    const kPct = (k.score / k.max_score) * 100;
    const kColor = scoreColor(kPct);
    const rating = kPct >= 75 ? "EXCELLENT" : kPct >= 50 ? "GOOD" : kPct > 0 ? "FAIR" : "POOR";
    const analysis = kPct >= 75 ? meta.full : kPct >= 50 ? meta.partial : meta.poor;

    // Pre-calculate text heights so the card can size to content
    const classicalW = W - 32;
    const analysisW = W - 36;
    doc.font(SERIF_I).fontSize(9);
    const classicalH = doc.heightOfString(meta.classical, { width: classicalW });
    doc.font(SERIF).fontSize(9);
    const analysisH = doc.heightOfString(analysis, { width: analysisW });
    // Layout: header(80) + classicalLabel(12) + classicalText + gap(12) + analysisBox + bottomPad(12)
    const analysisBoxH = 10 + 12 + analysisH + 10;
    const cardH = 80 + 12 + classicalH + 12 + analysisBoxH + 12;

    // Card background
    doc.save().roundedRect(ML, y, W, cardH, 6).fill(C.white).restore();
    doc.save().strokeColor(C.rule).lineWidth(0.5).roundedRect(ML, y, W, cardH, 6).stroke().restore();
    doc.save().roundedRect(ML, y, 4, cardH, 2).fill(kColor).restore();

    // Koota header row
    doc.save().font(SERIF_B).fontSize(14).fillColor(C.ink)
      .text(k.koota, ML + 16, y + 12, { lineBreak: false }).restore();
    doc.save().font(SERIF_I).fontSize(10).fillColor(C.muted)
      .text("  " + meta.sanskrit, ML + 16 + doc.widthOfString(k.koota) + 2, y + 15, { lineBreak: false }).restore();

    // Score badge (top right)
    const badgeX = ML + W - 80;
    doc.save().roundedRect(badgeX, y + 10, 72, 22, 4).fill(kColor).restore();
    doc.save().font(SANS_B).fontSize(10).fillColor(C.white)
      .text(`${k.score} / ${k.max_score}  ${rating[0]}`, badgeX + 6, y + 16, { lineBreak: false }).restore();

    // Rating text
    doc.save().font(SANS_B).fontSize(7).fillColor(kColor)
      .text(rating, ML + 16, y + 30, { lineBreak: false }).restore();

    // Mini bar
    scoreBar(doc, ML + 16, y + 44, 160, kPct, kColor);
    doc.save().font(SANS).fontSize(7.5).fillColor(C.muted)
      .text(`${Math.round(kPct)}%`, ML + 183, y + 41, { lineBreak: false }).restore();

    // Measures line
    doc.save().font(SANS_B).fontSize(7.5).fillColor(C.muted)
      .text("MEASURES: ", ML + 16, y + 58, { lineBreak: false }).restore();
    doc.save().font(SANS).fontSize(7.5).fillColor(C.inkSoft)
      .text(meta.measures, ML + 16 + 58, y + 58, { width: W - 90, lineBreak: false }).restore();

    hRule(doc, ML + 16, y + 72, W - 32, C.rule, 0.3);

    // Classical description (wraps freely)
    const classicalLabelY = y + 80;
    const classicalTextY = classicalLabelY + 12;
    doc.save().font(SANS_B).fontSize(7.5).fillColor(C.maroon)
      .text("CLASSICAL SIGNIFICANCE:", ML + 16, classicalLabelY, { lineBreak: false }).restore();
    doc.save().font(SERIF_I).fontSize(9).fillColor(C.inkSoft)
      .text(meta.classical, ML + 16, classicalTextY, { width: classicalW }).restore();

    // Analysis for this couple — positioned dynamically after classical text
    const analysisBoxY = classicalTextY + classicalH + 12;
    doc.save().roundedRect(ML + 10, analysisBoxY, W - 20, analysisBoxH, 4).fill(C.creamAlt).restore();
    doc.save().font(SANS_B).fontSize(7.5).fillColor(C.maroon)
      .text("FOR THIS COUPLE:", ML + 18, analysisBoxY + 8, { lineBreak: false }).restore();
    doc.save().font(SERIF).fontSize(9).fillColor(C.ink)
      .text(analysis, ML + 18, analysisBoxY + 20, { width: analysisW }).restore();

    y += cardH + 16;
  });
}

// ─── Page 5: Dosha Analysis ───────────────────────────────────────────────────
function drawDoshaPage(doc: InstanceType<typeof PDFDocument>, d: CompatibilityPDFInput) {
  doc.rect(0, 0, PW, PH).fill(C.cream);
  drawWatermark(doc);
  pageHeader(doc, "Dosha Analysis");
  pageFooter(doc, 7, 11);

  let y = 48;

  doc.save().font(SERIF_B).fontSize(17).fillColor(C.maroon)
    .text("Dosha Analysis", ML, y, { width: W, lineBreak: false }).restore();
  y += 28;
  hRule(doc, ML, y, W);
  y += 16;

  if (d.doshas.length === 0) {
    // Dosha-free certificate
    const certH = 260;
    doc.save().roundedRect(ML, y, W, certH, 10).fill(C.white).restore();
    doc.save().strokeColor(C.gold).lineWidth(1.2).roundedRect(ML, y, W, certH, 10).stroke().restore();
    doc.save().strokeColor(C.rule).lineWidth(0.4).roundedRect(ML + 8, y + 8, W - 16, certH - 16, 6).stroke().restore();

    doc.save().font(SERIF_B).fontSize(28).fillColor(C.green)
      .text("CLEAR", ML, y + 30, { width: W, align: "center", lineBreak: false }).restore();
    doc.save().font(SERIF_B).fontSize(20).fillColor(C.green)
      .text("No Doshas Detected", ML, y + 68, { width: W, align: "center", lineBreak: false }).restore();
    doc.save().font(SERIF_I).fontSize(13).fillColor(C.muted)
      .text("Dosha-Free Union", ML, y + 96, { width: W, align: "center", lineBreak: false }).restore();

    ornamentRow(doc, ML, y + 120, W);

    doc.save().font(SERIF).fontSize(10.5).fillColor(C.inkSoft)
      .text(
        `This is a rare and auspicious finding. Neither Nadi Dosha nor Bhakut Dosha — the two most significant doshas in the Ashta Koota system — are present in the compatibility analysis for ${d.boy.name || "the Groom"} and ${d.girl.name || "the Bride"}.`,
        ML + 30, y + 134, { width: W - 60, align: "center" }
      ).restore();

    doc.save().font(SERIF).fontSize(10.5).fillColor(C.inkSoft)
      .text(
        "Classical Jyotisha texts regard a dosha-free union as a sign of strong karmic merit (punya) from past lives. This couple carries the blessings of their ancestors and the alignment of the stars into their new life together.",
        ML + 30, y + 195, { width: W - 60, align: "center" }
      ).restore();

    y += certH + 24;
  } else {
    // Each dosha
    d.doshas.forEach(dosha => {
      const sevColor = dosha.severity === "High" ? C.red : dosha.severity === "Medium" ? C.amber : C.green;
      const sevBg = dosha.severity === "High" ? C.redBg : dosha.severity === "Medium" ? C.amberBg : C.greenBg;
      const rem = DR[dosha.dosha_name];

      // Header
      doc.save().roundedRect(ML, y, W, 26, 6).fill(sevBg).restore();
      doc.save().strokeColor(sevColor).lineWidth(0.6).roundedRect(ML, y, W, 26, 6).stroke().restore();
      doc.save().font(SERIF_B).fontSize(13).fillColor(sevColor)
        .text(dosha.dosha_name, ML + 14, y + 7, { lineBreak: false }).restore();
      doc.save().roundedRect(ML + W - 80, y + 7, 70, 14, 4).fill(sevColor).restore();
      doc.save().font(SANS_B).fontSize(8).fillColor(C.white)
        .text(dosha.severity + " SEVERITY", ML + W - 78, y + 11, { width: 66, align: "center", lineBreak: false }).restore();
      y += 32;

      // Description
      doc.save().font(SANS_B).fontSize(8).fillColor(C.maroon)
        .text("DESCRIPTION", ML, y, { lineBreak: false }).restore();
      y += 14;
      doc.save().font(SERIF).fontSize(10).fillColor(C.ink)
        .text(dosha.description, ML, y, { width: W }).restore();
      y += doc.heightOfString(dosha.description, { width: W }) + 8;

      // Classical reference
      doc.save().font(SANS_B).fontSize(8).fillColor(C.maroon)
        .text("CLASSICAL REFERENCE", ML, y, { lineBreak: false }).restore();
      y += 14;
      doc.save().font(SERIF_I).fontSize(9.5).fillColor(C.inkSoft)
        .text(dosha.classical_reference, ML, y, { width: W }).restore();
      y += doc.heightOfString(dosha.classical_reference, { width: W }) + 14;

      // Cancellation conditions
      if (rem) {
        doc.save().font(SANS_B).fontSize(8).fillColor(C.green)
          .text("CANCELLATION CONDITIONS — When Does This Dosha Get Nullified?", ML, y, { lineBreak: false }).restore();
        y += 16;
        rem.cancellation.forEach(cond => {
          doc.save().font(SERIF).fontSize(7.5).fillColor(C.muted).text("-", ML, y, { lineBreak: false }).restore();
          doc.save().font(SERIF).fontSize(9).fillColor(C.inkSoft).text(cond, ML + 16, y, { width: W - 16 }).restore();
          y += doc.heightOfString(cond, { width: W - 16 }) + 5;
        });
      }
      y += 20;
      hRule(doc, ML, y, W, C.rule, 0.4);
      y += 16;
    });
  }

  // Note
  doc.save().roundedRect(ML, y, W, 60, 6).fill(C.creamAlt).restore();
  doc.save().font(SANS_B).fontSize(8).fillColor(C.maroon)
    .text("IMPORTANT NOTE ON DOSHAS", ML + 14, y + 10, { lineBreak: false }).restore();
  doc.save().font(SERIF).fontSize(9).fillColor(C.inkSoft)
    .text(
      "Doshas are not condemnations — they are karmic signposts that point to areas requiring conscious attention and spiritual effort. Countless blessed marriages carry one or more doshas that were addressed through proper remedies, sincere spiritual practice, and mutual love. See the Remedies section for complete guidance.",
      ML + 14, y + 24, { width: W - 28 }
    ).restore();
}

// ─── Page 6: Sacred Remedies ─────────────────────────────────────────────────
function drawRemediesPage(doc: InstanceType<typeof PDFDocument>, d: CompatibilityPDFInput) {
  doc.rect(0, 0, PW, PH).fill(C.cream);
  drawWatermark(doc);
  pageHeader(doc, "Sacred Remedies");
  pageFooter(doc, 8, 11);

  let y = 48;

  doc.save().font(SERIF_B).fontSize(17).fillColor(C.maroon)
    .text("Sacred Vedic Remedies", ML, y, { width: W, lineBreak: false }).restore();
  y += 10;
  doc.save().font(SERIF_I).fontSize(10).fillColor(C.muted)
    .text("Prescribed prescriptions from classical Jyotisha for harmonizing celestial energies", ML, y + 16, { width: W, lineBreak: false }).restore();
  y += 36;
  hRule(doc, ML, y, W);
  y += 16;

  // General remedies always shown
  const generalRemedies = [
    { section: "Auspicious Mantras for the Couple", items: [
      { title: "Om Gam Ganapataye Namah", sub: "Ganesha Mantra — Recite together 108 times before the wedding ceremony to remove all obstacles" },
      { title: "Om Shri Mahalakshmyai Namah", sub: "Lakshmi Mantra — Chant 108 times every Friday for marital prosperity and domestic harmony" },
    ]},
    { section: "Puja Recommendations", items: [
      { title: "Satyanarayan Katha", sub: "Perform on the first Purnima (full moon) after the wedding, and every year on the anniversary" },
      { title: "Navagrah Puja", sub: "Conducted before the wedding by a learned priest to harmonize all nine planetary energies" },
    ]},
    { section: "Gemstone Guidance", items: [
      { title: "Groom: Coral (Moonga) or Ruby (Manik)", sub: "Strengthens Mars and Sun energy — set in gold, worn on the ring finger, right hand" },
      { title: "Bride: Pearl (Moti) or White Sapphire", sub: "Strengthens Moon and Venus energy — set in silver, worn on the little finger, right hand" },
    ]},
    { section: "Fasting & Sacred Observances", items: [
      { title: "Mangalvar (Tuesday) Fast — for the Groom", sub: "Offer red flowers to Lord Hanuman and donate red lentils on Tuesdays" },
      { title: "Shukravar (Friday) Fast — for the Bride", sub: "Offer white flowers to Goddess Lakshmi and donate white sweets on Fridays" },
    ]},
  ];

  generalRemedies.forEach(section => {
    doc.save().font(SANS_B).fontSize(8.5).fillColor(C.maroon)
      .text(section.section.toUpperCase(), ML, y, { characterSpacing: 0.5, lineBreak: false }).restore();
    y += 16;

    section.items.forEach(item => {
      doc.save().roundedRect(ML, y, W, 38, 5).fill(C.white).restore();
      doc.save().strokeColor(C.rule).lineWidth(0.4).roundedRect(ML, y, W, 38, 5).stroke().restore();
      doc.save().roundedRect(ML, y, 4, 38, 2).fill(C.gold).restore();
      doc.save().font(SERIF_B).fontSize(10.5).fillColor(C.ink)
        .text(item.title, ML + 14, y + 6, { width: W - 20, lineBreak: false }).restore();
      doc.save().font(SERIF).fontSize(8.5).fillColor(C.muted)
        .text(item.sub, ML + 14, y + 22, { width: W - 20, lineBreak: false }).restore();
      y += 44;
    });
    y += 6;
  });

  // Dosha-specific remedies
  if (d.doshas.length > 0) {
    hRule(doc, ML, y, W, C.rule, 0.4);
    y += 12;
    doc.save().font(SERIF_B).fontSize(13).fillColor(C.maroon)
      .text("Dosha-Specific Remedies", ML, y, { lineBreak: false }).restore();
    y += 18;

    d.doshas.forEach(dosha => {
      const rem = DR[dosha.dosha_name];
      if (!rem) return;

      doc.save().font(SANS_B).fontSize(9).fillColor(C.red)
        .text(dosha.dosha_name + " — Prescribed Remedies", ML, y, { lineBreak: false }).restore();
      y += 16;

      rem.mantras.forEach(m => {
        doc.save().roundedRect(ML, y, W, 46, 5).fill(C.creamAlt).restore();
        doc.save().font(SERIF_B).fontSize(11).fillColor(C.maroon)
          .text(m.text, ML + 12, y + 6, { width: W - 24 }).restore();
        const textH = doc.heightOfString(m.text, { width: W - 24 });
        doc.save().font(SANS_I || SANS).fontSize(8).fillColor(C.muted)
          .text(m.instruction, ML + 12, y + 8 + textH, { width: W - 24, lineBreak: false }).restore();
        y += Math.max(46, textH + 24);
      });
      y += 8;

      doc.save().font(SANS_B).fontSize(8).fillColor(C.maroon).text("Puja:", ML, y, { lineBreak: false }).restore();
      y += 13;
      doc.save().font(SERIF).fontSize(9).fillColor(C.inkSoft).text(rem.puja, ML, y, { width: W }).restore();
      y += doc.heightOfString(rem.puja, { width: W }) + 10;

      doc.save().font(SANS_B).fontSize(8).fillColor(C.maroon).text("Gemstone:", ML, y, { lineBreak: false }).restore();
      y += 13;
      doc.save().font(SERIF).fontSize(9).fillColor(C.inkSoft).text(rem.gemstone, ML, y, { width: W }).restore();
      y += doc.heightOfString(rem.gemstone, { width: W }) + 10;

      doc.save().font(SANS_B).fontSize(8).fillColor(C.maroon).text("Fasting & Charity:", ML, y, { lineBreak: false }).restore();
      y += 13;
      doc.save().font(SERIF).fontSize(9).fillColor(C.inkSoft).text(rem.fasting, ML, y, { width: W }).restore();
      y += doc.heightOfString(rem.fasting, { width: W }) + 10;
      doc.save().font(SERIF).fontSize(9).fillColor(C.inkSoft).text(rem.charity, ML, y, { width: W }).restore();
      y += doc.heightOfString(rem.charity, { width: W }) + 16;
    });
  }
}

// ─── Page 7: Life Area Analysis ───────────────────────────────────────────────
function drawLifeAreasPage(doc: InstanceType<typeof PDFDocument>, d: CompatibilityPDFInput) {
  doc.rect(0, 0, PW, PH).fill(C.cream);
  drawWatermark(doc);
  pageHeader(doc, "Life Areas");
  pageFooter(doc, 9, 11);

  let y = 48;
  const kootas = d.gunaMilan.koota_breakdown;
  const get = (name: string) => kootas.find(k => k.koota === name);
  const gana = get("Gana"), yoni = get("Yoni"), nadi = get("Nadi");
  const bhakut = get("Bhakut"), maitri = get("Maitri"), tara = get("Tara");
  const boyN = d.boyNakshatra, girlN = d.girlNakshatra;
  const total = d.gunaMilan.total_score;

  doc.save().font(SERIF_B).fontSize(17).fillColor(C.maroon)
    .text("Life Compatibility Analysis", ML, y, { width: W, lineBreak: false }).restore();
  y += 10;
  doc.save().font(SERIF_I).fontSize(10).fillColor(C.muted)
    .text("How the stars align across the six pillars of married life", ML, y + 16, { width: W, lineBreak: false }).restore();
  y += 36;
  hRule(doc, ML, y, W);
  y += 16;

  const areas = [
    {
      title: "Marriage & Daily Partnership",
      icon: "*",
      rating: gana?.passed ? "Excellent" : total >= 21 ? "Good" : "Needs Work",
      rColor: gana?.passed ? C.green : total >= 21 ? C.amber : C.red,
      insight: gana?.passed
        ? `Their ${boyN.gana} and ${girlN.gana} Gana alignment ensures natural temperamental harmony in day-to-day married life. Partners will intuitively understand each other's rhythms, moods, and needs without constant explanation.`
        : `Their Ganas (${boyN.gana} and ${girlN.gana}) differ, creating an opportunity for profound growth. With conscious honoring of each other's fundamental nature, their differences become powerful complementary strengths in the home.`,
    },
    {
      title: "Physical & Intimate Harmony",
      icon: "*",
      rating: (yoni?.score || 0) >= 3 ? "Excellent" : (yoni?.score || 0) >= 2 ? "Good" : "Needs Attention",
      rColor: (yoni?.score || 0) >= 3 ? C.green : (yoni?.score || 0) >= 2 ? C.amber : C.red,
      insight: (yoni?.passed)
        ? `Their Yoni compatibility (${boyN.yoni}/${girlN.yoni}) promises natural physical harmony. The couple will find intimacy flowing naturally, with a strong biological and energetic resonance that deepens over years of shared life.`
        : `Their Yoni types (${boyN.yoni}/${girlN.yoni}) are different, suggesting that their physical connection may need conscious nurturing. Patience, open-hearted communication, and genuine care will build a deeply fulfilling bond.`,
    },
    {
      title: "Financial Harmony & Prosperity",
      icon: "*",
      rating: bhakut?.score === 7 ? "Excellent" : "Needs Attention",
      rColor: bhakut?.score === 7 ? C.green : C.amber,
      insight: bhakut?.passed
        ? `Bhakut alignment between their Moon signs (${boyN.rashi_english} and ${girlN.rashi_english}) bodes excellently for shared prosperity. They will naturally motivate each other's ambitions and support each other's financial growth without resentment.`
        : `The Bhakut configuration between ${boyN.rashi_english} and ${girlN.rashi_english} requires attention in financial matters. Joint spiritual practices, transparent financial communication, and aligned goals will help build lasting abundance together.`,
    },
    {
      title: "Intellectual & Psychological Bond",
      icon: "*",
      rating: (maitri?.score || 0) >= 4 ? "Excellent" : (maitri?.score || 0) >= 3 ? "Good" : "Needs Work",
      rColor: (maitri?.score || 0) >= 4 ? C.green : (maitri?.score || 0) >= 3 ? C.amber : C.red,
      insight: maitri?.passed
        ? `The friendship between their ruling planets (${boyN.lord} and ${girlN.lord}) creates an exceptional mental bond. They will find intellectual conversation effortless, and their psychological attunement will make this partnership deeply comforting.`
        : `Different planetary lords (${boyN.lord} and ${girlN.lord}) mean they approach the world differently. Celebrating — rather than resenting — these different ways of thinking will enrich their intellectual partnership immensely.`,
    },
    {
      title: "Health, Genetics & Progeny",
      icon: "*",
      rating: nadi?.score === 8 ? "Excellent" : "Needs Guidance",
      rColor: nadi?.score === 8 ? C.green : C.red,
      insight: nadi?.passed
        ? `Complementary Nadis (${boyN.nadi} and ${girlN.nadi}) indicate excellent genetic compatibility. This bodes beautifully for the health of their children and the overall vitality and longevity of the couple together.`
        : `Both sharing the same Nadi (${boyN.nadi}) creates a Nadi Dosha that requires specific remedial measures to support good health for their progeny. Please follow the Dosha Remedies section carefully.`,
    },
    {
      title: "Destiny, Fortune & Spiritual Path",
      icon: "*",
      rating: (tara?.score || 0) >= 2 ? "Excellent" : total >= 21 ? "Good" : "Needs Practice",
      rColor: (tara?.score || 0) >= 2 ? C.green : total >= 21 ? C.amber : C.red,
      insight: boyN.gana === girlN.gana
        ? `The unified ${boyN.gana} Gana energy of both partners creates a harmoniously aligned spiritual vibration. They will naturally support each other's devotional practices, dharmic path, and growth toward higher consciousness.`
        : `Their different Gana energies (${boyN.gana} and ${girlN.gana}) offer complementary spiritual perspectives. Their different spiritual inclinations, when mutually honored, create a beautifully balanced devotional household — each enriching the other's path.`,
    },
  ];

  const halfW = (W - 12) / 2;

  areas.forEach((area, i) => {
    const col = i % 2;
    const x = ML + col * (halfW + 12);
    if (col === 0 && i > 0) y += 110;

    doc.save().roundedRect(x, y, halfW, 100, 6).fill(C.white).restore();
    doc.save().strokeColor(area.rColor).lineWidth(0.5).roundedRect(x, y, halfW, 100, 6).stroke().restore();
    doc.save().rect(x, y, halfW, 4).fill(area.rColor).restore();

    doc.save().font(SERIF).fontSize(16).fillColor(area.rColor)
      .text(area.icon, x + 10, y + 10, { lineBreak: false }).restore();
    doc.save().font(SANS_B).fontSize(8.5).fillColor(C.ink)
      .text(area.title, x + 30, y + 13, { width: halfW - 100, lineBreak: false }).restore();
    doc.save().roundedRect(x + halfW - 72, y + 10, 64, 15, 4).fill(area.rColor).restore();
    doc.save().font(SANS_B).fontSize(7.5).fillColor(C.white)
      .text(area.rating.toUpperCase(), x + halfW - 72, y + 14, { width: 64, align: "center", lineBreak: false }).restore();

    hRule(doc, x + 10, y + 34, halfW - 20, C.rule, 0.3);

    doc.save().font(SERIF).fontSize(8.5).fillColor(C.inkSoft)
      .text(area.insight, x + 10, y + 42, { width: halfW - 20 }).restore();
  });
}

// ─── Page 8: Nakshatra Profiles ───────────────────────────────────────────────
function drawNakshatraProfilesPage(doc: InstanceType<typeof PDFDocument>, d: CompatibilityPDFInput) {
  doc.rect(0, 0, PW, PH).fill(C.cream);
  drawWatermark(doc);
  pageHeader(doc, "Nakshatra Profiles");
  pageFooter(doc, 10, 11);

  let y = 48;

  doc.save().font(SERIF_B).fontSize(17).fillColor(C.maroon)
    .text("Nakshatra Deep Profiles", ML, y, { width: W, lineBreak: false }).restore();
  y += 28;
  hRule(doc, ML, y, W);
  y += 16;

  const drawNakshatraCard = (nk: NakshatraData, person: any, label: string, accentColor: string) => {
    const extra = NX[nk.name];
    const leftW = 220;
    const rightW = W - leftW - 16;
    const lx = ML + 16;
    const rx = ML + leftW + 16;
    const specValW = leftW - 110; // width available for spec values

    // Left column specs
    const specs: [string, string][] = [
      ["Deity (Devata)", extra?.deity || "—"],
      ["Symbol", extra?.symbol || "—"],
      ["Zodiac Sign", `${nk.rashi_english} (${nk.rashi})`],
      ["Ruling Planet", nk.lord],
      ["Varna", nk.varna],
      ["Gana", nk.gana],
      ["Nadi", nk.nadi],
      ["Yoni", nk.yoni],
      ["Vashya", nk.vashya],
    ];

    // Pre-calculate left column height (each row height = max of label vs wrapped value)
    doc.font(SANS_B).fontSize(8);
    const specRowHeights = specs.map(([, val]) =>
      Math.max(13, doc.heightOfString(val, { width: specValW })) + 3
    );
    const leftColH = 14 + specRowHeights.reduce((a, b) => a + b, 0);

    // Pre-calculate right column height
    let rightColH = 14; // "ESSENCE & CHARACTER" label
    if (extra) {
      doc.font(SERIF_I).fontSize(9);
      rightColH += 12 + doc.heightOfString(`"${extra.essence}"`, { width: rightW }) + 8;
      doc.font(SERIF).fontSize(9);
      rightColH += 12 + doc.heightOfString(extra.traits, { width: rightW }) + 8;
      rightColH += 12 + doc.heightOfString(extra.shadow, { width: rightW });
    }

    const contentH = Math.max(leftColH, rightColH);
    const cardH = 46 + contentH + 16; // 46 = header strip area, 16 = bottom padding

    // Draw card background
    doc.save().roundedRect(ML, y, W, cardH, 8).fill(C.white).restore();
    doc.save().strokeColor(C.rule).lineWidth(0.5).roundedRect(ML, y, W, cardH, 8).stroke().restore();
    // Header strip
    doc.save().rect(ML, y, W, 36).fill(C.maroon).restore();
    doc.save().roundedRect(ML, y, W, 8, 4).fill(accentColor).restore();

    doc.save().font(SANS_B).fontSize(7.5).fillColor(C.goldLight)
      .text(label, ML + 16, y + 12, { characterSpacing: 1.2, lineBreak: false }).restore();
    doc.save().font(SERIF_B).fontSize(15).fillColor(C.white)
      .text(`${nk.name} Nakshatra`, ML + 16, y + 23, { lineBreak: false }).restore();
    doc.save().font(SERIF_I).fontSize(10).fillColor(C.goldLight)
      .text(`${nk.rashi_english} (${nk.rashi})  ·  Lord: ${nk.lord}`, ML + W - 200, y + 26, { width: 190, align: "right", lineBreak: false }).restore();

    // Left column — technical data
    let ky = y + 46;
    doc.save().font(SANS_B).fontSize(7.5).fillColor(C.maroon)
      .text("BIRTH STAR PROFILE", lx, ky, { lineBreak: false }).restore();
    ky += 14;
    specs.forEach(([lbl, val], si) => {
      const rowH = specRowHeights[si];
      doc.save().font(SANS).fontSize(8).fillColor(C.muted)
        .text(lbl + ":", lx, ky, { width: 90, lineBreak: false }).restore();
      doc.save().font(SANS_B).fontSize(8).fillColor(C.inkSoft)
        .text(val, lx + 92, ky, { width: specValW }).restore();
      ky += rowH;
    });

    // Right column — qualities
    let rky = y + 46;
    doc.save().font(SANS_B).fontSize(7.5).fillColor(C.maroon)
      .text("ESSENCE & CHARACTER", rx, rky, { lineBreak: false }).restore();
    rky += 14;

    if (extra) {
      doc.save().font(SANS_B).fontSize(7.5).fillColor(C.inkSoft).text("Essence:", rx, rky, { lineBreak: false }).restore();
      rky += 12;
      doc.save().font(SERIF_I).fontSize(9).fillColor(C.inkSoft)
        .text(`"${extra.essence}"`, rx, rky, { width: rightW }).restore();
      rky += doc.heightOfString(`"${extra.essence}"`, { width: rightW }) + 8;

      doc.save().font(SANS_B).fontSize(7.5).fillColor(C.green).text("Natural Gifts:", rx, rky, { lineBreak: false }).restore();
      rky += 12;
      doc.save().font(SERIF).fontSize(9).fillColor(C.inkSoft)
        .text(extra.traits, rx, rky, { width: rightW }).restore();
      rky += doc.heightOfString(extra.traits, { width: rightW }) + 8;

      doc.save().font(SANS_B).fontSize(7.5).fillColor(C.red).text("Shadow Qualities:", rx, rky, { lineBreak: false }).restore();
      rky += 12;
      doc.save().font(SERIF).fontSize(9).fillColor(C.inkSoft)
        .text(extra.shadow, rx, rky, { width: rightW }).restore();
    }

    y += cardH + 16;
  };

  drawNakshatraCard(d.boyNakshatra, d.boy, "GROOM'S NAKSHATRA", "#D4A84B");
  drawNakshatraCard(d.girlNakshatra, d.girl, "BRIDE'S NAKSHATRA", C.rose);

  // Energetic interaction section — dynamic height based on content
  const sameGana = d.boyNakshatra.gana === d.girlNakshatra.gana;
  const interaction = sameGana
    ? `Both ${d.boyNakshatra.name} and ${d.girlNakshatra.name} belong to the ${d.boyNakshatra.gana} Gana — the same fundamental temperament family. This creates an immediate recognition and resonance between partners: they approach life's challenges and joys with the same underlying spirit. Their home will feel naturally harmonious, their communication will be intuitively understood, and their daily rhythms will align with minimum friction.`
    : `${d.boyNakshatra.name} (${d.boyNakshatra.gana} Gana) and ${d.girlNakshatra.name} (${d.girlNakshatra.gana} Gana) come from different temperament families — creating a dynamic, textured partnership. The ${d.boyNakshatra.gana} energy offers ${d.boyNakshatra.gana === "Deva" ? "grace, lightness, and idealism" : d.boyNakshatra.gana === "Manushya" ? "practicality, emotional depth, and balance" : "intensity, passion, and transformative power"}, while the ${d.girlNakshatra.gana} energy brings ${d.girlNakshatra.gana === "Deva" ? "grace, lightness, and spiritual aspiration" : d.girlNakshatra.gana === "Manushya" ? "grounded warmth and human wisdom" : "fierce devotion and transformative strength"}. Together, they can create a beautifully complementary whole.`;

  doc.font(SERIF).fontSize(9.5);
  const interactionTextH = doc.heightOfString(interaction, { width: W - 28 });
  const interactionBoxH = 24 + interactionTextH + 12;
  doc.save().roundedRect(ML, y, W, interactionBoxH, 6).fill(C.creamAlt).restore();
  doc.save().strokeColor(C.gold).lineWidth(0.5).roundedRect(ML, y, W, interactionBoxH, 6).stroke().restore();
  doc.save().font(SANS_B).fontSize(8.5).fillColor(C.maroon)
    .text("THEIR ENERGETIC INTERACTION", ML + 14, y + 10, { lineBreak: false }).restore();

  doc.save().font(SERIF).fontSize(9.5).fillColor(C.inkSoft)
    .text(interaction, ML + 14, y + 24, { width: W - 28 }).restore();
}

// ─── Page 9: Conclusion & Blessing ───────────────────────────────────────────
function drawConclusionPage(doc: InstanceType<typeof PDFDocument>, d: CompatibilityPDFInput) {
  doc.rect(0, 0, PW, PH).fill(C.maroonDeep);
  drawWatermark(doc, true);

  // Border
  doc.save().strokeColor(C.gold).lineWidth(1)
    .rect(18, 18, PW - 36, PH - 36).stroke().restore();
  doc.save().strokeColor(C.goldDeep).lineWidth(0.4)
    .rect(24, 24, PW - 48, PH - 48).stroke().restore();

  const score = d.gunaMilan.total_score;
  const pct = d.gunaMilan.percentage;
  const bName = d.boy.name || "Groom";
  const gName = d.girl.name || "Bride";
  const verdictColor = pct >= 75 ? "#4ADE80" : pct >= 55 ? C.gold : "#F87171";

  let y = 52;

  // Header
  doc.save().font(SANS_B).fontSize(8).fillColor(C.goldLight)
    .text("CONCLUSION & BLESSING", 0, y, { width: PW, align: "center", characterSpacing: 3, lineBreak: false }).restore();
  y += 22;
  doc.save().font(SERIF_I).fontSize(11).fillColor(C.muted)
    .text("VedicScan · Vivah Compatibility Analysis", 0, y, { width: PW, align: "center", lineBreak: false }).restore();
  y += 28;
  ornamentRow(doc, ML, y, W);
  y += 22;

  // Final score box
  doc.save().fillOpacity(0.3).roundedRect(PW / 2 - 130, y, 260, 80, 8).fill('#000000').restore();
  doc.save().strokeColor(C.gold).lineWidth(0.7).roundedRect(PW / 2 - 130, y, 260, 80, 8).stroke().restore();
  doc.save().font(SANS_B).fontSize(9).fillColor(C.muted)
    .text("FINAL COMPATIBILITY SCORE", PW / 2 - 130, y + 12, { width: 260, align: "center", characterSpacing: 1.5, lineBreak: false }).restore();
  doc.save().font(SERIF_B).fontSize(36).fillColor(C.goldLight)
    .text(`${score} / 36`, PW / 2 - 130, y + 26, { width: 260, align: "center", lineBreak: false }).restore();
  doc.save().font(SERIF_B).fontSize(13).fillColor(verdictColor)
    .text(d.gunaMilan.verdict, PW / 2 - 130, y + 62, { width: 260, align: "center", lineBreak: false }).restore();
  y += 96;

  // Names
  doc.save().font(SERIF_B).fontSize(16).fillColor(C.cream)
    .text(`${bName}  &  ${gName}`, 0, y, { width: PW, align: "center", lineBreak: false }).restore();
  y += 22;
  doc.save().font(SERIF_I).fontSize(10).fillColor(C.muted)
    .text(`${d.boyNakshatra.name} Nakshatra  ·  ${d.girlNakshatra.name} Nakshatra`, 0, y, { width: PW, align: "center", lineBreak: false }).restore();
  y += 32;

  ornamentRow(doc, ML, y, W);
  y += 22;

  // Vedic blessing
  doc.save().font(SERIF_I).fontSize(13).fillColor(C.goldLight)
    .text("Om Sarve Bhavantu Sukhinah", 0, y, { width: PW, align: "center", lineBreak: false }).restore();
  y += 22;
  doc.save().font(SERIF_I).fontSize(10).fillColor(C.muted)
    .text("May all beings be happy · May all beings be at peace", 0, y, { width: PW, align: "center", lineBreak: false }).restore();
  y += 28;

  // Summary paragraph
  const summaryText = pct >= 75
    ? `The stars smile upon this union. With a rare score of ${score} out of 36 Gunas, ${bName} and ${gName} stand among the most divinely aligned couples that Vedic astrology can recognize. Their nakshatras — ${d.boyNakshatra.name} and ${d.girlNakshatra.name} — carry complementary celestial energies that when united, create something greater than either could build alone. We offer our deepest blessings for a long, joyful, and spiritually rich life together.`
    : pct >= 55
    ? `With a score of ${score} out of 36 Gunas, ${bName} and ${gName} share a meaningful and workable compatibility. The gunas reveal both areas of natural harmony and specific places where conscious effort and love will be required. All great marriages are built not only on stars, but on the daily choice to love, honor, and grow together. With the recommended remedies and a sincere commitment to each other, this union holds genuine promise.`
    : `A score of ${score} out of 36 Gunas calls for honesty, courage, and a deep commitment to the remedial path. The Rishis who composed the Ashta Koota system were wise: they did not forbid marriages with lower scores, they provided the remedial tools to support them. ${bName} and ${gName} are advised to complete all recommended pujas, observe the prescribed remedies faithfully, and approach their union with open eyes and open hearts. Love, sustained by spiritual practice, can transcend the stars.`;

  doc.save().font(SERIF).fontSize(10).fillColor(C.cream)
    .text(summaryText, ML + 30, y, { width: W - 60, align: "center" }).restore();
  y += doc.heightOfString(summaryText, { width: W - 60 }) + 28;

  ornamentRow(doc, ML, y, W);
  y += 22;

  // Maharishi quote
  doc.save().font(SERIF_I).fontSize(11).fillColor(C.goldLight)
    .text('"The highest compatibility is not between stars — it is between two hearts determined to choose each other every day."', ML + 30, y, { width: W - 60, align: "center" }).restore();
  y += 46;

  doc.save().font(SANS).fontSize(8).fillColor(C.muted)
    .text("— Maharishi Vedic Wisdom", 0, y, { width: PW, align: "center", lineBreak: false }).restore();
  y += 36;

  // Disclaimer
  doc.save().fillOpacity(0.2).roundedRect(ML + 20, y, W - 40, 68, 6).fill('#000000').restore();
  doc.save().font(SANS_B).fontSize(7.5).fillColor(C.muted)
    .text("DISCLAIMER", ML + 32, y + 10, { characterSpacing: 0.8, lineBreak: false }).restore();
  doc.save().font(SANS).fontSize(7.5).fillColor(C.muted)
    .text(
      "This report is based on classical Vedic Jyotisha principles and is offered for spiritual reflection and guidance only. It does not constitute professional astrological, medical, legal, or marital advice. The final decision regarding marriage rests entirely with the individuals involved and their families. VedicScan does not guarantee any particular life outcome based on this analysis.",
      ML + 32, y + 24, { width: W - 64 }
    ).restore();
  y += 84;

  // Generated
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  doc.save().font(SANS).fontSize(7.5).fillColor(C.muted)
    .text(`Generated by VedicScan on ${dateStr}  ·  Premium Compatibility Report`, 0, PH - 40, { width: PW, align: "center", lineBreak: false }).restore();
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function generateCompatibilityPDF(input: CompatibilityPDFInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        info: {
          Title: `Compatibility Report — ${input.boy.name} & ${input.girl.name}`,
          Author: "VedicScan",
          Subject: "Vivah Compatibility Analysis — Ashta Koota Milan",
          Keywords: "Vedic, Compatibility, Kundali, Ashta Koota, Guna Milan",
        },
        autoFirstPage: false,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Page 1: Cover
      doc.addPage();
      drawCoverPage(doc, input);

      // Page 2: Summary
      doc.addPage();
      drawSummaryPage(doc, input);

      // Pages 3–6: Gunas (2 per page for full text visibility)
      doc.addPage();
      drawGunaPage(doc, input, 0, 2, 3);

      doc.addPage();
      drawGunaPage(doc, input, 2, 4, 4);

      doc.addPage();
      drawGunaPage(doc, input, 4, 6, 5);

      doc.addPage();
      drawGunaPage(doc, input, 6, 8, 6);

      // Page 7: Dosha Analysis
      doc.addPage();
      drawDoshaPage(doc, input);

      // Page 8: Sacred Remedies
      doc.addPage();
      drawRemediesPage(doc, input);

      // Page 9: Life Areas
      doc.addPage();
      drawLifeAreasPage(doc, input);

      // Page 10: Nakshatra Profiles
      doc.addPage();
      drawNakshatraProfilesPage(doc, input);

      // Page 9: Conclusion
      doc.addPage();
      drawConclusionPage(doc, input);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
