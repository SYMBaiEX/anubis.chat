// import { createAnthropic } from '@ai-sdk/anthropic'; // DISABLED FOR NOW
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { httpAction } from './_generated/server';

// Remove direct imports to avoid TypeScript issues

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
    useReasoning?: boolean;
  };

  const {
    chatId,
    walletAddress,
    content,
    model,
    temperature,
    maxTokens,
    useReasoning,
  } = body;

  // Get the user by wallet address first
  const user = await ctx.runQuery(api.users.getUserByWallet, {
    walletAddress,
  });

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'User not found. Please sign in.' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }

  // Verify chat exists and user has access (using user ID)
  const chat = await ctx.runQuery(api.chats.getById, {
    id: chatId as Id<'chats'>,
  });
  if (!chat || chat.ownerId !== user._id) {
    return new Response(
      JSON.stringify({ error: 'Chat not found or access denied' }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }

  // Check subscription status
  const subscription = await ctx.runQuery(
    api.subscriptions.getSubscriptionStatusByWallet,
    {
      walletAddress,
    }
  );

  if (!subscription) {
    return new Response(
      JSON.stringify({ error: 'Subscription not found. Please sign up.' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }

  // Check if user is an admin - admins have unlimited access
  const adminStatus = await ctx.runQuery(
    api.adminAuth.checkAdminStatusByWallet,
    {
      walletAddress,
    }
  );

  // Check message limits (skip for admins)
  if (
    !adminStatus.isAdmin &&
    (subscription.messagesUsed ?? 0) >= (subscription.messagesLimit ?? 0)
  ) {
    return new Response(
      JSON.stringify({
        error:
          'Monthly message limit reached. Please upgrade your subscription.',
        code: 'QUOTA_EXCEEDED',
        details: {
          messagesUsed: subscription.messagesUsed,
          messagesLimit: subscription.messagesLimit,
          tier: subscription.tier,
          nextReset: subscription.currentPeriodEnd,
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }

  // Select AI model based on chat configuration
  const modelName = model || chat.model || 'openrouter/openai/gpt-oss-20b:free';

  // Create user message using the user ID
  const _userMessage = await ctx.runMutation(api.messages.create, {
    chatId: chatId as Id<'chats'>,
    walletAddress, // Still need wallet address for legacy compatibility
    role: 'user',
    content,
  });

  // Try to kick off memory extraction for this user message
  try {
    if (_userMessage) {
      await ctx.runAction((api as any).memoryExtraction.processNewMessage, {
        messageId: _userMessage._id,
      });
    }
  } catch (_err) {
    // Non-blocking
  }

  // Check user preferences for memory and RAG features
  const userPreferences = await ctx.runQuery(api.userPreferences.getByUserId, {
    userId: user._id,
  });
  const memoryEnabled = userPreferences?.enableMemory !== false; // Default to true

  // Initialize context to be injected into system prompt
  let contextToInject = '';

  // If memory is enabled, retrieve and format relevant context using the advanced RAG system
  if (memoryEnabled) {
    try {
      // Use the sophisticated RAG system for context retrieval
      const ragContext = await ctx.runAction(api.rag.retrieveContext, {
        userId: user._id,
        query: content,
        chatId: chatId as Id<'chats'>,
        tokenBudget: 3000, // Leave room for conversation
        includeMemories: true,
        includeMessages: true,
        includeDocuments: true,
        minRelevanceScore: 0.4, // Lower threshold for more context
        useCache: true,
      });

      // Format the RAG context for LLM consumption
      if (ragContext.items.length > 0) {
        contextToInject = await ctx.runAction(api.rag.formatContextForLLM, {
          context: ragContext,
          includeMetadata: false, // Keep it clean for the agent
        });
      }
    } catch (_error) {
      // Fallback to basic memory system if RAG fails
      try {
        const memories = await ctx.runQuery(api.memories.getUserMemories, {
          userId: user._id,
        });

        if (memories && memories.length > 0) {
          const importantMemories = memories
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 5);

          contextToInject =
            '## User Context\n\nKey information about the user:\n';
          for (const memory of importantMemories) {
            contextToInject += `- ${memory.content}\n`;
          }
          contextToInject += '\n';
        }
      } catch (_fallbackError) {
        // Continue without context rather than failing the entire request
      }
    }
  }

  // Get recent messages for context (this query doesn't need auth since we already verified ownership)
  const messages = await ctx.runQuery(api.messages.getByChatId, {
    chatId: chatId as Id<'chats'>,
    limit: 20,
  });

  // Convert messages to AI SDK format
  const conversationHistory = messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));

  // Prepare AI model
  let aiModel;

  // Check premium model access (gpt-5-nano is not premium, it's an efficient nano model)
  const isPremiumModel = [
    // 'gpt-4o',  // REMOVED
    // 'claude-3.5-sonnet',  // ANTHROPIC DISABLED
    // 'claude-sonnet-4',   // ANTHROPIC DISABLED
    'gpt-5',
    // 'gpt-5-pro',  // REMOVED
    // 'o3',  // REMOVED
    'gpt-4.1-mini',
  ].includes(modelName);

  // Skip premium checks for admins - they have unlimited access
  if (isPremiumModel && !adminStatus.isAdmin) {
    if (subscription.tier === 'free') {
      return new Response(
        JSON.stringify({
          error: 'Premium models require Pro or Pro+ subscription.',
          code: 'FEATURE_RESTRICTED',
          details: {
            currentTier: subscription.tier,
            requiredTier: 'pro',
            model: modelName,
          },
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

    if (
      (subscription.premiumMessagesUsed ?? 0) >=
      (subscription.premiumMessagesLimit ?? 0)
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Premium message quota exhausted. Please upgrade or wait for next billing cycle.',
          code: 'QUOTA_EXCEEDED',
          details: {
            premiumMessagesUsed: subscription.premiumMessagesUsed,
            premiumMessagesLimit: subscription.premiumMessagesLimit,
            tier: subscription.tier,
            nextReset: subscription.currentPeriodEnd,
          },
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
      } else if (modelName === 'gpt-4.1') {
        apiModelName = 'gpt-4-turbo-preview';
      } else if (modelName === 'o3' || modelName === 'o4-mini') {
        apiModelName = 'gpt-4o';
      }
      // gpt-5-nano is now available and will be used directly

      aiModel = openai(apiModelName);
    }
  } else if (
    modelName.startsWith('claude') ||
    modelName === 'claude-opus-4.1' ||
    modelName === 'claude-sonnet-4'
  ) {
    // Anthropic models - DISABLED FOR NOW
    /*
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
    */
    return new Response(
      JSON.stringify({
        error: 'Anthropic models are temporarily disabled',
        code: 'MODEL_DISABLED',
        details: { model: modelName },
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
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
  }

  // Combine prompts: agent prompt first (most important), then system prompt, then context
  const prompts = [];

  // Agent prompt should always come first and be clearly delineated
  if (chat.agentPrompt) {
    prompts.push(
      `# AGENT IDENTITY AND CORE INSTRUCTIONS\n\n${chat.agentPrompt}`
    );
  }

  // User's custom system prompt comes second
  if (chat.systemPrompt) {
    prompts.push(`# USER SYSTEM PREFERENCES\n\n${chat.systemPrompt}`);
  }

  // RAG context comes last to provide relevant information
  if (contextToInject) {
    prompts.push(`# RELEVANT CONTEXT\n\n${contextToInject}`);
  }

  const combinedSystemPrompt = prompts.join('\n\n---\n\n');

  // Log for debugging
  if (chat.agentPrompt) {
  }
  if (chat.systemPrompt) {
  }

  let result;
  let finalText = '';
  const totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

  // Determine maxSteps based on reasoning mode
  const maxSteps = useReasoning ? 10 : Math.floor(Math.random() * 3) + 1; // Reasoning: 10, Regular: 1-3
  const messagesConsumed = useReasoning ? 2 : 1; // Reasoning costs 2 messages, regular costs 1

  try {
    if (useReasoning) {
      const reasoningSystemPrompt = `${combinedSystemPrompt}

When responding to the user's message, use a structured reasoning process with up to ${maxSteps} steps:

1. First, think through the problem step by step in a <thinking> section
2. Break down your reasoning into clear, numbered steps (Step 1, Step 2, etc.)
3. Use as many steps as needed (up to ${maxSteps}) to thoroughly analyze the problem
4. Consider multiple perspectives or approaches if relevant
5. Then provide your final response

Format your response like this:
<thinking>
Step 1: [Your first reasoning step]
Step 2: [Your second reasoning step] 
Step 3: [Continue as needed...]
[Use up to ${maxSteps} steps to reach a thorough conclusion]
</thinking>

[Your final response to the user]`;

      // Create a readable stream for multi-step reasoning
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Step 1: Initial reasoning
            controller.enqueue('**🧠 Thinking through your request...**\n\n');

            const reasoningResult = await streamText({
              model: aiModel,
              system: reasoningSystemPrompt,
              messages: conversationHistory,
              temperature: temperature ?? chat.temperature ?? 0.7,
              maxOutputTokens: maxTokens ?? chat.maxTokens ?? 2000,
            });

            let reasoningContent = '';
            for await (const chunk of reasoningResult.textStream) {
              reasoningContent += chunk;
            }

            // Extract thinking section and final response
            const thinkingMatch = reasoningContent.match(
              /<thinking>([\s\S]*?)<\/thinking>/
            );
            const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
            const finalResponse = reasoningContent
              .replace(/<thinking>[\s\S]*?<\/thinking>/, '')
              .trim();

            if (thinking) {
              // Stream the thinking process
              controller.enqueue('### Reasoning Steps:\n\n');
              const steps = thinking.split(/Step \d+:/);
              for (let i = 1; i < Math.min(steps.length, maxSteps + 1); i++) {
                if (steps[i]?.trim()) {
                  controller.enqueue(`**Step ${i}:** ${steps[i].trim()}\n\n`);
                  // Small delay to simulate thinking time
                  await new Promise((resolve) => setTimeout(resolve, 500));
                }
              }

              controller.enqueue('---\n\n');
            }

            // Stream the final response
            controller.enqueue('### Final Response:\n\n');
            finalText = finalResponse || reasoningContent;

            // Stream final response character by character for better UX
            for (const char of finalText) {
              controller.enqueue(char);
              // Very small delay for streaming effect
              await new Promise((resolve) => setTimeout(resolve, 10));
            }

            // Update usage tracking
            const usage = await reasoningResult.usage;
            if (usage) {
              totalUsage.inputTokens += usage.inputTokens || 0;
              totalUsage.outputTokens += usage.outputTokens || 0;
              totalUsage.totalTokens =
                totalUsage.inputTokens + totalUsage.outputTokens;
            }

            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      // Save the complete message to database
      const completeContent = finalText || 'Multi-step reasoning completed';
      const _assistantMessage = await ctx.runMutation(api.messages.create, {
        chatId: chatId as Id<'chats'>,
        walletAddress,
        role: 'assistant',
        content: completeContent,
        metadata: {
          model: modelName,
          finishReason: 'stop',
          usage: totalUsage,
          reasoning: 'multi-step',
        },
      });

      // Extract memories from conversation after AI response (non-blocking)
      if (memoryEnabled && _userMessage) {
        // Non-blocking memory extraction
        try {
          await ctx.runAction((api as any).memoryExtraction.processNewMessage, {
            messageId: _userMessage._id,
          });
        } catch (_error) {}
      }

      // Track message usage for subscription (skip for admins) - consume appropriate number of messages
      if (!adminStatus.isAdmin) {
        // For reasoning mode, we need to consume 2 messages
        for (let i = 0; i < messagesConsumed; i++) {
          await ctx.runMutation(api.subscriptions.trackMessageUsageByWallet, {
            walletAddress,
            isPremiumModel,
          });
        }
      }

      // Return the custom stream
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    const regularSystemPrompt = `${combinedSystemPrompt}

When responding to the user's message, you may use up to ${maxSteps} reasoning steps if the problem is complex enough to benefit from step-by-step thinking. For simple queries, respond directly. For more complex ones, use this format:

<thinking>
Step 1: [First reasoning step if needed]
Step 2: [Second reasoning step if needed]
Step 3: [Third reasoning step if needed - only if really necessary]
</thinking>

[Your response to the user]

Use your judgment - only use the thinking section if the query truly benefits from multi-step reasoning.`;

    result = await streamText({
      model: aiModel,
      system: regularSystemPrompt,
      messages: conversationHistory,
      temperature: temperature ?? chat.temperature ?? 0.7,
      maxOutputTokens: maxTokens ?? chat.maxTokens ?? 2000,
      onFinish: async ({ text, finishReason, usage }) => {
        // Save assistant message to database
        const _assistantMessage = await ctx.runMutation(api.messages.create, {
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
            reasoning: maxSteps > 1 ? 'regular' : undefined,
          },
        });

        // Extract memories from conversation after AI response (non-blocking)
        if (memoryEnabled && _userMessage) {
          // Non-blocking memory extraction
          try {
            await ctx.runAction(
              (api as any).memoryExtraction.processNewMessage,
              {
                messageId: _userMessage._id,
              }
            );
          } catch (_error) {}
        }

        // Track message usage for subscription (skip for admins) - consume appropriate number of messages
        if (!adminStatus.isAdmin) {
          // For reasoning mode, we need to consume 2 messages
          for (let i = 0; i < messagesConsumed; i++) {
            await ctx.runMutation(api.subscriptions.trackMessageUsageByWallet, {
              walletAddress,
              isPremiumModel,
            });
          }
        }
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to generate AI response',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }

  // Handle regular streaming response (non-reasoning mode)
  if (result) {
    // Convert to a proper text stream response with CORS headers
    // The AI SDK provides toTextStreamResponse() which returns a properly formatted Response
    const response = result.toTextStreamResponse();

    // Add CORS headers to the response
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept'
    );
    headers.set('Access-Control-Allow-Credentials', 'true');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // Fallback error response
  return new Response(
    JSON.stringify({
      error: 'No response generated',
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-Requested-With, Accept',
        'Access-Control-Allow-Credentials': 'true',
      },
    }
  );
});
