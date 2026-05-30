import { IDosha } from '../model/kundali.model';

interface PlanetInfo {
  rashi: string;
  houseNumber: number;
}

export function detectDoshas(
  planets: Record<string, PlanetInfo>,
  lagnaSign: string,
  houses: Array<{ number: number; sign: string; planets: string[] }>
): IDosha[] {
  const results: IDosha[] = [];

  const mars = planets['Mars'];
  const rahu = planets['Rahu'];
  const ketu = planets['Ketu'];
  const sun = planets['Sun'];
  const moon = planets['Moon'];
  const jupiter = planets['Jupiter'];
  const saturn = planets['Saturn'];

  // ── Mangal Dosha (Kuja Dosha) ──
  // Mars in houses 1, 4, 7, 8, or 12
  const MANGAL_DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];
  if (mars) {
    const hasMangal = MANGAL_DOSHA_HOUSES.includes(mars.houseNumber);
    // Partial cancellation: Mars in own sign (Aries, Scorpio) or exaltation (Capricorn)
    const marsInOwnExalt = ['Aries', 'Scorpio', 'Capricorn'].includes(mars.rashi);
    const severity = hasMangal ? (marsInOwnExalt ? 'Medium' : mars.houseNumber === 7 || mars.houseNumber === 8 ? 'High' : 'Medium') : 'None';
    results.push({
      name: 'Mangal Dosha',
      severity,
      isPresent: hasMangal,
      description: hasMangal
        ? `Mars is placed in the ${mars.houseNumber}th house, creating Mangal Dosha. This can cause delays in marriage, conflicts in relationships, and accidents if not addressed. Severity is ${severity.toLowerCase()}.${marsInOwnExalt ? ' Partial cancellation applies as Mars is in own/exalted sign.' : ''}`
        : 'Mars is not in any of the houses (1,2,4,7,8,12) that create Mangal Dosha. Your chart is free from this dosha.',
      remedy: hasMangal
        ? 'Recite Hanuman Chalisa daily. Observe Tuesday fast. Wear Red Coral (Moonga) after consulting an astrologer. Perform Kuja Dosha Shanti Puja.'
        : '',
    });
  }

  // ── Kaal Sarp Dosha ──
  // All 7 main planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn) between Rahu and Ketu
  if (rahu && ketu) {
    const rahuHouse = rahu.houseNumber;
    const ketuHouse = ketu.houseNumber;
    const mainPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    let allBetween = true;
    for (const pname of mainPlanets) {
      const p = planets[pname];
      if (!p) { allBetween = false; break; }
      // Check if planet is in the arc from Rahu to Ketu (going in direction of Rahu to Ketu)
      const h = p.houseNumber;
      // Rahu-Ketu are always 7 houses apart. Planets should all be on one side.
      const arcRK: number[] = [];
      let cursor = rahuHouse;
      for (let i = 0; i < 6; i++) {
        cursor = (cursor % 12) + 1;
        arcRK.push(cursor);
      }
      // arcRK should contain the 6 houses between Rahu and Ketu (exclusive)
      if (!arcRK.includes(h) && h !== rahuHouse && h !== ketuHouse) {
        allBetween = false;
        break;
      }
    }
    results.push({
      name: 'Kaal Sarp Dosha',
      severity: allBetween ? 'High' : 'None',
      isPresent: allBetween,
      description: allBetween
        ? 'All planets are hemmed between Rahu and Ketu, forming Kaal Sarp Dosha. This can create obstacles, delays in life goals, karmic challenges, and unexpected setbacks. However, it also grants great focus and potential for spiritual elevation.'
        : 'All planets are not hemmed between Rahu-Ketu. Kaal Sarp Dosha is absent in your chart.',
      remedy: allBetween
        ? 'Perform Kaal Sarp Dosha Puja at Tryambakeshwar or Ujjain. Recite Maha Mrityunjaya Mantra 108 times daily. Offer milk to Shiva linga on Mondays.'
        : '',
    });
  }

  // ── Pitra Dosha ──
  // Sun or Moon with Rahu in 9th house, or Sun badly placed with Saturn
  if (sun && rahu) {
    const sunRahuConjunct = sun.houseNumber === rahu.houseNumber;
    const inNinthOrFirst = [1, 9].includes(sun.houseNumber);
    const isPitra = sunRahuConjunct || (inNinthOrFirst && sun.houseNumber === rahu.houseNumber);
    const saturnWithSun = saturn && sun.houseNumber === saturn.houseNumber && [1, 7, 10].includes(sun.houseNumber);
    const isDosha = sunRahuConjunct || saturnWithSun;
    results.push({
      name: 'Pitra Dosha',
      severity: isDosha ? (sunRahuConjunct && inNinthOrFirst ? 'High' : 'Medium') : 'None',
      isPresent: isDosha,
      description: isDosha
        ? 'Pitra Dosha is indicated by the Sun\'s affliction with Rahu or Saturn. This suggests unresolved karmic debts from ancestors, causing obstacles in professional life and paternal relations.'
        : 'Sun is free from affliction by Rahu/Saturn in sensitive positions. Pitra Dosha is not indicated.',
      remedy: isDosha
        ? 'Perform Pitra Tarpan on Amavasya (new moon). Offer water to ancestors on Shraddha Paksha. Feed Brahmins on Saturdays. Donate yellow items on Sundays.'
        : '',
    });
  }

  // ── Guru Chandal Dosha ──
  // Jupiter conjunct Rahu (same house)
  if (jupiter && rahu) {
    const isGuruChandal = jupiter.houseNumber === rahu.houseNumber;
    results.push({
      name: 'Guru Chandal Dosha',
      severity: isGuruChandal ? 'Medium' : 'None',
      isPresent: isGuruChandal,
      description: isGuruChandal
        ? 'Jupiter and Rahu are conjunct, causing Guru Chandal Dosha. This can create confusion in wisdom, association with wrong advisors, and challenges in education or spiritual growth. Native may be misguided at key decisions.'
        : 'Jupiter and Rahu are not conjunct. Guru Chandal Dosha is absent.',
      remedy: isGuruChandal
        ? 'Recite Guru Beeja Mantra: "Om Graam Greem Graum Sah Gurave Namah" 108 times on Thursdays. Donate yellow items to teachers. Seek blessings of genuine spiritual guides.'
        : '',
    });
  }

  // ── Shani Dosha (Shani's Kendra placement afflicting angular houses) ──
  if (saturn) {
    const saturnInKendra = [1, 4, 7, 10].includes(saturn.houseNumber);
    const saturnDebilitated = saturn.rashi === 'Aries';
    const isShani = saturnInKendra && saturnDebilitated;
    results.push({
      name: 'Shani Dosha',
      severity: isShani ? 'Medium' : 'None',
      isPresent: isShani,
      description: isShani
        ? `Saturn is debilitated in ${saturn.rashi} and placed in the ${saturn.houseNumber}th house (Kendra). This creates delays, obstacles, and karmic tests in the area governed by that house. However, it ultimately builds tremendous resilience.`
        : saturn.houseNumber === 1 || saturn.houseNumber === 7
          ? `Saturn in the ${saturn.houseNumber}th house may create some challenges in personality or marriage respectively, but without debilitation the effects are manageable.`
          : 'Saturn is well-placed without serious debilitation in a Kendra. Shani Dosha is not severe.',
      remedy: isShani
        ? 'Recite Shani Mantra on Saturdays. Light sesame oil lamp under Peepal tree on Saturdays. Donate black items to underprivileged. Chant "Om Sham Shanicharaya Namah" 108 times.'
        : '',
    });
  }

  return results;
}
