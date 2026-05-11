# AstrologyEngine — Production Architecture

## Pipeline

```
Swiss Ephemeris / Chart Data
       ↓
Interpretation Engine      → Converts placements to meanings
       ↓
Theme Aggregator           → Combines meanings into emotional themes
       ↓
Prompt Builder             → Creates final AI prompt (the brain)
       ↓
Claude / OpenAI            → Only does storytelling, NOT astrology
       ↓
Response Cleaner           → Removes AI-style formatting
       ↓
Frontend Chat Response
```

## File Structure

```
AstrologyEngine/
│
├── vedic-astrology-data/       ← All JSON interpretation dictionaries
│   ├── signs/                  ← Moon, Sun, Ascendant, Planets, Rahu-Ketu in signs
│   ├── houses/                 ← House meanings
│   ├── planets/                ← Planets in houses, retrograde, combustion
│   ├── dashas/                 ← Mahadasha & Antardasha meanings
│   ├── nakshatras/             ← 27 Nakshatra interpretations
│   ├── yogas/                  ← Raja, Dhana, Dosha yogas
│   ├── aspects/                ← Planetary aspects
│   ├── transits/               ← Sade Sati, Jupiter transit, Rahu-Ketu transit
│   ├── remedies/               ← Mantras, gemstones, remedial measures
│   ├── combinations/           ← Life area synthesis rules
│   ├── persona/                ← Maharshi persona definition
│   └── prompts/                ← Question-type prompt templates
│
├── interpretation_engine.js    ← Converts chart → structured theme items
├── theme_aggregator.js         ← Compresses themes into emotional buckets
├── prompt_builder.js           ← THE BRAIN — builds final AI prompt
├── response_cleaner.js         ← Strips AI formatting from output
├── conversation_memory.js      ← Stores user context per conversation
└── chat_orchestrator.js        ← Main pipeline entry point
```

## Architecture Principle

**Before (wrong):**  GPT interprets astrology + speaks naturally  
**Now (correct):**   Our engine interprets astrology → GPT only speaks naturally

The LLM never sees raw planetary data. It only receives:
- Compressed emotional themes
- Relevant active energies  
- Conversational context

## How It Works

### 1. `interpretation_engine.js`
Reads the raw chart (moon sign, planet positions, dashas, yogas, etc.) and looks up each placement in the JSON data files. Returns an array of structured interpretation items.

### 2. `theme_aggregator.js`
Takes the interpretation array and compresses it into themed buckets:
- `emotionalThemes` — how the person feels
- `relationshipThemes` — partnership dynamics
- `careerThemes` — work energy
- `spiritualThemes` — soul themes
- `strengths` / `challenges` — key patterns
- `currentEnergy` — active dasha/transit themes

### 3. `prompt_builder.js` (THE BRAIN)
- Detects question type (career, marriage, health, spiritual, etc.)
- Selects appropriate tone from persona data
- Builds compressed emotional context (NO raw JSON, NO planet names)
- Creates system + user prompt for the LLM
- Enforces production rules (no bullets, no headings, human-like delivery)

### 4. `response_cleaner.js`
Strips: `**bold**`, `## headings`, `- bullets`, AI phrases like "As an AI..."

### 5. `conversation_memory.js`
Pure logic for managing conversational metadata:
- Tracks recent topics (career, love, etc.)
- Detects emotional concerns from user input
- Remembers tone preferences
- Produces natural language context strings

**Note:** This module is purely functional. The actual state is persisted in the **MongoDB ChatSession model** by the backend controller.

### 6. `chat_orchestrator.js`
Wires everything together. Single entry point: `buildMaharshiPrompt({ userQuestion, chartData, memory, isFirstMessage })`.
Returns `{ prompt, updatedMemory }`.

## Usage from Backend

```typescript
// In chat controller / service:
const { buildMaharshiPrompt, cleanLLMResponse } = require('../../AstrologyEngine/chat_orchestrator');

const prompt = buildMaharshiPrompt({
  userQuestion: "How is 2026 for me?",
  chartData: rawChartObject,
  conversationId: "abc-123"
});

// prompt.system → System prompt for LLM
// prompt.user   → User message with compressed themes
// prompt.questionType → "general_life_question"

// After LLM response:
const cleaned = cleanLLMResponse(rawLLMOutput);
```

## Example Output

For a chart with Saturn Dasha, Moon in Virgo, Rahu in 7th house:

**Themes produced:**
```json
{
  "emotionalThemes": [
    "emotional heaviness and isolation",
    "overthinks emotions instead of feeling them",
    "self-critical inner voice"
  ],
  "relationshipThemes": [
    "delays in marriage or relationship commitments",
    "confused in relationships, intense karmic ties"
  ],
  "careerThemes": [
    "slow but steady professional growth",
    "excels in detail-oriented work"
  ]
}
```

**Maharshi response:**
> "2026 feels emotionally transformative for you. I sense this year slowly changes how you connect with people emotionally. Some relationships may naturally distance themselves, but that distance seems necessary for your emotional clarity. Career growth appears gradual rather than sudden, but the second half of the year feels more stable internally. Have you already started feeling emotionally detached from certain expectations recently?"
