import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { UserUsage, getISTMidnight, getISTMonthStart } from '../model/subscription.model';
import { Transaction, TransactionStatus } from '../model/transaction.model';
import { getPlanLimits, PlanType, PLAN_PRICES } from '../../../config/plans';
import { paymentService } from '../services/payment.service';

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

      const plan = usage.plan as PlanType;
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
   * Step 1: Create a Stripe Checkout Session
   */
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const { plan, billingCycle, successUrl, cancelUrl, currency = 'INR' } = req.body;
      const userId = req.user!.userId;

      if (!['standard', 'premium'].includes(plan)) {
        res.status(400).json({ success: false, message: 'Invalid plan type.' });
        return;
      }

      const selectedCurrency = (currency as string).toUpperCase();
      if (!['INR', 'USD'].includes(selectedCurrency)) {
        res.status(400).json({ success: false, message: 'Unsupported currency.' });
        return;
      }

      const cycle = billingCycle === 'annual' ? 'annual' : 'monthly';
      const amount = (PLAN_PRICES as any)[selectedCurrency][plan][cycle];

      if (!amount) {
        res.status(400).json({ success: false, message: 'Invalid pricing configuration.' });
        return;
      }

      // 1. Create Stripe Checkout Session
      const session = await paymentService.createCheckoutSession({
        userId,
        email: (req.user as any).email, // from auth token
        amount,
        currency: selectedCurrency,
        plan,
        billingCycle: cycle,
        successUrl: successUrl || `${req.protocol}://${req.get('host')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: cancelUrl || `${req.protocol}://${req.get('host')}/payment-cancel`,
      });

      // 2. Create local Pending Transaction
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
      // We captured this in server.ts as req.rawBody
      event = paymentService.constructEvent(req.rawBody || req.body, sig);
    } catch (err: any) {
      console.error(`[Stripe Webhook] Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const dbSession = await mongoose.startSession();
      dbSession.startTransaction();

      try {
        const userId = session.metadata.userId;
        const stripeSessionId = session.id;

        // 1. Find Pending Transaction
        const transaction = await Transaction.findOne({ stripeSessionId, userId }).session(dbSession);
        if (!transaction) {
          console.error('[Stripe Webhook] Transaction record not found for session:', stripeSessionId);
          await dbSession.abortTransaction();
          res.json({ received: true });
          return;
        }

        if (transaction.status === TransactionStatus.COMPLETED) {
          await dbSession.abortTransaction();
          res.json({ received: true });
          return;
        }

        // 2. Update Transaction Record
        transaction.stripePaymentIntentId = session.payment_intent;
        transaction.status = TransactionStatus.COMPLETED;
        await transaction.save({ session: dbSession });

        // 3. Update User Usage (Plan Upgrade)
        let usage = await UserUsage.findOne({ userId }).session(dbSession);
        if (!usage) {
          usage = new UserUsage({ userId });
        }

        usage.plan = transaction.plan as any;
        usage.billingCycle = transaction.billingCycle as any;
        usage.planStartDate = new Date();

        if (transaction.billingCycle === 'annual') {
          usage.planEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        } else {
          usage.planEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        await usage.save({ session: dbSession });

        await dbSession.commitTransaction();
        console.log(`[Stripe Webhook] Success: Plan ${transaction.plan} activated for user ${userId}`);
      } catch (error) {
        await dbSession.abortTransaction();
        console.error('[Stripe Webhook] DB Error:', error);
      } finally {
        dbSession.endSession();
      }
    }

    res.json({ received: true });
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

