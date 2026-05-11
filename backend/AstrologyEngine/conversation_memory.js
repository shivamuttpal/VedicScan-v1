/**
 * CONVERSATION MEMORY — Pure Logic
 * 
 * This module provides logic for transforming conversational metadata into
 * human-like context strings and updating that metadata based on user messages.
 * 
 * Production Note: The actual storage (MongoDB) is handled by the Chat Controller.
 * This file stays purely logical and framework-independent.
 */

/**
 * Creates a memory context string from a memory object.
 * 
 * @param {Object} memory - The metadata object (from ChatSession model)
 * @returns {string} Natural language memory context
 */
function getMemoryContext(memory) {
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
 * Updates a conversational memory object after an exchange.
 * 
 * @param {Object} memory - The existing metadata object (will be mutated)
 * @param {string} userMessage - The user's latest message
 * @param {string} questionType - Detected from prompt_builder
 * @returns {Object} The updated memory object
 */
function updateMemory(memory, userMessage, questionType) {
  // Initialize if empty
  if (!memory) {
    memory = {
      recentTopics: [],
      emotionalConcerns: [],
      tonePreference: null,
      messageCount: 0
    };
  }

  memory.messageCount = (memory.messageCount || 0) + 1;

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
  if (!memory.recentTopics) memory.recentTopics = [];
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

  if (!memory.emotionalConcerns) memory.emotionalConcerns = [];
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

  return memory;
}

module.exports = {
  getMemoryContext,
  updateMemory
};
