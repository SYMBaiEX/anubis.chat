/**
 * AI Provider Configuration for Convex Backend
 * Simplified version of the provider registry for server-side use
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { gateway } from '@ai-sdk/gateway';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';

// =============================================================================
// Environment Configuration
// =============================================================================

const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// =============================================================================
// Provider Instances
// =============================================================================

// Initialize providers with environment variables
const openaiProvider = createOpenAI({
  apiKey: getEnvVar('OPENAI_API_KEY', 'dummy-key'), // Allow dummy key for dev
});

const anthropicProvider = createAnthropic({
  apiKey: getEnvVar('ANTHROPIC_API_KEY', 'dummy-key'),
});

const googleProvider = createGoogleGenerativeAI({
  apiKey: getEnvVar('GOOGLE_GENERATIVE_AI_API_KEY', 'dummy-key'),
});

const openRouterProvider = createOpenRouter({
  apiKey: getEnvVar('OPENROUTER_API_KEY', 'dummy-key'),
});

// Gateway provider configuration
const gatewayProvider = gateway;

// =============================================================================
// Model Resolution Function
// =============================================================================

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'openrouter' | 'gateway';
  modelId: string;
  fallbacks?: string[];
  providerOptions?: Record<string, unknown>;
}

// Model mapping configuration
const modelConfigs: Record<string, ModelConfig> = {
  // ===== GATEWAY MODELS (Preferred for cost optimization) =====
  'gateway/deepseek/deepseek-v3': {
    provider: 'gateway',
    modelId: 'deepseek/deepseek-chat',
    fallbacks: ['gpt-4o-mini', 'claude-3-5-haiku'],
  },
  'gateway/openai/gpt-5': {
    provider: 'gateway',
    modelId: 'openai/gpt-5',
    fallbacks: ['gpt-5', 'gpt-4o'],
  },
  'gateway/openai/gpt-5-mini': {
    provider: 'gateway',
    modelId: 'openai/gpt-5-mini',
    fallbacks: ['gpt-5-mini', 'gpt-4o'],
  },
  'gateway/openai/gpt-5-nano': {
    provider: 'gateway',
    modelId: 'openai/gpt-5-nano',
    fallbacks: ['gpt-5-nano', 'gpt-4o-mini'],
  },
  'gateway/openai/gpt-4o': {
    provider: 'gateway',
    modelId: 'openai/gpt-4o',
    fallbacks: ['gpt-4o', 'claude-3-5-sonnet'],
  },
  'gateway/openai/o4-mini': {
    provider: 'gateway',
    modelId: 'openai/o4-mini',
    fallbacks: ['o4-mini', 'gpt-4o-mini'],
  },
  'gateway/openai/gpt-4.1-mini': {
    provider: 'gateway',
    modelId: 'openai/gpt-4.1-mini',
    fallbacks: ['gpt-4.1-mini', 'gpt-4o-mini'],
  },
  'gateway/anthropic/claude-3-5-sonnet': {
    provider: 'gateway',
    modelId: 'anthropic/claude-3-5-sonnet-20241022',
    fallbacks: ['claude-3-5-sonnet', 'gpt-4o'],
  },
  'gateway/anthropic/claude-3-5-haiku': {
    provider: 'gateway',
    modelId: 'anthropic/claude-3-5-haiku-20241022',
    fallbacks: ['claude-3-5-haiku', 'gpt-4o-mini'],
  },
  'gateway/google/gemini-2.5-pro': {
    provider: 'gateway',
    modelId: 'google/gemini-2.5-pro',
    fallbacks: ['gemini-2.5-pro', 'gemini-2.0-flash'],
  },
  'gateway/google/gemini-2.5-flash': {
    provider: 'gateway',
    modelId: 'google/gemini-2.5-flash',
    fallbacks: ['gemini-2.5-flash', 'gemini-2.0-flash'],
  },
  'gateway/google/gemini-2.5-flash-lite': {
    provider: 'gateway',
    modelId: 'google/gemini-2.5-flash-lite',
    fallbacks: ['gemini-2.5-flash-lite', 'gemini-2.0-flash'],
  },
  'gateway/google/gemini-2-0-flash': {
    provider: 'gateway',
    modelId: 'google/gemini-2.0-flash-exp',
    fallbacks: ['gemini-2.0-flash', 'gpt-4o-mini'],
  },
  'gateway/meta/llama-3-3-70b': {
    provider: 'gateway',
    modelId: 'meta/llama-3.3-70b-instruct',
    fallbacks: ['gpt-4o-mini'],
  },
  
  // ===== DIRECT PROVIDER MODELS (Fallbacks) =====
  
  // OpenAI Direct Models
  'gpt-5': {
    provider: 'openai',
    modelId: 'gpt-5',
  },
  'gpt-5-mini': {
    provider: 'openai',
    modelId: 'gpt-5-mini',
  },
  'gpt-5-nano': {
    provider: 'openai',
    modelId: 'gpt-5-nano',
  },
  'gpt-4o': {
    provider: 'openai',
    modelId: 'gpt-4o',
  },
  'gpt-4o-mini': {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
  },
  'o4-mini': {
    provider: 'openai',
    modelId: 'o4-mini',
  },
  'gpt-4.1-mini': {
    provider: 'openai',
    modelId: 'gpt-4.1-mini',
  },
  
  // Anthropic Direct Models
  'claude-3-5-sonnet': {
    provider: 'anthropic',
    modelId: 'claude-3-5-sonnet-20241022',
  },
  'claude-3-5-haiku': {
    provider: 'anthropic',
    modelId: 'claude-3-5-haiku-20241022',
  },
  
  // Google Direct Models
  'gemini-2.5-pro': {
    provider: 'google',
    modelId: 'gemini-2.5-pro',
  },
  'gemini-2.5-flash': {
    provider: 'google',
    modelId: 'gemini-2.5-flash',
  },
  'gemini-2.5-flash-lite': {
    provider: 'google',
    modelId: 'gemini-2.5-flash-lite',
  },
  'gemini-2.0-flash': {
    provider: 'google',
    modelId: 'gemini-2.0-flash-exp',
  },
  
  // ===== FREE OPENROUTER MODELS =====
  'openrouter/openai/gpt-oss-20b:free': {
    provider: 'openrouter',
    modelId: 'openai/gpt-oss-20b:free',
  },
  'openrouter/z-ai/glm-4.5-air:free': {
    provider: 'openrouter',
    modelId: 'z-ai/glm-4.5-air:free',
  },
  'openrouter/qwen/qwen3-coder:free': {
    provider: 'openrouter',
    modelId: 'qwen/qwen3-coder:free',
  },
  'openrouter/moonshotai/kimi-k2:free': {
    provider: 'openrouter',
    modelId: 'moonshotai/kimi-k2:free',
  },
  
  // ===== PREMIUM OPENROUTER MODELS =====
  'openrouter/openai/gpt-oss-120b': {
    provider: 'openrouter',
    modelId: 'openai/gpt-oss-120b',
    fallbacks: ['gpt-4o'],
  },
};

// =============================================================================
// Model Instance Factory
// =============================================================================

export function getModel(modelId: string, options?: {
  fallbackEnabled?: boolean;
  providerOptions?: Record<string, unknown>;
}): LanguageModel {
  const config = modelConfigs[modelId];
  
  if (!config) {
    // If model not found in config, try to infer provider from ID
    const inferredConfig = inferModelConfig(modelId);
    if (inferredConfig) {
      return createModelInstance(inferredConfig, options?.providerOptions);
    }
    throw new Error(`Model ${modelId} not found in configuration`);
  }

  try {
    return createModelInstance(config, options?.providerOptions);
  } catch (error) {
    // Try fallbacks if enabled
    if (options?.fallbackEnabled && config.fallbacks?.length) {
      console.warn(`Failed to create ${modelId}, trying fallbacks:`, error);
      for (const fallbackId of config.fallbacks) {
        try {
          return getModel(fallbackId, { ...options, fallbackEnabled: false });
        } catch (fallbackError) {
          console.warn(`Fallback ${fallbackId} also failed:`, fallbackError);
        }
      }
    }
    throw error;
  }
}

function inferModelConfig(modelId: string): ModelConfig | null {
  // Gateway models
  if (modelId.startsWith('gateway/')) {
    const parts = modelId.split('/');
    if (parts.length >= 3) {
      return {
        provider: 'gateway',
        modelId: parts.slice(1).join('/'),
      };
    }
  }
  
  // OpenAI models
  if (modelId.startsWith('gpt-') || modelId.startsWith('o1-') || modelId.startsWith('o4-')) {
    return {
      provider: 'openai',
      modelId,
    };
  }
  
  // Anthropic models
  if (modelId.startsWith('claude-')) {
    return {
      provider: 'anthropic',
      modelId,
    };
  }
  
  // Google models
  if (modelId.startsWith('gemini-')) {
    return {
      provider: 'google',
      modelId,
    };
  }
  
  // OpenRouter models
  if (modelId.startsWith('openrouter/')) {
    return {
      provider: 'openrouter',
      modelId: modelId.replace('openrouter/', ''),
    };
  }
  
  return null;
}

function createModelInstance(config: ModelConfig, providerOptions?: Record<string, unknown>): LanguageModel {
  const options = { ...config.providerOptions, ...providerOptions };
  
  switch (config.provider) {
    case 'gateway':
      return gatewayProvider(config.modelId);
      
    case 'openai':
      return openaiProvider(config.modelId);
      
    case 'anthropic':
      return anthropicProvider(config.modelId);
      
    case 'google':
      return googleProvider(config.modelId);
      
    case 'openrouter':
      return openRouterProvider(config.modelId);
      
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

export function getAvailableModels(): string[] {
  return Object.keys(modelConfigs);
}

export function getDefaultModel(): string {
  return 'gateway/deepseek/deepseek-v3'; // Default to cost-effective gateway model
}

export function isGatewayModel(modelId: string): boolean {
  return modelId.startsWith('gateway/') || modelConfigs[modelId]?.provider === 'gateway';
}

// =============================================================================
// Legacy Compatibility
// =============================================================================

// For backward compatibility with existing streaming.ts
export const createModelProvider = (modelId: string) => {
  return getModel(modelId, { fallbackEnabled: true });
};
