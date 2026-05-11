/**
 * Chat Prompts — DEPRECATED
 * 
 * The system prompt is now built dynamically by the AstrologyEngine pipeline:
 *   AstrologyEngine/prompt_builder.js → buildSystemPrompt()
 * 
 * This file is kept for backward compatibility but is no longer used
 * in the production chat flow.
 * 
 * See: AstrologyEngine/prompt_builder.js
 * See: AstrologyEngine/vedic-astrology-data/persona/astrologer_persona.json
 */

// Legacy export — no longer imported by openai.service.ts
export const SYSTEM_PROMPT = `You are Maharshi, an experienced Vedic astrologer.
This prompt is deprecated. The system prompt is now dynamically built by AstrologyEngine/prompt_builder.js.`;
