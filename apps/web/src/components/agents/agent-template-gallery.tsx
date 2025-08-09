'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  Code,
  Coffee,
  Coins,
  Copy,
  Crown,
  Diamond,
  Download,
  Eye,
  Filter,
  Flame,
  Gamepad2,
  GitBranch,
  Globe,
  GraduationCap,
  Heart,
  Image,
  MessageSquare,
  Music,
  Package,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Vote,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type {
  Agent,
  AgentPersonality,
  AgentTemplate as AgentTemplateType,
} from './types';

interface ExtendedAgentTemplate extends Omit<AgentTemplateType, 'config'> {
  color: string;
  featured?: boolean;
  popular?: boolean;
  new?: boolean;
  downloads: number;
  rating: number;
  author: string;
  capabilities: string[];
  tools: string[];
  personality: AgentPersonality;
  config: Partial<Agent>;
}

interface AgentTemplateGalleryProps {
  onSelectTemplate: (template: AgentTemplateType) => void;
}

const templates: ExtendedAgentTemplate[] = [
  {
    id: 'trading-pro',
    name: 'Trading Pro',
    description:
      'Advanced trading agent with market analysis and automated execution',
    category: 'Trading',
    icon: TrendingUp,
    color: 'bg-green-500',
    featured: true,
    popular: true,
    downloads: 15_234,
    rating: 4.8,
    author: 'ISIS Team',
    capabilities: ['trading', 'market-analysis', 'price-alerts', 'portfolio'],
    tools: ['jupiter', 'coingecko', 'helius'],
    personality: {
      tone: 'professional',
      style: 'analytical',
      traits: ['analytical', 'proactive', 'reliable'],
    },
    config: {},
  },
  {
    id: 'defi-wizard',
    name: 'DeFi Wizard',
    description:
      'Expert in DeFi protocols, yield farming, and liquidity provision',
    category: 'DeFi',
    icon: Coins,
    color: 'bg-blue-500',
    popular: true,
    downloads: 12_456,
    rating: 4.7,
    author: 'ISIS Team',
    capabilities: ['defi', 'portfolio', 'on-chain-data'],
    tools: ['jupiter', 'helius'],
    personality: {
      tone: 'educational',
      style: 'detailed',
      traits: ['knowledgeable', 'helpful', 'patient'],
    },
    config: {},
  },
  {
    id: 'nft-curator',
    name: 'NFT Curator',
    description: 'Discover, analyze, and trade NFTs across marketplaces',
    category: 'NFT',
    icon: Image,
    color: 'bg-purple-500',
    new: true,
    downloads: 8923,
    rating: 4.6,
    author: 'ISIS Team',
    capabilities: ['nft', 'market-analysis', 'portfolio'],
    tools: ['helius', 'openai'],
    personality: {
      tone: 'enthusiastic',
      style: 'creative',
      traits: ['creative', 'curious', 'innovative'],
    },
    config: {},
  },
  {
    id: 'dao-governor',
    name: 'DAO Governor',
    description: 'Manage DAO participation, voting, and proposal creation',
    category: 'Governance',
    icon: Vote,
    color: 'bg-orange-500',
    downloads: 6789,
    rating: 4.5,
    author: 'ISIS Team',
    capabilities: ['dao', 'notifications', 'automation'],
    tools: ['helius', 'discord-webhook'],
    personality: {
      tone: 'authoritative',
      style: 'concise',
      traits: ['reliable', 'efficient', 'collaborative'],
    },
    config: {},
  },
  {
    id: 'portfolio-analyst',
    name: 'Portfolio Analyst',
    description: 'Comprehensive portfolio tracking and performance analysis',
    category: 'Analytics',
    icon: BarChart3,
    color: 'bg-indigo-500',
    featured: true,
    downloads: 11_234,
    rating: 4.9,
    author: 'ISIS Team',
    capabilities: ['portfolio', 'market-analysis', 'technical-analysis'],
    tools: ['coingecko', 'helius'],
    personality: {
      tone: 'professional',
      style: 'analytical',
      traits: ['analytical', 'detail-oriented', 'practical'],
    },
    config: {},
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    description: 'Smart contract auditing and transaction security analysis',
    category: 'Security',
    icon: Shield,
    color: 'bg-red-500',
    downloads: 4567,
    rating: 4.8,
    author: 'ISIS Team',
    capabilities: ['security-audit', 'smart-contracts', 'on-chain-data'],
    tools: ['helius', 'custom-script'],
    personality: {
      tone: 'professional',
      style: 'technical',
      traits: ['detail-oriented', 'reliable', 'knowledgeable'],
    },
    config: {},
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'Deep blockchain research and data analysis',
    category: 'Research',
    icon: Brain,
    color: 'bg-teal-500',
    new: true,
    downloads: 3456,
    rating: 4.7,
    author: 'Community',
    capabilities: ['on-chain-data', 'sentiment', 'api-integration'],
    tools: ['openai', 'coingecko', 'postgres'],
    personality: {
      tone: 'educational',
      style: 'detailed',
      traits: ['curious', 'knowledgeable', 'helpful'],
    },
    config: {},
  },
  {
    id: 'code-helper',
    name: 'Solana Developer',
    description: 'Assist with Solana development and smart contract coding',
    category: 'Development',
    icon: Code,
    color: 'bg-pink-500',
    downloads: 5678,
    rating: 4.6,
    author: 'Community',
    capabilities: ['smart-contracts', 'api-integration', 'automation'],
    tools: ['helius', 'custom-script'],
    personality: {
      tone: 'professional',
      style: 'technical',
      traits: ['helpful', 'knowledgeable', 'efficient'],
    },
    config: {},
  },
  {
    id: 'social-trader',
    name: 'Social Trader',
    description: 'Copy trading and social sentiment-based strategies',
    category: 'Trading',
    icon: Users,
    color: 'bg-cyan-500',
    new: true,
    downloads: 2345,
    rating: 4.4,
    author: 'Community',
    capabilities: ['trading', 'sentiment', 'notifications'],
    tools: ['jupiter', 'discord-webhook', 'telegram'],
    personality: {
      tone: 'friendly',
      style: 'casual',
      traits: ['collaborative', 'optimistic', 'adaptable'],
    },
    config: {},
  },
  {
    id: 'yield-farmer',
    name: 'Yield Farmer',
    description: 'Optimize yield farming strategies across protocols',
    category: 'DeFi',
    icon: Flame,
    color: 'bg-yellow-500',
    popular: true,
    downloads: 9876,
    rating: 4.7,
    author: 'Community',
    capabilities: ['defi', 'automation', 'portfolio'],
    tools: ['jupiter', 'helius'],
    personality: {
      tone: 'enthusiastic',
      style: 'analytical',
      traits: ['proactive', 'innovative', 'efficient'],
    },
    config: {},
  },
];

const categories = [
  'All',
  'Trading',
  'DeFi',
  'NFT',
  'Analytics',
  'Security',
  'Development',
  'Research',
  'Governance',
];

// Safe mapping from template categories to valid agent types
const CATEGORY_TO_TYPE_MAP: Record<string, string> = {
  Trading: 'trading',
  DeFi: 'defi',
  NFT: 'nft',
  Analytics: 'portfolio',
  Security: 'general', // No specific security type, fallback to general
  Development: 'developer',
  Research: 'research',
  Governance: 'dao',
  // Add any additional mappings as needed
};

// Default agent type for unmapped categories
const DEFAULT_AGENT_TYPE = 'general';

/**
 * Safely maps a category to a valid agent type
 * @param category - The template category
 * @returns A valid agent type string
 */
function getCategoryAgentType(category: string): string {
  return CATEGORY_TO_TYPE_MAP[category] || DEFAULT_AGENT_TYPE;
}

export function AgentTemplateGallery({
  onSelectTemplate,
}: AgentTemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] =
    useState<ExtendedAgentTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: ExtendedAgentTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      // Safely map category to a valid agent type
      const agentType = getCategoryAgentType(selectedTemplate.category);

      // Log warning if fallback was used
      if (!CATEGORY_TO_TYPE_MAP[selectedTemplate.category]) {
        console.warn(
          `Template category "${selectedTemplate.category}" has no direct mapping. Using default type "${DEFAULT_AGENT_TYPE}".`
        );
      }

      const templateForSelection: AgentTemplateType = {
        id: selectedTemplate.id,
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        icon: selectedTemplate.icon,
        category: selectedTemplate.category,
        config: {
          name: selectedTemplate.name,
          description: selectedTemplate.description,
          type: agentType, // Use the safely mapped type
          personality: selectedTemplate.personality,
          capabilities: selectedTemplate.capabilities,
          tools: selectedTemplate.tools.map((t) => ({
            id: t,
            name: t,
            type: 'api',
            enabled: true,
            config: {},
          })),
          avatar: '',
          knowledge: [],
          settings: {
            temperature: 0.7,
            maxTokens: 2000,
            streamResponses: true,
            memoryEnabled: true,
            contextWindow: 10,
          },
          permissions: {
            canExecuteTrades: false,
            maxTransactionValue: 100,
            requiresApproval: true,
            allowedChains: ['solana'],
          },
        },
      };
      onSelectTemplate(templateForSelection);
      setShowPreview(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Search and Filter */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              value={searchQuery}
            />
          </div>
          <div className="flex gap-2">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {categories.map((category) => (
                  <Button
                    className="flex-shrink-0"
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    size="sm"
                    variant={
                      selectedCategory === category ? 'default' : 'outline'
                    }
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Featured Templates */}
        {selectedCategory === 'All' && (
          <div className="space-y-3">
            <h3 className="flex items-center font-medium text-sm">
              <Star className="mr-2 h-4 w-4 text-yellow-500" />
              Featured Templates
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates
                .filter((t) => t.featured)
                .map((template, index) => {
                  const Icon = template.icon;

                  return (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      initial={{ opacity: 0, y: 20 }}
                      key={template.id}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer border-2 border-primary/20 transition-all hover:shadow-lg"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div
                              className={cn(
                                'flex h-12 w-12 items-center justify-center rounded-lg text-white',
                                template.color
                              )}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-sm">
                                    {template.name}
                                  </h4>
                                  <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                                    {template.description}
                                  </p>
                                </div>
                                {template.new && (
                                  <Badge
                                    className="ml-2 text-xs"
                                    variant="default"
                                  >
                                    NEW
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center space-x-3 text-muted-foreground text-xs">
                                  <span className="flex items-center">
                                    <Download className="mr-1 h-3 w-3" />
                                    {template.downloads.toLocaleString()}
                                  </span>
                                  <span className="flex items-center">
                                    <Star className="mr-1 h-3 w-3 text-yellow-500" />
                                    {template.rating}
                                  </span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        )}

        {/* All Templates */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">
            {selectedCategory === 'All'
              ? 'All Templates'
              : `${selectedCategory} Templates`}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates
              .filter((t) => selectedCategory !== 'All' || !t.featured)
              .map((template, index) => {
                const Icon = template.icon;

                return (
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    key={template.id}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card
                      className="cursor-pointer transition-all hover:shadow-md"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg text-white',
                              template.color
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm">
                                {template.name}
                              </h4>
                              <div className="flex gap-1">
                                {template.popular && (
                                  <Badge
                                    className="text-xs"
                                    variant="secondary"
                                  >
                                    <Trophy className="mr-1 h-3 w-3" />
                                    Popular
                                  </Badge>
                                )}
                                {template.new && (
                                  <Badge className="text-xs" variant="default">
                                    NEW
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                              {template.description}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-muted-foreground text-xs">
                                by {template.author}
                              </span>
                              <div className="flex items-center space-x-2 text-muted-foreground text-xs">
                                <span className="flex items-center">
                                  <Download className="mr-1 h-3 w-3" />
                                  {template.downloads.toLocaleString()}
                                </span>
                                <span className="flex items-center">
                                  <Star className="mr-1 h-3 w-3 text-yellow-500" />
                                  {template.rating}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </div>
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-medium text-sm">No templates found</h3>
            <p className="mt-2 text-muted-foreground text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Template Preview Dialog */}
      <Dialog onOpenChange={setShowPreview} open={showPreview}>
        <DialogContent className="max-w-2xl">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-start space-x-3">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-lg text-white',
                      selectedTemplate.color
                    )}
                  >
                    {(() => {
                      const TemplateIcon = selectedTemplate.icon;
                      return <TemplateIcon className="h-6 w-6" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <DialogTitle>{selectedTemplate.name}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {selectedTemplate.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <h4 className="mb-2 font-medium text-sm">Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Author:</span>{' '}
                      {selectedTemplate.author}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>{' '}
                      {selectedTemplate.category}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Downloads:</span>{' '}
                      {selectedTemplate.downloads.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rating:</span>{' '}
                      <span className="inline-flex items-center">
                        <Star className="mr-1 h-3 w-3 text-yellow-500" />
                        {selectedTemplate.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium text-sm">Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.capabilities.map((cap) => (
                      <Badge key={cap} variant="secondary">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium text-sm">Integrated Tools</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tools.map((tool) => (
                      <Badge key={tool} variant="outline">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium text-sm">Personality</h4>
                  <div className="space-y-1 text-muted-foreground text-sm">
                    <p>
                      Tone:{' '}
                      <span className="text-foreground">
                        {selectedTemplate.personality.tone}
                      </span>
                    </p>
                    <p>
                      Style:{' '}
                      <span className="text-foreground">
                        {selectedTemplate.personality.style}
                      </span>
                    </p>
                    <p>
                      Traits:{' '}
                      <span className="text-foreground">
                        {selectedTemplate.personality.traits.join(', ')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setShowPreview(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleUseTemplate}>
                  <Check className="mr-2 h-4 w-4" />
                  Use This Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AgentTemplateGallery;
