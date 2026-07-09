# VedicScan — Optimization Pass & Scale Plan (first ~1,000 users)

**Date:** 2026-07-09
**Scope:** `backend/` (Node/Express/TS + MongoDB), `frontend/` (React/CRA), `mobileApp/` (Expo RN)

This document covers (1) what was optimized in this pass, (2) a system-design/scale plan,
(3) the manual steps you must do (env/keys/infra), and (4) how it ties into the earlier
security + legal work.

---

## 1. What was changed in this pass (already applied & verified)

### Backend
| Change | File | Why it matters at scale |
|--------|------|-------------------------|
| **Gzip compression** on all responses | `src/server.ts` | 60–80% smaller JSON/PDF payloads → faster mobile loads, less bandwidth cost |
| **Index on `Profile.userId`** (+ `userId+isDefault`) | `profile.model.ts` | Profiles are read on *every* chat message; without this it was a full collection scan |
| **Index on `ChatSession.userId + updatedAt`** | `chat.model.ts` | History listing (`find({userId}).sort({updatedAt})`) now uses an index |
| **Mongoose pool + timeouts** (`maxPoolSize:20`, fail-fast selection) | `config/database.ts` | Bounded, predictable DB concurrency; fails fast instead of hanging |
| **Skip redundant writes** in usage middleware + status (`isModified()` guard) | `usageLimit.middleware.ts`, `subscription.controller.ts` | Removed 1 DB write on *every* API call / status poll |

### Frontend
| Change | File | Effect |
|--------|------|--------|
| **Route-level code splitting** (`React.lazy` + `Suspense`) | `src/App.js` | Initial JS bundle **193 KB → 89 KB** (−104 KB); pages load on demand |
| **Memoized AuthContext value** (`useMemo`) | `context/AuthContext.jsx` | Prevents context consumers re-rendering on every provider render |

### Mobile
| Change | File | Effect |
|--------|------|--------|
| **Gated per-request logging behind `__DEV__`** | `src/config/api.js` | No console spam / overhead in production builds |

**Verified:** backend `tsc --noEmit` clean · frontend `npm run build` compiles (chunked) ·
mobile files parse with `babel-preset-expo`.

---

## 2. Can it handle the first 1,000 users?

**Yes — comfortably on a single modest instance**, provided the manual steps in Section 3 are
done. Rough capacity of a single 1–2 vCPU / 1–2 GB API instance + MongoDB (e.g. Atlas M10):

- **Auth / profile / status / chart-read endpoints:** hundreds of req/s. Not a concern for 1k users.
- **Bottleneck 1 — AI chat (`/api/chat/message`):** latency and cost are dominated by the OpenAI
  call (1–5 s each). Concurrency is bounded by OpenAI rate limits and your spend, not our server.
- **Bottleneck 2 — Kundali generation (`/api/kundali/generate`):** spawns a **Python subprocess**
  per request (Swiss Ephemeris) + a geocoding HTTP call. This is CPU- and latency-heavy. It's
  already **cached** by `(userId, dob, place)`, so repeat generations are free. For 1k users this
  is fine, but see the scale plan below before you hit heavy concurrent load.

For 1,000 users with normal usage patterns, a single API instance + managed MongoDB is enough.

---

## 3. Manual steps you must do (env / keys / infra)

### 3.1 Required environment variables (production)
Set these in your backend host (never commit them). The app now **refuses to boot** in
production without a strong `JWT_SECRET`.

```bash
NODE_ENV=production
PORT=8001

# Auth — MUST be a long random string (>= 32 chars). Generate with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=<64+ hex chars>
JWT_EXPIRES_IN=7d

# Database — use a managed MongoDB with auth + TLS (e.g. MongoDB Atlas)
MONGO_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net
DB_NAME=vedicscan

# CORS — comma-separated exact origins of your web app(s). No trailing slash.
FRONTEND_URL=https://vedicscan.com,https://www.vedicscan.com

# Rate limiting (defaults are fine)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...          # if using the Assistants flow
OPENAI_MODEL=gpt-4o-mini              # cheapest capable default

# Email / SMS (AWS SES + SNS)
AWS_ACCESS_KEY=...
AWS_SECRET_KEY=...
AWS_REGION=ap-south-1
AWS_SES_SOURCE_EMAIL=noreply@vedicscan.com
# (or GMAIL_USER / GMAIL_PASS if using Gmail SMTP)

# Google Sign-In — the OAuth client ID used to verify ID tokens
GOOGLE_CLIENT_ID=...apps.googleusercontent.com

# Payments — Stripe (web)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Payments — RevenueCat (mobile IAP). BOTH are now required for the sync/webhook to work.
REVENUECAT_WEBHOOK_AUTH_TOKEN=<random secret you set in the RevenueCat dashboard>
REVENUECAT_SECRET_KEY=<RevenueCat REST API v1 secret key>
REVENUECAT_ALLOW_SANDBOX=false
```

> **Important consequences of the security fixes:**
> - Without `REVENUECAT_WEBHOOK_AUTH_TOKEN` the RevenueCat webhook now **rejects all calls**
>   (fail-closed). Set it, and configure the same token in RevenueCat.
> - Without `REVENUECAT_SECRET_KEY` the `/revenuecat-sync` endpoint returns 503 (it now verifies
>   entitlements server-side instead of trusting the client).
> - `PAYMENTS_ENABLED` is currently `false` in `config/plans.ts` (everyone is treated as Premium).
>   Flip it to `true` only after the above payment envs are set and tested.

### 3.2 One-time database maintenance
The new indexes are created automatically on boot in dev. In production with large collections,
build them in the background to avoid blocking:
```js
// mongosh, once:
db.profiles.createIndex({ userId: 1 })
db.profiles.createIndex({ userId: 1, isDefault: 1 })
db.chatsessions.createIndex({ userId: 1, updatedAt: -1 })
// If the legacy single-field chat index still exists:
db.chatsessions.dropIndex('conversationId_1')   // ignore error if absent
```
Also set Mongoose `autoIndex: false` in production if you build indexes manually (optional).

### 3.3 Frontend / mobile env
```bash
# frontend/.env
REACT_APP_BACKEND_URL=https://api.vedicscan.com     # your API origin
REACT_APP_GOOGLE_CLIENT_ID=...apps.googleusercontent.com

# mobileApp — BACKEND_URL is currently hardcoded to https://vedicscan.com/ in src/config/api.js.
# Point it at your real API origin before building for stores.
```

### 3.4 Infrastructure checklist
- [ ] Managed **MongoDB (Atlas M10+)** with auth, TLS, IP allowlist, and daily backups.
- [ ] Run the API behind **HTTPS** (reverse proxy / load balancer). `trust proxy` is already set to 1.
- [ ] Serve the built frontend from a **CDN** (Netlify/Vercel/CloudFront) — the code-split chunks
      benefit hugely from CDN caching.
- [ ] Set a **process manager** (PM2 / container) with auto-restart and 1 instance per CPU core.
- [ ] Add **uptime + error monitoring** (see Section 5).
- [ ] Restrict the **Firebase API key** in `mobileApp/google-services.json` (Google Cloud Console →
      package name + SHA-1 + API allowlist).
- [ ] Rotate any keys that were ever shared in plaintext.

---

## 4. System design & scale plan

### 4.1 Current architecture
```
 Web (CRA, CDN)                                  ┌────────────┐
      │                                          │  OpenAI    │
      ▼                                          └─────▲──────┘
 ┌─────────────┐    HTTPS    ┌───────────────────┐    │
 │  Mobile     │ ──────────► │  Express API      │────┘
 │  (Expo RN)  │             │  (single instance)│────► MongoDB (Atlas)
 └─────────────┘             │                   │────► Python (Swiss Ephemeris) via spawn
                             │                   │────► AWS SES/SNS, Stripe, RevenueCat, Nominatim
                             └───────────────────┘
```

### 4.2 What to implement as you grow (in priority order)

**Now (0–1k users) — done or trivial**
1. ✅ Indexes, compression, connection pooling, code splitting (this pass).
2. ✅ Fail-fast config, rate limiting on auth.
3. Add **request logging + error tracking** (Sentry) — small effort, huge debugging payoff.

**Soon (1k–10k users)**
4. **Cache read-heavy endpoints** — `/api/subscription/pricing` (public, rarely changes),
   `/api/rashifal` (per-sign per-day) with a short in-memory TTL or Redis. These are pure wins.
5. **Move the Python kundali engine off the request path.** Options:
   - Keep a **warm Python worker pool** (or a small FastAPI sidecar) instead of `spawn` per request;
   - or push generation to a **job queue** (BullMQ/Redis) and return the cached result when ready.
   This removes the biggest per-request CPU/latency cost.
6. **Geocoding cache in the DB** (currently in-memory only, lost on restart) — persist
   place→lat/lng so restarts don't re-hit Nominatim (and respect their usage policy / self-host).
7. **Externalize the rate limiter to Redis** once you run **more than one API instance**
   (in-memory limits don't coordinate across instances).

**Later (10k+ users)**
8. Horizontal scale: multiple stateless API instances behind a load balancer (the app is already
   stateless except in-memory caches/limiter → move those to Redis first).
9. MongoDB read replicas / higher tier; add compound indexes as query patterns emerge (use
   `explain()` on slow queries).
10. Consider **streaming** AI responses (SSE) for better perceived latency in chat.
11. Add an **API response cache / edge** for public content.

### 4.3 Frontend/mobile scale notes
- Frontend is now code-split; ensure the CDN sets **long cache headers** on `/static/**` (CRA
  hashes filenames, so this is safe) and **no-cache** on `index.html`.
- Compress large image assets (the ~1.3 MB logo used as a PDF/watermark and mobile assets) —
  serve appropriately sized versions. This is the biggest remaining asset win.
- Mobile: keep using `FlatList` (already done in chat) for any long lists.

---

## 5. Recommended additions (not yet done — your call)

| Item | Effort | Benefit |
|------|--------|---------|
| **Sentry** (backend + web + mobile) | Low | Catch production errors/perf regressions |
| **Redis** (cache + rate limiter + job queue) | Medium | Needed before multi-instance; speeds up pricing/rashifal |
| **Warm Python worker / job queue for kundali** | Medium | Removes the main per-request CPU cost |
| **Persistent geocoding cache** | Low | Fewer external calls, faster charts |
| **CI: run `tsc --noEmit` + `npm run build` on every PR** | Low | Prevents broken deploys |
| **Load test** (k6/Artillery) at ~50 concurrent chat users | Low | Validate real capacity before launch |

---

## 6. How this connects to the earlier work

- **Security:** see `SECURITY_AUDIT.md`. All Critical + High + the agreed Medium/Low items are
  fixed. Remaining manual security steps are in Section 3 (strong `JWT_SECRET`, RevenueCat tokens,
  Firebase key restriction, HTTPS/CORS origins).
- **Legal/compliance:** six documents in `frontend/public/legal/` are live at `/privacy`,
  `/terms`, `/refund`, `/data-deletion`, `/cookies`, `/disclaimer`, linked from the web footer and
  the mobile Profile screen. **You must fill the `[bracketed]` placeholders** (legal entity,
  address, grievance officer, refund windows) before publishing.
- **Account deletion:** `DELETE /api/users/account` + web/mobile buttons back the Data Deletion
  policy (required by Apple/Google).

---

## 7. Your immediate manual checklist

1. [ ] Set all production **env vars** (Section 3.1) — especially a strong `JWT_SECRET` and the two
       RevenueCat secrets.
2. [ ] Point `frontend/.env` `REACT_APP_BACKEND_URL` and the mobile `BACKEND_URL` at your real API.
3. [ ] Provision **MongoDB Atlas** (auth+TLS+backups) and build the indexes (Section 3.2).
4. [ ] Deploy the frontend to a **CDN**; deploy the API behind **HTTPS** with a process manager.
5. [ ] Fill the **legal placeholders**; add `/privacy` and `/data-deletion` URLs to App Store &
       Play Console.
6. [ ] Restrict the **Firebase API key**.
7. [ ] Add **Sentry** + a quick **load test** before flipping `PAYMENTS_ENABLED=true`.
