/**
 * Chat Controller — Production Grade with Persistent Memory
 * 
 * Pipeline:
 *   User Question → AstrologyEngine (interpret → themes → memory context → prompt) 
 *   → OpenAI → Response Cleaner → Persist Memory → Chat Response
 */

import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/auth.middleware';
import { ChatSession } from '../model/chat.model';
import { UserUsage } from '../../subscription/model/subscription.model';
import { openaiService } from '../services/openai.service';
import { PlanLimits } from '../../../config/plans';
import crypto from 'crypto';

export const chatController = {
  /**
   * POST /api/chat/message
   */
  async handleMessage(req: AuthRequest, res: Response) {
    try {
      const { message, conversationId, userProfile } = req.body;
      const userId = req.user!.userId;
      const userUsage = (req as any).userUsage as InstanceType<typeof UserUsage> | undefined;
      const planLimits = (req as any).planLimits as PlanLimits | undefined;

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ success: false, message: 'Message is required.' });
        return;
      }

      const finalConvId = conversationId || crypto.randomUUID();

      // ─── Determine OpenAI Thread ───
      let threadId: string | null = null;
      let isFirstMessage = false;

      if (userUsage) {
        threadId = userUsage.threadMap?.get(finalConvId) || null;
      }

      if (!threadId) {
        isFirstMessage = true;
      }

      // ─── Retrieve or create MongoDB chat session ───
      let chat = await ChatSession.findOne({ conversationId: finalConvId, userId });
      if (!chat) {
        chat = new ChatSession({
          conversationId: finalConvId,
          userId,
          title: message.substring(0, 50),
          messages: [],
          metadata: {
            recentTopics: [],
            emotionalConcerns: [],
            tonePreference: null,
            messageCount: 0
          }
        });
        isFirstMessage = true;
      }

      // Add user message to local array (saved later)
      chat.messages.push({ role: 'user', content: message });

      // ─── Parse chart data ───
      let chartData: any = null;
      if (userProfile) {
        if (typeof userProfile === 'string') {
          try {
            chartData = JSON.parse(userProfile);
          } catch {
            chartData = null;
          }
        } else if (typeof userProfile === 'object') {
          chartData = userProfile;
        }
      }

      // ─── Call OpenAI via Optimized Pipeline ───
      let botResponse: string;
      let promptTokens = 0;
      let completionTokens = 0;

      if (openaiService.isConfigured()) {
        try {
          const maxTokens = planLimits?.maxCompletionTokens || 800;
          const maxContext = planLimits?.maxContextMessages || 10;

          const result = await openaiService.chat(
            threadId,
            message,
            chartData,
            chat.metadata, // Pass persistent memory
            isFirstMessage,
            maxTokens,
            maxContext
          );

          botResponse = result.response;
          promptTokens = result.promptTokens;
          completionTokens = result.completionTokens;
          
          // Update persistent memory in the document
          chat.metadata = result.updatedMemory;

          // Store the thread mapping
          if (userUsage && result.threadId) {
            userUsage.threadMap.set(finalConvId, result.threadId);
          }
        } catch (aiError: any) {
          console.error('OpenAI API error:', aiError?.message || aiError);
          botResponse = 'I am so sorry, but I am finding it a little difficult to connect with the cosmos right now. Could you please give me just a moment and try again? 🙏';
        }
      } else {
        botResponse = `Namaste! 🙏\n\nAI Assistant is not yet configured. Please set OPENAI_ASSISTANT_ID in .env.`;
      }

      // Add bot message and save session
      chat.messages.push({ role: 'assistant', content: botResponse });
      await chat.save();

      // ─── Update Usage Counters (Atomic) ───
      if (userUsage) {
        await UserUsage.updateOne(
          { _id: userUsage._id },
          {
            $inc: {
              dailyQuestionsUsed: 1,
              monthlyQuestionsUsed: 1,
              dailyTokensUsed: (promptTokens + completionTokens),
              monthlyTokensUsed: (promptTokens + completionTokens),
              totalPromptTokens: promptTokens,
              totalCompletionTokens: completionTokens,
            },
            $set: { threadMap: userUsage.threadMap }
          }
        );
        userUsage.dailyQuestionsUsed += 1;
        userUsage.monthlyQuestionsUsed += 1;
      }

      // ─── Build usage stats ───
      const usageStats = userUsage && planLimits ? {
        daily: { used: userUsage.dailyQuestionsUsed, limit: planLimits.dailyQuestions, remaining: Math.max(0, planLimits.dailyQuestions - userUsage.dailyQuestionsUsed) },
        monthly: { used: userUsage.monthlyQuestionsUsed, limit: planLimits.monthlyQuestions, remaining: Math.max(0, planLimits.monthlyQuestions - userUsage.monthlyQuestionsUsed) },
        tokens: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens },
      } : null;

      res.json({
        conversationId: finalConvId,
        response: botResponse,
        usage: usageStats,
      });
    } catch (error: any) {
      console.error('Chat handleMessage error:', error?.message || error);
      res.status(500).json({ success: false, error: 'Failed to process message' });
    }
  },

  async getHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const chats = await ChatSession.find({ userId }).sort({ updatedAt: -1 }).limit(20);
      res.json({ conversations: chats });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get history' });
    }
  },

  async deleteHistory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      await ChatSession.findOneAndDelete({ conversationId: id, userId });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete history' });
    }
  },
};
