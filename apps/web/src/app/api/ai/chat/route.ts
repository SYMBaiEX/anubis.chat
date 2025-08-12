import { streamText, convertToCoreMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Initialize AI providers
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Tool definitions
const tools = {
  search: {
    description: 'Search for information on a topic',
    parameters: z.object({
      query: z.string().describe('The search query'),
      limit: z.number().optional().default(5).describe('Number of results'),
    }),
  },
  calculate: {
    description: 'Perform mathematical calculations',
    parameters: z.object({
      expression: z.string().describe('Mathematical expression to evaluate'),
    }),
  },
  analyzeImage: {
    description: 'Analyze an uploaded image',
    parameters: z.object({
      imageUrl: z.string().describe('URL of the image to analyze'),
      prompt: z.string().optional().describe('Specific analysis prompt'),
    }),
  },
};

export async function POST(req: Request) {
  try {
    const { messages, chatId, attachments, model = 'gpt-4' } = await req.json();

    // Convert messages to core format
    const coreMessages = convertToCoreMessages(messages);

    // Process attachments if present
    if (attachments && attachments.length > 0) {
      // Add attachment context to the last user message
      const lastUserMessage = coreMessages[coreMessages.length - 1];
      if (lastUserMessage.role === 'user') {
        const attachmentContext = attachments
          .map((a: any) => `[Attached ${a.type}: ${a.fileId}]`)
          .join('\n');
        lastUserMessage.content = `${attachmentContext}\n\n${lastUserMessage.content}`;
      }
    }

    // Select the AI provider based on model
    const provider = model.startsWith('claude') ? anthropic : openai;
    const modelId = model.startsWith('claude') 
      ? model 
      : model === 'gpt-4' 
        ? 'gpt-4-turbo-preview' 
        : model;

    // Stream the response
    const result = await streamText({
      model: provider(modelId),
      messages: coreMessages,
      tools,
      maxRetries: 3,
      onFinish: (event) => {
        console.log('Stream finished:', event);
      },
    });

    // Return the streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}