/**
 * File Upload API Endpoint
 * Handles multipart file uploads for PDFs, images, and other documents
 */

import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { api, convex } from '@/lib/database/convex';
import { authRateLimit } from '@/lib/middleware/rate-limit';
import { requireProPlusAccess } from '@/lib/middleware/subscription-auth';
import type { FileUploadResponse } from '@/lib/types/api';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('api/files/upload');

// =============================================================================
// Constants
// =============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const LARGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB - requires Pro+ for larger files
const ALLOWED_FILE_TYPES: Record<string, string> = {
  // Documents
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/markdown': '.md',
  'application/json': '.json',

  // Images
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',

  // Code files
  'text/javascript': '.js',
  'application/javascript': '.js',
  'text/typescript': '.ts',
  'text/x-python': '.py',
  'text/x-java': '.java',
  'text/html': '.html',
  'text/css': '.css',
};

// =============================================================================
// Types
// =============================================================================

interface FileMetadata {
  purpose?: 'assistants' | 'vision' | 'batch' | 'fine-tune';
  description?: string;
  tags?: string[];
}

// =============================================================================
// Validation Schema
// =============================================================================

const fileMetadataSchema = z.object({
  purpose: z.enum(['assistants', 'vision', 'batch', 'fine-tune']).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

// =============================================================================
// Helper Functions
// =============================================================================

async function parseFormData(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const metadataStr = formData.get('metadata') as string | null;

    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES[file.type]) {
      throw new Error(`File type ${file.type} is not supported`);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Parse metadata if provided
    let metadata: FileMetadata = {};
    if (metadataStr) {
      try {
        const parsed = JSON.parse(metadataStr);
        metadata = fileMetadataSchema.parse(parsed);
      } catch (error) {
        log.warn('Invalid metadata provided', { error });
      }
    }

    return { file, metadata };
  } catch (error) {
    log.error('Failed to parse form data', { error });
    throw error;
  }
}

async function processFile(file: File): Promise<{
  buffer: ArrayBuffer;
  mimeType: string;
  extension: string;
  hash: string;
}> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Calculate file hash for deduplication
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return {
    buffer,
    mimeType: file.type,
    extension: ALLOWED_FILE_TYPES[file.type],
    hash,
  };
}

// =============================================================================
// POST /api/files/upload - Upload a file
// =============================================================================

async function handlePost(req: AuthenticatedRequest) {
  try {
    // Get wallet address from authenticated request
    const walletAddress = req.walletAddress;

    // Parse form data
    const { file, metadata } = await parseFormData(req);

    // Process file
    const { buffer, mimeType, extension, hash } = await processFile(file);

    // Generate file ID
    const fileId = `file_${nanoid(24)}`;
    const fileName = file.name || `${fileId}${extension}`;

    // Convert buffer to base64 for Convex storage
    const base64Data = Buffer.from(buffer).toString('base64');

    // Store file metadata in Convex
    const storedFile = await convex.mutation(api.files.upload, {
      walletAddress,
      fileId,
      fileName,
      mimeType,
      size: file.size,
      hash,
      data: base64Data,
      purpose: metadata.purpose || 'assistants',
      description: metadata.description,
      tags: metadata.tags || [],
    });

    log.info('File uploaded successfully', {
      fileId,
      fileName,
      size: file.size,
      mimeType,
      walletAddress,
    });

    // Format response
    const response: FileUploadResponse = {
      id: fileId,
      object: 'file',
      bytes: file.size,
      created_at: Date.now(),
      filename: fileName,
      purpose: metadata.purpose || 'assistants',
      status: 'processed',
      status_details: null,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    log.error('File upload failed', { error });

    const errorMessage =
      error instanceof Error ? error.message : 'File upload failed';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

// =============================================================================
// Export with middleware
// =============================================================================

export async function POST(request: NextRequest) {
  return authRateLimit(request, async (req) => {
    // Check if this is a large file upload that requires Pro+ access
    const formData = await req.clone().formData();
    const file = formData.get('file') as File | null;
    const isLargeFile = file && file.size > LARGE_FILE_SIZE;

    if (isLargeFile) {
      return requireProPlusAccess(req, 'large_files', async (authReq) =>
        handlePost(authReq)
      );
    }
    // For smaller files, use basic subscription auth (all tiers can upload small files)
    const { withSubscriptionAuth } = await import(
      '@/lib/middleware/subscription-auth'
    );
    return withSubscriptionAuth(req, async (authReq) => handlePost(authReq));
  });
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
