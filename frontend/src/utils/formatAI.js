/**
 * Utility functions for formatting AI responses
 */

/**
 * Remove markdown formatting from AI responses
 * Strips ** (bold), * (italic), ``` (code blocks), etc.
 */
export const stripMarkdown = (text) => {
  if (!text) return '';
  
  return text
    // Remove bold markers **text** or __text__
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Remove italic markers *text* or _text_
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove code blocks ```text```
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ''))
    // Remove inline code `text`
    .replace(/`([^`]+)`/g, '$1')
    // Remove heading markers # ## ### etc.
    .replace(/^#{1,6}\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Format AI response for display
 * - Strips markdown
 * - Converts line breaks to HTML <br> tags
 * - Converts section headers (ALL CAPS:) to bold
 * - Removes unnecessary follow-up question text
 */
export const formatAIResponse = (text) => {
  if (!text) return '';
  
  let formatted = text;
  
  // Remove any apology messages about HTML formatting
  formatted = formatted.replace(/I'm sorry.*?HTML tags.*?\n/gi, '');
  formatted = formatted.replace(/I can't assist with.*?markup.*?\n/gi, '');
  
  // Remove followup_questions lines if they say "None required" or similar
  formatted = formatted.replace(/followup_questions?:?\s*(None|N\/A|None required|Not applicable).*?\n?/gi, '');
  formatted = formatted.replace(/follow[_-]?up[_-]?questions?:?\s*(None|N\/A|None required|Not applicable).*?\n?/gi, '');
  
  // Convert **text** to bold
  formatted = formatted
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/__([^_]+)__/g, '<b>$1</b>');
  
  // Convert section headers (ALL CAPS followed by colon) to bold
  formatted = formatted.replace(/^([A-Z][A-Z\s&]+):$/gm, '<b>$1</b>');
  formatted = formatted.replace(/\n([A-Z][A-Z\s&]+):\n/g, '\n<b>$1</b>\n');
  
  // Remove italic markers
  formatted = formatted
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1');
  
  // Remove code blocks
  formatted = formatted
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ''))
    .replace(/`([^`]+)`/g, '$1');
  
  // Remove heading markers
  formatted = formatted.replace(/^#{1,6}\s+/gm, '');
  
  // Convert newlines to <br> tags for proper display
  formatted = formatted
    .split('\n\n').join('<br><br>')
    .split('\n').join('<br>');
  
  // Clean up excessive <br> tags
  formatted = formatted
    .replace(/(<br>){3,}/g, '<br><br>')
    .trim();
  
  return formatted;
};

export default { stripMarkdown, formatAIResponse };
