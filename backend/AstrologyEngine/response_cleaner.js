/**
 * RESPONSE CLEANER
 * 
 * LLMs sometimes output markdown formatting even when told not to:
 *   - **bold text**
 *   - ## headings
 *   - - bullet points
 *   - numbered lists
 *   - excessive newlines
 *   - AI-style phrases like "As an AI..." or "Based on your data..."
 * 
 * This module strips all of that to ensure Maharshi sounds human.
 */

/**
 * Cleans the raw LLM response of formatting artifacts.
 * @param {string} text - Raw response from the LLM
 * @returns {string} Clean, human-sounding text
 */
function cleanResponse(text) {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text
    // Remove markdown bold / italic
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    // Remove markdown headings
    .replace(/^#{1,6}\s*/gm, '')
    // Remove bullet points (dash, asterisk, or numbered lists)
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Collapse excessive newlines (3+ → 2)
    .replace(/\n{3,}/g, '\n\n')
    // Remove leading/trailing whitespace
    .trim();

  // Remove common AI phrases
  const aiPhrases = [
    /as an ai[^.]*\./gi,
    /based on (your|the) (data|chart|information)[^.]*\./gi,
    /i('m| am) an ai[^.]*\./gi,
    /according to (your|the) (astrological |birth )?chart[^.]*,?\s*/gi,
    /i don'?t have personal (opinions|feelings|experiences)[^.]*\./gi,
    /please (note|remember) that[^.]*\./gi,
    /disclaimer:[^.]*\./gi,
  ];

  for (const phrase of aiPhrases) {
    cleaned = cleaned.replace(phrase, '');
  }

  // Clean up any resulting double spaces
  cleaned = cleaned.replace(/  +/g, ' ');

  // Collapse any newly created excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

module.exports = { cleanResponse };
