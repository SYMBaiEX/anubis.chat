'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LoadingStates } from '@/components/data/loading-states';
import { useSolanaAgent, type Agent } from '@/components/providers/solana-agent-provider';
import {
  Bot,
  ChevronDown,
  TrendingUp,
  Coins,
  Image,
  Vote,
  BarChart3,
  Plus,
  Settings,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentSelectorProps {
  className?: string;
}

/**
 * AgentSelector component - Switch between specialized AI agents
 * Allows users to select different agents for various blockchain tasks
 */
export function AgentSelector({ className }: AgentSelectorProps) {
  const {
    agents,
    selectedAgent,
    selectAgent,
    createCustomAgent,
    isInitialized,
  } = useSolanaAgent();
  const [showAgentDialog, setShowAgentDialog] = useState(false);

  const getAgentIcon = (type: Agent['type']) => {
    switch (type) {
      case 'trading':
        return <TrendingUp className="h-4 w-4" />;
      case 'defi':
        return <Coins className="h-4 w-4" />;
      case 'nft':
        return <Image className="h-4 w-4" />;
      case 'dao':
        return <Vote className="h-4 w-4" />;
      case 'portfolio':
        return <BarChart3 className="h-4 w-4" />;
      case 'custom':
        return <Settings className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
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

  const getAgentDescription = (agent: Agent) => {
    if (agent.description) return agent.description;
    
    // Fallback descriptions
    switch (agent.type) {
      case 'trading':
        return 'Specialized in token trading, swaps, and market analysis';
      case 'defi':
        return 'Expert in DeFi protocols, lending, staking, and yield farming';
      case 'nft':
        return 'Handles NFT creation, trading, and marketplace operations';
      case 'dao':
        return 'Manages DAO governance, voting, and proposal creation';
      case 'portfolio':
        return 'Tracks portfolio performance and provides analytics';
      default:
        return 'General-purpose AI assistant with blockchain capabilities';
    }
  };

  if (!isInitialized) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <LoadingStates size="sm" variant="spinner" />
        <span className="text-muted-foreground text-sm">Initializing agents...</span>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Bot className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">No agents available</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="justify-between min-w-[200px]" variant="outline">
            <div className="flex items-center space-x-2">
              {selectedAgent && getAgentIcon(selectedAgent.type)}
              <span className="truncate">
                {selectedAgent?.name || 'Select Agent'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80" align="start">
          {/* Current Agent */}
          {selectedAgent && (
            <>
              <div className="p-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      getAgentColor(selectedAgent.type)
                    )}>
                      {getAgentIcon(selectedAgent.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm truncate">
                        {selectedAgent.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                      {getAgentDescription(selectedAgent)}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 mr-1" />
                      {selectedAgent.capabilities.length} capabilities
                    </div>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Available Agents */}
          <div className="max-h-60 overflow-y-auto">
            {agents
              .filter(agent => agent._id !== selectedAgent?._id)
              .map((agent) => (
                <DropdownMenuItem
                  key={agent._id}
                  onClick={() => selectAgent(agent._id)}
                  className="p-3 cursor-pointer"
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md text-xs",
                        getAgentColor(agent.type)
                      )}>
                        {getAgentIcon(agent.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm truncate">
                          {agent.name}
                        </span>
                        {!agent.isPublic && (
                          <Badge variant="secondary" className="text-xs">
                            Custom
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                        {getAgentDescription(agent)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
          </div>

          <DropdownMenuSeparator />
          
          {/* Create Custom Agent */}
          <DropdownMenuItem onClick={() => setShowAgentDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Agent
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Agent Info Badge */}
      {selectedAgent && (
        <Badge 
          className={cn("text-xs", getAgentColor(selectedAgent.type))}
          variant="secondary"
        >
          {selectedAgent.type.charAt(0).toUpperCase() + selectedAgent.type.slice(1)}
        </Badge>
      )}

      {/* Create Agent Dialog */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Agent</DialogTitle>
            <DialogDescription>
              Create a specialized agent tailored to your specific needs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Custom agent creation will be available soon. You can currently use our pre-configured agents:
            </p>
            
            <div className="space-y-2">
              {agents.filter(agent => agent.isPublic).map((agent) => (
                <div key={agent._id} className="flex items-center space-x-2 text-sm">
                  {getAgentIcon(agent.type)}
                  <span className="font-medium">{agent.name}</span>
                  <span className="text-muted-foreground">- {getAgentDescription(agent)}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AgentSelector;