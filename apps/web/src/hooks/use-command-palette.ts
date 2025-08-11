import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  getCommandById,
  getEnabledCommands,
} from '@/lib/constants/commands-of-maat';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';

interface UseCommandPaletteProps {
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
  chats?: Array<{ id: string; title: string }>;
}

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
  const { theme, setTheme } = useTheme();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Execute command by ID
  const executeCommand = useCallback(
    (commandId: string) => {
      const command = getCommandById(commandId);
      if (!command) return;

      switch (commandId) {
        // Papyrus Commands
        case 'new-papyrus':
          onNewChat?.();
          toast.success('Creating new papyrus...');
          break;
        case 'clear-papyrus':
          if (currentChatId) {
            onClearChat?.();
            toast.success('Papyrus cleared');
          }
          break;
        case 'delete-papyrus':
          if (currentChatId) {
            onDeleteChat?.();
            toast.success('Papyrus deleted');
          }
          break;
        case 'rename-papyrus':
          if (currentChatId) {
            onRenameChat?.();
          }
          break;
        case 'duplicate-papyrus':
          if (currentChatId) {
            onDuplicateChat?.();
            toast.success('Papyrus duplicated');
          }
          break;

        // Navigation
        case 'open-book-of-dead':
          setIsCommandPaletteOpen(!isCommandPaletteOpen);
          break;
        case 'focus-input':
          onFocusInput?.();
          if (messageInputRef.current) {
            messageInputRef.current.focus();
          }
          break;
        case 'chamber-1':
        case 'chamber-2':
        case 'chamber-3':
        case 'chamber-4':
        case 'chamber-5':
        case 'chamber-6':
        case 'chamber-7':
        case 'chamber-8':
        case 'chamber-9': {
          const chatIndex = Number.parseInt(commandId.split('-')[1]) - 1;
          if (chats[chatIndex]) {
            onSelectChat?.(chats[chatIndex].id);
            toast.success(`Entering chamber ${chatIndex + 1}`);
          }
          break;
        }
        case 'previous-chamber': {
          if (currentChatId && chats.length > 0) {
            const currentIndex = chats.findIndex((c) => c.id === currentChatId);
            if (currentIndex > 0) {
              onSelectChat?.(chats[currentIndex - 1].id);
              toast.success('Previous chamber opened');
            }
          }
          break;
        }
        case 'next-chamber': {
          if (currentChatId && chats.length > 0) {
            const currentIndex = chats.findIndex((c) => c.id === currentChatId);
            if (currentIndex < chats.length - 1) {
              onSelectChat?.(chats[currentIndex + 1].id);
              toast.success('Next chamber opened');
            }
          }
          break;
        }
        case 'search-scrolls':
          onSearchConversations?.();
          break;
        case 'toggle-sidebar':
          onToggleSidebar?.();
          break;
        case 'scroll-to-bottom':
          onScrollToBottom?.();
          break;
        case 'scroll-to-top':
          onScrollToTop?.();
          break;

        // Divine Powers
        case 'summon-anubis':
          onSelectAgent?.();
          toast.success('Summoning Anubis...');
          break;
        case 'divine-models':
          onSelectModel?.();
          break;
        case 'toggle-reasoning':
          onToggleReasoning?.();
          toast.success('Deep wisdom toggled');
          break;
        case 'quick-claude':
          onQuickSelectClaude?.();
          toast.success('Claude summoned');
          break;
        case 'quick-gpt':
          onQuickSelectGPT?.();
          toast.success('GPT summoned');
          break;

        // Temple Settings
        case 'temple-settings':
          onOpenSettings?.();
          break;
        case 'toggle-theme':
          setTheme(theme === 'dark' ? 'light' : 'dark');
          toast.success(
            theme === 'dark'
              ? "Ra's light illuminates your path"
              : "Osiris' shadow embraces you"
          );
          break;
        case 'upload-papyrus':
          onUploadFile?.();
          break;
        case 'export-chat':
          if (currentChatId) {
            onExportChat?.();
            toast.success('Sacred texts exported');
          }
          break;
        case 'preferences':
          onOpenPreferences?.();
          break;

        // Sacred Knowledge
        case 'commands-maat':
          setIsShortcutsModalOpen(true);
          break;
        case 'divine-guidance':
          window.open('/help', '_blank');
          break;
        case 'roadmap-scroll':
          router.push('/roadmap');
          break;
        case 'escape-underworld':
          // Close any open dialogs
          setIsCommandPaletteOpen(false);
          setIsShortcutsModalOpen(false);
          break;

        default:
          console.warn(`Unknown command: ${commandId}`);
      }
    },
    [
      router,
      theme,
      setTheme,
      isCommandPaletteOpen,
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
      chats,
    ]
  );

  // Build keyboard shortcuts object - only for enabled commands
  const shortcuts = getEnabledCommands().reduce(
    (acc, command) => {
      const shortcutKey = command.shortcut.join('+');
      acc[shortcutKey] = (e: KeyboardEvent) => {
        e.preventDefault();
        executeCommand(command.id);
      };
      return acc;
    },
    {} as Record<string, (e: KeyboardEvent) => void>
  );

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
