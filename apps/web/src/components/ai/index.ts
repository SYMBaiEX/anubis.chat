// AI SDK Components
export { AIChatInterface } from './ai-chat-interface';
export { AIMessage } from './ai-message';
export { AIProvider, useAIConfig } from './ai-provider';
export { AISuggestions } from './ai-suggestions';
export { AIStreamingIndicator } from '../chat/ai-streaming-indicator';
export { Composer } from './composer';
export { Thread } from './thread';

// Re-export types
export type { AIMessage as AIMessageType } from '@/hooks/use-ai-chat';