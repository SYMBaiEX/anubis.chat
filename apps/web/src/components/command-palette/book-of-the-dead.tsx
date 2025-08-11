'use client';

import {
  BookOpen,
  FileText,
  Hash,
  HelpCircle,
  History,
  Home,
  Info,
  Keyboard,
  MessageSquare,
  Moon,
  Plus,
  ScrollText,
  Settings,
  Shield,
  Sun,
  User,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface BookOfTheDeadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowShortcuts: () => void;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  onSelectAgent?: () => void;
  onSelectModel?: () => void;
  onOpenSettings?: () => void;
  chats?: Array<{ id: string; title: string }>;
}

type CommandAction = () => void;

interface CommandItemData {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: CommandAction;
  keywords?: string[];
}

export function BookOfTheDead({
  open,
  onOpenChange,
  onShowShortcuts,
  onNewChat,
  onSelectChat,
  onSelectAgent,
  onSelectModel,
  onOpenSettings,
  chats = [],
}: BookOfTheDeadProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState('');

  // Platform detection for keyboard shortcuts
  const isMac = typeof navigator !== 'undefined' && 
    /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
  
  // Define platform-specific key symbols
  const cmdKey = isMac ? '⌘' : 'Ctrl+';
  const altKey = isMac ? '⌥' : 'Alt+';
  const shiftKey = isMac ? '⇧' : 'Shift+';

  // Papyrus Commands (Chat)
  const papyrusCommands: CommandItemData[] = [
    {
      id: 'new-papyrus',
      label: 'New Papyrus',
      icon: Plus,
      shortcut: `${cmdKey}N`,
      action: () => {
        onNewChat?.();
        onOpenChange(false);
      },
      keywords: ['new', 'chat', 'conversation', 'create'],
    },
    {
      id: 'chronicle',
      label: 'Chronicle of Sessions',
      icon: History,
      shortcut: `${cmdKey}${shiftKey}H`,
      action: () => {
        router.push('/history');
        onOpenChange(false);
      },
      keywords: ['history', 'past', 'previous', 'archive'],
    },
  ];

  // Sacred Chambers (Recent Chats)
  const sacredChambers: CommandItemData[] = chats
    .slice(0, 9)
    .map((chat, index) => ({
      id: `chat-${chat.id}`,
      label: chat.title || `Chamber ${index + 1}`,
      icon: MessageSquare,
      shortcut: index < 9 ? `${altKey}${index + 1}` : undefined,
      action: () => {
        onSelectChat?.(chat.id);
        onOpenChange(false);
      },
      keywords: ['chat', 'conversation', chat.title || ''],
    }));

  // Divine Powers (AI & Models)
  const divinePowers: CommandItemData[] = [
    {
      id: 'summon-anubis',
      label: 'Summon Anubis',
      icon: Shield,
      shortcut: `${cmdKey}${shiftKey}A`,
      action: () => {
        onSelectAgent?.();
        onOpenChange(false);
      },
      keywords: ['agent', 'ai', 'assistant', 'anubis'],
    },
    {
      id: 'divine-models',
      label: 'Choose Divine Model',
      icon: Zap,
      shortcut: `${cmdKey}${shiftKey}M`,
      action: () => {
        onSelectModel?.();
        onOpenChange(false);
      },
      keywords: ['model', 'ai', 'llm', 'claude', 'gpt'],
    },
  ];

  // Temple Settings
  const templeCommands: CommandItemData[] = [
    {
      id: 'temple-settings',
      label: 'Temple Settings',
      icon: Settings,
      shortcut: `${cmdKey}${shiftKey}T`,
      action: () => {
        onOpenSettings?.();
        onOpenChange(false);
      },
      keywords: ['settings', 'preferences', 'config', 'options'],
    },
    {
      id: 'theme-light',
      label: "Ra's Light",
      icon: Sun,
      action: () => {
        setTheme('light');
        onOpenChange(false);
      },
      keywords: ['theme', 'light', 'bright', 'day'],
    },
    {
      id: 'theme-dark',
      label: "Osiris' Shadow",
      icon: Moon,
      action: () => {
        setTheme('dark');
        onOpenChange(false);
      },
      keywords: ['theme', 'dark', 'night', 'shadow'],
    },
  ];

  // Sacred Knowledge
  const sacredKnowledge: CommandItemData[] = [
    {
      id: 'commands-maat',
      label: "Commands of Ma'at",
      icon: Keyboard,
      shortcut: `${cmdKey}${shiftKey}K`,
      action: () => {
        onShowShortcuts();
        onOpenChange(false);
      },
      keywords: ['shortcuts', 'keyboard', 'hotkeys', 'commands'],
    },
    {
      id: 'divine-guidance',
      label: 'Divine Guidance',
      icon: HelpCircle,
      shortcut: `${cmdKey}/`,
      action: () => {
        router.push('/help');
        onOpenChange(false);
      },
      keywords: ['help', 'guide', 'documentation', 'support'],
    },
    {
      id: 'roadmap',
      label: 'Path of Enlightenment',
      icon: ScrollText,
      action: () => {
        router.push('/roadmap');
        onOpenChange(false);
      },
      keywords: ['roadmap', 'future', 'plans', 'features'],
    },
  ];

  // Navigation
  const navigationCommands: CommandItemData[] = [
    {
      id: 'home',
      label: 'Temple Entrance',
      icon: Home,
      action: () => {
        router.push('/');
        onOpenChange(false);
      },
      keywords: ['home', 'main', 'start', 'dashboard'],
    },
    {
      id: 'profile',
      label: 'Your Ka',
      icon: User,
      action: () => {
        router.push('/profile');
        onOpenChange(false);
      },
      keywords: ['profile', 'account', 'user', 'settings'],
    },
    {
      id: 'referral',
      label: 'Spread the Word',
      icon: Info,
      action: () => {
        router.push('/referral-info');
        onOpenChange(false);
      },
      keywords: ['referral', 'share', 'invite', 'friends'],
    },
  ];

  const runCommand = useCallback((command: CommandAction) => {
    command();
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog
      className="max-w-2xl"
      description="Ancient commands at your fingertips"
      onOpenChange={onOpenChange}
      open={open}
      title="Book of the Dead"
    >
      <Command className="rounded-lg border shadow-md">
        <div className="flex items-center border-b px-3">
          <BookOpen className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            onValueChange={setSearch}
            placeholder="Inscribe your command..."
            value={search}
          />
        </div>
        <CommandList className="max-h-[400px] overflow-y-auto">
          <CommandEmpty>No incantations found.</CommandEmpty>

          {/* Papyrus Commands */}
          <CommandGroup heading="📜 Papyrus">
            {papyrusCommands.map((cmd) => (
              <CommandItem
                className="flex items-center justify-between"
                key={cmd.id}
                onSelect={() => runCommand(cmd.action)}
                value={`${cmd.label} ${cmd.keywords?.join(' ')}`}
              >
                <div className="flex items-center gap-2">
                  <cmd.icon className="h-4 w-4" />
                  <span>{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Sacred Chambers */}
          {sacredChambers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="🏛️ Sacred Chambers">
                {sacredChambers.map((cmd) => (
                  <CommandItem
                    className="flex items-center justify-between"
                    key={cmd.id}
                    onSelect={() => runCommand(cmd.action)}
                    value={`${cmd.label} ${cmd.keywords?.join(' ')}`}
                  >
                    <div className="flex items-center gap-2">
                      <cmd.icon className="h-4 w-4" />
                      <span className="truncate">{cmd.label}</span>
                    </div>
                    {cmd.shortcut && (
                      <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Divine Powers */}
          <CommandSeparator />
          <CommandGroup heading="⚡ Divine Powers">
            {divinePowers.map((cmd) => (
              <CommandItem
                className="flex items-center justify-between"
                key={cmd.id}
                onSelect={() => runCommand(cmd.action)}
                value={`${cmd.label} ${cmd.keywords?.join(' ')}`}
              >
                <div className="flex items-center gap-2">
                  <cmd.icon className="h-4 w-4" />
                  <span>{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Temple Settings */}
          <CommandSeparator />
          <CommandGroup heading="🏺 Temple">
            {templeCommands.map((cmd) => (
              <CommandItem
                className="flex items-center justify-between"
                key={cmd.id}
                onSelect={() => runCommand(cmd.action)}
                value={`${cmd.label} ${cmd.keywords?.join(' ')}`}
              >
                <div className="flex items-center gap-2">
                  <cmd.icon className="h-4 w-4" />
                  <span>{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Sacred Knowledge */}
          <CommandSeparator />
          <CommandGroup heading="📚 Sacred Knowledge">
            {sacredKnowledge.map((cmd) => (
              <CommandItem
                className="flex items-center justify-between"
                key={cmd.id}
                onSelect={() => runCommand(cmd.action)}
                value={`${cmd.label} ${cmd.keywords?.join(' ')}`}
              >
                <div className="flex items-center gap-2">
                  <cmd.icon className="h-4 w-4" />
                  <span>{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Navigation */}
          <CommandSeparator />
          <CommandGroup heading="🧭 Navigation">
            {navigationCommands.map((cmd) => (
              <CommandItem
                className="flex items-center justify-between"
                key={cmd.id}
                onSelect={() => runCommand(cmd.action)}
                value={`${cmd.label} ${cmd.keywords?.join(' ')}`}
              >
                <div className="flex items-center gap-2">
                  <cmd.icon className="h-4 w-4" />
                  <span>{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
