/**
 * RevenueCat REST Client
 *
 * Thin, typed wrapper over the RevenueCat v1 API. This is the ONLY place that
 * talks to RevenueCat over HTTP, which keeps credential handling, timeouts and
 * error translation in one auditable spot.
 *
 * Uses the SECRET key, so it must never be reachable from client code. The
 * public SDK key belongs in the mobile app; the secret key stays server-side.
 */

import { revenueCatConfig } from '../config/billing.config';

/** Shape of an entitlement inside a subscriber payload. */
export interface RCEntitlement {
  expires_date: string | null;
  purchase_date: string;
  product_identifier: string;
  grace_period_expires_date?: string | null;
}

/** Shape of a subscription inside a subscriber payload. */
export interface RCSubscription {
  expires_date: string | null;
  purchase_date: string;
  original_purchase_date: string;
  store: string;
  is_sandbox: boolean;
  unsubscribe_detected_at: string | null;
  billing_issues_detected_at: string | null;
  grace_period_expires_date: string | null;
  auto_resume_date?: string | null;
  period_type?: string;
}

export interface RCSubscriber {
  entitlements: Record<string, RCEntitlement>;
  subscriptions: Record<string, RCSubscription>;
  non_subscriptions: Record<string, unknown[]>;
  original_app_user_id: string;
  management_url: string | null;
}

/** Raised when RevenueCat is unreachable or returns an unexpected status. */
export class RevenueCatApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    /**
     * True when the failure is transient (timeout, 5xx) and the caller may
     * retry. False for definitive answers such as 404 "no such subscriber".
     */
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'RevenueCatApiError';
  }
}

class RevenueCatClient {
  private get secretKey(): string {
    return revenueCatConfig.secretKey;
  }

  /** Whether the server is configured to verify entitlements at all. */
  isConfigured(): boolean {
    return Boolean(this.secretKey);
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.isConfigured()) {
      throw new RevenueCatApiError('REVENUECAT_SECRET_KEY is not configured', 503, false);
    }

    // AbortController bounds the request so a hung RevenueCat call cannot pin an
    // Express worker indefinitely.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), revenueCatConfig.timeoutMs);

    try {
      const response = await fetch(`${revenueCatConfig.apiBaseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new RevenueCatApiError(
          `RevenueCat ${response.status}: ${body.slice(0, 300)}`,
          response.status,
          response.status >= 500 || response.status === 429
        );
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err instanceof RevenueCatApiError) throw err;
      if (err?.name === 'AbortError') {
        throw new RevenueCatApiError('RevenueCat request timed out', 504, true);
      }
      throw new RevenueCatApiError(`RevenueCat request failed: ${err?.message}`, undefined, true);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Fetch the authoritative subscriber record.
   *
   * RevenueCat creates subscribers lazily, so a user who has never purchased
   * returns an empty (not missing) record — that is a valid "free tier" answer,
   * not an error.
   */
  async getSubscriber(appUserId: string): Promise<RCSubscriber> {
    const payload = await this.request<{ subscriber: RCSubscriber }>(
      `/v1/subscribers/${encodeURIComponent(appUserId)}`
    );
    return payload.subscriber;
  }

  /**
   * Grant an entitlement without a store purchase — the mechanism behind
   * promo codes, support comps, referral rewards and manual trials.
   * `durationHours` is converted to RevenueCat's `end_time_ms`.
   */
  async grantPromotionalEntitlement(
    appUserId: string,
    entitlementId: string,
    durationHours: number
  ): Promise<void> {
    const endTimeMs = Date.now() + durationHours * 60 * 60 * 1000;
    await this.request(
      `/v1/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(
        entitlementId
      )}/promotional`,
      { method: 'POST', body: JSON.stringify({ end_time_ms: endTimeMs }) }
    );
  }

  /** Revoke a previously granted promotional entitlement. */
  async revokePromotionalEntitlement(appUserId: string, entitlementId: string): Promise<void> {
    await this.request(
      `/v1/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(
        entitlementId
      )}/revoke_promotionals`,
      { method: 'POST' }
    );
  }

  /**
   * Pick the entitlement that should govern access right now.
   *
   * A subscriber can hold several entitlements at once (an expired old one plus
   * a current one, or overlapping grants during an upgrade). We take the one
   * with the furthest expiry so a user is never downgraded by a stale record;
   * a null expiry (lifetime/promotional) always wins.
   */
  selectActiveEntitlement(
    subscriber: RCSubscriber,
    at: Date = new Date()
  ): { entitlementId: string; entitlement: RCEntitlement } | null {
    const nowMs = at.getTime();
    let best: { entitlementId: string; entitlement: RCEntitlement; rank: number } | null = null;

    for (const [entitlementId, entitlement] of Object.entries(subscriber.entitlements || {})) {
      const expiresMs = entitlement.expires_date ? Date.parse(entitlement.expires_date) : null;

      // Honour the grace period: the store is retrying payment, access continues.
      const graceMs = entitlement.grace_period_expires_date
        ? Date.parse(entitlement.grace_period_expires_date)
        : null;
      const effectiveMs = graceMs && (!expiresMs || graceMs > expiresMs) ? graceMs : expiresMs;

      const isActive = effectiveMs === null || effectiveMs > nowMs;
      if (!isActive) continue;

      const rank = effectiveMs === null ? Number.POSITIVE_INFINITY : effectiveMs;
      if (!best || rank > best.rank) best = { entitlementId, entitlement, rank };
    }

    return best ? { entitlementId: best.entitlementId, entitlement: best.entitlement } : null;
  }
}

export const revenueCatClient = new RevenueCatClient();
