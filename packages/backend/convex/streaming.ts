import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { httpAction } from './_generated/server';

// Allowed OpenRouter model allowlist for security
const ALLOWED_OPENROUTER_MODELS = new Set<string>([
  // Newly requested free models
  'openai/gpt-oss-20b:free',
  'z-ai/glm-4.5-air:free',
  'qwen/qwen3-coder:free',
  'moonshotai/kimi-k2:free',
  // Existing curated models used in UI
  'anthropic/claude-3.7-sonnet:thinking',
  'openai/gpt-4o-mini',
  'deepseek/deepseek-chat',
  'qwen/qwen2.5-coder:32b',
  'meta/llama-3.1-70b-instruct',
]);

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
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }

  // Check subscription status
  const subscription = await ctx.runQuery(api.subscriptions.getSubscriptionStatus, {});
  
  if (!subscription) {
    return new Response(
      JSON.stringify({ error: 'Subscription not found. Please sign up.' }),
      {
        status: 403,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }

  // Check message limits
  if (subscription.messagesUsed >= subscription.messagesLimit) {
    return new Response(
      JSON.stringify({ 
        error: 'Monthly message limit reached. Please upgrade your subscription.',
        code: 'QUOTA_EXCEEDED',
        details: {
          messagesUsed: subscription.messagesUsed,
          messagesLimit: subscription.messagesLimit,
          tier: subscription.tier,
          nextReset: subscription.currentPeriodEnd,
        }
      }),
      {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
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
  
  // Check premium model access
  const isPremiumModel = ['gpt-4o', 'claude-3.5-sonnet', 'claude-sonnet-4', 'gpt-5', 'gpt-5-pro', 'o3'].includes(modelName);
  
  if (isPremiumModel) {
    if (subscription.tier === 'free') {
      return new Response(
        JSON.stringify({ 
          error: 'Premium models require Pro or Pro+ subscription.',
          code: 'FEATURE_RESTRICTED',
          details: {
            currentTier: subscription.tier,
            requiredTier: 'pro',
            model: modelName,
          }
        }),
        {
          status: 403,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }
    
    if (subscription.premiumMessagesUsed >= subscription.premiumMessagesLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'Premium message quota exhausted. Please upgrade or wait for next billing cycle.',
          code: 'QUOTA_EXCEEDED',
          details: {
            premiumMessagesUsed: subscription.premiumMessagesUsed,
            premiumMessagesLimit: subscription.premiumMessagesLimit,
            tier: subscription.tier,
            nextReset: subscription.currentPeriodEnd,
          }
        }),
        {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }
  }

  // Determine provider and create appropriate model
  if (
    modelName.startsWith('openrouter/') ||
    modelName.startsWith('gpt') ||
    modelName.startsWith('o3') ||
    modelName.startsWith('o4') ||
    modelName === 'gpt-5' ||
    modelName === 'gpt-5-pro' ||
    modelName === 'gpt-4.1' ||
    modelName === 'gpt-4o'
  ) {
    if (modelName.startsWith('openrouter/')) {
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
      });
      const orModel = modelName.replace(/^openrouter\//, '');

      if (!ALLOWED_OPENROUTER_MODELS.has(orModel)) {
        return new Response(
          JSON.stringify({
            error: 'Model not allowed',
            code: 'MODEL_NOT_ALLOWED',
            details: { provider: 'openrouter', model: orModel },
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          }
        );
      }

      aiModel = openrouter(orModel);
    } else {
      // OpenAI models
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Map our custom model IDs to actual API model names if needed
      let apiModelName = modelName;
      if (modelName === 'gpt-5' || modelName === 'gpt-5-pro') {
        apiModelName = 'gpt-4o';
        console.warn(`Model ${modelName} not yet available, using gpt-4o`);
      } else if (modelName === 'gpt-4.1') {
        apiModelName = 'gpt-4-turbo-preview';
      } else if (modelName === 'o3' || modelName === 'o4-mini') {
        apiModelName = 'gpt-4o';
        console.warn(`Model ${modelName} not yet available, using gpt-4o`);
      }

      aiModel = openai(apiModelName);
    }
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
      
      // Track message usage for subscription
      await ctx.runMutation(api.subscriptions.trackMessageUsage, {
        walletAddress,
        isPremiumModel,
      });
    },
  });

  // Convert to a proper text stream response with CORS headers
  // The AI SDK provides toTextStreamResponse() which returns a properly formatted Response
  const response = result.toTextStreamResponse();
  
  // Add CORS headers to the response
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  headers.set('Access-Control-Allow-Credentials', 'true');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
