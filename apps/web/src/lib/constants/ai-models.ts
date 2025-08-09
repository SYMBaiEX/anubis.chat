/**
 * AI Model Configurations
 * Updated: August 2025
 */

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
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
}

export const AI_MODELS: AIModel[] = [
  // OpenAI Models (August 2025)
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    description:
      'Latest flagship model with unified reasoning and generation capabilities',
    contextWindow: 128_000,
    maxOutput: 16_384,
    pricing: { input: 30, output: 120 },
    capabilities: [
      'coding',
      'reasoning',
      'creative',
      'analysis',
      'vision',
      'tools',
    ],
    speed: 'medium',
    intelligence: 'frontier',
    released: 'August 2025',
    default: false,
  },
  {
    id: 'gpt-5-pro',
    name: 'GPT-5 Pro',
    provider: 'openai',
    description: 'Extended thinking variant for complex problems',
    contextWindow: 128_000,
    maxOutput: 32_768,
    pricing: { input: 60, output: 240 },
    capabilities: ['deep-reasoning', 'complex-coding', 'research', 'analysis'],
    speed: 'slow',
    intelligence: 'frontier',
    released: 'August 2025',
  },
  {
    id: 'o3',
    name: 'OpenAI o3',
    provider: 'openai',
    description: 'Most powerful reasoning model for coding, math, and science',
    contextWindow: 128_000,
    maxOutput: 16_384,
    pricing: { input: 15, output: 60 },
    capabilities: ['reasoning', 'coding', 'math', 'science', 'visual'],
    speed: 'slow',
    intelligence: 'frontier',
    released: '2025',
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
    intelligence: 'advanced',
    released: '2025',
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    description: 'Enhanced GPT-4 with 1M token context',
    contextWindow: 1_000_000,
    maxOutput: 8192,
    pricing: { input: 10, output: 30 },
    capabilities: ['coding', 'analysis', 'creative', 'long-context'],
    speed: 'medium',
    intelligence: 'expert',
    released: '2025',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Optimized GPT-4 with June 2024 knowledge',
    contextWindow: 128_000,
    maxOutput: 4096,
    pricing: { input: 5, output: 15 },
    capabilities: ['general', 'coding', 'analysis'],
    speed: 'fast',
    intelligence: 'advanced',
    default: true,
  },

  // Anthropic Models (August 2025)
  {
    id: 'claude-opus-4.1',
    name: 'Claude Opus 4.1',
    provider: 'anthropic',
    description: "World's best coding model with sustained performance",
    contextWindow: 200_000,
    maxOutput: 8192,
    pricing: { input: 15, output: 75 },
    capabilities: ['coding', 'agent-workflows', 'reasoning', 'analysis'],
    speed: 'medium',
    intelligence: 'frontier',
    released: 'August 5, 2025',
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    description: 'Excellent coding with fast responses',
    contextWindow: 200_000,
    maxOutput: 8192,
    pricing: { input: 3, output: 15 },
    capabilities: ['coding', 'reasoning', 'creative', 'analysis'],
    speed: 'fast',
    intelligence: 'expert',
    released: 'May 2025',
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Fast, intelligent, and cost-effective',
    contextWindow: 200_000,
    maxOutput: 8192,
    pricing: { input: 3, output: 15 },
    capabilities: ['general', 'coding', 'analysis', 'creative'],
    speed: 'fast',
    intelligence: 'advanced',
  },
  {
    id: 'claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Fastest Claude model for simple tasks',
    contextWindow: 200_000,
    maxOutput: 4096,
    pricing: { input: 0.25, output: 1.25 },
    capabilities: ['general', 'quick-tasks'],
    speed: 'fast',
    intelligence: 'basic',
  },

  // Google Models (August 2025)
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
];

export const DEFAULT_MODEL = AI_MODELS.find((m) => m.default) || AI_MODELS[0];

export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS.find((model) => model.id === id);
};

export const getModelsByProvider = (
  provider: 'openai' | 'anthropic' | 'google'
): AIModel[] => {
  return AI_MODELS.filter((model) => model.provider === provider);
};

export const getModelsByIntelligence = (
  level: AIModel['intelligence']
): AIModel[] => {
  return AI_MODELS.filter((model) => model.intelligence === level);
};

export const formatTokenPrice = (
  tokens: number,
  pricePerMillion: number
): string => {
  const cost = (tokens / 1_000_000) * pricePerMillion;
  return `$${cost.toFixed(4)}`;
};
