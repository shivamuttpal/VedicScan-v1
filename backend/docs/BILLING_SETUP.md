# Billing Setup Guide

End-to-end setup: RevenueCat, Google Play, webhooks, seeding, and sandbox
testing.

Order matters — Play products must exist before RevenueCat can import them.

---

## 1. Google Play Console

You need a published (at least to internal testing) app with a signed release
uploaded. Play does not expose in-app products until a build exists.

### 1a. Subscriptions

**Monetise → Products → Subscriptions → Create subscription**

| Field | Standard Monthly | Standard Yearly |
|---|---|---|
| Product ID | `vedicscan_standard_monthly` | `vedicscan_standard_yearly` |
| Name | Standard Monthly | Standard Yearly |
| Base plan ID | `monthly` | `yearly` |
| Billing period | 1 month | 1 year |
| Renewal | Auto-renewing | Auto-renewing |

> **Product IDs are permanent.** Play does not allow renaming or reusing them
> after creation. They must match `PRODUCT_ID_*` in your `.env`.

Set regional pricing on each base plan:

| Region | Monthly | Yearly |
|---|---|---|
| India | ₹299 | ₹2,499 |
| United States (+ rest of world) | $9 | $79 |

Then **Activate** each base plan — an inactive plan is invisible to the SDK.

### 1b. Add-on Pack (consumable)

**Monetise → Products → In-app products → Create product**

| Field | Value |
|---|---|
| Product ID | `vedicscan_addon_pack` |
| Type | **Consumable** |
| Price | ₹49 (India) / $4 (rest of world) |

> It must be **consumable**, not one-time. A non-consumable can only ever be
> purchased once per account, so a user could never buy a second pack.
>
> The pack's one-day validity is enforced by the backend (it expires at the next
> IST midnight), not by Play.

### 1c. Licence testers

**Setup → Licence testing** → add tester Google accounts.

These accounts can purchase without being charged, and their events arrive
flagged `environment: SANDBOX`.

---

## 2. RevenueCat

### 2a. Project and app

1. Create a project at [app.revenuecat.com](https://app.revenuecat.com).
2. **Add app → Google Play Store**, enter your package name.
3. Upload Play service-account credentials so RevenueCat can validate purchases:
   - Google Cloud Console → IAM → Service Accounts → create, download JSON key.
   - Play Console → Users and permissions → invite that service account with
     **View financial data** and **Manage orders and subscriptions**.
   - Upload the JSON in RevenueCat → App settings → Service Account credentials.

> Play permission propagation can take up to 36 hours. Purchases fail validation
> until it completes — this is the most common "it works locally but not in
> sandbox" cause.

### 2b. Entitlement

**Entitlements → New**

| Field | Value |
|---|---|
| Identifier | `standard_access` |

Attach **both** `vedicscan_standard_monthly` and `vedicscan_standard_yearly`.

Both plans intentionally share one entitlement — it answers "may this user use
Standard features?", while the product ID distinguishes which was bought. The
backend resolves the plan by product ID first for exactly this reason.

The Add-on Pack gets **no entitlement**. It is a consumable, tracked by the
backend as a `Purchase`, and arrives as a `NON_RENEWING_PURCHASE` event.

### 2c. Offering

**Offerings → New offering** (identifier `default`), with packages:

| Package | Product |
|---|---|
| `$rc_monthly` | `vedicscan_standard_monthly` |
| `$rc_annual` | `vedicscan_standard_yearly` |
| `addon` (custom) | `vedicscan_addon_pack` |

Mark the offering **Current** so the SDK's `getOfferings()` returns it.

### 2d. Webhook

**Project Settings → Integrations → Webhooks → Add**

| Field | Value |
|---|---|
| URL | `https://<your-backend>/api/billing/webhooks/revenuecat` |
| Authorization header | `Bearer <REVENUECAT_WEBHOOK_AUTH_TOKEN>` |
| Environment | Sandbox **and** Production |

Generate the token and use the identical value in both RevenueCat and `.env`:

```bash
openssl rand -hex 32
```

> The URL is `/api/billing/webhooks/revenuecat` — **not** the legacy
> `/api/subscription/revenuecat-webhook`.

### 2e. Secret API key

**Project Settings → API Keys → Secret keys** → copy the `sk_...` value into
`REVENUECAT_SECRET_KEY`.

Server-only. The mobile app uses the separate **public** SDK key.

---

## 3. Backend

### 3a. Install and configure

```bash
cd backend
npm install
cp .env.example .env
```

Fill in at minimum: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`,
`REVENUECAT_SECRET_KEY`, `REVENUECAT_WEBHOOK_AUTH_TOKEN`, `OPENAI_API_KEY`.

```bash
openssl rand -base64 48   # JWT_SECRET
openssl rand -hex 32      # REVENUECAT_WEBHOOK_AUTH_TOKEN
```

### 3b. Seed plans

```bash
npm run seed:billing
```

Creates 7 features and 4 plans. **Idempotent and non-destructive** — re-running
never overwrites an existing plan, so operator pricing changes survive.

```bash
npm run seed:billing -- --force   # overwrite; dev/CI only, blocked in production
```

After seeding, MongoDB is authoritative. Change prices, limits or descriptions
by editing the `subscriptionplans` documents (Atlas UI / Compass) — no redeploy.

### 3c. Verify

```bash
# Period boundary logic (no DB)
npx ts-node --transpile-only src/modules/billing/__checks__/period.check.ts

# Full engine against an ephemeral in-memory MongoDB.
# Never touches your configured database.
npx ts-node --transpile-only src/modules/billing/__checks__/engine.check.ts
```

Expect `ALL CHECKS PASSED` (45 assertions covering concurrency, add-on stacking,
expiry, webhook replay and retry recovery).

### 3d. Run

```bash
npm run dev     # development, hot reload
```

```bash
npm run build   # production
npm start
```

Confirm on boot:

```
[BillingCron] Scheduled: addon expiry (hourly), event retry (30m), ...
✅ Cron Jobs Scheduled: [Daily Rashifal, Subscription Lifecycle (every 6h), Billing]
```

Smoke test:

```bash
curl http://localhost:8001/api/billing/plans
```

### 3e. Production checklist

- [ ] `NODE_ENV=production`
- [ ] `REVENUECAT_ALLOW_SANDBOX=false` — otherwise free test purchases grant real premium
- [ ] `JWT_SECRET` ≥ 32 random chars (the server refuses to boot otherwise)
- [ ] `FRONTEND_URL` set to a real CORS allowlist
- [ ] `BILLING_ENFORCEMENT_ENABLED` unset or `true`
- [ ] `BILLING_CRON_ENABLED=false` on all but one replica
- [ ] Webhook URL uses HTTPS and is publicly reachable

---

## 4. Mobile app

Use the **public** SDK key, never the secret key.

```ts
import Purchases from 'react-native-purchases';

await Purchases.configure({ apiKey: PUBLIC_SDK_KEY });

// After login — MUST be the Mongo user _id. The backend maps
// app_user_id -> User._id, and a mismatch means webhooks resolve to no user
// and the purchase is silently dropped.
await Purchases.logIn(user._id);
```

Purchase flow:

```ts
const offerings = await Purchases.getOfferings();
await Purchases.purchasePackage(offerings.current.availablePackages[0]);

// Ask the backend to re-verify with RevenueCat, then re-read entitlements.
await api.post('/api/billing/sync');
const { data } = await api.get('/api/billing/status');
```

Restore:

```ts
await Purchases.restorePurchases();
await api.post('/api/billing/restore');
```

> Never gate features on the SDK's local `customerInfo`. Treat it as a UI hint
> only and let `/api/billing/status` decide — the client can be tampered with,
> the backend cannot.

On logout call `Purchases.logOut()`, or the next user on that device inherits
the previous user's entitlements.

---

## 5. Sandbox testing

1. Sign in on the device with a **licence tester** account.
2. Install a build whose `versionCode` is uploaded to a Play testing track and
   signed with the same key.
3. Purchase — the sheet shows "Test card, always approves".

Verify the chain:

```bash
# 1. Webhook arrived and was processed
#    → RevenueCat Dashboard → Integrations → Webhooks → delivery log (expect 200)

# 2. Backend recorded it
#    Mongo: db.revenuecatevents.find().sort({createdAt:-1}).limit(1)
#    Expect status: "processed"

# 3. Entitlement applied
curl -H "Authorization: Bearer <JWT>" http://localhost:8001/api/billing/status
```

Local webhook testing needs a public URL:

```bash
npx localtunnel --port 8001
# point the RevenueCat webhook at https://<subdomain>.loca.lt/api/billing/webhooks/revenuecat
```

### Renewal speed in sandbox

Play compresses subscription periods for testers:

| Real period | Sandbox |
|---|---|
| 1 month | 5 minutes |
| 1 year | 30 minutes |

A monthly subscription renews ~6 times in 30 minutes — useful for exercising
renewal and expiry handling quickly.

### Troubleshooting

| Symptom | Cause |
|---|---|
| `401` on webhook | Token mismatch between RevenueCat and `.env` |
| `503` on webhook | `REVENUECAT_WEBHOOK_AUTH_TOKEN` unset (fails closed by design) |
| Event `status: "failed"`, note "No plan mapped" | Product ID not in any plan's `storeProductIds`. Add it — the retry cron recovers the purchase automatically within 30 min |
| Event `status: "ignored"`, "No local user" | `Purchases.logIn()` was not called with the Mongo user id |
| Event `status: "ignored"`, "Sandbox rejected" | `REVENUECAT_ALLOW_SANDBOX=false` in production — expected |
| `/sync` returns 503 | `REVENUECAT_SECRET_KEY` missing |
| Products not returned by SDK | Base plan not activated, or Play service-account permissions still propagating |

---

## 6. Changing pricing later

No deploy required.

```js
// mongosh
db.subscriptionplans.updateOne(
  { code: "standard_monthly" },
  { $set: { "prices.$[in].amountMinor": 34900,
            "prices.$[in].displayPrice": "₹349" } },
  { arrayFilters: [ { "in.region": "IN" } ] }
)
```

Then update the price in Play Console to match — Play is what actually charges.
Changes propagate to all replicas within `PLAN_CACHE_TTL_MS` (default 60s).

Adding a region needs no schema change:

```js
db.subscriptionplans.updateOne(
  { code: "standard_monthly" },
  { $push: { prices: { region: "GB", currency: "GBP",
                       amountMinor: 799, displayPrice: "£7.99" } } }
)
```

Adding iOS later: create the products in App Store Connect, attach them to the
same `standard_access` entitlement, then `$push` their product IDs onto each
plan's `storeProductIds`. No backend change.
