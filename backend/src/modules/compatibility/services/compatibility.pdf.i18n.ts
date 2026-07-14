// ─────────────────────────────────────────────────────────────────────────────
// Bilingual (English / Hindi) content for the Compatibility PDF report.
//
// The PDF service reads `input.lang` ('en' | 'hi'). When 'hi', PDFKit's built-in
// Times/Helvetica names are overridden with bundled Noto Devanagari fonts, and
// every string is sourced from the *_HI structures below.
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = "en" | "hi";

// ─── Dynamic astrological vocabulary ─────────────────────────────────────────
const NAKSHATRA_HI: Record<string, string> = {
  "Ashwini": "अश्विनी", "Bharani": "भरणी", "Krittika": "कृत्तिका", "Rohini": "रोहिणी",
  "Mrigashira": "मृगशिरा", "Ardra": "आर्द्रा", "Punarvasu": "पुनर्वसु", "Pushya": "पुष्य",
  "Ashlesha": "आश्लेषा", "Magha": "मघा", "Purva Phalguni": "पूर्वा फाल्गुनी", "Uttara Phalguni": "उत्तरा फाल्गुनी",
  "Hasta": "हस्त", "Chitra": "चित्रा", "Swati": "स्वाति", "Vishakha": "विशाखा",
  "Anuradha": "अनुराधा", "Jyeshtha": "ज्येष्ठा", "Mula": "मूल", "Purva Ashadha": "पूर्वाषाढ़ा",
  "Uttara Ashadha": "उत्तराषाढ़ा", "Shravana": "श्रवण", "Dhanishta": "धनिष्ठा", "Shatabhisha": "शतभिषा",
  "Purva Bhadrapada": "पूर्वा भाद्रपद", "Uttara Bhadrapada": "उत्तरा भाद्रपद", "Revati": "रेवती",
};

const RASHI_EN_HI: Record<string, string> = {
  "Aries": "मेष", "Taurus": "वृषभ", "Gemini": "मिथुन", "Cancer": "कर्क",
  "Leo": "सिंह", "Virgo": "कन्या", "Libra": "तुला", "Scorpio": "वृश्चिक",
  "Sagittarius": "धनु", "Capricorn": "मकर", "Aquarius": "कुंभ", "Pisces": "मीन",
};

const RASHI_SANSKRIT_HI: Record<string, string> = {
  "Mesha": "मेष", "Vrishabha": "वृषभ", "Mithuna": "मिथुन", "Karka": "कर्क",
  "Simha": "सिंह", "Kanya": "कन्या", "Tula": "तुला", "Vrishchika": "वृश्चिक",
  "Dhanu": "धनु", "Makara": "मकर", "Kumbha": "कुंभ", "Meena": "मीन",
};

const PLANET_HI: Record<string, string> = {
  "Sun": "सूर्य", "Moon": "चंद्र", "Mars": "मंगल", "Mercury": "बुध",
  "Jupiter": "बृहस्पति", "Venus": "शुक्र", "Saturn": "शनि", "Rahu": "राहु", "Ketu": "केतु",
};

const GANA_HI: Record<string, string> = { "Deva": "देव", "Manushya": "मनुष्य", "Rakshasa": "राक्षस" };
const NADI_HI: Record<string, string> = { "Aadi": "आदि", "Madhya": "मध्य", "Antya": "अन्त्य" };
const VARNA_HI: Record<string, string> = { "Brahmin": "ब्राह्मण", "Kshatriya": "क्षत्रिय", "Vaishya": "वैश्य", "Shudra": "शूद्र" };
const VASHYA_HI: Record<string, string> = { "Chatushpad": "चतुष्पद", "Manav": "मानव", "Jalachar": "जलचर", "Vanachar": "वनचर", "Keet": "कीट" };
const YONI_HI: Record<string, string> = {
  "Ashwa": "अश्व", "Gaja": "गज", "Aja": "अज", "Sarpa": "सर्प", "Shwan": "श्वान", "Marjar": "मार्जार",
  "Mesha": "मेष", "Mushak": "मूषक", "Gau": "गौ", "Mahish": "महिष", "Vyaghra": "व्याघ्र",
  "Mruiga": "मृग", "Vanar": "वानर", "Nakul": "नकुल", "Simha": "सिंह",
};
const KOOTA_HI: Record<string, string> = {
  "Varna": "वर्ण", "Vashya": "वश्य", "Tara": "तारा", "Yoni": "योनि",
  "Maitri": "ग्रह मैत्री", "Gana": "गण", "Bhakut": "भकूट", "Nadi": "नाड़ी",
};

const lookup = (map: Record<string, string>, v: string, lang: Lang) =>
  lang === "hi" ? (map[v] || v) : v;

export const T = {
  nakshatra: (v: string, lang: Lang) => lookup(NAKSHATRA_HI, v, lang),
  rashiEn: (v: string, lang: Lang) => lookup(RASHI_EN_HI, v, lang),
  rashiSk: (v: string, lang: Lang) => lookup(RASHI_SANSKRIT_HI, v, lang),
  planet: (v: string, lang: Lang) => lookup(PLANET_HI, v, lang),
  gana: (v: string, lang: Lang) => lookup(GANA_HI, v, lang),
  nadi: (v: string, lang: Lang) => lookup(NADI_HI, v, lang),
  varna: (v: string, lang: Lang) => lookup(VARNA_HI, v, lang),
  vashya: (v: string, lang: Lang) => lookup(VASHYA_HI, v, lang),
  yoni: (v: string, lang: Lang) => lookup(YONI_HI, v, lang),
  koota: (v: string, lang: Lang) => lookup(KOOTA_HI, v, lang),
};

// Rashi display used on cover / nakshatra cards: "<english> (<sanskrit>)" in EN,
// single Devanagari name in HI (both systems collapse to the same Hindi word).
export const rashiDisplay = (rashiEnglish: string, rashiSanskrit: string, lang: Lang) =>
  lang === "hi" ? (RASHI_EN_HI[rashiEnglish] || rashiEnglish) : `${rashiEnglish} (${rashiSanskrit})`;

// ─── Verdict (re-derived from score so it can be localized) ───────────────────
export function verdictText(score: number, lang: Lang): string {
  if (lang === "hi") {
    if (score >= 32) return "असाधारण मिलान · अत्यंत शुभ संयोग";
    if (score >= 25) return "उत्तम मिलान · अत्यधिक अनुशंसित";
    if (score >= 18) return "अच्छा मिलान · आगे बढ़ा जा सकता है";
    if (score >= 14) return "मध्यम मिलान · उपाय सुझाए जाते हैं";
    return "अनुशंसित नहीं · असामंजस्य का उच्च जोखिम";
  }
  if (score >= 32) return "Exceptional Match. Highly auspicious union.";
  if (score >= 25) return "Excellent Match. Strongly recommended.";
  if (score >= 18) return "Good Match. Can proceed.";
  if (score >= 14) return "Average Match. Remedies advised.";
  return "Not Recommended. High risk of incompatibility.";
}

// Short rating words used in tables / badges
export function ratingWord(pct: number, lang: Lang): string {
  if (lang === "hi") return pct >= 75 ? "उत्तम" : pct >= 50 ? "अच्छा" : pct > 0 ? "ठीक" : "कमज़ोर";
  return pct >= 75 ? "Excellent" : pct >= 50 ? "Good" : pct > 0 ? "Fair" : "Poor";
}
export function ratingWordUpper(pct: number, lang: Lang): string {
  if (lang === "hi") return pct >= 75 ? "उत्तम" : pct >= 50 ? "अच्छा" : pct > 0 ? "ठीक" : "कमज़ोर";
  return pct >= 75 ? "EXCELLENT" : pct >= 50 ? "GOOD" : pct > 0 ? "FAIR" : "POOR";
}

// ─── UI label dictionary ─────────────────────────────────────────────────────
type Dict = Record<string, string>;
const STR_EN: Dict = {
  brand: "V E D I C S C A N",
  headerRunning: "VEDICSCAN  ·  PREMIUM COMPATIBILITY REPORT",
  footerConfidential: "VedicScan · Vivah Compatibility Report · Confidential",
  page: "Page", of: "of",
  coverTitle: "Vivah Compatibility Report",
  coverSubtitle: "Vivah Sangata Vishleshan",
  ashtaKootaScore: "ASHTA KOOTA SCORE",
  harmony: "Harmony",
  birthDetails: "BIRTH DETAILS",
  labelName: "Name", labelDate: "Date", labelTime: "Time", labelPlace: "Place",
  generatedOn: "Generated on", poweredBy: "Powered by VedicScan",
  summaryTitle: "Ashta Koota Milan — At a Glance",
  totalGunaScore: "TOTAL GUNA SCORE",
  harmonyRating: "Harmony Rating",
  groom: "GROOM", bride: "BRIDE",
  nakshatra: "Nakshatra", rashi: "Rashi", gana: "Gana", nadi: "Nadi", lord: "Lord",
  kootaOverview: "Koota Score Overview",
  colKoota: "Koota (Quality Measured)", colMax: "Max", colScore: "Score", colRating: "Rating",
  total: "Total",
  gunaPageTitle: "The Eight Gunas — In-Depth Analysis",
  measures: "MEASURES: ",
  classicalSignificance: "CLASSICAL SIGNIFICANCE:",
  forThisCouple: "FOR THIS COUPLE:",
  doshaTitle: "Dosha Analysis",
  clear: "CLEAR", noDoshas: "No Doshas Detected", doshaFree: "Dosha-Free Union",
  description: "DESCRIPTION", classicalReference: "CLASSICAL REFERENCE",
  cancellationConditions: "CANCELLATION CONDITIONS — When Does This Dosha Get Nullified?",
  severity: "SEVERITY",
  importantNoteDosha: "IMPORTANT NOTE ON DOSHAS",
  remediesTitle: "Sacred Vedic Remedies",
  remediesSub: "Prescribed prescriptions from classical Jyotisha for harmonizing celestial energies",
  doshaSpecificRemedies: "Dosha-Specific Remedies",
  prescribedRemedies: " — Prescribed Remedies",
  puja: "Puja:", gemstone: "Gemstone:", fastingCharity: "Fasting & Charity:",
  lifeAreasTitle: "Life Compatibility Analysis",
  lifeAreasSub: "How the stars align across the six pillars of married life",
  nakshatraProfilesTitle: "Nakshatra Deep Profiles",
  birthStarProfile: "BIRTH STAR PROFILE",
  essenceCharacter: "ESSENCE & CHARACTER",
  deityDevata: "Deity (Devata)", symbol: "Symbol", zodiacSign: "Zodiac Sign",
  rulingPlanet: "Ruling Planet", varna: "Varna", yoni: "Yoni", vashya: "Vashya",
  essence: "Essence:", naturalGifts: "Natural Gifts:", shadowQualities: "Shadow Qualities:",
  groomNakshatra: "GROOM'S NAKSHATRA", brideNakshatra: "BRIDE'S NAKSHATRA",
  energeticInteraction: "THEIR ENERGETIC INTERACTION",
  conclusionBlessing: "CONCLUSION & BLESSING",
  conclusionSub: "VedicScan · Vivah Compatibility Analysis",
  finalScore: "FINAL COMPATIBILITY SCORE",
  blessingSanskrit: "Om Sarve Bhavantu Sukhinah",
  blessingGloss: "May all beings be happy · May all beings be at peace",
  maharishiAttribution: "— Maharishi Vedic Wisdom",
  disclaimer: "DISCLAIMER",
  disclaimerText: "This report is based on classical Vedic Jyotisha principles and is offered for spiritual reflection and guidance only. It does not constitute professional astrological, medical, legal, or marital advice. The final decision regarding marriage rests entirely with the individuals involved and their families. VedicScan does not guarantee any particular life outcome based on this analysis.",
  generatedByOn: "Generated by VedicScan on",
  premiumReport: "Premium Compatibility Report",
  premiumReportBadge: "PREMIUM REPORT",
  needsWork: "Needs Work", needsAttention: "Needs Attention", needsGuidance: "Needs Guidance", needsPractice: "Needs Practice",
  maharishiQuote: '"The highest compatibility is not between stars — it is between two hearts determined to choose each other every day."',
  nakshatraSuffix: "Nakshatra",
};
const STR_HI: Dict = {
  brand: "वे दि क स्कै न",
  headerRunning: "वेदिकस्कैन  ·  प्रीमियम कुंडली मिलान रिपोर्ट",
  footerConfidential: "वेदिकस्कैन · विवाह सामंजस्य रिपोर्ट · गोपनीय",
  page: "पृष्ठ", of: "/",
  coverTitle: "विवाह सामंजस्य रिपोर्ट",
  coverSubtitle: "विवाह संगत विश्लेषण",
  ashtaKootaScore: "अष्टकूट गुण",
  harmony: "सामंजस्य",
  birthDetails: "जन्म विवरण",
  labelName: "नाम", labelDate: "तिथि", labelTime: "समय", labelPlace: "स्थान",
  generatedOn: "निर्मित", poweredBy: "वेदिकस्कैन द्वारा",
  summaryTitle: "अष्टकूट मिलन — एक दृष्टि में",
  totalGunaScore: "कुल गुण",
  harmonyRating: "सामंजस्य स्तर",
  groom: "वर", bride: "वधू",
  nakshatra: "नक्षत्र", rashi: "राशि", gana: "गण", nadi: "नाड़ी", lord: "स्वामी",
  kootaOverview: "कूट गुण सारणी",
  colKoota: "कूट (मापित गुण)", colMax: "अधिकतम", colScore: "प्राप्त", colRating: "स्तर",
  total: "कुल",
  gunaPageTitle: "आठ गुण — विस्तृत विश्लेषण",
  measures: "मापता है: ",
  classicalSignificance: "शास्त्रीय महत्व:",
  forThisCouple: "इस जोड़े के लिए:",
  doshaTitle: "दोष विश्लेषण",
  clear: "निर्दोष", noDoshas: "कोई दोष नहीं पाया गया", doshaFree: "दोष-रहित संयोग",
  description: "विवरण", classicalReference: "शास्त्रीय संदर्भ",
  cancellationConditions: "दोष निवारण की शर्तें — यह दोष कब निष्प्रभावी होता है?",
  severity: "तीव्रता",
  importantNoteDosha: "दोषों पर महत्वपूर्ण टिप्पणी",
  remediesTitle: "पवित्र वैदिक उपाय",
  remediesSub: "आकाशीय ऊर्जाओं के सामंजस्य हेतु शास्त्रीय ज्योतिष से निर्धारित उपाय",
  doshaSpecificRemedies: "दोष-विशिष्ट उपाय",
  prescribedRemedies: " — निर्धारित उपाय",
  puja: "पूजा:", gemstone: "रत्न:", fastingCharity: "व्रत एवं दान:",
  lifeAreasTitle: "जीवन सामंजस्य विश्लेषण",
  lifeAreasSub: "वैवाहिक जीवन के छह स्तंभों में ग्रहों का सामंजस्य",
  nakshatraProfilesTitle: "नक्षत्र विस्तृत परिचय",
  birthStarProfile: "जन्म नक्षत्र परिचय",
  essenceCharacter: "सार एवं स्वभाव",
  deityDevata: "देवता", symbol: "प्रतीक", zodiacSign: "राशि",
  rulingPlanet: "स्वामी ग्रह", varna: "वर्ण", yoni: "योनि", vashya: "वश्य",
  essence: "सार:", naturalGifts: "स्वाभाविक गुण:", shadowQualities: "छाया-पक्ष:",
  groomNakshatra: "वर का नक्षत्र", brideNakshatra: "वधू का नक्षत्र",
  energeticInteraction: "उनकी ऊर्जात्मक अंतःक्रिया",
  conclusionBlessing: "निष्कर्ष एवं आशीर्वाद",
  conclusionSub: "वेदिकस्कैन · विवाह सामंजस्य विश्लेषण",
  finalScore: "अंतिम सामंजस्य गुण",
  blessingSanskrit: "ॐ सर्वे भवन्तु सुखिनः",
  blessingGloss: "सभी सुखी हों · सभी शांतिमय हों",
  maharishiAttribution: "— महर्षि वैदिक ज्ञान",
  disclaimer: "अस्वीकरण",
  disclaimerText: "यह रिपोर्ट शास्त्रीय वैदिक ज्योतिष के सिद्धांतों पर आधारित है और केवल आध्यात्मिक चिंतन एवं मार्गदर्शन हेतु प्रस्तुत की गई है। यह पेशेवर ज्योतिषीय, चिकित्सकीय, कानूनी या वैवाहिक सलाह नहीं है। विवाह का अंतिम निर्णय पूर्णतः संबंधित व्यक्तियों एवं उनके परिवारों पर निर्भर करता है। वेदिकस्कैन इस विश्लेषण के आधार पर किसी विशेष जीवन-परिणाम की गारंटी नहीं देता।",
  generatedByOn: "वेदिकस्कैन द्वारा निर्मित",
  premiumReport: "प्रीमियम कुंडली मिलान रिपोर्ट",
  premiumReportBadge: "प्रीमियम रिपोर्ट",
  needsWork: "प्रयास आवश्यक", needsAttention: "ध्यान आवश्यक", needsGuidance: "मार्गदर्शन आवश्यक", needsPractice: "साधना आवश्यक",
  maharishiQuote: '"सर्वोच्च सामंजस्य तारों के बीच नहीं होता — वह दो हृदयों के बीच होता है जो प्रतिदिन एक-दूसरे को चुनने का संकल्प करते हैं।"',
  nakshatraSuffix: "नक्षत्र",
};
export const STR: Record<Lang, Dict> = { en: STR_EN, hi: STR_HI };
export const L = (lang: Lang) => STR[lang];

// ─── Nakshatra profiles (NX) ─────────────────────────────────────────────────
type NXEntry = { deity: string; symbol: string; essence: string; traits: string; shadow: string };
const NX_HI: Record<string, NXEntry> = {
  "Ashwini": { deity: "अश्विनी कुमार (देव-वैद्य)", symbol: "अश्व-मस्तक", essence: "शीघ्र आरोग्य, नवीनीकरण, अग्रणी भावना", traits: "गतिशील, तीव्र-बुद्धि, साहसी, आरोग्यदायी", shadow: "अधीरता, बेचैनी, बिखरा हुआ ध्यान" },
  "Bharani": { deity: "यम (धर्म के अधिपति)", symbol: "योनि (पवित्र गर्भ)", essence: "रूपांतरण, उत्तरदायित्व, जीवन-भार वहन", traits: "दृढ़-संकल्प, सृजनशील, भावुक, साहसी", shadow: "अधिकार-भाव, हठ, अतिवाद" },
  "Krittika": { deity: "अग्नि (पवित्र अग्नि के देव)", symbol: "उस्तरा / ज्वाला", essence: "शुद्धिकरण, प्रकाश, भ्रम का छेदन", traits: "तीक्ष्ण बुद्धि, अधिकारपूर्ण, महत्वाकांक्षी, रक्षक", shadow: "आक्रामकता, अति-आलोचना, अभिमान" },
  "Rohini": { deity: "ब्रह्मा (सृष्टिकर्ता)", symbol: "रथ / गाड़ी", essence: "उर्वरता, सौंदर्य, समृद्धि, सृजनात्मक अभिव्यक्ति", traits: "संवेदनशील, कलात्मक, पोषक, भौतिक रूप से सम्पन्न", shadow: "अधिकार-भाव, भौतिकता, ईर्ष्या" },
  "Mrigashira": { deity: "सोम (चंद्र देव)", symbol: "मृग-मस्तक", essence: "कोमल जिज्ञासा, शाश्वत खोज, सौम्य अन्वेषण", traits: "बौद्धिक, संवेदनशील, बहुमुखी, सौम्य", shadow: "चिंता, अनिर्णय, अत्यधिक खोज" },
  "Ardra": { deity: "रुद्र (तूफ़ान के देव)", symbol: "अश्रु-बिंदु / हीरा", essence: "तूफ़ान द्वारा रूपांतरण, तीव्र भावनात्मक नवीनीकरण", traits: "तीक्ष्ण मन, गहन, पीड़ा के प्रति सहानुभूतिशील", shadow: "विध्वंसकता, भावनात्मक उथल-पुथल, क्रोध" },
  "Punarvasu": { deity: "अदिति (देवों की माता)", symbol: "बाणों का तरकश", essence: "शुभता की ओर वापसी, नवीनीकरण, आशावादी पुनर्स्थापन", traits: "दार्शनिक, उदार, आशावादी, अनुकूलनशील", shadow: "अस्थिरता, अति-आदर्शवाद, भोलापन" },
  "Pushya": { deity: "बृहस्पति (देव-गुरु)", symbol: "गौ-थन / कमल", essence: "पोषण, आध्यात्मिक ज्ञान, दिव्य समृद्धि", traits: "रक्षक, आध्यात्मिक, उदार, उत्तरदायी", shadow: "हठधर्मिता, आत्म-धार्मिकता, कठोर रूढ़िवादिता" },
  "Ashlesha": { deity: "नाग (सर्प देवता)", symbol: "कुंडलित सर्प", essence: "रहस्यमय अंतर्दृष्टि, कुंडलिनी जागरण, गूढ़ ज्ञान", traits: "सूक्ष्मदर्शी, चुम्बकीय, अंतर्ज्ञानी, रणनीतिक", shadow: "चातुर्य, भावनात्मक छल, गोपनीयता" },
  "Magha": { deity: "पितृ (पूर्वज आत्माएँ)", symbol: "राजसिंहासन", essence: "पैतृक शक्ति, राजसी अधिकार, कुलीन विरासत", traits: "नेतृत्व, गरिमा, गौरवशाली, परंपरा-प्रिय", shadow: "अहंकार, श्रेष्ठता-भाव, पूर्वज-आसक्ति" },
  "Purva Phalguni": { deity: "भग (समृद्धि के देव)", symbol: "शय्या के अग्र-पाद", essence: "सृजनात्मक आनंद, विश्राम, यौवन-प्रेम एवं हर्ष", traits: "आकर्षक, कलात्मक, संवेदनशील, सामाजिक रूप से निपुण", shadow: "आलस्य, भोग-विलास, दिखावा" },
  "Uttara Phalguni": { deity: "अर्यमन (अनुबंधों के देव)", symbol: "शय्या के पश्च-पाद", essence: "वैवाहिक मिलन, संरक्षण, सामाजिक अनुबंधों की पूर्ति", traits: "विश्वसनीय, उदार, व्यवस्थित, सामाजिक रूप से निपुण", shadow: "अनुमोदन पर निर्भरता, कठोरता" },
  "Hasta": { deity: "सवितृ (सूर्य का सृजनात्मक रूप)", symbol: "खुला हाथ / पाँच अंगुलियाँ", essence: "कुशल सृजन, आरोग्य-स्पर्श, कला एवं शिल्प", traits: "चतुर, निपुण, हाज़िरजवाब, आरोग्य-प्रवृत्त", shadow: "षड्यंत्री बुद्धि, बेचैनी, कपटी आकर्षण" },
  "Chitra": { deity: "विश्वकर्मा (दिव्य शिल्पी)", symbol: "उज्ज्वल रत्न / मोती", essence: "सृजनात्मक तेज, रूप में सौंदर्य, दिव्य रचना", traits: "कलात्मक, करिश्माई, निपुण, सूक्ष्मदर्शी", shadow: "दिखावा, सतहीपन, बिखरी सृजनशीलता" },
  "Swati": { deity: "वायु (पवन के देव)", symbol: "मूँगा / वायु में नवांकुर", essence: "स्वतंत्रता, लचीलापन, दूरगामी व्यापार एवं संवाद", traits: "स्वतंत्र, कूटनीतिक, आदर्शवादी, आकर्षक", shadow: "बेचैनी, टालमटोल, अनिर्णय" },
  "Vishakha": { deity: "इंद्र-अग्नि (शक्ति एवं पवित्र अग्नि)", symbol: "विजय-तोरण / कुम्हार का चक्र", essence: "उद्देश्यपूर्ण उपलब्धि, निरंतर प्रयास से विजय", traits: "महत्वाकांक्षी, एकाग्र, दृढ़-संकल्प, लक्ष्य-केंद्रित", shadow: "ईर्ष्या, अत्यधिक प्रतिस्पर्धा, संबंधों की उपेक्षा" },
  "Anuradha": { deity: "मित्र (मैत्री एवं अनुबंध के देव)", symbol: "कमल / दंड", essence: "भक्ति, गहन मैत्री, सहयोग, दिव्य प्रेम", traits: "समर्पित, कूटनीतिक, मैत्रीपूर्ण, शांत-दृढ़", shadow: "अति-निर्भरता, आत्म-दमन, चिपकाव" },
  "Jyeshtha": { deity: "इंद्र (देवराज)", symbol: "वृत्ताकार ताबीज़ / छत्र", essence: "ज्येष्ठता, अधिकार, संरक्षक वरिष्ठ-सदृश ज्ञान", traits: "बुद्धिमान, अधिकारपूर्ण, रक्षक, आध्यात्मिक रूप से गहन", shadow: "ईर्ष्या, अहंकार, शक्ति का कपटपूर्ण प्रयोग" },
  "Mula": { deity: "निरृति (विघटन की देवी)", symbol: "जड़ों का गुच्छा / सिंह-पुच्छ", essence: "मूल की खोज, पुराने का विघटन, आधार का अन्वेषण", traits: "अनुसंधान-प्रवृत्त, दार्शनिक, खोजी, रूपांतरकारी", shadow: "विध्वंसक प्रवृत्ति, स्थिरता का उन्मूलन, अतिवाद" },
  "Purva Ashadha": { deity: "आपः (जल देवी)", symbol: "गज-दंत / पंखा", essence: "अजेयता, शुद्धिकरण, शीघ्र एवं स्थायी विजय", traits: "आशावादी, गौरवशाली, स्वतंत्र, प्रभावशाली", shadow: "अनम्यता, अति-आत्मविश्वास, आत्मश्लाघा" },
  "Uttara Ashadha": { deity: "विश्वेदेव (सार्वभौमिक देव)", symbol: "गज-दंत / काष्ठ-शय्या", essence: "अंतिम विजय, सार्वभौमिक मूल्य, धार्मिक पूर्णता", traits: "नेतृत्व, सत्यनिष्ठा, परिष्कृत, दृढ़-संकल्प", shadow: "एकाग्रचित्तता, समझौते में कठिनाई" },
  "Shravana": { deity: "विष्णु (पालनकर्ता)", symbol: "तीन पदचिह्न / त्रिशूल", essence: "श्रवण से ज्ञान, पवित्र संबंध, पालन", traits: "बुद्धिमान, विद्वान, सूक्ष्मदर्शी, संवाद-कुशल", shadow: "निंदा के प्रति अति-संवेदनशीलता, बेचैनी" },
  "Dhanishta": { deity: "अष्ट वसु (आठ तत्व-देव)", symbol: "मृदंग / बाँसुरी", essence: "धन, संगीत, समृद्धि, भौतिक प्रचुरता", traits: "महत्वाकांक्षी, संगीतमय, आत्मविश्वासी, समृद्धि-प्रवृत्त", shadow: "लोभ, वैवाहिक कलह, अत्यधिक महत्वाकांक्षा" },
  "Shatabhisha": { deity: "वरुण (ब्रह्मांडीय व्यवस्था के अधिपति)", symbol: "रिक्त वृत्त / सौ तारे", essence: "रहस्यवाद से आरोग्य, ब्रह्मांडीय नियम, एकांत-ज्ञान", traits: "वैज्ञानिक, एकांतप्रिय, आरोग्यदायी, मौलिक", shadow: "अलगाव, विचित्रता, भावनात्मक विरक्ति" },
  "Purva Bhadrapada": { deity: "अज एकपाद (एक-पाद अजगर)", symbol: "तलवार / शव-शय्या के अग्र-पाद", essence: "अग्नि से शुद्धिकरण, रूपांतरकारी एवं भावपूर्ण भक्ति", traits: "भावपूर्ण, गहन, सुधारवादी, आध्यात्मिक रूप से प्रेरित", shadow: "उतावलापन, अतिवाद, अनियंत्रित भावनाएँ" },
  "Uttara Bhadrapada": { deity: "अहिर्बुध्न्य (गहराइयों का सर्प)", symbol: "शव-शय्या के पश्च-पाद", essence: "गहन ज्ञान, धैर्यपूर्ण सहनशीलता, करुणामय पूर्णता", traits: "बुद्धिमान, संयमित, दानशील, गहन सहानुभूतिशील", shadow: "आलस्य, अति-सावधानी, संसार से विमुखता" },
  "Revati": { deity: "पूषन (दिव्य पोषक एवं मार्गदर्शक)", symbol: "मीन / मृदंग", essence: "सुरक्षित यात्रा, दिव्य पोषण, आकाशीय गृह-वापसी", traits: "पोषक, सृजनशील, आध्यात्मिक, गहन करुणामय", shadow: "अति-संवेदनशीलता, भोलापन, अलौकिकता" },
};

// ─── Guna metadata (GM) — Hindi ──────────────────────────────────────────────
type GMEntry = { measures: string; classical: string; full: string; partial: string; poor: string };
const GM_HI: Record<string, GMEntry> = {
  "Varna": {
    measures: "अहंकार, आध्यात्मिक विकास एवं कर्म-नैतिकता का सामंजस्य",
    classical: "वर्ण कूट, बृहत् पराशर होरा शास्त्र से लिया गया, यह आँकता है कि दोनों साथी सामाजिक धर्म एवं कर्म-नैतिकता में समरूप हैं या नहीं। संरेखित वर्ण यह सुनिश्चित करता है कि दंपति एक-दूसरे के कर्तव्यों, महत्वाकांक्षाओं एवं सामाजिक स्थान को समझें — जिससे दैनिक उत्तरदायित्वों में टकराव कम होता है।",
    full: "उनका सामाजिक धर्म एवं कर्म-नैतिकता पूर्ण रूप से संरेखित हैं। दंपति कर्तव्य, महत्वाकांक्षा एवं आध्यात्मिक उत्तरदायित्व के साझा मूल्यों को धारण करता है — वे जीवन के दायित्वों में स्वाभाविक रूप से कंधे-से-कंधा मिलाकर खड़े होंगे।",
    partial: "सामाजिक दृष्टिकोण में एक सूक्ष्म भिन्नता है। कर्तव्य एवं उत्तरदायित्व के प्रति एक-दूसरे के दृष्टिकोण के प्रति सचेत आदर के साथ, यह दंपति खुले संवाद द्वारा किसी भी वर्ण-अंतर को पाट सकता है।",
    poor: "सामाजिक क्रम एवं कर्तव्य के प्रति भिन्न दृष्टिकोण साझा उत्तरदायित्वों में टकराव उत्पन्न कर सकते हैं। एक-दूसरे के अद्वितीय दृष्टिकोण का सचेत सम्मान इस भिन्नता को पूरक शक्ति के स्रोत में बदल देता है।",
  },
  "Vashya": {
    measures: "पारस्परिक आकर्षण, चुम्बकीय खिंचाव एवं स्वाभाविक प्रभुत्व",
    classical: "वश्य कूट साथियों के बीच स्वाभाविक चुम्बकत्व एवं शक्ति-संतुलन को नियंत्रित करता है। यह दर्शाता है कि कौन स्वाभाविक रूप से किसे आकर्षित करता है, और क्या यह खिंचाव पारस्परिक है — एक संतुलित, आकर्षक संबंध के लिए आवश्यक जहाँ कोई भी साथी नियंत्रित अनुभव न करे।",
    full: "इन दो आत्माओं के बीच एक असाधारण चुम्बकीय आकर्षण प्रवाहित होता है। एक-दूसरे पर उनका प्रभाव सुंदर रूप से संतुलित है — कोई अनुचित रूप से प्रभुत्व नहीं जमाता, और दोनों स्वाभाविक रूप से एक-दूसरे को प्रेम एवं सहयोग देने के लिए प्रेरित होते हैं।",
    partial: "एक सुखद स्वाभाविक आकर्षण विद्यमान है, शक्ति-संतुलन में सह्य भिन्नताओं के साथ। सचेत संवाद एवं एक-दूसरे की शक्तियों के प्रति सराहना किसी भी असंतुलन को सामंजस्यपूर्ण बनाएगी।",
    poor: "साथियों के बीच स्वाभाविक चुम्बकीय खिंचाव को सक्रिय रूप से विकसित करने की आवश्यकता है। एक-दूसरे के गुणों का सचेत उत्सव एवं दैनिक सराहना वह आकर्षण निर्मित करेगी जिसकी वश्य अपेक्षा करता है।",
  },
  "Tara": {
    measures: "भाग्य, सौभाग्य एवं जीवन-पथ का संरेखण",
    classical: "तारा कूट राशि-चक्र के नौ विभागों में दोनों जन्म-नक्षत्रों के संबंध की जाँच करता है। यह आँकता है कि दोनों साथियों का आकाशीय समय, जीवन-अवसर एवं समग्र सौभाग्य समकालिक रूप से आएगा या वे प्रायः विपरीत समय का अनुभव करेंगे।",
    full: "उनके तारे एक साथ सौभाग्यशाली यात्रा हेतु दिव्य रूप से संरेखित हैं। जीवन के आशीर्वाद, अवसर एवं शुभ समय समकालिक रूप से आने की प्रवृत्ति रखेंगे — जो इस मिलन को परस्पर विकास एवं समृद्धि का माध्यम बनाता है।",
    partial: "मध्यम तारा-संरेखण एक समग्र रूप से सौभाग्यशाली साझेदारी दर्शाता है जिसमें कभी-कभार समय की भिन्नता होती है। असंरेखण के प्रतीत होने वाले कालखंडों में धैर्य उनके मिलन में कार्यरत गहन ब्रह्मांडीय योजना को प्रकट करेगा।",
    poor: "आकाशीय समय कभी-कभी साथियों के बीच असमकालिक प्रतीत हो सकता है। साझा आध्यात्मिक साधना, एक-दूसरे की जीवन-लय के प्रति धैर्य एवं एक-दूसरे की विजयों का सचेत उत्सव उनके भाग्य को सामंजस्यपूर्ण बनाएगा।",
  },
  "Yoni": {
    measures: "शारीरिक अनुकूलता, आत्मीय सामंजस्य एवं जैविक अनुनाद",
    classical: "योनि कूट शास्त्रीय ज्योतिष के समस्त अनुकूलता-कारकों में सर्वाधिक आत्मीय है। यह शारीरिक आकर्षण की गहराई, जैविक सामंजस्य एवं साथियों के बीच ऊर्जात्मक आदान-प्रदान की गुणवत्ता को नियंत्रित करता है — जिसे एक संतोषप्रद वैवाहिक बंधन हेतु आवश्यक माना गया है।",
    full: "इस मिलन को असाधारण शारीरिक एवं ऊर्जात्मक अनुकूलता का वरदान प्राप्त है। उनके शरीर, लय एवं आत्मीय ऊर्जा स्वाभाविक रूप से एक साथ प्रवाहित होती हैं — जो शारीरिक एवं भावनात्मक निकटता की एक सशक्त एवं गहन संतोषप्रद नींव रचती है।",
    partial: "पूरक ऊर्जाओं के साथ अच्छी शारीरिक अनुकूलता। उनका आत्मीय संबंध धैर्य, प्रेमपूर्ण संवाद एवं एक-दूसरे की आवश्यकताओं को समझने की सच्ची प्रतिबद्धता के साथ सुंदर रूप से गहरा हो सकता है।",
    poor: "शारीरिक अनुकूलता को सचेत रूप से पोषित करने की आवश्यकता है। धैर्य, खुले संवाद एवं पारस्परिक सम्मान के साथ, दंपति एक गहन संतोषप्रद आत्मीय संबंध निर्मित कर सकता है जो साझा जीवन के वर्षों में और समृद्ध होता है।",
  },
  "Maitri": {
    measures: "बौद्धिक मैत्री, मानसिक तालमेल एवं मनोवैज्ञानिक सामंजस्य",
    classical: "ग्रह मैत्री दोनों चंद्र-राशियों के स्वामी ग्रहों के बीच मित्रता की जाँच करती है। सशक्त मैत्री दर्शाती है कि साथी समान रूप से सोचते हैं, बौद्धिक आदान-प्रदान को उत्तेजक पाते हैं, एवं एक स्वाभाविक मनोवैज्ञानिक सामंजस्य का अनुभव करते हैं — जो स्थायी सहचर्य की नींव है।",
    full: "उनके मन सुंदर रूप से समस्वर हैं। उनकी चंद्र-राशियों के स्वामी ग्रह गहन मित्र हैं — जो सहज बौद्धिक अनुनाद एवं मनोवैज्ञानिक सामंजस्य रचते हैं। ये दोनों बिना समझाए ही एक-दूसरे को समझ लेंगे।",
    partial: "कुछ स्वाभाविक भिन्नताओं के क्षेत्रों के साथ अच्छी बौद्धिक अनुकूलता। उनके मन पूरक ढंग से कार्य करते हैं — और एक-दूसरे के दृष्टिकोणों के प्रति सच्ची जिज्ञासा के साथ, उनकी मानसिक मैत्री समय के साथ फलती-फूलती जाएगी।",
    poor: "उनके मन समस्याओं को काफी भिन्न ढंग से देखते हैं। समानता खोजने के बजाय इस विचार-वैविध्य का उत्सव बौद्धिक भिन्नताओं को विकास एवं पारस्परिक खोज के एक उत्तेजक स्रोत में बदल देगा।",
  },
  "Gana": {
    measures: "मूल स्वभाव, व्यावहारिक प्रवृत्ति एवं दृष्टिकोण-सामंजस्य",
    classical: "गण कूट व्यक्ति के स्वभाव के सर्वाधिक मौलिक स्तर का प्रतिनिधित्व करता है — दिव्य (देव: उदार, हल्का), मानवीय (मनुष्य: संतुलित, जटिल), या उग्र (राक्षस: प्रचंड, तीव्र)। अनुकूल गण सहज दैनिक अंतःक्रिया एवं एक-दूसरे के मूल स्वभाव की स्वाभाविक समझ सुनिश्चित करते हैं।",
    full: "एक उल्लेखनीय वरदान — उनके मूल स्वभाव पूर्ण रूप से मेल खाते हैं। दोनों साथी जीवन, संबंधों एवं चुनौतियों को समान मौलिक ऊर्जा के साथ देखते हैं, जो सहज दैनिक सामंजस्य एवं सच्ची पारस्परिक समझ रचता है।",
    partial: "पूरक स्वभाव एक समृद्ध, बहुआयामी साझेदारी रचते हैं। उनकी भिन्न मूल ऊर्जाएँ — जब निंदा के बजाय सचेत रूप से सराही जाएँ — ऐसी शक्तियाँ बन जाती हैं जो एक-दूसरे को संतुलित एवं उन्नत करती हैं।",
    poor: "महत्वपूर्ण स्वभावगत भिन्नताओं को गहन सचेत सेतु की आवश्यकता है। साथियों को एक-दूसरे के मूल स्वभाव का सच्चा सम्मान — यहाँ तक कि उत्सव — करना होगा, उसे बदलने का प्रयास नहीं, तभी यह मिलन अपनी संभावना तक पहुँचेगा।",
  },
  "Bhakut": {
    measures: "जीवन-शक्ति, भावनात्मक स्वास्थ्य, समृद्धि एवं पारिवारिक कल्याण",
    classical: "भकूट अष्टकूट प्रणाली के सर्वाधिक शक्तिशाली कूटों में से एक है, जो 36 में से 7 अंक वहन करता है। यह संयुक्त जीवन-ऊर्जा (प्राण) के प्रवाह, भावनात्मक स्वास्थ्य, भौतिक समृद्धि एवं उस परिवार-इकाई की समग्र जीवन-शक्ति को नियंत्रित करता है जिसे यह दंपति एक साथ रचेगा।",
    full: "एक अत्यंत शुभ भकूट — उनकी संयुक्त जीवन-शक्ति पारस्परिक समृद्धि, भावनात्मक कल्याण एवं प्रचुर पारिवारिक आशीर्वादों की ओर शक्तिशाली रूप से प्रवाहित होती है। इस दंपति का मिलन ऊर्जात्मक रूप से सशक्त एवं जीवनदायी है।",
    partial: "सामान्यतः अनुकूल जीवन-शक्ति संरेखण। दंपति की संयुक्त ऊर्जा समग्र कल्याण का समर्थन करती है एवं सचेत पारस्परिक सहयोग तथा संरेखित वित्तीय लक्ष्यों द्वारा समृद्धि निर्मित कर सकती है।",
    poor: "एक भकूट दोष विद्यमान है जिस पर गंभीर ध्यान आवश्यक है (दोष विश्लेषण अनुभाग देखें)। उचित उपायों, आध्यात्मिक आधार एवं सचेत प्रयास के साथ, यह दंपति चुनौतियों से पार पाकर एक सार्थक, समृद्ध जीवन रच सकता है।",
  },
  "Nadi": {
    measures: "आनुवंशिक अनुकूलता, स्वास्थ्य-सामंजस्य एवं संतान-कल्याण",
    classical: "नाड़ी अष्टकूट प्रणाली का सर्वाधिक महत्वपूर्ण कूट है, जो 36 में से सर्वाधिक 8 अंक वहन करता है। यह ऊर्जात्मक एवं शारीरिक अनुकूलता के मूल स्तर — शरीर की जीवन-धारा (नाड़ी), स्वास्थ्य, एवं स्वस्थ संतान हेतु आवश्यक आनुवंशिक अनुकूलता — को नियंत्रित करता है।",
    full: "सर्वाधिक शुभ नाड़ी परिणाम — उनकी जीवन-ऊर्जा धाराएँ पूर्ण रूप से पूरक हैं। यह उनके व्यक्तिगत स्वास्थ्य, संयुक्त जीवन-शक्ति, दीर्घ सहजीवन, एवं उनकी संतान के स्वास्थ्य तथा तेज के लिए सुंदर संकेत है।",
    partial: "अच्छा नाड़ी सामंजस्य जो ठोस स्वास्थ्य-अनुकूलता प्रदान करता है। उनकी संयुक्त ऊर्जात्मक प्रकृति सामान्यतः एक-दूसरे के कल्याण एवं समग्र स्वास्थ्य के लिए सहायक है।",
    poor: "एक नाड़ी दोष विद्यमान है — समस्त दोषों में सर्वाधिक महत्वपूर्ण (दोष विश्लेषण अनुभाग देखें)। नाड़ी दोष वाले अनेक दंपति उचित उपायों एवं समर्पित आध्यात्मिक साधना के साथ दीर्घ, स्वस्थ जीवन जीते हैं।",
  },
};

// ─── Dosha remedies (DR) — Hindi ─────────────────────────────────────────────
type DREntry = {
  mantras: Array<{ text: string; instruction: string }>;
  puja: string; cancellation: string[]; gemstone: string; fasting: string; charity: string;
};
const DR_HI: Record<string, DREntry> = {
  "Nadi Dosha": {
    mantras: [
      { text: "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्।\nउर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय माऽमृतात्॥", instruction: "महामृत्युंजय मंत्र — विवाह से पूर्व 40 निरंतर दिनों तक प्रतिदिन 108 बार जप करें" },
      { text: "ॐ नमो भगवते वासुदेवाय", instruction: "विष्णु मंत्र — 21 दिनों तक प्रत्येक प्रातः 108 बार जप करें" },
    ],
    puja: "नाड़ी दोष निवारण पूजा किसी विद्वान वैदिक पुरोहित द्वारा शिव मंदिर में — आदर्शतः काशी (वाराणसी), त्र्यंबकेश्वर (नासिक), या तिरुपति में — सम्पन्न की जानी चाहिए। इस पूजा में शिवलिंग का अभिषेक, महामृत्युंजय मंत्र का पाठ, एवं तिल, घी तथा शहद की आहुति सहित विशेष हवन सम्मिलित है।",
    cancellation: [
      "यदि दोनों साथियों की चंद्र-राशि समान हो किंतु नक्षत्र भिन्न हों",
      "यदि दोनों साथियों का नक्षत्र समान हो किंतु पाद (चरण) भिन्न हों",
      "यदि किसी की कुंडली में बृहस्पति उच्च का, स्वराशि का, अथवा 5वें/9वें भाव में हो",
      "यदि किसी की जन्म-कुंडली में चंद्र उच्च का (वृषभ में) या स्वराशि (कर्क) में हो",
      "यदि दोनों की नवांश कुंडली में शुक्र केंद्र (1, 4, 7, 10वें भाव) में स्थित हो",
      "जब विवाह-संस्कार से पूर्व नाड़ी दोष पूजा विधिवत सम्पन्न की जाए",
    ],
    gemstone: "प्राकृतिक मोती — कम-से-कम 5 रत्ती, शुद्ध चाँदी में जड़ा हुआ, दाहिने हाथ की कनिष्ठा में धारण करें। सोमवार को सूर्योदय के समय कच्चे दूध एवं गंगाजल में डुबोकर अभिमंत्रित करें, तत्पश्चात चंद्र मंत्र का 108 बार जप करके धारण करें।",
    fasting: "सोमवार व्रत — दोनों साथी सोमवार को व्रत रखें, भगवान शिव को दूध एवं श्वेत पुष्प अर्पित करें। विवाह के पश्चात 16 निरंतर सोमवार तक इसका पालन करें।",
    charity: "विवाह के दिन किसी मंदिर या ब्राह्मण को गौ-दान (अथवा उसके समतुल्य धन) करें। सोमवार को दान किए गए श्वेत पदार्थ — दूध, चावल, श्वेत वस्त्र, चाँदी — नाड़ी दोष हेतु विशेष रूप से शुद्धिकारक हैं।",
  },
  "Bhakut Dosha": {
    mantras: [
      { text: "ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः", instruction: "चंद्र मंत्र — प्रत्येक सोमवार, विशेषकर पूर्णिमा को 108 बार जप करें" },
      { text: "ॐ नमो नारायणाय", instruction: "विष्णु मंत्र — दोनों साथी विवाह के दिन एक साथ 108 बार जप करें" },
    ],
    puja: "विवाह-संस्कार से पूर्व चंद्र पूजा पर विशेष बल के साथ नवग्रह शांति पूजा सम्पन्न की जानी चाहिए। यह पूजा आदर्शतः सोमवार या पूर्णिमा को किसी विद्वान ज्योतिषी-पुरोहित द्वारा की जाती है। इसके अतिरिक्त वैवाहिक सामंजस्य एवं साझा समृद्धि हेतु विष्णु पूजा अत्यंत अनुशंसित है।",
    cancellation: [
      "यदि दोनों साथियों की चंद्र-राशियों के स्वामी परस्पर मित्र हों (जैसे चंद्र+शुक्र, शुक्र+बुध)",
      "यदि दोनों साथियों की चंद्र-राशि समान हो (समान राशि, भिन्न नक्षत्र)",
      "यदि किसी की कुंडली में शुक्र बलवान हो (स्वराशि वृषभ/तुला, या मीन में उच्च का)",
      "यदि किसी अथवा दोनों की कुंडली में बृहस्पति चंद्र को देखता हो",
      "यदि दोनों की जन्म-कुंडली में शुभ ग्रह (बृहस्पति, शुक्र, चंद्र, बुध) 7वें भाव में हों",
      "यदि दोनों साथियों का जन्म एक ही गोत्र में हुआ हो",
    ],
    gemstone: "प्राकृतिक मोती या मूनस्टोन — चाँदी में जड़ा, सोमवार को दाहिने हाथ की कनिष्ठा में धारण करें। विकल्प रूप में, जो असली मोती प्राप्त न कर सकें उनके लिए चाँदी में श्वेत जरकन।",
    fasting: "दोनों साथी एक साथ पूर्णिमा व्रत रखें — प्रत्येक पूर्णिमा पर संयुक्त सत्यनारायण कथा या विष्णु पूजा के साथ। यह साझा अनुष्ठान सशक्त वैवाहिक सामंजस्य रचता है एवं भकूट के प्रभावों को शमित करता है।",
    charity: "सोमवार एवं प्रत्येक पूर्णिमा को किसी ब्राह्मण या मंदिर को श्वेत वस्त्र, चाँदी की वस्तुएँ, या श्वेत तिल दान करें। पूर्णिमा के दिन श्वेत गौओं को खिलाना एवं मंदिरों में श्वेत मिष्ठान्न अर्पित करना अत्यंत शुभ है।",
  },
  "Mangal Dosha": {
    mantras: [
      { text: "ॐ क्रां क्रीं क्रौं सः भौमाय नमः", instruction: "मंगल बीज मंत्र — मंगलवार को 108 बार जप करें, यथासंभव उगते सूर्य की ओर मुख करके" },
      { text: "ॐ हं हनुमते रुद्रात्मकाय हुं फट्", instruction: "हनुमान मंत्र — प्रतिदिन हनुमान चालीसा एवं मंगलवार को यह मंत्र 108 बार जप करें" },
    ],
    puja: "किसी विद्वान पुरोहित द्वारा कुज (मंगल) दोष निवारण पूजा / मंगल शांति सम्पन्न कराई जानी चाहिए — आदर्शतः हनुमान या सुब्रह्मण्य मंदिर में, अथवा मंगलनाथ (उज्जैन) में। इसमें लाल आहुतियों (लाल मसूर, लाल पुष्प, गुड़) सहित मंगल-विशेष हवन एवं मंगल स्तोत्र का पाठ सम्मिलित है। जहाँ केवल एक साथी मांगलिक हो, वहाँ विवाह से पूर्व कुंभ विवाह या प्रतीकात्मक उपचार-विधि की सलाह दी जा सकती है।",
    cancellation: [
      "यदि दोनों साथी मांगलिक हों, तो दोष परस्पर निरस्त हो जाता है",
      "यदि मंगल स्वराशि (मेष/वृश्चिक) या उच्च राशि (मकर) में हो",
      "यदि मंगल पर बृहस्पति या किसी बलवान शुभ ग्रह की दृष्टि/युति हो",
      "यदि मांगलिक भाव उस लग्न हेतु शुभ ग्रहों के स्वामित्व वाली राशि में पड़े",
      "आयु बढ़ने के साथ (28 वर्ष के पश्चात मंगल दोष की तीव्रता कम मानी जाती है)",
      "जब विवाह से पूर्व कुज दोष शांति पूजा विधिवत सम्पन्न की जाए",
    ],
    gemstone: "लाल मूंगा — 6 से 9 रत्ती, सोने या ताँबे में जड़ा, मंगलवार को दाहिने हाथ की अनामिका में धारण करें। सूर्योदय के समय कच्चे दूध एवं गंगाजल में अभिमंत्रित कर, मंगल मंत्र का 108 बार जप करके धारण करें। धारण से पूर्व ज्योतिषी से परामर्श करें।",
    fasting: "मंगलवार व्रत — मंगलवार को व्रत रखें, हनुमान जी को लाल पुष्प एवं सिंदूर अर्पित करें, तथा लाल मसूर एवं गुड़ का दान करें। विवाह से पूर्व निरंतर कई मंगलवार तक इसका पालन करें।",
    charity: "मंगलवार को लाल पदार्थ — लाल वस्त्र, लाल मसूर, ताँबा, गुड़ — मंदिर या ज़रूरतमंदों को दान करें। बंदरों को भोजन कराना एवं हनुमान मंदिर में सेवा मंगल की शांति हेतु परंपरागत रूप से विहित है।",
  },
};

// ─── Dosha description + classical reference (rendered on Dosha page) ─────────
const DOSHA_TEXT_HI: Record<string, { description: string; classical_reference: string }> = {
  "Nadi Dosha": {
    description: "दोनों व्यक्तियों की नाड़ी (ऊर्जात्मक जीवन-धारा) समान है। परंपरागत रूप से सर्वाधिक गंभीर दोष माना जाने वाला, यह स्वास्थ्य-अनुकूलता एवं संतान-कल्याण हेतु जोखिम दर्शाता है। शास्त्रीय ग्रंथ विवाह से पूर्व विशिष्ट पूजा एवं मंत्रों का विधान करते हैं।",
    classical_reference: "बृहत् पराशर होरा शास्त्र में नाड़ी दोष को समस्त अष्टकूट दोषों में सर्वाधिक गंभीर बताया गया है। जब नाड़ी में 0 अंक प्राप्त हों (दोनों साथियों की समान नाड़ी), तो यह अन्य समस्त कूट अंकों पर भारी पड़ता है एवं अनिवार्य उपचारात्मक ध्यान की माँग करता है।",
  },
  "Bhakut Dosha": {
    description: "चंद्र-राशियों की सापेक्ष स्थिति 2/12, 5/9 या 6/8 के योग में है। भकूट दोष वित्तीय अस्थिरता, भावनात्मक दूरी, या परिवार-नियोजन में चुनौतियों से जुड़ा है। तथापि, यह अनेक शास्त्रीय शर्तों के अंतर्गत निवारणीय है।",
    classical_reference: "भकूट दोष तब उत्पन्न होता है जब दो चंद्र-राशियाँ विशिष्ट प्रतिकूल कोणीय संबंध (2रा-12वाँ, 5वाँ-9वाँ, या 6ठा-8वाँ) रचती हैं। मुहूर्त चिंतामणि एवं विवाह पटल इसकी निवारण-शर्तों का विस्तार से वर्णन करते हैं।",
  },
  "Mangal Dosha": {
    description: "किसी साथी की कुंडली में मंगल लग्न से 1, 2, 4, 7, 8 या 12वें भाव में स्थित है, जिससे मंगल (कुज) दोष बनता है। यह वैवाहिक सामंजस्य में तनाव, विवाह में विलंब या मतभेद से जुड़ा है। जब दोनों साथी मांगलिक हों तो यह परस्पर निरस्त हो जाता है, अन्यथा विवाह से पूर्व उपचार की सलाह दी जाती है।",
    classical_reference: "मंगल दोष का आकलन लग्न (एवं कठोर विश्लेषण में चंद्र तथा शुक्र) से मंगल की स्थिति द्वारा किया जाता है। बृहत् पराशर होरा शास्त्र एवं मुहूर्त ग्रंथ दोनों साथियों के मांगलिक होने पर परस्पर निरसन, तथा मंगल के स्वराशि/उच्च होने पर शमन का उल्लेख करते हैं।",
  },
};

export function doshaText(
  doshaName: string,
  lang: Lang,
  fallback: { description: string; classical_reference: string; description_hi?: string },
) {
  if (lang === "hi") {
    const staticHi = DOSHA_TEXT_HI[doshaName];
    // Prefer a dynamically-built Hindi description (e.g. Mangal Dosha, which names
    // the actual afflicted partner and house) over the generic static translation.
    if (fallback.description_hi) {
      return {
        description: fallback.description_hi,
        classical_reference: staticHi?.classical_reference || fallback.classical_reference,
      };
    }
    if (staticHi) return staticHi;
  }
  return fallback;
}
export const severityWord = (sev: string, lang: Lang) =>
  lang === "hi" ? ({ High: "उच्च", Medium: "मध्यम", Low: "निम्न" } as Record<string, string>)[sev] || sev : sev;

export const getNX = (name: string, lang: Lang, fallback: NXEntry): NXEntry =>
  lang === "hi" ? (NX_HI[name] || fallback) : fallback;
export const getGM = (koota: string, lang: Lang, fallback: GMEntry): GMEntry =>
  lang === "hi" ? (GM_HI[koota] || fallback) : fallback;
export const getDR = (doshaName: string, lang: Lang, fallback: DREntry | undefined): DREntry | undefined => {
  if (lang === "hi" && DR_HI[doshaName]) {
    // Merge: keep any English-only structure but prefer Hindi
    return DR_HI[doshaName];
  }
  return fallback;
};

// ─── General remedies (shown on remedies page regardless of doshas) ──────────
export function generalRemedies(lang: Lang) {
  if (lang === "hi") {
    return [
      { section: "दंपति हेतु शुभ मंत्र", items: [
        { title: "ॐ गं गणपतये नमः", sub: "गणेश मंत्र — समस्त विघ्नों के निवारण हेतु विवाह-संस्कार से पूर्व एक साथ 108 बार जप करें" },
        { title: "ॐ श्री महालक्ष्म्यै नमः", sub: "लक्ष्मी मंत्र — वैवाहिक समृद्धि एवं गृह-सामंजस्य हेतु प्रत्येक शुक्रवार 108 बार जप करें" },
      ]},
      { section: "पूजा अनुशंसाएँ", items: [
        { title: "सत्यनारायण कथा", sub: "विवाह के पश्चात प्रथम पूर्णिमा को, एवं प्रत्येक वर्ष विवाह-वर्षगाँठ पर सम्पन्न करें" },
        { title: "नवग्रह पूजा", sub: "समस्त नौ ग्रहों की ऊर्जाओं के सामंजस्य हेतु विवाह से पूर्व विद्वान पुरोहित द्वारा सम्पन्न करें" },
      ]},
      { section: "रत्न मार्गदर्शन", items: [
        { title: "वर: मूँगा या माणिक", sub: "मंगल एवं सूर्य की ऊर्जा को बलवान करता है — स्वर्ण में जड़ा, दाहिने हाथ की अनामिका में धारण करें" },
        { title: "वधू: मोती या श्वेत पुखराज", sub: "चंद्र एवं शुक्र की ऊर्जा को बलवान करता है — चाँदी में जड़ा, दाहिने हाथ की कनिष्ठा में धारण करें" },
      ]},
      { section: "व्रत एवं पवित्र अनुष्ठान", items: [
        { title: "मंगलवार व्रत — वर हेतु", sub: "भगवान हनुमान को लाल पुष्प अर्पित करें एवं मंगलवार को लाल मसूर दान करें" },
        { title: "शुक्रवार व्रत — वधू हेतु", sub: "देवी लक्ष्मी को श्वेत पुष्प अर्पित करें एवं शुक्रवार को श्वेत मिष्ठान्न दान करें" },
      ]},
    ];
  }
  return [
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
}

// ─── Dosha-free certificate paragraphs ───────────────────────────────────────
export function doshaFreeParagraphs(bName: string, gName: string, lang: Lang): [string, string] {
  if (lang === "hi") {
    return [
      `यह एक दुर्लभ एवं शुभ निष्कर्ष है। ${bName} एवं ${gName} के अनुकूलता-विश्लेषण में अष्टकूट प्रणाली के दो सर्वाधिक महत्वपूर्ण दोष — नाड़ी दोष एवं भकूट दोष — दोनों में से कोई भी उपस्थित नहीं है।`,
      "शास्त्रीय ज्योतिष ग्रंथ एक दोष-रहित संयोग को पूर्व जन्मों के प्रबल कर्म-पुण्य का संकेत मानते हैं। यह दंपति अपने पूर्वजों के आशीर्वाद एवं तारों के संरेखण को अपने नए जीवन में एक साथ धारण करता है।",
    ];
  }
  return [
    `This is a rare and auspicious finding. Neither Nadi Dosha nor Bhakut Dosha — the two most significant doshas in the Ashta Koota system — are present in the compatibility analysis for ${bName} and ${gName}.`,
    "Classical Jyotisha texts regard a dosha-free union as a sign of strong karmic merit (punya) from past lives. This couple carries the blessings of their ancestors and the alignment of the stars into their new life together.",
  ];
}

export function doshaImportantNote(lang: Lang): string {
  if (lang === "hi")
    return "दोष अभिशाप नहीं हैं — वे कर्म-संकेतक हैं जो सचेत ध्यान एवं आध्यात्मिक प्रयास की अपेक्षा रखने वाले क्षेत्रों की ओर संकेत करते हैं। असंख्य सुखी विवाहों में एक या अधिक दोष विद्यमान थे जिन्हें उचित उपायों, सच्ची आध्यात्मिक साधना एवं पारस्परिक प्रेम द्वारा संबोधित किया गया। पूर्ण मार्गदर्शन हेतु उपाय अनुभाग देखें।";
  return "Doshas are not condemnations — they are karmic signposts that point to areas requiring conscious attention and spiritual effort. Countless blessed marriages carry one or more doshas that were addressed through proper remedies, sincere spiritual practice, and mutual love. See the Remedies section for complete guidance.";
}

// ─── Life area analysis (6 pillars) ──────────────────────────────────────────
type NK = { name: string; rashi_english: string; rashi: string; gana: string; nadi: string; yoni: string; lord: string };

export function lifeAreas(boyN: NK, girlN: NK, kootas: any[], total: number, lang: Lang) {
  const get = (name: string) => kootas.find((k) => k.koota === name);
  const gana = get("Gana"), yoni = get("Yoni"), nadi = get("Nadi"), bhakut = get("Bhakut"), maitri = get("Maitri"), tara = get("Tara");
  const bGana = T.gana(boyN.gana, lang), gGana = T.gana(girlN.gana, lang);
  const bRashi = T.rashiEn(boyN.rashi_english, lang), gRashi = T.rashiEn(girlN.rashi_english, lang);
  const bLord = T.planet(boyN.lord, lang), gLord = T.planet(girlN.lord, lang);
  const bYoni = T.yoni(boyN.yoni, lang), gYoni = T.yoni(girlN.yoni, lang);
  const bNadi = T.nadi(boyN.nadi, lang), gNadi = T.nadi(girlN.nadi, lang);

  const ratings = lang === "hi"
    ? { excellent: "उत्तम", good: "अच्छा", needsWork: "प्रयास आवश्यक", needsAttention: "ध्यान आवश्यक", needsGuidance: "मार्गदर्शन आवश्यक", needsPractice: "साधना आवश्यक" }
    : { excellent: "Excellent", good: "Good", needsWork: "Needs Work", needsAttention: "Needs Attention", needsGuidance: "Needs Guidance", needsPractice: "Needs Practice" };

  const ganaDesc = (g: string) => {
    if (lang === "hi") return g === "देव" ? "अनुग्रह, हल्कापन एवं आदर्शवाद" : g === "मनुष्य" ? "व्यावहारिकता, भावनात्मक गहराई एवं संतुलन" : "तीव्रता, आवेग एवं रूपांतरकारी शक्ति";
    return g === "Deva" ? "grace, lightness, and idealism" : g === "Manushya" ? "practicality, emotional depth, and balance" : "intensity, passion, and transformative power";
  };
  const ganaDesc2 = (g: string) => {
    if (lang === "hi") return g === "देव" ? "अनुग्रह, हल्कापन एवं आध्यात्मिक आकांक्षा" : g === "मनुष्य" ? "आधारभूत ऊष्मा एवं मानवीय प्रज्ञा" : "प्रचंड भक्ति एवं रूपांतरकारी शक्ति";
    return g === "Deva" ? "grace, lightness, and spiritual aspiration" : g === "Manushya" ? "grounded warmth and human wisdom" : "fierce devotion and transformative strength";
  };

  const T_ = (en: string, hi: string) => (lang === "hi" ? hi : en);

  return [
    {
      title: T_("Marriage & Daily Partnership", "विवाह एवं दैनिक साझेदारी"),
      rating: gana?.passed ? ratings.excellent : total >= 21 ? ratings.good : ratings.needsWork,
      good: !!gana?.passed || total >= 21,
      insight: gana?.passed
        ? T_(`Their ${bGana} and ${gGana} Gana alignment ensures natural temperamental harmony in day-to-day married life. Partners will intuitively understand each other's rhythms, moods, and needs without constant explanation.`,
             `उनका ${bGana} एवं ${gGana} गण संरेखण दैनिक वैवाहिक जीवन में स्वाभाविक स्वभावगत सामंजस्य सुनिश्चित करता है। साथी बिना निरंतर स्पष्टीकरण के एक-दूसरे की लय, मनोदशा एवं आवश्यकताओं को अंतर्ज्ञान से समझ लेंगे।`)
        : T_(`Their Ganas (${bGana} and ${gGana}) differ, creating an opportunity for profound growth. With conscious honoring of each other's fundamental nature, their differences become powerful complementary strengths in the home.`,
             `उनके गण (${bGana} एवं ${gGana}) भिन्न हैं, जो गहन विकास का अवसर रचते हैं। एक-दूसरे के मूल स्वभाव के सचेत सम्मान के साथ, उनकी भिन्नताएँ गृह में सशक्त पूरक शक्तियाँ बन जाती हैं।`),
    },
    {
      title: T_("Physical & Intimate Harmony", "शारीरिक एवं आत्मीय सामंजस्य"),
      rating: (yoni?.score || 0) >= 3 ? ratings.excellent : (yoni?.score || 0) >= 2 ? ratings.good : ratings.needsAttention,
      good: (yoni?.score || 0) >= 3,
      insight: yoni?.passed
        ? T_(`Their Yoni compatibility (${bYoni}/${gYoni}) promises natural physical harmony. The couple will find intimacy flowing naturally, with a strong biological and energetic resonance that deepens over years of shared life.`,
             `उनकी योनि अनुकूलता (${bYoni}/${gYoni}) स्वाभाविक शारीरिक सामंजस्य का वचन देती है। दंपति आत्मीयता को स्वाभाविक रूप से प्रवाहित पाएगा, एक सशक्त जैविक एवं ऊर्जात्मक अनुनाद के साथ जो साझा जीवन के वर्षों में गहरा होता है।`)
        : T_(`Their Yoni types (${bYoni}/${gYoni}) are different, suggesting that their physical connection may need conscious nurturing. Patience, open-hearted communication, and genuine care will build a deeply fulfilling bond.`,
             `उनकी योनि (${bYoni}/${gYoni}) भिन्न हैं, जो संकेत देता है कि उनके शारीरिक संबंध को सचेत पोषण की आवश्यकता हो सकती है। धैर्य, सहृदय संवाद एवं सच्ची देखभाल एक गहन संतोषप्रद बंधन रचेगी।`),
    },
    {
      title: T_("Financial Harmony & Prosperity", "वित्तीय सामंजस्य एवं समृद्धि"),
      rating: bhakut?.score === 7 ? ratings.excellent : ratings.needsAttention,
      good: !!bhakut?.passed,
      insight: bhakut?.passed
        ? T_(`Bhakut alignment between their Moon signs (${bRashi} and ${gRashi}) bodes excellently for shared prosperity. They will naturally motivate each other's ambitions and support each other's financial growth without resentment.`,
             `उनकी चंद्र-राशियों (${bRashi} एवं ${gRashi}) के बीच भकूट संरेखण साझा समृद्धि के लिए उत्तम संकेत है। वे स्वाभाविक रूप से एक-दूसरे की महत्वाकांक्षाओं को प्रेरित करेंगे एवं बिना विद्वेष के एक-दूसरे की वित्तीय उन्नति का समर्थन करेंगे।`)
        : T_(`The Bhakut configuration between ${bRashi} and ${gRashi} requires attention in financial matters. Joint spiritual practices, transparent financial communication, and aligned goals will help build lasting abundance together.`,
             `${bRashi} एवं ${gRashi} के बीच भकूट योग वित्तीय मामलों में ध्यान की अपेक्षा रखता है। संयुक्त आध्यात्मिक साधना, पारदर्शी वित्तीय संवाद एवं संरेखित लक्ष्य एक साथ स्थायी समृद्धि रचने में सहायक होंगे।`),
    },
    {
      title: T_("Intellectual & Psychological Bond", "बौद्धिक एवं मनोवैज्ञानिक बंधन"),
      rating: (maitri?.score || 0) >= 4 ? ratings.excellent : (maitri?.score || 0) >= 3 ? ratings.good : ratings.needsWork,
      good: !!maitri?.passed,
      insight: maitri?.passed
        ? T_(`The friendship between their ruling planets (${bLord} and ${gLord}) creates an exceptional mental bond. They will find intellectual conversation effortless, and their psychological attunement will make this partnership deeply comforting.`,
             `उनके स्वामी ग्रहों (${bLord} एवं ${gLord}) के बीच मैत्री एक असाधारण मानसिक बंधन रचती है। उन्हें बौद्धिक संवाद सहज लगेगा, एवं उनका मनोवैज्ञानिक तालमेल इस साझेदारी को गहन आश्वस्तिदायक बनाएगा।`)
        : T_(`Different planetary lords (${bLord} and ${gLord}) mean they approach the world differently. Celebrating — rather than resenting — these different ways of thinking will enrich their intellectual partnership immensely.`,
             `भिन्न स्वामी ग्रह (${bLord} एवं ${gLord}) दर्शाते हैं कि वे संसार को भिन्न ढंग से देखते हैं। इन भिन्न विचार-शैलियों का विद्वेष के बजाय उत्सव उनकी बौद्धिक साझेदारी को अत्यधिक समृद्ध करेगा।`),
    },
    {
      title: T_("Health, Genetics & Progeny", "स्वास्थ्य, आनुवंशिकी एवं संतान"),
      rating: nadi?.score === 8 ? ratings.excellent : ratings.needsGuidance,
      good: !!nadi?.passed,
      insight: nadi?.passed
        ? T_(`Complementary Nadis (${bNadi} and ${gNadi}) indicate excellent genetic compatibility. This bodes beautifully for the health of their children and the overall vitality and longevity of the couple together.`,
             `पूरक नाड़ियाँ (${bNadi} एवं ${gNadi}) उत्तम आनुवंशिक अनुकूलता दर्शाती हैं। यह उनकी संतान के स्वास्थ्य एवं दंपति की समग्र जीवन-शक्ति तथा दीर्घायु के लिए सुंदर संकेत है।`)
        : T_(`Both sharing the same Nadi (${bNadi}) creates a Nadi Dosha that requires specific remedial measures to support good health for their progeny. Please follow the Dosha Remedies section carefully.`,
             `दोनों की समान नाड़ी (${bNadi}) एक नाड़ी दोष रचती है जिसे संतान के उत्तम स्वास्थ्य हेतु विशिष्ट उपायों की आवश्यकता है। कृपया दोष उपाय अनुभाग का सावधानी से पालन करें।`),
    },
    {
      title: T_("Destiny, Fortune & Spiritual Path", "भाग्य, सौभाग्य एवं आध्यात्मिक पथ"),
      rating: (tara?.score || 0) >= 2 ? ratings.excellent : total >= 21 ? ratings.good : ratings.needsPractice,
      good: (tara?.score || 0) >= 2,
      insight: boyN.gana === girlN.gana
        ? T_(`The unified ${bGana} Gana energy of both partners creates a harmoniously aligned spiritual vibration. They will naturally support each other's devotional practices, dharmic path, and growth toward higher consciousness.`,
             `दोनों साथियों की एकीकृत ${bGana} गण ऊर्जा एक सामंजस्यपूर्ण संरेखित आध्यात्मिक स्पंदन रचती है। वे स्वाभाविक रूप से एक-दूसरे की भक्ति-साधना, धार्मिक पथ एवं उच्च चेतना की ओर विकास का समर्थन करेंगे।`)
        : T_(`Their different Gana energies (${bGana} and ${gGana}) offer complementary spiritual perspectives. Their different spiritual inclinations, when mutually honored, create a beautifully balanced devotional household — each enriching the other's path.`,
             `उनकी भिन्न गण ऊर्जाएँ (${bGana} एवं ${gGana}) पूरक आध्यात्मिक दृष्टिकोण प्रदान करती हैं। उनकी भिन्न आध्यात्मिक प्रवृत्तियाँ, जब परस्पर सम्मानित हों, एक सुंदर संतुलित भक्तिमय गृह रचती हैं — प्रत्येक दूसरे के पथ को समृद्ध करता है।`),
    },
  ];
}

// ─── Energetic interaction paragraph (Nakshatra page) ────────────────────────
export function interactionParagraph(boyN: NK, girlN: NK, lang: Lang): string {
  const sameGana = boyN.gana === girlN.gana;
  const bName = T.nakshatra(boyN.name, lang), gName = T.nakshatra(girlN.name, lang);
  const bGana = T.gana(boyN.gana, lang), gGana = T.gana(girlN.gana, lang);
  if (lang === "hi") {
    const desc = (g: string) => g === "देव" ? "अनुग्रह, हल्कापन एवं आदर्शवाद" : g === "मनुष्य" ? "व्यावहारिकता, भावनात्मक गहराई एवं संतुलन" : "तीव्रता, आवेग एवं रूपांतरकारी शक्ति";
    const desc2 = (g: string) => g === "देव" ? "अनुग्रह, हल्कापन एवं आध्यात्मिक आकांक्षा" : g === "मनुष्य" ? "आधारभूत ऊष्मा एवं मानवीय प्रज्ञा" : "प्रचंड भक्ति एवं रूपांतरकारी शक्ति";
    return sameGana
      ? `${bName} एवं ${gName} दोनों ${bGana} गण — समान मौलिक स्वभाव-परिवार — से संबंधित हैं। यह साथियों के बीच एक तात्क्षणिक पहचान एवं अनुनाद रचता है: वे जीवन की चुनौतियों एवं हर्षों को समान अंतर्निहित भावना के साथ देखते हैं। उनका गृह स्वाभाविक रूप से सामंजस्यपूर्ण अनुभव होगा, उनका संवाद अंतर्ज्ञान से समझा जाएगा, एवं उनकी दैनिक लय न्यूनतम टकराव के साथ संरेखित होगी।`
      : `${bName} (${bGana} गण) एवं ${gName} (${gGana} गण) भिन्न स्वभाव-परिवारों से आते हैं — जो एक गतिशील, बहुआयामी साझेदारी रचता है। ${bGana} ऊर्जा ${desc(bGana)} प्रदान करती है, जबकि ${gGana} ऊर्जा ${desc2(gGana)} लाती है। साथ मिलकर, वे एक सुंदर पूरक समग्रता रच सकते हैं।`;
  }
  const desc = (g: string) => g === "Deva" ? "grace, lightness, and idealism" : g === "Manushya" ? "practicality, emotional depth, and balance" : "intensity, passion, and transformative power";
  const desc2 = (g: string) => g === "Deva" ? "grace, lightness, and spiritual aspiration" : g === "Manushya" ? "grounded warmth and human wisdom" : "fierce devotion and transformative strength";
  return sameGana
    ? `Both ${bName} and ${gName} belong to the ${bGana} Gana — the same fundamental temperament family. This creates an immediate recognition and resonance between partners: they approach life's challenges and joys with the same underlying spirit. Their home will feel naturally harmonious, their communication will be intuitively understood, and their daily rhythms will align with minimum friction.`
    : `${bName} (${bGana} Gana) and ${gName} (${gGana} Gana) come from different temperament families — creating a dynamic, textured partnership. The ${bGana} energy offers ${desc(bGana)}, while the ${gGana} energy brings ${desc2(gGana)}. Together, they can create a beautifully complementary whole.`;
}

// ─── Conclusion summary paragraph ────────────────────────────────────────────
export function conclusionSummary(score: number, pct: number, bName: string, gName: string, boyN: NK, girlN: NK, lang: Lang): string {
  const bNak = T.nakshatra(boyN.name, lang), gNak = T.nakshatra(girlN.name, lang);
  if (lang === "hi") {
    if (pct >= 75)
      return `तारे इस मिलन पर मुस्कुराते हैं। 36 में से ${score} गुणों के दुर्लभ अंक के साथ, ${bName} एवं ${gName} उन सर्वाधिक दिव्य रूप से संरेखित दंपतियों में हैं जिन्हें वैदिक ज्योतिष पहचान सकता है। उनके नक्षत्र — ${bNak} एवं ${gNak} — पूरक आकाशीय ऊर्जाएँ धारण करते हैं जो एक होकर वह रचती हैं जो कोई भी अकेले नहीं रच सकता। हम एक दीर्घ, आनंदमय एवं आध्यात्मिक रूप से समृद्ध सहजीवन हेतु अपने गहनतम आशीर्वाद अर्पित करते हैं।`;
    if (pct >= 55)
      return `36 में से ${score} गुणों के अंक के साथ, ${bName} एवं ${gName} एक सार्थक एवं व्यवहार्य अनुकूलता साझा करते हैं। गुण स्वाभाविक सामंजस्य के क्षेत्रों एवं उन विशिष्ट स्थानों दोनों को प्रकट करते हैं जहाँ सचेत प्रयास एवं प्रेम की आवश्यकता होगी। समस्त महान विवाह केवल तारों पर नहीं, अपितु प्रतिदिन प्रेम, सम्मान एवं साथ बढ़ने के चयन पर निर्मित होते हैं। अनुशंसित उपायों एवं एक-दूसरे के प्रति सच्ची प्रतिबद्धता के साथ, यह मिलन वास्तविक आशा धारण करता है।`;
    return `36 में से ${score} गुणों का अंक ईमानदारी, साहस एवं उपचारात्मक पथ के प्रति गहन प्रतिबद्धता की माँग करता है। अष्टकूट प्रणाली की रचना करने वाले ऋषि बुद्धिमान थे: उन्होंने निम्न अंक वाले विवाहों को निषिद्ध नहीं किया, अपितु उन्हें सहारा देने हेतु उपचारात्मक साधन प्रदान किए। ${bName} एवं ${gName} को सलाह दी जाती है कि समस्त अनुशंसित पूजाएँ सम्पन्न करें, निर्धारित उपायों का निष्ठापूर्वक पालन करें, एवं अपने मिलन को खुली आँखों तथा खुले हृदय से अपनाएँ। आध्यात्मिक साधना से पोषित प्रेम तारों को भी लाँघ सकता है।`;
  }
  if (pct >= 75)
    return `The stars smile upon this union. With a rare score of ${score} out of 36 Gunas, ${bName} and ${gName} stand among the most divinely aligned couples that Vedic astrology can recognize. Their nakshatras — ${bNak} and ${gNak} — carry complementary celestial energies that when united, create something greater than either could build alone. We offer our deepest blessings for a long, joyful, and spiritually rich life together.`;
  if (pct >= 55)
    return `With a score of ${score} out of 36 Gunas, ${bName} and ${gName} share a meaningful and workable compatibility. The gunas reveal both areas of natural harmony and specific places where conscious effort and love will be required. All great marriages are built not only on stars, but on the daily choice to love, honor, and grow together. With the recommended remedies and a sincere commitment to each other, this union holds genuine promise.`;
  return `A score of ${score} out of 36 Gunas calls for honesty, courage, and a deep commitment to the remedial path. The Rishis who composed the Ashta Koota system were wise: they did not forbid marriages with lower scores, they provided the remedial tools to support them. ${bName} and ${gName} are advised to complete all recommended pujas, observe the prescribed remedies faithfully, and approach their union with open eyes and open hearts. Love, sustained by spiritual practice, can transcend the stars.`;
}

// Localized date (Devanagari-friendly month names in HI)
export function formattedDate(lang: Lang): string {
  const d = new Date();
  if (lang === "hi") {
    const months = ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितम्बर","अक्टूबर","नवम्बर","दिसम्बर"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
