# VedicScan — Security Audit & Bug Report

**Scope:** `backend/` (Node/Express/TypeScript + MongoDB), `frontend/` (React), `mobileApp/` (Expo/React Native)
**Date:** 2026-07-08
**Auditor:** Automated code review (Claude)

> This is a code-level review. It does **not** replace a professional penetration test or a
> lawyer's review of the legal documents. Treat CRITICAL/HIGH items as launch blockers.

---

## Severity summary

| # | Severity | Title | Area |
|---|----------|-------|------|
| 1 | 🔴 CRITICAL | Privilege escalation — anyone can register as `admin` | Auth |
| 2 | 🔴 CRITICAL | Payment bypass — client-controlled subscription entitlement | Billing |
| 3 | 🔴 CRITICAL | RevenueCat webhook auth bypass when token unset | Billing |
| 4 | 🟠 HIGH | OTP returned in API responses (verification/2FA bypass) | Auth |
| 5 | 🟠 HIGH | Weak default JWT secret → token forgery | Auth |
| 6 | 🟠 HIGH | No brute-force/lockout on login & OTP | Auth |
| 7 | 🟡 MEDIUM | CORS `origin:'*'` with `credentials:true` | Transport |
| 8 | 🟡 MEDIUM | Email enumeration on forgot-password | Auth |
| 9 | 🟡 MEDIUM | Weak password policy (min 6, no complexity) | Auth |
| 10 | 🟡 MEDIUM | Long-lived JWT (7d), no revocation/refresh | Auth |
| 11 | 🟡 MEDIUM | Google login verifies access token, not ID token | Auth |
| 12 | 🟡 MEDIUM | 10 MB JSON body limit on all routes (DoS surface) | DoS |
| 13 | 🔵 LOW | Non-constant-time webhook token comparison | Billing |
| 14 | 🔵 LOW | bcrypt cost factor 10 (recommend 12) | Auth |
| 15 | 🔵 LOW | Firebase API key in `google-services.json` unrestricted (verify) | Mobile |
| 16 | 🔵 LOW | Contradictory `.gitignore` comments around `.env` | Hygiene |
| 17 | ⚪ INFO | Environment name disclosed on `/` and `/api/health` | Info leak |

Positive findings: no secrets committed to git; `.env` files correctly ignored; profile & kundali
data access is correctly scoped by `userId` (no IDOR); Stripe webhook signature is verified;
usage-limit middleware fails **closed**; admin routes are gated by `roleMiddleware('admin')`.

---

## CRITICAL

### 1. Privilege escalation — anyone can self-register as `admin`
**Files:** `backend/src/modules/user/router/user.validation.ts:10`, `backend/src/modules/user/services/user.service.ts:79`

`registerSchema` accepts a client-supplied `role` including `'admin'`:
```ts
role: z.enum(['admin', 'instructor', 'student', 'user']).optional(),
```
and `register()` honors it: `role: input.role || 'user'`. A single request:
```
POST /api/users/register  { "email":"x@x.com","password":"...","firstName":"X","role":"admin" }
```
creates an **admin** account. Admin routes then expose **every user's PII** (`GET /api/users`,
`GET /api/users/:id`) and allow **deleting any user** (`DELETE /api/users/:id`).

**Fix:** Remove `role` from `registerSchema` and from the `RegisterInput` path; always force
`role: 'user'` server-side. Roles should only be grantable by an existing admin via a separate,
audited endpoint.

### 2. Payment bypass — client-controlled subscription entitlement
**File:** `backend/src/modules/subscription/controller/subscription.controller.ts:558` (`syncRevenueCat`)

`POST /api/subscription/revenuecat-sync` trusts client-supplied `isActive`, `productId`,
`entitlementIds`, `expirationAtMs` and grants the plan directly:
```
POST /api/subscription/revenuecat-sync  { "isActive": true, "productId": "lifetime" }
```
→ any authenticated user self-grants **lifetime premium**. (Currently masked because
`PAYMENTS_ENABLED` is false and everyone is reported Premium, but this is a launch blocker the
moment payments are turned on.)

**Fix:** Never trust client entitlement claims. Verify the purchase server-side against the
RevenueCat REST API (`GET /subscribers/{app_user_id}` with the secret key) — or Apple/Google
receipt validation — before mutating the plan. Treat this endpoint as a *hint to re-fetch*, not a
source of truth.

### 3. RevenueCat webhook auth bypass when token is unset
**File:** `backend/src/modules/subscription/controller/subscription.controller.ts:619`

```ts
if (expectedToken && authHeader !== `Bearer ${expectedToken}`) { return 401 }
```
If `REVENUECAT_WEBHOOK_AUTH_TOKEN` is not configured, `expectedToken` is falsy and the check is
**skipped entirely** — an unauthenticated attacker can POST an arbitrary `app_user_id` and grant
premium to any account.

**Fix:** Fail closed. If the token is not configured in production, reject all webhook calls (500/
config error). Use `crypto.timingSafeEqual` for the comparison (see #13).

---

## HIGH

### 4. OTP returned in API responses (account-verification bypass)
**Files:** `backend/src/modules/user/services/user.service.ts` (`login` returns `emailOtp/phoneOtp`),
`backend/src/modules/user/controller/user.controller.ts:83` (`successResponse(res, result, …)`)

On login with an unverified account the response body contains the freshly minted `emailOtp` /
`phoneOtp`. Anyone who knows a target's email/phone can read the OTP straight from the HTTP
response and complete "verification" — defeating email/SMS ownership proof and enabling takeover of
unverified accounts.

**Fix:** OTPs must **only** be delivered out-of-band (email/SMS). Strip `emailOtp`/`phoneOtp` from
every controller response. The service may keep returning them internally to the mailer, but the
controller must not serialize them to the client.

### 5. Weak default JWT secret → token forgery
**File:** `backend/src/config/index.ts:56`

```ts
secret: process.env.JWT_SECRET || 'default-secret-change-me',
```
If `JWT_SECRET` is missing in production, every token is signed with a publicly-known string and any
attacker can forge a valid admin token → total auth bypass.

**Fix:** Fail fast at boot: if `NODE_ENV==='production'` and `JWT_SECRET` is unset (or shorter than
32 chars), throw and refuse to start. Never ship a default secret.

### 6. No brute-force protection on login & OTP
**Files:** `user.service.ts` (login/verifyOTP), `server.ts:31` (global limiter only)

6-digit OTPs (1e6 space) live for 10 minutes with no per-account attempt counter or lockout. The
only control is a global **per-IP** limiter (100 req / 15 min) applied to all routes — a distributed
or patient attacker can still grind OTPs and passwords.

**Fix:** Add a dedicated, stricter limiter on `/login`, `/verify-*`, `/forgot-password`,
`/reset-password` (e.g. 5–10/15 min per IP + per account). Add a per-account failed-attempt counter
with temporary lockout and OTP invalidation after N failures.

---

## MEDIUM

### 7. CORS `origin:'*'` with `credentials:true`
**File:** `backend/src/server.ts:23`. Wildcard origin + credentials is an invalid, over-permissive
combination (browsers reject it, but the intent is wrong). Replace with an explicit allowlist
(`FRONTEND_URL`, app web origin) and reject unknown origins.

### 8. Email enumeration on forgot-password
**File:** `user.service.ts:343` — returns `404 "User with this email does not exist"`, letting an
attacker enumerate registered emails. Return a **generic success** message regardless of existence.

### 9. Weak password policy
**File:** `user.validation.ts:6` — min 6 chars, no complexity/breach check. Raise to ≥8 with basic
complexity and, ideally, a HaveIBeenPwned k-anonymity check.

### 10. Long-lived JWT, no revocation
**File:** `config/index.ts:57` — 7-day tokens, no refresh token, no logout/blacklist. A stolen token
is valid for a week. Consider short access tokens (15–60 min) + refresh tokens, or a revocation list.

### 11. Google login verifies access token, not ID token
**File:** `user.service.ts:229` — calls the userinfo endpoint with a bearer access token. Access
tokens minted for other clients can be replayed. Prefer verifying a Google **ID token** with
`OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`. Also add input validation to
the `google-login` route.

### 12. 10 MB JSON body limit on all routes
**File:** `server.ts:44` — large-payload DoS surface, especially for AI/PDF endpoints. Lower the
global default (e.g. 100 KB) and raise per-route only where needed.

---

## LOW / INFO

- **13. Non-constant-time token comparison** (RC webhook) — use `crypto.timingSafeEqual`.
- **14. bcrypt cost 10** (`password.util.ts:3`) — bump to 12.
- **15. Firebase API key** in `mobileApp/google-services.json` — normal to ship, but must be
  **restricted** in Google Cloud Console (Android package + SHA-1, and API allowlist). Verify.
- **16. `.gitignore`** has a contradictory comment ("Do not ignore .env files") above rules that do
  ignore them. Clean up to prevent a future accidental commit. (Current state: `.env` **is** ignored
  and none are tracked — good.)
- **17. Info disclosure** — `/` and `/api/health` return the environment name; minor.

---

## Correctness / non-security bugs

- **Phone verification is effectively optional.** `verifyEmailSignup`/`verifyPhoneSignup` both set a
  local `const isFullyVerified = true` unconditionally and activate the account, while messages say
  "please verify your mobile". Dead branch; decide whether phone verification is truly required and
  simplify.
- **`invoice.paid` renewal** (`subscription.controller.ts:409`) recomputes `planEndDate` as
  `now + 30/365d` instead of using the Stripe invoice's period end — can drift on renewals.
- **DisclaimerModal exists but there are no Privacy Policy / Terms routes or pages** — required for
  App Store, Google Play, GDPR and CCPA (addressed by the legal-documents work).

---

## Recommended remediation order

1. Fix #1 (admin registration) — one-line, highest impact.
2. Fix #4 (OTP leakage) and #5 (JWT secret fail-fast).
3. Fix #3 (webhook fail-closed) and #2 (server-side entitlement verification) **before enabling payments**.
4. Add auth rate-limiting/lockout (#6), tighten CORS (#7), fix enumeration (#8).
5. Work through MEDIUM/LOW before or shortly after global launch.
