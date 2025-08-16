import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { getModel } from '@/lib/ai/providers';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { ConvexHttpClient } from 'convex/browser';
import type { NextRequest } from 'next/server';

// Lazy initializer to avoid non-null assertions and ensure clear errors
function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_CONVEX_URL');
  }
  return new ConvexHttpClient(url);
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Model provider mapping using new provider registry
const getModelInstance = (modelId: string) => {
  try {
    // Use new provider registry with automatic fallback
    return getModel(modelId, { fallbackEnabled: true });
  } catch (error) {
    console.error(`Failed to get model ${modelId}:`, error);
    // Ultimate fallback to a known working model
    return getModel('gateway/deepseek/deepseek-v3', { fallbackEnabled: false });
  }
};

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      model = 'gpt-4-turbo-preview',
      chatId,
      data,
    }: {
      messages: UIMessage[];
      model?: string;
      chatId?: string;
      data?: unknown;
    } = await req.json();

    // Get chat settings from Convex if chatId is provided
    let systemPrompt =
      'You are Anubis, a helpful AI assistant specializing in blockchain and Web3 technologies.';
    let temperature = 0.7;
    let maxTokens = 2000;

    if (chatId) {
      try {
        const chat = await getConvexClient().query(api.chats.getById, {
          id: chatId as Id<'chats'>,
        });

        if (chat) {
          // Combine agent prompt and user's custom system prompt
          systemPrompt = [chat.agentPrompt, chat.systemPrompt]
            .filter(Boolean)
            .join('\n\n');

          temperature = chat.temperature || temperature;
          maxTokens = chat.maxTokens || maxTokens;
        }
      } catch (_error) {
        // Intentionally ignore errors fetching chat settings; defaults will be used
      }
    }

    // Convert UI messages to model messages
    const modelMessages = convertToModelMessages(messages);

    // Check if enhanced reasoning is requested
    const useReasoning =
      (data as { useReasoning?: boolean })?.useReasoning === true;

    // Stream the response
    const result = streamText({
      model: getModelInstance(model),
      system: systemPrompt,
      messages: modelMessages,
      temperature,
      maxOutputTokens: maxTokens,
      // Enable multi-step reasoning if requested
      ...(useReasoning && {
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'enhanced-reasoning',
        },
      }),
    });

    // Return UI message stream response
    return result.toUIMessageStreamResponse({
      // Add model info to the response
      messageMetadata: () => ({
        model,
        chatId,
      }),
    });
  } catch (error: unknown) {
    // Return error response
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'An error occurred during chat processing',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
