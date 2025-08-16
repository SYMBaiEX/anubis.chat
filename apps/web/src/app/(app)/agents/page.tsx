'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Brain,
  Copy,
  Crown,
  Eye,
  EyeOff,
  MoreVertical,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CreateAgentModal, EditAgentModal, type AgentFormData } from '@/components/agents/agentModal';
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

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    y: -4,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

// Agent type icons with Egyptian-themed gradients
const getAgentTypeInfo = (type: string) => {
  switch (type) {
    case 'general':
      return {
        gradient: 'from-primary/20 to-emerald-500/20',
        icon: Bot,
        label: 'General AI',
      };
    case 'trading':
      return {
        gradient: 'from-amber-500/20 to-orange-500/20',
        icon: Zap,
        label: 'Trading Bot',
      };
    case 'defi':
      return {
        gradient: 'from-accent/20 to-purple-500/20',
        icon: Sparkles,
        label: 'DeFi Agent',
      };
    case 'nft':
      return {
        gradient: 'from-pink-500/20 to-rose-500/20',
        icon: Brain,
        label: 'NFT Specialist',
      };
    case 'portfolio':
      return {
        gradient: 'from-blue-500/20 to-cyan-500/20',
        icon: Shield,
        label: 'Portfolio Manager',
      };
    case 'custom':
      return {
        gradient: 'from-green-500/20 to-emerald-500/20',
        icon: Settings,
        label: 'Custom Agent',
      };
    default:
      return {
        gradient: 'from-primary/20 to-accent/20',
        icon: Bot,
        label: 'AI Agent',
      };
  }
};

export default function AgentsPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [showPublicAgents, setShowPublicAgents] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [duplicateData, setDuplicateData] = useState<Partial<AgentFormData> | null>(null);

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
    initializeAgents().catch(() => {
      /* intentionally ignore initialization errors in UI */
    });
  }, [initializeAgents]);

  const handleDeleteAgent = async () => {
    if (!(deleteAgentId && user?.walletAddress)) {
      return;
    }

    try {
      await deleteAgent({
        id: deleteAgentId as Id<'agents'>,
        userId: user.walletAddress,
      });
      toast.success('Agent deleted successfully');
      setDeleteAgentId(null);
    } catch (_error) {
      toast.error('Failed to delete agent');
    }
  };

  const handleDuplicateAgent = (agent: Doc<'agents'>) => {
    // Set up duplication data with "(Copy)" suffix
    const duplicateValues: Partial<AgentFormData> = {
      name: `${agent.name} (Copy)`,
      description: agent.description || '',
      systemPrompt: agent.systemPrompt || '',
      temperature: agent.temperature || 0.7,
    };
    
    setDuplicateData(duplicateValues);
    setCreateModalOpen(true);
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
    <AnimatePresence mode="wait">
      <motion.div
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-background via-background/95 to-primary/5"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        key="agents"
      >
        {/* Compact Hero Header with Aurora Effect */}
        <div className="relative overflow-hidden">
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <div className="aurora-primary opacity-20" />
          </motion.div>

          <div className="relative px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
                initial={{ opacity: 0, y: -10 }}
              >
                <div>
                  <h1 className="animate-gradient-x bg-gradient-to-r from-primary via-accent to-primary bg-clip-text font-bold text-3xl text-transparent sm:text-4xl">
                    AI Agents Workshop
                  </h1>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Create and manage your custom AI agents
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      className="gap-2"
                      onClick={() => setShowPublicAgents(!showPublicAgents)}
                      size="sm"
                      variant="outline"
                    >
                      {showPublicAgents ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                      {showPublicAgents ? 'Hide' : 'Show'} Public
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                      onClick={() => {
                        setDuplicateData(null); // Clear any duplicate data
                        setCreateModalOpen(true);
                      }}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Create Agent
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <motion.div
            animate="visible"
            className="space-y-4"
            initial="hidden"
            variants={containerVariants}
          >
            {/* Agents Grid */}
            {agents.length === 0 ? (
              <motion.div variants={itemVariants}>
                <Card className="border-primary/10 p-8 sm:p-10">
                  <EmptyState
                    action={{
                      label: 'Create Agent',
                      onClick: () => {
                        setDuplicateData(null); // Clear any duplicate data
                        setCreateModalOpen(true);
                      },
                    }}
                    description="Create your first AI agent to get started"
                    icon={<Bot className="h-12 w-12 text-muted-foreground" />}
                    title="No agents yet"
                  />
                </Card>
              </motion.div>
            ) : (
              <motion.div
                animate="visible"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                variants={containerVariants}
              >
                {agents.map((agent: Doc<'agents'>, index: number) => {
                  const typeInfo = getAgentTypeInfo(agent.type);
                  const TypeIcon = typeInfo.icon;

                  return (
                    <motion.div
                      className="group"
                      custom={index}
                      key={agent._id}
                      variants={cardVariants}
                      whileHover="hover"
                    >
                      <Card className="relative h-full overflow-hidden border-primary/10 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md">
                        {/* Gradient Background */}
                        <motion.div
                          className={cn(
                            'absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100',
                            'bg-gradient-to-br',
                            typeInfo.gradient
                          )}
                          initial={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ opacity: 0.05 }}
                        />

                        <CardHeader className="relative">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <motion.div
                                  className={cn(
                                    'rounded-lg p-2',
                                    'bg-gradient-to-br',
                                    typeInfo.gradient
                                  )}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 25,
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                >
                                  <TypeIcon className="h-4 w-4 text-foreground" />
                                </motion.div>
                                <div className="min-w-0 flex-1">
                                  <CardTitle className="truncate font-semibold text-base">
                                    {agent.name}
                                  </CardTitle>
                                  <div className="mt-0.5 flex items-center gap-1.5">
                                    {agent.isPublic && (
                                      <Badge
                                        className="text-xs"
                                        variant="secondary"
                                      >
                                        <Crown className="mr-1 h-3 w-3" />
                                        Public
                                      </Badge>
                                    )}
                                    <Badge
                                      className="text-xs"
                                      variant="outline"
                                    >
                                      {typeInfo.label}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  className="h-8 w-8 p-0"
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
                                      onClick={() => setEditingAgentId(agent._id)}
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
                                      onClick={() =>
                                        setDeleteAgentId(agent._id)
                                      }
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

                        <CardContent className="relative flex flex-1 flex-col p-4">
                          <CardDescription className="line-clamp-2 text-muted-foreground text-sm">
                            {agent.description ||
                              agent.systemPrompt ||
                              'No description provided'}
                          </CardDescription>

                          {/* Agent Stats */}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                            <motion.div
                              className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1"
                              whileHover={{ scale: 1.05 }}
                            >
                              <span className="opacity-70">Temp:</span>
                              <span className="font-medium">
                                {agent.temperature || 0.7}
                              </span>
                            </motion.div>
                            {agent.capabilities &&
                              agent.capabilities.length > 0 && (
                                <motion.div
                                  className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <span className="opacity-70">Tools:</span>
                                  <span className="font-medium">
                                    {agent.capabilities.length}
                                  </span>
                                </motion.div>
                              )}
                          </div>

                          {/* Created Date */}
                          <div className="mt-auto pt-3 text-muted-foreground text-xs opacity-60">
                            Created{' '}
                            {new Date(agent.createdAt).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Egyptian-themed decorative element */}
            <motion.div
              animate={{ opacity: 1 }}
              className="mt-8 flex items-center justify-center gap-2 text-muted-foreground/50"
              initial={{ opacity: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <Shield className="h-4 w-4" />
              <span className="text-xs">Protected by ANUBIS</span>
              <Shield className="h-4 w-4" />
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </motion.div>
          </motion.div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          onOpenChange={() => setDeleteAgentId(null)}
          open={!!deleteAgentId}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Agent</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this agent? This action cannot
                be undone.
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

        {/* Create Agent Modal */}
        <CreateAgentModal
          open={createModalOpen}
          onOpenChange={(open) => {
            setCreateModalOpen(open);
            if (!open) {
              setDuplicateData(null); // Clear duplicate data when modal closes
            }
          }}
          onSuccess={() => {
            // Refresh agents list is handled automatically by Convex
            setDuplicateData(null); // Clear duplicate data on success
          }}
          defaultValues={duplicateData || undefined}
        />

        {/* Edit Agent Modal */}
        {editingAgentId && (
          <EditAgentModal
            agentId={editingAgentId as Id<'agents'>}
            open={!!editingAgentId}
            onOpenChange={(open) => {
              if (!open) setEditingAgentId(null);
            }}
            onSuccess={() => {
              // Refresh agents list is handled automatically by Convex
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
