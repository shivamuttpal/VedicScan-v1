/**
 * OpenAI Assistants API Service — Production Grade (Token Optimized)
 * 
 * Integrates the AstrologyEngine pipeline with persistent memory.
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
  updatedMemory: any;
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
  ): Promise<any> { // Internal helper result
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

    const usage = run.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
      response: responseText || 'I am so sorry, I seem to have lost my connection. 🙏',
      usage,
    };
  }

  /**
   * Full chat flow — Production Pipeline
   */
  async chat(
    threadId: string | null,
    userMessage: string,
    chartData: any | null,
    memory: any | null,
    isFirstMessage: boolean,
    planMaxCompletionTokens: number = 800,
    maxContextMessages: number = 10,
    lang: 'en' | 'hi' = 'en'
  ): Promise<AssistantRunResult> {
    const actualThreadId = threadId || await this.createThread();

    const hasChart = chartData && typeof chartData === 'object' && Object.keys(chartData).length > 0;

    // ─── Build prompt via AstrologyEngine ───
    const { prompt, updatedMemory } = buildMaharshiPrompt({
      userQuestion: userMessage,
      chartData: hasChart ? chartData : {},
      memory,
      isFirstMessage,
      lang,
    });

    // Token limit scaling
    const maxCompletionTokens = Math.min(planMaxCompletionTokens, prompt.suggestedMaxTokens || 400);

    if (isFirstMessage && hasChart && prompt.initialContext) {
      // Inject context once per thread
      await this.addMessage(actualThreadId, prompt.initialContext, 'user');
      await this.addMessage(
        actualThreadId,
        lang === 'hi'
          ? 'नमस्ते। मैंने आपकी कुंडली का ध्यानपूर्वक अध्ययन किया है। कृपया मुझसे कुछ भी पूछें।'
          : 'Namaste. I have studied your chart carefully. Please, ask me anything.',
        'assistant'
      );
    }

    // Add user question
    await this.addMessage(actualThreadId, prompt.user, 'user');

    // Run Assistant
    const runResult = await this.runAssistant(
      actualThreadId,
      prompt.system,
      maxCompletionTokens,
      maxContextMessages
    );

    return {
      response: cleanLLMResponse(runResult.response),
      promptTokens: runResult.usage.prompt_tokens || 0,
      completionTokens: runResult.usage.completion_tokens || 0,
      totalTokens: runResult.usage.total_tokens || 0,
      threadId: actualThreadId,
      updatedMemory
    };
  }

  /**
   * Verify configuration
   */
  isConfigured(): boolean {
    return !!(config.openai.apiKey && config.openai.assistantId);
  }
}

export const openaiService = new OpenAIService();
