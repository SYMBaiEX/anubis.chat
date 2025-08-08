'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useWallet } from '@/hooks/useWallet';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Wallet, 
  TrendingUp, 
  Activity,
  Bot,
  FileText,
  Settings,
  Plus,
  ChevronRight,
  Clock,
  Zap,
  Database,
  Brain,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Users,
  Shield,
  Sparkles,
  Cpu,
  Network,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalChats: number;
  messagesThisMonth: number;
  tokensUsed: number;
  activeAgents: number;
  walletBalance: number;
  transactions: number;
}

interface RecentChat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  model: string;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error';
  lastActive: string;
  tasksCompleted: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthContext();
  const { publicKey, balance, formatAddress } = useWallet();
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [stats, setStats] = useState<DashboardStats>({
    totalChats: 0,
    messagesThisMonth: 0,
    tokensUsed: 0,
    activeAgents: 0,
    walletBalance: balance || 0,
    transactions: 0
  });
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalChats: 24,
        messagesThisMonth: 156,
        tokensUsed: 45230,
        activeAgents: 3,
        walletBalance: balance || 2.456,
        transactions: 8
      });
      
      setRecentChats([
        {
          id: '1',
          title: 'DeFi Strategy Discussion',
          lastMessage: 'Analyzed yield farming opportunities on Raydium...',
          timestamp: '2 hours ago',
          model: 'Claude 3.5'
        },
        {
          id: '2',
          title: 'NFT Market Analysis',
          lastMessage: 'The floor price for DeGods has increased by 15%...',
          timestamp: '5 hours ago',
          model: 'GPT-4o'
        },
        {
          id: '3',
          title: 'Smart Contract Audit',
          lastMessage: 'Found 2 medium severity issues in the token contract...',
          timestamp: '1 day ago',
          model: 'DeepSeek v3'
        }
      ]);
      
      setAgents([
        {
          id: '1',
          name: 'Trading Bot Alpha',
          type: 'trading',
          status: 'active',
          lastActive: '5 min ago',
          tasksCompleted: 142
        },
        {
          id: '2',
          name: 'Portfolio Manager',
          type: 'portfolio',
          status: 'idle',
          lastActive: '1 hour ago',
          tasksCompleted: 89
        },
        {
          id: '3',
          name: 'DeFi Assistant',
          type: 'defi',
          status: 'active',
          lastActive: 'Just now',
          tasksCompleted: 256
        }
      ]);
      
      setLoading(false);
    }, 1000);
  }, [isAuthenticated, router, balance]);

  const quickActions = [
    {
      title: 'New Chat',
      description: 'Start a conversation with AI',
      icon: <MessageSquare className="h-5 w-5 text-blue-500" />,
      action: () => router.push('/chat'),
      color: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      title: 'Deploy Agent',
      description: 'Create a new AI agent',
      icon: <Bot className="h-5 w-5 text-green-500" />,
      action: () => router.push('/agents/new'),
      color: 'from-green-500/20 to-emerald-500/20'
    },
    {
      title: 'Upload Document',
      description: 'Add to knowledge base',
      icon: <FileText className="h-5 w-5 text-purple-500" />,
      action: () => router.push('/documents'),
      color: 'from-purple-500/20 to-pink-500/20'
    },
    {
      title: 'View Transactions',
      description: 'Blockchain activity',
      icon: <Activity className="h-5 w-5 text-orange-500" />,
      action: () => router.push('/transactions'),
      color: 'from-orange-500/20 to-red-500/20'
    }
  ];

  const statCards = [
    {
      title: 'Total Chats',
      value: stats.totalChats,
      change: '+12%',
      trend: 'up',
      icon: <MessageSquare className="h-4 w-4" />
    },
    {
      title: 'Messages This Month',
      value: stats.messagesThisMonth,
      change: '+23%',
      trend: 'up',
      icon: <Zap className="h-4 w-4" />
    },
    {
      title: 'Tokens Used',
      value: stats.tokensUsed.toLocaleString(),
      change: '-5%',
      trend: 'down',
      icon: <Cpu className="h-4 w-4" />
    },
    {
      title: 'Active Agents',
      value: stats.activeAgents,
      change: '0%',
      trend: 'neutral',
      icon: <Bot className="h-4 w-4" />
    },
    {
      title: 'Wallet Balance',
      value: `${stats.walletBalance.toFixed(3)} SOL`,
      change: '+8%',
      trend: 'up',
      icon: <Wallet className="h-4 w-4" />
    },
    {
      title: 'Transactions',
      value: stats.transactions,
      change: '+4',
      trend: 'up',
      icon: <Activity className="h-4 w-4" />
    }
  ];

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background pointer-events-none" />
      
      <div className="relative container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-isis-primary" />
                Welcome back, {formatAddress(8)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/wallet')}>
                <Wallet className="h-4 w-4 mr-2" />
                {stats.walletBalance.toFixed(3)} SOL
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="group p-5 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur card-hover"
              onClick={action.action}
            >
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className="p-4 bg-card/50 backdrop-blur hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  {stat.icon}
                </div>
                <Badge 
                  variant={stat.trend === 'up' ? 'default' : stat.trend === 'down' ? 'destructive' : 'secondary'}
                  className="text-xs px-2 py-0.5"
                >
                  {stat.trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                  {stat.trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                  {stat.change}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4 bg-muted/50 backdrop-blur">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Usage Chart */}
              <Card className="p-6 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-chart-1/10">
                      <BarChart3 className="h-4 w-4 text-chart-1" />
                    </div>
                    Token Usage
                  </h3>
                  <select 
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="text-xs px-2 py-1 rounded-md bg-muted border border-border"
                  >
                    <option value="24h">24 hours</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                  </select>
                </div>
                <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="relative">
                      <Cpu className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                    </div>
                    <p className="text-sm text-muted-foreground">Chart visualization coming soon</p>
                  </div>
                </div>
              </Card>

              {/* Active Sessions */}
              <Card className="p-6 bg-card/50 backdrop-blur">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Activity className="h-4 w-4 text-green-500" />
                  </div>
                  Active Sessions
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                        <div className="absolute inset-0 h-3 w-3 bg-green-500 rounded-full animate-ping" />
                      </div>
                      <div>
                        <p className="font-medium">Chat Session #24</p>
                        <p className="text-xs text-muted-foreground">Claude 3.5 Sonnet</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                        <div className="absolute inset-0 h-3 w-3 bg-green-500 rounded-full animate-ping" />
                      </div>
                      <div>
                        <p className="font-medium">Trading Bot Alpha</p>
                        <p className="text-xs text-muted-foreground">Monitoring markets</p>
                      </div>
                    </div>
                    <Badge variant="outline">Running</Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* Subscription Status */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-background border-primary/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-isis-primary/10">
                    <Sparkles className="h-4 w-4 text-isis-primary" />
                  </div>
                  Subscription Status
                </h3>
                <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-3 py-1">
                  Pro Plan
                </Badge>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Messages</span>
                    <span className="font-medium">65%</span>
                  </div>
                  <Progress value={65} className="h-2 bg-muted" />
                  <p className="text-xs text-muted-foreground">650 of 1,000 used</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Storage</span>
                    <span className="font-medium">40%</span>
                  </div>
                  <Progress value={40} className="h-2 bg-muted" />
                  <p className="text-xs text-muted-foreground">4 GB of 10 GB used</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">API Calls</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <Progress value={25} className="h-2 bg-muted" />
                  <p className="text-xs text-muted-foreground">2,500 of 10,000 used</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Renews on January 31, 2025
                </p>
                <Button variant="outline" size="sm">
                  Manage Plan
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="chats" className="space-y-4">
            <Card className="p-6 bg-card/50 backdrop-blur">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Recent Conversations</h3>
                <Button size="sm" onClick={() => router.push('/chat')} className="button-press">
                  <Plus className="h-4 w-4 mr-1" />
                  New Chat
                </Button>
              </div>
              <div className="space-y-3">
                {recentChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="group p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-all card-hover"
                    onClick={() => router.push(`/chat/${chat.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">{chat.title}</h4>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {chat.model}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {chat.lastMessage}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {chat.timestamp}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <Card className="p-6 bg-card/50 backdrop-blur">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">AI Agents</h3>
                <Button size="sm" onClick={() => router.push('/agents/new')} className="button-press">
                  <Plus className="h-4 w-4 mr-1" />
                  Deploy Agent
                </Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id} className="p-5 bg-card/80 hover:shadow-lg transition-all card-hover group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 group-hover:scale-110 transition-transform">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{agent.name}</h4>
                          <p className="text-xs text-muted-foreground capitalize">{agent.type} Agent</p>
                        </div>
                      </div>
                      <Badge
                        variant={agent.status === 'active' ? 'default' : agent.status === 'error' ? 'destructive' : 'secondary'}
                        className={agent.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                      >
                        {agent.status === 'active' && <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-1" />}
                        {agent.status}
                      </Badge>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last Active
                        </span>
                        <span className="font-medium">{agent.lastActive}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Tasks
                        </span>
                        <span className="font-medium">{agent.tasksCompleted} completed</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full button-press"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/agents/${agent.id}`);
                      }}
                    >
                      Manage Agent
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-card/50 backdrop-blur">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-chart-2/10">
                    <Brain className="h-4 w-4 text-chart-2" />
                  </div>
                  Model Usage Distribution
                </h3>
                <div className="space-y-4">
                  {[
                    { name: 'Claude 3.5', value: 45, color: 'bg-primary' },
                    { name: 'GPT-4o', value: 30, color: 'bg-accent' },
                    { name: 'DeepSeek v3', value: 15, color: 'bg-chart-3' },
                    { name: 'Gemini 2.0', value: 10, color: 'bg-chart-4' }
                  ].map((model, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-muted-foreground">{model.value}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${model.color} transition-all duration-500`}
                          style={{ width: `${model.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                  Cost Analysis
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">This Month</span>
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="text-2xl font-bold">$24.50</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Last Month</span>
                      <span className="font-semibold">$19.80</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Average Daily</span>
                      <span className="font-semibold">$0.82</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Projected Monthly</span>
                      <span className="font-semibold">$25.42</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full button-press">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Detailed Report
                  </Button>
                </div>
              </Card>
            </div>

            {/* Additional Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-card/50 backdrop-blur">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">Active Users</span>
                </div>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-xs text-muted-foreground mt-1">+12% from last week</p>
              </Card>
              <Card className="p-4 bg-card/50 backdrop-blur">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Network className="h-4 w-4 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium">API Latency</span>
                </div>
                <p className="text-2xl font-bold">142ms</p>
                <p className="text-xs text-muted-foreground mt-1">Within normal range</p>
              </Card>
              <Card className="p-4 bg-card/50 backdrop-blur">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Shield className="h-4 w-4 text-orange-500" />
                  </div>
                  <span className="text-sm font-medium">Security Score</span>
                </div>
                <p className="text-2xl font-bold">98/100</p>
                <p className="text-xs text-muted-foreground mt-1">Excellent protection</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}