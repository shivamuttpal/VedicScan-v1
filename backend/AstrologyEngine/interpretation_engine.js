/**
 * VEDIC ASTROLOGY INTERPRETATION ENGINE
 * 
 * Production Architecture:
 *   Swiss Ephemeris → Chart Data → Interpretation Engine → Theme Aggregator → Prompt Builder → LLM
 * 
 * This engine transforms raw planetary chart data into structured emotional/life themes.
 * The LLM never does astrology — it only delivers the human narrative.
 */

// ─── Load All Interpretation Dictionaries ─────────────────────
const moonInSigns    = require('./vedic-astrology-data/signs/moon_in_signs.json');
const sunInSigns     = require('./vedic-astrology-data/signs/sun_in_signs.json');
const ascendantSigns = require('./vedic-astrology-data/signs/ascendant_signs.json');
const planetsInSigns = require('./vedic-astrology-data/signs/planets_in_signs.json');
const rahuKetuData   = require('./vedic-astrology-data/signs/rahu_ketu_in_signs.json');
const planetsInHouses= require('./vedic-astrology-data/planets/planets_in_houses.json');
const planetaryStates= require('./vedic-astrology-data/planets/planetary_states.json');
const retrogradeData = require('./vedic-astrology-data/planets/retrograde_planets.json');
const mahadashaData  = require('./vedic-astrology-data/dashas/mahadashas.json');
const antardashaData = require('./vedic-astrology-data/dashas/antardashas.json');
const nakshatraData  = require('./vedic-astrology-data/nakshatras/nakshatras.json');
const yogaData       = require('./vedic-astrology-data/yogas/yogas.json');
const transitData    = require('./vedic-astrology-data/transits/transits.json');
const remedyData     = require('./vedic-astrology-data/remedies/remedies.json');

// ─── Main Interpretation Function ─────────────────────────────

/**
 * Interprets a raw chart and produces an array of themed interpretation items.
 * Each item has a `source` label plus optional emotional/relationship/career/spiritual
 * effects, strengths, challenges, etc.
 * 
 * @param {Object} chart - Raw chart data from Swiss Ephemeris / chart engine
 * @returns {Array<Object>} Array of interpretation items for the Theme Aggregator
 */
function interpretChart(chart) {
  const items = [];

  // ── Layer 1: Core Identity ──
  if (chart.moonSign) {
    items.push({ source: 'moon_sign', ...interpretMoonSign(chart.moonSign) });
  }
  if (chart.sunSign) {
    items.push({ source: 'sun_sign', ...interpretSunSign(chart.sunSign) });
  }
  if (chart.ascendant) {
    items.push({ source: 'ascendant', ...interpretAscendant(chart.ascendant) });
  }

  // ── Layer 2: Planets in Signs ──
  if (chart.planetSigns) {
    for (const [planet, sign] of Object.entries(chart.planetSigns)) {
      const p = planet.toLowerCase();
      // Rahu/Ketu use their own data file
      if (p === 'rahu' || p === 'ketu') {
        items.push({ source: `${p}_in_${sign}`, ...interpretRahuKetu(p, sign) });
      } else {
        const interp = interpretPlanetInSign(p, sign);
        if (Object.keys(interp).length) {
          items.push({ source: `${p}_in_${sign}`, ...interp });
        }
      }
    }
  }

  // ── Layer 3: Planets in Houses ──
  if (chart.planetHouses) {
    for (const [planet, house] of Object.entries(chart.planetHouses)) {
      const interp = interpretPlanetInHouse(planet, house);
      if (Object.keys(interp).length) {
        items.push({ source: `${planet}_house_${house}`, ...interp });
      }
    }
  }

  // ── Layer 4: Planetary States ──
  if (chart.planetSigns) {
    for (const planet of Object.keys(chart.planetSigns)) {
      if (chart.retrograde?.[planet]) {
        items.push({ source: `${planet}_retrograde`, ...interpretRetrograde(planet) });
      }
      if (chart.combust?.[planet]) {
        items.push({ source: `${planet}_combust`, ...interpretCombustion(planet) });
      }
    }
  }

  // ── Layer 5: Yogas ──
  if (chart.yogas?.length) {
    for (const yoga of chart.yogas) {
      const interp = interpretYoga(yoga);
      if (Object.keys(interp).length) {
        items.push({ source: `yoga_${yoga}`, ...interp });
      }
    }
  }

  // ── Layer 6: Dasha & Antardasha ──
  if (chart.currentMahadasha) {
    items.push({
      source: 'current_dasha',
      ...interpretDasha(chart.currentMahadasha, chart.currentAntardasha)
    });
  }

  // ── Layer 7: Major Transits ──
  if (chart.sadeSati) {
    items.push({ source: 'sade_sati', ...interpretSadeSati(chart.sadeSatiPhase) });
  }
  if (chart.jupiterTransit) {
    const interp = interpretJupiterTransit(chart.jupiterTransit);
    if (Object.keys(interp).length) {
      items.push({ source: 'jupiter_transit', ...interp });
    }
  }

  // ── Layer 8: Moon Nakshatra ──
  if (chart.moonNakshatra) {
    items.push({ source: 'moon_nakshatra', ...interpretNakshatra(chart.moonNakshatra) });
  }

  // ── Layer 9: Doshas ──
  if (chart.manglik) {
    items.push({ source: 'manglik_dosha', ...interpretManglik() });
  }
  if (chart.kalsarpa) {
    items.push({ source: 'kalsarpa_dosha', ...interpretKalsarpa() });
  }

  return items;
}


// ─── Interpretation Helpers ───────────────────────────────────

function interpretMoonSign(sign) {
  const data = moonInSigns[sign.toLowerCase()];
  if (!data) return {};
  return {
    emotional_effects: data.emotional_patterns || [],
    relationship_patterns: data.relationship_patterns || [],
    career_patterns: data.career_patterns || [],
    spiritual_patterns: data.spiritual_patterns ? [].concat(data.spiritual_patterns) : [],
    strengths: data.strengths || [],
    challenges: data.challenges || [],
    tone: data.tone || ''
  };
}

function interpretSunSign(sign) {
  const data = sunInSigns[sign.toLowerCase()];
  if (!data) return {};
  return {
    emotional_effects: data.identity_patterns || data.emotional_patterns || [],
    career_patterns: data.career_patterns || [],
    strengths: data.strengths || [],
    challenges: data.challenges || [],
    tone: data.tone || ''
  };
}

function interpretAscendant(sign) {
  const data = ascendantSigns[sign.toLowerCase()];
  if (!data) return {};
  return {
    emotional_effects: data.personality_patterns || [],
    career_patterns: data.career_approach || [],
    relationship_patterns: data.relationship_style || [],
    tone: data.tone || ''
  };
}

function interpretPlanetInSign(planet, sign) {
  // planets_in_signs.json uses keys like "mars_in_signs" → { "capricorn": {...} }
  const planetKey = `${planet.toLowerCase()}_in_signs`;
  const planetData = planetsInSigns[planetKey];
  if (!planetData) return {};
  const signData = planetData[sign.toLowerCase()];
  if (!signData) return {};

  const dignityNote = signData.status === 'debilitated'
    ? [`${planet} debilitated — a learning opportunity in ${planet}'s domain`]
    : signData.status === 'exalted'
    ? [`${planet} exalted — natural gift and strength`]
    : [];

  return {
    emotional_effects: signData.emotional_meaning || [],
    relationship_patterns: signData.relationship_meaning || [],
    career_patterns: signData.career_meaning || [],
    strengths: signData.strengths || [],
    challenges: [...(signData.challenges || []), ...dignityNote]
  };
}

function interpretRahuKetu(node, sign) {
  const section = node === 'rahu' ? rahuKetuData.rahu_in_signs : rahuKetuData.ketu_in_signs;
  const data = section?.[sign.toLowerCase()];
  if (!data) return {};
  return {
    emotional_effects: data.themes || [],
    spiritual_patterns: data.karmic_lesson ? [data.karmic_lesson] : [],
    career_patterns: data.career_directions || [],
    challenges: data.shadow ? [data.shadow] : [],
    strengths: data.manifestations || []
  };
}

function interpretPlanetInHouse(planet, house) {
  const key = `${planet.toLowerCase()}_${house}`;
  const data = planetsInHouses[key];
  if (!data) return {};
  return {
    emotional_effects: Array.isArray(data.emotional_meaning) ? data.emotional_meaning : (data.emotional_meaning ? [data.emotional_meaning] : []),
    relationship_patterns: Array.isArray(data.relationship_meaning) ? data.relationship_meaning : (data.relationship_meaning ? [data.relationship_meaning] : []),
    career_patterns: Array.isArray(data.career_meaning) ? data.career_meaning : (data.career_meaning ? [data.career_meaning] : []),
    strengths: data.strengths || [],
    challenges: data.challenges || []
  };
}

function interpretRetrograde(planet) {
  const data = retrogradeData.retrograde_planets?.[planet.toLowerCase()];
  if (!data) return {};
  return {
    emotional_effects: [data.psychological_meaning].filter(Boolean),
    relationship_patterns: [data.relationship_pattern].filter(Boolean),
    career_patterns: [data.career_pattern].filter(Boolean),
    spiritual_patterns: [data.spiritual_lesson].filter(Boolean)
  };
}

function interpretCombustion(planet) {
  const effects = planetaryStates.combustion?.general_effects?.[`${planet.toLowerCase()}_combust`];
  return {
    challenges: effects || []
  };
}

function interpretYoga(yogaName) {
  const yoga = yogaData[yogaName];
  if (!yoga) return {};
  return {
    strengths: yoga.themes || [],
    career_patterns: yoga.predictions?.career ? [yoga.predictions.career] : [],
    emotional_effects: yoga.predictions ? yoga.predictions.filter?.(p => typeof p === 'string') || [] : [],
    tone: yoga.tone || ''
  };
}

function interpretDasha(mahadasha, antardasha) {
  const md = mahadashaData[mahadasha?.toLowerCase()];
  if (!md) return {};

  const ad = antardashaData.antardasha_modifiers?.[antardasha?.toLowerCase()];

  const result = {
    current_life_phase: md.themes || [],
    emotional_effects: md.emotional_patterns || [],
    relationship_patterns: md.relationship_patterns || [],
    career_patterns: md.career_patterns || [],
    spiritual_patterns: md.spiritual_themes || [],
    health_patterns: md.health_themes || [],
    strengths: [],
    challenges: [],
    general_advice: md.general_advice || ''
  };

  if (ad) {
    result.current_life_phase.push(`Modified by ${antardasha} sub-period: ${ad.tone_modifier || ad.tone || ''}`);
  }

  return result;
}

function interpretSadeSati(phase) {
  const phases = transitData.saturn_transits?.sade_sati?.phases;
  const data = phases?.[phase];
  if (!data) return {};
  return {
    current_life_phase: [data.name + ': ' + (data.themes || []).join(', ')],
    emotional_effects: data.emotional_patterns || [],
    spiritual_patterns: ['Sade Sati: ' + (transitData.saturn_transits.sade_sati.human_translation || '')],
    challenges: transitData.saturn_transits.sade_sati.what_hurts || [],
    strengths: transitData.saturn_transits.sade_sati.what_helps || []
  };
}

function interpretJupiterTransit(house) {
  const key = `${ordinal(house)}_house`;
  const benefic = transitData.jupiter_transits?.benefic_houses_from_moon?.[key];
  if (benefic) {
    return {
      current_life_phase: benefic.themes || [],
      emotional_effects: [benefic.tone || '']
    };
  }
  return {};
}

function interpretNakshatra(nakshatraName) {
  const nak = nakshatraData[nakshatraName.toLowerCase()];
  if (!nak) return {};
  return {
    emotional_effects: nak.personality || [],
    career_patterns: nak.career_areas || [],
    challenges: nak.challenges || [],
    spiritual_patterns: nak.themes || []
  };
}

function interpretManglik() {
  return {
    relationship_patterns: [
      'Manglik dosha — intensity and assertiveness in partnerships, need for compatible energy'
    ],
    challenges: ['marriage timing may need attention', 'fiery dynamic in partnerships'],
    strengths: ['passionate and protective in love']
  };
}

function interpretKalsarpa() {
  return {
    spiritual_patterns: [
      'Kalsarpa Yoga — significant karmic life pattern, spiritual practice is deeply rewarding'
    ],
    challenges: ['life feels destined at times', 'obstacles before breakthroughs'],
    strengths: ['deep inner transformation power', 'spiritual awakening potential']
  };
}


// ─── Utilities ────────────────────────────────────────────────

function ordinal(n) {
  const map = {
    1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth',
    6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth',
    11: 'eleventh', 12: 'twelfth'
  };
  return map[n] || `${n}th`;
}


// ─── Exports ──────────────────────────────────────────────────

module.exports = {
  interpretChart,
  // Individual interpreters (for testing / direct use)
  interpretMoonSign,
  interpretSunSign,
  interpretAscendant,
  interpretPlanetInSign,
  interpretRahuKetu,
  interpretPlanetInHouse,
  interpretRetrograde,
  interpretCombustion,
  interpretYoga,
  interpretDasha,
  interpretSadeSati,
  interpretJupiterTransit,
  interpretNakshatra,
  interpretManglik,
  interpretKalsarpa
};
