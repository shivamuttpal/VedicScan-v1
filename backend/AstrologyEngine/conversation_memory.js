/**
 * CONVERSATION MEMORY
 * 
 * Stores per-user conversational context so Maharshi can remember:
 *   - Recent topics discussed
 *   - User's emotional tone
 *   - Tone preference (spiritual, modern, traditional)
 *   - Key concerns raised
 * 
 * This is an in-memory store. For production persistence, extend this
 * to write to MongoDB (the ChatSession model already stores messages).
 * 
 * Memory is injected into the Prompt Builder so responses feel continuous.
 */

// In-memory store keyed by conversationId
const memoryStore = new Map();

/**
 * Creates a memory context string for the Prompt Builder.
 * 
 * @param {string} conversationId
 * @returns {string} Natural language memory context
 */
function getMemoryContext(conversationId) {
  const memory = memoryStore.get(conversationId);
  if (!memory) return '';

  const parts = [];

  if (memory.recentTopics?.length) {
    parts.push(`The user has recently been exploring: ${memory.recentTopics.join(', ')}`);
  }
  if (memory.emotionalConcerns?.length) {
    parts.push(`They seem emotionally concerned about: ${memory.emotionalConcerns.join(', ')}`);
  }
  if (memory.tonePreference) {
    parts.push(`They prefer a ${memory.tonePreference} tone`);
  }
  if (memory.messageCount > 3) {
    parts.push(`This is an ongoing conversation (${memory.messageCount} messages so far)`);
  }

  return parts.join('. ') + (parts.length ? '.' : '');
}

/**
 * Updates conversational memory after each exchange.
 * 
 * @param {string} conversationId
 * @param {string} userMessage - The user's latest message
 * @param {string} questionType - Detected from prompt_builder
 */
function updateMemory(conversationId, userMessage, questionType) {
  if (!memoryStore.has(conversationId)) {
    memoryStore.set(conversationId, {
      recentTopics: [],
      emotionalConcerns: [],
      tonePreference: null,
      messageCount: 0,
      createdAt: new Date()
    });
  }

  const memory = memoryStore.get(conversationId);
  memory.messageCount += 1;

  // Track topic from question type
  const topicMap = {
    'career_question': 'career direction',
    'marriage_question': 'marriage and partnerships',
    'relationship_struggle': 'relationship difficulties',
    'health_question': 'health concerns',
    'spiritual_question': 'spiritual growth',
    'fear_or_anxiety': 'anxiety and worry',
    'transit_specific_question': 'current life phase',
    'daily_horoscope': 'daily guidance',
    'general_life_question': 'general life outlook'
  };

  const topic = topicMap[questionType] || 'general life';
  if (!memory.recentTopics.includes(topic)) {
    memory.recentTopics.push(topic);
    // Keep only last 4 topics
    if (memory.recentTopics.length > 4) {
      memory.recentTopics.shift();
    }
  }

  // Detect emotional concerns from user message
  const msg = userMessage.toLowerCase();
  const emotionalKeywords = {
    'anxiety': /anxi|stress|worry|panic|scared|afraid|nervous/,
    'career confusion': /career|job|stuck|lost|direction/,
    'relationship pain': /break|divorce|hurt|lonely|partner left|cheat/,
    'self-doubt': /worthless|useless|fail|can'?t do|not good enough/,
    'spiritual seeking': /purpose|meaning|why am i|soul|dharma/,
    'financial worry': /money|debt|broke|financial|poor/
  };

  for (const [concern, pattern] of Object.entries(emotionalKeywords)) {
    if (pattern.test(msg) && !memory.emotionalConcerns.includes(concern)) {
      memory.emotionalConcerns.push(concern);
      if (memory.emotionalConcerns.length > 3) {
        memory.emotionalConcerns.shift();
      }
    }
  }

  // Detect tone preference
  if (/mantra|puja|remedy|god|temple|spiritual/i.test(msg)) {
    memory.tonePreference = 'spiritual';
  } else if (/practical|straight|direct|clear/i.test(msg)) {
    memory.tonePreference = 'practical';
  }
}

/**
 * Clears memory for a conversation (e.g., when deleted).
 * @param {string} conversationId
 */
function clearMemory(conversationId) {
  memoryStore.delete(conversationId);
}

/**
 * Gets raw memory object (for debugging/testing).
 * @param {string} conversationId
 * @returns {Object|null}
 */
function getRawMemory(conversationId) {
  return memoryStore.get(conversationId) || null;
}

module.exports = {
  getMemoryContext,
  updateMemory,
  clearMemory,
  getRawMemory
};
