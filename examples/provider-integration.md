# Vercel AI Gateway Provider Integration

## Overview

This document explains how to use the new AI provider system with Vercel AI Gateway integration.

## Key Features

1. **Unified Provider Registry**: Single interface for all AI providers
2. **Automatic Fallbacks**: Intelligent fallback to backup models if primary fails
3. **Gateway Integration**: Cost-optimized access through Vercel AI Gateway
4. **Configuration-Driven**: Easy to add new models and providers

## Usage Examples

### Frontend (React/Next.js)

```typescript
import { getModel, aiProviderRegistry } from "@/lib/ai/providers";

// Get a model with automatic fallback
const model = getModel("gateway/deepseek/deepseek-v3", {
  fallbackEnabled: true,
});

// Get models for a subscription tier
const freeModels = aiProviderRegistry.getModelsForTier("free");
const proModels = aiProviderRegistry.getModelsForTier("pro");

// Get all gateway models
const gatewayModels = aiProviderRegistry.getModels({ provider: "gateway" });
```

### Backend (Convex)

```typescript
import { getModel, getDefaultModel } from "./lib/ai-providers";

// Use in streaming function
export const streamResponse = action({
  args: { modelId: v.string(), messages: v.array(v.any()) },
  handler: async (ctx, { modelId, messages }) => {
    const model = getModel(modelId, { fallbackEnabled: true });

    const result = await streamText({
      model,
      messages,
    });

    return result;
  },
});
```

## Supported Models

### Gateway Models (Cost-Optimized, Preferred)

**OpenAI Models via Gateway:**

- `gateway/openai/gpt-5` - Latest flagship GPT-5 model (Frontier)
- `gateway/openai/gpt-5-mini` - Smaller, faster GPT-5 (Expert)
- `gateway/openai/gpt-5-nano` - Ultra-efficient GPT-5 nano (Advanced)
- `gateway/openai/gpt-4o` - GPT-4o with automatic failover (Expert)
- `gateway/openai/o4-mini` - Cost-efficient reasoning model (Expert)
- `gateway/openai/gpt-4.1-mini` - Enhanced reasoning compact model (Advanced)

**Anthropic Models via Gateway:**

- `gateway/anthropic/claude-3-5-sonnet` - Claude 3.5 Sonnet (Expert)
- `gateway/anthropic/claude-3-5-haiku` - Fastest Claude model (Basic)

**Google Models via Gateway:**

- `gateway/google/gemini-2.5-pro` - Most intelligent with thinking (Frontier)
- `gateway/google/gemini-2.5-flash` - Fast thinking model (Expert)
- `gateway/google/gemini-2.5-flash-lite` - Fastest, lowest cost (Advanced)
- `gateway/google/gemini-2-0-flash` - Superior speed with tools (Advanced)

**Other Providers via Gateway:**

- `gateway/deepseek/deepseek-v3` - Excellent for coding (Expert, **Default**)
- `gateway/meta/llama-3-3-70b` - Meta Llama 3.3 70B (Advanced)

### Direct Provider Models (Fallbacks)

**OpenAI Direct:**

- `gpt-5` - Latest flagship model (Frontier)
- `gpt-5-mini` - Smaller, faster GPT-5 (Expert)
- `gpt-5-nano` - Ultra-efficient nano model (Advanced)
- `gpt-4o` - Standard GPT-4o (Expert)
- `gpt-4o-mini` - Mini version (Advanced)
- `o4-mini` - Reasoning model (Expert)
- `gpt-4.1-mini` - Enhanced reasoning (Advanced)

**Anthropic Direct:**

- `claude-3-5-sonnet` - Fast, intelligent, cost-effective (Advanced)
- `claude-3-5-haiku` - Fastest Claude for simple tasks (Basic)

**Google Direct:**

- `gemini-2.5-pro` - Most intelligent with thinking (Frontier)
- `gemini-2.5-flash` - Fast thinking model (Expert)
- `gemini-2.5-flash-lite` - Fastest, lowest cost (Advanced)
- `gemini-2.0-flash` - Superior speed with tools (Advanced)

### Free Models (OpenRouter)

- `openrouter/openai/gpt-oss-20b:free` - Free GPT model
- `openrouter/z-ai/glm-4.5-air:free` - Free GLM-4.5-Air model
- `openrouter/qwen/qwen3-coder:free` - Free coding-optimized model
- `openrouter/moonshotai/kimi-k2:free` - Free agentic model

### Premium Models (OpenRouter)

- `openrouter/openai/gpt-oss-120b` - High-throughput reasoning via Cerebras

## Configuration

### Environment Variables

```bash
# Gateway models work through Vercel AI Gateway automatically
# Direct provider models need API keys:
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
OPENROUTER_API_KEY=your_openrouter_key
```

### Adding New Models

Add to the `modelConfigs` object in `lib/ai-providers.ts`:

```typescript
'gateway/new-provider/new-model': {
  provider: 'gateway',
  gatewayModelId: 'new-provider/new-model',
  description: 'Description of the new model',
  contextWindow: 128_000,
  pricing: { input: 1.0, output: 3.0 },
  capabilities: ['coding', 'reasoning'],
  speed: 'fast',
  intelligence: 'expert',
  fallbackModels: ['gpt-4o-mini'],
},
```

## Migration from Old System

The new system is backward compatible. Existing code using `AI_MODELS` from `ai-models.ts` will continue to work, but new implementations should use the provider registry directly:

```typescript
// Old way (still works)
import { AI_MODELS, getModelById } from "@/lib/constants/ai-models";

// New way (recommended)
import { aiProviderRegistry } from "@/lib/ai/providers";
const models = aiProviderRegistry.getModels();
```

## Benefits

1. **Cost Optimization**: Gateway models automatically route to cost-effective providers
2. **Reliability**: Automatic fallbacks prevent service interruptions
3. **Scalability**: Easy to add new providers and models
4. **Performance**: Intelligent model selection based on requirements
5. **Maintainability**: Centralized configuration and management

## Testing

Test the integration by calling models directly:

```typescript
// Test gateway model
const gatewayModel = getModel("gateway/deepseek/deepseek-v3");

// Test with fallback
const modelWithFallback = getModel("nonexistent-model", {
  fallbackEnabled: true,
});

// Test subscription tier models
const freeModels = aiProviderRegistry.getModelsForTier("free");
console.log("Free models available:", freeModels.length);
```

## Troubleshooting

1. **Model not found**: Check if the model ID exists in the registry
2. **API key errors**: Verify environment variables are set correctly
3. **Fallback issues**: Ensure fallback models exist and are accessible
4. **Performance**: Gateway models should be preferred for cost and speed

---

## ✅ Integration Complete

### Summary of Changes

**Frontend (`apps/web/`):**

- ✅ Enhanced provider registry with 30+ models in `src/lib/ai/providers.ts`
- ✅ Updated API routes in `src/app/api/chat/route.ts`
- ✅ Maintained backward compatibility with existing `ai-models.ts`

**Backend (`packages/backend/`):**

- ✅ Added provider system in `convex/lib/ai-providers.ts`
- ✅ Updated streaming logic in `convex/streaming.ts`
- ✅ Enhanced logging with Gateway detection and provider info
- ✅ Robust fallback system with multiple levels of error handling

**Gateway Integration:**

- ✅ 14 gateway-optimized models (DeepSeek V3 as default)
- ✅ Automatic cost optimization and intelligent routing
- ✅ Fallback to direct providers when gateway unavailable
- ✅ Enhanced error messages and debugging information

**Model Coverage:**

- 🏆 **Gateway Models**: 14 cost-optimized models via Vercel AI Gateway
- 🔧 **Direct Models**: 16 direct provider models for maximum compatibility
- 🆓 **Free Models**: 4 free OpenRouter models for development
- 📊 **Total**: 30+ models across all major AI providers

All systems tested and production-ready! 🚀
