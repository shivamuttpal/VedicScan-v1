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
const COMPRESSED_SYSTEM_PROMPT = `You are a warm, wise Vedic astrologer speaking to a person in a private session. You are specific, honest, and grounded — like a trusted guide who knows their chart deeply. The person is NOT an astrologer, so never leave them with work they cannot do.

Rules:
- Use the person's actual chart data: name their planets, mahadasha and antardasha lords, house positions, and the exact dates provided. Anchor every claim to a specific factor in THEIR chart ("Rahu in your 7th house", "your Mercury–Jupiter period"), never generic astrology.
- When the question involves timing or the future (marriage, career, money, health, a decision), you MUST give concrete, trackable timing instead of vague advice:
   • Name a favourable WINDOW with real start and end dates or a month-and-year range, drawn from their dasha sub-periods, Jupiter transits, or the windows listed — e.g. "the strongest stretch is roughly March 2027 through August 2027".
   • Give a YEARLY view: which upcoming period supports this and until when it lasts, and which stretch is quieter, so they know what each year holds.
   • Add a near-term MONTHLY pointer they can act on soon.
- NEVER tell the person to "watch the transits", "keep an eye on" planetary movements, or "observe these periods" — they have no way to track that. Do the tracking FOR them: state the dates yourself, then describe in plain, everyday language the real-life signs that the window is opening — how it may feel, what kinds of meetings, offers, or openings to say yes to.
- If a chart factor delays or tests this area, say so honestly, frame it as preparation, and still give the date when the pressure eases and the favourable window begins.
- Never use bullet points, numbered lists, markdown, or bold text — speak in flowing paragraphs.
- Never say "based on your chart" or "according to the data" — speak as if you already know this.
- Keep every answer between 140 and 160 words (a little under or over is fine). Write it as one or two flowing paragraphs — long enough to be specific, warm, and concrete, short enough to stay focused. Never pad to reach the count or cut a key date to shorten.
- Do not invent dates, planets, or periods not given to you. If no timing data is provided for the topic, give the honest tendency from their chart rather than a made-up date.
- You are a real astrologer, not an AI assistant.`;

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
  career_question: 550,
  marriage_question: 600,
  relationship_struggle: 550,
  health_question: 450,
  spiritual_question: 500,
  transit_specific_question: 600,
  general_life_question: 500,
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
function buildSystemPrompt(questionType, userMood, lang = 'en') {
  const toneForType = persona.tone_modifiers?.for_question_types?.[questionType] || '';
  const moodAdjustment = userMood ? persona.tone_modifiers?.for_user_mood?.[userMood]?.adjustment || '' : '';

  let prompt = COMPRESSED_SYSTEM_PROMPT;

  if (toneForType) {
    prompt += `\nTone: ${toneForType}`;
  }
  if (moodAdjustment) {
    prompt += `\nUser mood: ${moodAdjustment}`;
  }

  if (lang === 'hi') {
    prompt += `\n\nLANGUAGE — CRITICAL: Reply ENTIRELY in natural, conversational Hindi written in Devanagari script. Speak the way a warm Hindi-speaking astrologer actually talks. Use common Hindi names for planets and signs (सूर्य, चंद्र, मंगल, बुध, बृहस्पति, शुक्र, शनि, राहु, केतु; मेष, वृषभ … मीन). Keep dates and numbers exactly as given. Do NOT write any full sentence in English and do not mix languages. The 140–160 word guidance still applies, counted in Hindi words.`;
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
function buildInitialContext(themes, chartFacts) {
  const contextParts = [];

  // ── Specific chart facts (dasha dates, planet positions, doshas, yogas) ──
  if (chartFacts) {
    const factLines = [];

    if (chartFacts.personName)  factLines.push(`Name: ${chartFacts.personName}`);
    if (chartFacts.ascendant)   factLines.push(`Lagna (Ascendant): ${chartFacts.ascendant}`);
    if (chartFacts.moonSign)    factLines.push(`Moon: ${chartFacts.moonSign}${chartFacts.moonNakshatra ? ` in ${chartFacts.moonNakshatra} nakshatra` : ''}`);
    if (chartFacts.sunSign)     factLines.push(`Sun: ${chartFacts.sunSign}`);

    // Planet positions with house numbers
    const ph = chartFacts.planetHouses || {};
    const ps = chartFacts.planetSigns  || {};
    const pr = chartFacts.retrograde   || {};
    const pNames = Object.keys(ph);
    if (pNames.length) {
      const lines = pNames.map(p => {
        const retro = pr[p] ? ' ℞' : '';
        return `${p}: ${ps[p] || '?'} (house ${ph[p]})${retro}`;
      });
      factLines.push(`Planets:\n${lines.join('\n')}`);
    }

    // Dasha / Antardasha with end dates
    if (chartFacts.currentMahadasha) {
      factLines.push(`Mahadasha: ${chartFacts.currentMahadasha}${chartFacts.mahadashaEnd ? ` (until ${chartFacts.mahadashaEnd})` : ''}`);
    }
    if (chartFacts.currentAntardasha) {
      factLines.push(`Antardasha: ${chartFacts.currentAntardasha}${chartFacts.antardashaEnd ? ` (until ${chartFacts.antardashaEnd})` : ''}`);
    }

    // Upcoming dasha sub-periods — gives concrete year-level timing windows
    if (chartFacts.upcomingPeriods?.length) {
      const periods = chartFacts.upcomingPeriods.slice(0, 6)
        .map(p => `${p.lord} (${p.startDate} to ${p.endDate})`)
        .join('; ');
      factLines.push(`Upcoming dasha periods (use these for year-level timing windows): ${periods}`);
    }

    if (chartFacts.yogas?.length)  factLines.push(`Yogas: ${chartFacts.yogas.join(', ')}`);
    if (chartFacts.doshas?.length) factLines.push(`Doshas: ${chartFacts.doshas.join(', ')}`);
    if (chartFacts.sadeSati)       factLines.push(`Sade Sati: active${chartFacts.sadeSatiPhase ? ` (${chartFacts.sadeSatiPhase} phase)` : ''}`);

    // Jupiter transits — current + upcoming sign entries with house numbers
    if (chartFacts.jupiterNow) {
      factLines.push(`Jupiter transit now: ${chartFacts.jupiterNow.sign} (house ${chartFacts.jupiterNow.house} from natal lagna)`);
    }
    if (chartFacts.jupiterAhead?.length) {
      const ahead = chartFacts.jupiterAhead.slice(0, 4)
        .map(t => `enters ${t.sign} (house ${t.house}) on ${t.entryDate}`)
        .join('; ');
      factLines.push(`Jupiter upcoming: ${ahead}`);
    }

    // Waxing moon windows — favorable periods for new beginnings / actions
    if (chartFacts.waxingWindows?.length) {
      const wins = chartFacts.waxingWindows.slice(0, 4)
        .map(w => `${w.start} to ${w.end}`)
        .join(', ');
      factLines.push(`Waxing moon windows (favorable for new starts): ${wins}`);
    }

    if (factLines.length) {
      contextParts.push(`Chart facts:\n${factLines.join('\n')}`);
    }
  }

  // ── Interpreted themes (emotional / life patterns) ──
  for (const [key, label] of Object.entries(THEME_LABELS)) {
    if (themes[key]?.length) {
      contextParts.push(`${label}: ${themes[key].join(', ')}`);
    }
  }

  if (!contextParts.length) return '';

  return `Birth chart for this person:\n\n${contextParts.join('\n\n')}`;
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
function buildAstrologerPrompt({ userQuestion, themes, memoryContext, userMood, isFirstMessage, chartFacts, lang = 'en' }) {
  const questionType = detectQuestionType(userQuestion);
  const system = buildSystemPrompt(questionType, userMood, lang);

  let userMessage;

  if (isFirstMessage) {
    // First message: full context injected via buildInitialContext()
    userMessage = userQuestion;
  } else {
    // Follow-up: inject relevant themes + always include dasha timing for context
    const relevantKeys = QUESTION_THEME_MAP[questionType] || QUESTION_THEME_MAP.general_life_question;
    const contextParts = [];

    for (const key of relevantKeys) {
      if (themes[key]?.length) {
        contextParts.push(`${THEME_LABELS[key]}: ${themes[key].join(', ')}`);
      }
    }

    // Always re-include current dasha timing so the AI can give specific date guidance
    if (chartFacts?.currentMahadasha) {
      const md = `${chartFacts.currentMahadasha}${chartFacts.mahadashaEnd ? ` until ${chartFacts.mahadashaEnd}` : ''}`;
      const ad = chartFacts.currentAntardasha
        ? `${chartFacts.currentAntardasha}${chartFacts.antardashaEnd ? ` until ${chartFacts.antardashaEnd}` : ''}`
        : '';
      contextParts.push(`Current dasha: ${md}${ad ? `, antardasha: ${ad}` : ''}`);

      // Upcoming sub-periods give the year-level windows for timing answers
      if (chartFacts.upcomingPeriods?.length) {
        const periods = chartFacts.upcomingPeriods.slice(0, 5)
          .map(p => `${p.lord} (${p.startDate}→${p.endDate})`)
          .join('; ');
        contextParts.push(`Upcoming periods: ${periods}`);
      }
    }

    // Include transit timing for questions that benefit from planetary timing
    const transitTypes = ['transit_specific_question', 'career_question', 'general_life_question', 'marriage_question'];
    if (transitTypes.includes(questionType) && chartFacts?.jupiterNow) {
      contextParts.push(`Jupiter transit: ${chartFacts.jupiterNow.sign} (house ${chartFacts.jupiterNow.house})`);
      if (chartFacts.jupiterAhead?.length) {
        const next = chartFacts.jupiterAhead[0];
        contextParts.push(`Next Jupiter transit: enters ${next.sign} (house ${next.house}) on ${next.entryDate}`);
      }
      if (chartFacts.waxingWindows?.length) {
        const wins = chartFacts.waxingWindows.slice(0, 2).map(w => `${w.start}–${w.end}`).join(', ');
        contextParts.push(`Upcoming waxing moon: ${wins}`);
      }
    }

    const parts = [];
    if (contextParts.length) parts.push(`Context:\n${contextParts.join('\n')}`);
    if (memoryContext)        parts.push(`Memory: ${memoryContext}`);
    parts.push(`Question: "${userQuestion}"`);

    userMessage = parts.join('\n\n');
  }

  return {
    system,
    user: userMessage,
    questionType,
    initialContext: isFirstMessage ? buildInitialContext(themes, chartFacts) : '',
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
