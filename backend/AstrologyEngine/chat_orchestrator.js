/**
 * CHAT ORCHESTRATOR — Main Pipeline
 * 
 * This is the single entry point for the entire Maharshi AI system.
 * 
 * Pipeline:
 *   1. interpretChart()        — Chart → Structured interpretations
 *   2. aggregateThemes()       — Interpretations → Compressed emotional themes  
 *   3. getMemoryContext()      — Retrieve conversational context
 *   4. buildAstrologerPrompt() — Themes + Memory + Question → Final prompt
 *   5. LLM Call                — Send to OpenAI Assistants API
 *   6. cleanResponse()         — Strip AI formatting artifacts
 *   7. updateMemory()          — Store context for next turn
 * 
 * TOKEN OPTIMIZATION:
 *   - First message: full context injected into thread, user sends just the question
 *   - Follow-ups: only question-relevant themes + lightweight memory
 *   - maxCompletionTokens scaled by question type
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
 * @param {Object} params.chartData - Raw chart data (from Swiss Ephemeris or mock)
 * @param {string} params.conversationId - Unique conversation identifier
 * @param {string} [params.userMood] - Optional detected mood
 * @param {boolean} [params.isFirstMessage] - Whether this is the first message in the conversation
 * @returns {{ system: string, user: string, questionType: string, initialContext: string, suggestedMaxTokens: number }}
 */
function buildMaharshiPrompt({ userQuestion, chartData, conversationId, userMood, isFirstMessage = false }) {
  // STEP 1 — Interpret chart into structured items
  const interpretedData = interpretChart(chartData);

  // STEP 2 — Aggregate into compressed emotional themes
  const themes = aggregateThemes(interpretedData);

  // STEP 3 — Retrieve conversation memory
  const memoryContext = getMemoryContext(conversationId);

  // STEP 4 — Build the final prompt
  const prompt = buildAstrologerPrompt({
    userQuestion,
    themes,
    memoryContext,
    userMood,
    isFirstMessage,
  });

  // STEP 5 — Update memory for next turn
  updateMemory(conversationId, userQuestion, prompt.questionType);

  return prompt;
}

/**
 * Cleans a raw LLM response.
 * Exposed here so the chat controller doesn't need to import response_cleaner directly.
 */
function cleanLLMResponse(rawText) {
  return cleanResponse(rawText);
}

module.exports = {
  buildMaharshiPrompt,
  cleanLLMResponse,
  // Re-export for direct access if needed
  interpretChart,
  aggregateThemes,
  buildAstrologerPrompt,
  cleanResponse,
  getMemoryContext,
  updateMemory
};
