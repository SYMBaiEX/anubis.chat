import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  getCommandById,
  getEnabledCommands,
  type MaatCommand,
} from '@/lib/constants/commands-of-maat';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';

// Type-safe command IDs
type CommandId = MaatCommand['id'];

export type UseCommandPaletteProps = {
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  onSelectAgent?: () => void;
  onSelectModel?: () => void;
  onOpenSettings?: () => void;
  onToggleSidebar?: () => void;
  onSearchConversations?: () => void;
  onClearChat?: () => void;
  onDeleteChat?: () => void;
  onRenameChat?: () => void;
  onDuplicateChat?: () => void;
  onExportChat?: () => void;
  onFocusInput?: () => void;
  onScrollToBottom?: () => void;
  onScrollToTop?: () => void;
  onToggleReasoning?: () => void;
  onQuickSelectClaude?: () => void;
  onQuickSelectGPT?: () => void;
  onUploadFile?: () => void;
  onOpenPreferences?: () => void;
  currentChatId?: string;
  chats?: { id: string; title: string }[];
};

export function useCommandPalette({
  onNewChat,
  onSelectChat,
  onSelectAgent,
  onSelectModel,
  onOpenSettings,
  onToggleSidebar,
  onSearchConversations,
  onClearChat,
  onDeleteChat,
  onRenameChat,
  onDuplicateChat,
  onExportChat,
  onFocusInput,
  onScrollToBottom,
  onScrollToTop,
  onToggleReasoning,
  onQuickSelectClaude,
  onQuickSelectGPT,
  onUploadFile,
  onOpenPreferences,
  currentChatId,
  chats = [],
}: UseCommandPaletteProps = {}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Command handlers map with type-safe keys
  const commandHandlers: Partial<Record<CommandId, () => void>> = {
    // Papyrus Commands
    'new-papyrus': () => {
      onNewChat?.();
      toast.success('Creating new papyrus...');
    },
    'clear-papyrus': () => {
      if (currentChatId) {
        onClearChat?.();
        toast.success('Papyrus cleared');
      }
    },
    'delete-papyrus': () => {
      if (currentChatId) {
        onDeleteChat?.();
        toast.success('Papyrus deleted');
      }
    },
    'rename-papyrus': () => {
      if (currentChatId) {
        onRenameChat?.();
      }
    },
    'duplicate-papyrus': () => {
      if (currentChatId) {
        onDuplicateChat?.();
        toast.success('Papyrus duplicated');
      }
    },

    // Navigation
    'open-book-of-dead': () => {
      setIsCommandPaletteOpen(true);
    },
    'focus-input': () => {
      onFocusInput?.();
      // Ensure focus happens after any UI updates
      requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
    },
    'search-scrolls': () => {
      onSearchConversations?.();
    },
    'toggle-sidebar': () => {
      onToggleSidebar?.();
    },
    'scroll-to-bottom': () => {
      onScrollToBottom?.();
    },
    'scroll-to-top': () => {
      onScrollToTop?.();
    },
    'previous-chamber': () => {
      if (currentChatId && chats.length > 0) {
        const currentIndex = chats.findIndex((c) => c.id === currentChatId);
        if (currentIndex > 0) {
          onSelectChat?.(chats[currentIndex - 1].id);
          toast.success('Previous chamber opened');
        } else if (currentIndex === 0) {
          // Wrap to last chamber
          onSelectChat?.(chats.at(-1).id);
          toast.success('Wrapped to last chamber');
        }
      }
    },
    'next-chamber': () => {
      if (currentChatId && chats.length > 0) {
        const currentIndex = chats.findIndex((c) => c.id === currentChatId);
        if (currentIndex < chats.length - 1) {
          onSelectChat?.(chats[currentIndex + 1].id);
          toast.success('Next chamber opened');
        } else if (currentIndex === chats.length - 1) {
          // Wrap to first chamber
          onSelectChat?.(chats[0].id);
          toast.success('Wrapped to first chamber');
        }
      }
    },

    // Divine Powers
    'summon-anubis': () => {
      onSelectAgent?.();
      toast.success('Summoning Anubis...');
    },
    'divine-models': () => {
      onSelectModel?.();
    },
    'toggle-reasoning': () => {
      onToggleReasoning?.();
      toast.success('Deep wisdom toggled');
    },
    'quick-claude': () => {
      onQuickSelectClaude?.();
      toast.success('Claude summoned');
    },
    'quick-gpt': () => {
      onQuickSelectGPT?.();
      toast.success('GPT summoned');
    },

    // Temple Settings
    'temple-settings': () => {
      onOpenSettings?.();
    },
    'toggle-theme': () => {
      const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      toast.success(
        nextTheme === 'light'
          ? "Ra's light illuminates your path"
          : "Osiris' shadow embraces you"
      );
    },
    'upload-papyrus': () => {
      onUploadFile?.();
    },
    'export-chat': () => {
      if (currentChatId) {
        onExportChat?.();
        toast.success('Sacred texts exported');
      }
    },
    preferences: () => {
      onOpenPreferences?.();
    },

    // Sacred Knowledge
    'commands-maat': () => {
      setIsShortcutsModalOpen(true);
    },
    'divine-guidance': () => {
      window.open('/help', '_blank', 'noopener,noreferrer');
    },
    'roadmap-scroll': () => {
      router.push('/roadmap');
    },
    'escape-underworld': () => {
      // Close any open dialogs
      setIsCommandPaletteOpen(false);
      setIsShortcutsModalOpen(false);
    },
  };

  // Handle chamber navigation (1-9)
  for (let i = 1; i <= 9; i++) {
    commandHandlers[`chamber-${i}`] = () => {
      const chatIndex = i - 1;
      if (chats[chatIndex]) {
        onSelectChat?.(chats[chatIndex].id);
        toast.success(`Entering chamber ${i}`);
      }
    };
  }

  // Execute command by ID
  const executeCommand = useCallback(
    (commandId: string) => {
      const command = getCommandById(commandId);
      if (!command) {
        return;
      }

      const handler = commandHandlers[commandId];
      if (handler) {
        handler();
      } else if (process.env.NODE_ENV !== 'production') {
        toast.error(`Unknown command: ${commandId}`);
      }
    },
    [commandHandlers]
  );

  // Build keyboard shortcuts object - memoized and only for enabled commands with valid shortcuts
  const shortcuts = useMemo(() => {
    const enabledCommands = getEnabledCommands();
    return enabledCommands.reduce(
      (acc, command) => {
        // Skip commands with undefined or empty shortcuts
        if (!command.shortcut || command.shortcut.length === 0) {
          return acc;
        }

        // Skip if any shortcut part is empty
        if (command.shortcut.some((key) => !key || key.trim() === '')) {
          return acc;
        }

        const shortcutKey = command.shortcut.join('+');
        acc[shortcutKey] = (e: KeyboardEvent) => {
          e.preventDefault();
          executeCommand(command.id);
        };
        return acc;
      },
      {} as Record<string, (e: KeyboardEvent) => void>
    );
  }, [executeCommand]); // Only recreate when executeCommand changes

  // Register keyboard shortcuts
  useKeyboardShortcuts(shortcuts);

  // Set up message input ref if needed
  const setMessageInputRef = useCallback((ref: HTMLTextAreaElement | null) => {
    messageInputRef.current = ref;
  }, []);

  return {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    executeCommand,
    setMessageInputRef,
    openCommandPalette: () => setIsCommandPaletteOpen(true),
    closeCommandPalette: () => setIsCommandPaletteOpen(false),
    openShortcutsModal: () => setIsShortcutsModalOpen(true),
    closeShortcutsModal: () => setIsShortcutsModalOpen(false),
  };
}
