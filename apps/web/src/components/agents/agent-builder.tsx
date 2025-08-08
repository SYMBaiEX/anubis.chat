'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Result, ok, err } from '@/lib/types/result';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bot,
  Brain,
  Code,
  Database,
  Eye,
  FileText,
  Globe,
  HelpCircle,
  Image,
  Layers,
  MessageSquare,
  Palette,
  Plus,
  Save,
  Settings,
  Sparkles,
  TestTube,
  Trash2,
  Upload,
  Wand2,
  X,
  Zap,
  Shield,
  Lock,
  Unlock,
  RefreshCw,
  Copy,
  Download,
  Share2,
  GitBranch,
  Terminal,
  Cpu,
  Activity,
  TrendingUp,
  Coins,
  Vote,
  BarChart3,
  Wallet,
  Link,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentCapabilitySelector } from './agent-capability-selector';
import { AgentToolBuilder } from './agent-tool-builder';
import { AgentPersonalityEditor } from './agent-personality-editor';
import { AgentTestingPanel } from './agent-testing-panel';
import { AgentTemplateGallery } from './agent-template-gallery';
import type { Agent, AgentTemplate } from './types';

interface AgentBuilderProps {
  onSave?: (agent: Agent) => void;
  onCancel?: () => void;
  initialAgent?: Partial<Agent>;
}

export function AgentBuilder({ onSave, onCancel, initialAgent }: AgentBuilderProps) {
  const [activeTab, setActiveTab] = useState('basics');
  const [agentData, setAgentData] = useState<Agent>({
    name: initialAgent?.name || '',
    description: initialAgent?.description || '',
    avatar: initialAgent?.avatar || '',
    type: initialAgent?.type || 'general',
    personality: initialAgent?.personality || {
      tone: 'professional',
      style: 'concise',
      traits: [],
      customPrompts: [],
    },
    capabilities: initialAgent?.capabilities || [],
    tools: initialAgent?.tools || [],
    knowledge: initialAgent?.knowledge || [],
    settings: initialAgent?.settings || {
      temperature: 0.7,
      maxTokens: 2000,
      streamResponses: true,
      memoryEnabled: true,
      contextWindow: 10,
    },
    permissions: initialAgent?.permissions || {
      canExecuteTrades: false,
      maxTransactionValue: 100,
      requiresApproval: true,
      allowedChains: ['solana'],
    },
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const agentTypes = [
    { value: 'general', label: 'General Assistant', icon: Bot, color: 'bg-gray-500' },
    { value: 'trading', label: 'Trading Agent', icon: TrendingUp, color: 'bg-green-500' },
    { value: 'defi', label: 'DeFi Specialist', icon: Coins, color: 'bg-blue-500' },
    { value: 'nft', label: 'NFT Expert', icon: Image, color: 'bg-purple-500' },
    { value: 'dao', label: 'DAO Manager', icon: Vote, color: 'bg-orange-500' },
    { value: 'portfolio', label: 'Portfolio Analyst', icon: BarChart3, color: 'bg-indigo-500' },
    { value: 'developer', label: 'Code Assistant', icon: Code, color: 'bg-pink-500' },
    { value: 'research', label: 'Research Agent', icon: Database, color: 'bg-teal-500' },
  ];

  const validateAgent = () => {
    const newErrors: Record<string, string> = {};
    if (!agentData.name) newErrors.name = 'Agent name is required';
    if (!agentData.description) newErrors.description = 'Description is required';
    if (agentData.capabilities.length === 0) newErrors.capabilities = 'Select at least one capability';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (): Promise<Result<Agent, Error>> => {
    if (!validateAgent()) {
      return err(new Error('Validation failed. Please check all required fields.'));
    }
    
    setIsSaving(true);
    
    try {
      // Simulate save operation (replace with actual API call)
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate potential failure (5% chance)
          if (Math.random() < 0.05) {
            reject(new Error('Failed to save agent. Please try again.'));
          } else {
            resolve(true);
          }
        }, 1000);
      });
      
      // Call the onSave callback if provided
      onSave?.(agentData);
      
      setIsSaving(false);
      
      // Return success result with the saved agent data
      return ok(agentData);
    } catch (error) {
      setIsSaving(false);
      
      // Handle different error types
      if (error instanceof Error) {
        return err(error);
      } else if (typeof error === 'string') {
        return err(new Error(error));
      } else {
        return err(new Error('An unexpected error occurred while saving the agent.'));
      }
    }
  };

  const getTypeIcon = (type: string) => {
    const agentType = agentTypes.find(t => t.value === type);
    const IconComponent = agentType?.icon || Bot;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarImage src={agentData.avatar} />
                  <AvatarFallback>
                    {getTypeIcon(agentData.type)}
                  </AvatarFallback>
                </Avatar>
                <Badge className="absolute -bottom-1 -right-1 h-5 px-1" variant="secondary">
                  {agentData.type}
                </Badge>
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {agentData.name || 'New Agent'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {agentData.description || 'Configure your custom AI agent'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {/* Template logic */}}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {/* Share logic */}}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  const result = await handleSave();
                  if (!result.ok) {
                    // Handle error - you may want to show a toast or error message
                    console.error('Failed to save agent:', result.error.message);
                  }
                }} 
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Agent
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b px-6">
              <TabsList className="h-12 w-full justify-start rounded-none border-0 bg-transparent p-0">
                <TabsTrigger
                  value="basics"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Basics
                  {errors.name || errors.description ? (
                    <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger
                  value="capabilities"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Capabilities
                  {errors.capabilities ? (
                    <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger
                  value="tools"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Terminal className="mr-2 h-4 w-4" />
                  Tools & APIs
                </TabsTrigger>
                <TabsTrigger
                  value="personality"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Personality
                </TabsTrigger>
                <TabsTrigger
                  value="knowledge"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Knowledge Base
                </TabsTrigger>
                <TabsTrigger
                  value="permissions"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Permissions
                </TabsTrigger>
                <TabsTrigger
                  value="testing"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  Test
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[calc(100%-3rem)]">
              <div className="p-6">
                {/* Basics Tab */}
                <TabsContent value="basics" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        Define your agent's identity and purpose
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Agent Name *</Label>
                          <Input
                            id="name"
                            placeholder="e.g., Trading Pro, DeFi Helper"
                            value={agentData.name}
                            onChange={(e) => setAgentData(prev => ({ ...prev, name: e.target.value }))}
                            className={errors.name ? 'border-destructive' : ''}
                          />
                          {errors.name && (
                            <p className="text-sm text-destructive">{errors.name}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type">Agent Type</Label>
                          <Select
                            value={agentData.type}
                            onValueChange={(value) => setAgentData(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger id="type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {agentTypes.map(type => {
                                const TypeIcon = type.icon;
                                return (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center">
                                      <TypeIcon className="mr-2 h-4 w-4" />
                                      {type.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what your agent does and its key capabilities..."
                          value={agentData.description}
                          onChange={(e) => setAgentData(prev => ({ ...prev, description: e.target.value }))}
                          className={cn("min-h-[100px]", errors.description ? 'border-destructive' : '')}
                        />
                        {errors.description && (
                          <p className="text-sm text-destructive">{errors.description}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avatar">Avatar URL</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="avatar"
                            placeholder="https://example.com/avatar.png"
                            value={agentData.avatar}
                            onChange={(e) => setAgentData(prev => ({ ...prev, avatar: e.target.value }))}
                          />
                          <Button variant="outline" size="icon">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Quick Templates</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          <AgentTemplateGallery
                            onSelectTemplate={(template: AgentTemplate) => {
                              setAgentData(prev => ({ ...prev, ...template.config }));
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Capabilities Tab */}
                <TabsContent value="capabilities" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent Capabilities</CardTitle>
                      <CardDescription>
                        Select what your agent can do
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AgentCapabilitySelector
                        selected={agentData.capabilities}
                        onChange={(capabilities) => setAgentData(prev => ({ ...prev, capabilities }))}
                      />
                      {errors.capabilities && (
                        <p className="mt-2 text-sm text-destructive">{errors.capabilities}</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tools Tab */}
                <TabsContent value="tools" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tools & API Integrations</CardTitle>
                      <CardDescription>
                        Configure external tools and APIs your agent can use
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AgentToolBuilder
                        tools={agentData.tools}
                        onChange={(tools) => setAgentData(prev => ({ ...prev, tools }))}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Personality Tab */}
                <TabsContent value="personality" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent Personality</CardTitle>
                      <CardDescription>
                        Define how your agent communicates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AgentPersonalityEditor
                        personality={agentData.personality}
                        onChange={(personality) => setAgentData(prev => ({ ...prev, personality }))}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Knowledge Base Tab */}
                <TabsContent value="knowledge" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Knowledge Base</CardTitle>
                      <CardDescription>
                        Upload documents and data for your agent to reference
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Drop files here</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Support for PDF, TXT, MD, JSON files
                        </p>
                        <Button className="mt-4" variant="outline">
                          <Upload className="mr-2 h-4 w-4" />
                          Browse Files
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent value="permissions" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security & Permissions</CardTitle>
                      <CardDescription>
                        Control what your agent is allowed to do
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Execute Trades</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow agent to execute blockchain transactions
                            </p>
                          </div>
                          <Switch
                            checked={agentData.permissions.canExecuteTrades}
                            onCheckedChange={(checked) => 
                              setAgentData(prev => ({
                                ...prev,
                                permissions: { ...prev.permissions, canExecuteTrades: checked }
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Require Approval</Label>
                            <p className="text-sm text-muted-foreground">
                              Require user confirmation for sensitive actions
                            </p>
                          </div>
                          <Switch
                            checked={agentData.permissions.requiresApproval}
                            onCheckedChange={(checked) => 
                              setAgentData(prev => ({
                                ...prev,
                                permissions: { ...prev.permissions, requiresApproval: checked }
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Maximum Transaction Value (SOL)</Label>
                          <div className="flex items-center space-x-4">
                            <Slider
                              value={[agentData.permissions.maxTransactionValue]}
                              onValueChange={([value]) => 
                                setAgentData(prev => ({
                                  ...prev,
                                  permissions: { ...prev.permissions, maxTransactionValue: value }
                                }))
                              }
                              max={1000}
                              step={10}
                              className="flex-1"
                            />
                            <span className="w-20 text-right font-mono text-sm">
                              {agentData.permissions.maxTransactionValue} SOL
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Testing Tab */}
                <TabsContent value="testing" className="mt-0 space-y-6">
                  <AgentTestingPanel agent={agentData} />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default AgentBuilder;