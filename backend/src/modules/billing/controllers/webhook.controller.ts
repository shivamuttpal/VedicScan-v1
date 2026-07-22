/**
 * RevenueCat Webhook Controller
 *
 * ─── Response contract ────────────────────────────────────────────────────────
 * RevenueCat retries any non-2xx response with backoff for up to ~72 hours. That
 * makes the status code a control signal, so it is chosen deliberately:
 *
 *   200 — event was handled, OR was a duplicate, OR was intentionally ignored,
 *         OR hit a bug on our side. In the bug case the event is already
 *         persisted with status `failed`, so our own retry cron owns recovery.
 *         Asking RevenueCat to retry a deterministic bug would just replay the
 *         same failure thousands of times.
 *
 *   400 — malformed payload. Retrying cannot fix it.
 *   401 — bad auth token (handled upstream in middleware).
 *
 * The key invariant: we never return 200 for an event we failed to *record*,
 * and never return 5xx for one we recorded but failed to *process*.
 */

import { Request, Response } from 'express';
import { revenueCatSyncService } from '../services';
import { revenueCatWebhookSchema } from '../validators/billing.validator';
import type { RevenueCatWebhookEvent } from '../services';

export const webhookController = {
  /**
   * POST /api/billing/webhooks/revenuecat
   *
   * Authenticated by `verifyRevenueCatWebhook` before reaching this handler.
   */
  async handleRevenueCat(req: Request, res: Response) {
    const parsed = revenueCatWebhookSchema.safeParse(req.body);

    if (!parsed.success) {
      console.error('[RevenueCat Webhook] Malformed payload:', parsed.error.flatten());
      // 400 — the payload is unprocessable, so retries are pointless.
      res.status(400).json({ error: 'Malformed webhook payload' });
      return;
    }

    const event = parsed.data.event as unknown as RevenueCatWebhookEvent;

    try {
      const result = await revenueCatSyncService.handleWebhookEvent(event);

      console.log(
        `[RevenueCat Webhook] ${event.type} | user=${event.app_user_id} | product=${event.product_id ?? '-'} | result=${result}`
      );

      res.status(200).json({ received: true, result });
    } catch (error: any) {
      // The event is already persisted as `failed` by the sync service, so it is
      // not lost — the retry cron will reprocess it. Acknowledge to stop
      // RevenueCat hammering an endpoint that will deterministically fail again.
      console.error(
        `[RevenueCat Webhook] Processing error for event ${event.id} (${event.type}):`,
        error
      );
      res.status(200).json({ received: true, result: 'deferred_to_retry' });
    }
  },
};
