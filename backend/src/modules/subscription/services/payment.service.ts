import Stripe from 'stripe';
import config from '../../../config';

class PaymentService {
  private stripe: InstanceType<typeof Stripe>;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2025-01-27.acacia' as any, // latest stable
    });
  }

  /** Expose stripe client for advanced calls (e.g. subscriptions.retrieve) */
  get stripeClient() {
    return this.stripe;
  }

  /**
   * Create a Stripe Checkout Session
   */
  async createCheckoutSession(params: {
    userId: string;
    email?: string;
    amount: number;
    currency: string;
    plan: string;
    billingCycle: string;
    successUrl: string;
    cancelUrl: string;
    isOneTime?: boolean;
  }) {
    try {
      const isOneTimePurchase = params.isOneTime || params.billingCycle === 'none';

      // One-time: use a regular unit_amount price_data (no recurring field)
      // Subscription: use recurring price_data so Stripe auto-charges on renewal
      const lineItem = isOneTimePurchase
        ? {
            price_data: {
              currency: params.currency.toLowerCase(),
              product_data: {
                name: `VedicScan ${params.plan.charAt(0).toUpperCase() + params.plan.slice(1)}`,
                description: 'One-time service',
              },
              unit_amount: params.amount,
            },
            quantity: 1,
          }
        : {
            price_data: {
              currency: params.currency.toLowerCase(),
              product_data: {
                name: `VedicScan ${params.plan.charAt(0).toUpperCase() + params.plan.slice(1)} Plan`,
                description: params.billingCycle === 'annual' ? '1 Year Subscription' : 'Monthly Subscription',
              },
              unit_amount: params.amount,
              recurring: {
                interval: params.billingCycle === 'annual' ? ('year' as const) : ('month' as const),
              },
            },
            quantity: 1,
          };

      // Metadata must be attached to the Subscription / PaymentIntent as well as
      // the Session. Later lifecycle events (invoice.paid on renewal,
      // customer.subscription.deleted, charge.refunded) carry the Subscription or
      // Charge — NOT the Session — so metadata set only on the Session is
      // unreachable and the webhook cannot tell which user to credit.
      const metadata = {
        userId: params.userId,
        plan: params.plan,
        billingCycle: params.billingCycle,
      };

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [lineItem],
        mode: isOneTimePurchase ? 'payment' : 'subscription',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: params.email,
        metadata,
        ...(isOneTimePurchase
          ? { payment_intent_data: { metadata } }
          : { subscription_data: { metadata } }),
      });
      return session;
    } catch (error: any) {
      console.error('[Stripe] Checkout session creation failed:', error);
      throw new Error(error.message || 'Failed to create Stripe payment session');
    }
  }

  /**
   * Construct event from webhook raw body
   */
  constructEvent(payload: string | Buffer, signature: string) {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret
    );
  }
}

export const paymentService = new PaymentService();
