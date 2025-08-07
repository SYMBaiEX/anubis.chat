'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BaseComponentProps } from '@/lib/types/components';
import { sanitizeCodeHTML, sanitizeText, isCodeSafe } from '@/lib/security/sanitize';
import { createModuleLogger } from '@/lib/utils/logger';

// Import Prism.js and themes
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

// Import common language definitions
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-solidity';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-markdown';

const log = createModuleLogger('code-block');

interface CodeBlockProps extends BaseComponentProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  title?: string;
}

/**
 * CodeBlock component - Syntax-highlighted code display
 * Uses Prism.js for highlighting with copy functionality
 */
export function CodeBlock({
  code,
  language = 'text',
  showLineNumbers = true,
  showCopyButton = true,
  title,
  className,
  children,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightError, setHighlightError] = useState<string | null>(null);

  // Memoize the highlighted and sanitized code to prevent re-processing on every render
  const highlightedCode = useMemo(() => {
    try {
      // First check if the code is safe
      if (!isCodeSafe(code)) {
        log.warn('Potentially unsafe code detected, falling back to plain text', { 
          language,
          codeLength: code.length 
        });
        setHighlightError('Code contains potentially unsafe content');
        return sanitizeText(code);
      }

      // Highlight the code using Prism.js
      const highlighted = Prism.highlight(
        code,
        Prism.languages[language] || Prism.languages.text,
        language
      );
      
      // Sanitize the highlighted code to prevent XSS
      const sanitized = sanitizeCodeHTML(highlighted);
      
      // If sanitization returned empty string, fall back to plain text
      if (!sanitized && code.length > 0) {
        log.warn('Code sanitization returned empty result, falling back to plain text', {
          language,
          originalLength: code.length,
          highlightedLength: highlighted.length
        });
        setHighlightError('Code highlighting failed, displaying as plain text');
        return sanitizeText(code);
      }
      
      setHighlightError(null);
      return sanitized;
    } catch (error) {
      log.error('Failed to highlight code', { 
        error: error instanceof Error ? error.message : String(error),
        language,
        codeLength: code.length 
      });
      setHighlightError('Syntax highlighting unavailable');
      return sanitizeText(code);
    }
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      log.error('Failed to copy code', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  };

  const getLanguageDisplayName = (lang: string) => {
    const languageMap: Record<string, string> = {
      js: 'JavaScript',
      jsx: 'React JSX',
      ts: 'TypeScript',
      tsx: 'React TSX',
      py: 'Python',
      rs: 'Rust',
      sol: 'Solidity',
      json: 'JSON',
      bash: 'Bash',
      sh: 'Shell',
      sql: 'SQL',
      yaml: 'YAML',
      yml: 'YAML',
      toml: 'TOML',
      md: 'Markdown',
      html: 'HTML',
      css: 'CSS',
      go: 'Go',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      php: 'PHP',
      rb: 'Ruby',
      swift: 'Swift',
      kotlin: 'Kotlin',
      scala: 'Scala',
      clojure: 'Clojure',
      elixir: 'Elixir',
      haskell: 'Haskell',
      dart: 'Dart',
      text: 'Text',
    };
    
    return languageMap[lang] || lang.toUpperCase();
  };

  const lines = code.split('\n');

  return (
    <div className={cn("group relative my-4", className)}>
      {/* Header */}
      {(title || language !== 'text' || showCopyButton || highlightError) && (
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-muted bg-muted/50 px-4 py-2">
          <div className="flex items-center space-x-2">
            {title && (
              <span className="font-medium text-sm text-foreground">{title}</span>
            )}
            {language !== 'text' && (
              <Badge className="text-xs" variant="secondary">
                {getLanguageDisplayName(language)}
              </Badge>
            )}
            {highlightError && (
              <Badge className="text-xs" variant="destructive">
                ⚠ {highlightError}
              </Badge>
            )}
          </div>
          
          {showCopyButton && (
            <Button
              className="opacity-0 transition-opacity group-hover:opacity-100"
              onClick={handleCopy}
              size="sm"
              variant="ghost"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="ml-1 text-xs">
                {copied ? 'Copied' : 'Copy'}
              </span>
            </Button>
          )}
        </div>
      )}

      {/* Code Content */}
      <div className="relative">
        <pre
          className={cn(
            "overflow-x-auto rounded-lg border border-muted bg-[#2d3748] p-4 text-sm",
            title || language !== 'text' || highlightError ? "rounded-t-none border-t-0" : ""
          )}
        >
          <code
            className={cn(
              "block text-gray-100",
              `language-${language}`,
              showLineNumbers && "grid grid-cols-[min-content_1fr] gap-4"
            )}
          >
            {showLineNumbers ? (
              // With line numbers
              <>
                <div className="select-none text-right text-gray-500">
                  {lines.map((_, index) => (
                    <div key={index + 1} className="leading-6">
                      {index + 1}
                    </div>
                  ))}
                </div>
                {highlightError ? (
                  // Show plain text if there was an error
                  <div className="leading-6 whitespace-pre-wrap">
                    {code}
                  </div>
                ) : (
                  // Show highlighted/sanitized HTML
                  <div
                    className="leading-6"
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                )}
              </>
            ) : (
              // Without line numbers
              highlightError ? (
                // Show plain text if there was an error  
                <div className="leading-6 whitespace-pre-wrap">
                  {code}
                </div>
              ) : (
                // Show highlighted/sanitized HTML
                <div
                  className="leading-6"
                  dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
              )
            )}
          </code>
        </pre>

        {/* Copy button (floating) - shown when no header */}
        {showCopyButton && !title && language === 'text' && !highlightError && (
          <Button
            className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleCopy}
            size="sm"
            variant="secondary"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {children}
    </div>
  );
}

export default CodeBlock;