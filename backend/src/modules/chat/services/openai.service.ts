/**
 * OpenAI Assistants API Service — Production Grade (Token Optimized)
 * 
 * Integrates the AstrologyEngine pipeline:
 *   Chart Data → Interpretation Engine → Theme Aggregator → Prompt Builder → LLM → Response Cleaner
 * 
 * TOKEN OPTIMIZATION STRATEGY:
 *   - First message: Full chart context injected once into thread. User question sent separately.
 *   - Follow-ups: Only question-relevant themes in system prompt. User sends just the question.
 *   - maxCompletionTokens scaled per question type (daily=250, career=400, deep=500).
 *   - Thread truncation keeps only last N messages to cap context window.
 */

import OpenAI from 'openai';
import config from '../../../config';

// Import the AstrologyEngine orchestrator
const { buildMaharshiPrompt, cleanLLMResponse } = require('../../../../AstrologyEngine/chat_orchestrator');

// Result returned after running the assistant
export interface AssistantRunResult {
  response: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  threadId: string;
}

class OpenAIService {
  private client: OpenAI;
  private assistantId: string;

  constructor() {
    if (!config.openai.apiKey) {
      console.warn('⚠️  OPENAI_API_KEY is not set. AI chat will not work.');
    }
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.assistantId = config.openai.assistantId;
  }

  /**
   * Create a new conversation thread
   */
  async createThread(): Promise<string> {
    const thread = await this.client.beta.threads.create();
    return thread.id;
  }

  /**
   * Add a message to an existing thread
   */
  async addMessage(threadId: string, content: string, role: 'user' | 'assistant' = 'user'): Promise<void> {
    await this.client.beta.threads.messages.create(threadId, {
      role,
      content,
    });
  }

  /**
   * Run the assistant on a thread and wait for completion.
   */
  async runAssistant(
    threadId: string,
    systemInstructions: string,
    maxCompletionTokens: number = 400,
    maxContextMessages: number = 10
  ): Promise<AssistantRunResult> {
    const run = await this.client.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: this.assistantId,
      instructions: systemInstructions,
      max_completion_tokens: maxCompletionTokens,
      truncation_strategy: {
        type: 'last_messages',
        last_messages: maxContextMessages,
      },
    });

    if (run.status !== 'completed') {
      console.error('OpenAI run failed:', run.status, run.last_error);
      throw new Error(`Assistant run failed with status: ${run.status}`);
    }

    // Extract the latest assistant message
    const messages = await this.client.beta.threads.messages.list(threadId, {
      order: 'desc',
      limit: 1,
    });

    const latestMessage = messages.data[0];
    let responseText = '';

    if (latestMessage && latestMessage.role === 'assistant') {
      for (const block of latestMessage.content) {
        if (block.type === 'text') {
          responseText += block.text.value;
        }
      }
    }

    if (!responseText) {
      responseText = 'I am so sorry, I seem to have lost my connection for a moment. Could you please ask again? 🙏';
    }

    const usage = run.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
      response: responseText,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
      threadId,
    };
  }

  /**
   * Full chat flow — Production Pipeline (Token Optimized)
   * 
   * FIRST MESSAGE flow:
   *   1. Build full chart context via AstrologyEngine
   *   2. Inject context + seed reply into thread (this stays in thread memory)
   *   3. Add user's actual question as separate message
   *   4. Run with compressed system prompt
   * 
   * FOLLOW-UP MESSAGE flow:
   *   1. Build only question-relevant themes
   *   2. Add user question (with lightweight context hints)
   *   3. Run with compressed system prompt
   *   4. Thread already has full context from message 1
   */
  async chat(
    threadId: string | null,
    userMessage: string,
    chartData: any | null,
    conversationId: string,
    isFirstMessage: boolean,
    planMaxCompletionTokens: number = 800,
    maxContextMessages: number = 10
  ): Promise<AssistantRunResult> {
    const actualThreadId = threadId || await this.createThread();

    const hasChart = chartData && typeof chartData === 'object' && Object.keys(chartData).length > 0;

    // ─── Build prompt via AstrologyEngine ───
    const prompt = buildMaharshiPrompt({
      userQuestion: userMessage,
      chartData: hasChart ? chartData : {},
      conversationId,
      isFirstMessage,
    });

    // Use the SMALLER of plan limit and question-type suggestion
    const maxCompletionTokens = Math.min(planMaxCompletionTokens, prompt.suggestedMaxTokens || 400);

    if (isFirstMessage && hasChart && prompt.initialContext) {
      // FIRST MESSAGE: Inject the full chart context into thread once.
      // This context persists in the thread — no need to re-send on follow-ups.
      await this.addMessage(actualThreadId, prompt.initialContext, 'user');
      await this.addMessage(
        actualThreadId,
        'Namaste. I have studied your chart carefully. Please, ask me anything.',
        'assistant'
      );
    }

    // Add the user's actual question (prompt.user is already optimized per message type)
    await this.addMessage(actualThreadId, prompt.user, 'user');

    // Run the assistant
    const result = await this.runAssistant(
      actualThreadId,
      prompt.system,
      maxCompletionTokens,
      maxContextMessages
    );

    // ─── Clean the response ───
    result.response = cleanLLMResponse(result.response);

    return result;
  }

  /**
   * Verify the service is properly configured
   */
  isConfigured(): boolean {
    return !!(config.openai.apiKey && config.openai.assistantId && 
              config.openai.assistantId !== 'asst_REPLACE_WITH_YOUR_ASSISTANT_ID');
  }
}

// Singleton instance
export const openaiService = new OpenAIService();
