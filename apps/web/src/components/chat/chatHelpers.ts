/**
 * Helper functions for ChatInterface component
 * Extracted to reduce component complexity
 */

import type { ChatSettings } from './types';

/**
 * Apply user preferences to chat settings
 */
export function applyUserPreferencesToSettings(
  currentSettings: ChatSettings,
  userPreferences: any
): ChatSettings {
  if (!userPreferences) {
    return currentSettings;
  }

  const prefsBase = userPreferences as unknown;
  let defaults: Partial<{
    defaultModel: string;
    defaultTemperature: number;
    defaultMaxTokens: number;
    defaultTopP: number;
    defaultFrequencyPenalty: number;
    defaultPresencePenalty: number;
  }> = {};

  if (typeof prefsBase === 'object' && prefsBase !== null) {
    defaults = prefsBase as typeof defaults;
  }

  return {
    ...currentSettings,
    // Apply user preferences to interface and behavior settings
    theme: userPreferences.theme || currentSettings.theme,
    language: userPreferences.language || currentSettings.language,
    fontSize: userPreferences.fontSize || currentSettings.fontSize,
    soundEnabled: userPreferences.soundEnabled ?? currentSettings.soundEnabled,
    autoScroll: userPreferences.autoScroll ?? currentSettings.autoScroll,
    streamResponses:
      userPreferences.streamResponses ?? currentSettings.streamResponses,
    enableMemory: userPreferences.enableMemory ?? currentSettings.enableMemory,
    autoCreateTitles:
      userPreferences.autoCreateTitles ?? currentSettings.autoCreateTitles,
    responseFormat:
      userPreferences.responseFormat || currentSettings.responseFormat,
    contextWindow:
      userPreferences.contextWindow || currentSettings.contextWindow,
    saveHistory: userPreferences.saveHistory ?? currentSettings.saveHistory,
    // Apply model defaults for new chats (when provided by preferences)
    model: defaults.defaultModel ?? currentSettings.model,
    temperature: defaults.defaultTemperature ?? currentSettings.temperature,
    maxTokens: defaults.defaultMaxTokens ?? currentSettings.maxTokens,
    topP: defaults.defaultTopP ?? currentSettings.topP,
    frequencyPenalty:
      defaults.defaultFrequencyPenalty ?? currentSettings.frequencyPenalty,
    presencePenalty:
      defaults.defaultPresencePenalty ?? currentSettings.presencePenalty,
  };
}

/**
 * Find message index by ID
 */
export function findMessageIndex(messages: any[], messageId: string): number {
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i] as unknown;

    // Check if it's a streaming message
    if (
      typeof m === 'object' &&
      m !== null &&
      'isStreaming' in m &&
      (m as any).isStreaming
    ) {
      if ((m as any).id === messageId) {
        return i;
      }
      continue;
    }

    // Check if it's a regular message
    if (
      typeof m === 'object' &&
      m !== null &&
      '_id' in m &&
      String((m as { _id: unknown })._id) === messageId
    ) {
      return i;
    }
  }
  return -1;
}

/**
 * Find the previous user message from a given message index
 */
export function findPreviousUserMessage(
  messages: any[],
  fromIndex: number
): string | null {
  for (let i = fromIndex - 1; i >= 0; i--) {
    const candidate = messages[i] as unknown;
    if (
      typeof candidate === 'object' &&
      candidate !== null &&
      'role' in candidate &&
      (candidate as { role: string }).role === 'user' &&
      'content' in candidate &&
      typeof (candidate as { content: unknown }).content === 'string'
    ) {
      return (candidate as { content: string }).content;
    }
  }
  return null;
}

/**
 * Get chat settings updates object
 */
export function getChatSettingsUpdates(
  newSettings: ChatSettings,
  currentSettings: ChatSettings
): Partial<{
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}> {
  const updates: {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  } = {};

  if (newSettings.model !== currentSettings.model) {
    updates.model = newSettings.model;
  }
  if (newSettings.systemPrompt !== currentSettings.systemPrompt) {
    updates.systemPrompt = newSettings.systemPrompt;
  }
  if (newSettings.temperature !== currentSettings.temperature) {
    updates.temperature = newSettings.temperature;
  }
  if (newSettings.maxTokens !== currentSettings.maxTokens) {
    updates.maxTokens = newSettings.maxTokens;
  }

  return updates;
}

/**
 * Convert attachment format for message sending
 */
export function convertAttachmentsFormat(
  attachments?: Array<{
    id: string;
    url?: string;
    type: string;
    size: number;
  }>
):
  | Array<{
      fileId: string;
      url?: string;
      mimeType: string;
      size: number;
      type: 'image' | 'file' | 'video';
    }>
  | undefined {
  if (!attachments) {
    return;
  }

  return attachments.map((att) => ({
    fileId: att.id,
    url: att.url,
    mimeType: att.type,
    size: att.size,
    type: getAttachmentType(att.type),
  }));
}

/**
 * Get attachment type from MIME type
 */
function getAttachmentType(mimeType: string): 'image' | 'file' | 'video' {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  return 'file';
}

/**
 * Get placeholder text for message input
 */
export function getInputPlaceholder(
  isInitialized: boolean,
  canSendMessage: boolean,
  isStreaming: boolean,
  messagesRemaining?: number
): string {
  if (!isInitialized) {
    return 'Initializing agent system...';
  }

  if (!canSendMessage) {
    return 'Message limit reached - Upgrade to continue';
  }

  if (isStreaming) {
    return 'Anubis is responding...';
  }

  const baseText = 'Ask Anubis anything...';
  if (messagesRemaining) {
    return `${baseText} (${messagesRemaining} messages remaining)`;
  }

  return baseText;
}
