// ─────────────────────────────────────────────────────────────────────────────
// Bilingual (English / Hindi) content for the Kundali PDF report.
// The PDF service reads `lang` ('en' | 'hi'). In 'hi', PDFKit's built-in
// Times/Helvetica names are overridden with bundled Noto Devanagari fonts and
// every string is sourced from the *_HI structures below.
//
// The heavy interpretive prose (personality, career, remedies, …) is already
// stored bilingually on the kundali document as `interpretationsHi`, so the PDF
// simply selects that object when lang === 'hi'.
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = "en" | "hi";

// ─── Vocabulary ──────────────────────────────────────────────────────────────
const RASHI_HI: Record<string, string> = {
  "Aries": "मेष", "Taurus": "वृषभ", "Gemini": "मिथुन", "Cancer": "कर्क",
  "Leo": "सिंह", "Virgo": "कन्या", "Libra": "तुला", "Scorpio": "वृश्चिक",
  "Sagittarius": "धनु", "Capricorn": "मकर", "Aquarius": "कुंभ", "Pisces": "मीन",
};
const PLANET_HI: Record<string, string> = {
  "Sun": "सूर्य", "Moon": "चंद्र", "Mars": "मंगल", "Mercury": "बुध",
  "Jupiter": "बृहस्पति", "Venus": "शुक्र", "Saturn": "शनि", "Rahu": "राहु", "Ketu": "केतु",
};
const NAKSHATRA_HI: Record<string, string> = {
  "Ashwini": "अश्विनी", "Bharani": "भरणी", "Krittika": "कृत्तिका", "Rohini": "रोहिणी",
  "Mrigashira": "मृगशिरा", "Ardra": "आर्द्रा", "Punarvasu": "पुनर्वसु", "Pushya": "पुष्य",
  "Ashlesha": "आश्लेषा", "Magha": "मघा", "Purva Phalguni": "पूर्वा फाल्गुनी", "Uttara Phalguni": "उत्तरा फाल्गुनी",
  "Hasta": "हस्त", "Chitra": "चित्रा", "Swati": "स्वाति", "Vishakha": "विशाखा",
  "Anuradha": "अनुराधा", "Jyeshtha": "ज्येष्ठा", "Mula": "मूल", "Purva Ashadha": "पूर्वाषाढ़ा",
  "Uttara Ashadha": "उत्तराषाढ़ा", "Shravana": "श्रवण", "Dhanishta": "धनिष्ठा", "Shatabhisha": "शतभिषा",
  "Purva Bhadrapada": "पूर्वा भाद्रपद", "Uttara Bhadrapada": "उत्तरा भाद्रपद", "Revati": "रेवती",
};
const STRENGTH_HI: Record<string, string> = { "Strong": "प्रबल", "Moderate": "मध्यम", "Weak": "क्षीण" };
const SEVERITY_HI: Record<string, string> = { "High": "उच्च", "Medium": "मध्यम", "Moderate": "मध्यम", "Low": "निम्न", "None": "शून्य" };

const lk = (m: Record<string, string>, v: string, lang: Lang) =>
  lang === "hi" ? (m[v] ?? v) : v;

export const T = {
  rashi: (v: string, lang: Lang) => lk(RASHI_HI, v, lang),
  planet: (v: string, lang: Lang) => lk(PLANET_HI, v, lang),
  nakshatra: (v: string, lang: Lang) => lk(NAKSHATRA_HI, v, lang),
  strength: (v: string, lang: Lang) => lk(STRENGTH_HI, (v || "").trim(), lang),
  severity: (v: string, lang: Lang) => lk(SEVERITY_HI, (v || "").trim(), lang),
};

// Translate a comma-joined planet list ("Sun, Moon" → "सूर्य, चंद्र")
export const planetList = (csv: string, lang: Lang) =>
  lang === "hi"
    ? (csv || "").split(",").map((s) => T.planet(s.trim(), lang)).join(", ")
    : csv;

// ─── Yoga / Dosha names (fixed sets) ─────────────────────────────────────────
const YOGA_NAME_HI: Record<string, string> = {
  "Gajakesari Yoga": "गजकेसरी योग",
  "Budhaditya Yoga": "बुधादित्य योग",
  "Chandra Mangal Yoga": "चंद्र-मंगल योग",
  "Vipreet Raj Yoga": "विपरीत राज योग",
  "Neecha Bhanga Raj Yoga": "नीच भंग राज योग",
  "Lakshmi Yoga": "लक्ष्मी योग",
  "Saraswati Yoga": "सरस्वती योग",
  "Ruchaka Yoga": "रुचक योग",
  "Bhadra Yoga": "भद्र योग",
  "Hamsa Yoga": "हंस योग",
  "Malavya Yoga": "मालव्य योग",
  "Shasha Yoga": "शश योग",
  "Guru-Mangal Yoga": "गुरु-मंगल योग",
  "Amala Yoga": "अमल योग",
  "Dharma Karmadhipati Yoga": "धर्म-कर्माधिपति योग",
  "Rahu in Upachaya Yoga": "उपचय में राहु योग",
  "Saturn in Upachaya": "उपचय में शनि",
};
const DOSHA_NAME_HI: Record<string, string> = {
  "Mangal Dosha": "मंगल दोष",
  "Kaal Sarp Dosha": "काल सर्प दोष",
  "Pitra Dosha": "पितृ दोष",
};
export const yogaName = (n: string, lang: Lang) =>
  lang === "hi" ? (YOGA_NAME_HI[n] ?? n) : n;
export const doshaName = (n: string, lang: Lang) =>
  lang === "hi" ? (DOSHA_NAME_HI[n] ?? n) : n;

// ─── UI label dictionary ─────────────────────────────────────────────────────
// Values are strings, except the two interpolated labels which are functions.
type Dict = Record<string, string | ((p: string) => string)>;
const EN: Dict = {
  brand: "V E D I C S C A N",
  reportTitle: "Personal Kundali Report",
  coverTagline: "—  Ancient Wisdom · Precise Calculations · Modern Insights  —",
  coverNote: "Prepared for spiritual guidance and self-understanding.\nNot a substitute for medical, financial, or legal advice.",
  dob: "Date of Birth", tob: "Time of Birth", pob: "Place of Birth", reportGenerated: "Report Generated",
  lagna: "Lagna", moonSign: "Moon Sign", sunSign: "Sun Sign", nakshatra: "Nakshatra",
  hdrCharts: "BIRTH CHART  (D1)  &  NAVAMSA  (D9)",
  d1Title: "D1 · Rashi (Birth Chart)", d9Title: "D9 · Navamsa Chart",
  chartSummary: "Chart Summary", lagnaAscendant: "Lagna (Ascendant)", navamsaLagna: "Navamsa Lagna",
  moonNakshatraLbl: "Moon Nakshatra", pada: "Pada",
  legend: "Legend:  Su Sun · Mo Moon · Ma Mars · Me Mercury · Ju Jupiter · Ve Venus · Sa Saturn · Ra Rahu · Ke Ketu · (R) Retrograde",
  hdrPositions: "PLANETARY POSITIONS",
  colPlanet: "Planet", colRashi: "Rashi", colNakshatra: "Nakshatra", colDegree: "Degree", colHouse: "House", colNavamsa: "Navamsa",
  housePlacements: "HOUSE PLACEMENTS", colSign: "Sign", colPlanets: "Planets", house: "House",
  hdrYogasDoshas: "YOGAS  &  DOSHAS", hdrYogasDoshasCont: "YOGAS  &  DOSHAS  (cont.)",
  auspiciousYogas: "AUSPICIOUS YOGAS", noYogas: "No major yogas are formed in this chart; the energies are balanced and steady.",
  doshasKarmic: "DOSHAS & KARMIC PATTERNS", noDoshas: "No significant doshas were found — an auspicious indication.",
  severity: "SEVERITY", remedy: "Remedy: ",
  hdrDasha: "VIMSHOTTARI DASHA ANALYSIS", hdrDashaCont: "VIMSHOTTARI DASHA  (cont.)",
  currentPeriods: "CURRENT PLANETARY PERIODS", mahadasha: "MAHADASHA", antardasha: "ANTARDASHA", pratyantar: "PRATYANTAR",
  ends: "Ends", mahadashaTimeline: "MAHADASHA TIMELINE",
  colMahadasha: "Mahadasha", colStart: "Start", colEnd: "End", colDuration: "Duration", colStatus: "Status",
  active: "Active", yrs: "yrs", colAntardasha: "Antardasha",
  antardashaWithin: (p: string) => `ANTARDASHA WITHIN ${p} MAHADASHA`,
  hdrSadeSati: "SHANI SADE SATI  &  DHAIYA",
  sadeSatiActive: "SADE SATI ACTIVE", phase: "Phase", cycle: "Cycle", phaseEnds: "Phase ends",
  dhaiyaActive: "DHAIYA ACTIVE", period: "Period",
  freeSadeSati: "Currently Free from Sade Sati & Dhaiya",
  nextCycle: "Next Sade Sati cycle begins", noUpcoming: "No upcoming cycle in the near future",
  saturnNow: "Saturn now in", retrograde: "Retrograde", asOf: "as of",
  janmaRashi: "Janma Rashi (Moon Sign)", sadeSatiSigns: "Sade Sati Signs (12th · Moon · 2nd)", dhaiyaSigns: "Dhaiya Signs",
  sadeSatiLifecycle: "SADE SATI LIFECYCLE",
  colCyclePeriod: "Cycle Period", colRising: "Rising (Aroha)", colPeak: "Peak (Madhya)", colSetting: "Setting (Avaroha)",
  past: "Past", upcoming: "Upcoming",
  dhaiyaSmallPanoti: "DHAIYA  (SMALL PANOTI)", kantakaShani: "KANTAKA SHANI  (4th from Moon)", ashtamaShani: "ASHTAMA SHANI  (8th from Moon)",
  saturnIn: "Saturn in", noOccurrences: "No occurrences in scan range",
  shanisCounsel: "SHANI'S COUNSEL",
  sadeSatiRemedies: "Classical remedies during Sade Sati / Dhaiya: Recite Shani Chalisa or Hanuman Chalisa on Saturdays · Light sesame oil lamp under Peepal tree · Donate black sesame, iron, and dark-blue cloth to the needy · Chant \"Om Sham Shanicharaya Namah\" 108 times · Serve the elderly and the underprivileged.",
  hdrLifeAnalysis: "LIFE ANALYSIS & INSIGHTS", hdrLifeAnalysisCont: "LIFE ANALYSIS  (cont.)",
  secPersonality: "PERSONALITY", secCareer: "CAREER & PROFESSION", secFinance: "FINANCIAL OUTLOOK",
  secMarriage: "MARRIAGE & RELATIONSHIPS", secHealth: "HEALTH & WELL-BEING", secEducation: "EDUCATION & INTELLECT",
  secChildren: "CHILDREN & CREATIVITY", secSpirituality: "SPIRITUALITY & LIBERATION",
  strengthsAreas: "STRENGTHS & AREAS TO WORK ON", naturalStrengths: "Natural Strengths", areasToWork: "Areas to Work On",
  hdrRecommendations: "VEDIC RECOMMENDATIONS", hdrRecommendationsCont: "VEDIC RECOMMENDATIONS  (cont.)",
  recMantras: "MANTRAS", recGemstones: "GEMSTONES", recFasting: "FASTING", recCharity: "CHARITY & SERVICE",
  noteMantras: "Chant 108 times daily or on the prescribed day for best effect.",
  noteGemstones: "Wear only after energisation; consult a learned astrologer before wearing.",
  noteFasting: "Observing the fast invokes the blessings of the ruling planet.",
  noteCharity: "Regular charity helps neutralise challenging karmic patterns.",
  importantDisclaimer: "IMPORTANT DISCLAIMER",
  disclaimerText: "This report is provided for spiritual guidance and self-understanding only. It is not medical, financial, or legal advice. Astrological interpretations are symbolic and traditional in nature; VedicScan does not guarantee outcomes based on this report.",
  footerBrand: "VedicScan  ·  Personal Kundali Report", page: "Page", of: "of",
};
const HI: Dict = {
  brand: "वे दि क स्कै न",
  reportTitle: "व्यक्तिगत कुंडली रिपोर्ट",
  coverTagline: "—  प्राचीन ज्ञान · सटीक गणना · आधुनिक अंतर्दृष्टि  —",
  coverNote: "आध्यात्मिक मार्गदर्शन एवं आत्म-बोध हेतु तैयार की गई।\nयह चिकित्सकीय, वित्तीय या कानूनी सलाह का स्थान नहीं लेती।",
  dob: "जन्म तिथि", tob: "जन्म समय", pob: "जन्म स्थान", reportGenerated: "रिपोर्ट निर्मित",
  lagna: "लग्न", moonSign: "चंद्र राशि", sunSign: "सूर्य राशि", nakshatra: "नक्षत्र",
  hdrCharts: "जन्म कुंडली (D1) एवं नवांश (D9)",
  d1Title: "D1 · राशि (जन्म कुंडली)", d9Title: "D9 · नवांश कुंडली",
  chartSummary: "कुंडली सारांश", lagnaAscendant: "लग्न (उदय)", navamsaLagna: "नवांश लग्न",
  moonNakshatraLbl: "चंद्र नक्षत्र", pada: "पाद",
  legend: "संकेत:  Su सूर्य · Mo चंद्र · Ma मंगल · Me बुध · Ju बृहस्पति · Ve शुक्र · Sa शनि · Ra राहु · Ke केतु · (R) वक्री",
  hdrPositions: "ग्रह स्थिति",
  colPlanet: "ग्रह", colRashi: "राशि", colNakshatra: "नक्षत्र", colDegree: "अंश", colHouse: "भाव", colNavamsa: "नवांश",
  housePlacements: "भाव स्थिति", colSign: "राशि", colPlanets: "ग्रह", house: "भाव",
  hdrYogasDoshas: "योग एवं दोष", hdrYogasDoshasCont: "योग एवं दोष (क्रमशः)",
  auspiciousYogas: "शुभ योग", noYogas: "इस कुंडली में कोई प्रमुख योग नहीं बनता; ऊर्जाएँ संतुलित एवं स्थिर हैं।",
  doshasKarmic: "दोष एवं कार्मिक प्रवृत्तियाँ", noDoshas: "कोई महत्वपूर्ण दोष नहीं पाया गया — एक शुभ संकेत।",
  severity: "तीव्रता", remedy: "उपाय: ",
  hdrDasha: "विंशोत्तरी दशा विश्लेषण", hdrDashaCont: "विंशोत्तरी दशा (क्रमशः)",
  currentPeriods: "वर्तमान ग्रह-दशाएँ", mahadasha: "महादशा", antardasha: "अंतर्दशा", pratyantar: "प्रत्यंतर",
  ends: "समाप्ति", mahadashaTimeline: "महादशा समयरेखा",
  colMahadasha: "महादशा", colStart: "आरंभ", colEnd: "समाप्ति", colDuration: "अवधि", colStatus: "स्थिति",
  active: "सक्रिय", yrs: "वर्ष", colAntardasha: "अंतर्दशा",
  antardashaWithin: (p: string) => `${p} महादशा में अंतर्दशा`,
  hdrSadeSati: "शनि साढ़ेसाती एवं ढैया",
  sadeSatiActive: "साढ़ेसाती सक्रिय", phase: "चरण", cycle: "चक्र", phaseEnds: "चरण समाप्ति",
  dhaiyaActive: "ढैया सक्रिय", period: "अवधि",
  freeSadeSati: "वर्तमान में साढ़ेसाती एवं ढैया से मुक्त",
  nextCycle: "अगला साढ़ेसाती चक्र आरंभ", noUpcoming: "निकट भविष्य में कोई चक्र नहीं",
  saturnNow: "शनि इस समय", retrograde: "वक्री", asOf: "तिथि तक",
  janmaRashi: "जन्म राशि (चंद्र राशि)", sadeSatiSigns: "साढ़ेसाती राशियाँ (12वीं · चंद्र · 2री)", dhaiyaSigns: "ढैया राशियाँ",
  sadeSatiLifecycle: "साढ़ेसाती जीवनचक्र",
  colCyclePeriod: "चक्र अवधि", colRising: "आरोह", colPeak: "मध्य", colSetting: "अवरोह",
  past: "बीता", upcoming: "आगामी",
  dhaiyaSmallPanoti: "ढैया (लघु पनोती)", kantakaShani: "कंटक शनि (चंद्र से 4था)", ashtamaShani: "अष्टम शनि (चंद्र से 8वाँ)",
  saturnIn: "शनि", noOccurrences: "अवधि-सीमा में कोई घटना नहीं",
  shanisCounsel: "शनि का मार्गदर्शन",
  sadeSatiRemedies: "साढ़ेसाती / ढैया के दौरान शास्त्रीय उपाय: शनिवार को शनि चालीसा या हनुमान चालीसा का पाठ करें · पीपल वृक्ष के नीचे तिल के तेल का दीपक जलाएँ · ज़रूरतमंदों को काले तिल, लोहा एवं गहरे नीले वस्त्र दान करें · \"ॐ शं शनैश्चराय नमः\" का 108 बार जप करें · वृद्धों एवं वंचितों की सेवा करें।",
  hdrLifeAnalysis: "जीवन विश्लेषण एवं अंतर्दृष्टि", hdrLifeAnalysisCont: "जीवन विश्लेषण (क्रमशः)",
  secPersonality: "व्यक्तित्व", secCareer: "करियर एवं व्यवसाय", secFinance: "वित्तीय दृष्टिकोण",
  secMarriage: "विवाह एवं संबंध", secHealth: "स्वास्थ्य एवं कल्याण", secEducation: "शिक्षा एवं बुद्धि",
  secChildren: "संतान एवं सृजनशीलता", secSpirituality: "आध्यात्म एवं मोक्ष",
  strengthsAreas: "सामर्थ्य एवं सुधार-क्षेत्र", naturalStrengths: "स्वाभाविक सामर्थ्य", areasToWork: "सुधार हेतु क्षेत्र",
  hdrRecommendations: "वैदिक अनुशंसाएँ", hdrRecommendationsCont: "वैदिक अनुशंसाएँ (क्रमशः)",
  recMantras: "मंत्र", recGemstones: "रत्न", recFasting: "व्रत", recCharity: "दान एवं सेवा",
  noteMantras: "सर्वोत्तम फल हेतु प्रतिदिन या निर्धारित दिन 108 बार जप करें।",
  noteGemstones: "केवल अभिमंत्रित करने के पश्चात धारण करें; धारण से पूर्व विद्वान ज्योतिषी से परामर्श करें।",
  noteFasting: "व्रत का पालन शासक ग्रह के आशीर्वाद का आह्वान करता है।",
  noteCharity: "नियमित दान चुनौतीपूर्ण कार्मिक प्रवृत्तियों को शमित करने में सहायक होता है।",
  importantDisclaimer: "महत्वपूर्ण अस्वीकरण",
  disclaimerText: "यह रिपोर्ट केवल आध्यात्मिक मार्गदर्शन एवं आत्म-बोध हेतु प्रदान की गई है। यह चिकित्सकीय, वित्तीय या कानूनी सलाह नहीं है। ज्योतिषीय व्याख्याएँ प्रतीकात्मक एवं पारंपरिक प्रकृति की हैं; वेदिकस्कैन इस रिपोर्ट के आधार पर किसी परिणाम की गारंटी नहीं देता।",
  footerBrand: "वेदिकस्कैन  ·  व्यक्तिगत कुंडली रिपोर्ट", page: "पृष्ठ", of: "/",
};

// Static labels are strings; the two interpolated ones are functions.
type LabelValue = string | ((p: string) => string);
export const labels = (lang: Lang) => (lang === "hi" ? HI : EN) as Record<string, LabelValue>;

// Localized date (Devanagari month names in HI)
export function formatDate(dateStr: string | number | Date, lang: Lang): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  if (lang === "hi") {
    const months = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितम्बर", "अक्टूबर", "नवम्बर", "दिसम्बर"];
    return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Sade Sati phase names + counsel (prose lives in the PDF, not the DB) ─────
export const phaseName = (phase: string, lang: Lang): string => {
  if (lang !== "hi") return phase;
  return ({ Rising: "आरोह", Peak: "मध्य", Setting: "अवरोह" } as Record<string, string>)[phase] || phase;
};

export function sadeSatiCounsel(
  opts: { inSS: boolean; inDhaiya: boolean; moonSign: string; phase?: string; phaseEndDate?: string; significance?: string; dhaiyaType?: string; dhaiyaEnd?: string; nextStart?: string },
  lang: Lang,
): string {
  const { inSS, inDhaiya, moonSign, phase = "", phaseEndDate, significance, dhaiyaType = "", dhaiyaEnd, nextStart } = opts;
  const ms = T.rashi(moonSign, lang);
  if (lang === "hi") {
    if (inSS) {
      const phaseDesc: Record<string, string> = {
        Rising: "साढ़ेसाती का आरोह चरण (चंद्र से 12वें भाव में शनि) आत्मनिरीक्षण, बाह्य गतिविधियों में कमी एवं व्यय का काल आरंभ करता है। निद्रा बाधित हो सकती है, एवं आप एकांत तथा आंतरिक कार्य की ओर खिंचाव अनुभव कर सकते हैं। यह उस सबको त्यागने का समय है जो अब सार्थक नहीं, एवं विकास के नए चक्र हेतु भूमि तैयार करने का।",
        Peak: "मध्य चरण (चंद्र पर सीधे शनि, जन्म शनि) साढ़ेसाती का सर्वाधिक तीव्र भाग है। मानसिक एवं भावनात्मक दबाव बढ़ सकते हैं। स्वास्थ्य, निकट संबंध एवं करियर सभी शनि की परीक्षा का भार अनुभव कर सकते हैं। तथापि यह चरण कार्मिक अवशेषों को जलाकर असाधारण दृढ़ता गढ़ता है — जो टिके रहते हैं वे कहीं अधिक सशक्त होकर उभरते हैं।",
        Setting: "अवरोह चरण (चंद्र से 2रे भाव में शनि) क्रमिक राहत लाता है, यद्यपि शनि अब भी वित्त, परिवार एवं वाणी को स्पर्श करता है। दबाव का सर्वाधिक कठिन भाग बीत चुका है; पूर्व चरणों में जो विचलित हुआ उसे स्थिर करने पर ध्यान दें। संयमित वाणी, विवेकपूर्ण व्यय एवं पारिवारिक सामंजस्य इस चरण की कुंजी हैं।",
      };
      return `${ms} चंद्र · साढ़ेसाती का ${phaseName(phase, lang)} चरण\n\n${phaseDesc[phase] || significance || ""}\n\nशनि सबसे अधिक सच्चे प्रयास को पुरस्कृत करता है। इस पूरे काल में अनुशासन, सेवा एवं कृतज्ञता की साधना बनाए रखें। चरण समाप्ति: ${phaseEndDate || "उपलब्ध नहीं"}।`;
    }
    if (inDhaiya) {
      const dtxt = dhaiyaType.includes("4th")
        ? "कंटक (चंद्र से 4था) शनि घर, सुख एवं माता से संबंधित चुनौतियाँ लाता है। यह घरेलू जीवन एवं संपत्ति मामलों में परीक्षा का काल है। धैर्य एवं आंतरिक अनुशासन ही इसका निवारण हैं।"
        : "अष्टम (चंद्र से 8वाँ) शनि दोनों ढैया चरणों में अधिक तीव्र है, जो रहस्यों, संयुक्त वित्त, आयु एवं आकस्मिक परिवर्तनों को स्पर्श करता है। सट्टेबाज़ी एवं अनावश्यक जोखिमों से बचें। यह भी बीत जाएगा।";
      return `${ms} चंद्र · ${dhaiyaType} सक्रिय\n\n${dtxt}\n\nढैया समाप्ति: ${dhaiyaEnd || "उपलब्ध नहीं"}।`;
    }
    return `${ms} चंद्र · मुक्त काल\n\nआप वर्तमान में साढ़ेसाती एवं ढैया दोनों से मुक्त हैं। यह दीर्घकालिक लक्ष्यों को आगे बढ़ाने, उपलब्धियों को सुदृढ़ करने एवं संबंधों तथा स्वास्थ्य में निवेश करने की शुभ अवधि है। ${nextStart ? `अगला साढ़ेसाती चक्र लगभग ${formatDate(nextStart, lang)} के आसपास आरंभ होता है — इस अंतराल का विवेकपूर्ण उपयोग करके दृढ़ता एवं संसाधन निर्मित करें।` : "इस अपेक्षाकृत सहज ग्रह-काल का कृतज्ञता एवं परिश्रम के साथ आनंद लें।"}`;
  }
  // English (mirrors the original in-PDF prose)
  if (inSS) {
    const phaseDesc: Record<string, string> = {
      Rising: "The Rising phase of Sade Sati (Saturn in the 12th from Moon) initiates a period of introspection, reduced external activity, and expenses. Sleep may be disturbed, and you may feel a pull toward withdrawal and inner work. This is a time to let go of what no longer serves you and prepare the ground for a new cycle of growth.",
      Peak: "The Peak phase (Saturn directly over the Moon, Janma Shani) is the most intense part of Sade Sati. Mental and emotional pressures can be heightened. Health, close relationships, and career may all feel the weight of Saturn's scrutiny. However, this phase also burns karmic residues and forges extraordinary resilience — those who persevere emerge far stronger.",
      Setting: "The Setting phase (Saturn in the 2nd from Moon) brings gradual relief, though Saturn still touches finances, family, and speech. The worst of the pressure has passed; focus on stabilising what was disturbed in the earlier phases. Measured speech, prudent spending, and family harmony are the keys to this phase.",
    };
    return `${moonSign} Moon · ${phase} Phase of Sade Sati\n\n${phaseDesc[phase] || significance || ""}\n\nSaturn rewards sincere effort above all. Maintain your practice of discipline, service, and gratitude throughout this period. Phase ends: ${phaseEndDate || "N/A"}.`;
  }
  if (inDhaiya) {
    const dtxt = dhaiyaType.includes("4th")
      ? "Kantaka (4th from Moon) Shani brings challenges to home, comfort, and mother. It is a period of tests in domestic life and property matters. Patience and inner discipline are the antidotes."
      : "Ashtama (8th from Moon) Shani is the more intense of the two Dhaiya phases, touching secrets, joint finances, longevity, and sudden changes. Avoid speculation and unnecessary risks. This too shall pass.";
    return `${moonSign} Moon · ${dhaiyaType} Active\n\n${dtxt}\n\nDhaiya ends: ${dhaiyaEnd || "N/A"}.`;
  }
  return `${moonSign} Moon · Clear Period\n\nYou are currently free of both Sade Sati and Dhaiya. This is an auspicious window to advance long-term goals, consolidate gains, and invest in relationships and health. ${nextStart ? `The next Sade Sati cycle begins around ${nextStart} — use this interval wisely to build resilience and resources.` : "Enjoy this period of relative planetary ease with gratitude and industry."}`;
}
