'use client';

import {
  Brain,
  Globe,
  Monitor,
  Moon,
  Palette,
  Settings,
  Sun,
  Volume2,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { type GridSetting, SettingsGrid } from '@/components/ui/settings-grid';
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

interface ChatSettingsDialogProps {
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  className?: string;
}

const models = [
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', badge: 'OpenAI' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', badge: 'OpenAI' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus', badge: 'Anthropic' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', badge: 'Anthropic' },
  { value: 'gemini-pro', label: 'Gemini Pro', badge: 'Google' },
  { value: 'llama-2-70b', label: 'Llama 2 70B', badge: 'Meta' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

const responseFormats = [
  { value: 'text', label: 'Plain Text' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'json', label: 'JSON' },
];

const themeOptions = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

/**
 * ChatSettingsDialog component - Card-based settings interface
 * Similar to model and agent selectors but for chat configuration
 */
export function ChatSettingsDialog({
  settings,
  onSettingsChange,
  className,
}: ChatSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);

  const handleChange = <K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setOpen(false);
  };

  // Create settings configuration for the grid
  const gridSettings: GridSetting[] = [
    // Model Settings
    {
      id: 'model',
      title: 'AI Model',
      description: 'Select the AI model to use for responses',
      type: 'select',
      value: localSettings.model,
      onChange: (value) => handleChange('model', value),
      options: models,
      icon: <Brain className="h-4 w-4" />,
      category: 'model',
    },
    {
      id: 'temperature',
      title: 'Temperature',
      description:
        'Controls randomness: Lower is more focused, higher is more creative',
      type: 'slider',
      value: localSettings.temperature,
      onChange: (value) => handleChange('temperature', value),
      min: 0,
      max: 2,
      step: 0.1,
      icon: <Zap className="h-4 w-4" />,
      category: 'model',
    },
    {
      id: 'maxTokens',
      title: 'Max Tokens',
      description: 'Maximum length of the response',
      type: 'slider',
      value: localSettings.maxTokens,
      onChange: (value) => handleChange('maxTokens', value),
      min: 100,
      max: 4000,
      step: 100,
      icon: <Brain className="h-4 w-4" />,
      category: 'model',
    },

    // Behavior Settings
    {
      id: 'systemPrompt',
      title: 'System Prompt',
      description: "Instructions that define the AI's behavior and personality",
      type: 'textarea',
      value: localSettings.systemPrompt,
      onChange: (value) => handleChange('systemPrompt', value),
      placeholder: 'You are a helpful AI assistant...',
      rows: 4,
      icon: <Settings className="h-4 w-4" />,
      category: 'behavior',
    },
    {
      id: 'streamResponses',
      title: 'Stream Responses',
      description: "Show responses as they're generated",
      type: 'switch',
      value: localSettings.streamResponses,
      onChange: (value) => handleChange('streamResponses', value),
      icon: <Zap className="h-4 w-4" />,
      category: 'behavior',
    },
    {
      id: 'enableMemory',
      title: 'Enable Memory',
      description: 'Remember context across conversations',
      type: 'switch',
      value: localSettings.enableMemory,
      onChange: (value) => handleChange('enableMemory', value),
      icon: <Brain className="h-4 w-4" />,
      category: 'behavior',
    },

    // Interface Settings
    {
      id: 'theme',
      title: 'Theme',
      description: 'Choose your preferred color scheme',
      type: 'select',
      value: localSettings.theme,
      onChange: (value) => handleChange('theme', value),
      options: themeOptions,
      icon: <Palette className="h-4 w-4" />,
      category: 'interface',
    },
    {
      id: 'language',
      title: 'Language',
      description: 'Select your preferred language',
      type: 'select',
      value: localSettings.language,
      onChange: (value) => handleChange('language', value),
      options: languages,
      icon: <Globe className="h-4 w-4" />,
      category: 'interface',
    },
    {
      id: 'soundEnabled',
      title: 'Sound Effects',
      description: 'Play sounds for notifications',
      type: 'switch',
      value: localSettings.soundEnabled,
      onChange: (value) => handleChange('soundEnabled', value),
      icon: <Volume2 className="h-4 w-4" />,
      category: 'interface',
    },
    {
      id: 'autoScroll',
      title: 'Auto-scroll',
      description: 'Automatically scroll to new messages',
      type: 'switch',
      value: localSettings.autoScroll,
      onChange: (value) => handleChange('autoScroll', value),
      icon: <Monitor className="h-4 w-4" />,
      category: 'interface',
    },

    // Advanced Settings
    {
      id: 'saveHistory',
      title: 'Save History',
      description: 'Store conversation history locally',
      type: 'switch',
      value: localSettings.saveHistory,
      onChange: (value) => handleChange('saveHistory', value),
      icon: <Settings className="h-4 w-4" />,
      category: 'advanced',
    },
    {
      id: 'contextWindow',
      title: 'Context Window',
      description: 'Number of previous messages to include in context',
      type: 'slider',
      value: localSettings.contextWindow,
      onChange: (value) => handleChange('contextWindow', value),
      min: 1,
      max: 50,
      step: 1,
      icon: <Brain className="h-4 w-4" />,
      category: 'advanced',
    },
    {
      id: 'responseFormat',
      title: 'Response Format',
      description: 'Format for AI responses',
      type: 'select',
      value: localSettings.responseFormat,
      onChange: (value) => handleChange('responseFormat', value),
      options: responseFormats,
      icon: <Settings className="h-4 w-4" />,
      category: 'advanced',
    },
  ];

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogTrigger asChild>
          <Button className="button-press" size="sm" variant="ghost">
            <Settings className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline-block">Settings</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-h-[85vh] max-w-6xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Chat Settings</DialogTitle>
            <DialogDescription>
              Configure AI model behavior and interface preferences
            </DialogDescription>
          </DialogHeader>

          {/* Settings Grid */}
          <div className="max-h-[65vh] overflow-y-auto">
            <SettingsGrid columns={3} compact={false} settings={gridSettings} />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button onClick={handleCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChatSettingsDialog;
