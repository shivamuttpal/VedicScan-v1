/**
 * THEME AGGREGATOR
 * 
 * Takes the array of interpreted items from the Interpretation Engine and
 * compresses them into unified emotional theme buckets.
 * 
 * This is what the Prompt Builder receives — NOT raw chart JSON.
 * 
 * Input:  Array of { source, emotional_effects, relationship_patterns, ... }
 * Output: { emotionalThemes, relationshipThemes, careerThemes, spiritualThemes,
 *           strengths, challenges, currentEnergy, healthThemes }
 */

/**
 * @param {Array<Object>} interpretedData - Output from interpretChart()
 * @returns {Object} Aggregated and de-duplicated themes
 */
function aggregateThemes(interpretedData) {
  const themes = {
    emotionalThemes: [],
    relationshipThemes: [],
    careerThemes: [],
    spiritualThemes: [],
    strengths: [],
    challenges: [],
    currentEnergy: [],
    healthThemes: []
  };

  for (const item of interpretedData) {
    if (item.emotional_effects?.length) {
      themes.emotionalThemes.push(...item.emotional_effects);
    }
    if (item.relationship_patterns?.length) {
      themes.relationshipThemes.push(...item.relationship_patterns);
    }
    if (item.career_patterns?.length) {
      themes.careerThemes.push(...item.career_patterns);
    }
    if (item.spiritual_patterns?.length) {
      themes.spiritualThemes.push(...item.spiritual_patterns);
    }
    if (item.strengths?.length) {
      themes.strengths.push(...item.strengths);
    }
    if (item.challenges?.length) {
      themes.challenges.push(...item.challenges);
    }
    if (item.current_life_phase?.length) {
      themes.currentEnergy.push(...item.current_life_phase);
    }
    if (item.health_patterns?.length) {
      themes.healthThemes.push(...item.health_patterns);
    }
  }

  // De-duplicate everything
  for (const key of Object.keys(themes)) {
    themes[key] = [...new Set(themes[key])];
  }

  // Emotional compression — keep only the most relevant items.
  // The prompt builder further filters by question type, so these limits
  // prevent over-generation at the aggregation level.
  const limits = {
    emotionalThemes: 4,
    relationshipThemes: 3,
    careerThemes: 4,
    spiritualThemes: 3,
    strengths: 4,
    challenges: 3,
    currentEnergy: 3,
    healthThemes: 2
  };

  for (const [key, limit] of Object.entries(limits)) {
    if (themes[key].length > limit) {
      themes[key] = themes[key].slice(0, limit);
    }
  }

  return themes;
}

module.exports = { aggregateThemes };
