import OpenAI from 'openai';
import config from '../../../config';
import Rashifal, { IRashifal } from '../model/rashifal.model';

const SIGNS = [
  'Mesh', 'Vrishabh', 'Mithun', 'Kark', 
  'Simha', 'Kanya', 'Tula', 'Vrishchik', 
  'Dhanu', 'Makar', 'Kumbh', 'Meen'
];

class RashifalService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Generates daily predictions for all 12 signs using OpenAI
   */
  async generateDailyRashifal(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      console.log(`🚀 Starting daily Rashifal generation for ${today} (${dayOfWeek})...`);

      // 1. Clear all old data (we only keep predictions for the current day)
      await Rashifal.deleteMany({});

      // 2. Prepare the prompt for batch generation
      const prompt = `Generate daily Vedic Astrology predictions (Rashifal) for all 12 zodiac signs for today, ${dayOfWeek}. 
      Return the data strictly as a JSON object with a key "predictions" which is an array of objects.
      Each object in the array must have these keys: "sign" (Sign Name), "prediction" (2-3 sentences max).
      Signs: ${SIGNS.join(', ')}.
      The tone should be wise, encouraging, and authentically Vedic. 
      Only return the JSON object, no extra text.`;

      const response = await this.client.chat.completions.create({
        model: config.openai.model || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('Failed to get content from OpenAI');

      // Parse JSON
      const parsed = JSON.parse(content);
      let predictions = parsed.predictions || parsed.signs || parsed.data || (Array.isArray(parsed) ? parsed : null);

      if (!predictions && typeof parsed === 'object') {
        // Find the first array in the object
        const firstArray = Object.values(parsed).find(v => Array.isArray(v));
        if (firstArray) predictions = firstArray;
      }

      if (!Array.isArray(predictions)) {
        console.error('Parsed object:', parsed);
        throw new Error('Invalid response format from OpenAI: Predictions array not found');
      }

      // 3. Save to database
      const docs = predictions.map((p: any) => ({
        sign: p.sign,
        prediction: p.prediction,
        date: today,
        dayOfWeek: dayOfWeek,
        createdAt: new Date()
      }));

      await Rashifal.insertMany(docs);
      console.log(`✅ Successfully generated and saved 12 predictions for ${today}`);

    } catch (error) {
      console.error('❌ Error generating daily Rashifal:', error);
      throw error;
    }
  }

  /**
   * Fetches the predictions for the current date
   */
  async getDailyRashifal(): Promise<IRashifal[]> {
    const today = new Date().toISOString().split('T')[0];
    let data = await Rashifal.find({ date: today });

    // If no data found (e.g. cron hasn't run), trigger generation
    if (data.length === 0) {
      await this.generateDailyRashifal();
      data = await Rashifal.find({ date: today });
    }

    return data;
  }
}

export const rashifalService = new RashifalService();
