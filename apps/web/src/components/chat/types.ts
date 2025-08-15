/**
 * Type definitions for chat components
 */

export interface ChatSettings {
  // Model Settings
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;

  // Behavior Settings
  systemPrompt: string;
  agentPrompt?: string; // Read-only agent prompt for display
  streamResponses: boolean;
  enableMemory: boolean;
  autoCreateTitles: boolean;

  // Interface Settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  soundEnabled: boolean;
  autoScroll: boolean;

  // Advanced Settings
  saveHistory: boolean;
  contextWindow: number;
  responseFormat: 'text' | 'markdown' | 'json';
}

export interface ChatInterfaceProps {
  className?: string;
}
