'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Sparkles,
  MessageSquare,
  Smile,
  Zap,
  Brain,
  Heart,
  Star,
  Music,
  Palette,
  Book,
  Gamepad2,
  Briefcase,
  GraduationCap,
  Globe,
  Users,
  Coffee,
  Rocket,
  Shield,
  Crown,
  Diamond,
  Flame,
  Plus,
  X,
  Info,
  ChevronRight,
  RefreshCw,
  Wand2,
  Clock,
  Search,
  Sun,
  Tool,
  Lightbulb,
  Activity,
  Eye,
  BarChart3,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentPersonality } from './types';

interface Personality extends AgentPersonality {
  customPrompt?: string;
  examples?: Array<{
    input: string;
    output: string;
  }>;
  creativity: number;
  formality: number;
  verbosity: number;
  humor: number;
  empathy: number;
}

interface AgentPersonalityEditorProps {
  personality: Personality;
  onChange: (personality: Personality) => void;
}

const toneOptions = [
  { value: 'professional', label: 'Professional', icon: Briefcase, description: 'Formal and business-oriented' },
  { value: 'friendly', label: 'Friendly', icon: Smile, description: 'Warm and approachable' },
  { value: 'casual', label: 'Casual', icon: Coffee, description: 'Relaxed and conversational' },
  { value: 'enthusiastic', label: 'Enthusiastic', icon: Rocket, description: 'Energetic and motivating' },
  { value: 'educational', label: 'Educational', icon: GraduationCap, description: 'Informative and teaching-focused' },
  { value: 'empathetic', label: 'Empathetic', icon: Heart, description: 'Understanding and supportive' },
  { value: 'humorous', label: 'Humorous', icon: Gamepad2, description: 'Light-hearted and fun' },
  { value: 'authoritative', label: 'Authoritative', icon: Crown, description: 'Confident and commanding' },
];

const styleOptions = [
  { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive explanations' },
  { value: 'technical', label: 'Technical', description: 'Uses domain-specific language' },
  { value: 'simple', label: 'Simple', description: 'Easy to understand' },
  { value: 'creative', label: 'Creative', description: 'Imaginative and original' },
  { value: 'analytical', label: 'Analytical', description: 'Data-driven and logical' },
  { value: 'storytelling', label: 'Storytelling', description: 'Narrative and engaging' },
  { value: 'direct', label: 'Direct', description: 'Straightforward communication' },
];

const traitOptions = [
  { value: 'helpful', label: 'Helpful', icon: Star },
  { value: 'patient', label: 'Patient', icon: Clock },
  { value: 'encouraging', label: 'Encouraging', icon: Heart },
  { value: 'knowledgeable', label: 'Knowledgeable', icon: Brain },
  { value: 'creative', label: 'Creative', icon: Palette },
  { value: 'analytical', label: 'Analytical', icon: BarChart3 },
  { value: 'proactive', label: 'Proactive', icon: Zap },
  { value: 'adaptable', label: 'Adaptable', icon: RefreshCw },
  { value: 'curious', label: 'Curious', icon: Search },
  { value: 'reliable', label: 'Reliable', icon: Shield },
  { value: 'optimistic', label: 'Optimistic', icon: Sun },
  { value: 'practical', label: 'Practical', icon: Tool },
  { value: 'innovative', label: 'Innovative', icon: Lightbulb },
  { value: 'collaborative', label: 'Collaborative', icon: Users },
  { value: 'detail-oriented', label: 'Detail-oriented', icon: Eye },
  { value: 'efficient', label: 'Efficient', icon: Activity },
];

const personalityTemplates = [
  {
    id: 'assistant',
    name: 'Professional Assistant',
    tone: 'professional',
    style: 'concise',
    traits: ['helpful', 'reliable', 'efficient'],
    icon: Briefcase,
  },
  {
    id: 'tutor',
    name: 'Friendly Tutor',
    tone: 'educational',
    style: 'detailed',
    traits: ['patient', 'encouraging', 'knowledgeable'],
    icon: GraduationCap,
  },
  {
    id: 'creative',
    name: 'Creative Partner',
    tone: 'enthusiastic',
    style: 'creative',
    traits: ['creative', 'innovative', 'collaborative'],
    icon: Palette,
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    tone: 'professional',
    style: 'analytical',
    traits: ['analytical', 'detail-oriented', 'practical'],
    icon: BarChart3,
  },
];

export function AgentPersonalityEditor({ personality, onChange }: AgentPersonalityEditorProps) {
  const [activeTab, setActiveTab] = useState('presets');
  const [showExampleDialog, setShowExampleDialog] = useState(false);
  const [newExample, setNewExample] = useState({ input: '', output: '' });

  const handleSliderChange = (key: keyof Personality, value: number[]) => {
    onChange({ ...personality, [key]: value[0] });
  };

  const handleTraitToggle = (trait: string) => {
    const traits = personality.traits || [];
    if (traits.includes(trait)) {
      onChange({ ...personality, traits: traits.filter(t => t !== trait) });
    } else {
      onChange({ ...personality, traits: [...traits, trait] });
    }
  };

  const handleAddExample = () => {
    if (newExample.input && newExample.output) {
      const examples = personality.examples || [];
      onChange({
        ...personality,
        examples: [...examples, newExample],
      });
      setNewExample({ input: '', output: '' });
      setShowExampleDialog(false);
    }
  };

  const handleRemoveExample = (index: number) => {
    const examples = personality.examples || [];
    onChange({
      ...personality,
      examples: examples.filter((_, i) => i !== index),
    });
  };

  const applyTemplate = (template: typeof personalityTemplates[0]) => {
    onChange({
      ...personality,
      tone: template.tone,
      style: template.style,
      traits: template.traits,
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4 mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {personalityTemplates.map((template) => {
              const Icon = template.icon;
              const isActive = 
                personality.tone === template.tone &&
                personality.style === template.style &&
                JSON.stringify(personality.traits) === JSON.stringify(template.traits);
              
              return (
                <Card
                  key={template.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isActive && "border-primary shadow-md"
                  )}
                  onClick={() => applyTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{template.name}</h4>
                          {isActive && (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tone: {template.tone} • Style: {template.style}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.traits.map(trait => (
                            <Badge key={trait} variant="secondary" className="text-xs">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Wand2 className="mr-2 h-4 w-4" />
                Quick Personality Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Random Personality
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customize" className="space-y-6 mt-4">
          {/* Tone Selection */}
          <div className="space-y-3">
            <Label>Tone of Voice</Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {toneOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = personality.tone === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => onChange({ ...personality, tone: option.value })}
                    className={cn(
                      "flex items-center space-x-2 rounded-lg border p-3 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {option.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-3">
            <Label>Communication Style</Label>
            <Select
              value={personality.style}
              onValueChange={(value) => onChange({ ...personality, style: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {styleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Personality Traits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Personality Traits</Label>
              <span className="text-xs text-muted-foreground">
                {personality.traits?.length || 0} selected
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {traitOptions.map((trait) => {
                const Icon = trait.icon;
                const isSelected = personality.traits?.includes(trait.value);
                
                return (
                  <button
                    key={trait.value}
                    onClick={() => handleTraitToggle(trait.value)}
                    className={cn(
                      "flex items-center space-x-2 rounded-md border px-3 py-2 text-sm transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{trait.label}</span>
                    {isSelected && <Check className="h-3 w-3 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personality Sliders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fine-tune Personality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Creativity</Label>
                  <span className="text-sm text-muted-foreground">
                    {personality.creativity || 50}%
                  </span>
                </div>
                <Slider
                  value={[personality.creativity || 50]}
                  onValueChange={(value) => handleSliderChange('creativity', value)}
                  max={100}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values make responses more creative and varied
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Formality</Label>
                  <span className="text-sm text-muted-foreground">
                    {personality.formality || 50}%
                  </span>
                </div>
                <Slider
                  value={[personality.formality || 50]}
                  onValueChange={(value) => handleSliderChange('formality', value)}
                  max={100}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">
                  Adjusts between casual and formal language
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Verbosity</Label>
                  <span className="text-sm text-muted-foreground">
                    {personality.verbosity || 50}%
                  </span>
                </div>
                <Slider
                  value={[personality.verbosity || 50]}
                  onValueChange={(value) => handleSliderChange('verbosity', value)}
                  max={100}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">
                  Controls response length and detail level
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Humor</Label>
                  <span className="text-sm text-muted-foreground">
                    {personality.humor || 30}%
                  </span>
                </div>
                <Slider
                  value={[personality.humor || 30]}
                  onValueChange={(value) => handleSliderChange('humor', value)}
                  max={100}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">
                  Adds wit and playfulness to responses
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Empathy</Label>
                  <span className="text-sm text-muted-foreground">
                    {personality.empathy || 70}%
                  </span>
                </div>
                <Slider
                  value={[personality.empathy || 70]}
                  onValueChange={(value) => handleSliderChange('empathy', value)}
                  max={100}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">
                  Level of emotional understanding and support
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 mt-4">
          {/* Custom System Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom System Prompt</CardTitle>
              <CardDescription>
                Define exactly how your agent should behave
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="You are a helpful assistant that..."
                value={personality.customPrompt || ''}
                onChange={(e) => onChange({ ...personality, customPrompt: e.target.value })}
                className="min-h-[150px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Example Conversations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Example Conversations</CardTitle>
              <CardDescription>
                Provide examples to shape agent responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(personality.examples || []).map((example, index) => (
                <div key={index} className="space-y-2 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-xs">User Input</Label>
                        <p className="text-sm mt-1">{example.input}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Agent Response</Label>
                        <p className="text-sm mt-1">{example.output}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExample(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowExampleDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Example
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personality Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Test Message</span>
                </div>
                <div className="pl-6 text-sm text-muted-foreground">
                  "How can I help you today?"
                </div>
                <div className="pl-6">
                  <p className="text-sm italic">
                    Based on your settings, the agent will respond in a{' '}
                    <span className="font-medium">{personality.tone}</span> tone with a{' '}
                    <span className="font-medium">{personality.style}</span> style.
                    {personality.traits?.length > 0 && (
                      <> The agent will be{' '}
                        {personality.traits.map((trait, i) => (
                          <span key={trait}>
                            <span className="font-medium">{trait}</span>
                            {i < personality.traits.length - 2 && ', '}
                            {i === personality.traits.length - 2 && ' and '}
                          </span>
                        ))}
                        .
                      </>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Example Dialog */}
      {showExampleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Example Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>User Input</Label>
                <Textarea
                  placeholder="What the user might say..."
                  value={newExample.input}
                  onChange={(e) => setNewExample({ ...newExample, input: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Agent Response</Label>
                <Textarea
                  placeholder="How the agent should respond..."
                  value={newExample.output}
                  onChange={(e) => setNewExample({ ...newExample, output: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExampleDialog(false);
                    setNewExample({ input: '', output: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddExample}>
                  Add Example
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AgentPersonalityEditor;

// Import missing icon
