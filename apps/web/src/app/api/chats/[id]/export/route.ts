/**
 * Chat Export API Endpoint
 * Exports chat conversations in various formats (JSON, Markdown, PDF)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { api, convex } from '@/lib/database/convex';
import { withAuth } from '@/lib/middleware/auth';
import { authRateLimit } from '@/lib/middleware/rate-limit';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('api/chats/export');

// =============================================================================
// Validation Schema
// =============================================================================

const exportQuerySchema = z.object({
  format: z.enum(['json', 'markdown', 'pdf']).default('json'),
  includeSystemMessages: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true')
    .default(false),
  includeMetadata: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true')
    .default(false),
});

// =============================================================================
// Helper Functions
// =============================================================================

function formatMessageAsMarkdown(message: any): string {
  const role = message.role.charAt(0).toUpperCase() + message.role.slice(1);
  const timestamp = new Date(message.createdAt).toLocaleString();

  let content = `### ${role}\n`;
  content += `*${timestamp}*\n\n`;
  content += `${message.content}\n\n`;

  if (message.metadata?.model) {
    content += `*Model: ${message.metadata.model}*\n\n`;
  }

  return content;
}

function generateMarkdown(chat: any, messages: any[]): string {
  let markdown = `# ${chat.title}\n\n`;
  markdown += `**Created:** ${new Date(chat.createdAt).toLocaleString()}\n`;
  markdown += `**Model:** ${chat.model}\n`;
  markdown += `**Messages:** ${messages.length}\n\n`;
  markdown += '---\n\n';

  if (chat.systemPrompt) {
    markdown += `## System Prompt\n\n${chat.systemPrompt}\n\n---\n\n`;
  }

  markdown += '## Conversation\n\n';

  for (const message of messages) {
    markdown += formatMessageAsMarkdown(message);
    markdown += '---\n\n';
  }

  return markdown;
}

async function generatePDF(markdown: string, title: string): Promise<Buffer> {
  // Note: In production, you would use a library like puppeteer or jsPDF
  // For now, we'll return a simple implementation that converts markdown to basic PDF
  // This is a placeholder - you should implement proper PDF generation

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
        h3 { color: #888; margin-top: 20px; }
        p { line-height: 1.6; }
        hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
        em { color: #999; }
      </style>
    </head>
    <body>
      ${markdown.replace(/\n/g, '<br>')}
    </body>
    </html>
  `;

  // This is a simplified implementation
  // In production, use a proper HTML to PDF converter
  return Buffer.from(htmlContent, 'utf-8');
}

// =============================================================================
// GET /api/chats/[id]/export - Export chat
// =============================================================================

async function handleGet(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get wallet address from auth
    const walletAddress = req.headers.get('x-wallet-address');
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const queryValidation = exportQuerySchema.safeParse({
      format: searchParams.get('format'),
      includeSystemMessages: searchParams.get('includeSystemMessages'),
      includeMetadata: searchParams.get('includeMetadata'),
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: queryValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const { format, includeSystemMessages, includeMetadata } =
      queryValidation.data;

    // Get chat from Convex
    const chat = await convex.query(api.chats.getById, {
      id: params.id as any,
    });

    if (!chat || chat.ownerId !== walletAddress) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Get messages
    const messagesResult = await convex.query(api.messages.getByChatId, {
      chatId: params.id as any,
      limit: 1000, // Export all messages
    });

    // Filter messages based on options
    let messages = messagesResult;
    if (!includeSystemMessages) {
      messages = messages.filter((m: any) => m.role !== 'system');
    }

    // Clean metadata if not included
    if (!includeMetadata) {
      messages = messages.map((m: any) => ({
        ...m,
        metadata: undefined,
      }));
    }

    log.info('Exporting chat', {
      chatId: params.id,
      format,
      messageCount: messages.length,
      walletAddress,
    });

    // Generate export based on format
    switch (format) {
      case 'json': {
        const exportData = {
          chat: {
            id: chat._id,
            title: chat.title,
            model: chat.model,
            systemPrompt: chat.systemPrompt,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
          },
          messages: messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
            ...(includeMetadata && m.metadata ? { metadata: m.metadata } : {}),
          })),
          exportedAt: Date.now(),
        };

        return NextResponse.json(exportData, {
          headers: {
            'Content-Disposition': `attachment; filename="${chat.title.replace(/[^a-z0-9]/gi, '_')}_export.json"`,
          },
        });
      }

      case 'markdown': {
        const markdown = generateMarkdown(chat, messages);

        return new NextResponse(markdown, {
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Disposition': `attachment; filename="${chat.title.replace(/[^a-z0-9]/gi, '_')}_export.md"`,
          },
        });
      }

      case 'pdf': {
        const markdown = generateMarkdown(chat, messages);
        const pdfBuffer = await generatePDF(markdown, chat.title);

        return new NextResponse(pdfBuffer as any, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${chat.title.replace(/[^a-z0-9]/gi, '_')}_export.pdf"`,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error('Export failed', { error, chatId: params.id });

    return NextResponse.json(
      { error: 'Failed to export chat' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Export with middleware
// =============================================================================

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return authRateLimit(request, async (req) => handleGet(req, context));
}
