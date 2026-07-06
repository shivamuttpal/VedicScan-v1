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
import { Profile } from '../../profile/model/profile.model';
import { refreshKundaliInsights } from '../../profile/services/profile.service';
import crypto from 'crypto';

export const chatController = {
  /**
   * POST /api/chat/message
   */
  async handleMessage(req: AuthRequest, res: Response) {
    try {
      const { message, conversationId, userProfile, profileId, lang } = req.body;
      const replyLang: 'en' | 'hi' = lang === 'hi' ? 'hi' : 'en';
      const userId = req.user!.userId;
      const userUsage = (req as any).userUsage as InstanceType<typeof UserUsage> | undefined;
      const planLimits = (req as any).planLimits as PlanLimits | undefined;

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ success: false, message: 'Message is required.' });
        return;
      }

      let finalConvId = conversationId || crypto.randomUUID();

      // ─── Determine OpenAI Thread ───
      let threadId: string | null = null;
      let isFirstMessage = false;

      if (userUsage) {
        threadId = userUsage.threadMap?.get(finalConvId) || null;
      }

      if (!threadId) {
        isFirstMessage = true;
      }

      // ─── Retrieve or create MongoDB chat session (atomic upsert — race-safe) ───
      const upsertSession = async (convId: string) =>
        ChatSession.findOneAndUpdate(
          { conversationId: convId, userId },
          {
            $setOnInsert: {
              conversationId: convId,
              userId,
              title: message.substring(0, 50),
              messages: [],
              metadata: { recentTopics: [], emotionalConcerns: [], tonePreference: null, messageCount: 0 }
            }
          },
          { upsert: true, new: true }
        );

      let chat = await upsertSession(finalConvId).catch(async (err) => {
        // E11000 means finalConvId exists in the DB under a DIFFERENT userId
        // (e.g. a stale ID cached on the client from a previous account).
        // Generate a fresh ID and start a clean session for this user.
        if (err?.code === 11000) {
          finalConvId = crypto.randomUUID();
          isFirstMessage = true;
          return upsertSession(finalConvId);
        }
        throw err;
      });

      if (!chat) throw new Error('Failed to retrieve or create chat session');

      // A newly upserted document has an empty messages array
      if (chat.messages.length === 0) {
        isFirstMessage = true;
      }

      // Add user message to local array (saved later)
      chat.messages.push({ role: 'user', content: message });

      // ─── Resolve kundali chart data ───────────────────────────────────────
      // Priority: (1) structured JSON from client, (2) saved kundaliInsights
      // on the user's profile (either a specific profileId or the default).
      // Plain-text userProfile strings (legacy mobile format) are intentionally
      // ignored — the server-side insights are richer and always structured.
      let chartData: any = null;

      if (userProfile && typeof userProfile === 'object' && Object.keys(userProfile).length > 0) {
        chartData = userProfile;
      }

      if (!chartData) {
        try {
          let profile;
          if (profileId) {
            profile = await Profile.findOne({ _id: profileId, userId });
          }
          if (!profile) {
            profile = await Profile.findOne({ userId, isDefault: true });
          }
          if (!profile) {
            profile = await Profile.findOne({ userId }).sort({ createdAt: 1 });
          }
          if (profile && (!profile.kundaliInsights || !(profile.kundaliInsights as any).upcomingPeriods)) {
            // First chat for this profile, or insights predating the timing
            // upgrade — (re)compute in the background. This message may miss the
            // newest timing data; the next one will have it.
            refreshKundaliInsights(String(profile._id), userId, profile);
          }
          if (profile?.kundaliInsights) {
            // Map stored insights to the shape interpretChart() expects
            const ki = profile.kundaliInsights as any;
            chartData = {
              ascendant:         ki.ascendant,
              moonSign:          ki.moonSign,
              moonNakshatra:     ki.moonNakshatra,
              sunSign:           ki.sunSign,
              planetSigns:       ki.planetSigns   || {},
              planetHouses:      ki.planetHouses  || {},
              retrograde:        ki.retrograde     || {},
              yogas:             ki.yogas          || [],
              currentMahadasha:  ki.currentMahadasha,
              currentAntardasha: ki.currentAntardasha,
              manglik:           ki.manglik,
              kalsarpa:          ki.kalsarpa,
              sadeSati:          ki.sadeSati,
              sadeSatiPhase:     ki.sadeSatiPhase,
              // Extra context passed through to prompt for richer answers
              _profileName:       profile.name,
              _mahadashaEnd:      ki.mahadashaEndDate,
              _antardashaEnd:     ki.antardashaEndDate,
              _doshas:            ki.doshas || [],
              // Transit data for timing-specific answers
              _jupiterNow:        ki.jupiterTransitNow   || null,
              _jupiterAhead:      ki.jupiterTransitAhead || [],
              _waxingWindows:     ki.waxingMoonWindows   || [],
              // Upcoming dasha sub-periods — year-level timing windows
              _upcomingPeriods:   ki.upcomingPeriods     || [],
            };
          }
        } catch (profileErr: any) {
          console.warn('[chat] profile insights lookup failed:', profileErr.message);
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
            maxContext,
            replyLang
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
          botResponse = replyLang === 'hi'
            ? 'क्षमा करें, इस समय ब्रह्मांड से जुड़ने में मुझे थोड़ी कठिनाई हो रही है। कृपया एक क्षण रुककर पुनः प्रयास करें। 🙏'
            : 'I am so sorry, but I am finding it a little difficult to connect with the cosmos right now. Could you please give me just a moment and try again? 🙏';
        }
      } else {
        botResponse = replyLang === 'hi'
          ? `नमस्ते! 🙏\n\nAI सहायक अभी कॉन्फ़िगर नहीं हुआ है। कृपया .env में OPENAI_ASSISTANT_ID सेट करें।`
          : `Namaste! 🙏\n\nAI Assistant is not yet configured. Please set OPENAI_ASSISTANT_ID in .env.`;
      }

      // Add bot message and save session
      chat.messages.push({ role: 'assistant', content: botResponse });
      try {
        await chat.save();
      } catch (saveErr: any) {
        // E11000: another concurrent request already inserted this session.
        // Re-fetch and push messages atomically to avoid losing them.
        if (saveErr?.code === 11000) {
          await ChatSession.updateOne(
            { conversationId: finalConvId, userId },
            { $push: { messages: { $each: chat.messages } }, $set: { metadata: chat.metadata } }
          );
        } else {
          throw saveErr;
        }
      }

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
