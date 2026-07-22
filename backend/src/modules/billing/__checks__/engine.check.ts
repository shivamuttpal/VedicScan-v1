/**
 * Billing Engine Verification
 *
 * Exercises the quota engine end-to-end against an EPHEMERAL in-memory MongoDB.
 * It never connects to a configured database, so it is safe to run anywhere.
 *
 *   npx ts-node --transpile-only src/modules/billing/__checks__/engine.check.ts
 *
 * Covers the behaviours that are easy to get wrong and expensive to get wrong:
 * concurrency, add-on stacking, period rollover, one-time-unlock idempotency,
 * and webhook replay.
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.log(`FAIL  ${label}\n        actual   = ${a}\n        expected = ${e}`);
    failures++;
  } else {
    console.log(`ok    ${label}  => ${a}`);
  }
};

async function main() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'billing_check' });
  console.log('Connected to ephemeral MongoDB\n');

  // Import AFTER connecting so models bind to this connection.
  const { seedBillingData } = await import('../seeds/billing.seed');
  const { entitlementService } = await import('../services/entitlement.service');
  const { usageService } = await import('../services/usage.service');
  const { UserSubscription, Purchase, FeatureUnlock } = await import('../models');
  const { FEATURE_KEYS, PLAN_CODES } = await import('../constants');
  const { endOfBillingDay } = await import('../utils/period.util');

  await seedBillingData(true);
  console.log('');

  const freeUser = new mongoose.Types.ObjectId().toString();
  const paidUser = new mongoose.Types.ObjectId().toString();

  // ─── 1. Free plan resolution ────────────────────────────────────────────────
  console.log('── Free plan ──');
  const free = await entitlementService.resolve(freeUser);
  check('free user lands on free plan', free.plan.code, PLAN_CODES.FREE);
  check('free user is not premium', free.isPremium, false);
  check(
    'free plan excludes detailed kundali report',
    free.features.has(FEATURE_KEYS.KUNDALI_REPORT),
    false
  );
  check(
    'free plan grants 1 lifetime basic kundali',
    free.features.get(FEATURE_KEYS.KUNDALI_BASIC)?.totalLimit,
    1
  );

  // Free user's single lifetime basic kundali
  const k1 = await usageService.consume(freeUser, FEATURE_KEYS.KUNDALI_BASIC);
  check('free user 1st basic kundali allowed', k1.allowed, true);
  const k2 = await usageService.consume(freeUser, FEATURE_KEYS.KUNDALI_BASIC);
  check('free user 2nd basic kundali denied', k2.allowed, false);
  check(
    '2nd denial reason is quota_exhausted',
    !k2.allowed && k2.reason,
    'quota_exhausted'
  );

  const locked = await usageService.consume(freeUser, FEATURE_KEYS.KUNDALI_REPORT);
  check(
    'free user detailed report is feature_locked (not quota)',
    !locked.allowed && locked.reason,
    'feature_not_in_plan'
  );

  // ─── 2. Standard subscription ───────────────────────────────────────────────
  console.log('\n── Standard Monthly ──');
  await UserSubscription.create({
    userId: new mongoose.Types.ObjectId(paidUser),
    planCode: PLAN_CODES.STANDARD_MONTHLY,
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 864e5),
    willRenew: true,
    lastEventTimestampMs: Date.now(),
  });

  const paid = await entitlementService.resolve(paidUser);
  check('paid user resolves to standard_monthly', paid.plan.code, PLAN_CODES.STANDARD_MONTHLY);
  check('paid user is premium', paid.isPremium, true);
  check('standard grants 11 daily chats', paid.features.get(FEATURE_KEYS.AI_CHAT)?.totalLimit, 11);
  check(
    'baby naming is unlimited on standard',
    paid.features.get(FEATURE_KEYS.BABY_NAMING)?.unlimited,
    true
  );

  // Burn the daily chat allowance
  let allowedCount = 0;
  for (let i = 0; i < 13; i++) {
    const r = await usageService.consume(paidUser, FEATURE_KEYS.AI_CHAT);
    if (r.allowed) allowedCount++;
  }
  check('exactly 11 of 13 chat attempts allowed', allowedCount, 11);

  // Unlimited features are never blocked
  let babyAllowed = 0;
  for (let i = 0; i < 50; i++) {
    const r = await usageService.consume(paidUser, FEATURE_KEYS.BABY_NAMING);
    if (r.allowed) babyAllowed++;
  }
  check('unlimited baby naming never blocks', babyAllowed, 50);

  // ─── 3. Add-on stacking ─────────────────────────────────────────────────────
  console.log('\n── Add-on Pack ──');
  await Purchase.create({
    userId: new mongoose.Types.ObjectId(paidUser),
    planCode: PLAN_CODES.ADDON_PACK,
    transactionId: 'txn_check_1',
    platform: 'play_store',
    grants: [
      { featureKey: FEATURE_KEYS.AI_CHAT, granted: 5, remaining: 5 },
      { featureKey: FEATURE_KEYS.KUNDALI_REPORT, granted: 1, remaining: 1 },
      { featureKey: FEATURE_KEYS.COMPATIBILITY_REPORT, granted: 1, remaining: 1 },
    ],
    purchasedAt: new Date(),
    expiresAt: endOfBillingDay(new Date()),
  });

  const boosted = await entitlementService.resolve(paidUser);
  check(
    'add-on stacks on top of plan (11 + 5)',
    boosted.features.get(FEATURE_KEYS.AI_CHAT)?.totalLimit,
    16
  );

  let addonAllowed = 0;
  for (let i = 0; i < 6; i++) {
    const r = await usageService.consume(paidUser, FEATURE_KEYS.AI_CHAT);
    if (r.allowed) addonAllowed++;
  }
  check('exactly 5 further chats allowed from add-on', addonAllowed, 5);

  const drained = await Purchase.findOne({ transactionId: 'txn_check_1' });
  check(
    'add-on chat grant fully consumed',
    drained?.grants.find((g) => g.featureKey === FEATURE_KEYS.AI_CHAT)?.remaining,
    0
  );
  check(
    'untouched add-on grants remain intact',
    drained?.grants.find((g) => g.featureKey === FEATURE_KEYS.KUNDALI_REPORT)?.remaining,
    1
  );

  // ─── 4. Expired add-on grants nothing ───────────────────────────────────────
  console.log('\n── Expired add-on ──');
  const expiredUser = new mongoose.Types.ObjectId().toString();
  await Purchase.create({
    userId: new mongoose.Types.ObjectId(expiredUser),
    planCode: PLAN_CODES.ADDON_PACK,
    transactionId: 'txn_check_expired',
    platform: 'play_store',
    grants: [{ featureKey: FEATURE_KEYS.AI_CHAT, granted: 5, remaining: 5 }],
    purchasedAt: new Date(Date.now() - 3 * 864e5),
    expiresAt: new Date(Date.now() - 2 * 864e5), // expired two days ago
    status: 'active', // deliberately still 'active' — simulates a missed cron run
  });

  const expiredRes = await entitlementService.resolve(expiredUser);
  check(
    'expired add-on grants no quota even when status is still active',
    expiredRes.features.get(FEATURE_KEYS.AI_CHAT)?.totalLimit ?? 'absent',
    'absent'
  );

  // ─── 5. Concurrency ─────────────────────────────────────────────────────────
  console.log('\n── Concurrency ──');
  const raceUser = new mongoose.Types.ObjectId().toString();
  await UserSubscription.create({
    userId: new mongoose.Types.ObjectId(raceUser),
    planCode: PLAN_CODES.STANDARD_MONTHLY,
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 864e5),
    lastEventTimestampMs: Date.now(),
  });

  // 40 simultaneous requests against an 11-unit daily allowance.
  const results = await Promise.all(
    Array.from({ length: 40 }, () => usageService.consume(raceUser, FEATURE_KEYS.AI_CHAT))
  );
  check(
    'concurrent burst cannot exceed the limit',
    results.filter((r) => r.allowed).length,
    11
  );

  // ─── 6. Refund on failure ───────────────────────────────────────────────────
  console.log('\n── Release on failure ──');
  const refundUser = new mongoose.Types.ObjectId().toString();
  await UserSubscription.create({
    userId: new mongoose.Types.ObjectId(refundUser),
    planCode: PLAN_CODES.STANDARD_MONTHLY,
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 864e5),
    lastEventTimestampMs: Date.now(),
  });

  const r1 = await usageService.consume(refundUser, FEATURE_KEYS.KUNDALI_REPORT);
  check('report consumed', r1.allowed, true);
  const afterConsume = await entitlementService.getQuotaStatus(refundUser, FEATURE_KEYS.KUNDALI_REPORT);
  check('remaining drops to 4', afterConsume?.remaining, 4);

  if (r1.allowed) await r1.release();
  const afterRelease = await entitlementService.getQuotaStatus(refundUser, FEATURE_KEYS.KUNDALI_REPORT);
  check('release restores the unit', afterRelease?.remaining, 5);

  // ─── 7. Expired subscription falls back to free ─────────────────────────────
  console.log('\n── Lapsed subscription ──');
  const lapsedUser = new mongoose.Types.ObjectId().toString();
  await UserSubscription.create({
    userId: new mongoose.Types.ObjectId(lapsedUser),
    planCode: PLAN_CODES.STANDARD_MONTHLY,
    status: 'active', // stale status — the EXPIRATION webhook never arrived
    expiresAt: new Date(Date.now() - 864e5), // expired yesterday
    lastEventTimestampMs: Date.now(),
  });

  const lapsed = await entitlementService.resolve(lapsedUser);
  check('lapsed subscription falls back to free plan', lapsed.plan.code, PLAN_CODES.FREE);
  check('lapsed user is not premium', lapsed.isPremium, false);

  // ─── 8. Cancelled-but-not-expired keeps access ──────────────────────────────
  console.log('\n── Cancelled but still paid ──');
  const cancelledUser = new mongoose.Types.ObjectId().toString();
  await UserSubscription.create({
    userId: new mongoose.Types.ObjectId(cancelledUser),
    planCode: PLAN_CODES.STANDARD_MONTHLY,
    status: 'cancelled',
    cancelledAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 864e5), // 10 days still paid for
    willRenew: false,
    lastEventTimestampMs: Date.now(),
  });

  const cancelled = await entitlementService.resolve(cancelledUser);
  check('cancelled user keeps access until expiry', cancelled.isPremium, true);
  check('cancelled user keeps standard plan', cancelled.plan.code, PLAN_CODES.STANDARD_MONTHLY);

  // ─── 9. One-time unlock idempotency ─────────────────────────────────────────
  console.log('\n── Feature unlock idempotency ──');
  const unlockUser = new mongoose.Types.ObjectId().toString();
  await UserSubscription.create({
    userId: new mongoose.Types.ObjectId(unlockUser),
    planCode: PLAN_CODES.STANDARD_MONTHLY,
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 864e5),
    lastEventTimestampMs: Date.now(),
  });

  const resourceId = new mongoose.Types.ObjectId().toString();
  const uid = new mongoose.Types.ObjectId(unlockUser);

  // Simulate the middleware's first-download path.
  await usageService.consume(unlockUser, FEATURE_KEYS.KUNDALI_REPORT);
  await FeatureUnlock.create({
    userId: uid,
    featureKey: FEATURE_KEYS.KUNDALI_REPORT,
    resourceId,
    periodKey: 'check',
  });

  const q1 = await entitlementService.getQuotaStatus(unlockUser, FEATURE_KEYS.KUNDALI_REPORT);
  check('first download consumes one report', q1?.remaining, 4);

  const alreadyUnlocked = await FeatureUnlock.findOne({
    userId: uid,
    featureKey: FEATURE_KEYS.KUNDALI_REPORT,
    resourceId,
  });
  check('unlock recorded, re-download would be free', Boolean(alreadyUnlocked), true);

  let duplicateRejected = false;
  try {
    await FeatureUnlock.create({
      userId: uid,
      featureKey: FEATURE_KEYS.KUNDALI_REPORT,
      resourceId,
      periodKey: 'check',
    });
  } catch (e: any) {
    duplicateRejected = e?.code === 11000;
  }
  check('duplicate unlock rejected by unique index', duplicateRejected, true);

  // ─── 10. Webhook idempotency & ordering ─────────────────────────────────────
  console.log('\n── Webhook handling ──');
  const { revenueCatSyncService } = await import('../services/revenuecat.sync.service');
  const { User } = await import('../../user/model/user.model');
  const { RevenueCatEvent, PurchaseHistory } = await import('../models');

  const webhookUser = await User.create({
    firstName: 'Webhook',
    lastName: 'Test',
    email: `wh_${Date.now()}@check.local`,
    authProvider: 'local',
  });
  const wuid = (webhookUser._id as mongoose.Types.ObjectId).toString();

  const purchaseEvent = {
    id: 'evt_initial_1',
    type: 'INITIAL_PURCHASE',
    app_user_id: wuid,
    product_id: 'vedicscan_standard_monthly',
    entitlement_ids: ['standard_access'],
    event_timestamp_ms: Date.now(),
    purchased_at_ms: Date.now(),
    expiration_at_ms: Date.now() + 30 * 864e5,
    store: 'PLAY_STORE',
    environment: 'PRODUCTION',
    price_in_purchased_currency: 299,
    currency: 'INR',
  };

  const first = await revenueCatSyncService.handleWebhookEvent(purchaseEvent as any);
  check('initial purchase activates standard_monthly', first, 'activated:standard_monthly');

  const afterPurchase = await entitlementService.resolve(wuid);
  check('user is premium after webhook', afterPurchase.isPremium, true);
  check('plan applied from product mapping', afterPurchase.plan.code, PLAN_CODES.STANDARD_MONTHLY);

  // Replay the identical event — RevenueCat retries are routine.
  const replay = await revenueCatSyncService.handleWebhookEvent(purchaseEvent as any);
  check('replayed event is ignored', replay, 'duplicate_ignored');
  check(
    'replay did not duplicate the ledger entry',
    await PurchaseHistory.countDocuments({ userId: webhookUser._id, entryType: 'initial_purchase' }),
    1
  );

  // Out-of-order: a CANCELLATION emitted BEFORE the purchase arrives after it.
  const staleCancel = {
    id: 'evt_stale_cancel',
    type: 'CANCELLATION',
    app_user_id: wuid,
    product_id: 'vedicscan_standard_monthly',
    entitlement_ids: ['standard_access'],
    event_timestamp_ms: purchaseEvent.event_timestamp_ms - 60_000, // one minute older
    store: 'PLAY_STORE',
    environment: 'PRODUCTION',
  };
  await revenueCatSyncService.handleWebhookEvent(staleCancel as any);

  const afterStale = await entitlementService.resolve(wuid);
  check('stale out-of-order event does not revoke access', afterStale.isPremium, true);
  check('subscription still active', afterStale.subscription?.status, 'active');

  // Expiration revokes access.
  await revenueCatSyncService.handleWebhookEvent({
    id: 'evt_expire_1',
    type: 'EXPIRATION',
    app_user_id: wuid,
    product_id: 'vedicscan_standard_monthly',
    entitlement_ids: ['standard_access'],
    event_timestamp_ms: Date.now() + 1000,
    store: 'PLAY_STORE',
    environment: 'PRODUCTION',
  } as any);

  const afterExpiry = await entitlementService.resolve(wuid);
  check('expiration downgrades to free', afterExpiry.plan.code, PLAN_CODES.FREE);
  check('expired user is not premium', afterExpiry.isPremium, false);

  // Add-on purchase via webhook.
  await revenueCatSyncService.handleWebhookEvent({
    id: 'evt_addon_1',
    type: 'NON_RENEWING_PURCHASE',
    app_user_id: wuid,
    product_id: 'vedicscan_addon_pack',
    entitlement_ids: [],
    event_timestamp_ms: Date.now(),
    purchased_at_ms: Date.now(),
    transaction_id: 'gpa_check_addon_1',
    store: 'PLAY_STORE',
    environment: 'PRODUCTION',
  } as any);

  const withAddon = await entitlementService.resolve(wuid);
  check(
    'add-on grants chat to a free user',
    withAddon.features.get(FEATURE_KEYS.AI_CHAT)?.totalLimit,
    5
  );
  check(
    'add-on expires at end of purchase day',
    withAddon.activePurchases[0]?.expiresAt.toISOString(),
    endOfBillingDay(new Date()).toISOString()
  );

  // Replay the add-on — must not grant a second pack.
  await revenueCatSyncService.handleWebhookEvent({
    id: 'evt_addon_1_retry',
    type: 'NON_RENEWING_PURCHASE',
    app_user_id: wuid,
    product_id: 'vedicscan_addon_pack',
    entitlement_ids: [],
    event_timestamp_ms: Date.now(),
    purchased_at_ms: Date.now(),
    transaction_id: 'gpa_check_addon_1', // same store transaction
    store: 'PLAY_STORE',
    environment: 'PRODUCTION',
  } as any);

  check(
    'same transaction cannot grant two packs',
    await Purchase.countDocuments({ transactionId: 'gpa_check_addon_1' }),
    1
  );

  // A brand-new user buys a SKU the operator has not yet mapped to a plan.
  const unmappedUser = await User.create({
    firstName: 'Unmapped',
    lastName: 'Test',
    email: `um_${Date.now()}@check.local`,
    authProvider: 'local',
  });
  const umid = (unmappedUser._id as mongoose.Types.ObjectId).toString();

  await revenueCatSyncService.handleWebhookEvent({
    id: 'evt_unmapped_1',
    type: 'INITIAL_PURCHASE',
    app_user_id: umid,
    product_id: 'vedicscan_product_not_yet_mapped',
    entitlement_ids: [],
    event_timestamp_ms: Date.now(),
    purchased_at_ms: Date.now(),
    expiration_at_ms: Date.now() + 30 * 864e5,
    store: 'PLAY_STORE',
    environment: 'PRODUCTION',
  } as any);

  check(
    'unmapped product is recorded as failed for retry',
    (await RevenueCatEvent.findOne({ eventId: 'evt_unmapped_1' }))?.status,
    'failed'
  );
  check(
    'user gets nothing while the SKU is unmapped',
    (await entitlementService.resolve(umid)).isPremium,
    false
  );

  // ─── 11. Retry cron actually recovers a failed event ────────────────────────
  console.log('\n── Failed-event retry ──');
  const { SubscriptionPlan } = await import('../models');
  const { retryFailedEvents } = await import('../jobs');
  const { planRepository } = await import('../repositories');

  // Operator maps the previously-unknown SKU onto the Standard plan.
  await SubscriptionPlan.updateOne(
    { code: PLAN_CODES.STANDARD_MONTHLY },
    { $addToSet: { storeProductIds: 'vedicscan_product_not_yet_mapped' } }
  );
  planRepository.invalidate();

  await retryFailedEvents();

  const retried = await RevenueCatEvent.findOne({ eventId: 'evt_unmapped_1' });
  check('retry cron reprocesses the event', retried?.status, 'processed');

  const afterRetry = await entitlementService.resolve(umid);
  check('user receives entitlement after SKU is mapped', afterRetry.isPremium, true);
  check('recovered user is on the mapped plan', afterRetry.plan.code, PLAN_CODES.STANDARD_MONTHLY);

  // ─── 12. Web (Stripe) rail grants identical entitlements ────────────────────
  console.log('\n── Web/Stripe cross-platform parity ──');
  const { webCheckoutService } = await import('../services/webCheckout.service');

  const webUser = await User.create({
    firstName: 'Web',
    lastName: 'Buyer',
    email: `web_${Date.now()}@check.local`,
    authProvider: 'local',
  });
  const webId = (webUser._id as mongoose.Types.ObjectId).toString();

  await webCheckoutService.grantFromStripe({
    userId: webId,
    planCode: PLAN_CODES.STANDARD_MONTHLY,
    stripeEventId: 'evt_stripe_1',
    stripeSubscriptionId: 'sub_web_1',
    amountMinor: 29900,
    currency: 'INR',
    periodEnd: new Date(Date.now() + 30 * 864e5),
  });

  const webEnt = await entitlementService.resolve(webId);
  check('web purchase makes user premium', webEnt.isPremium, true);
  check('web purchase applies the same plan', webEnt.plan.code, PLAN_CODES.STANDARD_MONTHLY);
  check('web purchase records platform', webEnt.subscription?.platform, 'stripe');

  // The decisive check: a user who paid on the website must get exactly the
  // same feature allowances as one who paid through Google Play.
  const mobileEnt = await entitlementService.resolve(paidUser);
  const shape = (e: any) =>
    Array.from(e.features.values())
      .map((f: any) => `${f.featureKey}:${f.planLimit}:${f.period}`)
      .sort()
      .join('|');
  check('web and mobile entitlements are identical', shape(webEnt), shape(mobileEnt));

  // Chat works immediately for the web purchaser.
  const webChat = await usageService.consume(webId, FEATURE_KEYS.AI_CHAT);
  check('web subscriber can use AI chat', webChat.allowed, true);

  // Stripe retries the same event.
  const webReplay = await webCheckoutService.grantFromStripe({
    userId: webId,
    planCode: PLAN_CODES.STANDARD_MONTHLY,
    stripeEventId: 'evt_stripe_1',
    amountMinor: 29900,
    currency: 'INR',
  });
  check('replayed stripe event is ignored', webReplay, 'duplicate_ignored');
  check(
    'replay did not duplicate the ledger entry',
    await PurchaseHistory.countDocuments({ userId: webUser._id, entryType: 'initial_purchase' }),
    1
  );

  // Cancelling on the web keeps access until the paid period ends.
  await webCheckoutService.revokeFromStripe({
    userId: webId,
    stripeEventId: 'evt_stripe_cancel',
    reason: 'cancelled',
    occurredAt: new Date(Date.now() + 1000),
  });
  const webCancelled = await entitlementService.resolve(webId);
  check('web cancellation retains access until expiry', webCancelled.isPremium, true);

  // A refund revokes immediately.
  await webCheckoutService.revokeFromStripe({
    userId: webId,
    stripeEventId: 'evt_stripe_refund',
    reason: 'refunded',
    occurredAt: new Date(Date.now() + 2000),
  });
  const webRefunded = await entitlementService.resolve(webId);
  check('web refund revokes access immediately', webRefunded.isPremium, false);
  check('refunded user falls back to free', webRefunded.plan.code, PLAN_CODES.FREE);

  // ─── 13. Web add-on pack ────────────────────────────────────────────────────
  const webAddonUser = await User.create({
    firstName: 'Web',
    lastName: 'Addon',
    email: `wa_${Date.now()}@check.local`,
    authProvider: 'local',
  });
  const waId = (webAddonUser._id as mongoose.Types.ObjectId).toString();

  await webCheckoutService.grantFromStripe({
    userId: waId,
    planCode: PLAN_CODES.ADDON_PACK,
    stripeEventId: 'evt_stripe_addon',
    amountMinor: 4900,
    currency: 'INR',
  });

  const waEnt = await entitlementService.resolve(waId);
  check('web add-on grants chat units', waEnt.features.get(FEATURE_KEYS.AI_CHAT)?.totalLimit, 5);
  check(
    'web add-on expires at end of purchase day (same rule as mobile)',
    waEnt.activePurchases[0]?.expiresAt.toISOString(),
    endOfBillingDay(new Date()).toISOString()
  );

  // ─── 14. Only the four intended plans are sold ──────────────────────────────
  console.log('\n── Plan catalogue ──');
  const { planService } = await import('../services/plan.service');
  const catalogue = await planService.getCatalogue('IN');
  check(
    'catalogue contains exactly the four intended plans',
    catalogue.map((p) => p.code).sort().join(','),
    'addon_pack,free,standard_monthly,standard_yearly'
  );
  check(
    'no plan named premium exists',
    (await SubscriptionPlan.countDocuments({ code: /premium/i })),
    0
  );
  check(
    'India pricing is correct',
    catalogue.filter((p) => p.code !== 'free').map((p) => `${p.code}=${p.price?.displayPrice}`).join(','),
    'standard_monthly=₹299,standard_yearly=₹2,499,addon_pack=₹49'
  );
  const world = await planService.getCatalogue('US');
  check(
    'rest-of-world pricing is correct',
    world.filter((p) => p.code !== 'free').map((p) => `${p.code}=${p.price?.displayPrice}`).join(','),
    'standard_monthly=$9,standard_yearly=$79,addon_pack=$4'
  );

  // ─── Done ───────────────────────────────────────────────────────────────────
  await mongoose.disconnect();
  await mongod.stop();

  console.log(
    failures === 0
      ? '\n══ ALL CHECKS PASSED ══'
      : `\n══ ${failures} CHECK(S) FAILED ══`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Verification crashed:', err);
  process.exit(1);
});
