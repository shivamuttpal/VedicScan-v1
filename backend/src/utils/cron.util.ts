import cron from 'node-cron';
import { rashifalService } from '../modules/rashifal/services/rashifal.service';
import { runSubscriptionLifecycle } from './subscriptionLifecycle.util';

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

  // Subscription Lifecycle Check — every 6 hours
  // Sends expiry warning emails (3 days before), expires plans, sends expired emails
  cron.schedule('0 */6 * * *', async () => {
    try {
      await runSubscriptionLifecycle();
    } catch (error) {
      console.error('Failed to run subscription lifecycle cron job:', error);
    }
  });

  console.log('✅ Cron Jobs Scheduled: [Daily Rashifal, Subscription Lifecycle (every 6h)]');
};
