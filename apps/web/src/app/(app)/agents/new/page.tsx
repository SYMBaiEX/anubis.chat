'use client';

import { api } from '@convex/_generated/api';
import { useForm } from '@tanstack/react-form';
import { useMutation } from 'convex/react';
import { AlertTriangle, Crown, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { UpgradePrompt } from '@/components/auth/upgrade-prompt';
import {
  useAuthContext,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  getModelById,
  getModelsForTier,
  isPremiumModel,
} from '@/lib/constants/ai-models';
import { failure, type Result, safeAsync, success } from '@/lib/utils/result';

// =============================================================================
// Configuration
// =============================================================================

// Dynamic model configuration based on subscription tier
const getAvailableModels = (tier: 'free' | 'pro' | 'pro_plus' | undefined) => {
  if (!tier) return [];

  const availableModels = getModelsForTier(tier);
  return availableModels.map((model) => ({
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
    mcpServers: [
      { name: 'context7', enabled: false, label: 'Context7 - Library Documentation', description: 'Access to library docs, code examples, and best practices' },
      { name: 'solana', enabled: false, label: 'Solana Developer Assistant', description: 'Expert guidance for Solana development, Anchor framework, and real-time documentation search' },
    ],
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
    .enum([
      'gpt-5-nano',
      'gpt-4o',
      'gpt-4o-mini',
      'claude-3-5-sonnet',
      'gemini-2.0-flash',
    ])
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
  mcpServers: z
    .array(
      z.object({
        name: z.string(),
        enabled: z.boolean(),
        config: z.object({}).optional(),
      })
    )
    .optional(),
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

export default function NewAgentPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  const createAgentMutation = useMutation(api.agents.create);

  // Check if user has reached agent creation limits
  const canCreateAgent = subscription
    ? subscription.tier === 'free'
      ? true
      : // Free tier can create basic agents
        subscription.tier === 'pro'
        ? true
        : // Pro tier can create advanced agents
          true // Pro+ tier can create unlimited agents
    : false;

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
      mcpServers: AGENT_CONFIG.defaults.mcpServers.map(s => ({ 
        name: s.name, 
        enabled: s.enabled, 
        config: {} 
      })),
    } as CreateAgentFormData,
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

      // Check if user wallet is available
      if (!user?.walletAddress) {
        toast.error('Please connect your wallet first');
        return;
      }

      try {
        // Prepare agent data
        const agentData = {
          name: validation.data.name,
          type: (validation.data.template === 'custom'
            ? 'custom'
            : validation.data.template === 'blockchain'
              ? 'trading'
              : validation.data.template === 'analysis'
                ? 'portfolio'
                : validation.data.template === 'research'
                  ? 'general'
                  : 'general') as
            | 'general'
            | 'custom'
            | 'trading'
            | 'defi'
            | 'nft'
            | 'dao'
            | 'portfolio',
          description: validation.data.description || '',
          systemPrompt:
            validation.data.systemPrompt || 'You are a helpful AI assistant.',
          capabilities: AGENT_CONFIG.defaults.tools,
          model: validation.data.model,
          temperature: validation.data.temperature,
          maxTokens: validation.data.maxTokens,
          maxSteps: validation.data.maxSteps,
          createdBy: user.walletAddress,
          tools: AGENT_CONFIG.defaults.tools,
          mcpServers: validation.data.mcpServers?.filter(s => s.enabled),
        };

        console.log('Creating agent with data:', agentData);

        // Submit to Convex
        const result = await createAgentMutation(agentData);

        console.log('Agent created successfully:', result);
        toast.success('Agent created successfully!');
        router.push('/agents');
      } catch (error) {
        console.error('Failed to create agent:', error);
        const err = error as Error;
        toast.error(err.message || 'Failed to create agent');
      }
    },
  });

  // Get available models based on subscription tier
  const availableModels = getAvailableModels(
    subscription?.tier === 'admin' ? 'pro_plus' : subscription?.tier
  );

  if (!subscription) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Loading subscription...</h2>
          <p className="text-muted-foreground">
            Please wait while we load your subscription details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="mb-2 font-semibold text-2xl">Create Agent</h1>
        <div className="flex items-center gap-3">
          <Badge
            className="gap-1"
            variant={subscription.tier === 'free' ? 'secondary' : 'default'}
          >
            <Crown className="h-3 w-3" />
            {subscription.tier} Plan
          </Badge>
          <p className="text-muted-foreground text-sm">
            {subscription.tier === 'free' &&
              'Access to basic models and features'}
            {subscription.tier === 'pro' &&
              'Access to premium models with limits'}
            {subscription.tier === 'pro_plus' &&
              'Full access to all models and features'}
          </p>
        </div>
      </div>

      {/* Tier-specific alerts */}
      {subscription.tier === 'free' && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Free tier agents are limited to basic models. Upgrade to Pro or Pro+
            to access premium AI models and advanced features.
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
              const selectedModel = availableModels.find(
                (m) => m.value === field.state.value
              );
              return (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    AI Model <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      field.handleChange(value as CreateAgentFormData['model'])
                    }
                    value={field.state.value}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Select an AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedModel && (
                    <div className="flex items-center gap-2">
                      {selectedModel.isPremium && (
                        <Badge className="gap-1 text-xs" variant="outline">
                          <Zap className="h-3 w-3" />
                          Premium
                        </Badge>
                      )}
                      <Badge className="text-xs capitalize" variant="secondary">
                        {selectedModel.tier}
                      </Badge>
                    </div>
                  )}
                  <p className="text-muted-foreground text-sm">
                    {field.state.value === 'gpt-5-nano' &&
                      'Ultra-efficient nano model with GPT-5 intelligence'}
                    {field.state.value === 'gpt-4o' &&
                      'Optimized GPT-4 with enhanced capabilities'}
                    {field.state.value === 'gpt-4o-mini' &&
                      'Fast and cost-effective for simple tasks'}
                    {field.state.value === 'claude-3-5-sonnet' &&
                      'Fast, intelligent, and cost-effective'}
                    {field.state.value === 'gemini-2.0-flash' &&
                      'Superior speed with native tool use'}
                    {subscription.tier === 'free' &&
                      !field.state.value &&
                      'Free tier has access to basic models. Upgrade for premium models.'}
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
                  <span className="text-muted-foreground text-sm">
                    {field.state.value}
                  </span>
                </div>
                <Input
                  className="w-full"
                  id={field.name}
                  max={2}
                  min={0}
                  name={field.name}
                  onChange={(e) =>
                    field.handleChange(
                      Number.parseFloat(
                        e.target.value
                      ) as CreateAgentFormData['temperature']
                    )
                  }
                  step={0.1}
                  type="range"
                  value={field.state.value}
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
                  id={field.name}
                  max={128_000}
                  min={1}
                  name={field.name}
                  onChange={(e) =>
                    field.handleChange(
                      Number.parseInt(
                        e.target.value,
                        10
                      ) as CreateAgentFormData['maxTokens']
                    )
                  }
                  placeholder="4096"
                  type="number"
                  value={field.state.value}
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

          {/* MCP Server Configuration */}
          <div className="space-y-4">
            <div>
              <Label>MCP Server Tools</Label>
              <p className="mb-3 text-muted-foreground text-sm">
                Enable additional AI tools and capabilities for your agent
              </p>
              <div className="space-y-3">
                {AGENT_CONFIG.defaults.mcpServers.map((server, index) => (
                  <form.Field key={server.name} name={`mcpServers`}>
                    {(field) => {
                      const mcpServers = field.state.value || [];
                      const serverState = mcpServers[index] || {
                        name: server.name,
                        enabled: false,
                        config: {},
                      };

                      return (
                        <Card className="p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={serverState.enabled}
                              className="mt-1"
                              id={`mcp-${server.name}`}
                              onCheckedChange={(checked) => {
                                const newServers = [...mcpServers];
                                newServers[index] = {
                                  ...serverState,
                                  enabled: checked as boolean,
                                };
                                field.handleChange(newServers);
                              }}
                            />
                            <div className="flex-1">
                              <label
                                className="cursor-pointer font-medium text-sm"
                                htmlFor={`mcp-${server.name}`}
                              >
                                {server.label}
                              </label>
                              <p className="mt-1 text-muted-foreground text-xs">
                                {server.description}
                              </p>
                              {server.name === 'context7' && (
                                <div className="mt-2 rounded-lg bg-blue-50 p-2 text-xs dark:bg-blue-950">
                                  <strong>Context7 Features:</strong>
                                  <ul className="ml-4 mt-1 list-disc">
                                    <li>Access to 50,000+ library docs</li>
                                    <li>Real-time, version-specific code examples</li>
                                    <li>Best practices and patterns</li>
                                    <li>Framework-specific guidance</li>
                                  </ul>
                                </div>
                              )}
                              {server.name === 'solana' && (
                                <div className="mt-2 rounded-lg bg-purple-50 p-2 text-xs dark:bg-purple-950">
                                  <strong>Solana Developer Tools:</strong>
                                  <ul className="ml-4 mt-1 list-disc">
                                    <li>Solana expert for development questions</li>
                                    <li>Documentation search with RAG</li>
                                    <li>Anchor framework specialist</li>
                                    <li>Real-time docs updates</li>
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    }}
                  </form.Field>
                ))}
              </div>
            </div>
          </div>

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
