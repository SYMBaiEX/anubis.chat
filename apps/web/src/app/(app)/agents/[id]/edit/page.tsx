'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery } from 'convex/react';
import { AlertTriangle, ArrowLeft, Crown } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  useAuthContext,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

// =============================================================================
// Configuration
// =============================================================================

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
    temperature: 0.7,
    maxTokens: 4096,
    maxSteps: 10,
    enableMCPTools: false,
    tools: [] as string[],
    mcpServers: [
      {
        name: 'context7',
        enabled: false,
        label: 'Context7 - Library Documentation',
        description:
          'Access to library docs, code examples, and best practices',
      },
      {
        name: 'solana',
        enabled: false,
        label: 'Solana Developer Assistant',
        description:
          'Expert guidance for Solana development, Anchor framework, and real-time documentation search',
      },
    ],
  },
} as const;

// =============================================================================
// Validation Schema
// =============================================================================

const editAgentFormSchema = z.object({
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
  temperature: z
    .number()
    .min(0, 'Temperature must be between 0 and 2')
    .max(2, 'Temperature must be between 0 and 2')
    .default(0.7),
});

type EditAgentFormData = z.infer<typeof editAgentFormSchema>;

// =============================================================================
// Main Component
// =============================================================================

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthContext();
  const subscriptionStatus = useSubscriptionStatus();

  const agentId = params?.id as Id<'agents'> | undefined;

  // Fetch the existing agent data
  const agent = useQuery(api.agents.getById, agentId ? { id: agentId } : 'skip');
  
  // Update mutation
  const updateAgent = useMutation(api.agents.update);

  // Check if user can edit this agent
  const canEdit = user?.walletAddress && agent && (
    agent.createdBy === user.walletAddress
  ) && !agent.isPublic;

  // Form setup
  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      systemPrompt: '',
      temperature: 0.7,
    } as EditAgentFormData,
    onSubmit: async ({ value }) => {
      if (!agentId || !user?.walletAddress) {
        toast.error('Authentication required');
        return;
      }

      try {
        await updateAgent({
          id: agentId,
          name: value.name,
          description: value.description,
          systemPrompt: value.systemPrompt,
          temperature: value.temperature,
          walletAddress: user.walletAddress,
        });

        toast.success('Agent updated successfully!');
        router.push('/agents');
      } catch (error) {
        console.error('Failed to update agent:', error);
        toast.error('Failed to update agent. Please try again.');
      }
    },
  });

  // Update form values when agent data loads
  useEffect(() => {
    if (agent && canEdit) {
      form.setFieldValue('name', agent.name);
      form.setFieldValue('description', agent.description || '');
      form.setFieldValue('systemPrompt', agent.systemPrompt || '');
      form.setFieldValue('temperature', agent.temperature || 0.7);
    }
  }, [agent, canEdit, form]);

  // Handle loading and error states
  if (!agentId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Invalid Agent ID</h2>
          <p className="mt-2 text-muted-foreground">
            The agent ID provided is not valid.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/agents')}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  if (!user?.walletAddress) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Authentication Required</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your wallet to edit agents.
          </p>
        </div>
      </div>
    );
  }

  if (agent === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Loading...</h2>
          <p className="mt-2 text-muted-foreground">
            Loading agent details...
          </p>
        </div>
      </div>
    );
  }

  if (agent === null) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Agent Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The agent you're trying to edit doesn't exist.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/agents')}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mt-4 font-semibold text-xl">Cannot Edit Agent</h2>
          <p className="mt-2 text-muted-foreground">
            You can only edit agents that you created. Public agents cannot be edited.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/agents')}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.push('/agents')}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Agents
        </Button>
        <div>
          <h1 className="font-bold text-3xl">Edit Agent</h1>
          <p className="text-muted-foreground">
            Modify your custom AI agent configuration
          </p>
        </div>
      </div>

      {/* Subscription Warning */}
      {subscriptionStatus?.tier === 'free' && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Custom agents require a Pro subscription.{' '}
                <Badge variant="secondary">Pro Feature</Badge>
              </span>
              <Button
                className="ml-2"
                onClick={() => router.push('/subscription')}
                size="sm"
                variant="outline"
              >
                Upgrade
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Card className="space-y-6 p-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Basic Information</h3>
              <p className="text-muted-foreground text-sm">
                Configure the basic settings for your agent
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    const result = editAgentFormSchema.shape.name.safeParse(value);
                    return result.success ? undefined : result.error.issues[0].message;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Agent Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="My Custom Agent"
                      value={field.state.value}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="temperature"
                validators={{
                  onChange: ({ value }) => {
                    const result = editAgentFormSchema.shape.temperature.safeParse(value);
                    return result.success ? undefined : result.error.issues[0].message;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="temperature">
                      Temperature: {field.state.value}
                    </Label>
                    <Input
                      id="temperature"
                      max="2"
                      min="0"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number.parseFloat(e.target.value))
                      }
                      step="0.1"
                      type="range"
                      value={field.state.value}
                    />
                    <p className="text-muted-foreground text-xs">
                      Controls randomness: 0 = focused, 2 = creative
                    </p>
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field
              name="description"
              validators={{
                onChange: ({ value }) => {
                  const result = editAgentFormSchema.shape.description.safeParse(value);
                  return result.success ? undefined : result.error.issues[0].message;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    className="min-h-20"
                    id="description"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Describe what this agent does..."
                    value={field.state.value}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          <Separator />

          {/* System Prompt */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">System Prompt</h3>
              <p className="text-muted-foreground text-sm">
                Define how your agent should behave and respond
              </p>
            </div>

            <form.Field
              name="systemPrompt"
              validators={{
                onChange: ({ value }) => {
                  const result = editAgentFormSchema.shape.systemPrompt.safeParse(value);
                  return result.success ? undefined : result.error.issues[0].message;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">
                    Instructions for the Agent
                  </Label>
                  <Textarea
                    className="min-h-32"
                    id="systemPrompt"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="You are a helpful assistant that..."
                    value={field.state.value}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>


          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => router.push('/agents')}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  disabled={!canSubmit || isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Updating...' : 'Update Agent'}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </Card>
      </form>
    </div>
  );
}