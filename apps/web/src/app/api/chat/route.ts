import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { 
  streamText, 
  convertToModelMessages,
  type UIMessage,
} from 'ai';
import { NextRequest } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Model provider mapping
const getModel = (modelId: string) => {
  // OpenAI models
  if (modelId.startsWith('gpt-')) {
    return openai(modelId);
  }
  
  // Anthropic models
  if (modelId.startsWith('claude-')) {
    return anthropic(modelId);
  }
  
  // Google models
  if (modelId.startsWith('gemini-')) {
    return google(modelId);
  }
  
  // Default fallback
  return openai('gpt-4-turbo-preview');
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
      data?: any;
    } = await req.json();

    // Get chat settings from Convex if chatId is provided
    let systemPrompt = 'You are Anubis, a helpful AI assistant specializing in blockchain and Web3 technologies.';
    let temperature = 0.7;
    let maxTokens = 2000;

    if (chatId) {
      try {
        const chat = await convex.query(api.chats.getById, { 
          id: chatId as Id<'chats'> 
        });
        
        if (chat) {
          // Combine agent prompt and user's custom system prompt
          systemPrompt = [
            chat.agentPrompt,
            chat.systemPrompt
          ].filter(Boolean).join('\n\n');
          
          temperature = chat.temperature || temperature;
          maxTokens = chat.maxTokens || maxTokens;
        }
      } catch (error) {
        console.error('Failed to fetch chat settings:', error);
      }
    }

    // Convert UI messages to model messages
    const modelMessages = convertToModelMessages(messages);

    // Check if enhanced reasoning is requested
    const useReasoning = data?.useReasoning === true;
    
    // Stream the response
    const result = streamText({
      model: getModel(model),
      system: systemPrompt,
      messages: modelMessages,
      temperature,
      maxTokens,
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
  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during chat processing' 
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