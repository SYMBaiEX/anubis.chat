'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Check,
  X,
  Info,
  Zap,
  TrendingUp,
  DollarSign,
  Image,
  Vote,
  BarChart3,
  Shield,
  Globe,
  Database,
  Code,
  MessageSquare,
  FileText,
  Link,
  Wallet,
  RefreshCw,
  Activity,
  Layers,
  GitBranch,
  Terminal,
  Cpu,
  Lock,
  Unlock,
  Eye,
  Hash,
  Settings,
  Users,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Camera,
  Mic,
  Video,
  Music,
  Film,
  Book,
  Bookmark,
  Heart,
  Star,
  Flag,
  Award,
  Gift,
  Package,
  ShoppingCart,
  CreditCard,
  PieChart,
  TrendingDown,
  Briefcase,
  Home,
  Building,
  Landmark,
  Map,
  Navigation,
  Compass,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Wind,
  Thermometer,
  Droplet,
  Flame,
  Zap as Lightning,
  Bell,
  Send,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentCapability } from './types';

interface Capability extends Omit<AgentCapability, 'enabled'> {
  premium?: boolean;
  beta?: boolean;
  dependencies?: string[];
  incompatible?: string[];
}

interface AgentCapabilitySelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelections?: number;
}

const capabilities: Capability[] = [
  // Blockchain & Trading
  {
    id: 'trading',
    name: 'Token Trading',
    description: 'Execute swaps and trades on DEXs',
    category: 'Trading',
    icon: TrendingUp,
  },
  {
    id: 'defi',
    name: 'DeFi Operations',
    description: 'Interact with lending, staking, and yield protocols',
    category: 'DeFi',
    icon: DollarSign,
  },
  {
    id: 'nft',
    name: 'NFT Management',
    description: 'Create, buy, sell, and manage NFTs',
    category: 'NFT',
    icon: Image,
  },
  {
    id: 'dao',
    name: 'DAO Governance',
    description: 'Participate in DAO voting and proposals',
    category: 'Governance',
    icon: Vote,
  },
  {
    id: 'portfolio',
    name: 'Portfolio Analytics',
    description: 'Track and analyze portfolio performance',
    category: 'Analytics',
    icon: BarChart3,
  },
  {
    id: 'wallet',
    name: 'Wallet Management',
    description: 'Manage multiple wallets and accounts',
    category: 'Wallet',
    icon: Wallet,
  },
  {
    id: 'price-alerts',
    name: 'Price Alerts',
    description: 'Monitor and alert on price movements',
    category: 'Monitoring',
    icon: Activity,
    beta: true,
  },
  {
    id: 'arbitrage',
    name: 'Arbitrage Detection',
    description: 'Identify arbitrage opportunities',
    category: 'Trading',
    icon: RefreshCw,
    premium: true,
  },
  
  // Data & Analytics
  {
    id: 'market-analysis',
    name: 'Market Analysis',
    description: 'Analyze market trends and patterns',
    category: 'Analytics',
    icon: PieChart,
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Analyze social media and news sentiment',
    category: 'Analytics',
    icon: MessageSquare,
    beta: true,
  },
  {
    id: 'technical-analysis',
    name: 'Technical Analysis',
    description: 'Perform technical chart analysis',
    category: 'Analytics',
    icon: TrendingDown,
  },
  {
    id: 'on-chain-data',
    name: 'On-chain Analytics',
    description: 'Access and analyze blockchain data',
    category: 'Analytics',
    icon: Database,
  },
  
  // Development & Automation
  {
    id: 'smart-contracts',
    name: 'Smart Contract Interaction',
    description: 'Read and write to smart contracts',
    category: 'Development',
    icon: Code,
  },
  {
    id: 'automation',
    name: 'Task Automation',
    description: 'Automate repetitive tasks and workflows',
    category: 'Automation',
    icon: Lightning,
  },
  {
    id: 'api-integration',
    name: 'API Integration',
    description: 'Connect to external APIs and services',
    category: 'Integration',
    icon: Link,
  },
  {
    id: 'webhooks',
    name: 'Webhook Support',
    description: 'Send and receive webhook events',
    category: 'Integration',
    icon: Globe,
    beta: true,
  },
  
  // Security & Privacy
  {
    id: 'security-audit',
    name: 'Security Auditing',
    description: 'Audit smart contracts and transactions',
    category: 'Security',
    icon: Shield,
    premium: true,
  },
  {
    id: 'privacy',
    name: 'Privacy Features',
    description: 'Enhanced privacy and anonymity features',
    category: 'Security',
    icon: Lock,
  },
  {
    id: 'multi-sig',
    name: 'Multi-signature',
    description: 'Support for multi-signature operations',
    category: 'Security',
    icon: Users,
    premium: true,
  },
  
  // Communication
  {
    id: 'notifications',
    name: 'Push Notifications',
    description: 'Send alerts and notifications',
    category: 'Communication',
    icon: Bell,
  },
  {
    id: 'email',
    name: 'Email Integration',
    description: 'Send and receive emails',
    category: 'Communication',
    icon: Mail,
  },
  {
    id: 'discord',
    name: 'Discord Integration',
    description: 'Integrate with Discord servers',
    category: 'Communication',
    icon: MessageSquare,
    beta: true,
  },
  {
    id: 'telegram',
    name: 'Telegram Integration',
    description: 'Connect to Telegram bots and channels',
    category: 'Communication',
    icon: Send,
    beta: true,
  },
  
  // Advanced Features
  {
    id: 'ai-predictions',
    name: 'AI Predictions',
    description: 'Machine learning price predictions',
    category: 'AI',
    icon: Brain,
    premium: true,
  },
  {
    id: 'natural-language',
    name: 'Natural Language Processing',
    description: 'Advanced NLP capabilities',
    category: 'AI',
    icon: MessageSquare,
  },
  {
    id: 'computer-vision',
    name: 'Image Analysis',
    description: 'Analyze charts and images',
    category: 'AI',
    icon: Eye,
    premium: true,
  },
  {
    id: 'voice-commands',
    name: 'Voice Commands',
    description: 'Support for voice interactions',
    category: 'AI',
    icon: Mic,
    beta: true,
  },
];

const categories = [
  'All',
  'Trading',
  'DeFi',
  'NFT',
  'Analytics',
  'Development',
  'Security',
  'Communication',
  'AI',
  'Automation',
  'Integration',
  'Governance',
  'Wallet',
  'Monitoring',
];

export function AgentCapabilitySelector({ 
  selected = [], 
  onChange, 
  maxSelections 
}: AgentCapabilitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hoveredCapability, setHoveredCapability] = useState<string | null>(null);

  const filteredCapabilities = capabilities.filter(cap => {
    const matchesSearch = cap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cap.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || cap.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleCapability = (capabilityId: string) => {
    if (selected.includes(capabilityId)) {
      onChange(selected.filter(id => id !== capabilityId));
    } else {
      if (maxSelections && selected.length >= maxSelections) {
        return;
      }
      
      // Check for incompatibilities
      const capability = capabilities.find(c => c.id === capabilityId);
      if (capability?.incompatible) {
        const hasIncompatible = capability.incompatible.some(id => selected.includes(id));
        if (hasIncompatible) {
          // Show warning
          return;
        }
      }
      
      onChange([...selected, capabilityId]);
    }
  };

  const isSelected = (capabilityId: string) => selected.includes(capabilityId);

  const getCapabilityStatus = (capability: Capability) => {
    if (capability.premium) return { label: 'PRO', color: 'bg-gradient-to-r from-yellow-500 to-orange-500' };
    if (capability.beta) return { label: 'BETA', color: 'bg-blue-500' };
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search capabilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="flex-shrink-0"
                >
                  {category}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Selected Capabilities Summary */}
      {selected.length > 0 && (
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Selected: {selected.length}
              {maxSelections && ` / ${maxSelections}`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="h-7 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selected.map(id => {
              const cap = capabilities.find(c => c.id === id);
              if (!cap) return null;
              return (
                <Badge key={id} variant="secondary" className="pr-1">
                  <cap.icon className="mr-1 h-3 w-3" />
                  {cap.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => toggleCapability(id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Capabilities Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCapabilities.map((capability, index) => {
          const isCapabilitySelected = isSelected(capability.id);
          const status = getCapabilityStatus(capability);
          const Icon = capability.icon;

          return (
            <motion.div
              key={capability.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              onMouseEnter={() => setHoveredCapability(capability.id)}
              onMouseLeave={() => setHoveredCapability(null)}
            >
              <button
                onClick={() => toggleCapability(capability.id)}
                className={cn(
                  "relative w-full rounded-lg border p-4 text-left transition-all",
                  isCapabilitySelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-accent/50",
                  "group"
                )}
              >
                {/* Status Badge */}
                {status && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className={cn("text-xs text-white", status.color)}>
                      {status.label}
                    </Badge>
                  </div>
                )}

                {/* Selection Indicator */}
                {isCapabilitySelected && (
                  <div className="absolute top-2 right-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                    isCapabilitySelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-sm">{capability.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {capability.description}
                    </p>
                    
                    {/* Dependencies/Requirements */}
                    {capability.dependencies && capability.dependencies.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Info className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Requires: {capability.dependencies.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Effect */}
                {hoveredCapability === capability.id && !isCapabilitySelected && (
                  <motion.div
                    className="absolute inset-0 rounded-lg border-2 border-primary/20 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCapabilities.length === 0 && (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-sm font-medium">No capabilities found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}

export default AgentCapabilitySelector;