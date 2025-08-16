'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { OptimizedMarkdownRenderer } from './optimized-markdown-renderer';

interface StreamingTextRendererProps {
  content: string;
  isStreaming: boolean;
  className?: string;
}

/**
 * StreamingTextRenderer - Provides smooth streaming text experience
 * Gradually reveals content while maintaining markdown formatting stability
 */
export const StreamingTextRenderer = memo(function StreamingTextRenderer({
  content,
  isStreaming,
  className,
}: StreamingTextRendererProps) {
  const [displayContent, setDisplayContent] = useState('');
  const [showFinalFormatting, setShowFinalFormatting] = useState(false);

  // Detect if content has complex markdown that might cause layout shifts
  const hasComplexMarkdown = useMemo(() => {
    return /```[\s\S]*?```|#{1,6}\s|^\s*[-*+]\s|\[.*?\]\(.*?\)/gm.test(content);
  }, [content]);

  // Streaming effect with intelligent content revelation
  useEffect(() => {
    if (!isStreaming) {
      // When streaming completes, show final content immediately
      setDisplayContent(content);
      setShowFinalFormatting(true);
      return;
    }

    if (!content) {
      setDisplayContent('');
      setShowFinalFormatting(false);
      return;
    }

    // Reset final formatting when new streaming starts
    setShowFinalFormatting(false);

    // For complex markdown, be more conservative with streaming
    // to avoid layout shifts
    if (hasComplexMarkdown) {
      // Show content in larger chunks for markdown stability
      const targetLength = content.length;
      const currentLength = displayContent.length;

      if (currentLength < targetLength) {
        const chunkSize = Math.max(
          10,
          Math.ceil((targetLength - currentLength) / 20)
        );
        const nextLength = Math.min(currentLength + chunkSize, targetLength);

        setTimeout(() => {
          setDisplayContent(content.slice(0, nextLength));
        }, 50);
      }
    } else {
      // For plain text or simple markdown, use smooth character-by-character
      const currentIndex = displayContent.length;
      const targetLength = content.length;

      if (currentIndex < targetLength) {
        const charsPerFrame = Math.max(
          1,
          Math.ceil((targetLength - currentIndex) / 30)
        );

        const timer = setTimeout(() => {
          const nextIndex = Math.min(
            currentIndex + charsPerFrame,
            targetLength
          );
          setDisplayContent(content.slice(0, nextIndex));
        }, 16); // ~60fps

        return () => clearTimeout(timer);
      }
    }
  }, [content, displayContent.length, isStreaming, hasComplexMarkdown]);

  return (
    <div className={className}>
      <OptimizedMarkdownRenderer
        content={displayContent}
        isStreaming={isStreaming && !showFinalFormatting}
      />
    </div>
  );
});

export default StreamingTextRenderer;
