'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery } from 'convex/react';
import { Crown, Plus, Settings } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

// =============================================================================
// Validation Schema
// =============================================================================

const agentFormSchema = z.object({
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

export type AgentFormData = z.infer<typeof agentFormSchema>;

// =============================================================================
// Component Props
// =============================================================================

interface AgentModalProps {
  mode: 'create' | 'edit';
  agentId?: Id<'agents'>;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  defaultValues?: Partial<AgentFormData>;
}

// =============================================================================
// Main Component
// =============================================================================

export function AgentModal({
  mode,
  agentId,
  trigger,
  open,
  onOpenChange,
  onSuccess,
  defaultValues,
}: AgentModalProps) {
  const { user } = useAuthContext();
  const subscriptionStatus = useSubscriptionStatus();

  // Fetch existing agent data for edit mode
  const agent = useQuery(
    api.agents.getById,
    mode === 'edit' && agentId ? { id: agentId } : 'skip'
  );

  // Mutations
  const createAgent = useMutation(api.agents.create);
  const updateAgent = useMutation(api.agents.update);

  // Check permissions for edit mode
  const canEdit = mode === 'create' || (
    user?.walletAddress && 
    agent && 
    agent.createdBy === user.walletAddress && 
    !agent.isPublic
  );

  // Form setup
  const form = useForm({
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      systemPrompt: defaultValues?.systemPrompt || '',
      temperature: defaultValues?.temperature || 0.7,
    } as AgentFormData,
    onSubmit: async ({ value }) => {
      if (!user?.walletAddress) {
        toast.error('Authentication required');
        return;
      }

      try {
        if (mode === 'create') {
          await createAgent({
            name: value.name,
            description: value.description || '',
            systemPrompt: value.systemPrompt || '',
            temperature: value.temperature,
            type: 'custom',
            capabilities: [],
            isPublic: false,
            createdBy: user.walletAddress,
          });
          toast.success('Agent created successfully!');
        } else if (mode === 'edit' && agentId) {
          await updateAgent({
            id: agentId,
            name: value.name,
            description: value.description,
            systemPrompt: value.systemPrompt,
            temperature: value.temperature,
            walletAddress: user.walletAddress,
          });
          toast.success('Agent updated successfully!');
        }

        // Reset form and close modal
        form.reset();
        onOpenChange?.(false);
        onSuccess?.();
      } catch (error) {
        console.error(`Failed to ${mode} agent:`, error);
        toast.error(`Failed to ${mode} agent. Please try again.`);
      }
    },
  });

  // Update form values when agent data loads (edit mode)
  useEffect(() => {
    if (mode === 'edit' && agent && canEdit) {
      form.setFieldValue('name', agent.name);
      form.setFieldValue('description', agent.description || '');
      form.setFieldValue('systemPrompt', agent.systemPrompt || '');
      form.setFieldValue('temperature', agent.temperature || 0.7);
    }
  }, [agent, canEdit, form, mode]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      form.reset();
    } else if (open && mode === 'create' && defaultValues) {
      // Pre-fill form with default values when modal opens in create mode
      form.setFieldValue('name', defaultValues.name || '');
      form.setFieldValue('description', defaultValues.description || '');
      form.setFieldValue('systemPrompt', defaultValues.systemPrompt || '');
      form.setFieldValue('temperature', defaultValues.temperature || 0.7);
    }
  }, [open, form, mode, defaultValues]);

  // Handle permission check for edit mode
  if (mode === 'edit' && agent && !canEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cannot Edit Agent</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-muted-foreground">
              You can only edit agents that you created. Public agents cannot be edited.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Handle loading state for edit mode
  if (mode === 'edit' && agent === undefined) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-muted-foreground">Loading agent details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Handle not found state for edit mode
  if (mode === 'edit' && agent === null) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agent Not Found</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-muted-foreground">
              The agent you're trying to edit doesn't exist.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <Plus className="h-5 w-5" />
                Create New Agent
              </>
            ) : (
              <>
                <Settings className="h-5 w-5" />
                Edit Agent
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                    onClick={() => window.open('/subscription', '_blank')}
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
            <div className="space-y-6">
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
                        const result = agentFormSchema.shape.name.safeParse(value);
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
                        const result = agentFormSchema.shape.temperature.safeParse(value);
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
                      const result = agentFormSchema.shape.description.safeParse(value);
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
                      const result = agentFormSchema.shape.systemPrompt.safeParse(value);
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

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={() => onOpenChange?.(false)}
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
                      {isSubmitting 
                        ? (mode === 'create' ? 'Creating...' : 'Updating...')
                        : (mode === 'create' ? 'Create Agent' : 'Update Agent')
                      }
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Convenient wrapper components
// =============================================================================

interface CreateAgentModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  defaultValues?: Partial<AgentFormData>;
}

export function CreateAgentModal(props: CreateAgentModalProps) {
  return <AgentModal mode="create" {...props} />;
}

interface EditAgentModalProps {
  agentId: Id<'agents'>;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditAgentModal(props: EditAgentModalProps) {
  return <AgentModal mode="edit" {...props} />;
}