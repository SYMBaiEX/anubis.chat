'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import {
  Brain,
  Filter,
  Search,
  Settings,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AdminGuard } from '@/components/auth/admin-guard';
import { EmptyState } from '@/components/data/empty-states';
import { LoadingStates } from '@/components/data/loading-states';
import { MemoryCard } from '@/components/memory/memory-card';
import { MemorySettings } from '@/components/memory/memory-settings';
import { useAuthContext } from '@/components/providers/auth-provider';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Memory, MemoryFilters, MemoryType } from '@/lib/types/memory';
import {
  filterMemories,
  getMemoryTypeConfig,
  memoryTypeConfigs,
} from '@/lib/types/memory';
import { cn } from '@/lib/utils';

export default function MemoriesPage() {
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<MemoryType | 'all'>('all');
  const [sortBy, setSortBy] = useState<
    'importance' | 'createdAt' | 'lastAccessed' | 'accessCount'
  >('importance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSettings, setShowSettings] = useState(false);

  // Queries
  const memories = useQuery(
    api.memories.getUserMemories,
    user?.walletAddress ? { userId: user.walletAddress } : 'skip'
  );

  const stats = useQuery(
    api.memories.getStats,
    user?.walletAddress ? { userId: user.walletAddress } : 'skip'
  );

  // Filter and sort memories
  const filteredMemories = useMemo(() => {
    if (!memories) {
      return [];
    }

    const filters: MemoryFilters = {
      type: selectedType === 'all' ? undefined : selectedType,
      search: searchTerm,
      sortBy,
      sortOrder,
    };

    return filterMemories(memories, filters);
  }, [memories, selectedType, searchTerm, sortBy, sortOrder]);

  // Group memories by type for overview
  const memoryGroups = useMemo(() => {
    if (!memories) {
      return {} as Record<MemoryType, Memory[]>;
    }

    return memories.reduce(
      (groups, memory) => {
        const type = memory.type;
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(memory);
        return groups;
      },
      {} as Record<MemoryType, Memory[]>
    );
  }, [memories]);

  if (!user?.walletAddress) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Connect Wallet</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your wallet to view and manage your memories
          </p>
        </div>
      </div>
    );
  }

  if (memories === undefined || stats === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <LoadingStates text="Loading memories..." variant="spinner" />
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10">
        {/* Full-width header */}
        <div className="w-full p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h1 className="whitespace-nowrap bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl">
                  Memory Bank
                </h1>
                <p className="mt-1 text-muted-foreground text-sm">
                  View and manage your stored memories and learned preferences
                </p>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                <Dialog onOpenChange={setShowSettings} open={showSettings}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Memory Settings</DialogTitle>
                      <DialogDescription>
                        Manage your memory system settings and data
                      </DialogDescription>
                    </DialogHeader>
                    <MemorySettings userId={user.walletAddress} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Constrained content */}
        <div className="mx-auto w-full max-w-7xl space-y-4 p-3 sm:p-4 md:p-6">
          <Tabs className="w-full" defaultValue="memories">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="memories">All Memories</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>

            <TabsContent className="space-y-4" value="memories">
              {/* Search and Filter Controls */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search memories..."
                        value={searchTerm}
                      />
                    </div>

                    {/* Type Filter */}
                    <Select
                      onValueChange={(value) =>
                        setSelectedType(value as MemoryType | 'all')
                      }
                      value={selectedType}
                    >
                      <SelectTrigger className="w-32">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.entries(memoryTypeConfigs).map(
                          ([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <span>{config.icon}</span>
                                <span>{config.label}</span>
                              </div>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select
                      onValueChange={(value) => {
                        const parts = value.split('-');
                        const sortByValue = parts[0];
                        const sortOrderValue = parts[1];

                        const isValidSortBy = (
                          v: string
                        ): v is NonNullable<MemoryFilters['sortBy']> =>
                          v === 'importance' ||
                          v === 'createdAt' ||
                          v === 'lastAccessed' ||
                          v === 'accessCount';

                        const isValidSortOrder = (
                          v: string
                        ): v is NonNullable<MemoryFilters['sortOrder']> =>
                          v === 'asc' || v === 'desc';

                        if (isValidSortBy(sortByValue)) {
                          setSortBy(sortByValue);
                        }
                        if (isValidSortOrder(sortOrderValue)) {
                          setSortOrder(sortOrderValue);
                        }
                      }}
                      value={`${sortBy}-${sortOrder}`}
                    >
                      <SelectTrigger className="w-40">
                        {sortOrder === 'desc' ? (
                          <SortDesc className="mr-2 h-4 w-4" />
                        ) : (
                          <SortAsc className="mr-2 h-4 w-4" />
                        )}
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="importance-desc">
                          Importance ↓
                        </SelectItem>
                        <SelectItem value="importance-asc">
                          Importance ↑
                        </SelectItem>
                        <SelectItem value="createdAt-desc">
                          Newest First
                        </SelectItem>
                        <SelectItem value="createdAt-asc">
                          Oldest First
                        </SelectItem>
                        <SelectItem value="lastAccessed-desc">
                          Recently Accessed
                        </SelectItem>
                        <SelectItem value="accessCount-desc">
                          Most Viewed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active Filters */}
                  {(selectedType !== 'all' || searchTerm) && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        Filters:
                      </span>
                      {selectedType !== 'all' && (
                        <Badge className="gap-1" variant="secondary">
                          {memoryTypeConfigs[selectedType].icon}
                          {memoryTypeConfigs[selectedType].label}
                        </Badge>
                      )}
                      {searchTerm && (
                        <Badge variant="secondary">
                          Search: "{searchTerm}"
                        </Badge>
                      )}
                      <Button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedType('all');
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results Summary */}
              <div className="flex items-center justify-between text-muted-foreground text-sm">
                <span>
                  Showing {filteredMemories.length} of {memories.length}{' '}
                  memories
                </span>
                {stats && (
                  <span>
                    Total accesses: {stats.totalAccesses} | Avg. importance:{' '}
                    {Math.round(stats.averageImportance * 100)}%
                  </span>
                )}
              </div>

              {/* Memories Grid */}
              {filteredMemories.length === 0 ? (
                <Card className="p-8 sm:p-10">
                  {memories.length === 0 ? (
                    <EmptyState
                      description="Your memories will appear here as you chat with ANUBIS"
                      icon={
                        <Brain className="h-12 w-12 text-muted-foreground" />
                      }
                      title="No memories stored yet"
                    />
                  ) : (
                    <EmptyState
                      action={{
                        label: 'Clear Filters',
                        onClick: () => {
                          setSearchTerm('');
                          setSelectedType('all');
                        },
                      }}
                      description="Try adjusting your search terms or filters"
                      icon={
                        <Search className="h-12 w-12 text-muted-foreground" />
                      }
                      title="No memories match your criteria"
                    />
                  )}
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredMemories.map((memory) => (
                    <MemoryCard key={memory._id} memory={memory} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent className="space-y-6" value="overview">
              {/* Quick Stats */}
              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Memory Statistics</CardTitle>
                    <CardDescription>
                      Overview of your stored memories and usage patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                      <div className="text-center">
                        <div className="font-bold text-3xl text-primary">
                          {stats.total}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Total Memories
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-3xl text-blue-600">
                          {stats.totalAccesses}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Total Accesses
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-3xl text-green-600">
                          {Math.round(stats.averageImportance * 100)}%
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Avg. Importance
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-3xl text-purple-600">
                          {
                            Object.keys(stats.byType).filter(
                              (type) => stats.byType[type] > 0
                            ).length
                          }
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Active Types
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Memory Types Overview */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {Object.entries(memoryTypeConfigs).map(([type, config]) => {
                  const typeMemories = memoryGroups[type as MemoryType] || [];
                  const count = typeMemories.length;
                  const avgImportance =
                    count > 0
                      ? typeMemories.reduce((sum, m) => sum + m.importance, 0) /
                        count
                      : 0;

                  return (
                    <Card
                      className={cn(
                        'cursor-pointer transition-all duration-200 hover:shadow-md',
                        'border-l-4',
                        config.borderColor,
                        config.bgColor
                      )}
                      key={type}
                      onClick={() => {
                        setSelectedType(type as MemoryType);
                      }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <CardTitle className="text-lg">
                              {config.label}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {config.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-2xl">{count}</span>
                            <Badge className="text-xs" variant="secondary">
                              {Math.round(avgImportance * 100)}% avg
                            </Badge>
                          </div>
                          {count > 0 && (
                            <p className="text-muted-foreground text-xs">
                              Click to filter by this type
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Recent Memories */}
              {memories && memories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Memories</CardTitle>
                    <CardDescription>
                      Your most recently created memories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {memories.slice(0, 5).map((memory) => {
                        const typeConfig = getMemoryTypeConfig(memory.type);
                        return (
                          <div
                            className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                            key={memory._id}
                          >
                            <span className="text-lg">{typeConfig.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <Badge
                                  className={cn('text-xs', typeConfig.color)}
                                  variant="secondary"
                                >
                                  {memory.type}
                                </Badge>
                                <span className="text-muted-foreground text-xs">
                                  {new Date(
                                    memory.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="line-clamp-2 text-muted-foreground text-sm">
                                {memory.content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  );
}
