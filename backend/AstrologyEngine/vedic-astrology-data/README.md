# Vedic Astrology Interpretation Engine - Dataset

Complete JSON dataset for building a Vedic Astrology AI app that follows the architecture:

```
Birth Data → Astrology Engine → Raw Planetary Data → Interpretation Engine → Human Meaning Extraction → Persona Prompt → LLM
```

## File Structure

```
vedic-astrology-data/
├── interpretation_engine.js          # Sample JS engine showing how to use the data
├── signs/
│   ├── moon_in_signs.json            # Moon in 12 signs (emotions)
│   ├── sun_in_signs.json             # Sun in 12 signs (identity/ego)
│   ├── ascendant_signs.json          # Ascendant in 12 signs (personality)
│   ├── planets_in_signs.json         # Mars/Mercury/Jupiter/Venus/Saturn in signs
│   └── rahu_ketu_in_signs.json       # Karmic nodes in 12 signs
├── houses/
│   └── houses.json                   # All 12 houses (Bhavas)
├── planets/
│   ├── planets_in_houses.json        # 108 combos (9 planets × 12 houses)
│   ├── planetary_states.json         # Friendships, combustion, dignity
│   └── retrograde_planets.json       # Retrograde meanings
├── dashas/
│   ├── mahadashas.json               # 9 Vimshottari mahadashas (120 yrs cycle)
│   └── antardashas.json              # Sub-period modifiers
├── nakshatras/
│   └── nakshatras.json               # All 27 nakshatras
├── yogas/
│   └── yogas.json                    # 20+ major yogas (Pancha Mahapurusha, Raja, Dhana, Doshas)
├── aspects/
│   └── planet_aspects.json           # Drishti (aspect) rules and interpretations
├── transits/
│   └── transits.json                 # Sade Sati, Jupiter, Rahu-Ketu transits
├── remedies/
│   └── remedies.json                 # Mantras, gems, donations, fasting by planet
├── persona/
│   └── astrologer_persona.json       # LLM system prompts for astrologer personas
├── combinations/
│   └── life_area_synthesis.json      # How to combine factors for life questions
└── prompts/
    └── prompt_templates.json         # Templates by question type
```

## How It Works

### Layer 1: Astrology Engine (Pure Calculation)
Use Swiss Ephemeris (or similar) to compute raw chart data from birth details:
```json
{
  "moonSign": "Virgo",
  "ascendant": "Sagittarius",
  "currentMahadasha": "saturn",
  "currentAntardasha": "venus",
  "planetHouses": {"saturn": 3, "rahu": 7},
  "sadeSati": true
}
```

### Layer 2: Interpretation Engine (This Dataset)
Maps raw data to human themes using these JSON dictionaries:
```json
{
  "emotional_patterns": ["overthinks emotions", "struggles expressing vulnerability"],
  "relationship_patterns": ["feels emotionally disconnected", "attracts karmic connections"],
  "life_phase": ["learning detachment", "internal transformation"]
}
```

### Layer 3: Persona Prompt
Wraps the human context in the astrologer persona (Maharshi, etc.) before sending to the LLM.

### Layer 4: LLM (Claude, GPT, etc.)
Receives clean human context and generates warm, natural responses without needing to understand Vedic astrology.

## Quick Start

```javascript
const { buildHumanContext, buildPrompt } = require('./interpretation_engine');

// 1. Get raw chart from your astrology engine
const rawChart = {
  moonSign: 'Virgo',
  sunSign: 'Leo',
  ascendant: 'Sagittarius',
  // ... full chart data
};

// 2. Generate human context
const context = buildHumanContext(rawChart);

// 3. Build prompt for LLM
const prompt = buildPrompt(context, "How is 2026 for me?", "general_life_question");

// 4. Send to your LLM
const response = await yourLLM.complete(prompt);
```

## Coverage Statistics

- **108 planet-in-house combinations** (9 planets × 12 houses)
- **132+ planet-in-sign combinations** (across Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu)
- **27 nakshatras** with full personality patterns
- **12 houses** with all life themes
- **9 mahadashas** with sub-period modifiers
- **20+ major yogas** including Panch Mahapurusha, Raja, Dhana, and Doshas
- **9 planet remedies** with mantras, gems, donations, fasting
- **Transit data** for Sade Sati, Jupiter, Rahu-Ketu
- **4 astrologer personas** (Maharshi, modern, traditional, counselor)
- **10+ question type templates** (career, marriage, health, spiritual, etc.)

## Key Design Principles

1. **No raw jargon to user**: The interpretation engine translates "Saturn Mahadasha + Moon Virgo" into "phase of emotional maturity and introspection"

2. **LLM as narrator only**: Astrology logic happens BEFORE the LLM. The LLM only handles tone, empathy, and natural language.

3. **Tone-aware**: Different personas for different user moods (anxious, excited, spiritual seeker, etc.)

4. **Safety-first**: Never predicts death, specific medical conditions, or guaranteed outcomes. Always frames challenges as growth.

5. **Modular**: Add more JSON files (e.g., divisional charts, more yogas) without changing the engine.

## Extending the Dataset

To add new interpretations:
1. Create JSON in matching schema
2. Add an interpreter function in `interpretation_engine.js`
3. Call it in `buildHumanContext()`

## Architecture Inspiration

This follows the production pattern of leading Vedic astrology AI apps:
- Pre-compute interpretation (not GPT's job)
- Use LLM as conversational layer only
- Modular, scalable, accurate

> "Real astrology AI apps are NOT 'GPT knows astrology'. They are structured emotional interpretation systems where GPT is only the narrator."
