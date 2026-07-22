/**
 * Billing Module — public surface.
 *
 * Other modules should import from here rather than reaching into internals, so
 * the module's structure can change without a codebase-wide refactor.
 *
 * Typical consumer usage:
 *
 *   import { requireFeature, FEATURE_KEYS } from '../../billing';
 *   router.post('/generate', requireFeature(FEATURE_KEYS.KUNDALI_REPORT), controller.generate);
 */

export { billingRouter } from './routes/billing.router';

export {
  requireFeature,
  requireFeatureOnce,
  requireActiveSubscription,
  attachEntitlements,
} from './middleware';
export type { BillingRequest, BillingContext } from './middleware';

export { entitlementService, usageService, planService, revenueCatSyncService } from './services';
export type { ResolvedEntitlements, FeatureQuotaStatus, ConsumeResult } from './services';

export { FEATURE_KEYS, PLAN_CODES } from './constants';

export { runBillingCronJobs, registerBillingCronJobs } from './jobs';

export { seedBillingData } from './seeds/billing.seed';
