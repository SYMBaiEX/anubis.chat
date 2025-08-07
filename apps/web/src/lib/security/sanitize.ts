/**
 * HTML Sanitization Utilities
 * Cross-platform DOMPurify wrapper for safe HTML rendering
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

/**
 * Create isomorphic DOMPurify instance that works in both browser and Node.js
 */
let isomorphicDOMPurify: typeof DOMPurify;

if (typeof window !== 'undefined') {
  // Browser environment
  isomorphicDOMPurify = DOMPurify;
} else {
  // Node.js environment (SSR)
  const window = new JSDOM('').window;
  isomorphicDOMPurify = DOMPurify(window as unknown as Window);
}

/**
 * Default sanitization options for code highlighting
 */
const DEFAULT_CODE_SANITIZE_OPTIONS: DOMPurify.Config = {
  ALLOWED_TAGS: ['span', 'br'],
  ALLOWED_ATTR: ['class', 'style'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
};

/**
 * Strict sanitization options for user content
 */
const STRICT_SANITIZE_OPTIONS: DOMPurify.Config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
};

/**
 * Sanitize HTML for syntax-highlighted code blocks
 * Allows only spans and line breaks with class/style attributes
 */
export function sanitizeCodeHTML(html: string): string {
  try {
    return isomorphicDOMPurify.sanitize(html, DEFAULT_CODE_SANITIZE_OPTIONS);
  } catch (error) {
    // Fallback to empty string if sanitization fails
    // Using console.error here as a fallback since this is a critical security function
    // and we want to ensure errors are always logged even if logger fails
    console.error('Code sanitization failed:', error);
    return '';
  }
}

/**
 * Strictly sanitize user-generated HTML content
 * Very restrictive - only allows basic formatting tags
 */
export function sanitizeUserHTML(html: string): string {
  try {
    return isomorphicDOMPurify.sanitize(html, STRICT_SANITIZE_OPTIONS);
  } catch (error) {
    // Fallback to empty string if sanitization fails
    // Using console.error here as a fallback since this is a critical security function
    // and we want to ensure errors are always logged even if logger fails
    console.error('User content sanitization failed:', error);
    return '';
  }
}

/**
 * Sanitize text content by escaping HTML entities
 * Safe fallback for when HTML rendering is not needed
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate that a string contains only safe characters for code highlighting
 */
export function isCodeSafe(code: string): boolean {
  // Check for potential XSS patterns
  const dangerousPatterns = [
    /<script[^>]*>.*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=/gi, // Event handlers
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(code));
}

// Export the isomorphic instance for advanced use cases
export { isomorphicDOMPurify };