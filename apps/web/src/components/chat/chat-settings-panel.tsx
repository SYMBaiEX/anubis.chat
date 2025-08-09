'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Brain,
  ChevronLeft,
  Database,
  Globe,
  Info,
  Key,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Sun,
  Volume2,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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
  className,
}: ChatSettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = <K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
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
      <Tabs className="w-full" defaultValue="model">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="model">
            <Brain className="mr-2 h-4 w-4" />
            Model
          </TabsTrigger>
          <TabsTrigger value="behavior">
            <Zap className="mr-2 h-4 w-4" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="interface">
            <Palette className="mr-2 h-4 w-4" />
            Interface
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings className="mr-2 h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4 space-y-4" value="model">
          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select
              onValueChange={(value) => handleChange('model', value)}
              value={localSettings.model}
            >
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex w-full items-center justify-between">
                      <span>{model.label}</span>
                      <Badge className="ml-2" variant="outline">
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
              <span className="text-muted-foreground text-sm">
                {localSettings.temperature}
              </span>
            </div>
            <Slider
              id="temperature"
              max={2}
              min={0}
              onValueChange={([value]) => handleChange('temperature', value)}
              step={0.1}
              value={[localSettings.temperature]}
            />
            <p className="text-muted-foreground text-xs">
              Controls randomness: Lower is more focused, higher is more
              creative
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <span className="text-muted-foreground text-sm">
                {localSettings.maxTokens}
              </span>
            </div>
            <Slider
              id="maxTokens"
              max={4000}
              min={100}
              onValueChange={([value]) => handleChange('maxTokens', value)}
              step={100}
              value={[localSettings.maxTokens]}
            />
            <p className="text-muted-foreground text-xs">
              Maximum length of the response
            </p>
          </div>
        </TabsContent>

        <TabsContent className="mt-4 space-y-4" value="behavior">
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              className="min-h-[120px]"
              id="systemPrompt"
              onChange={(e) => handleChange('systemPrompt', e.target.value)}
              placeholder="You are a helpful AI assistant..."
              value={localSettings.systemPrompt}
            />
            <p className="text-muted-foreground text-xs">
              Instructions that define the AI's behavior and personality
            </p>
          </div>

          <Accordion collapsible type="single">
            <AccordionItem value="advanced-params">
              <AccordionTrigger>Advanced Parameters</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="topP">Top P</Label>
                    <span className="text-muted-foreground text-sm">
                      {localSettings.topP}
                    </span>
                  </div>
                  <Slider
                    id="topP"
                    max={1}
                    min={0}
                    onValueChange={([value]) => handleChange('topP', value)}
                    step={0.05}
                    value={[localSettings.topP]}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
                    <span className="text-muted-foreground text-sm">
                      {localSettings.frequencyPenalty}
                    </span>
                  </div>
                  <Slider
                    id="frequencyPenalty"
                    max={2}
                    min={-2}
                    onValueChange={([value]) =>
                      handleChange('frequencyPenalty', value)
                    }
                    step={0.1}
                    value={[localSettings.frequencyPenalty]}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="presencePenalty">Presence Penalty</Label>
                    <span className="text-muted-foreground text-sm">
                      {localSettings.presencePenalty}
                    </span>
                  </div>
                  <Slider
                    id="presencePenalty"
                    max={2}
                    min={-2}
                    onValueChange={([value]) =>
                      handleChange('presencePenalty', value)
                    }
                    step={0.1}
                    value={[localSettings.presencePenalty]}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent className="mt-4 space-y-4" value="interface">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme">Theme</Label>
                <p className="text-muted-foreground text-xs">
                  Choose your preferred color scheme
                </p>
              </div>
              <Select
                onValueChange={(value: 'light' | 'dark' | 'system') =>
                  handleChange('theme', value)
                }
                value={localSettings.theme}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center">
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center">
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center">
                      <Monitor className="mr-2 h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="soundEnabled">Sound Effects</Label>
                <p className="text-muted-foreground text-xs">
                  Play sounds for notifications
                </p>
              </div>
              <Switch
                checked={localSettings.soundEnabled}
                id="soundEnabled"
                onCheckedChange={(checked) =>
                  handleChange('soundEnabled', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoScroll">Auto-scroll</Label>
                <p className="text-muted-foreground text-xs">
                  Automatically scroll to new messages
                </p>
              </div>
              <Switch
                checked={localSettings.autoScroll}
                id="autoScroll"
                onCheckedChange={(checked) =>
                  handleChange('autoScroll', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                onValueChange={(value) => handleChange('language', value)}
                value={localSettings.language}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent className="mt-4 space-y-4" value="advanced">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="streamResponses">Stream Responses</Label>
                <p className="text-muted-foreground text-xs">
                  Show responses as they're generated
                </p>
              </div>
              <Switch
                checked={localSettings.streamResponses}
                id="streamResponses"
                onCheckedChange={(checked) =>
                  handleChange('streamResponses', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="saveHistory">Save History</Label>
                <p className="text-muted-foreground text-xs">
                  Store conversation history locally
                </p>
              </div>
              <Switch
                checked={localSettings.saveHistory}
                id="saveHistory"
                onCheckedChange={(checked) =>
                  handleChange('saveHistory', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableMemory">Enable Memory</Label>
                <p className="text-muted-foreground text-xs">
                  Remember context across conversations
                </p>
              </div>
              <Switch
                checked={localSettings.enableMemory}
                id="enableMemory"
                onCheckedChange={(checked) =>
                  handleChange('enableMemory', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="contextWindow">Context Window</Label>
                <span className="text-muted-foreground text-sm">
                  {localSettings.contextWindow} messages
                </span>
              </div>
              <Slider
                id="contextWindow"
                max={50}
                min={1}
                onValueChange={([value]) =>
                  handleChange('contextWindow', value)
                }
                step={1}
                value={[localSettings.contextWindow]}
              />
              <p className="text-muted-foreground text-xs">
                Number of previous messages to include in context
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responseFormat">Response Format</Label>
              <Select
                onValueChange={(value: 'text' | 'markdown' | 'json') =>
                  handleChange('responseFormat', value)
                }
                value={localSettings.responseFormat}
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
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-lg bg-muted p-3"
          initial={{ opacity: 0, y: 10 }}
        >
          <p className="text-muted-foreground text-sm">
            You have unsaved changes
          </p>
          <div className="flex gap-2">
            <Button onClick={handleReset} size="sm" variant="outline">
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
            <Button onClick={handleSave} size="sm">
              <Save className="mr-1 h-4 w-4" />
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
            animate={{ x: 0, opacity: 1 }}
            className={cn(
              'fixed top-0 right-0 z-50 h-full w-80 overflow-y-auto border-l bg-background shadow-lg',
              className
            )}
            exit={{ x: 300, opacity: 0 }}
            initial={{ x: 300, opacity: 0 }}
          >
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-lg">
                  <Settings className="h-5 w-5" />
                  Chat Settings
                </h2>
                {onClose && (
                  <Button onClick={onClose} size="icon" variant="ghost">
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
