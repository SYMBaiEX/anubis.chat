/**
 * Chat Export API Endpoint
 * Exports chat conversations in various formats (JSON, Markdown, PDF)
 */

import type { Id } from '@convex/_generated/dataModel';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { api, convex } from '@/lib/database/convex';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
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
// Types
// =============================================================================

interface Message {
  _id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt: number;
  metadata?: {
    model?: string;
    toolName?: string;
    [key: string]: unknown;
  };
}

interface Chat {
  _id: Id<'chats'>;
  title: string;
  model: string;
  systemPrompt?: string;
  createdAt: number;
  updatedAt: number;
  ownerId: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatMessageAsMarkdown(message: Message): string {
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

function generateMarkdown(chat: Chat, messages: Message[]): string {
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
  // Import jsPDF dynamically to avoid issues with SSR
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set up document properties
  doc.setProperties({
    title: title,
    creator: 'ISIS Chat',
    subject: 'Chat Export',
    keywords: 'chat, export, pdf',
  });

  // Configure text settings
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxLineWidth = pageWidth - 2 * margin;
  let currentY = margin;

  // Helper function to add new page if needed
  function checkPageBreak(lineHeight: number) {
    if (currentY + lineHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
  }

  // Helper function to wrap text
  function addWrappedText(text: string, x: number, y: number, maxWidth: number, fontSize: number, fontStyle: string = 'normal') {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.4; // Approximate line height in mm
    
    for (const line of lines) {
      checkPageBreak(lineHeight);
      doc.text(line, x, currentY);
      currentY += lineHeight;
    }
    
    return currentY;
  }

  // Parse and render markdown content
  const lines = markdown.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '') {
      currentY += 3; // Small spacing for empty lines
      continue;
    }
    
    // Handle different markdown elements
    if (line.startsWith('# ')) {
      // H1 - Title
      checkPageBreak(12);
      currentY += 5;
      addWrappedText(line.substring(2), margin, currentY, maxLineWidth, 18, 'bold');
      currentY += 8;
    } else if (line.startsWith('## ')) {
      // H2 - Section headers
      checkPageBreak(10);
      currentY += 4;
      addWrappedText(line.substring(3), margin, currentY, maxLineWidth, 14, 'bold');
      currentY += 6;
    } else if (line.startsWith('### ')) {
      // H3 - Message headers (User, Assistant, etc.)
      checkPageBreak(8);
      currentY += 3;
      addWrappedText(line.substring(4), margin, currentY, maxLineWidth, 12, 'bold');
      currentY += 4;
    } else if (line.startsWith('**') && line.endsWith('**')) {
      // Bold text (metadata)
      checkPageBreak(6);
      const text = line.substring(2, line.length - 2);
      addWrappedText(text, margin, currentY, maxLineWidth, 10, 'bold');
      currentY += 2;
    } else if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      // Italic text (timestamps, model info)
      checkPageBreak(6);
      const text = line.substring(1, line.length - 1);
      addWrappedText(text, margin, currentY, maxLineWidth, 9, 'italic');
      currentY += 2;
    } else if (line === '---') {
      // Horizontal rule
      checkPageBreak(5);
      currentY += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 4;
    } else if (line.length > 0) {
      // Regular text content
      checkPageBreak(6);
      addWrappedText(line, margin, currentY, maxLineWidth, 10, 'normal');
      currentY += 2;
    }
  }

  // Add footer with generation info
  const totalPages = doc.internal.pages.length - 1; // Subtract 1 because pages array includes a null first element
  
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    
    // Add page number
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
    
    // Add generation timestamp on first page
    if (pageNum === 1) {
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        margin,
        pageHeight - 10
      );
    }
  }

  // Convert PDF to buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

// =============================================================================
// GET /api/chats/[id]/export - Export chat
// =============================================================================

async function handleGet(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatId } = await params;
    // Get wallet address from authenticated request
    const walletAddress = req.walletAddress;

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
      id: chatId as Id<'chats'>,
    }) as Chat | null;

    if (!chat || chat.ownerId !== walletAddress) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Get messages
    const messagesResult = await convex.query(api.messages.getByChatId, {
      chatId: chatId as Id<'chats'>,
      limit: 1000, // Export all messages
    });

    // Filter messages based on options
    let messages = messagesResult as Message[];
    if (!includeSystemMessages) {
      messages = messages.filter((m) => m.role !== 'system');
    }

    // Clean metadata if not included
    if (!includeMetadata) {
      messages = messages.map((m) => ({
        ...m,
        metadata: undefined,
      }));
    }

    log.info('Exporting chat', {
      chatId: chatId,
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
          messages: messages.map((m) => ({
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

        return new NextResponse(pdfBuffer, {
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
    log.error('Export failed', { error });

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
  context: { params: Promise<{ id: string }> }
) {
  return authRateLimit(request, async (req) =>
    withAuth(req, async (authReq: AuthenticatedRequest) => handleGet(authReq, context))
  );
}
