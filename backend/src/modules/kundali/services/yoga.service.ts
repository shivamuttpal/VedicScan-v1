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

export function detectYogas(
  planets: Record<string, PlanetInfo>,
  lagnaSign: string,
  houses: Array<{ number: number; sign: string; planets: string[] }>
): IYoga[] {
  const results: IYoga[] = [];

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
      name: 'Gajakesari Yoga',
      strength: isGajakesari ? (jupStrong ? 'Strong' : 'Moderate') : 'Weak',
      isPresent: isGajakesari,
      description: isGajakesari
        ? 'Jupiter is in a Kendra (angular) house from Moon, bestowing intelligence, fame, wealth, and noble character. This powerful yoga enhances wisdom and social standing.'
        : 'Jupiter is not in a Kendra from Moon. This yoga is absent in your chart.',
    });
  }

  // ── Budhaditya Yoga ──
  // Mercury and Sun in same house
  if (sun && mercury) {
    const isBudhaditya = sun.houseNumber === mercury.houseNumber;
    const strength = isBudhaditya && isKendraOrTrikona(sun.houseNumber) ? 'Strong' : 'Moderate';
    results.push({
      name: 'Budhaditya Yoga',
      strength: isBudhaditya ? strength : 'Weak',
      isPresent: isBudhaditya,
      description: isBudhaditya
        ? 'The Sun and Mercury are conjunct, creating sharp intellect, communication skills, and analytical ability. This yoga favors careers in writing, law, and administration.'
        : 'Sun and Mercury are not conjunct. Budhaditya Yoga is not formed in your chart.',
    });
  }

  // ── Chandra Mangal Yoga ──
  // Moon and Mars conjunct (same house) or in 1-7 opposition
  if (moon && mars) {
    const conjunct = moon.houseNumber === mars.houseNumber;
    const opposition = Math.abs(moon.houseNumber - mars.houseNumber) === 6;
    const isPresent = conjunct || opposition;
    results.push({
      name: 'Chandra Mangal Yoga',
      strength: isPresent ? (conjunct ? 'Strong' : 'Moderate') : 'Weak',
      isPresent,
      description: isPresent
        ? 'Moon and Mars are in a powerful relationship, generating strong ambition, energy, and wealth-earning capacity. Native is hardworking and determined.'
        : 'Moon and Mars do not form a strong relationship. This yoga is absent.',
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
    name: 'Vipreet Raj Yoga',
    strength: allInDusthana ? 'Strong' : someInDusthana ? 'Moderate' : 'Weak',
    isPresent: someInDusthana,
    description: someInDusthana
      ? 'Lords of the 6th, 8th, or 12th house are placed in dusthana houses, turning adversity into success. Native rises dramatically after initial struggles.'
      : 'Conditions for Vipreet Raj Yoga are not fully met in your chart.',
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
    name: 'Neecha Bhanga Raj Yoga',
    strength: nbryFound ? 'Strong' : 'Weak',
    isPresent: nbryFound,
    description: nbryFound
      ? `${nbryPlanet}'s debilitation is cancelled by an exalted planet's proximity or by the lord of the debilitation sign being in a Kendra, transforming weakness into extraordinary strength. This yoga produces leaders who overcome great obstacles to achieve success.`
      : 'No debilitated planet with cancellation conditions found in your chart.',
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
      name: 'Lakshmi Yoga',
      strength: isLakshmi ? 'Strong' : 'Weak',
      isPresent: isLakshmi,
      description: isLakshmi
        ? 'The 9th lord is dignified in a Kendra/Trikona with a strong Venus, creating immense prosperity, good fortune, and divine blessings. Wealth flows naturally to this native.'
        : 'Conditions for Lakshmi Yoga (9th lord dignity + strong Venus in Kendra/Trikona) are not fully met.',
    });
  }

  // ── Saraswati Yoga ──
  // Mercury, Venus, Jupiter all in kendra or trikona, Mercury in own/exalt
  if (mercury && venus && jupiter) {
    const mercuryDignified = isInOwnSign('Mercury', mercury.rashi) || isExalted('Mercury', mercury.rashi);
    const allInGoodHouses = [mercury, venus, jupiter].every(p => isKendraOrTrikona(p.houseNumber));
    const isSaraswati = mercuryDignified && allInGoodHouses;
    results.push({
      name: 'Saraswati Yoga',
      strength: isSaraswati ? 'Strong' : 'Weak',
      isPresent: isSaraswati,
      description: isSaraswati
        ? 'Mercury, Venus, and Jupiter are all well-placed, granting exceptional intelligence, eloquence, artistry, and scholarly brilliance. Favors education and creative fields.'
        : 'Mercury, Venus, and Jupiter are not all in Kendra/Trikona. Saraswati Yoga is not formed.',
    });
  }

  // ── Pancha Mahapurusha Yogas ──
  const pancha = [
    { name: 'Ruchaka Yoga', planet: 'Mars', desc: 'Mars in own sign or exaltation in a Kendra. Native is brave, energetic, commanding, and attains leadership positions.' },
    { name: 'Bhadra Yoga', planet: 'Mercury', desc: 'Mercury in own sign or exaltation in a Kendra. Native is highly intelligent, business-minded, and articulate.' },
    { name: 'Hamsa Yoga', planet: 'Jupiter', desc: 'Jupiter in own sign or exaltation in a Kendra. Native is virtuous, wise, spiritually inclined, and blessed with prosperity.' },
    { name: 'Malavya Yoga', planet: 'Venus', desc: 'Venus in own sign or exaltation in a Kendra. Native has refined taste, artistic talents, luxurious life, and magnetic personality.' },
    { name: 'Shasha Yoga', planet: 'Saturn', desc: 'Saturn in own sign or exaltation in a Kendra. Native attains authority, administrative power, and works for the masses.' },
  ];
  for (const { name, planet, desc } of pancha) {
    const p = planets[planet];
    if (!p) continue;
    const dignified = isInOwnSign(planet, p.rashi) || isExalted(planet, p.rashi);
    const inKendra = isKendra(p.houseNumber);
    const isPresent = dignified && inKendra;
    results.push({
      name,
      strength: isPresent ? 'Strong' : 'Weak',
      isPresent,
      description: isPresent ? desc : `${planet} is not in its own sign or exaltation in a Kendra. ${name} is not formed.`,
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
      name: 'Guru-Mangal Yoga',
      strength,
      isPresent: isGuruMangal,
      description: isGuruMangal
        ? `Jupiter and Mars are conjunct in the ${jupiter.houseNumber}th house, creating Guru-Mangal Yoga. This powerful combination generates high ambition, leadership, and the ability to execute grand plans with wisdom and courage. Favors engineering, medicine, management, military, sports, and entrepreneurship.${jupExalted ? ' With Jupiter exalted, this yoga is especially powerful and auspicious.' : ''}`
        : 'Jupiter and Mars are not conjunct. Guru-Mangal Yoga is absent.',
    });
  }

  // ── Amala Yoga ──
  // A natural benefic (Moon, Mercury, Jupiter, Venus) in the 10th house from Lagna
  const beneficsIn10th = (['Moon', 'Mercury', 'Jupiter', 'Venus'] as const)
    .filter(b => planets[b]?.houseNumber === 10);
  if (beneficsIn10th.length > 0) {
    const strength = beneficsIn10th.some(b => b === 'Jupiter' || b === 'Venus') ? 'Strong' : 'Moderate';
    results.push({
      name: 'Amala Yoga',
      strength,
      isPresent: true,
      description: `${beneficsIn10th.join(' and ')} in the 10th house (Amala Yoga) grants lasting fame, excellent professional reputation, and career success built on ethical foundations. Actions are remembered positively. Native earns wealth through righteous means.`,
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
        name: 'Dharma Karmadhipati Yoga',
        strength: 'Strong',
        isPresent: true,
        description: `The 9th lord (${lord9DK}) and 10th lord (${lord10DK}) are ${exchange ? 'in Parivartana (exchange)' : 'conjunct'}, forming Dharma Karmadhipati Yoga — one of the most powerful Raja Yogas. Career is built on dharmic purpose, bringing authority, public recognition, and lasting success aligned with higher principles.`,
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
      results.push({
        name: `Lagna Lord in ${sthana} House`,
        strength: ll.houseNumber === 9 || ll.houseNumber === 10 ? 'Strong' : 'Moderate',
        isPresent: true,
        description: `${lagnaLordName} (Lagna lord) in the ${ll.houseNumber}th house (${sthana}) is a highly auspicious placement. Native has strong personal drive toward achievement, good fortune, and a career aligned with their core identity. Life purpose and career tend to merge naturally.`,
      });
    }
  }

  // ── Rahu in Upachaya (3, 6, 10, 11) ──
  // Rahu performs well in growth-oriented houses
  if (rahu && [3, 6, 10, 11].includes(rahu.houseNumber)) {
    results.push({
      name: 'Rahu in Upachaya Yoga',
      strength: rahu.houseNumber === 10 || rahu.houseNumber === 11 ? 'Strong' : 'Moderate',
      isPresent: true,
      description: `Rahu in the ${rahu.houseNumber}th house (an Upachaya — growth house) channels ambition constructively. Native gains through unconventional methods, foreign connections, technology, or cutting-edge fields. Results improve significantly after age 35.`,
    });
  }

  // ── Shani-related: Saturn in Upachaya ──
  if (saturn && [3, 6, 11].includes(saturn.houseNumber)) {
    results.push({
      name: 'Saturn in Upachaya',
      strength: saturn.houseNumber === 11 ? 'Strong' : 'Moderate',
      isPresent: true,
      description: `Saturn in the ${saturn.houseNumber}th house (Upachaya) slowly builds strength over time. Obstacles in early life transform into assets. Native achieves sustained material success through disciplined effort, especially in the second half of life.`,
    });
  }

  return results.filter(y => y.isPresent);
}
