import cron from 'node-cron';
import { rashifalService } from '../modules/rashifal/services/rashifal.service';

/**
 * Initializes all cron jobs for the application
 */
export const initCronJobs = () => {
  console.log('⏰ Initializing Cron Jobs...');

  // Daily Rashifal Generation at 00:00 (Midnight)
  cron.schedule('0 0 * * *', async () => {
    try {
      await rashifalService.generateDailyRashifal();
    } catch (error) {
      console.error('Failed to run daily Rashifal cron job:', error);
    }
  });

  console.log('✅ Cron Jobs Scheduled: [Daily Rashifal]');
};
