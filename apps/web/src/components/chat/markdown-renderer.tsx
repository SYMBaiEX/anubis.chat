'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from './code-block';
import type { BaseComponentProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps extends BaseComponentProps {
  content: string;
  enableCodeBlocks?: boolean;
  enableTables?: boolean;
}

/**
 * MarkdownRenderer component - Renders markdown content with syntax highlighting
 * Provides rich text rendering for AI responses
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  enableCodeBlocks = true,
  enableTables = true,
  className,
  children,
}: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        components={{
          // Code blocks with syntax highlighting
          code: ({ node, inline, className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const language = match ? match[1] : '';

            if (!inline && enableCodeBlocks) {
              return (
                <CodeBlock
                  code={String(children).replace(/\n$/, '')}
                  language={language}
                />
              );
            }

            return (
              <code
                className={cn(
                  "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
                  codeClassName
                )}
                {...props}
              >
                {children}
              </code>
            );
          },

          // Custom paragraph styling
          p: ({ children }) => (
            <p className="mb-4 leading-7 last:mb-0">{children}</p>
          ),

          // Custom heading styling
          h1: ({ children }) => (
            <h1 className="mb-4 font-bold text-2xl tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 font-semibold text-xl tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 font-semibold text-lg tracking-tight">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 font-semibold text-base">{children}</h4>
          ),

          // Custom list styling
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-6">{children}</li>
          ),

          // Custom blockquote styling
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-muted-foreground/25 pl-4 italic">
              {children}
            </blockquote>
          ),

          // Custom link styling
          a: ({ href, children }) => (
            <a
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
              href={href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {children}
            </a>
          ),

          // Custom table styling (if enabled)
          ...(enableTables && {
            table: ({ children }) => (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full border-collapse border border-muted">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-muted/50">{children}</thead>
            ),
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => (
              <tr className="border-b border-muted">{children}</tr>
            ),
            th: ({ children }) => (
              <th className="border-r border-muted p-2 text-left font-semibold last:border-r-0">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-r border-muted p-2 last:border-r-0">{children}</td>
            ),
          }),

          // Custom horizontal rule styling
          hr: () => <hr className="my-6 border-muted" />,

          // Custom strong/bold styling
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),

          // Custom emphasis/italic styling
          em: ({ children }) => <em className="italic">{children}</em>,

          // Custom image styling
          img: ({ src, alt }) => (
            <img
              alt={alt ?? 'Image'}
              className="max-w-full rounded-lg border border-muted"
              loading="lazy"
              src={src}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      
      {children}
    </div>
  );
});

export default MarkdownRenderer;