import DOMPurify from 'isomorphic-dompurify';

// Configure DOMPurify for different contexts
const createSanitizer = (config: DOMPurify.Config = {}) => {
  return (dirty: string): string => {
    if (typeof window === 'undefined') {
      // Server-side: basic sanitization
      return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
        ...config,
      });
    }

    // Client-side: full sanitization
    return DOMPurify.sanitize(dirty, config);
  };
};

// Sanitize user input for display
export const sanitizeHTML = createSanitizer({
  ALLOWED_TAGS: [
    'b',
    'i',
    'em',
    'strong',
    'a',
    'p',
    'br',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
});

// Sanitize markdown content
export const sanitizeMarkdown = createSanitizer({
  ALLOWED_TAGS: [
    'b',
    'i',
    'em',
    'strong',
    'a',
    'p',
    'br',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
    'hr',
    'del',
    'ins',
    'sup',
    'sub',
  ],
  ALLOWED_ATTR: [
    'href',
    'target',
    'rel',
    'class',
    'id',
    'src',
    'alt',
    'width',
    'height',
    'title',
  ],
  ALLOW_DATA_ATTR: false,
});

// Strict sanitization for form inputs
export const sanitizeInput = (input: string): string => {
  // Remove all HTML tags and attributes
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // Additional cleaning for common injection patterns
  return cleaned
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Sanitize URLs
export const sanitizeURL = (url: string): string => {
  try {
    const parsed = new URL(url);

    // Only allow http(s) and mailto protocols
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '';
    }

    return parsed.toString();
  } catch {
    // Invalid URL
    return '';
  }
};

// Sanitize file names
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .slice(0, 255); // Limit length
};

// Sanitize JSON data
export const sanitizeJSON = <T = any>(data: any): T => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return sanitizeInput(value);
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[sanitizeInput(key)] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  return sanitizeValue(data) as T;
};

// Validate and sanitize email
export const sanitizeEmail = (email: string): string => {
  const cleaned = sanitizeInput(email).toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(cleaned) ? cleaned : '';
};

// Validate and sanitize phone number
export const sanitizePhone = (phone: string): string => {
  // Remove all non-digit characters
  return phone.replace(/\D/g, '').slice(0, 15);
};

// Create a hook for React components
export const useSanitize = () => {
  return {
    html: sanitizeHTML,
    markdown: sanitizeMarkdown,
    input: sanitizeInput,
    url: sanitizeURL,
    fileName: sanitizeFileName,
    json: sanitizeJSON,
    email: sanitizeEmail,
    phone: sanitizePhone,
  };
};
