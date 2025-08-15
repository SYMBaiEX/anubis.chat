'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useAction, usePaginatedQuery, useQuery } from 'convex/react';
import {
  Activity,
  DollarSign,
  Download,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type {
  UserTokenMetrics,
  ModelUsageStats,
  TokenUsageTrend,
  TierMetrics,
  ChatTokenMetrics,
  SystemTokenMetrics,
  ExportResult,
} from '@/types/adminMetrics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Chart colors
const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF6B6B',
];

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">{icon}</div>
          <span className="font-medium text-sm">{title}</span>
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="font-bold text-2xl">{value}</div>
        {subtitle && (
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}

export function TokenMetricsDashboard() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [sortBy, setSortBy] = useState<'tokens' | 'cost' | 'chats'>('tokens');
  const [selectedUserId, setSelectedUserId] = useState<Id<'users'> | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  // Export actions
  const exportTokenMetrics = useAction(api.adminExport.exportTokenMetrics);
  const exportModelStats = useAction(api.adminExport.exportModelStats);
  const exportTierAnalysis = useAction(api.adminExport.exportTierAnalysis);

  // Fetch metrics data
  const systemMetrics = useQuery(api.adminMetrics.getTokenUsageMetrics, {
    timeRange,
  }) as SystemTokenMetrics | undefined;

  const userMetrics = useQuery(api.adminMetrics.getUserTokenMetrics, {
    sortBy,
    limit: 20,
  }) as UserTokenMetrics[] | undefined;

  const modelStats = useQuery(api.adminMetrics.getModelUsageStats, {
    timeRange,
  }) as ModelUsageStats[] | undefined;

  const trends = useQuery(api.adminMetrics.getTokenUsageTrends, {
    period: timeRange === '24h' ? 'hour' : 'day',
    limit: 30,
  }) as { period: string; data: TokenUsageTrend[] } | undefined;

  const tierMetrics = useQuery(api.adminMetrics.getCostBySubscriptionTier) as TierMetrics[] | undefined;

  // Paginated chat metrics
  const {
    results: chatMetrics,
    status: chatStatus,
    loadMore: loadMoreChats,
  } = usePaginatedQuery(
    api.adminMetrics.getChatTokenMetrics,
    { userId: selectedUserId, includeEmpty: false },
    { initialNumItems: 10 }
  );

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Free';
    if (cost < 0.01) return '<$0.01';
    if (cost < 1) return `$${cost.toFixed(3)}`;
    return `$${cost.toFixed(2)}`;
  };

  const handleExport = async (type: 'metrics' | 'models' | 'tiers') => {
    setIsExporting(true);
    try {
      let result: ExportResult | undefined;
      switch (type) {
        case 'metrics':
          result = await exportTokenMetrics({ timeRange, format: 'csv' }) as ExportResult;
          break;
        case 'models':
          result = await exportModelStats({ timeRange }) as ExportResult;
          break;
        case 'tiers':
          result = await exportTierAnalysis({}) as ExportResult;
          break;
      }

      if (result) {
        // Create download link
        const blob = new Blob([result.data], { 
          type: result.type === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Data exported successfully');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-xl">
            <Zap className="h-5 w-5" />
            Token Usage Analytics
          </h2>
          <p className="text-muted-foreground text-sm">
            Monitor token consumption, costs, and efficiency across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleExport('metrics')}
            disabled={isExporting}
            size="sm"
            variant="outline"
          >
            <Download className="mr-2 h-3 w-3" />
            Export Data
          </Button>
          <Select
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as typeof timeRange)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Metrics */}
      {systemMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Total Tokens"
            value={formatNumber(systemMetrics.totalTokens)}
            subtitle="All models combined"
            icon={<Zap className="h-4 w-4" />}
          />
          <MetricCard
            title="Total Cost"
            value={formatCost(systemMetrics.totalEstimatedCost)}
            subtitle="Estimated spend"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <MetricCard
            title="Cache Savings"
            value={`${systemMetrics.cacheSavingsRate}%`}
            subtitle={`${formatNumber(systemMetrics.totalCachedTokens)} cached`}
            icon={<Activity className="h-4 w-4" />}
            trend={{
              value: systemMetrics.cacheSavingsRate,
              isPositive: systemMetrics.cacheSavingsRate > 50,
            }}
          />
          <MetricCard
            title="Avg per Chat"
            value={formatNumber(systemMetrics.averageTokensPerChat)}
            subtitle="Tokens per conversation"
            icon={<Activity className="h-4 w-4" />}
          />
          <MetricCard
            title="Active Chats"
            value={systemMetrics.totalChatsWithUsage}
            subtitle="With token usage"
            icon={<Users className="h-4 w-4" />}
          />
        </div>
      )}

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Usage Trends</TabsTrigger>
          <TabsTrigger value="users">Top Users</TabsTrigger>
          <TabsTrigger value="models">Model Stats</TabsTrigger>
          <TabsTrigger value="chats">Chat Details</TabsTrigger>
          <TabsTrigger value="tiers">Subscription Analysis</TabsTrigger>
        </TabsList>

        {/* Usage Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {trends?.data && trends.data.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 font-medium">Token Usage Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(ts) =>
                      new Date(ts).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <YAxis tickFormatter={(v) => formatNumber(v)} />
                  <Tooltip
                    formatter={(value: number) => formatNumber(value)}
                    labelFormatter={(ts) => new Date(ts).toLocaleString()}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tokens"
                    stroke="#8884d8"
                    name="Tokens"
                  />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="#82ca9d"
                    name="Messages"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {trends?.data && trends.data.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 font-medium">Cost Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trends.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(ts) =>
                      new Date(ts).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <YAxis tickFormatter={(v) => formatCost(v)} />
                  <Tooltip formatter={(value: number) => formatCost(value)} />
                  <Bar dataKey="cost" fill="#0088FE" name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </TabsContent>

        {/* Top Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Top Token Consumers</h3>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tokens">By Tokens</SelectItem>
                <SelectItem value="cost">By Cost</SelectItem>
                <SelectItem value="chats">By Chats</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {userMetrics && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Total Tokens</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Chats</TableHead>
                    <TableHead>Avg/Chat</TableHead>
                    <TableHead>Cache Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userMetrics.map((user) => (
                    <TableRow
                      key={user.userId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedUserId(user.userId)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.displayName || 'Anonymous'}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {user.walletAddress?.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.subscription?.tier === 'pro_plus'
                              ? 'default'
                              : user.subscription?.tier === 'pro'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {user.subscription?.tier || 'free'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatNumber(user.metrics.totalTokens)}</TableCell>
                      <TableCell>{formatCost(user.metrics.totalCost)}</TableCell>
                      <TableCell>{user.metrics.chatCount}</TableCell>
                      <TableCell>
                        {formatNumber(user.metrics.averageTokensPerChat)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={user.metrics.cacheSavingsRate}
                            className="h-2 w-16"
                          />
                          <span className="text-sm">
                            {user.metrics.cacheSavingsRate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Model Stats Tab */}
        <TabsContent value="models" className="space-y-4">
          {modelStats && modelStats.length > 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="mb-4 font-medium">Model Usage Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={modelStats}
                        dataKey="totalTokens"
                        nameKey="model"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label={(entry) => entry.model}
                      >
                        {modelStats.map((_stat, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatNumber(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                  <h3 className="mb-4 font-medium">Cost by Model</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={modelStats.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="model"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tickFormatter={(v) => formatCost(v)} />
                      <Tooltip formatter={(value: number) => formatCost(value)} />
                      <Bar dataKey="totalCost" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Chats</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Total Tokens</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Avg/Message</TableHead>
                      <TableHead>Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelStats.map((model) => (
                      <TableRow key={model.model}>
                        <TableCell className="font-medium">{model.model}</TableCell>
                        <TableCell>{model.chatCount}</TableCell>
                        <TableCell>{formatNumber(model.messageCount)}</TableCell>
                        <TableCell>{formatNumber(model.totalTokens)}</TableCell>
                        <TableCell>{formatCost(model.totalCost)}</TableCell>
                        <TableCell>
                          {formatNumber(model.averageTokensPerMessage)}
                        </TableCell>
                        <TableCell>{model.uniqueUsers}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Chat Details Tab */}
        <TabsContent value="chats" className="space-y-4">
          {selectedUserId && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm">
                Showing chats for selected user.{' '}
                <button
                  onClick={() => setSelectedUserId(undefined)}
                  className="text-primary underline"
                >
                  Clear filter
                </button>
              </p>
            </div>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chat Title</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Total Tokens</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chatMetrics?.map((chat) => (
                  <TableRow key={chat.chatId}>
                    <TableCell className="font-medium">{chat.title}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {chat.owner?.displayName || 'Anonymous'}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {chat.owner?.walletAddress?.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{chat.model}</Badge>
                    </TableCell>
                    <TableCell>{chat.messageCount}</TableCell>
                    <TableCell>
                      {formatNumber(chat.tokenUsage.totalTokens)}
                    </TableCell>
                    <TableCell>
                      {formatCost(chat.tokenUsage.totalEstimatedCost)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'text-sm',
                          chat.efficiency < 500
                            ? 'text-green-600'
                            : chat.efficiency < 1000
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        )}
                      >
                        {formatNumber(chat.efficiency)} tok/msg
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {chatStatus === 'CanLoadMore' && (
              <div className="p-4 text-center">
                <button
                  onClick={() => loadMoreChats(10)}
                  disabled={false}
                  className="text-primary underline"
                >
                  Load More
                </button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Subscription Analysis Tab */}
        <TabsContent value="tiers" className="space-y-4">
          {tierMetrics && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {tierMetrics.map((tier) => (
                  <Card key={tier.tier} className="p-6">
                    <h3 className="mb-4 font-medium capitalize">{tier.tier} Tier</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Users</span>
                        <span className="font-medium">{tier.userCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Total Tokens
                        </span>
                        <span className="font-medium">
                          {formatNumber(tier.totalTokens)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Total Cost
                        </span>
                        <span className="font-medium">
                          {formatCost(tier.totalCost)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Avg/User
                        </span>
                        <span className="font-medium">
                          {formatCost(tier.averageCostPerUser)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Chats</span>
                        <span className="font-medium">{tier.totalChats}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-6">
                <h3 className="mb-4 font-medium">Tier Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tierMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" />
                    <YAxis yAxisId="left" tickFormatter={(v) => formatNumber(v)} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(v) => formatCost(v)}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name.includes('Cost') ? formatCost(value) : formatNumber(value)
                      }
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="totalTokens"
                      fill="#8884d8"
                      name="Total Tokens"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="averageCostPerUser"
                      fill="#82ca9d"
                      name="Avg Cost/User"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}