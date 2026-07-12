import { Request, Response } from 'express';
import { calculateFullChart } from '../services/chartEngine.service';

export const chartController = {
  async calculateChart(req: Request, res: Response) {
    try {
      const { dateOfBirth, timeOfBirth, placeOfBirth, timezoneOffset } = req.body;

      // Run the Vedic engine (geocode + Python bridge) via the shared service
      const pyResult = await calculateFullChart({ dateOfBirth, timeOfBirth, placeOfBirth, timezoneOffset });

      const { chart_data, dasha_data, meta } = pyResult;
      const moonPlanet = chart_data.Planets.Moon;

      // Normalize all planets to a flat, consistent shape
      const planets: Record<string, any> = {};
      for (const [name, p] of Object.entries<any>(chart_data.Planets)) {
        planets[name] = {
          rashi: p.rashi,
          nakshatra: p.nakshatra,
          degree: parseFloat((p.degree_in_rashi ?? p.absolute_degree).toFixed(4)),
          pada: p.pada ?? null,
          absolute_degree: parseFloat(p.absolute_degree.toFixed(4)),
        };
      }

      res.json({
        success: true,
        // Kept for backward-compat with existing frontend / mobile consumers
        moon: {
          sign_vedic: moonPlanet.rashi,
          nakshatra: moonPlanet.nakshatra,
          degree: parseFloat(moonPlanet.degree_in_rashi.toFixed(4)),
          pada: moonPlanet.pada,
        },
        lagna: {
          sign: chart_data.Lagna.sign,
          degree: parseFloat(chart_data.Lagna.degree.toFixed(4)),
        },
        planets,
        dasha_data,
        meta: {
          current_date: meta.current_date,
          current_weekday: meta.current_weekday,
        },
      });
    } catch (error: any) {
      console.error('[chart] calculation error:', error.message);
      res.status(500).json({ success: false, message: 'Chart calculation failed' });
    }
  },
};
