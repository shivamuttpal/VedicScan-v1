import { Request, Response } from 'express';
import { NamingService, NAKSHATRA_SYLLABLES } from '../service/naming.service';
import { NAKSHATRA_TABLE } from '../../compatibility/service/koota.service';
import { openaiService } from '../../chat/services/openai.service';

// Lightweight system prompt for baby naming — keeps token usage minimal
const NAMING_SYSTEM_PROMPT = 'You are a Vedic naming expert. Return ONLY valid JSON arrays with no extra text. Each object must have exactly 4 fields: name, meaning, gender, origin.';
const EXPLAIN_SYSTEM_PROMPT = 'You are a Vedic naming expert. Provide spiritual and Vedic explanations for baby names in a respectful, warm tone. Keep explanations concise (150-250 words).';

export const babyNamingController = {
    /**
     * POST /api/baby-naming/generate
     */
    async generate(req: Request, res: Response) {
        try {
            const { dateOfBirth, timeOfBirth, placeOfBirth, gender } = req.body;

            if (!dateOfBirth || !gender) {
                res.status(400).json({ success: false, message: 'Birth details and gender are required.' });
                return;
            }

            // Deterministic Nakshatra & Pada calculation (high-fidelity mock)
            const nakshatras = Object.keys(NAKSHATRA_TABLE);
            const seed = (new Date(dateOfBirth).getDate() || 0) + (new Date(dateOfBirth).getMonth() || 0);
            const nakshatraName = nakshatras[seed % nakshatras.length];
            const pada = (seed % 4) + 1;

            const syllables = NamingService.getSyllables(nakshatraName, pada);
            let suggestedNames = NamingService.suggestNames(syllables, gender);

            // Generate using AI if static database returns empty (which is common)
            if (suggestedNames.length === 0 && openaiService.isConfigured()) {
                try {
                    const prompt = `Generate 5 highly auspicious, modern yet traditional Vedic baby names for a ${gender} child born in ${placeOfBirth} under Nakshatra ${nakshatraName} (Pada ${pada}). The names MUST start with the syllable "${syllables[0]}". 
                    Return ONLY a JSON array of objects, where each object has strictly 4 fields: "name", "meaning", "gender" (which should be "${gender}"), and "origin" (e.g. Sanskrit). Example: [{"name": "${syllables[0]}...","meaning":"...","gender":"${gender}","origin":"Sanskrit"}]`;
                    
                    const threadId = await openaiService.createThread();
                    await openaiService.addMessage(threadId, prompt);
                    const runResult = await openaiService.runAssistant(threadId, NAMING_SYSTEM_PROMPT, 500, 2);
                    
                    try {
                        const jsonMatch = runResult.response.match(/\[.*\]/s);
                        if (jsonMatch) {
                            suggestedNames = JSON.parse(jsonMatch[0]);
                        } else {
                            suggestedNames = JSON.parse(runResult.response);
                        }
                    } catch (parseError) {
                        console.error('Failed to parse AI names JSON:', parseError);
                    }
                } catch (aiError) {
                    console.error('AI Name generation failed:', aiError);
                }
            }

            res.json({
                success: true,
                nakshatra: nakshatraName,
                nakshatra_hindi: nakshatraName, // Placeholder for actual Hindi name
                pada: pada,
                allowed_syllables: syllables,
                suggested_names: suggestedNames
            });
        } catch (error) {
            console.error('Baby Naming Generate error:', error);
            res.status(500).json({ success: false, message: 'Internal server error during name generation.' });
        }
    },

    /**
     * POST /api/baby-naming/explain
     */
    async explain(req: Request, res: Response) {
        try {
            const { name, meaning, nakshatra, pada, syllable, gender } = req.body;

            if (!name) {
                res.status(400).json({ success: false, message: 'Name is required.' });
                return;
            }

            const prompt = `Please provide a spiritual and Vedic explanation for the baby name "${name}".
            
            Details:
            - Meaning: ${meaning}
            - Gender: ${gender}
            - Nakshatra: ${nakshatra} (Pada ${pada})
            - Auspicious Syllable: ${syllable}
            
            Please explain:
            1. The deeper meaning of the name in Sanskrit/Vedic context.
            2. How this name aligns with the energy of the ${nakshatra} Nakshatra.
            3. Why this choice is auspicious for the child's future.
            
            Format the response with clear headings and a respectful, spiritual tone.`;

            let explanation: string;

            if (openaiService.isConfigured()) {
                const threadId = await openaiService.createThread();
                await openaiService.addMessage(threadId, prompt);
                const runResult = await openaiService.runAssistant(threadId, EXPLAIN_SYSTEM_PROMPT, 500, 2);
                explanation = runResult.response;
            } else {
                explanation = `### Spiritual Significance of ${name}\n\n**${name}** means "${meaning}". \n\nThis name is particularly auspicious for children born under **${nakshatra} Nakshatra**. In Vedic tradition, names starting with the syllable **${syllable}** are said to harmonize with the child's lunar vibrations, bringing stability and prosperity. \n\n*Note: AI Assistant not configured for detailed spiritual deep-dives.*`;
            }

            res.json({
                success: true,
                explanation: explanation
            });
        } catch (error) {
            console.error('Baby Naming Explain error:', error);
            res.status(500).json({ success: false, message: 'Internal server error during explanation.' });
        }
    }
};
