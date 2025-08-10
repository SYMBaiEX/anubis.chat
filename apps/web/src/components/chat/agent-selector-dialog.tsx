'use client';

import {
  BarChart3,
  Bot,
  Coins,
  Filter,
  Image,
  Plus,
  Settings,
  TrendingUp,
  Vote,
} from 'lucide-react';
import { useState } from 'react';
import { LoadingStates } from '@/components/data/loading-states';
import {
  type Agent,
  useSolanaAgent,
} from '@/components/providers/solana-agent-provider';
import { AgentGrid } from '@/components/ui/agent-grid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AgentSelectorDialogProps {
  className?: string;
}

const getAgentIcon = (type: Agent['type']) => {
  switch (type) {
    case 'trading':
      return <TrendingUp className="h-3 w-3" />;
    case 'defi':
      return <Coins className="h-3 w-3" />;
    case 'nft':
      return <Image className="h-3 w-3" />;
    case 'dao':
      return <Vote className="h-3 w-3" />;
    case 'portfolio':
      return <BarChart3 className="h-3 w-3" />;
    case 'custom':
      return <Settings className="h-3 w-3" />;
    default:
      return <Bot className="h-3 w-3" />;
  }
};

const getAgentColor = (type: Agent['type']) => {
  switch (type) {
    case 'trading':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'defi':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'nft':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'dao':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'portfolio':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    case 'custom':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-primary/10 text-primary';
  }
};

/**
 * AgentSelectorDialog component - Card-based agent selection interface
 * Similar to the model selector but for specialized AI agents
 */
export function AgentSelectorDialog({ className }: AgentSelectorDialogProps) {
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    agents,
    selectedAgent,
    selectAgent,
    createCustomAgent,
    isInitialized,
  } = useSolanaAgent();

  const handleAgentSelect = (agent: Agent) => {
    selectAgent(agent._id);
    setOpen(false);
  };

  if (!isInitialized) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <LoadingStates size="sm" variant="spinner" />
        <span className="text-muted-foreground text-sm">
          Initializing agents...
        </span>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <Bot className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">
          No agents available
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogTrigger asChild>
          <Button className="min-w-[200px] justify-between" variant="outline">
            <div className="flex min-w-0 flex-1 items-center space-x-2">
              <div className="flex-shrink-0">
                {selectedAgent && getAgentIcon(selectedAgent.type)}
              </div>
              <span className="flex-1 truncate text-left">
                {selectedAgent?.name || 'Select Agent'}
              </span>
            </div>
            <Filter className="h-4 w-4 flex-shrink-0 opacity-50" />
          </Button>
        </DialogTrigger>

        <DialogContent className="max-h-[80vh] max-w-6xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select AI Agent</DialogTitle>
            <DialogDescription>
              Choose a specialized agent for your blockchain tasks
            </DialogDescription>
          </DialogHeader>

          {/* Agents Grid */}
          <div className="max-h-[60vh] overflow-y-auto">
            <AgentGrid
              agents={agents}
              onAgentSelect={handleAgentSelect}
              selectedAgentId={selectedAgent?._id}
            />
          </div>

          {/* Create Custom Agent Button */}
          <div className="border-t pt-4">
            <Button
              className="w-full"
              onClick={() => {
                setOpen(false);
                setShowCreateDialog(true);
              }}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Custom Agent
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Type Badge */}
      {selectedAgent && (
        <Badge
          className={cn('text-xs', getAgentColor(selectedAgent.type))}
          variant="secondary"
        >
          {selectedAgent.type.charAt(0).toUpperCase() +
            selectedAgent.type.slice(1)}
        </Badge>
      )}

      {/* Create Agent Dialog */}
      <Dialog onOpenChange={setShowCreateDialog} open={showCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Agent</DialogTitle>
            <DialogDescription>
              Create a specialized agent tailored to your specific needs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Custom agent creation will be available soon. You can currently
              use our pre-configured agents:
            </p>

            <div className="space-y-2">
              {agents
                .filter((agent) => agent.isPublic)
                .map((agent) => (
                  <div
                    className="flex items-center space-x-2 text-sm"
                    key={agent._id}
                  >
                    {getAgentIcon(agent.type)}
                    <span className="font-medium">{agent.name}</span>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AgentSelectorDialog;
