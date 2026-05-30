import { Request, Response } from 'express';
import { kundaliService } from '../services/kundali.service';
import { generateKundaliPDF } from '../services/pdf.service';

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const kundaliController = {
  async generate(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { name, dateOfBirth, timeOfBirth, placeOfBirth, timezoneOffset, forceRegenerate } = req.body;

      if (!name || !dateOfBirth || !timeOfBirth || !placeOfBirth) {
        return res.status(400).json({
          success: false,
          message: 'name, dateOfBirth, timeOfBirth, and placeOfBirth are required',
        });
      }

      const kundali = await kundaliService.generate({
        userId,
        name,
        dateOfBirth,
        timeOfBirth,
        placeOfBirth,
        timezoneOffset: timezoneOffset ?? 5.5,
        forceRegenerate: !!forceRegenerate,
      });

      res.json({
        success: true,
        message: 'Kundali generated successfully',
        data: kundali,
      });
    } catch (error: any) {
      console.error('[kundali] generate error:', error.message);
      res.status(500).json({ success: false, message: error.message || 'Kundali generation failed' });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const kundali = await kundaliService.getById(id, userId);
      if (!kundali) {
        return res.status(404).json({ success: false, message: 'Kundali not found' });
      }

      res.json({ success: true, data: kundali });
    } catch (error: any) {
      console.error('[kundali] getById error:', error.message);
      res.status(500).json({ success: false, message: 'Failed to fetch kundali' });
    }
  },

  async list(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const kundalis = await kundaliService.getByUser(userId);
      res.json({ success: true, data: kundalis });
    } catch (error: any) {
      console.error('[kundali] list error:', error.message);
      res.status(500).json({ success: false, message: 'Failed to list kundalis' });
    }
  },

  async downloadPDF(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const kundali = await kundaliService.getById(id, userId);
      if (!kundali) {
        return res.status(404).json({ success: false, message: 'Kundali not found' });
      }

      const pdfBuffer = await generateKundaliPDF(kundali);
      const filename = `VedicScan_Kundali_${kundali.name.replace(/\s+/g, '_')}_${kundali.dateOfBirth}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (error: any) {
      console.error('[kundali] pdf error:', error.message);
      res.status(500).json({ success: false, message: 'PDF generation failed' });
    }
  },

  async deleteKundali(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const deleted = await kundaliService.deleteById(id, userId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Kundali not found' });
      }
      res.json({ success: true, message: 'Kundali deleted successfully' });
    } catch (error: any) {
      console.error('[kundali] delete error:', error.message);
      res.status(500).json({ success: false, message: 'Failed to delete kundali' });
    }
  },
};
