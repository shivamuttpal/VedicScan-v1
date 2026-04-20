import { Request, Response } from 'express';
import { NamingService, NAKSHATRA_SYLLABLES } from '../service/naming.service';
import { NAKSHATRA_TABLE } from '../../compatibility/service/koota.service';
import { openaiService } from '../../chat/services/openai.service';

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
            const suggestedNames = NamingService.suggestNames(syllables, gender);

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
                const result = await openaiService.runAssistant(
                    await openaiService.createThread(), // Individual threads for explanations
                    500,
                    2
                );
                // Note: In a real flow, we'd add the prompt to the thread first.
                // But for a single-shot explanation, we can use a simpler helper if available.
                // For now, using the basic assistant run with the prompt as the first message.
                
                const threadId = await openaiService.createThread();
                await openaiService.addMessage(threadId, prompt);
                const runResult = await openaiService.runAssistant(threadId, 500, 2);
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
