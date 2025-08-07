'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BaseComponentProps } from '@/lib/types/components';

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
  const [highlightedCode, setHighlightedCode] = useState('');

  useEffect(() => {
    // Highlight the code using Prism.js
    const highlighted = Prism.highlight(
      code,
      Prism.languages[language] || Prism.languages.text,
      language
    );
    setHighlightedCode(highlighted);
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
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
      {(title || language !== 'text' || showCopyButton) && (
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
            title || language !== 'text' ? "rounded-t-none border-t-0" : ""
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
                <div
                  className="leading-6"
                  dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
              </>
            ) : (
              // Without line numbers
              <div
                className="leading-6"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            )}
          </code>
        </pre>

        {/* Copy button (floating) - shown when no header */}
        {showCopyButton && !title && language === 'text' && (
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