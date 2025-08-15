import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

/**
 * Loading component for lazy-loaded components
 */
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

/**
 * Lazy-loaded chat components
 */
export const LazyVirtualMessageList = dynamic(
  () =>
    import('@/components/chat/virtual-message-list').then(
      (mod) => mod.VirtualMessageList
    ),
  {
    loading: LoadingFallback,
    ssr: false,
  }
);

export const LazyEnhancedMessageInput = dynamic(
  () =>
    import('@/components/chat/enhanced-message-input').then(
      (mod) => mod.EnhancedMessageInput
    ),
  {
    loading: LoadingFallback,
  }
);

export const LazyEnhancedMessageBubble = dynamic(
  () =>
    import('@/components/chat/enhanced-message-bubble').then(
      (mod) => mod.EnhancedMessageBubble
    ),
  {
    loading: LoadingFallback,
  }
);

/**
 * Utility function to preload components
 */
export const preloadComponent = (componentName: keyof typeof componentMap) => {
  const component = componentMap[componentName];
  if (
    component &&
    'preload' in component &&
    typeof component.preload === 'function'
  ) {
    component.preload();
  }
};

const componentMap = {
  virtualMessageList: LazyVirtualMessageList,
  enhancedMessageInput: LazyEnhancedMessageInput,
  enhancedMessageBubble: LazyEnhancedMessageBubble,
} as const;
