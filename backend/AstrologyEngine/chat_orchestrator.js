/**
 * CHAT ORCHESTRATOR — Main Pipeline
 * 
 * This is the single entry point for the entire Maharshi AI system.
 * 
 * Pipeline:
 *   1. interpretChart()        — Chart → Structured interpretations
 *   2. aggregateThemes()       — Interpretations → Compressed emotional themes  
 *   3. getMemoryContext()      — Retrieve conversational context from object
 *   4. buildAstrologerPrompt() — Themes + Memory + Question → Final prompt
 *   5. LLM Call                — Send to OpenAI Assistants API
 *   6. cleanResponse()         — Strip AI formatting artifacts
 *   7. updateMemory()          — Update context object for next turn
 */

const { interpretChart }        = require('./interpretation_engine');
const { aggregateThemes }       = require('./theme_aggregator');
const { buildAstrologerPrompt } = require('./prompt_builder');
const { cleanResponse }         = require('./response_cleaner');
const { getMemoryContext, updateMemory } = require('./conversation_memory');

/**
 * The complete orchestration pipeline.
 * 
 * @param {Object} params
 * @param {string} params.userQuestion - The user's question
 * @param {Object} params.chartData - Raw chart data
 * @param {Object} params.memory - Persisted memory object from database
 * @param {string} [params.userMood] - Optional detected mood
 * @param {boolean} [params.isFirstMessage] - Whether this is the first message
 * @returns {{ prompt: Object, updatedMemory: Object }}
 */
/**
 * Extracts a compact "chart facts" object from the raw chartData.
 * These are specific, concrete values (dasha dates, planet positions)
 * that are injected verbatim into the prompt for specific, accurate answers.
 */
function extractChartFacts(chartData) {
  if (!chartData || typeof chartData !== 'object' || !Object.keys(chartData).length) return null;
  return {
    personName:        chartData._profileName       || null,
    ascendant:         chartData.ascendant          || null,
    moonSign:          chartData.moonSign            || null,
    moonNakshatra:     chartData.moonNakshatra       || null,
    sunSign:           chartData.sunSign             || null,
    planetSigns:       chartData.planetSigns         || {},
    planetHouses:      chartData.planetHouses        || {},
    retrograde:        chartData.retrograde          || {},
    currentMahadasha:  chartData.currentMahadasha    || null,
    mahadashaEnd:      chartData._mahadashaEnd       || null,
    currentAntardasha: chartData.currentAntardasha   || null,
    antardashaEnd:     chartData._antardashaEnd      || null,
    yogas:             chartData.yogas               || [],
    doshas:            chartData._doshas             || [],
    manglik:           chartData.manglik             || false,
    kalsarpa:          chartData.kalsarpa            || false,
    sadeSati:          chartData.sadeSati            || false,
    sadeSatiPhase:     chartData.sadeSatiPhase       || null,
  };
}

function buildMaharshiPrompt({ userQuestion, chartData, memory, userMood, isFirstMessage = false }) {
  // STEP 1 — Extract concrete chart facts for specific, date-accurate answers
  const chartFacts = extractChartFacts(chartData);

  // STEP 2 — Interpret chart into structured items (themes)
  const interpretedData = interpretChart(chartData);

  // STEP 3 — Aggregate into compressed emotional themes
  const themes = aggregateThemes(interpretedData);

  // STEP 4 — Retrieve conversation memory context
  const memoryContext = getMemoryContext(memory);

  // STEP 5 — Build the final prompt (now with concrete facts + themes)
  const prompt = buildAstrologerPrompt({
    userQuestion,
    themes,
    memoryContext,
    userMood,
    isFirstMessage,
    chartFacts,
  });

  // STEP 6 — Update memory for next turn
  const updatedMemory = updateMemory(memory, userQuestion, prompt.questionType);

  return { prompt, updatedMemory };
}

/**
 * Cleans a raw LLM response.
 */
function cleanLLMResponse(rawText) {
  return cleanResponse(rawText);
}

module.exports = {
  buildMaharshiPrompt,
  cleanLLMResponse,
  interpretChart,
  aggregateThemes,
  buildAstrologerPrompt,
  cleanResponse,
  getMemoryContext,
  updateMemory
};
