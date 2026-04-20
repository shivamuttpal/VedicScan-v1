import { Request, Response } from 'express';
import { rashifalService } from '../services/rashifal.service';
import { successResponse, errorResponse } from '../../../utils/response.util';

export const getDailyRashifal = async (req: Request, res: Response) => {
  try {
    const data = await rashifalService.getDailyRashifal();
    return successResponse(res, data, 'Daily Rashifal fetched successfully');
  } catch (error: any) {
    console.error('Error in getDailyRashifal controller:', error);
    return errorResponse(res, error.message || 'Failed to fetch daily Rashifal', 500);
  }
};

export const triggerDailyGeneration = async (req: Request, res: Response) => {
  try {
    await rashifalService.generateDailyRashifal();
    return successResponse(res, null, 'Daily Rashifal generation triggered successfully');
  } catch (error: any) {
    return errorResponse(res, error.message || 'Failed to trigger generation', 500);
  }
};
