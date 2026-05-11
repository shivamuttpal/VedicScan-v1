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
function buildMaharshiPrompt({ userQuestion, chartData, memory, userMood, isFirstMessage = false }) {
  // STEP 1 — Interpret chart into structured items
  const interpretedData = interpretChart(chartData);

  // STEP 2 — Aggregate into compressed emotional themes
  const themes = aggregateThemes(interpretedData);

  // STEP 3 — Retrieve conversation memory context
  const memoryContext = getMemoryContext(memory);

  // STEP 4 — Build the final prompt
  const prompt = buildAstrologerPrompt({
    userQuestion,
    themes,
    memoryContext,
    userMood,
    isFirstMessage
  });

  // STEP 5 — Update memory for next turn
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
