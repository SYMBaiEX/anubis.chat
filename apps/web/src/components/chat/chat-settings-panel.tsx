'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Settings,
  Brain,
  Zap,
  Shield,
  Palette,
  Volume2,
  Globe,
  Key,
  Database,
  RefreshCw,
  Save,
  RotateCcw,
  Info,
  ChevronLeft,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  streamResponses: boolean;
  saveHistory: boolean;
  enableMemory: boolean;
  contextWindow: number;
  responseFormat: 'text' | 'markdown' | 'json';
  language: string;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  autoScroll: boolean;
}

interface ChatSettingsPanelProps {
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  isOpen?: boolean;
  onClose?: () => void;
  variant?: 'panel' | 'modal' | 'inline';
  className?: string;
}

const models = [
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'Anthropic' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { value: 'gemini-pro', label: 'Gemini Pro', provider: 'Google' },
  { value: 'llama-2-70b', label: 'Llama 2 70B', provider: 'Meta' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

export function ChatSettingsPanel({
  settings,
  onSettingsChange,
  isOpen = true,
  onClose,
  variant = 'panel',
  className
}: ChatSettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = <K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    setHasChanges(false);
    toast.success('Settings saved successfully');
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
    toast.info('Settings reset to last saved state');
  };

  const content = (
    <div className="space-y-6">
      <Tabs defaultValue="model" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="model">
            <Brain className="h-4 w-4 mr-2" />
            Model
          </TabsTrigger>
          <TabsTrigger value="behavior">
            <Zap className="h-4 w-4 mr-2" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="interface">
            <Palette className="h-4 w-4 mr-2" />
            Interface
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="model" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select
              value={localSettings.model}
              onValueChange={(value) => handleChange('model', value)}
            >
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map(model => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{model.label}</span>
                      <Badge variant="outline" className="ml-2">
                        {model.provider}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-sm text-muted-foreground">
                {localSettings.temperature}
              </span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[localSettings.temperature]}
              onValueChange={([value]) => handleChange('temperature', value)}
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness: Lower is more focused, higher is more creative
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <span className="text-sm text-muted-foreground">
                {localSettings.maxTokens}
              </span>
            </div>
            <Slider
              id="maxTokens"
              min={100}
              max={4000}
              step={100}
              value={[localSettings.maxTokens]}
              onValueChange={([value]) => handleChange('maxTokens', value)}
            />
            <p className="text-xs text-muted-foreground">
              Maximum length of the response
            </p>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={localSettings.systemPrompt}
              onChange={(e) => handleChange('systemPrompt', e.target.value)}
              placeholder="You are a helpful AI assistant..."
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Instructions that define the AI's behavior and personality
            </p>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced-params">
              <AccordionTrigger>Advanced Parameters</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="topP">Top P</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.topP}
                    </span>
                  </div>
                  <Slider
                    id="topP"
                    min={0}
                    max={1}
                    step={0.05}
                    value={[localSettings.topP]}
                    onValueChange={([value]) => handleChange('topP', value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.frequencyPenalty}
                    </span>
                  </div>
                  <Slider
                    id="frequencyPenalty"
                    min={-2}
                    max={2}
                    step={0.1}
                    value={[localSettings.frequencyPenalty]}
                    onValueChange={([value]) => handleChange('frequencyPenalty', value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="presencePenalty">Presence Penalty</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.presencePenalty}
                    </span>
                  </div>
                  <Slider
                    id="presencePenalty"
                    min={-2}
                    max={2}
                    step={0.1}
                    value={[localSettings.presencePenalty]}
                    onValueChange={([value]) => handleChange('presencePenalty', value)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="interface" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme">Theme</Label>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              <Select
                value={localSettings.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => 
                  handleChange('theme', value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center">
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center">
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center">
                      <Monitor className="h-4 w-4 mr-2" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="soundEnabled">Sound Effects</Label>
                <p className="text-xs text-muted-foreground">
                  Play sounds for notifications
                </p>
              </div>
              <Switch
                id="soundEnabled"
                checked={localSettings.soundEnabled}
                onCheckedChange={(checked) => handleChange('soundEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoScroll">Auto-scroll</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically scroll to new messages
                </p>
              </div>
              <Switch
                id="autoScroll"
                checked={localSettings.autoScroll}
                onCheckedChange={(checked) => handleChange('autoScroll', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={localSettings.language}
                onValueChange={(value) => handleChange('language', value)}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="streamResponses">Stream Responses</Label>
                <p className="text-xs text-muted-foreground">
                  Show responses as they're generated
                </p>
              </div>
              <Switch
                id="streamResponses"
                checked={localSettings.streamResponses}
                onCheckedChange={(checked) => handleChange('streamResponses', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="saveHistory">Save History</Label>
                <p className="text-xs text-muted-foreground">
                  Store conversation history locally
                </p>
              </div>
              <Switch
                id="saveHistory"
                checked={localSettings.saveHistory}
                onCheckedChange={(checked) => handleChange('saveHistory', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableMemory">Enable Memory</Label>
                <p className="text-xs text-muted-foreground">
                  Remember context across conversations
                </p>
              </div>
              <Switch
                id="enableMemory"
                checked={localSettings.enableMemory}
                onCheckedChange={(checked) => handleChange('enableMemory', checked)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="contextWindow">Context Window</Label>
                <span className="text-sm text-muted-foreground">
                  {localSettings.contextWindow} messages
                </span>
              </div>
              <Slider
                id="contextWindow"
                min={1}
                max={50}
                step={1}
                value={[localSettings.contextWindow]}
                onValueChange={([value]) => handleChange('contextWindow', value)}
              />
              <p className="text-xs text-muted-foreground">
                Number of previous messages to include in context
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responseFormat">Response Format</Label>
              <Select
                value={localSettings.responseFormat}
                onValueChange={(value: 'text' | 'markdown' | 'json') => 
                  handleChange('responseFormat', value)
                }
              >
                <SelectTrigger id="responseFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Plain Text</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 bg-muted rounded-lg"
        >
          <p className="text-sm text-muted-foreground">
            You have unsaved changes
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );

  if (variant === 'panel') {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className={cn(
              'fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg z-50 overflow-y-auto',
              className
            )}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Chat Settings
                </h2>
                {onClose && (
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'inline') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Chat Settings</CardTitle>
          <CardDescription>
            Configure AI model behavior and interface preferences
          </CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return null;
}

export default ChatSettingsPanel;