import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { httpAction } from './_generated/server';

export const streamChat = httpAction(async (ctx, request) => {
  // Parse request body
  const body = (await request.json()) as {
    chatId: string;
    walletAddress: string;
    content: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };

  const { chatId, walletAddress, content, model, temperature, maxTokens } =
    body;

  // Verify chat exists and user has access
  const chat = await ctx.runQuery(api.chats.getById, {
    id: chatId as Id<'chats'>,
  });
  if (!chat || chat.ownerId !== walletAddress) {
    return new Response(
      JSON.stringify({ error: 'Chat not found or access denied' }),
      {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }

  // Create user message
  const userMessage = await ctx.runMutation(api.messages.create, {
    chatId: chatId as Id<'chats'>,
    walletAddress,
    role: 'user',
    content,
  });

  // Get recent messages for context
  const messages = await ctx.runQuery(api.messages.getByChatId, {
    chatId: chatId as Id<'chats'>,
    limit: 20,
  });

  // Convert messages to AI SDK format
  const conversationHistory = messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));

  // Select AI model based on chat configuration
  let aiModel;
  const modelName = model || chat.model || 'gpt-5';

  // Determine provider and create appropriate model
  if (
    modelName.startsWith('gpt') ||
    modelName.startsWith('o3') ||
    modelName.startsWith('o4') ||
    modelName === 'gpt-5' ||
    modelName === 'gpt-5-pro' ||
    modelName === 'gpt-4.1' ||
    modelName === 'gpt-4o'
  ) {
    // OpenAI models
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Map our custom model IDs to actual API model names if needed
    let apiModelName = modelName;
    if (modelName === 'gpt-5' || modelName === 'gpt-5-pro') {
      // GPT-5 might not be available yet, fallback to gpt-4o
      apiModelName = 'gpt-4o';
      console.warn(`Model ${modelName} not yet available, using gpt-4o`);
    } else if (modelName === 'gpt-4.1') {
      apiModelName = 'gpt-4-turbo-preview';
    } else if (modelName === 'o3' || modelName === 'o4-mini') {
      // O3/O4 models may not be available yet
      apiModelName = 'gpt-4o';
      console.warn(`Model ${modelName} not yet available, using gpt-4o`);
    }

    aiModel = openai(apiModelName);
  } else if (
    modelName.startsWith('claude') ||
    modelName === 'claude-opus-4.1' ||
    modelName === 'claude-sonnet-4'
  ) {
    // Anthropic models
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Map our custom model IDs to actual API model names
    let apiModelName = modelName;
    if (modelName === 'claude-opus-4.1') {
      // Claude Opus 4.1 might not be available yet
      apiModelName = 'claude-3-opus-20240229';
      console.warn(`Model ${modelName} not yet available, using claude-3-opus`);
    } else if (modelName === 'claude-sonnet-4') {
      apiModelName = 'claude-3-5-sonnet-20241022';
    } else if (modelName === 'claude-3.5-sonnet') {
      apiModelName = 'claude-3-5-sonnet-20241022';
    } else if (modelName === 'claude-3.5-haiku') {
      apiModelName = 'claude-3-haiku-20240307';
    }

    aiModel = anthropic(apiModelName);
  } else if (
    modelName.startsWith('gemini') ||
    modelName === 'gemini-2.5-pro' ||
    modelName === 'gemini-2.5-flash' ||
    modelName === 'gemini-2.5-flash-lite'
  ) {
    // Google models
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Map our custom model IDs to actual API model names
    let apiModelName = modelName;
    if (
      modelName === 'gemini-2.5-pro' ||
      modelName === 'gemini-2.5-flash' ||
      modelName === 'gemini-2.5-flash-lite'
    ) {
      // Gemini 2.5 models might not be available yet
      apiModelName = 'gemini-2.0-flash-exp';
      console.warn(
        `Model ${modelName} not yet available, using gemini-2.0-flash-exp`
      );
    } else if (modelName === 'gemini-2.0-flash') {
      apiModelName = 'gemini-2.0-flash-exp';
    }

    aiModel = google(apiModelName);
  } else {
    // Default fallback to OpenAI
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    aiModel = openai('gpt-4o');
    console.warn(`Unknown model ${modelName}, using default gpt-4o`);
  }

  // Create streaming response
  const result = await streamText({
    model: aiModel,
    system:
      chat.systemPrompt ||
      'You are ISIS, a helpful AI assistant with access to Solana blockchain operations.',
    messages: conversationHistory,
    temperature: temperature ?? chat.temperature ?? 0.7,
    maxOutputTokens: maxTokens ?? chat.maxTokens ?? 2000,
    onFinish: async ({ text, finishReason, usage }) => {
      // Save assistant message to database
      await ctx.runMutation(api.messages.create, {
        chatId: chatId as Id<'chats'>,
        walletAddress,
        role: 'assistant',
        content: text,
        metadata: {
          model: modelName,
          finishReason: finishReason || 'stop',
          usage: usage
            ? {
                inputTokens: usage.inputTokens || 0,
                outputTokens: usage.outputTokens || 0,
                totalTokens: usage.totalTokens || 0,
              }
            : undefined,
        },
      });
    },
  });

  // Convert to a proper text stream response with CORS headers
  // The AI SDK provides toTextStreamResponse() which returns a properly formatted Response
  const response = result.toTextStreamResponse();
  
  // Add CORS headers to the response
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
