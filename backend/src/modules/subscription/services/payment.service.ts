import Stripe from 'stripe';
import config from '../../../config';

class PaymentService {
  private stripe: InstanceType<typeof Stripe>;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2025-01-27.acacia' as any, // latest stable
    });
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
  }) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'], // Add 'upi' or others if enabled in Dashboard
        line_items: [
          {
            price_data: {
              currency: params.currency.toLowerCase(),
              product_data: {
                name: `VedicScan ${params.plan.charAt(0).toUpperCase() + params.plan.slice(1)} Plan`,
                description: `${params.billingCycle === 'annual' ? '1 Year' : '1 Month'} Subscription`,
              },
              unit_amount: params.amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: params.email,
        metadata: {
          userId: params.userId,
          plan: params.plan,
          billingCycle: params.billingCycle,
        },
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
