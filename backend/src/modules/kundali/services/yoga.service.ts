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

function planetStrength(planet: string, info: PlanetInfo): 'strong' | 'neutral' | 'weak' {
  if (isExalted(planet, info.rashi) || isInOwnSign(planet, info.rashi)) return 'strong';
  return 'neutral';
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
  // A debilitated planet gains cancellation
  const DEBILITATION: Record<string, string> = {
    Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer', Mercury: 'Pisces',
    Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries',
  };
  let nbryFound = false;
  let nbryPlanet = '';
  for (const [planet, debRashi] of Object.entries(DEBILITATION)) {
    if (!planets[planet]) continue;
    if (planets[planet].rashi !== debRashi) continue;
    // Cancellation: exalted lord of debilitation sign in kendra from lagna/moon
    const debSignLord = SIGN_LORDS[debRashi];
    const exaltLord = Object.entries(EXALTATION).find(([, r]) => r === debRashi)?.[0];
    const debLordPos = planets[debSignLord]?.houseNumber;
    const exaltLordPos = exaltLord ? planets[exaltLord]?.houseNumber : undefined;
    if ((debLordPos && isKendra(debLordPos)) || (exaltLordPos && isKendra(exaltLordPos))) {
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
      ? `${nbryPlanet}'s debilitation is cancelled, transforming weakness into extraordinary strength. This yoga produces leaders who overcome great obstacles to achieve success.`
      : 'No debilitated planet with full cancellation conditions found in your chart.',
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

  return results.filter(y => y.isPresent);
}
