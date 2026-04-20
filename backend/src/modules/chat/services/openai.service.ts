/**
 * OpenAI Assistants API Service
 * 
 * Wraps all OpenAI interactions:
 * - Thread management (create, add messages)
 * - Assistant runs (with polling)
 * - Response extraction
 * 
 * Uses the Assistants API which maintains conversation state
 * server-side via Threads, eliminating the need to resend
 * full chat history on every request.
 */

import OpenAI from 'openai';
import config from '../../../config';

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
   * Uses createAndPoll for simplicity — blocks until the run completes.
   * 
   * @param threadId - The OpenAI thread ID
   * @param maxCompletionTokens - Cap on output tokens (controls cost)
   * @param maxContextMessages - Truncation: keep only last N messages in thread
   */
  async runAssistant(
    threadId: string,
    maxCompletionTokens: number = 800,
    maxContextMessages: number = 10
  ): Promise<AssistantRunResult> {
    const run = await this.client.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: this.assistantId,
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
      responseText = 'I apologize, but I could not generate a response at this time. Please try again. 🙏';
    }

    // Extract token usage from the run
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
   * Full chat flow: add message to thread and run assistant
   * 
   * @param threadId - Existing OpenAI thread ID (or null to create new)
   * @param userMessage - The user's question
   * @param systemContext - Optional chart/profile context (added only on first message)
   * @param isFirstMessage - Whether this is the first message in the conversation
   * @param maxCompletionTokens - Token cap for response
   * @param maxContextMessages - How many past messages to include
   */
  async chat(
    threadId: string | null,
    userMessage: string,
    systemContext: string | null,
    isFirstMessage: boolean,
    maxCompletionTokens: number = 800,
    maxContextMessages: number = 10
  ): Promise<AssistantRunResult> {
    // Create thread if needed
    const actualThreadId = threadId || await this.createThread();

    // Add chart context as the first message (only once per conversation)
    if (isFirstMessage && systemContext) {
      await this.addMessage(
        actualThreadId,
        `[BIRTH CHART CONTEXT - Use this data for all astrological analysis in this conversation]\n\n${systemContext}`,
        'user'
      );
      // Add a brief acknowledgment so context isn't treated as a question
      await this.addMessage(
        actualThreadId,
        'I have received the birth chart data. I will use this information for all astrological analysis. Please go ahead and ask your question.',
        'assistant'
      );
    }

    // Add the actual user question
    await this.addMessage(actualThreadId, userMessage, 'user');

    // Run the assistant
    return this.runAssistant(actualThreadId, maxCompletionTokens, maxContextMessages);
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
