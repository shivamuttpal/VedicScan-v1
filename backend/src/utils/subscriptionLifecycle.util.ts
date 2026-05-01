/**
 * Subscription Lifecycle Service
 * 
 * Handles automated subscription lifecycle events:
 * 1. Send expiry warning emails (~3 days before plan ends)
 * 2. Expire plans and send expiry notification emails
 * 3. Revert isSubscriber flag on user model
 * 4. Respects emailUnsubscribed preference
 * 
 * Designed to be idempotent — safe to run multiple times
 * without sending duplicate emails (tracked via expiryWarningNotified / expiryNotified).
 */

import { UserUsage } from '../modules/subscription/model/subscription.model';
import { User } from '../modules/user/model/user.model';
import { sendFallbackEmail } from './mail.util';
import {
  getExpiryWarningEmailHtml,
  getExpiredEmailHtml,
  LIFECYCLE_SUBJECTS,
} from './subscriptionEmails.util';
import crypto from 'crypto';

/**
 * Generate a simple unsubscribe token from userId.
 * In production, use a proper JWT or HMAC for security.
 */
const generateUnsubscribeToken = (userId: string): string => {
  return Buffer.from(`unsub:${userId}:${Date.now()}`).toString('base64url');
};

/**
 * Process expiring-soon subscriptions (3 days before planEndDate)
 * 
 * Finds users whose plan will end within the next 3 days
 * and who haven't been notified yet.
 */
export const processExpiryWarnings = async (): Promise<number> => {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  try {
    // Find active subscriptions expiring within 3 days, not yet warned
    const expiringUsages = await UserUsage.find({
      plan: { $ne: 'free' },
      planEndDate: { $lte: threeDaysFromNow, $gt: now },
      expiryWarningNotified: { $ne: true },
    }).limit(100); // Process in batches

    let sentCount = 0;

    for (const usage of expiringUsages) {
      try {
        const user = await User.findById(usage.userId);
        if (!user || !user.email) continue;

        // Respect unsubscribe preference
        if (!user.emailUnsubscribed) {
          const token = generateUnsubscribeToken(user._id.toString());
          const html = getExpiryWarningEmailHtml(
            user.firstName || 'there',
            usage.plan,
            usage.planEndDate!,
            token
          );
          const subject = LIFECYCLE_SUBJECTS.expiryWarning(usage.plan);

          await sendFallbackEmail(user.email, subject, html);
          sentCount++;
        }

        // Mark as notified regardless of unsubscribe preference
        // so we don't re-process this user
        usage.expiryWarningNotified = true;
        await usage.save();
      } catch (err) {
        console.error(`[SubscriptionLifecycle] Warning email failed for user ${usage.userId}:`, err);
      }
    }

    if (sentCount > 0) {
      console.log(`[SubscriptionLifecycle] Sent ${sentCount} expiry warning emails`);
    }

    return sentCount;
  } catch (error) {
    console.error('[SubscriptionLifecycle] processExpiryWarnings error:', error);
    return 0;
  }
};

/**
 * Process expired subscriptions
 * 
 * Finds users whose planEndDate has passed, reverts them to free,
 * and sends an expiry notification email.
 */
export const processExpiredSubscriptions = async (): Promise<number> => {
  const now = new Date();

  try {
    // Find expired subscriptions that haven't been fully processed
    const expiredUsages = await UserUsage.find({
      plan: { $ne: 'free' },
      planEndDate: { $lte: now },
    }).limit(100);

    let processedCount = 0;

    for (const usage of expiredUsages) {
      try {
        const user = await User.findById(usage.userId);

        // Send expiry email if not already sent
        if (!usage.expiryNotified && user?.email && !user.emailUnsubscribed) {
          const token = generateUnsubscribeToken(user._id.toString());
          const html = getExpiredEmailHtml(
            user.firstName || 'there',
            usage.plan,
            token
          );
          const subject = LIFECYCLE_SUBJECTS.expired(usage.plan);

          await sendFallbackEmail(user.email, subject, html);
        }

        // Store previous plan for analytics, then revert
        usage.previousPlan = usage.plan;
        usage.plan = 'free';
        usage.billingCycle = 'none';
        usage.expiryNotified = true;
        await usage.save();

        // Revert isSubscriber on the user model
        if (user) {
          user.isSubscriber = false;
          await user.save();
        }

        processedCount++;
        console.log(`[SubscriptionLifecycle] Expired plan for user ${usage.userId} (was: ${usage.previousPlan})`);
      } catch (err) {
        console.error(`[SubscriptionLifecycle] Expiry processing failed for user ${usage.userId}:`, err);
      }
    }

    if (processedCount > 0) {
      console.log(`[SubscriptionLifecycle] Processed ${processedCount} expired subscriptions`);
    }

    return processedCount;
  } catch (error) {
    console.error('[SubscriptionLifecycle] processExpiredSubscriptions error:', error);
    return 0;
  }
};

/**
 * Run the full subscription lifecycle check.
 * Called by the cron job every 6 hours.
 */
export const runSubscriptionLifecycle = async (): Promise<void> => {
  console.log('[SubscriptionLifecycle] Running lifecycle check...');
  const startTime = Date.now();

  const warnings = await processExpiryWarnings();
  const expired = await processExpiredSubscriptions();

  const duration = Date.now() - startTime;
  console.log(`[SubscriptionLifecycle] Complete in ${duration}ms — ${warnings} warnings sent, ${expired} plans expired`);
};
