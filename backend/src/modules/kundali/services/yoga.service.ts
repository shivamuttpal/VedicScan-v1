import { IYoga } from '../model/kundali.model';

interface PlanetInfo {
  rashi: string;
  houseNumber: number;
  nakshatra?: string;
  degree?: number;
  absoluteDegree?: number;
}

// Which planet rules each sign
const SIGN_LORDS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

const EXALTATION: Record<string, string> = {
  Sun: 'Aries', Moon: 'Taurus', Mars: 'Capricorn', Mercury: 'Virgo',
  Jupiter: 'Cancer', Venus: 'Pisces', Saturn: 'Libra',
};

const OWN_SIGNS: Record<string, string[]> = {
  Sun: ['Leo'], Moon: ['Cancer'], Mars: ['Aries', 'Scorpio'],
  Mercury: ['Gemini', 'Virgo'], Jupiter: ['Sagittarius', 'Pisces'],
  Venus: ['Taurus', 'Libra'], Saturn: ['Capricorn', 'Aquarius'],
};

const KENDRA_HOUSES = [1, 4, 7, 10];
const TRIKONA_HOUSES = [1, 5, 9];
const DUSTHANA_HOUSES = [6, 8, 12];

function isKendra(house: number) { return KENDRA_HOUSES.includes(house); }
function isTrikona(house: number) { return TRIKONA_HOUSES.includes(house); }
function isDusthana(house: number) { return DUSTHANA_HOUSES.includes(house); }
function isKendraOrTrikona(house: number) { return isKendra(house) || isTrikona(house); }

function houseDiff(fromHouse: number, toHouse: number): number {
  return ((toHouse - fromHouse) % 12 + 12) % 12;
}

function inKendraFrom(refHouse: number, targetHouse: number): boolean {
  const diff = houseDiff(refHouse, targetHouse);
  return [0, 3, 6, 9].includes(diff);
}

function isExalted(planet: string, rashi: string): boolean {
  return EXALTATION[planet] === rashi;
}

function isInOwnSign(planet: string, rashi: string): boolean {
  return (OWN_SIGNS[planet] || []).includes(rashi);
}

function getHouseSign(houseNum: number, houses: Array<{ number: number; sign: string }>): string {
  return houses.find(h => h.number === houseNum)?.sign || 'Aries';
}

type Lang = 'en' | 'hi';
const PLANET_HI: Record<string, string> = {
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध',
  Jupiter: 'बृहस्पति', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

/**
 * Detect yogas. Pass lang='hi' to receive Devanagari name/description so the Hindi
 * PDF can render them directly (mirrors the interpretations/interpretationsHi pattern).
 */
export function detectYogas(
  planets: Record<string, PlanetInfo>,
  lagnaSign: string,
  houses: Array<{ number: number; sign: string; planets: string[] }>,
  lang: Lang = 'en'
): IYoga[] {
  const results: IYoga[] = [];
  const hi = lang === 'hi';
  const pick = (en: string, hin: string) => (hi ? hin : en);
  const ph = (p: string) => (hi ? (PLANET_HI[p] || p) : p);

  const moon = planets['Moon'];
  const sun = planets['Sun'];
  const jupiter = planets['Jupiter'];
  const mercury = planets['Mercury'];
  const venus = planets['Venus'];
  const mars = planets['Mars'];
  const saturn = planets['Saturn'];
  const rahu = planets['Rahu'];

  // ── Gajakesari Yoga ──
  // Jupiter in kendra from Moon
  if (moon && jupiter) {
    const isGajakesari = inKendraFrom(moon.houseNumber, jupiter.houseNumber);
    const jupStrong = isExalted(jupiter.rashi, '') || isInOwnSign('Jupiter', jupiter.rashi);
    results.push({
      name: pick('Gajakesari Yoga', 'गजकेसरी योग'),
      strength: isGajakesari ? (jupStrong ? 'Strong' : 'Moderate') : 'Weak',
      isPresent: isGajakesari,
      description: isGajakesari
        ? pick('Jupiter is in a Kendra (angular) house from Moon, bestowing intelligence, fame, wealth, and noble character. This powerful yoga enhances wisdom and social standing.',
               'बृहस्पति चंद्र से केंद्र भाव में स्थित है, जो बुद्धि, यश, धन एवं उदात्त चरित्र प्रदान करता है। यह प्रबल योग ज्ञान एवं सामाजिक प्रतिष्ठा को बढ़ाता है।')
        : pick('Jupiter is not in a Kendra from Moon. This yoga is absent in your chart.',
               'बृहस्पति चंद्र से केंद्र में नहीं है। यह योग आपकी कुंडली में अनुपस्थित है।'),
    });
  }

  // ── Budhaditya Yoga ──
  // Mercury and Sun in same house
  if (sun && mercury) {
    const isBudhaditya = sun.houseNumber === mercury.houseNumber;
    const strength = isBudhaditya && isKendraOrTrikona(sun.houseNumber) ? 'Strong' : 'Moderate';
    results.push({
      name: pick('Budhaditya Yoga', 'बुधादित्य योग'),
      strength: isBudhaditya ? strength : 'Weak',
      isPresent: isBudhaditya,
      description: isBudhaditya
        ? pick('The Sun and Mercury are conjunct, creating sharp intellect, communication skills, and analytical ability. This yoga favors careers in writing, law, and administration.',
               'सूर्य एवं बुध की युति है, जो तीक्ष्ण बुद्धि, संवाद-कौशल एवं विश्लेषणात्मक क्षमता उत्पन्न करती है। यह योग लेखन, विधि एवं प्रशासन के करियर के लिए अनुकूल है।')
        : pick('Sun and Mercury are not conjunct. Budhaditya Yoga is not formed in your chart.',
               'सूर्य एवं बुध की युति नहीं है। आपकी कुंडली में बुधादित्य योग नहीं बनता।'),
    });
  }

  // ── Chandra Mangal Yoga ──
  // Moon and Mars conjunct (same house) or in 1-7 opposition
  if (moon && mars) {
    const conjunct = moon.houseNumber === mars.houseNumber;
    const opposition = Math.abs(moon.houseNumber - mars.houseNumber) === 6;
    const isPresent = conjunct || opposition;
    results.push({
      name: pick('Chandra Mangal Yoga', 'चंद्र-मंगल योग'),
      strength: isPresent ? (conjunct ? 'Strong' : 'Moderate') : 'Weak',
      isPresent,
      description: isPresent
        ? pick('Moon and Mars are in a powerful relationship, generating strong ambition, energy, and wealth-earning capacity. Native is hardworking and determined.',
               'चंद्र एवं मंगल प्रबल संबंध में हैं, जो प्रबल महत्वाकांक्षा, ऊर्जा एवं धनार्जन क्षमता उत्पन्न करते हैं। जातक परिश्रमी एवं दृढ़-संकल्प होता है।')
        : pick('Moon and Mars do not form a strong relationship. This yoga is absent.',
               'चंद्र एवं मंगल प्रबल संबंध नहीं बनाते। यह योग अनुपस्थित है।'),
    });
  }

  // ── Vipreet Raj Yoga ──
  // Lords of 6th, 8th, or 12th in 6th, 8th, or 12th
  const house6Sign = getHouseSign(6, houses);
  const house8Sign = getHouseSign(8, houses);
  const house12Sign = getHouseSign(12, houses);
  const lord6 = SIGN_LORDS[house6Sign];
  const lord8 = SIGN_LORDS[house8Sign];
  const lord12 = SIGN_LORDS[house12Sign];
  const dusthanaLords = [lord6, lord8, lord12].filter(Boolean);
  const dusthanaLordPositions = dusthanaLords.map(l => planets[l]?.houseNumber).filter(Boolean);
  const allInDusthana = dusthanaLordPositions.every(h => isDusthana(h));
  const someInDusthana = dusthanaLordPositions.some(h => isDusthana(h));
  results.push({
    name: pick('Vipreet Raj Yoga', 'विपरीत राज योग'),
    strength: allInDusthana ? 'Strong' : someInDusthana ? 'Moderate' : 'Weak',
    isPresent: someInDusthana,
    description: someInDusthana
      ? pick('Lords of the 6th, 8th, or 12th house are placed in dusthana houses, turning adversity into success. Native rises dramatically after initial struggles.',
             '6ठे, 8वें या 12वें भाव के स्वामी दुःस्थान भावों में स्थित हैं, जो विपत्ति को सफलता में बदलते हैं। जातक प्रारंभिक संघर्षों के पश्चात नाटकीय रूप से ऊपर उठता है।')
      : pick('Conditions for Vipreet Raj Yoga are not fully met in your chart.',
             'आपकी कुंडली में विपरीत राज योग की शर्तें पूर्ण रूप से पूरी नहीं होतीं।'),
  });

  // ── Neecha Bhanga Raj Yoga ──
  // A debilitated planet gains cancellation via multiple classical rules
  const DEBILITATION: Record<string, string> = {
    Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer', Mercury: 'Pisces',
    Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries',
  };
  let nbryFound = false;
  let nbryPlanet = '';
  for (const [planet, debRashi] of Object.entries(DEBILITATION)) {
    if (!planets[planet]) continue;
    if (planets[planet].rashi !== debRashi) continue;
    const debSignLord = SIGN_LORDS[debRashi];
    const exaltLord = Object.entries(EXALTATION).find(([, r]) => r === debRashi)?.[0];
    const debLordPos = planets[debSignLord]?.houseNumber;
    const exaltLordPos = exaltLord ? planets[exaltLord]?.houseNumber : undefined;
    // Rule 1: debilitation sign lord or exaltation-sign planet in kendra
    const rule1 = (debLordPos && isKendra(debLordPos)) || (exaltLordPos && isKendra(exaltLordPos));
    // Rule 2: exalted planet is conjunct with the debilitated planet (same house)
    const rule2 = exaltLord && planets[exaltLord] &&
      planets[exaltLord].houseNumber === planets[planet].houseNumber &&
      isExalted(exaltLord, planets[exaltLord].rashi);
    if (rule1 || rule2) {
      nbryFound = true;
      nbryPlanet = planet;
      break;
    }
  }
  results.push({
    name: pick('Neecha Bhanga Raj Yoga', 'नीच भंग राज योग'),
    strength: nbryFound ? 'Strong' : 'Weak',
    isPresent: nbryFound,
    description: nbryFound
      ? pick(`${nbryPlanet}'s debilitation is cancelled by an exalted planet's proximity or by the lord of the debilitation sign being in a Kendra, transforming weakness into extraordinary strength. This yoga produces leaders who overcome great obstacles to achieve success.`,
             `${ph(nbryPlanet)} की नीचता किसी उच्च ग्रह की समीपता से या नीच राशि के स्वामी के केंद्र में होने से भंग हो जाती है, जो दुर्बलता को असाधारण शक्ति में बदल देती है। यह योग ऐसे नेता उत्पन्न करता है जो महान बाधाओं को पार कर सफलता प्राप्त करते हैं।`)
      : pick('No debilitated planet with cancellation conditions found in your chart.',
             'आपकी कुंडली में निवारण शर्तों सहित कोई नीच ग्रह नहीं मिला।'),
  });

  // ── Lakshmi Yoga ──
  // 9th lord in own sign / exaltation in kendra or trikona + Venus strong
  const house9Sign = getHouseSign(9, houses);
  const lord9 = SIGN_LORDS[house9Sign];
  if (lord9 && planets[lord9] && venus) {
    const lord9Info = planets[lord9];
    const lord9Strong = isExalted(lord9, lord9Info.rashi) || isInOwnSign(lord9, lord9Info.rashi);
    const lord9InKendraTrikona = isKendraOrTrikona(lord9Info.houseNumber);
    const venusStrong = isKendraOrTrikona(venus.houseNumber) &&
      (isExalted('Venus', venus.rashi) || isInOwnSign('Venus', venus.rashi) || isKendra(venus.houseNumber));
    const isLakshmi = lord9Strong && lord9InKendraTrikona && venusStrong;
    results.push({
      name: pick('Lakshmi Yoga', 'लक्ष्मी योग'),
      strength: isLakshmi ? 'Strong' : 'Weak',
      isPresent: isLakshmi,
      description: isLakshmi
        ? pick('The 9th lord is dignified in a Kendra/Trikona with a strong Venus, creating immense prosperity, good fortune, and divine blessings. Wealth flows naturally to this native.',
               'नवमेश केंद्र/त्रिकोण में बलवान शुक्र के साथ प्रतिष्ठित है, जो अपार समृद्धि, सौभाग्य एवं दिव्य आशीर्वाद उत्पन्न करता है। इस जातक की ओर धन स्वाभाविक रूप से प्रवाहित होता है।')
        : pick('Conditions for Lakshmi Yoga (9th lord dignity + strong Venus in Kendra/Trikona) are not fully met.',
               'लक्ष्मी योग की शर्तें (नवमेश की प्रतिष्ठा + केंद्र/त्रिकोण में बलवान शुक्र) पूर्ण रूप से पूरी नहीं होतीं।'),
    });
  }

  // ── Saraswati Yoga ──
  // Mercury, Venus, Jupiter all in kendra or trikona, Mercury in own/exalt
  if (mercury && venus && jupiter) {
    const mercuryDignified = isInOwnSign('Mercury', mercury.rashi) || isExalted('Mercury', mercury.rashi);
    const allInGoodHouses = [mercury, venus, jupiter].every(p => isKendraOrTrikona(p.houseNumber));
    const isSaraswati = mercuryDignified && allInGoodHouses;
    results.push({
      name: pick('Saraswati Yoga', 'सरस्वती योग'),
      strength: isSaraswati ? 'Strong' : 'Weak',
      isPresent: isSaraswati,
      description: isSaraswati
        ? pick('Mercury, Venus, and Jupiter are all well-placed, granting exceptional intelligence, eloquence, artistry, and scholarly brilliance. Favors education and creative fields.',
               'बुध, शुक्र एवं बृहस्पति तीनों भली प्रकार स्थित हैं, जो असाधारण बुद्धि, वाक्पटुता, कलात्मकता एवं विद्वत्ता प्रदान करते हैं। शिक्षा एवं सृजनात्मक क्षेत्रों के लिए अनुकूल।')
        : pick('Mercury, Venus, and Jupiter are not all in Kendra/Trikona. Saraswati Yoga is not formed.',
               'बुध, शुक्र एवं बृहस्पति सभी केंद्र/त्रिकोण में नहीं हैं। सरस्वती योग नहीं बनता।'),
    });
  }

  // ── Pancha Mahapurusha Yogas ──
  const pancha = [
    { name: 'Ruchaka Yoga', nameHi: 'रुचक योग', planet: 'Mars', desc: 'Mars in own sign or exaltation in a Kendra. Native is brave, energetic, commanding, and attains leadership positions.', descHi: 'मंगल केंद्र में स्वराशि या उच्च राशि में। जातक साहसी, ऊर्जावान, आदेशकारी होता है एवं नेतृत्व पद प्राप्त करता है।' },
    { name: 'Bhadra Yoga', nameHi: 'भद्र योग', planet: 'Mercury', desc: 'Mercury in own sign or exaltation in a Kendra. Native is highly intelligent, business-minded, and articulate.', descHi: 'बुध केंद्र में स्वराशि या उच्च राशि में। जातक अत्यधिक बुद्धिमान, व्यापार-कुशल एवं वाक्पटु होता है।' },
    { name: 'Hamsa Yoga', nameHi: 'हंस योग', planet: 'Jupiter', desc: 'Jupiter in own sign or exaltation in a Kendra. Native is virtuous, wise, spiritually inclined, and blessed with prosperity.', descHi: 'बृहस्पति केंद्र में स्वराशि या उच्च राशि में। जातक सद्गुणी, बुद्धिमान, आध्यात्मिक प्रवृत्ति का एवं समृद्धि से आशीर्वादित होता है।' },
    { name: 'Malavya Yoga', nameHi: 'मालव्य योग', planet: 'Venus', desc: 'Venus in own sign or exaltation in a Kendra. Native has refined taste, artistic talents, luxurious life, and magnetic personality.', descHi: 'शुक्र केंद्र में स्वराशि या उच्च राशि में। जातक की रुचि परिष्कृत, कलात्मक प्रतिभा, विलासी जीवन एवं चुम्बकीय व्यक्तित्व होता है।' },
    { name: 'Shasha Yoga', nameHi: 'शश योग', planet: 'Saturn', desc: 'Saturn in own sign or exaltation in a Kendra. Native attains authority, administrative power, and works for the masses.', descHi: 'शनि केंद्र में स्वराशि या उच्च राशि में। जातक अधिकार, प्रशासनिक शक्ति प्राप्त करता है एवं जनता के लिए कार्य करता है।' },
  ];
  for (const { name, nameHi, planet, desc, descHi } of pancha) {
    const p = planets[planet];
    if (!p) continue;
    const dignified = isInOwnSign(planet, p.rashi) || isExalted(planet, p.rashi);
    const inKendra = isKendra(p.houseNumber);
    const isPresent = dignified && inKendra;
    results.push({
      name: pick(name, nameHi),
      strength: isPresent ? 'Strong' : 'Weak',
      isPresent,
      description: isPresent
        ? pick(desc, descHi)
        : pick(`${planet} is not in its own sign or exaltation in a Kendra. ${name} is not formed.`,
               `${ph(planet)} केंद्र में स्वराशि या उच्च राशि में नहीं है। ${nameHi} नहीं बनता।`),
    });
  }

  // ── Guru-Mangal Yoga ──
  // Jupiter and Mars conjunct in the same house
  if (jupiter && mars) {
    const isGuruMangal = jupiter.houseNumber === mars.houseNumber;
    const jupExalted = isExalted('Jupiter', jupiter.rashi);
    const inGoodHouse = isKendraOrTrikona(jupiter.houseNumber);
    const strength = isGuruMangal
      ? (jupExalted && inGoodHouse ? 'Strong' : inGoodHouse ? 'Moderate' : 'Moderate')
      : 'Weak';
    results.push({
      name: pick('Guru-Mangal Yoga', 'गुरु-मंगल योग'),
      strength,
      isPresent: isGuruMangal,
      description: isGuruMangal
        ? pick(`Jupiter and Mars are conjunct in the ${jupiter.houseNumber}th house, creating Guru-Mangal Yoga. This powerful combination generates high ambition, leadership, and the ability to execute grand plans with wisdom and courage. Favors engineering, medicine, management, military, sports, and entrepreneurship.${jupExalted ? ' With Jupiter exalted, this yoga is especially powerful and auspicious.' : ''}`,
               `बृहस्पति एवं मंगल की युति ${jupiter.houseNumber}वें भाव में है, जिससे गुरु-मंगल योग बनता है। यह प्रबल संयोग उच्च महत्वाकांक्षा, नेतृत्व एवं ज्ञान तथा साहस के साथ विशाल योजनाओं को क्रियान्वित करने की क्षमता उत्पन्न करता है। अभियांत्रिकी, चिकित्सा, प्रबंधन, सेना, खेल एवं उद्यमिता के लिए अनुकूल।${jupExalted ? ' बृहस्पति के उच्च होने से यह योग विशेष रूप से प्रबल एवं शुभ है।' : ''}`)
        : pick('Jupiter and Mars are not conjunct. Guru-Mangal Yoga is absent.',
               'बृहस्पति एवं मंगल की युति नहीं है। गुरु-मंगल योग अनुपस्थित है।'),
    });
  }

  // ── Amala Yoga ──
  // A natural benefic (Moon, Mercury, Jupiter, Venus) in the 10th house from Lagna
  const beneficsIn10th = (['Moon', 'Mercury', 'Jupiter', 'Venus'] as const)
    .filter(b => planets[b]?.houseNumber === 10);
  if (beneficsIn10th.length > 0) {
    const strength = beneficsIn10th.some(b => b === 'Jupiter' || b === 'Venus') ? 'Strong' : 'Moderate';
    results.push({
      name: pick('Amala Yoga', 'अमल योग'),
      strength,
      isPresent: true,
      description: pick(
        `${beneficsIn10th.join(' and ')} in the 10th house (Amala Yoga) grants lasting fame, excellent professional reputation, and career success built on ethical foundations. Actions are remembered positively. Native earns wealth through righteous means.`,
        `दशम भाव में ${beneficsIn10th.map(ph).join(' एवं ')} (अमल योग) स्थायी यश, उत्कृष्ट व्यावसायिक प्रतिष्ठा एवं नैतिक आधार पर निर्मित करियर-सफलता प्रदान करता है। कार्य सकारात्मक रूप से स्मरण किए जाते हैं। जातक धार्मिक साधनों से धन अर्जित करता है।`),
    });
  }

  // ── Dharma Karmadhipati Yoga ──
  // 9th lord and 10th lord in conjunction or exchange (Parivartana)
  const house9SignDK = getHouseSign(9, houses);
  const house10SignDK = getHouseSign(10, houses);
  const lord9DK = SIGN_LORDS[house9SignDK];
  const lord10DK = SIGN_LORDS[house10SignDK];
  if (lord9DK && lord10DK && lord9DK !== lord10DK && planets[lord9DK] && planets[lord10DK]) {
    const l9 = planets[lord9DK];
    const l10 = planets[lord10DK];
    const conjunct = l9.houseNumber === l10.houseNumber;
    const exchange = l9.rashi === house10SignDK && l10.rashi === house9SignDK;
    if (conjunct || exchange) {
      results.push({
        name: pick('Dharma Karmadhipati Yoga', 'धर्म-कर्माधिपति योग'),
        strength: 'Strong',
        isPresent: true,
        description: pick(
          `The 9th lord (${lord9DK}) and 10th lord (${lord10DK}) are ${exchange ? 'in Parivartana (exchange)' : 'conjunct'}, forming Dharma Karmadhipati Yoga — one of the most powerful Raja Yogas. Career is built on dharmic purpose, bringing authority, public recognition, and lasting success aligned with higher principles.`,
          `नवमेश (${ph(lord9DK)}) एवं दशमेश (${ph(lord10DK)}) ${exchange ? 'परिवर्तन (राशि-विनिमय) में' : 'युति में'} हैं, जिससे धर्म-कर्माधिपति योग बनता है — सर्वाधिक प्रबल राज योगों में से एक। करियर धार्मिक उद्देश्य पर निर्मित होता है, जो अधिकार, सार्वजनिक मान्यता एवं उच्च सिद्धांतों के अनुरूप स्थायी सफलता लाता है।`),
      });
    }
  }

  // ── Lagna Lord in Bhagya / Karma Sthana ──
  // Lagna lord in the 9th (fortune) or 10th (career) house — strong life direction
  const lagnaLordName = SIGN_LORDS[lagnaSign];
  if (lagnaLordName && planets[lagnaLordName]) {
    const ll = planets[lagnaLordName];
    if (ll.houseNumber === 9 || ll.houseNumber === 10 || ll.houseNumber === 5) {
      const sthana = ll.houseNumber === 9 ? 'Bhagya (Fortune)' : ll.houseNumber === 10 ? 'Karma (Career)' : 'Putra (Intelligence)';
      const sthanaHi = ll.houseNumber === 9 ? 'भाग्य' : ll.houseNumber === 10 ? 'कर्म' : 'पुत्र';
      results.push({
        name: pick(`Lagna Lord in ${sthana} House`, `${sthanaHi} भाव में लग्नेश`),
        strength: ll.houseNumber === 9 || ll.houseNumber === 10 ? 'Strong' : 'Moderate',
        isPresent: true,
        description: pick(
          `${lagnaLordName} (Lagna lord) in the ${ll.houseNumber}th house (${sthana}) is a highly auspicious placement. Native has strong personal drive toward achievement, good fortune, and a career aligned with their core identity. Life purpose and career tend to merge naturally.`,
          `${ph(lagnaLordName)} (लग्नेश) ${ll.houseNumber}वें भाव (${sthanaHi}) में एक अत्यंत शुभ स्थिति है। जातक में उपलब्धि की प्रबल आंतरिक प्रेरणा, सौभाग्य एवं अपनी मूल पहचान के अनुरूप करियर होता है। जीवन-उद्देश्य एवं करियर स्वाभाविक रूप से एक हो जाते हैं।`),
      });
    }
  }

  // ── Rahu in Upachaya (3, 6, 10, 11) ──
  // Rahu performs well in growth-oriented houses
  if (rahu && [3, 6, 10, 11].includes(rahu.houseNumber)) {
    results.push({
      name: pick('Rahu in Upachaya Yoga', 'उपचय में राहु योग'),
      strength: rahu.houseNumber === 10 || rahu.houseNumber === 11 ? 'Strong' : 'Moderate',
      isPresent: true,
      description: pick(
        `Rahu in the ${rahu.houseNumber}th house (an Upachaya — growth house) channels ambition constructively. Native gains through unconventional methods, foreign connections, technology, or cutting-edge fields. Results improve significantly after age 35.`,
        `${rahu.houseNumber}वें भाव (उपचय — वृद्धि भाव) में राहु महत्वाकांक्षा को रचनात्मक दिशा देता है। जातक अपरंपरागत विधियों, विदेशी संबंधों, तकनीक या अत्याधुनिक क्षेत्रों से लाभ प्राप्त करता है। 35 वर्ष की आयु के पश्चात परिणाम उल्लेखनीय रूप से सुधरते हैं।`),
    });
  }

  // ── Shani-related: Saturn in Upachaya ──
  if (saturn && [3, 6, 11].includes(saturn.houseNumber)) {
    results.push({
      name: pick('Saturn in Upachaya', 'उपचय में शनि'),
      strength: saturn.houseNumber === 11 ? 'Strong' : 'Moderate',
      isPresent: true,
      description: pick(
        `Saturn in the ${saturn.houseNumber}th house (Upachaya) slowly builds strength over time. Obstacles in early life transform into assets. Native achieves sustained material success through disciplined effort, especially in the second half of life.`,
        `${saturn.houseNumber}वें भाव (उपचय) में शनि समय के साथ धीरे-धीरे शक्ति का निर्माण करता है। प्रारंभिक जीवन की बाधाएँ संपत्ति में बदल जाती हैं। जातक अनुशासित प्रयास से, विशेषकर जीवन के उत्तरार्ध में, निरंतर भौतिक सफलता प्राप्त करता है।`),
    });
  }

  return results.filter(y => y.isPresent);
}
