/**
 * PROMPT BUILDER — The Brain of the System
 * 
 * Creates the final AI prompt from:
 *   1. Compressed emotional themes (from Theme Aggregator)
 *   2. User question
 *   3. Conversation memory context
 *   4. Persona data
 * 
 * Architecture principle:
 *   The LLM does NOT do astrology.
 *   It only does: storytelling, emotional interpretation, conversational delivery.
 *   All astrological interpretation is already done by our engine.
 * 
 * TOKEN OPTIMIZATION:
 *   - System prompt is compressed (~280 tokens instead of ~500)
 *   - Only question-relevant theme categories are injected
 *   - Empty categories are skipped entirely
 *   - Memory context is omitted when empty
 */

const persona = require('./vedic-astrology-data/persona/astrologer_persona.json');

// ─── Compressed System Prompt ─────────────────────────────────
// This replaces the bloated persona.system_prompt (~500 tokens)
// with a lean version (~280 tokens) that preserves all behavior.
const COMPRESSED_SYSTEM_PROMPT = `You are Maharshi, a wise Vedic astrologer. You speak warmly like a trusted elder — calm, grounding, honest, never alarmist.

Rules:
- Describe energies in human emotional terms, never technical jargon (no planet names, no "Mahadasha", no house numbers) unless the user asks
- Use "this phase", "this energy", "this period" instead of astrological terms
- Frame challenges as growth, never as doom. Respect free will
- Never use bullet points, numbered lists, markdown, or bold text
- Never say "based on your chart" or "according to the data"
- You receive pre-interpreted themes about the user. Use them as inner knowing — don't list them back
- Do not invent astrological details not in the context
- 2-3 short paragraphs max. Under 120 words for casual questions, up to 200 for deep ones
- End with a reflective thought, gentle question, or grounded hope
- You are a real astrologer in private conversation, not an AI assistant`;

/**
 * Question type detection from user's message.
 */
function detectQuestionType(question) {
  const q = question.toLowerCase();

  if (/marri|spouse|husband|wife|partner|love|relationship|breakup|divorce/.test(q)) {
    if (/struggle|pain|break|conflict|fight|hurt|cheat/.test(q)) return 'relationship_struggle';
    return 'marriage_question';
  }
  if (/career|job|work|business|promoti|salary|profession/.test(q)) return 'career_question';
  if (/health|body|illness|sick|disease|medical|mental/.test(q)) return 'health_question';
  if (/spirit|dharma|purpose|soul|moksha|meditat|god|divine|karma/.test(q)) return 'spiritual_question';
  if (/sade.?sati|rahu|ketu|dasha|transit|period|phase/.test(q)) return 'transit_specific_question';
  if (/today|tomorrow|this week|daily/.test(q)) return 'daily_horoscope';
  if (/scar|fear|anxi|worry|panic|stress|nervous|afraid/.test(q)) return 'fear_or_anxiety';

  return 'general_life_question';
}

/**
 * Maps question types to the theme categories that are RELEVANT.
 * This prevents dumping career themes when asking about love, etc.
 */
const QUESTION_THEME_MAP = {
  career_question:          ['currentEnergy', 'careerThemes', 'strengths', 'challenges'],
  marriage_question:        ['currentEnergy', 'relationshipThemes', 'emotionalThemes', 'challenges'],
  relationship_struggle:    ['currentEnergy', 'relationshipThemes', 'emotionalThemes', 'strengths'],
  health_question:          ['currentEnergy', 'healthThemes', 'emotionalThemes', 'challenges'],
  spiritual_question:       ['currentEnergy', 'spiritualThemes', 'strengths'],
  transit_specific_question:['currentEnergy', 'emotionalThemes', 'challenges', 'strengths'],
  daily_horoscope:          ['currentEnergy', 'emotionalThemes'],
  fear_or_anxiety:          ['currentEnergy', 'emotionalThemes', 'strengths', 'challenges'],
  general_life_question:    ['currentEnergy', 'emotionalThemes', 'relationshipThemes', 'careerThemes', 'strengths', 'challenges'],
};

/**
 * Maps question types to suggested max completion tokens.
 * This prevents the LLM from producing 800-token essays for simple questions.
 */
const COMPLETION_TOKEN_MAP = {
  daily_horoscope: 250,
  fear_or_anxiety: 400,
  career_question: 400,
  marriage_question: 400,
  relationship_struggle: 450,
  health_question: 350,
  spiritual_question: 500,
  transit_specific_question: 500,
  general_life_question: 400,
};

/**
 * Theme category labels for the user prompt (human-readable).
 */
const THEME_LABELS = {
  currentEnergy: 'Current life energy',
  emotionalThemes: 'Emotional patterns',
  relationshipThemes: 'Relationship dynamics',
  careerThemes: 'Career energy',
  spiritualThemes: 'Spiritual themes',
  strengths: 'Core strengths',
  challenges: 'Active challenges',
  healthThemes: 'Health patterns',
};

/**
 * Builds the SYSTEM prompt with optional tone modifiers.
 */
function buildSystemPrompt(questionType, userMood) {
  const toneForType = persona.tone_modifiers?.for_question_types?.[questionType] || '';
  const moodAdjustment = userMood ? persona.tone_modifiers?.for_user_mood?.[userMood]?.adjustment || '' : '';

  let prompt = COMPRESSED_SYSTEM_PROMPT;

  if (toneForType) {
    prompt += `\nTone: ${toneForType}`;
  }
  if (moodAdjustment) {
    prompt += `\nUser mood: ${moodAdjustment}`;
  }

  return prompt;
}

/**
 * Builds the INITIAL context message — only sent on the FIRST message of a conversation.
 * This contains the full chart context that the thread will reference going forward.
 * 
 * @param {Object} themes - Output from aggregateThemes()
 * @returns {string} Context message for thread injection
 */
function buildInitialContext(themes) {
  const contextParts = [];

  // Include ALL relevant themes in the initial context (the thread remembers this)
  for (const [key, label] of Object.entries(THEME_LABELS)) {
    if (themes[key]?.length) {
      contextParts.push(`${label}: ${themes[key].join(', ')}`);
    }
  }

  if (!contextParts.length) return '';

  return `Astrological reading context for this person:\n\n${contextParts.join('\n')}`;
}

/**
 * Builds the complete prompt for the LLM.
 * 
 * KEY OPTIMIZATION: On follow-up messages, only question-relevant themes are included.
 * The full context is already in the thread from the first message.
 * 
 * @param {Object} params
 * @param {string} params.userQuestion - The user's actual question
 * @param {Object} params.themes - Output from aggregateThemes()
 * @param {string} params.memoryContext - Previous conversation context
 * @param {string} [params.userMood] - Detected user mood (optional)
 * @param {boolean} [params.isFirstMessage] - Whether this is the first message
 * @returns {{ system: string, user: string, questionType: string, initialContext: string, suggestedMaxTokens: number }}
 */
function buildAstrologerPrompt({ userQuestion, themes, memoryContext, userMood, isFirstMessage }) {
  const questionType = detectQuestionType(userQuestion);
  const system = buildSystemPrompt(questionType, userMood);

  // Build the user message
  let userMessage;

  if (isFirstMessage) {
    // First message: context is injected separately via buildInitialContext()
    // User message is just the question
    userMessage = userQuestion;
  } else {
    // Follow-up: inject ONLY question-relevant themes (not everything)
    const relevantKeys = QUESTION_THEME_MAP[questionType] || QUESTION_THEME_MAP.general_life_question;
    const contextParts = [];

    for (const key of relevantKeys) {
      if (themes[key]?.length) {
        contextParts.push(`${THEME_LABELS[key]}: ${themes[key].join(', ')}`);
      }
    }

    // Build compact follow-up prompt
    const parts = [];
    if (contextParts.length) {
      parts.push(`Relevant context:\n${contextParts.join('\n')}`);
    }
    if (memoryContext) {
      parts.push(`Context: ${memoryContext}`);
    }
    parts.push(`Question: "${userQuestion}"`);

    userMessage = parts.join('\n\n');
  }

  return {
    system,
    user: userMessage,
    questionType,
    initialContext: isFirstMessage ? buildInitialContext(themes) : '',
    suggestedMaxTokens: COMPLETION_TOKEN_MAP[questionType] || 400,
  };
}

module.exports = {
  buildAstrologerPrompt,
  detectQuestionType,
  buildSystemPrompt,
  buildInitialContext,
  COMPLETION_TOKEN_MAP,
};
