import { Request, Response } from 'express';

export const chartController = {
  async calculateChart(req: Request, res: Response) {
    try {
      const { dateOfBirth, timeOfBirth, placeOfBirth } = req.body;
      
      // Temporary Mock: Return deterministic simulated chart data that satisfies the Chat logic expectations.
      res.json({
        success: true,
        moon: {
          sign_vedic: "Leo",
          nakshatra: "Magha",
          degree: 14.5,
          pada: 1
        },
        dasha_data: {
          current_mahadasha: "Ketu",
          mahadasha_end_date: "2032-05-14",
          current_antardasha: "Venus",
          antardasha_end_date: "2027-01-20"
        },
        meta: {
          current_date: new Date().toISOString().split('T')[0],
          current_weekday: new Date().toLocaleDateString('en-US', { weekday: 'long' })
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Chart calculation failed' });
    }
  }
};
