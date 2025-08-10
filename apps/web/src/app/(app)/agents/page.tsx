'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  Bot,
  Brain,
  Copy,
  MoreVertical,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/data/empty-states';
import { LoadingStates } from '@/components/data/loading-states';
import { useAuthContext } from '@/components/providers/auth-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Agent type colors and icons
const getAgentTypeInfo = (type: string) => {
  switch (type) {
    case 'general':
      return { color: 'bg-blue-500/10 text-blue-500', icon: Bot };
    case 'trading':
      return { color: 'bg-green-500/10 text-green-500', icon: Zap };
    case 'defi':
      return { color: 'bg-purple-500/10 text-purple-500', icon: Sparkles };
    case 'nft':
      return { color: 'bg-pink-500/10 text-pink-500', icon: Brain };
    case 'portfolio':
      return { color: 'bg-orange-500/10 text-orange-500', icon: Brain };
    case 'custom':
      return { color: 'bg-gray-500/10 text-gray-500', icon: Settings };
    default:
      return { color: 'bg-gray-500/10 text-gray-500', icon: Bot };
  }
};

// Model badge styling
const getModelBadge = (model: string) => {
  if (model.includes('gpt-4') || model.includes('claude')) {
    return 'default';
  }
  return 'secondary';
};

export default function AgentsPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [showPublicAgents, setShowPublicAgents] = useState(true);

  // Initialize default agents mutation
  const initializeAgents = useMutation(api.agents.initializeDefaults);

  // Fetch all agents (public and user's custom)
  const agents = useQuery(
    api.agents.list,
    user?.walletAddress
      ? { includePublic: showPublicAgents, userId: user.walletAddress }
      : { includePublic: true }
  );

  // Delete mutation
  const deleteAgent = useMutation(api.agents.remove);

  // Initialize default agents on first load
  useEffect(() => {
    initializeAgents().catch(console.error);
  }, []);

  const handleDeleteAgent = async () => {
    if (!(deleteAgentId && user?.walletAddress)) return;

    try {
      await deleteAgent({
        id: deleteAgentId as Id<'agents'>,
        userId: user.walletAddress,
      });
      toast.success('Agent deleted successfully');
      setDeleteAgentId(null);
    } catch (error) {
      toast.error('Failed to delete agent');
      console.error(error);
    }
  };

  const handleDuplicateAgent = (agent: any) => {
    // Navigate to create page with pre-filled data
    const params = new URLSearchParams({
      name: `${agent.name} (Copy)`,
      description: agent.description || '',
      systemPrompt: agent.systemPrompt || '',
      model: agent.model,
      temperature: agent.temperature?.toString() || '0.7',
      maxTokens: agent.maxTokens?.toString() || '4096',
    });
    router.push(`/agents/new?${params.toString()}`);
  };

  if (!user?.walletAddress) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Connect Wallet</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your wallet to view and manage agents
          </p>
        </div>
      </div>
    );
  }

  if (agents === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <LoadingStates text="Loading agents..." variant="spinner" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">AI Agents</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage your custom AI agents and assistants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowPublicAgents(!showPublicAgents)}
            size="sm"
            variant="outline"
          >
            {showPublicAgents ? 'Hide' : 'Show'} Public Agents
          </Button>
          <Button asChild>
            <Link href="/agents/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Agent
            </Link>
          </Button>
        </div>
      </div>

      {/* Agents Grid */}
      {agents.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            action={{
              label: 'Create Agent',
              onClick: () => router.push('/agents/new'),
            }}
            description="Create your first AI agent to get started"
            icon={<Bot className="h-12 w-12 text-muted-foreground" />}
            title="No agents yet"
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const typeInfo = getAgentTypeInfo(agent.type);
            const TypeIcon = typeInfo.icon;

            return (
              <Card
                className="group relative overflow-hidden transition-all hover:shadow-lg"
                key={agent._id}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          typeInfo.color
                        )}
                      >
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {agent.name}
                        </CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          {agent.isPublic && (
                            <Badge className="text-xs" variant="secondary">
                              Public
                            </Badge>
                          )}
                          <Badge className="text-xs" variant="outline">
                            {agent.type}
                          </Badge>
                          <Badge
                            className="text-xs"
                            variant={getModelBadge(agent.model)}
                          >
                            {agent.model}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Action Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                          size="sm"
                          variant="ghost"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!agent.isPublic && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/agents/${agent._id}/edit`)
                              }
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDuplicateAgent(agent)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        {!agent.isPublic && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteAgentId(agent._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <CardDescription className="line-clamp-2 text-sm">
                    {agent.description ||
                      agent.systemPrompt ||
                      'No description provided'}
                  </CardDescription>

                  {/* Agent Stats */}
                  <div className="mt-4 flex items-center gap-4 text-muted-foreground text-xs">
                    <div className="flex items-center gap-1">
                      <span>Temp:</span>
                      <span className="font-medium">
                        {agent.temperature || 0.7}
                      </span>
                    </div>
                    {agent.maxTokens && (
                      <div className="flex items-center gap-1">
                        <span>Tokens:</span>
                        <span className="font-medium">{agent.maxTokens}</span>
                      </div>
                    )}
                    {agent.capabilities && agent.capabilities.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span>Tools:</span>
                        <span className="font-medium">
                          {agent.capabilities.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Created Date */}
                  <div className="mt-3 text-muted-foreground text-xs">
                    Created {new Date(agent.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        onOpenChange={() => setDeleteAgentId(null)}
        open={!!deleteAgentId}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this agent? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgent}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
