/** Barrel export for the billing service layer. */

export { entitlementService } from './entitlement.service';
export type {
  ResolvedEntitlements,
  FeatureEntitlement,
  FeatureQuotaStatus,
} from './entitlement.service';

export { usageService } from './usage.service';
export type { ConsumeResult, ConsumeSuccess, ConsumeDenial, QuotaDenialReason } from './usage.service';

export { planService } from './plan.service';
export type { PlanDTO } from './plan.service';

export { revenueCatClient, RevenueCatApiError } from './revenuecat.client';
export type { RCSubscriber, RCEntitlement } from './revenuecat.client';

export { revenueCatSyncService } from './revenuecat.sync.service';
export type { RevenueCatWebhookEvent } from './revenuecat.sync.service';
