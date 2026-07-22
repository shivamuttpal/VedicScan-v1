/**
 * Web Checkout Controller — Stripe endpoints for the browser rail.
 *
 * The webhook here is the web equivalent of the RevenueCat webhook: it is the
 * only thing that grants entitlement for a web purchase. The success redirect is
 * NOT trusted — a user can navigate to `/payment-success` directly, so nothing
 * is granted on that page. Only a signature-verified Stripe event grants access.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { webCheckoutService, WebCheckoutError } from '../services/webCheckout.service';
import { paymentService } from '../../subscription/services/payment.service';
import { createCheckoutSchema } from '../validators/billing.validator';
import { successResponse, errorResponse } from '../../../utils/response.util';
import { planRepository } from '../repositories';
import config from '../../../config';

/** Region resolution, mirroring plan.controller. */
function resolveRegion(req: Request, override?: string): string {
  if (override) return override.toUpperCase();
  const header =
    (req.headers['cloudfront-viewer-country'] as string) ||
    (req.headers['cf-ipcountry'] as string) ||
    (req.headers['x-vercel-ip-country'] as string);
  return header ? header.toUpperCase() : 'DEFAULT';
}

export const webCheckoutController = {
  /**
   * POST /api/billing/checkout
   * Creates a Stripe Checkout Session for a catalogue plan.
   */
  async createSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createCheckoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(res, 'Invalid request body', 400, parsed.error.flatten());
      }

      if (!config.stripe.secretKey) {
        return errorResponse(res, 'Web payments are not configured.', 503);
      }

      const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;

      const result = await webCheckoutService.createCheckoutSession({
        userId: req.user!.userId,
        email: req.user!.email,
        planCode: parsed.data.planCode,
        region: resolveRegion(req, parsed.data.region),
        successUrl: parsed.data.successUrl || `${origin}/payment-success`,
        cancelUrl: parsed.data.cancelUrl || `${origin}/pricing?payment=cancelled`,
      });

      return successResponse(res, result, 'Checkout session created');
    } catch (error) {
      if (error instanceof WebCheckoutError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return next(error);
    }
  },

  /**
   * POST /api/billing/webhooks/stripe
   *
   * Requires the RAW request body for signature verification — see the
   * `express.json({ verify })` hook in server.ts which captures `rawBody` for
   * this path. If the body were parsed first, the signature would never match.
   */
  async handleStripeWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'] as string;
    let event: any;

    try {
      event = paymentService.constructEvent((req as any).rawBody || req.body, signature);
    } catch (err: any) {
      // Signature failure means the payload is unauthenticated — reject it.
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      const result = await webCheckoutController.processEvent(event);
      console.log(`[Stripe Webhook] ${event.type} → ${result}`);
      res.json({ received: true, result });
    } catch (error) {
      // Same reasoning as the RevenueCat handler: a deterministic bug would be
      // replayed identically on every retry. Log loudly, acknowledge, and fix
      // forward rather than letting Stripe hammer the endpoint.
      console.error(`[Stripe Webhook] Processing error for ${event?.id} (${event?.type}):`, error);
      res.json({ received: true, result: 'error_logged' });
    }
  },

  /** Maps a Stripe event onto an entitlement change. Exported for testing. */
  async processEvent(event: any): Promise<string> {
    switch (event.type) {
      // ── Initial purchase (subscription or one-time pack) ──
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planCode = session.metadata?.plan;

        if (!userId || !planCode) {
          console.error('[Stripe Webhook] Session missing userId/plan metadata:', session.id);
          return 'missing_metadata';
        }

        // Stripe reports `payment_status: 'unpaid'` for async methods that have
        // not settled. Granting then would hand out access for money we may
        // never receive; the later `invoice.paid` event covers those.
        if (session.payment_status && session.payment_status !== 'paid') {
          return `awaiting_payment:${session.payment_status}`;
        }

        return webCheckoutService.grantFromStripe({
          userId,
          planCode,
          stripeEventId: event.id,
          stripeSubscriptionId: session.subscription ?? undefined,
          amountMinor: session.amount_total ?? undefined,
          currency: session.currency?.toUpperCase(),
          periodEnd: null,
          occurredAt: new Date(event.created * 1000),
          isRenewal: false,
        });
      }

      // ── Recurring renewal ──
      case 'invoice.paid': {
        const invoice = event.data.object;
        if (!invoice.subscription) return 'not_a_subscription_invoice';

        const stripeSub = await paymentService.stripeClient.subscriptions.retrieve(
          invoice.subscription as string
        );
        const userId = (stripeSub as any)?.metadata?.userId || invoice.metadata?.userId;
        const planCode = (stripeSub as any)?.metadata?.plan;

        if (!userId || !planCode) return 'missing_metadata';

        const periodEnd = (stripeSub as any)?.current_period_end
          ? new Date((stripeSub as any).current_period_end * 1000)
          : null;

        return webCheckoutService.grantFromStripe({
          userId,
          planCode,
          stripeEventId: event.id,
          stripeSubscriptionId: invoice.subscription as string,
          amountMinor: invoice.amount_paid ?? undefined,
          currency: invoice.currency?.toUpperCase(),
          periodEnd,
          occurredAt: new Date(event.created * 1000),
          isRenewal: true,
        });
      }

      // ── Auto-renew turned off, or subscription ended ──
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (!userId) return 'missing_metadata';

        return webCheckoutService.revokeFromStripe({
          userId,
          stripeEventId: event.id,
          reason: 'expired',
          occurredAt: new Date(event.created * 1000),
        });
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (!userId) return 'missing_metadata';

        // cancel_at_period_end means the user turned off renewal but has paid
        // through the current period — access must continue until then.
        if (sub.cancel_at_period_end) {
          return webCheckoutService.revokeFromStripe({
            userId,
            stripeEventId: event.id,
            reason: 'cancelled',
            occurredAt: new Date(event.created * 1000),
          });
        }
        return 'subscription_updated_no_action';
      }

      // ── Refund ──
      case 'charge.refunded': {
        const charge = event.data.object;
        const userId = charge.metadata?.userId;
        if (!userId) return 'missing_metadata';

        return webCheckoutService.revokeFromStripe({
          userId,
          stripeEventId: event.id,
          reason: 'refunded',
          occurredAt: new Date(event.created * 1000),
        });
      }

      default:
        return `unhandled:${event.type}`;
    }
  },
};
