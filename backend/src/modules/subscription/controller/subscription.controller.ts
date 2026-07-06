import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { UserUsage, getISTMidnight, getISTMonthStart } from '../model/subscription.model';
import { Transaction, TransactionStatus } from '../model/transaction.model';
import { PricingConfig, DEFAULT_PRICING } from '../model/pricing.model';
import {
  getPlanLimits,
  PlanType,
  PLAN_PRICES,
  isValidPurchase,
  isOneTimeFeature,
  isSubscriptionPlan,
  PLAN_DISPLAY_NAMES,
  PAYMENTS_ENABLED,
  UNLIMITED_LIMITS,
} from '../../../config/plans';
import { paymentService } from '../services/payment.service';
import { User } from '../../user/model/user.model';
import { sendPaymentSuccessEmail } from '../../../utils/mail.util';
import config from '../../../config';

async function seedPricingIfEmpty() {
  const count = await PricingConfig.countDocuments();
  if (count === 0) {
    await PricingConfig.insertMany(DEFAULT_PRICING);
    console.log('[Pricing] Seeded default pricing config');
  }
}

// RevenueCat event types that activate or renew a subscription
const RC_ACTIVATE_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE',
]);

// Entitlement ID → plan name
const RC_ENTITLEMENT_TO_PLAN: Record<string, string> = {
  'vedicscan Pro': 'premium',
  standard_access: 'standard',
  premium_access: 'premium',
};

function getPlanFromRC(entitlementIds: string[], productId: string): string {
  for (const id of entitlementIds) {
    if (RC_ENTITLEMENT_TO_PLAN[id]) return RC_ENTITLEMENT_TO_PLAN[id];
  }
  if (productId.includes('premium')) return 'premium';
  if (productId.includes('standard')) return 'standard';
  // lifetime and yearly products all map to premium
  return 'premium';
}

function getBillingCycleFromProductId(productId: string): 'monthly' | 'annual' {
  if (productId === 'lifetime') return 'annual'; // treated as annual for backend limits
  if (productId.includes('annual') || productId.includes('year') || productId === 'yearly') return 'annual';
  return 'monthly';
}

export const subscriptionController = {
  /**
   * GET /api/subscription/pricing  — public
   * Returns active pricing plans from DB, auto-seeding defaults on first call.
   */
  async getPricing(_req: Request, res: Response) {
    try {
      await seedPricingIfEmpty();
      const plans = await PricingConfig.find({ isActive: true }).lean().select('-__v -createdAt -updatedAt');
      res.json({ success: true, data: plans });
    } catch (error) {
      console.error('[Pricing] getPricing error:', error);
      res.status(500).json({ success: false, message: 'Failed to load pricing' });
    }
  },

  /**
   * GET /api/subscription/status
   * Returns real usage data for the authenticated user
   */
  async getStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      // Get or create usage record
      let usage = await UserUsage.findOne({ userId });
      if (!usage) {
        usage = new UserUsage({ userId, plan: 'free' });
        await usage.save();
      }

      let plan = usage.plan as PlanType;

      // ─── Check for plan expiration ───
      if (plan !== 'free' && usage.planEndDate && new Date() > usage.planEndDate) {
        console.log(`[SubscriptionController] Plan ${plan} expired for user ${userId}. Reverting to free.`);
        usage.previousPlan = usage.plan;
        usage.plan = 'free';
        usage.billingCycle = 'none';
        await usage.save();
        plan = 'free';

        // Also revert isSubscriber
        await User.updateOne({ _id: userId }, { $set: { isSubscriber: false } });
      }

      // TEMP: payments disabled — report everyone as Premium with unlimited usage
      // so the app unlocks all features. Restore honest status by flipping PAYMENTS_ENABLED.
      const reportPlan: PlanType = PAYMENTS_ENABLED ? plan : 'premium';
      const limits = PAYMENTS_ENABLED ? getPlanLimits(plan) : UNLIMITED_LIMITS;

      // Auto-reset counters if needed
      const todayMidnight = getISTMidnight();
      if (usage.lastDailyReset < todayMidnight) {
        usage.dailyQuestionsUsed = 0;
        usage.dailyTokensUsed = 0;
        usage.lastDailyReset = todayMidnight;
      }

      const monthStart = getISTMonthStart();
      if (usage.lastMonthlyReset < monthStart) {
        usage.monthlyQuestionsUsed = 0;
        usage.monthlyTokensUsed = 0;
        usage.lastMonthlyReset = monthStart;
      }

      await usage.save();

      // Calculate next reset times
      const nextDailyReset = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);
      const nextMonthlyReset = new Date(
        Date.UTC(
          todayMidnight.getUTCFullYear(),
          todayMidnight.getUTCMonth() + 1,
          1
        )
      );

      const userRecord = await User.findById(userId).select('emailUnsubscribed').lean();

      res.json({
        plan: reportPlan,
        planEndDate: usage.planEndDate?.toISOString() || null,
        billingCycle: usage.billingCycle,
        emailUnsubscribed: userRecord?.emailUnsubscribed ?? true,
        usage: {
          questions_asked: usage.dailyQuestionsUsed,
          limit: limits.dailyQuestions,
          can_ask: PAYMENTS_ENABLED
            ? (usage.dailyQuestionsUsed < limits.dailyQuestions &&
               usage.monthlyQuestionsUsed < limits.monthlyQuestions)
            : true,
          daily: {
            used: usage.dailyQuestionsUsed,
            limit: limits.dailyQuestions,
            remaining: Math.max(0, limits.dailyQuestions - usage.dailyQuestionsUsed),
          },
          monthly: {
            used: usage.monthlyQuestionsUsed,
            limit: limits.monthlyQuestions,
            remaining: Math.max(0, limits.monthlyQuestions - usage.monthlyQuestionsUsed),
          },
          tokens: {
            daily: usage.dailyTokensUsed,
            monthly: usage.monthlyTokensUsed,
            total_prompt: usage.totalPromptTokens,
            total_completion: usage.totalCompletionTokens,
          },
        },
        limits: {
          daily_questions: limits.dailyQuestions,
          monthly_questions: limits.monthlyQuestions,
          max_words_per_question: limits.maxWordsPerQuestion,
          max_context_messages: limits.maxContextMessages,
        },
        next_daily_reset: nextDailyReset.toISOString(),
        next_monthly_reset: nextMonthlyReset.toISOString(),
      });
    } catch (error) {
      console.error('Subscription getStatus error:', error);
      // Return fallback so frontend doesn't break
      res.json({
        plan: 'free',
        usage: {
          questions_asked: 0,
          limit: 3,
          can_ask: true,
        },
      });
    }
  },

  /**
   * POST /api/subscription/create-checkout-session
   * Creates a Stripe Checkout Session for subscriptions or one-time features
   */
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const { plan, billingCycle, successUrl, cancelUrl, currency = 'INR' } = req.body;
      const userId = req.user!.userId;

      // ─── Centralized validation ───
      if (!isValidPurchase(plan)) {
        res.status(400).json({ success: false, message: 'Invalid plan or feature type.' });
        return;
      }

      const oneTime = isOneTimeFeature(plan);

      // Check for duplicate one-time purchases
      if (oneTime) {
        const user = await User.findById(userId);
        if (user?.purchasedFeatures?.includes(plan)) {
          res.status(400).json({
            success: false,
            message: `You have already purchased ${PLAN_DISPLAY_NAMES[plan] || plan}. No need to buy again!`,
          });
          return;
        }
      }

      const selectedCurrency = (currency as string).toUpperCase();
      if (!['INR', 'USD'].includes(selectedCurrency)) {
        res.status(400).json({ success: false, message: 'Unsupported currency.' });
        return;
      }

      let amount: number | undefined;
      let cycle = 'none';

      if (oneTime) {
        // One-time features: still use static PLAN_PRICES (paise/cents)
        amount = (PLAN_PRICES as any)[selectedCurrency]?.['one-time']?.[plan];
      } else {
        // Subscription plans: read from DB (major units) and convert to paise/cents for Stripe
        cycle = billingCycle === 'annual' ? 'annual' : 'monthly';
        const pricingDoc = await PricingConfig.findOne({ planId: plan, isActive: true }).lean();
        if (pricingDoc) {
          const majorAmount = (pricingDoc as any)[selectedCurrency]?.[cycle];
          if (majorAmount) amount = Math.round(majorAmount * 100);
        }
        // Fallback to static PLAN_PRICES if DB doc not found
        if (!amount) {
          amount = (PLAN_PRICES as any)[selectedCurrency]?.[plan]?.[cycle];
        }
      }

      if (!amount) {
        res.status(400).json({ success: false, message: 'Invalid pricing configuration.' });
        return;
      }

      // Create Stripe Checkout Session
      const session = await paymentService.createCheckoutSession({
        userId,
        email: (req.user as any).email,
        amount,
        currency: selectedCurrency,
        plan,
        billingCycle: cycle,
        successUrl: successUrl || `${req.protocol}://${req.get('host')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: cancelUrl || `${req.protocol}://${req.get('host')}/payment-cancel`,
      });

      // Create local Pending Transaction
      await Transaction.create({
        userId,
        stripeSessionId: session.id,
        amount,
        currency: selectedCurrency,
        plan,
        billingCycle: cycle,
        status: TransactionStatus.PENDING,
      });

      res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      console.error('Create checkout session error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create payment session' });
    }
  },

  /**
   * POST /api/subscription/webhook
   * Stripe Webhook handler for async payment confirmation
   */
  async handleWebhook(req: any, res: Response) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // req.body must be Raw for Stripe signature verification
      event = paymentService.constructEvent(req.rawBody || req.body, sig);
    } catch (err: any) {
      console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const dbSession = await mongoose.startSession();
      dbSession.startTransaction();

      try {
        const userId = session.metadata?.userId;
        const stripeSessionId = session.id;

        if (!userId) {
          console.error('[Stripe Webhook] Missing userId in session metadata');
          await dbSession.abortTransaction();
          res.json({ received: true });
          return;
        }

        // 1. Find Pending Transaction
        const transaction = await Transaction.findOne({ stripeSessionId, userId }).session(dbSession);
        if (!transaction) {
          console.error('[Stripe Webhook] Transaction record not found for session:', stripeSessionId);
          await dbSession.abortTransaction();
          res.json({ received: true });
          return;
        }

        // Idempotency — skip if already processed
        if (transaction.status === TransactionStatus.COMPLETED) {
          await dbSession.abortTransaction();
          res.json({ received: true });
          return;
        }

        // 2. Mark transaction as completed
        transaction.stripePaymentIntentId = session.payment_intent;
        transaction.status = TransactionStatus.COMPLETED;
        await transaction.save({ session: dbSession });

        // 3. Process based on purchase type
        if (isOneTimeFeature(transaction.plan)) {
          // ── One-time feature purchase ──
          await User.updateOne(
            { _id: userId },
            { $addToSet: { purchasedFeatures: transaction.plan } }
          ).session(dbSession);

        } else if (isSubscriptionPlan(transaction.plan)) {
          // ── Subscription plan upgrade/renewal ──
          let usage = await UserUsage.findOne({ userId }).session(dbSession);
          if (!usage) {
            usage = new UserUsage({ userId });
          }

          const now = new Date();
          usage.previousPlan = usage.plan;
          usage.plan = transaction.plan as any;
          usage.billingCycle = transaction.billingCycle as any;

          // ─── Smart renewal logic ───
          // If renewing before current plan expires, EXTEND from planEndDate (don't lose remaining days)
          // If new subscription or expired, start from now
          const baseDate = (usage.planEndDate && usage.planEndDate > now)
            ? usage.planEndDate  // Still active — extend from existing end date
            : now;              // Expired or new — start from now

          if (transaction.billingCycle === 'annual') {
            usage.planEndDate = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
          } else {
            usage.planEndDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          }

          usage.planStartDate = now;

          // Reset notification flags for new billing period
          usage.expiryWarningNotified = false;
          usage.expiryNotified = false;

          await usage.save({ session: dbSession });

          // Update user subscriber status
          await User.updateOne(
            { _id: userId },
            { $set: { isSubscriber: true } }
          ).session(dbSession);
        }

        // 4. Send success email
        const user = await User.findById(userId).session(dbSession);
        if (user?.email) {
          sendPaymentSuccessEmail(user.email, transaction.plan, transaction.amount, transaction.currency)
            .catch(err => console.error('[Stripe Webhook] Email failed:', err));
        }

        await dbSession.commitTransaction();
        console.log(`[Stripe Webhook] Success: ${transaction.plan} activated for user ${userId}`);
      } catch (error) {
        await dbSession.abortTransaction();
        console.error('[Stripe Webhook] DB Error:', error);
      } finally {
        dbSession.endSession();
      }
    }

    // Also handle recurring subscription renewals
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;
      
      // Find the Stripe subscription to get metadata
      try {
        const stripeSub = await paymentService.stripeClient.subscriptions.retrieve(subscriptionId);
        const userId = stripeSub?.metadata?.userId || invoice.metadata?.userId;
        const plan = stripeSub?.metadata?.plan;
        const billingCycle = stripeSub?.metadata?.billingCycle || 'monthly';

        if (userId && plan) {
          let usage = await UserUsage.findOne({ userId });
          if (!usage) usage = new UserUsage({ userId });

          const now = new Date();
          usage.plan = plan as any;
          usage.billingCycle = billingCycle as any;
          usage.planStartDate = now;
          usage.planEndDate = new Date(now.getTime() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000);
          usage.expiryWarningNotified = false;
          usage.expiryNotified = false;
          await usage.save();

          await User.updateOne({ _id: userId }, { $set: { isSubscriber: true } });
          console.log(`[Stripe Webhook] Renewal: ${plan} extended for user ${userId}`);
        }
      } catch (err) {
        console.error('[Stripe Webhook] invoice.paid handling error:', err);
      }
    }

    res.json({ received: true });
  },

  /**
   * GET  /api/subscription/unsubscribe-emails  — public, token-based (email link clicks)
   * POST /api/subscription/unsubscribe-emails  — authenticated, no token needed (UI toggle)
   */
  async unsubscribeEmails(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const queryToken = req.query.token as string;
      const bodyToken = (req.body || {}).token;
      const unsubToken = queryToken || bodyToken;

      let userId: string | null = null;

      if (unsubToken) {
        // Email-link flow: decode the base64url token
        try {
          const decoded = Buffer.from(unsubToken, 'base64url').toString();
          const parts = decoded.split(':');
          if (parts[0] === 'unsub' && parts[1]) {
            userId = parts[1];
          }
        } catch {
          // fall through — userId stays null
        }

        if (!userId) {
          res.status(400).json({ success: false, message: 'Invalid unsubscribe token.' });
          return;
        }
      } else if (authReq.user?.userId) {
        // Authenticated UI flow: use the logged-in user
        userId = authReq.user.userId;
      } else {
        res.status(400).json({ success: false, message: 'Unsubscribe token or authentication is required.' });
        return;
      }

      const result = await User.updateOne(
        { _id: userId },
        { $set: { emailUnsubscribed: true } }
      );

      if (result.matchedCount === 0) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      console.log(`[Unsubscribe] User ${userId} unsubscribed from emails`);

      // Return a friendly HTML page for browser-based GET clicks (email links)
      if (queryToken) {
        res.send(`
          <html>
            <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f9fafb;">
              <div style="text-align: center; max-width: 400px;">
                <h2 style="color: #1f2937;">Successfully Unsubscribed ✅</h2>
                <p style="color: #6b7280;">You will no longer receive subscription reminder emails from VedicScan.</p>
                <p style="color: #9ca3af; font-size: 13px; margin-top: 20px;">You can re-subscribe anytime from your account settings.</p>
              </div>
            </body>
          </html>
        `);
        return;
      }

      res.json({ success: true, message: 'Successfully unsubscribed from emails.' });
    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({ success: false, message: 'Failed to process unsubscribe request.' });
    }
  },

  /**
   * POST /api/subscription/resubscribe-emails
   * Allows users to opt back in to emails
   */
  async resubscribeEmails(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      await User.updateOne(
        { _id: userId },
        { $set: { emailUnsubscribed: false } }
      );

      console.log(`[Resubscribe] User ${userId} re-subscribed to emails`);
      res.json({ success: true, message: 'Successfully re-subscribed to emails.' });
    } catch (error) {
      console.error('Resubscribe error:', error);
      res.status(500).json({ success: false, message: 'Failed to process resubscribe request.' });
    }
  },

  /**
   * DEPRECATED/REPLACED
   */
  async verifyPayment(req: AuthRequest, res: Response) {
    res.status(400).json({ success: false, message: 'Endpoint removed. Payments verified via Webhook.' });
  },

  /**
   * DEPRECATED: Replaced by createOrder + verifyPayment
   */
  async upgradePlan(req: AuthRequest, res: Response) {
    res.status(400).json({ success: false, message: 'Endpoint deprecated. Please use create-order flow.' });
  },

  /**
   * POST /api/subscription/revenuecat-sync
   * Client-triggered sync: the mobile app sends the active RevenueCat entitlement details
   * after a purchase or restore, and this updates the backend plan.
   * This is the fallback when the server-to-server webhook hasn't fired yet (sandbox, delay, etc.)
   */
  async syncRevenueCat(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        productId = '',
        entitlementIds = [] as string[],
        expirationAtMs,
        isActive,
      } = req.body;

      if (!isActive) {
        res.json({ success: true, synced: false, message: 'No active RC subscription to sync' });
        return;
      }

      const plan = getPlanFromRC(entitlementIds, productId);
      const billingCycle = getBillingCycleFromProductId(productId);

      let usage = await UserUsage.findOne({ userId });
      if (!usage) usage = new UserUsage({ userId });

      const now = new Date();
      usage.previousPlan = usage.plan;
      usage.plan = plan as any;
      usage.billingCycle = billingCycle;
      usage.planStartDate = usage.planStartDate || now;
      usage.expiryWarningNotified = false;
      usage.expiryNotified = false;

      const isLifetime = productId === 'lifetime';
      if (isLifetime) {
        usage.planEndDate = new Date('2125-01-01T00:00:00.000Z');
      } else if (expirationAtMs) {
        usage.planEndDate = new Date(Number(expirationAtMs));
      } else {
        const baseDate = (usage.planEndDate && usage.planEndDate > now) ? usage.planEndDate : now;
        usage.planEndDate = new Date(
          baseDate.getTime() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000
        );
      }

      await usage.save();
      await User.updateOne({ _id: userId }, { $set: { isSubscriber: true } });

      console.log(`[RC Sync] Synced ${plan}/${billingCycle} for user ${userId} — expires ${usage.planEndDate}`);
      res.json({ success: true, synced: true, plan, billingCycle, planEndDate: usage.planEndDate });
    } catch (error: any) {
      console.error('[RC Sync] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Sync failed' });
    }
  },

  /**
   * POST /api/subscription/revenuecat-webhook
   * Handles RevenueCat server-to-server webhook for Apple IAP and Google Play Billing.
   * Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH_TOKEN>
   */
  async handleRevenueCatWebhook(req: Request, res: Response) {
    // Verify authorization header
    const authHeader = req.headers['authorization'] || '';
    const expectedToken = config.revenueCat.webhookAuthToken;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const event = req.body?.event;
    if (!event) {
      res.status(400).json({ error: 'Missing event payload' });
      return;
    }

    const {
      type,
      app_user_id: userId,
      product_id: productId = '',
      entitlement_ids: entitlementIds = [],
      expiration_at_ms: expirationAtMs,
      id: rcEventId,
      store,
      environment,
    } = event;

    // Ignore sandbox events in production unless explicitly allowed (set REVENUECAT_ALLOW_SANDBOX=true for testing)
    if (environment === 'SANDBOX' && config.env === 'production' && !config.revenueCat.allowSandbox) {
      console.log(`[RevenueCat Webhook] Skipping sandbox event in production: ${type}`);
      res.json({ received: true });
      return;
    }

    if (!userId) {
      console.error('[RevenueCat Webhook] Missing app_user_id');
      res.status(400).json({ error: 'Missing app_user_id' });
      return;
    }

    console.log(`[RevenueCat Webhook] ${type} for user ${userId} | product: ${productId} | store: ${store}`);

    try {
      if (RC_ACTIVATE_EVENTS.has(type)) {
        // ── Activate or renew subscription ──
        const plan = getPlanFromRC(entitlementIds, productId);
        const billingCycle = getBillingCycleFromProductId(productId);
        const purchaseSource = store === 'APP_STORE' ? 'apple' : 'google';

        let usage = await UserUsage.findOne({ userId });
        if (!usage) {
          usage = new UserUsage({ userId });
        }

        const now = new Date();
        usage.previousPlan = usage.plan;
        usage.plan = plan as any;
        usage.billingCycle = billingCycle;
        usage.planStartDate = now;

        // Lifetime purchases have no expiry
        const isLifetime = productId === 'lifetime';
        if (isLifetime) {
          // Set far-future date (100 years) so expiry checks never trigger
          usage.planEndDate = new Date('2125-01-01T00:00:00.000Z');
        } else if (expirationAtMs) {
          usage.planEndDate = new Date(expirationAtMs);
        } else {
          const baseDate = (usage.planEndDate && usage.planEndDate > now) ? usage.planEndDate : now;
          usage.planEndDate = new Date(
            baseDate.getTime() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000
          );
        }

        usage.expiryWarningNotified = false;
        usage.expiryNotified = false;
        await usage.save();

        await User.updateOne({ _id: userId }, { $set: { isSubscriber: true } });

        // Record transaction for audit trail (use rcEventId as unique key)
        if (rcEventId) {
          const exists = await Transaction.findOne({ stripeSessionId: `rc_${rcEventId}` });
          if (!exists) {
            await Transaction.create({
              userId,
              stripeSessionId: `rc_${rcEventId}`,
              revenueCatEventId: rcEventId,
              purchaseSource,
              amount: 0,
              currency: event.currency || 'INR',
              plan,
              billingCycle,
              status: TransactionStatus.COMPLETED,
            });
          }
        }

        // Send success email
        const user = await User.findById(userId).select('email').lean();
        if (user?.email && type === 'INITIAL_PURCHASE') {
          sendPaymentSuccessEmail(user.email, plan, 0, event.currency || 'INR')
            .catch(err => console.error('[RevenueCat Webhook] Email failed:', err));
        }

        console.log(`[RevenueCat Webhook] Activated ${plan} (${billingCycle}) for user ${userId} until ${usage.planEndDate}`);

      } else if (type === 'EXPIRATION') {
        // ── Subscription expired ──
        const usage = await UserUsage.findOne({ userId });
        if (usage && usage.plan !== 'free') {
          usage.previousPlan = usage.plan;
          usage.plan = 'free';
          usage.billingCycle = 'none';
          await usage.save();
          await User.updateOne({ _id: userId }, { $set: { isSubscriber: false } });
          console.log(`[RevenueCat Webhook] Expired — reverted user ${userId} to free`);
        }
      }
      // CANCELLATION is intentionally ignored: user keeps access until expiration_at_ms
    } catch (error) {
      console.error('[RevenueCat Webhook] Error:', error);
      // Return 200 so RevenueCat doesn't keep retrying on our bug
      res.json({ received: true, error: 'Internal processing error' });
      return;
    }

    res.json({ received: true });
  },
};
