/**
 * Chat Controller — Real OpenAI Integration
 * 
 * Handles:
 * 1. Message intake with word validation (pre-checked by middleware)
 * 2. OpenAI Thread management (create or resume)
 * 3. Assistant execution with chart context injection
 * 4. Usage tracking (questions + tokens)
 * 5. Chat session persistence in MongoDB
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
   * 
   * Accepts: { message, conversationId?, userProfile? }
   * Returns: { conversationId, response, usage }
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
        // Check if we have an existing thread for this conversation
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
        });
        isFirstMessage = true;
      }

      // Add user message to MongoDB
      chat.messages.push({ role: 'user', content: message });

      // ─── Call OpenAI ───
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
            userProfile || null,
            isFirstMessage,
            maxTokens,
            maxContext
          );

          botResponse = result.response;
          promptTokens = result.promptTokens;
          completionTokens = result.completionTokens;

          // Store the thread mapping
          if (userUsage && result.threadId) {
            userUsage.threadMap.set(finalConvId, result.threadId);
          }
        } catch (aiError: any) {
          console.error('OpenAI API error:', aiError?.message || aiError);
          botResponse = 'I apologize, but I\'m having trouble connecting to my knowledge base right now. Please try again in a moment. 🙏';
        }
      } else {
        // Fallback mock response when OpenAI is not configured
        botResponse = `Namaste! 🙏\n\nI received your question: *"${message}"*\n\n⚠️ The AI Assistant is not yet configured. Please set your OPENAI_ASSISTANT_ID in the backend .env file.\n\nTo set up:\n1. Go to https://platform.openai.com/assistants\n2. Create an Assistant with your Vedic knowledge PDFs\n3. Copy the Assistant ID (asst_xxxx)\n4. Add it to your .env as OPENAI_ASSISTANT_ID`;
      }

      // Add bot message to MongoDB
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
            }
          }
        );
        
        // Refresh local object for the frontend usage stats below
        userUsage.dailyQuestionsUsed += 1;
        userUsage.monthlyQuestionsUsed += 1;
      }

      // ─── Build usage stats for frontend ───
      const usageStats = userUsage && planLimits ? {
        daily: {
          used: userUsage.dailyQuestionsUsed,
          limit: planLimits.dailyQuestions,
          remaining: Math.max(0, planLimits.dailyQuestions - userUsage.dailyQuestionsUsed),
        },
        monthly: {
          used: userUsage.monthlyQuestionsUsed,
          limit: planLimits.monthlyQuestions,
          remaining: Math.max(0, planLimits.monthlyQuestions - userUsage.monthlyQuestionsUsed),
        },
        tokens: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
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

  /**
   * GET /api/chat/history
   * Returns all conversations for the authenticated user
   */
  async getHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const chats = await ChatSession.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(20);
      res.json({ conversations: chats });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get history' });
    }
  },

  /**
   * DELETE /api/chat/history/:id
   * Deletes a specific conversation
   */
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
