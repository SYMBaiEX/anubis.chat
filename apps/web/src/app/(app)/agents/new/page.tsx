'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { Crown, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthContext, useSubscriptionStatus } from '@/components/providers/auth-provider';
import { UpgradePrompt } from '@/components/auth/upgrade-prompt';
import { getModelsForTier, isPremiumModel, getModelById } from '@/lib/constants/ai-models';
import { failure, type Result, safeAsync, success } from '@/lib/utils/result';

// =============================================================================
// Configuration
// =============================================================================

// Dynamic model configuration based on subscription tier
const getAvailableModels = (tier: 'free' | 'pro' | 'pro_plus' | undefined) => {
  if (!tier) return [];
  
  const availableModels = getModelsForTier(tier);
  return availableModels.map(model => ({
    value: model.id,
    label: model.name,
    isPremium: isPremiumModel(model),
    tier: model.intelligence,
  }));
};

const AGENT_CONFIG = {
  templates: [
    { value: 'general', label: 'General Assistant' },
    { value: 'research', label: 'Research Specialist' },
    { value: 'analysis', label: 'Data Analyst' },
    { value: 'blockchain', label: 'Blockchain Assistant' },
    { value: 'custom', label: 'Custom Agent' },
  ] as const,
  defaults: {
    template: 'custom' as const,
    model: 'gpt-5-nano' as const,
    temperature: 0.7,
    maxTokens: 4096,
    maxSteps: 10,
    enableMCPTools: false,
    tools: [] as string[],
  },
} as const;

// =============================================================================
// Validation Schema
// =============================================================================

const createAgentFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .trim()
    .optional()
    .default(''),
  systemPrompt: z
    .string()
    .max(2000, 'System prompt must be 2000 characters or less')
    .trim()
    .optional()
    .default(''),
  template: z
    .enum(['general', 'research', 'analysis', 'blockchain', 'custom'])
    .default(AGENT_CONFIG.defaults.template),
  model: z
    .enum(['gpt-5-nano', 'gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-2.0-flash'])
    .default(AGENT_CONFIG.defaults.model),
  temperature: z
    .number()
    .min(0, 'Temperature must be between 0 and 2')
    .max(2, 'Temperature must be between 0 and 2')
    .default(AGENT_CONFIG.defaults.temperature),
  maxTokens: z
    .number()
    .int('Max tokens must be a whole number')
    .min(1, 'Max tokens must be at least 1')
    .max(128_000, 'Max tokens cannot exceed 128,000')
    .default(AGENT_CONFIG.defaults.maxTokens),
  maxSteps: z
    .number()
    .int('Max steps must be a whole number')
    .min(1, 'Max steps must be at least 1')
    .max(50, 'Max steps cannot exceed 50')
    .default(AGENT_CONFIG.defaults.maxSteps),
  enableMCPTools: z.boolean().default(AGENT_CONFIG.defaults.enableMCPTools),
});

type CreateAgentFormData = z.infer<typeof createAgentFormSchema>;

// =============================================================================
// API Submission Handler
// =============================================================================

interface CreateAgentError {
  code: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'API_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: Record<string, string[]>;
}

async function createAgent(
  data: CreateAgentFormData
): Promise<Result<void, CreateAgentError>> {
  try {
    const payload = {
      name: data.name,
      description: data.description || undefined,
      template: data.template,
      model: data.model,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
      systemPrompt: data.systemPrompt || undefined,
      tools: AGENT_CONFIG.defaults.tools,
      maxSteps: data.maxSteps,
      enableMCPTools: data.enableMCPTools,
    };

    const response = await fetch('/api/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 422) {
        return failure<CreateAgentError>({
          code: 'VALIDATION_ERROR',
          message: 'Please check your input and try again.',
          details: errorData.details || {},
        });
      }

      return failure<CreateAgentError>({
        code: 'API_ERROR',
        message: errorData.message || `Server error: ${response.status}`,
      });
    }

    return success(undefined);
  } catch (error) {
    const err = error as Error;
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      return failure<CreateAgentError>({
        code: 'NETWORK_ERROR',
        message:
          'Network connection failed. Please check your connection and try again.',
      });
    }

    return failure<CreateAgentError>({
      code: 'UNKNOWN_ERROR',
      message: err.message || 'An unexpected error occurred.',
    });
  }
}

export default function NewAgentPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  
  // Check if user has reached agent creation limits
  const canCreateAgent = subscription ? (
    subscription.tier === 'free' ? true : // Free tier can create basic agents
    subscription.tier === 'pro' ? true :  // Pro tier can create advanced agents
    true // Pro+ tier can create unlimited agents
  ) : false;

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      systemPrompt: '',
      template: AGENT_CONFIG.defaults.template,
      model: AGENT_CONFIG.defaults.model,
      temperature: AGENT_CONFIG.defaults.temperature,
      maxTokens: AGENT_CONFIG.defaults.maxTokens,
      maxSteps: AGENT_CONFIG.defaults.maxSteps,
      enableMCPTools: AGENT_CONFIG.defaults.enableMCPTools,
    } satisfies CreateAgentFormData,
    onSubmit: async ({ value }) => {
      // Validate form data
      const validation = createAgentFormSchema.safeParse(value);

      if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        Object.entries(errors).forEach(([field, messages]) => {
          if (messages) {
            toast.error(`${field}: ${messages[0]}`);
          }
        });
        return;
      }

      // Submit to API
      const result = await createAgent(validation.data);

      if (result.success) {
        toast.success('Agent created successfully!');
        router.push('/dashboard');
      } else {
        const { error } = result;

        switch (error.code) {
          case 'VALIDATION_ERROR':
            toast.error(error.message);
            if (error.details) {
              Object.entries(error.details).forEach(([field, messages]) => {
                if (messages.length > 0) {
                  toast.error(`${field}: ${messages[0]}`);
                }
              });
            }
            break;
          case 'NETWORK_ERROR':
          case 'API_ERROR':
          case 'UNKNOWN_ERROR':
          default:
            toast.error(error.message);
            break;
        }
      }
    },
  });

  // Get available models based on subscription tier
  const availableModels = getAvailableModels(subscription?.tier);

  if (!subscription) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Loading subscription...</h2>
          <p className="text-muted-foreground">Please wait while we load your subscription details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="mb-2 font-semibold text-2xl">Create Agent</h1>
        <div className="flex items-center gap-3">
          <Badge variant={subscription.tier === 'free' ? 'secondary' : 'default'} className="gap-1">
            <Crown className="h-3 w-3" />
            {subscription.tier} Plan
          </Badge>
          <p className="text-muted-foreground text-sm">
            {subscription.tier === 'free' && 'Access to basic models and features'}
            {subscription.tier === 'pro' && 'Access to premium models with limits'}
            {subscription.tier === 'pro_plus' && 'Full access to all models and features'}
          </p>
        </div>
      </div>

      {/* Tier-specific alerts */}
      {subscription.tier === 'free' && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Free tier agents are limited to basic models. Upgrade to Pro or Pro+ to access premium AI models and advanced features.
          </AlertDescription>
        </Alert>
      )}

      <Card className="max-w-2xl p-6">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          {/* Name Field */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                const result = z
                  .string()
                  .min(1, 'Name is required')
                  .max(100, 'Name must be 100 characters or less')
                  .safeParse(value);
                return result.success
                  ? undefined
                  : result.error.issues[0].message;
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  aria-describedby={
                    field.state.meta.errors.length > 0
                      ? `${field.name}-error`
                      : undefined
                  }
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter agent name..."
                  required
                  value={field.state.value}
                />
                {field.state.meta.errors.length > 0 && (
                  <p
                    className="mt-1 text-red-600 text-sm"
                    id={`${field.name}-error`}
                  >
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Description Field */}
          <form.Field
            name="description"
            validators={{
              onChange: ({ value }) => {
                const result = z
                  .string()
                  .max(500, 'Description must be 500 characters or less')
                  .safeParse(value);
                return result.success
                  ? undefined
                  : result.error.issues[0].message;
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Description</Label>
                <Input
                  aria-describedby={
                    field.state.meta.errors.length > 0
                      ? `${field.name}-error`
                      : undefined
                  }
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Brief description of your agent (optional)..."
                  value={field.state.value}
                />
                {field.state.meta.errors.length > 0 && (
                  <p
                    className="mt-1 text-red-600 text-sm"
                    id={`${field.name}-error`}
                  >
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* System Prompt Field */}
          <form.Field
            name="systemPrompt"
            validators={{
              onChange: ({ value }) => {
                const result = z
                  .string()
                  .max(2000, 'System prompt must be 2000 characters or less')
                  .safeParse(value);
                return result.success
                  ? undefined
                  : result.error.issues[0].message;
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>System Prompt</Label>
                <Textarea
                  aria-describedby={
                    field.state.meta.errors.length > 0
                      ? `${field.name}-error`
                      : undefined
                  }
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Define your agent's behavior and personality (optional)..."
                  rows={6}
                  value={field.state.value}
                />
                {field.state.meta.errors.length > 0 && (
                  <p
                    className="mt-1 text-red-600 text-sm"
                    id={`${field.name}-error`}
                  >
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* AI Model Selection */}
          <form.Field name="model">
            {(field) => {
              const selectedModel = availableModels.find(m => m.value === field.state.value);
              return (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    AI Model <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  >
                    <option value="">Select an AI model</option>
                    {availableModels.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </Select>
                  {selectedModel && (
                    <div className="flex items-center gap-2">
                      {selectedModel.isPremium && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Zap className="h-3 w-3" />
                          Premium
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs capitalize">
                        {selectedModel.tier}
                      </Badge>
                    </div>
                  )}
                  <p className="text-muted-foreground text-sm">
                    {field.state.value === 'gpt-5-nano' && 'Ultra-efficient nano model with GPT-5 intelligence'}
                    {field.state.value === 'gpt-4o' && 'Optimized GPT-4 with enhanced capabilities'}
                    {field.state.value === 'gpt-4o-mini' && 'Fast and cost-effective for simple tasks'}
                    {field.state.value === 'claude-3-5-sonnet' && 'Fast, intelligent, and cost-effective'}
                    {field.state.value === 'gemini-2.0-flash' && 'Superior speed with native tool use'}
                    {subscription.tier === 'free' && !field.state.value && 'Free tier has access to basic models. Upgrade for premium models.'}
                  </p>
                </div>
              );
            }}
          </form.Field>

          {/* Temperature Slider */}
          <form.Field name="temperature">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Temperature</Label>
                  <span className="text-muted-foreground text-sm">{field.state.value}</span>
                </div>
                <Input
                  type="range"
                  id={field.name}
                  name={field.name}
                  min={0}
                  max={2}
                  step={0.1}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-muted-foreground text-xs">
                  Controls randomness: 0 = focused, 2 = creative
                </p>
              </div>
            )}
          </form.Field>

          {/* Max Tokens */}
          <form.Field name="maxTokens">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Max Tokens</Label>
                <Input
                  type="number"
                  id={field.name}
                  name={field.name}
                  min={1}
                  max={128000}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(parseInt(e.target.value, 10))}
                  placeholder="4096"
                />
                <p className="text-muted-foreground text-xs">
                  Maximum response length (1 token ≈ 4 characters)
                </p>
                {field.state.meta.errors.length > 0 && (
                  <p className="mt-1 text-red-600 text-sm">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button disabled={!canSubmit || isSubmitting} type="submit">
                  {isSubmitting ? 'Creating...' : 'Create Agent'}
                </Button>
              )}
            </form.Subscribe>
            <Button onClick={() => router.back()} type="button" variant="ghost">
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
