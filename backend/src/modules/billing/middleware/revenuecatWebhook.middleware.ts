/**
 * RevenueCat Webhook Authentication
 *
 * RevenueCat authenticates its webhooks with a static bearer token that you
 * configure in its dashboard (it does not sign payloads like Stripe). That token
 * is therefore the *only* thing standing between the internet and an endpoint
 * that grants premium access, so this middleware is deliberately strict:
 *
 *   • FAIL CLOSED when no token is configured. An unset env var must reject every
 *     request — otherwise a deploy that forgets the variable silently exposes an
 *     endpoint where anyone can POST an app_user_id and grant themselves premium.
 *
 *   • CONSTANT-TIME comparison. A naive `===` leaks the token byte-by-byte through
 *     timing differences, letting an attacker recover it with enough samples.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { revenueCatConfig } from '../config/billing.config';

export const verifyRevenueCatWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const expectedToken = revenueCatConfig.webhookAuthToken;

  if (!expectedToken) {
    console.error(
      '[RevenueCat Webhook] REVENUECAT_WEBHOOK_AUTH_TOKEN is not set — rejecting all webhook traffic.'
    );
    res.status(503).json({ error: 'Webhook authentication is not configured' });
    return;
  }

  const provided = String(req.headers['authorization'] || '');
  const expected = `Bearer ${expectedToken}`;

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  // timingSafeEqual throws on length mismatch, so compare lengths first — the
  // length itself is not sensitive, only the content.
  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    console.warn('[RevenueCat Webhook] Rejected request with invalid authorization token.');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
};
