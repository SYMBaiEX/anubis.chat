'use client';

import { Check, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isCodeSafe, sanitizeText } from '@/lib/security/sanitize-client';
import type { BaseComponentProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';

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

  // Prepare code text for rendering (no inner HTML)
  const displayCode = useMemo(() => {
    try {
      if (!isCodeSafe(code)) {
        log.warn('Potentially unsafe code detected, rendering as plain text', {
          language,
          codeLength: code.length,
        });
        setHighlightError('Code contains potentially unsafe content');
        return sanitizeText(code);
      }
      setHighlightError(null);
      return code;
    } catch (error) {
      log.error('Failed to prepare code for rendering', {
        error: error instanceof Error ? error.message : String(error),
        language,
        codeLength: code.length,
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
        error: error instanceof Error ? error.message : String(error),
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

  return (
    <div className={cn('group relative my-4', className)}>
      {/* Header */}
      {(title || language !== 'text' || showCopyButton || highlightError) && (
        <div className="flex items-center justify-between rounded-t-lg border border-muted border-b-0 bg-muted/50 px-4 py-2">
          <div className="flex items-center space-x-2">
            {title && (
              <span className="font-medium text-foreground text-sm">
                {title}
              </span>
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
              <span className="ml-1 text-xs">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          )}
        </div>
      )}

      {/* Code Content */}
      <div className="relative">
        {highlightError ? (
          <pre
            className={cn(
              'overflow-x-auto rounded-lg border border-muted bg-[#2d3748] p-4 text-sm',
              title || language !== 'text' ? 'rounded-t-none border-t-0' : ''
            )}
          >
            <code className="block whitespace-pre-wrap text-gray-100 leading-6">
              {displayCode}
            </code>
          </pre>
        ) : (
          <SyntaxHighlighter
            customStyle={{
              borderRadius:
                title || language !== 'text' ? '0 0 0.5rem 0.5rem' : '0.5rem',
              margin: 0,
              background: '#2d3748',
              border: '1px solid var(--muted)',
              fontSize: '0.875rem',
            }}
            language={language}
            PreTag="div"
            showLineNumbers={showLineNumbers}
            style={oneDark}
          >
            {displayCode}
          </SyntaxHighlighter>
        )}

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
