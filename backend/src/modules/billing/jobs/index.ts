/**
 * Billing Background Jobs
 *
 * ─── Read this before adding a job ────────────────────────────────────────────
 * NONE of these jobs are required for correctness. That is a deliberate design
 * property, not an oversight:
 *
 *   • Daily/monthly quota resets happen automatically via period keys — a new
 *     window means a new key, so a fresh zeroed counter is created on demand.
 *   • Add-on expiry is enforced at read time by `expiresAt > now` filters.
 *   • Subscription expiry is enforced at read time by `isActiveNow()`.
 *
 * So if the scheduler dies, quotas still reset, add-ons still expire, and
 * subscriptions still lapse. These jobs only do housekeeping (pruning old rows),
 * reconciliation (catching missed webhooks) and retries.
 *
 * The alternative — cron-driven resets — breaks the moment a job fails, the
 * process restarts at midnight, or the app scales to multiple replicas that all
 * try to reset the same counters.
 *
 * ─── Multi-replica safety ─────────────────────────────────────────────────────
 * Every job here is idempotent, so concurrent execution across replicas is safe
 * but wasteful. Set BILLING_CRON_ENABLED=false on all but one instance, or move
 * to a distributed lock if the workload grows.
 */

import cron from 'node-cron';
import { purchaseRepository, subscriptionRepository, usageRepository, revenueCatEventRepository } from '../repositories';
import { revenueCatSyncService } from '../services';

/** Set BILLING_CRON_ENABLED=false on replicas that should not run jobs. */
const CRON_ENABLED = process.env.BILLING_CRON_ENABLED !== 'false';

/** How long closed usage windows are retained before pruning. */
const USAGE_RETENTION_DAYS = parseInt(process.env.USAGE_RETENTION_DAYS || '90', 10);

/** How long processed webhook events are retained for audit. */
const EVENT_RETENTION_DAYS = parseInt(process.env.EVENT_RETENTION_DAYS || '180', 10);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Flip lapsed add-on packs to `expired`.
 *
 * Reporting hygiene only — `findActiveForUser` already filters by date, so a
 * missed run cannot leak quota.
 */
export async function expireAddonPacks(): Promise<number> {
  const count = await purchaseRepository.markExpiredPurchases(new Date());
  if (count > 0) console.log(`[BillingCron] Marked ${count} add-on pack(s) expired.`);
  return count;
}

/**
 * Reconcile subscriptions whose expiry passed while still marked active.
 *
 * A row in this state means we never received the EXPIRATION webhook — dropped
 * delivery, an outage, or a misconfigured endpoint. Access has already stopped
 * (the expiry check in `isActiveNow()` handles that), so this only corrects the
 * stored status so reporting and support tooling show the truth.
 */
export async function reconcileLapsedSubscriptions(): Promise<number> {
  const lapsed = await subscriptionRepository.findLapsed(new Date());
  if (lapsed.length === 0) return 0;

  console.log(`[BillingCron] Reconciling ${lapsed.length} lapsed subscription(s)...`);

  let reconciled = 0;
  for (const sub of lapsed) {
    try {
      // Ask RevenueCat rather than assuming: the subscription may have renewed
      // and it is only our copy that is stale. Marking it expired blindly would
      // wrongly revoke access from a paying customer.
      const result = await revenueCatSyncService.syncFromRevenueCat(sub.userId.toString());
      if (!result.planCode) {
        await subscriptionRepository.markExpired(sub._id as any);
      }
      reconciled++;
    } catch (err) {
      console.error(`[BillingCron] Failed to reconcile user ${sub.userId}:`, err);
    }
  }

  return reconciled;
}

/**
 * Reprocess webhook events that previously failed.
 *
 * Typically these are events whose product ID was not yet mapped to a plan. Once
 * an operator adds the mapping, this replays them and the affected users get
 * their entitlements without any manual intervention.
 */
export async function retryFailedEvents(): Promise<number> {
  const events = await revenueCatEventRepository.findRetryable();
  if (events.length === 0) return 0;

  console.log(`[BillingCron] Retrying ${events.length} failed webhook event(s)...`);

  let succeeded = 0;
  for (const record of events) {
    try {
      // `reprocess: true` skips the idempotency claim. The event is already in
      // the log, so claiming it again would return `duplicate_ignored` and the
      // retry would do nothing while appearing to succeed.
      const result = await revenueCatSyncService.handleWebhookEvent(
        record.rawPayload as any,
        true
      );
      console.log(`[BillingCron]   ${record.eventId} → ${result}`);
      succeeded++;
    } catch (err: any) {
      await revenueCatEventRepository.markFailed(record.eventId, err?.message ?? 'Retry failed');
    }
  }

  return succeeded;
}

/** Prune closed usage windows past the retention horizon. */
export async function pruneOldUsageCounters(): Promise<number> {
  const cutoff = new Date(Date.now() - USAGE_RETENTION_DAYS * MS_PER_DAY);
  const deleted = await usageRepository.deleteExpiredBefore(cutoff);
  if (deleted > 0) console.log(`[BillingCron] Pruned ${deleted} old usage counter(s).`);
  return deleted;
}

/** Prune handled webhook events past the audit-retention horizon. */
export async function pruneOldEvents(): Promise<number> {
  const cutoff = new Date(Date.now() - EVENT_RETENTION_DAYS * MS_PER_DAY);
  const deleted = await revenueCatEventRepository.deleteProcessedBefore(cutoff);
  if (deleted > 0) console.log(`[BillingCron] Pruned ${deleted} old webhook event(s).`);
  return deleted;
}

/** Run every job once. Exposed for manual invocation and tests. */
export async function runBillingCronJobs(): Promise<void> {
  await expireAddonPacks();
  await reconcileLapsedSubscriptions();
  await retryFailedEvents();
  await pruneOldUsageCounters();
  await pruneOldEvents();
}

/**
 * Register the billing schedule. Called once at server startup.
 *
 * Each job is wrapped so a throw cannot take down the scheduler and silently
 * stop every other job.
 */
export function registerBillingCronJobs(): void {
  if (!CRON_ENABLED) {
    console.log('[BillingCron] Disabled via BILLING_CRON_ENABLED=false.');
    return;
  }

  const safe = (name: string, fn: () => Promise<unknown>) => async () => {
    try {
      await fn();
    } catch (err) {
      console.error(`[BillingCron] Job "${name}" failed:`, err);
    }
  };

  // Hourly — expire add-on packs shortly after the billing-day boundary.
  cron.schedule('5 * * * *', safe('expireAddonPacks', expireAddonPacks));

  // Every 30 minutes — retry events awaiting a plan mapping fix.
  cron.schedule('*/30 * * * *', safe('retryFailedEvents', retryFailedEvents));

  // Every 6 hours — reconcile against RevenueCat for missed webhooks.
  cron.schedule('0 */6 * * *', safe('reconcileLapsedSubscriptions', reconcileLapsedSubscriptions));

  // Daily at 03:15 — retention pruning, off-peak.
  cron.schedule(
    '15 3 * * *',
    safe('prune', async () => {
      await pruneOldUsageCounters();
      await pruneOldEvents();
    })
  );

  console.log(
    '[BillingCron] Scheduled: addon expiry (hourly), event retry (30m), reconciliation (6h), pruning (daily 03:15).'
  );
}
