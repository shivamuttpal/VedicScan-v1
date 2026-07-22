# Billing API Reference

Base path: `/api/billing`

All authenticated endpoints require `Authorization: Bearer <JWT>`.

Responses follow the project convention:

```json
{ "success": true, "message": "...", "data": { } }
{ "success": false, "message": "...", "errors": { } }
```

---

## Public

### `GET /api/billing/plans`

Plan catalogue with region-appropriate pricing. No auth — the paywall renders
before sign-up.

**Query**

| Param | Type | Description |
|---|---|---|
| `region` | string | Optional 2-letter country code or `DEFAULT`. Overrides CDN geo-detection (QA use). |

Region is otherwise read from `CloudFront-Viewer-Country` / `CF-IPCountry` /
`X-Vercel-IP-Country`. An unknown region falls back to the plan's `DEFAULT`
price, which is how rest-of-world pricing works without enumerating countries.

> Spoofing the region header only changes which price is **displayed**. The
> amount actually charged is set in the Play/App Store console and enforced by
> the store, so it cannot be manipulated from the client.

**200**

```json
{
  "success": true,
  "data": {
    "region": "IN",
    "plans": [
      {
        "code": "standard_monthly",
        "displayName": "Standard Monthly",
        "kind": "subscription",
        "billingInterval": "monthly",
        "price": {
          "region": "IN", "currency": "INR",
          "amountMinor": 29900, "amount": 299, "displayPrice": "₹299"
        },
        "features": [
          { "featureKey": "ai_chat", "displayName": "AI Chat Sessions",
            "limit": 11, "period": "daily", "unlimited": false },
          { "featureKey": "baby_naming", "displayName": "Baby Naming",
            "limit": -1, "period": "monthly", "unlimited": true }
        ],
        "storeProductIds": ["vedicscan_standard_monthly"],
        "revenueCatEntitlementId": "standard_access",
        "sortOrder": 1
      }
    ]
  }
}
```

`limit: -1` means unlimited.

### `GET /api/billing/plans/:code`

Single plan. `404` if the code does not exist.

---

## Authenticated

### `GET /api/billing/status`

The endpoint the app polls to render entitlement state.

**200**

```json
{
  "success": true,
  "data": {
    "plan": { "code": "standard_monthly", "displayName": "Standard Monthly",
              "kind": "subscription", "billingInterval": "monthly" },
    "isPremium": true,
    "subscription": {
      "status": "active",
      "platform": "play_store",
      "productId": "vedicscan_standard_monthly",
      "startedAt": "2026-07-01T10:00:00.000Z",
      "expiresAt": "2026-08-01T10:00:00.000Z",
      "renewsAt": "2026-08-01T10:00:00.000Z",
      "cancelledAt": null,
      "willRenew": true,
      "isInGracePeriod": false,
      "isTrial": false
    },
    "quotas": [
      { "feature": "ai_chat", "limit": 16, "planLimit": 11, "addonLimit": 5,
        "used": 3, "remaining": 13, "unlimited": false,
        "period": "daily", "allowed": true,
        "resetAt": "2026-07-19T18:30:00.000Z" },
      { "feature": "baby_naming", "limit": null, "used": 0, "remaining": null,
        "unlimited": true, "period": "monthly", "allowed": true, "resetAt": null }
    ],
    "addons": [
      { "planCode": "addon_pack",
        "purchasedAt": "2026-07-19T06:00:00.000Z",
        "expiresAt": "2026-07-19T18:30:00.000Z",
        "grants": [{ "feature": "ai_chat", "granted": 5, "remaining": 5 }] }
    ]
  }
}
```

`limit`/`remaining` are `null` when unlimited — `Infinity` is not valid JSON.

**Subscription statuses**

| Status | Grants access | Meaning |
|---|:---:|---|
| `active` | ✅ | Paid and renewing |
| `cancelled` | ✅ | Auto-renew off; access continues until `expiresAt` |
| `in_grace_period` | ✅ | Payment failed, store retrying |
| `in_billing_retry` | ✅ | Billing issue detected |
| `paused` | ❌ | Play Store subscription pause |
| `expired` | ❌ | Period ended |
| `refunded` | ❌ | Refunded, access revoked |
| `none` | ❌ | Never purchased (free tier) |

### `GET /api/billing/quota/:featureKey`

Single-feature check for pre-flighting an action in the UI. Returns one quota
object. `403 feature_locked` if the plan does not include it.

### `POST /api/billing/sync`

Re-derives subscription state from RevenueCat's REST API. Call after a purchase
completes and on app launch.

**Body** (both fields optional)

```json
{ "appUserId": "$RCAnonymousID:abc123" }
```

`appUserId` only helps link a pre-login anonymous purchase. **No entitlement
claim is accepted from the client** — there is no `isActive` or `expiresAt`
field to send. The client says "re-check me"; RevenueCat provides the answer.

**200** — same shape as `/status` plus `"synced": true`.

**502 / 503** — RevenueCat unreachable. Retryable; do not treat as "not
subscribed".

### `POST /api/billing/restore`

Purchase restoration after reinstall or device change. Identical behaviour to
`/sync` (RevenueCat already reconciles store receipts against the app user id);
exposed separately because it maps to a distinct user action.

### `GET /api/billing/history`

Paginated billing ledger.

**Query:** `page` (default 1), `limit` (default 20, max 100)

```json
{
  "success": true,
  "data": {
    "entries": [
      { "type": "renewal", "planCode": "standard_monthly",
        "planName": "Standard Monthly", "platform": "play_store",
        "amount": 299, "currency": "INR",
        "periodStart": "2026-07-01T10:00:00.000Z",
        "periodEnd": "2026-08-01T10:00:00.000Z",
        "occurredAt": "2026-07-01T10:00:02.000Z" }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 4, "totalPages": 1 }
  }
}
```

Entry types: `initial_purchase`, `renewal`, `product_change`,
`one_time_purchase`, `cancellation`, `expiration`, `refund`, `transfer`,
`trial_start`, `trial_conversion`. Refunds appear as a separate negative-amount
row; the original is never mutated.

---

## Webhook

### `POST /api/billing/webhooks/revenuecat`

Server-to-server only. Authenticated by
`Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH_TOKEN>`, compared in constant
time. Rejects everything if the token is unset (fail closed).

| Status | When |
|---|---|
| `200` | Handled, duplicate, ignored, **or** failed-and-logged for retry |
| `400` | Malformed payload — retrying cannot help |
| `401` | Bad or missing token |
| `503` | Webhook token not configured on the server |

Returning `200` on a processing failure is deliberate: RevenueCat retries
non-2xx for ~72 hours, and a deterministic bug would replay identically
thousands of times. The event is persisted with `status: 'failed'` and the
internal retry cron owns recovery. Non-2xx is reserved for events we failed to
**record**.

Duplicate deliveries are no-ops — the event id is claimed in a unique index
before any state mutation.

---

## Error contract for premium endpoints

Any route behind `requireFeature` can return:

**403 — not included in plan**

```json
{
  "success": false,
  "message": "This feature is not included in your current plan.",
  "detail": { "type": "feature_locked", "feature": "kundali_report",
              "currentPlan": "free", "upgradeAvailable": true }
}
```

**429 — allowance spent**

```json
{
  "success": false,
  "message": "You have used all 5 of your kundali report allowance for this period.",
  "detail": { "type": "quota_exhausted", "feature": "kundali_report",
              "used": 5, "limit": 5, "remaining": 0,
              "resetAt": "2026-08-01T00:00:00.000Z",
              "currentPlan": "standard_monthly", "upgradeAvailable": true }
}
```

**503 — billing unavailable**

```json
{
  "success": false,
  "message": "Subscription service is temporarily unavailable. Please try again shortly.",
  "detail": { "type": "billing_unavailable", "feature": "ai_chat" }
}
```

Clients should branch on `detail.type`, never on message text.

> `403` vs `429` is a meaningful distinction: `403` means *buy an upgrade*,
> `429` means *you already have this, wait for `resetAt` or buy an add-on*.
> Showing an upgrade wall for a `429` would try to sell a plan the user already owns.

---

## Gated endpoints

| Endpoint | Feature key | Notes |
|---|---|---|
| `POST /api/chat/message` | `ai_chat` | Daily. Refunded if the message is rejected for length or the AI call fails. |
| `POST /api/kundali/generate` | `kundali_basic` | Free: 1 lifetime. Paid: unlimited. |
| `GET  /api/kundali/:id/pdf` | `kundali_report` | Charged **once per kundali**, not per download. |
| `POST /api/compatibility/analyze` | `compatibility_basic` | Free: 1 lifetime. Paid: unlimited. |
| `POST /api/compatibility/report` | `compatibility_report` | Monthly, 5 on Standard. |
| `POST /api/baby-naming/generate` | `baby_naming` | Unlimited on paid, absent on Free. |
| `POST /api/baby-naming/explain` | `baby_naming` | Verified but not charged. |
