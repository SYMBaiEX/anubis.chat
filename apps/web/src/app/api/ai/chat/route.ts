import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText, tool, type UIMessage } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Initialize AI providers
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Tool definitions with AI SDK v5 format
const tools = {
  search: tool({
    description: 'Search for information on a topic',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
      limit: z.number().optional().default(5).describe('Number of results'),
    }),
    execute: async ({ query, limit }) => {
      // Implementation would go here
      return { query, limit, results: [] };
    },
  }),
  calculate: tool({
    description: 'Perform mathematical calculations',
    inputSchema: z.object({
      expression: z.string().describe('Mathematical expression to evaluate'),
    }),
    execute: async ({ expression }) => {
      // Implementation would go here
      try {
        // This is a simple example - in production use a safe math parser
        const result = eval(expression);
        return { expression, result };
      } catch (error) {
        return { expression, error: 'Invalid expression' };
      }
    },
  }),
  analyzeImage: tool({
    description: 'Analyze an uploaded image',
    inputSchema: z.object({
      imageUrl: z.string().describe('URL of the image to analyze'),
      prompt: z.string().optional().describe('Specific analysis prompt'),
    }),
    execute: async ({ imageUrl, prompt }) => {
      // Implementation would go here
      return { imageUrl, prompt, analysis: 'Image analysis placeholder' };
    },
  }),
};

export async function POST(req: Request) {
  try {
    const {
      messages,
      attachments,
      model = 'gpt-4',
    }: {
      messages: UIMessage[];
      attachments?: Array<{ type: string; fileId: string }>;
      model?: string;
    } = await req.json();

    // Convert messages to core format
    const coreMessages = convertToCoreMessages(messages);

    // Process attachments if present
    if (attachments && attachments.length > 0) {
      // Add attachment context to the last user message
      const lastUserMessage = coreMessages.at(-1);
      if (lastUserMessage && lastUserMessage.role === 'user') {
        const attachmentContext = attachments
          .map((a) => `[Attached ${a.type}: ${a.fileId}]`)
          .join('\n');
        lastUserMessage.content = `${attachmentContext}\n\n${lastUserMessage.content}`;
      }
    }

    // Select the AI provider based on model
    const provider = model.startsWith('claude') ? anthropic : openai;
    let modelId = model;
    if (!model.startsWith('claude') && model === 'gpt-4') {
      modelId = 'gpt-4-turbo-preview';
    }

    // Stream the response
    const result = await streamText({
      model: provider(modelId),
      messages: coreMessages,
      tools,
      maxRetries: 3,
      onFinish: () => {
        // no-op
      },
    });

    // Return the streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process chat request', message },
      { status: 500 }
    );
  }
}
