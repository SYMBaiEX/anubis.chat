'use client';

import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface OptimizedMarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

/**
 * OptimizedMarkdownRenderer - Fast markdown rendering without heavy syntax highlighting
 * Uses simpler rendering for streaming messages to prevent layout shifts
 */
export const OptimizedMarkdownRenderer = memo(function OptimizedMarkdownRenderer({
  content,
  className,
  isStreaming = false,
}: OptimizedMarkdownRendererProps) {
  // Pre-process content to avoid re-parsing
  const processedContent = useMemo(() => {
    if (!content) return '';
    // For streaming, return content as-is to avoid re-processing
    if (isStreaming) return content;
    // For complete messages, we can do more processing
    return content;
  }, [content, isStreaming]);

  // Use simpler components for faster rendering
  const components = useMemo(() => ({
    // Simple code rendering without heavy syntax highlighting
    code: ({ node, inline, className: codeClassName, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(codeClassName || '');
      const language = match ? match[1] : '';
      
      // For streaming, use simple styling
      if (isStreaming || inline) {
        return (
          <code
            className={cn(
              'rounded bg-muted px-1 py-0.5 font-mono text-sm',
              inline ? '' : 'block p-3 my-2 overflow-x-auto'
            )}
            {...props}
          >
            {children}
          </code>
        );
      }

      // For complete messages, add language badge but skip heavy highlighting
      return (
        <div className="relative my-3">
          {language && (
            <div className="absolute top-0 right-0 px-2 py-1 text-xs bg-muted rounded-bl">
              {language}
            </div>
          )}
          <pre className="overflow-x-auto rounded-lg bg-muted p-4">
            <code className="font-mono text-sm">
              {String(children).replace(/\n$/, '')}
            </code>
          </pre>
        </div>
      );
    },

    // Optimized paragraph with minimal styling
    p: ({ children }: any) => (
      <p className="mb-3 last:mb-0">{children}</p>
    ),

    // Simplified headings
    h1: ({ children }: any) => (
      <h1 className="mb-3 font-bold text-xl">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="mb-2 font-semibold text-lg">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="mb-2 font-semibold text-base">{children}</h3>
    ),

    // Simple list styling
    ul: ({ children }: any) => (
      <ul className="mb-3 ml-6 list-disc">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="mb-3 ml-6 list-decimal">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="mb-1">{children}</li>
    ),

    // Links
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {children}
      </a>
    ),

    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-3">
        {children}
      </blockquote>
    ),

    // Tables with simple styling
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full divide-y divide-border">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-muted">{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-border">{children}</tbody>
    ),
    tr: ({ children }: any) => <tr>{children}</tr>,
    th: ({ children }: any) => (
      <th className="px-3 py-2 text-left text-sm font-semibold">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-3 py-2 text-sm">{children}</td>
    ),

    // Horizontal rule
    hr: () => <hr className="my-4 border-border" />,

    // Strong and emphasis
    strong: ({ children }: any) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic">{children}</em>
    ),
  }), [isStreaming]);

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        skipHtml
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
});

export default OptimizedMarkdownRenderer;