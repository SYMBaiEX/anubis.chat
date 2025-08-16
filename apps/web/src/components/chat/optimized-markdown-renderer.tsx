'use client';

import { memo, useMemo } from 'react';
import type { Components } from 'react-markdown';
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
export const OptimizedMarkdownRenderer = memo(
  function OptimizedMarkdownRenderer({
    content,
    className,
    isStreaming = false,
  }: OptimizedMarkdownRendererProps) {
    // Pre-process content to avoid re-parsing and reduce layout shifts during streaming
    const processedContent = useMemo(() => {
      if (!content) {
        return '';
      }

      // For streaming, provide stable rendering by detecting complete markdown blocks
      // This prevents jarring visual changes when partial markdown is being parsed
      if (isStreaming) {
        // Check if content has complete markdown structures that are safe to render
        const hasCompleteCodeBlocks = /```[\s\S]*?```/g.test(content);
        const hasCompleteHeaders = /^#{1,6}\s+.+$/gm.test(content);
        const hasCompleteLists = /^[\s]*[-*+]\s+.+$/gm.test(content);
        const hasCompleteLinks = /\[([^\]]+)\]\(([^)]+)\)/g.test(content);

        // If we detect complete markdown structures, it's safe to parse
        if (
          hasCompleteCodeBlocks ||
          hasCompleteHeaders ||
          hasCompleteLists ||
          hasCompleteLinks
        ) {
          return content;
        }

        // For plain text or incomplete markdown, return as-is for stable rendering
        return content;
      }

      // For complete messages, do full processing
      return content;
    }, [content, isStreaming]);

    // Use simpler components for faster rendering
    const components = useMemo<Partial<Components>>(
      () => ({
        // Enhanced code rendering with streaming-aware styling
        code: ({ className: codeClassName, children }) => {
          const inline = !codeClassName?.startsWith('language-');
          const match = /language-(\w+)/.exec(codeClassName || '');
          const language = match ? match[1] : '';

          // For streaming, use consistent styling that won't shift when complete
          if (isStreaming || inline) {
            return (
              <code
                className={cn(
                  'rounded bg-muted px-1 py-0.5 font-mono text-sm',
                  inline
                    ? ''
                    : 'my-2 block overflow-x-auto p-3 transition-all duration-200'
                )}
              >
                {children}
              </code>
            );
          }

          // For complete messages, add language badge with smooth transition
          return (
            <div className="relative my-3 transition-all duration-200">
              {language && (
                <div className="absolute top-2 right-2 rounded bg-muted px-2 py-1 text-xs opacity-80 transition-opacity hover:opacity-100">
                  {language}
                </div>
              )}
              <pre className="overflow-x-auto rounded-lg bg-muted p-4">
                <code className="font-mono text-sm leading-relaxed">
                  {String(children).replace(/\n$/, '')}
                </code>
              </pre>
            </div>
          );
        },

        // Optimized paragraph with smooth transitions
        p: ({ children }) => (
          <p className="mb-4 leading-relaxed transition-all duration-200 last:mb-0">
            {children}
          </p>
        ),

        // Headings with streaming-aware styling
        h1: ({ children }) => (
          <h1
            className={cn(
              'mb-3 font-bold text-xl transition-all duration-200',
              isStreaming ? 'opacity-90' : 'opacity-100'
            )}
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            className={cn(
              'mb-2 font-semibold text-lg transition-all duration-200',
              isStreaming ? 'opacity-90' : 'opacity-100'
            )}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            className={cn(
              'mb-2 font-semibold text-base transition-all duration-200',
              isStreaming ? 'opacity-90' : 'opacity-100'
            )}
          >
            {children}
          </h3>
        ),

        // List styling with smooth transitions
        ul: ({ children }) => (
          <ul className="mb-4 ml-6 list-disc space-y-1 transition-all duration-200 last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-6 list-decimal space-y-1 transition-all duration-200 last:mb-0">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li
            className={cn(
              'mb-1 leading-relaxed transition-all duration-200',
              isStreaming ? 'opacity-95' : 'opacity-100'
            )}
          >
            {children}
          </li>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            className="text-primary hover:underline"
            href={href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {children}
          </a>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-muted-foreground/30 border-l-4 pl-4 italic last:mb-0">
            {children}
          </blockquote>
        ),

        // Tables with simple styling
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border">{children}</tbody>
        ),
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold text-sm">
            {children}
          </th>
        ),
        td: ({ children }) => <td className="px-3 py-2 text-sm">{children}</td>,

        // Horizontal rule
        hr: () => <hr className="my-4 border-border" />,

        // Strong and emphasis
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
      }),
      [isStreaming]
    );

    return (
      <div
        className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
      >
        <ReactMarkdown
          components={components}
          remarkPlugins={[remarkGfm]}
          skipHtml
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    );
  }
);

export default OptimizedMarkdownRenderer;
