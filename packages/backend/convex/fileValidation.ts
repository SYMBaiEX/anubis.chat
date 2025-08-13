/**
 * File Upload Security and Validation Module
 * Provides comprehensive file validation, virus scanning simulation, and security checks
 */

import { createModuleLogger } from './utils/logger';

const logger = createModuleLogger('fileValidation');

// File size limits by type (in bytes)
const FILE_SIZE_LIMITS: Record<string, number> = {
  image: 10 * 1024 * 1024, // 10MB for images
  document: 50 * 1024 * 1024, // 50MB for documents
  pdf: 50 * 1024 * 1024, // 50MB for PDFs
  text: 5 * 1024 * 1024, // 5MB for text files
  default: 25 * 1024 * 1024, // 25MB default
};

// Allowed MIME types with strict validation
const ALLOWED_MIME_TYPES: Record<
  string,
  { extensions: string[]; magic: string | null }
> = {
  // Images
  'image/jpeg': { extensions: ['.jpg', '.jpeg'], magic: 'FFD8FF' },
  'image/png': { extensions: ['.png'], magic: '89504E47' },
  'image/gif': { extensions: ['.gif'], magic: '474946' },
  'image/webp': { extensions: ['.webp'], magic: '52494646' },

  // Documents
  'application/pdf': { extensions: ['.pdf'], magic: '25504446' },
  'text/plain': { extensions: ['.txt'], magic: null },
  'text/markdown': { extensions: ['.md'], magic: null },
  'application/json': { extensions: ['.json'], magic: null },

  // Office documents (be careful with these)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extensions: ['.docx'],
    magic: '504B0304',
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    extensions: ['.xlsx'],
    magic: '504B0304',
  },
};

// Dangerous patterns to check in file content
const DANGEROUS_PATTERNS = [
  /<script[\s>]/i, // JavaScript in HTML
  /javascript:/i, // JavaScript protocol
  /on\w+\s*=/i, // Event handlers
  /<iframe/i, // Iframes
  /<embed/i, // Embedded content
  /<object/i, // Object tags
  /\.exe$/i, // Executable files
  /\.dll$/i, // DLL files
  /\.bat$/i, // Batch files
  /\.cmd$/i, // Command files
  /\.sh$/i, // Shell scripts
  /\.ps1$/i, // PowerShell scripts
];

// File validation result interface
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  sanitized?: boolean;
  metadata?: {
    size: number;
    mimeType: string;
    extension: string;
    hash: string;
  };
}

/**
 * Validate file before processing
 * Performs comprehensive security checks
 */
export async function validateFile(
  file: Blob | ArrayBuffer,
  fileName: string,
  declaredMimeType?: string
): Promise<FileValidationResult> {
  const warnings: string[] = [];

  try {
    // Convert to ArrayBuffer if needed
    const buffer = file instanceof Blob ? await file.arrayBuffer() : file;
    const bytes = new Uint8Array(buffer);

    // 1. Check file size
    const size = bytes.length;
    const fileType = getFileType(declaredMimeType || '');
    const sizeLimit = FILE_SIZE_LIMITS[fileType] || FILE_SIZE_LIMITS.default;

    if (size > sizeLimit) {
      return {
        valid: false,
        error: `File size ${formatBytes(size)} exceeds limit of ${formatBytes(sizeLimit)}`,
      };
    }

    if (size === 0) {
      return {
        valid: false,
        error: 'File is empty',
      };
    }

    // 2. Validate MIME type
    const extension = getFileExtension(fileName);
    const mimeValidation = validateMimeType(
      declaredMimeType || '',
      extension,
      bytes
    );

    if (!mimeValidation.valid) {
      return {
        valid: false,
        error: mimeValidation.error,
      };
    }

    // 3. Check for dangerous content patterns
    const contentCheck = await checkDangerousContent(
      bytes,
      declaredMimeType || ''
    );
    if (!contentCheck.safe) {
      return {
        valid: false,
        error: contentCheck.error,
        warnings: contentCheck.warnings,
      };
    }

    // 4. Check for compression bombs
    const compressionCheck = checkCompressionBomb(bytes, size);
    if (!compressionCheck.safe) {
      return {
        valid: false,
        error: compressionCheck.error,
      };
    }

    // 5. Generate file hash for deduplication
    const hash = await generateFileHash(bytes);

    // 6. Additional checks for specific file types
    if (declaredMimeType?.startsWith('image/')) {
      const imageCheck = validateImageFile(bytes, declaredMimeType);
      if (!imageCheck.valid) {
        warnings.push(imageCheck.warning || 'Image validation warning');
      }
    }

    logger.info('File validation successful', {
      fileName,
      size,
      mimeType: declaredMimeType,
      hash,
    });

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        size,
        mimeType: declaredMimeType || 'application/octet-stream',
        extension,
        hash,
      },
    };
  } catch (error) {
    logger.error('File validation error', error);
    return {
      valid: false,
      error: 'File validation failed',
    };
  }
}

/**
 * Validate MIME type against extension and magic bytes
 */
function validateMimeType(
  mimeType: string,
  extension: string,
  bytes: Uint8Array
): { valid: boolean; error?: string } {
  // Check if MIME type is allowed
  if (!ALLOWED_MIME_TYPES[mimeType]) {
    return {
      valid: false,
      error: `File type '${mimeType}' is not allowed`,
    };
  }

  const typeConfig = ALLOWED_MIME_TYPES[mimeType];

  // Check extension matches
  if (!typeConfig.extensions.includes(extension.toLowerCase())) {
    return {
      valid: false,
      error: `File extension '${extension}' doesn't match MIME type '${mimeType}'`,
    };
  }

  // Check magic bytes if available
  if (typeConfig.magic && bytes.length >= 4) {
    const magicBytes = Array.from(bytes.slice(0, 4))
      .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
      .join('');

    if (!magicBytes.startsWith(typeConfig.magic)) {
      return {
        valid: false,
        error:
          "File content doesn't match declared type (magic bytes mismatch)",
      };
    }
  }

  return { valid: true };
}

/**
 * Check for dangerous content patterns
 */
async function checkDangerousContent(
  bytes: Uint8Array,
  mimeType: string
): Promise<{ safe: boolean; error?: string; warnings?: string[] }> {
  const warnings: string[] = [];

  // For text-based files, check content
  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(text)) {
        return {
          safe: false,
          error: `Dangerous content pattern detected: ${pattern.source}`,
        };
      }
    }

    // Check for excessive null bytes (could indicate binary content)
    const nullCount = Array.from(bytes).filter((b) => b === 0).length;
    if (nullCount > bytes.length * 0.1) {
      warnings.push('File contains excessive null bytes');
    }
  }

  // Check for embedded executables in all files
  const exeSignatures = [
    [0x4d, 0x5a], // MZ header (DOS/Windows executable)
    [0x7f, 0x45, 0x4c, 0x46], // ELF header (Linux executable)
    [0xcf, 0xfa, 0xed, 0xfe], // Mach-O header (macOS executable)
  ];

  for (const signature of exeSignatures) {
    if (bytes.length >= signature.length) {
      const match = signature.every((byte, index) => bytes[index] === byte);
      if (match) {
        return {
          safe: false,
          error: 'File contains executable code',
        };
      }
    }
  }

  return { safe: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Check for compression bombs (zip bombs, etc.)
 */
function checkCompressionBomb(
  bytes: Uint8Array,
  size: number
): { safe: boolean; error?: string } {
  // Check for suspicious compression ratios in ZIP files
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    // PK header (ZIP)
    // Simple heuristic: if file is small but claims large uncompressed size
    // This is a simplified check - production should use proper ZIP parsing
    if (size < 1024 * 1024) {
      // Less than 1MB
      // Look for suspicious patterns
      const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      if (text.includes('42.zip') || text.includes('bomb')) {
        return {
          safe: false,
          error: 'Suspicious compression detected - possible zip bomb',
        };
      }
    }
  }

  return { safe: true };
}

/**
 * Validate image files for additional security
 */
function validateImageFile(
  bytes: Uint8Array,
  mimeType: string
): { valid: boolean; warning?: string } {
  // Check for EXIF data that might contain malicious scripts
  // This is a simplified check - use a proper EXIF parser in production

  if (mimeType === 'image/jpeg') {
    // Look for EXIF marker (0xFFE1)
    for (let i = 0; i < bytes.length - 1; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xe1) {
        // Found EXIF data - check for suspicious content
        const exifData = bytes.slice(i, Math.min(i + 1000, bytes.length));
        const exifText = new TextDecoder('utf-8', { fatal: false }).decode(
          exifData
        );

        if (/<script/i.test(exifText) || /javascript:/i.test(exifText)) {
          return {
            valid: false,
            warning: 'Image contains suspicious EXIF data',
          };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Generate SHA-256 hash of file content using Web Crypto API
 */
async function generateFileHash(bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Get file type category from MIME type
 */
function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType.includes('document')) return 'document';
  return 'default';
}

/**
 * Extract file extension from filename
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.slice(lastDot) : '';
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(fileName: string): string {
  // Remove path traversal patterns
  let sanitized = fileName
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '_')
    .replace(/^\./, '_');

  // Remove control characters and non-printable characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Limit length
  if (sanitized.length > 255) {
    const extension = getFileExtension(sanitized);
    sanitized = sanitized.slice(0, 255 - extension.length) + extension;
  }

  // Ensure filename is not empty
  if (!sanitized || sanitized === '.') {
    sanitized = 'unnamed_file';
  }

  return sanitized;
}

/**
 * Create a quarantine record for suspicious files
 */
export interface QuarantineRecord {
  fileId: string;
  fileName: string;
  reason: string;
  threat: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  metadata: Record<string, any>;
}

export function createQuarantineRecord(
  fileId: string,
  fileName: string,
  reason: string,
  threat: QuarantineRecord['threat'],
  metadata?: Record<string, any>
): QuarantineRecord {
  return {
    fileId,
    fileName,
    reason,
    threat,
    timestamp: Date.now(),
    metadata: metadata || {},
  };
}
