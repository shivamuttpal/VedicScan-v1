import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { UserUsage, getISTMidnight, getISTMonthStart } from '../model/subscription.model';
import { Transaction, TransactionStatus } from '../model/transaction.model';
import {
  getPlanLimits,
  PlanType,
  PLAN_PRICES,
  isValidPurchase,
  isOneTimeFeature,
  isSubscriptionPlan,
  PLAN_DISPLAY_NAMES,
} from '../../../config/plans';
import { paymentService } from '../services/payment.service';
import { User } from '../../user/model/user.model';
import { sendPaymentSuccessEmail } from '../../../utils/mail.util';

export const subscriptionController = {
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

      const limits = getPlanLimits(plan);

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

      res.json({
        plan,
        planEndDate: usage.planEndDate?.toISOString() || null,
        billingCycle: usage.billingCycle,
        usage: {
          questions_asked: usage.dailyQuestionsUsed,
          limit: limits.dailyQuestions,
          can_ask: usage.dailyQuestionsUsed < limits.dailyQuestions &&
                   usage.monthlyQuestionsUsed < limits.monthlyQuestions,
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
        amount = (PLAN_PRICES as any)[selectedCurrency]?.['one-time']?.[plan];
      } else {
        cycle = billingCycle === 'annual' ? 'annual' : 'monthly';
        amount = (PLAN_PRICES as any)[selectedCurrency]?.[plan]?.[cycle];
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
   * POST /api/subscription/unsubscribe-emails
   * Allows users to opt out of subscription lifecycle emails
   */
  async unsubscribeEmails(req: Request, res: Response) {
    try {
      const { token } = req.body || {};
      const queryToken = req.query.token as string;
      const unsubToken = token || queryToken;

      if (!unsubToken) {
        res.status(400).json({ success: false, message: 'Unsubscribe token is required.' });
        return;
      }

      // Decode the token to extract userId
      let userId: string | null = null;
      try {
        const decoded = Buffer.from(unsubToken, 'base64url').toString();
        const parts = decoded.split(':');
        if (parts[0] === 'unsub' && parts[1]) {
          userId = parts[1];
        }
      } catch {
        // Invalid token format
      }

      if (!userId) {
        res.status(400).json({ success: false, message: 'Invalid unsubscribe token.' });
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

      // Return a friendly HTML page for browser-based clicks
      if (req.query.token) {
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
};
