/**
 * AI Provider Configuration & Registry
 * Centralized system for managing AI providers and models with Vercel AI Gateway support
 */

import { gateway } from '@ai-sdk/gateway';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

// =============================================================================
// Provider Types & Configuration
// =============================================================================

export type ProviderType = 'openai' | 'google' | 'openrouter' | 'gateway';

export interface ProviderConfig {
  id: ProviderType;
  name: string;
  description: string;
  baseUrl?: string;
  apiKey?: string;
  enabled: boolean;
  priority: number; // Higher = preferred for fallback
  rateLimits?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  };
  headers?: Record<string, string>;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderType;
  description: string;
  contextWindow: number;
  maxOutput?: number;
  pricing: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
  capabilities: string[];
  speed: 'fast' | 'medium' | 'slow';
  intelligence: 'basic' | 'advanced' | 'expert' | 'frontier';
  released?: string;
  default?: boolean;
  // Gateway-specific configuration
  gatewayModelId?: string; // The actual model ID to use with the gateway
  fallbackModels?: string[]; // Fallback models if this one fails
  // Provider-specific options
  providerOptions?: Record<string, unknown>;
}

// =============================================================================
// Provider Registry & Factory
// =============================================================================

export class AIProviderRegistry {
  private providers = new Map<ProviderType, ProviderConfig>();
  private models = new Map<string, ModelConfig>();
  private modelInstances = new Map<string, LanguageModel>();

  constructor() {
    this.initializeProviders();
    this.initializeModels();
  }

  // Initialize default provider configurations
  private initializeProviders(): void {
    const providers: ProviderConfig[] = [
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT models including GPT-4, GPT-5, and o-series',
        enabled: true,
        priority: 100,
        rateLimits: {
          requestsPerMinute: 500,
          tokensPerMinute: 200_000,
        },
      },
      {
        id: 'google',
        name: 'Google',
        description: 'Gemini models with long context and multimodal capabilities',
        enabled: true,
        priority: 80,
        rateLimits: {
          requestsPerMinute: 200,
          tokensPerMinute: 100_000,
        },
      },
      {
        id: 'gateway',
        name: 'Vercel AI Gateway',
        description: 'Access to multiple providers through Vercel AI Gateway',
        enabled: true,
        priority: 110, // Highest priority for cost optimization and failover
        rateLimits: {
          requestsPerMinute: 1000,
          tokensPerMinute: 500_000,
        },
      },
      {
        id: 'openrouter',
        name: 'OpenRouter',
        description: 'Access to diverse models through OpenRouter API',
        enabled: true,
        priority: 70,
        rateLimits: {
          requestsPerMinute: 100,
          tokensPerMinute: 50_000,
        },
      },
    ];

    providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  // Initialize model configurations with gateway support
  private initializeModels(): void {
    const models: ModelConfig[] = [
      // ===== GATEWAY MODELS (Preferred for cost optimization) =====
      {
        id: 'gateway/deepseek/deepseek-v3',
        name: 'DeepSeek V3 (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'deepseek/deepseek-chat',
        description: 'DeepSeek V3 via Vercel AI Gateway - excellent for coding',
        contextWindow: 128_000,
        maxOutput: 8192,
        pricing: { input: 0.27, output: 1.1 },
        capabilities: ['coding', 'reasoning', 'math', 'tools'],
        speed: 'fast',
        intelligence: 'expert',
        default: true, // Set as default for cost-effectiveness
        fallbackModels: ['gpt-4o-mini', 'claude-3-5-haiku'],
      },
      {
        id: 'gateway/openai/gpt-5',
        name: 'GPT-5 (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'openai/gpt-5',
        description: 'Latest flagship model via Gateway with unified reasoning and generation',
        contextWindow: 128_000,
        maxOutput: 16_384,
        pricing: { input: 30, output: 120 },
        capabilities: ['coding', 'reasoning', 'creative', 'analysis', 'vision', 'tools'],
        speed: 'medium',
        intelligence: 'frontier',
        fallbackModels: ['gpt-5', 'gpt-4o'],
      },
      {
        id: 'gateway/openai/gpt-5-mini',
        name: 'GPT-5 Mini (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'openai/gpt-5-mini',
        description: 'Smaller, faster version of GPT-5 via Gateway',
        contextWindow: 128_000,
        maxOutput: 8192,
        pricing: { input: 5, output: 20 },
        capabilities: ['coding', 'reasoning', 'creative', 'analysis', 'general', 'tools'],
        speed: 'fast',
        intelligence: 'expert',
        fallbackModels: ['gpt-5-mini', 'gpt-4o'],
      },
      {
        id: 'gateway/openai/gpt-5-nano',
        name: 'GPT-5 Nano (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'openai/gpt-5-nano',
        description: 'Ultra-efficient nano model with GPT-5 intelligence via Gateway',
        contextWindow: 128_000,
        maxOutput: 4096,
        pricing: { input: 0.5, output: 1.5 },
        capabilities: ['general', 'coding', 'reasoning', 'analysis'],
        speed: 'fast',
        intelligence: 'advanced',
        fallbackModels: ['gpt-5-nano', 'gpt-4o-mini'],
      },
      {
        id: 'gateway/openai/gpt-4o',
        name: 'GPT-4o (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'openai/gpt-4o',
        description: 'GPT-4o via Vercel AI Gateway with automatic failover',
        contextWindow: 128_000,
        maxOutput: 4096,
        pricing: { input: 5, output: 15 },
        capabilities: ['general', 'coding', 'reasoning', 'vision', 'tools'],
        speed: 'fast',
        intelligence: 'expert',
        fallbackModels: ['gpt-4o', 'claude-3-5-sonnet'],
      },
      {
        id: 'gateway/openai/o4-mini',
        name: 'OpenAI o4-mini (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'openai/o4-mini',
        description: 'Fast, cost-efficient reasoning model via Gateway',
        contextWindow: 128_000,
        maxOutput: 16_384,
        pricing: { input: 3, output: 12 },
        capabilities: ['reasoning', 'coding', 'math'],
        speed: 'fast',
        intelligence: 'expert',
        fallbackModels: ['o4-mini', 'gpt-4o-mini'],
      },
      {
        id: 'gateway/openai/gpt-4.1-mini',
        name: 'GPT-4.1 Mini (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'openai/gpt-4.1-mini',
        description: 'Compact and efficient model with enhanced reasoning via Gateway',
        contextWindow: 128_000,
        maxOutput: 4096,
        pricing: { input: 0.4, output: 1.6 },
        capabilities: ['coding', 'analysis', 'reasoning'],
        speed: 'fast',
        intelligence: 'advanced',
        fallbackModels: ['gpt-4.1-mini', 'gpt-4o-mini'],
      },
      {
        id: 'gateway/anthropic/claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'anthropic/claude-3-5-sonnet-20241022',
        description: 'Claude 3.5 Sonnet via Vercel AI Gateway',
        contextWindow: 200_000,
        maxOutput: 8192,
        pricing: { input: 3, output: 15 },
        capabilities: ['coding', 'reasoning', 'analysis', 'tools'],
        speed: 'fast',
        intelligence: 'expert',
        fallbackModels: ['claude-3-5-sonnet', 'gpt-4o'],
      },
      {
        id: 'gateway/anthropic/claude-3-5-haiku',
        name: 'Claude 3.5 Haiku (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'anthropic/claude-3-5-haiku-20241022',
        description: 'Fastest Claude model via Gateway for simple tasks',
        contextWindow: 200_000,
        maxOutput: 4096,
        pricing: { input: 0.25, output: 1.25 },
        capabilities: ['general', 'quick-tasks'],
        speed: 'fast',
        intelligence: 'basic',
        fallbackModels: ['claude-3-5-haiku', 'gpt-4o-mini'],
      },
      {
        id: 'gateway/google/gemini-2.5-pro',
        name: 'Gemini 2.5 Pro (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'google/gemini-2.5-pro',
        description: 'Most intelligent model with thinking capabilities via Gateway',
        contextWindow: 1_000_000,
        maxOutput: 8192,
        pricing: { input: 7, output: 21 },
        capabilities: ['thinking', 'reasoning', 'analysis', 'multimodal'],
        speed: 'slow',
        intelligence: 'frontier',
        fallbackModels: ['gemini-2.5-pro', 'gemini-2.0-flash'],
      },
      {
        id: 'gateway/google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'google/gemini-2.5-flash',
        description: 'Fast thinking model with excellent performance via Gateway',
        contextWindow: 1_000_000,
        maxOutput: 8192,
        pricing: { input: 0.3, output: 1.2 },
        capabilities: ['thinking', 'reasoning', 'multimodal'],
        speed: 'fast',
        intelligence: 'expert',
        fallbackModels: ['gemini-2.5-flash', 'gemini-2.0-flash'],
      },
      {
        id: 'gateway/google/gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash-Lite (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'google/gemini-2.5-flash-lite',
        description: 'Fastest and lowest cost Gemini model via Gateway',
        contextWindow: 1_000_000,
        maxOutput: 8192,
        pricing: { input: 0.1, output: 0.4 },
        capabilities: ['general', 'quick-tasks'],
        speed: 'fast',
        intelligence: 'advanced',
        fallbackModels: ['gemini-2.5-flash-lite', 'gemini-2.0-flash'],
      },
      {
        id: 'gateway/google/gemini-2-0-flash',
        name: 'Gemini 2.0 Flash (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'google/gemini-2.0-flash-exp',
        description: 'Superior speed with native tool use via Gateway',
        contextWindow: 1_000_000,
        maxOutput: 8192,
        pricing: { input: 0.15, output: 0.6 },
        capabilities: ['tools', 'multimodal', 'general'],
        speed: 'fast',
        intelligence: 'advanced',
        fallbackModels: ['gemini-2.0-flash', 'gpt-4o-mini'],
      },
      {
        id: 'gateway/meta/llama-3-3-70b',
        name: 'Llama 3.3 70B (Gateway)',
        provider: 'gateway',
        gatewayModelId: 'meta/llama-3.3-70b-instruct',
        description: 'Meta Llama 3.3 70B via Vercel AI Gateway',
        contextWindow: 128_000,
        maxOutput: 8192,
        pricing: { input: 0.27, output: 1.1 },
        capabilities: ['general', 'coding', 'reasoning'],
        speed: 'medium',
        intelligence: 'advanced',
        fallbackModels: ['gpt-4o-mini'],
      },

      // ===== DIRECT PROVIDER MODELS (Fallbacks) =====
      
      // OpenAI Direct Models
      {
        id: 'gpt-5',
        name: 'GPT-5',
        provider: 'openai',
        description: 'Latest flagship model with unified reasoning and generation capabilities',
        contextWindow: 128_000,
        maxOutput: 16_384,
        pricing: { input: 30, output: 120 },
        capabilities: ['coding', 'reasoning', 'creative', 'analysis', 'vision', 'tools'],
        speed: 'medium',
        intelligence: 'frontier',
        released: 'August 2025',
      },
      {
        id: 'gpt-5-mini',
        name: 'GPT-5 Mini',
        provider: 'openai',
        description: 'Smaller, faster version of GPT-5 with excellent cost-performance ratio',
        contextWindow: 128_000,
        maxOutput: 8192,
        pricing: { input: 5, output: 20 },
        capabilities: ['coding', 'reasoning', 'creative', 'analysis', 'general', 'tools'],
        speed: 'fast',
        intelligence: 'expert',
        released: 'August 2025',
      },
      {
        id: 'gpt-5-nano',
        name: 'GPT-5 Nano',
        provider: 'openai',
        description: 'Ultra-efficient nano model with GPT-5 intelligence',
        contextWindow: 128_000,
        maxOutput: 4096,
        pricing: { input: 0.5, output: 1.5 },
        capabilities: ['general', 'coding', 'reasoning', 'analysis'],
        speed: 'fast',
        intelligence: 'advanced',
        released: 'January 2025',
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        description: 'GPT-4o directly from OpenAI',
        contextWindow: 128_000,
        maxOutput: 4096,
        pricing: { input: 5, output: 15 },
        capabilities: ['general', 'coding', 'reasoning', 'vision', 'tools'],
        speed: 'fast',
        intelligence: 'expert',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        description: 'GPT-4o Mini directly from OpenAI',
        contextWindow: 128_000,
        maxOutput: 4096,
        pricing: { input: 0.15, output: 0.6 },
        capabilities: ['general', 'coding', 'reasoning', 'tools'],
        speed: 'fast',
        intelligence: 'advanced',
      },
      {
        id: 'o4-mini',
        name: 'OpenAI o4-mini',
        provider: 'openai',
        description: 'Fast, cost-efficient reasoning model',
        contextWindow: 128_000,
        maxOutput: 16_384,
        pricing: { input: 3, output: 12 },
        capabilities: ['reasoning', 'coding', 'math'],
        speed: 'fast',
        intelligence: 'expert',
        released: '2025',
      },
      {
        id: 'gpt-4.1-mini',
        name: 'GPT-4.1 Mini',
        provider: 'openai',
        description: 'Compact and efficient model with enhanced reasoning',
        contextWindow: 128_000,
        maxOutput: 4096,
        pricing: { input: 0.4, output: 1.6 },
        capabilities: ['coding', 'analysis', 'reasoning'],
        speed: 'fast',
        intelligence: 'advanced',
        released: '2025',
      },



      // Google Direct Models
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'google',
        description: 'Most intelligent model with thinking capabilities',
        contextWindow: 1_000_000,
        maxOutput: 8192,
        pricing: { input: 7, output: 21 },
        capabilities: ['thinking', 'reasoning', 'analysis', 'multimodal'],
        speed: 'slow',
        intelligence: 'frontier',
        released: 'March 2025',
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google',
        description: 'Fast thinking model with excellent performance',
        contextWindow: 1_000_000,
        maxOutput: 8192,
        pricing: { input: 0.3, output: 1.2 },
        capabilities: ['thinking', 'reasoning', 'multimodal'],
        speed: 'fast',
        intelligence: 'expert',
        released: '2025',
      },
      {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash-Lite',
        provider: 'google',
        description: 'Fastest and lowest cost Gemini model',
        contextWindow: 1_000_000,
        maxOutput: 8192,
        pricing: { input: 0.1, output: 0.4 },
        capabilities: ['general', 'quick-tasks'],
        speed: 'fast',
        intelligence: 'advanced',
        released: '2025',
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        description: 'Superior speed with native tool use',
        contextWindow: 1_000_000,
        maxOutput: 8192,
        pricing: { input: 0.15, output: 0.6 },
        capabilities: ['tools', 'multimodal', 'general'],
        speed: 'fast',
        intelligence: 'advanced',
      },

      // ===== FREE OPENROUTER MODELS =====
      {
        id: 'openrouter/openai/gpt-oss-20b:free',
        name: 'GPT-OSS-20B (Free) – OpenRouter',
        provider: 'openrouter',
        description: 'OpenAI GPT-OSS-20B open-weight, free tier via OpenRouter',
        contextWindow: 128_000,
        maxOutput: 4096,
        pricing: { input: 0, output: 0 },
        capabilities: ['coding', 'reasoning', 'general'],
        speed: 'fast',
        intelligence: 'advanced',
      },
      {
        id: 'openrouter/z-ai/glm-4.5-air:free',
        name: 'GLM-4.5-Air (Free) – OpenRouter',
        provider: 'openrouter',
        description: 'Zhipu AI GLM-4.5-Air free tier via OpenRouter',
        contextWindow: 128_000,
        maxOutput: 8192,
        pricing: { input: 0, output: 0 },
        capabilities: ['reasoning', 'coding', 'tools'],
        speed: 'fast',
        intelligence: 'advanced',
      },
      {
        id: 'openrouter/qwen/qwen3-coder:free',
        name: 'Qwen3-Coder (Free) – OpenRouter',
        provider: 'openrouter',
        description: 'Qwen3-Coder free tier via OpenRouter, optimized for coding',
        contextWindow: 128_000,
        maxOutput: 8192,
        pricing: { input: 0, output: 0 },
        capabilities: ['coding', 'analysis'],
        speed: 'fast',
        intelligence: 'advanced',
      },
      {
        id: 'openrouter/moonshotai/kimi-k2:free',
        name: 'Kimi K2 (Free) – OpenRouter',
        provider: 'openrouter',
        description: 'Moonshot AI Kimi K2 free tier via OpenRouter',
        contextWindow: 128_000,
        maxOutput: 8192,
        pricing: { input: 0, output: 0 },
        capabilities: ['agentic', 'coding', 'reasoning'],
        speed: 'medium',
        intelligence: 'advanced',
      },

      // ===== PREMIUM OPENROUTER MODELS =====
      {
        id: 'openrouter/openai/gpt-oss-120b',
        name: 'GPT-OSS-120B (Cerebras) – OpenRouter',
        provider: 'openrouter',
        description: 'OpenAI GPT-OSS-120B via OpenRouter using Cerebras provider for high-throughput reasoning',
        contextWindow: 32_768,
        maxOutput: 8192,
        pricing: { input: 0.073, output: 0.29 },
        capabilities: ['reasoning', 'coding', 'analysis', 'tools'],
        speed: 'medium',
        intelligence: 'frontier',
        released: 'August 2025',
      },
    ];

    models.forEach(model => {
      this.models.set(model.id, model);
    });
  }

  // Get model instance with intelligent provider selection
  getModel(modelId: string, options?: {
    fallbackEnabled?: boolean;
    providerOptions?: Record<string, unknown>;
  }): LanguageModel {
    // Check cache first
    const cacheKey = `${modelId}-${JSON.stringify(options?.providerOptions || {})}`;
    if (this.modelInstances.has(cacheKey)) {
      return this.modelInstances.get(cacheKey)!;
    }

    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found in registry`);
    }

    const provider = this.providers.get(model.provider);
    if (!provider || !provider.enabled) {
      throw new Error(`Provider ${model.provider} not available for model ${modelId}`);
    }

    let modelInstance: LanguageModel;

    // Create model instance based on provider
    try {
      modelInstance = this.createModelInstance(model, options?.providerOptions);
      this.modelInstances.set(cacheKey, modelInstance);
      return modelInstance;
    } catch (error) {
      // If fallback is enabled and we have fallback models, try those
      if (options?.fallbackEnabled && model.fallbackModels?.length) {
        console.warn(`Failed to create ${modelId}, trying fallback models:`, error);
        for (const fallbackModelId of model.fallbackModels) {
          try {
            return this.getModel(fallbackModelId, { ...options, fallbackEnabled: false });
          } catch (fallbackError) {
            console.warn(`Fallback model ${fallbackModelId} also failed:`, fallbackError);
          }
        }
      }
      throw error;
    }
  }

  private createModelInstance(model: ModelConfig, providerOptions?: Record<string, unknown>): LanguageModel {
    switch (model.provider) {
      case 'gateway':
        if (!model.gatewayModelId) {
          throw new Error(`Gateway model ${model.id} missing gatewayModelId`);
        }
        return gateway(model.gatewayModelId);

      case 'openai':
        return openai(model.id.replace(/^openai\//, ''));

      case 'google':
        return google(model.id.replace(/^google\//, ''));

      case 'openrouter':
        // For now, fallback to direct provider
        // TODO: Implement OpenRouter provider
        throw new Error('OpenRouter provider not yet implemented in registry');

      default:
        throw new Error(`Unknown provider: ${model.provider}`);
    }
  }

  // Get all models, optionally filtered
  getModels(filter?: {
    provider?: ProviderType;
    intelligence?: ModelConfig['intelligence'];
    capabilities?: string[];
    includeDisabled?: boolean;
  }): ModelConfig[] {
    let models = Array.from(this.models.values());

    if (filter) {
      if (filter.provider) {
        models = models.filter(m => m.provider === filter.provider);
      }
      if (filter.intelligence) {
        models = models.filter(m => m.intelligence === filter.intelligence);
      }
      if (filter.capabilities) {
        models = models.filter(m => 
          filter.capabilities!.every(cap => m.capabilities.includes(cap))
        );
      }
      if (!filter.includeDisabled) {
        models = models.filter(m => {
          const provider = this.providers.get(m.provider);
          return provider?.enabled !== false;
        });
      }
    }

    return models.sort((a, b) => {
      // Sort by provider priority, then by intelligence, then by name
      const providerA = this.providers.get(a.provider);
      const providerB = this.providers.get(b.provider);
      const priorityDiff = (providerB?.priority || 0) - (providerA?.priority || 0);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      const intelligenceOrder = { frontier: 4, expert: 3, advanced: 2, basic: 1 };
      const intelligenceDiff = intelligenceOrder[b.intelligence] - intelligenceOrder[a.intelligence];
      
      if (intelligenceDiff !== 0) return intelligenceDiff;
      
      return a.name.localeCompare(b.name);
    });
  }

  // Get default model
  getDefaultModel(): ModelConfig {
    const defaultModel = Array.from(this.models.values()).find(m => m.default);
    return defaultModel || this.getModels()[0];
  }

  // Get models available for a subscription tier
  getModelsForTier(tier: 'free' | 'pro' | 'pro_plus'): ModelConfig[] {
    const allModels = this.getModels();
    
    if (tier === 'free') {
      return allModels.filter(m => m.pricing.input === 0 && m.pricing.output === 0);
    }
    
    if (tier === 'pro') {
      return allModels.filter(m => 
        (m.pricing.input === 0 && m.pricing.output === 0) || // Free models
        (m.pricing.input <= 5 && m.intelligence !== 'frontier') // Standard models
      );
    }
    
    // Pro+ gets everything
    return allModels;
  }

  // Update provider configuration
  updateProvider(providerId: ProviderType, config: Partial<ProviderConfig>): void {
    const existing = this.providers.get(providerId);
    if (existing) {
      this.providers.set(providerId, { ...existing, ...config });
      // Clear model instance cache for this provider
      this.clearProviderCache(providerId);
    }
  }

  // Add custom model configuration
  addModel(model: ModelConfig): void {
    this.models.set(model.id, model);
  }

  // Clear cached model instances for a provider
  private clearProviderCache(providerId: ProviderType): void {
    const keysToDelete = Array.from(this.modelInstances.keys()).filter(key => {
      const modelId = key.split('-')[0];
      const model = this.models.get(modelId);
      return model?.provider === providerId;
    });
    
    keysToDelete.forEach(key => {
      this.modelInstances.delete(key);
    });
  }

  // Get provider configuration
  getProvider(providerId: ProviderType): ProviderConfig | undefined {
    return this.providers.get(providerId);
  }

  // Get all providers
  getProviders(): ProviderConfig[] {
    return Array.from(this.providers.values()).sort((a, b) => b.priority - a.priority);
  }
}

// =============================================================================
// Global Registry Instance
// =============================================================================

export const aiProviderRegistry = new AIProviderRegistry();

// =============================================================================
// Convenience Functions (backwards compatibility)
// =============================================================================

export const getModel = (modelId: string, options?: { 
  fallbackEnabled?: boolean;
  providerOptions?: Record<string, unknown>;
}): LanguageModel => {
  return aiProviderRegistry.getModel(modelId, { fallbackEnabled: true, ...options });
};

export const getModelById = (id: string): ModelConfig | undefined => {
  return aiProviderRegistry.getModels().find(m => m.id === id);
};

export const getModelsForTier = (tier: 'free' | 'pro' | 'pro_plus'): ModelConfig[] => {
  return aiProviderRegistry.getModelsForTier(tier);
};

export const getDefaultModel = (): ModelConfig => {
  return aiProviderRegistry.getDefaultModel();
};

// Export types for external use
export type { ModelConfig as AIModelConfig, ProviderConfig as AIProviderConfig };

// =============================================================================
// UI-Compatible Model Exports (for legacy component compatibility)
// =============================================================================

// Legacy AIModel type for UI compatibility
export interface UIModel {
  id: string;
  name: string;
  provider: 'openai' | 'google' | 'openrouter' | 'gateway';
  description: string;
  contextWindow: number;
  maxOutput?: number;
  pricing: { input: number; output: number };
  capabilities: string[];
  speed: 'fast' | 'medium' | 'slow';
  intelligence: 'basic' | 'advanced' | 'expert' | 'frontier';
  released?: string;
  default?: boolean;
}

/**
 * Get all available models in UI-compatible format
 * This is the single source of truth for model lists throughout the app
 */
export const getAllUIModels = (): UIModel[] => {
  return aiProviderRegistry.getModels().map(config => ({
    id: config.id,
    name: config.name,
    provider: config.provider as UIModel['provider'],
    description: config.description,
    contextWindow: config.contextWindow,
    maxOutput: config.maxOutput,
    pricing: config.pricing,
    capabilities: config.capabilities,
    speed: config.speed,
    intelligence: config.intelligence,
    released: config.released,
    default: config.default,
  }));
};

/**
 * Get models for a specific subscription tier in UI-compatible format
 */
export const getUIModelsForTier = (tier: 'free' | 'pro' | 'pro_plus'): UIModel[] => {
  const models = aiProviderRegistry.getModelsForTier(tier);
  return models.map(config => ({
    id: config.id,
    name: config.name,
    provider: config.provider as UIModel['provider'],
    description: config.description,
    contextWindow: config.contextWindow,
    maxOutput: config.maxOutput,
    pricing: config.pricing,
    capabilities: config.capabilities,
    speed: config.speed,
    intelligence: config.intelligence,
    released: config.released,
    default: config.default,
  }));
};

/**
 * Get all available providers
 */
export const getAllProviders = (): ProviderType[] => {
  return aiProviderRegistry.getProviders().map(provider => provider.id);
};

/**
 * Get models by provider in UI-compatible format
 */
export const getUIModelsByProvider = (providerId: ProviderType): UIModel[] => {
  const allModels = getAllUIModels();
  return allModels.filter(model => model.provider === providerId);
};

/**
 * Get the default model in UI-compatible format
 */
export const getDefaultUIModel = (): UIModel => {
  const defaultConfig = aiProviderRegistry.getDefaultModel();
  return {
    id: defaultConfig.id,
    name: defaultConfig.name,
    provider: defaultConfig.provider as UIModel['provider'],
    description: defaultConfig.description,
    contextWindow: defaultConfig.contextWindow,
    maxOutput: defaultConfig.maxOutput,
    pricing: defaultConfig.pricing,
    capabilities: defaultConfig.capabilities,
    speed: defaultConfig.speed,
    intelligence: defaultConfig.intelligence,
    released: defaultConfig.released,
    default: defaultConfig.default,
  };
};

/**
 * Get model by ID in UI-compatible format
 */
export const getUIModelById = (id: string): UIModel | undefined => {
  const allModels = getAllUIModels();
  return allModels.find(model => model.id === id);
};

// Helper functions for model categorization (maintaining compatibility)
export const isFreeModel = (model: { pricing: { input: number; output: number } }): boolean => {
  return model.pricing.input === 0 && model.pricing.output === 0;
};

export const isStandardModel = (model: { pricing: { input: number; output: number } }): boolean => {
  return !isFreeModel(model) && !isPremiumModel(model);
};

export const isPremiumModel = (model: { pricing: { input: number; output: number } }): boolean => {
  // Premium models have input cost > 5 per 1M tokens OR output cost > 20 per 1M tokens
  return model.pricing.input > 5 || model.pricing.output > 20;
};

export const isGatewayModel = (modelId: string): boolean => {
  return modelId.startsWith('gateway/');
};
