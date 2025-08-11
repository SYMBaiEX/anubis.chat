// Commands of Ma'at - Sacred Keyboard Shortcuts for Power Users
// Ma'at represents truth, justice, and divine order in Egyptian mythology

export interface MaatCommand {
  id: string;
  name: string;
  description: string;
  shortcut: string[];
  category: 'papyrus' | 'navigation' | 'divine' | 'temple' | 'knowledge';
  icon?: string;
  action?: string;
  enabled?: boolean; // For conditionally enabled commands
}

// Platform-specific key mappings
export const getPlatformKey = () => {
  if (typeof window === 'undefined') return 'Cmd';
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? 'Cmd' : 'Ctrl';
};

export const COMMANDS_OF_MAAT: MaatCommand[] = [
  // Papyrus Commands (Chat Management)
  {
    id: 'new-papyrus',
    name: 'New Papyrus',
    description: 'Create a new chat conversation',
    shortcut: ['mod', 'n'],
    category: 'papyrus',
    icon: '📜',
    enabled: true,
  },
  {
    id: 'clear-papyrus',
    name: 'Clear Papyrus',
    description: 'Clear current chat messages',
    shortcut: ['mod', 'shift', 'delete'],
    category: 'papyrus',
    icon: '🧹',
    enabled: true,
  },
  {
    id: 'delete-papyrus',
    name: 'Delete Papyrus',
    description: 'Delete current chat permanently',
    shortcut: ['mod', 'shift', 'backspace'],
    category: 'papyrus',
    icon: '🗑️',
    enabled: true,
  },
  {
    id: 'rename-papyrus',
    name: 'Rename Papyrus',
    description: 'Rename current chat',
    shortcut: ['mod', 'shift', 'r'],
    category: 'papyrus',
    icon: '✏️',
    enabled: true,
  },
  {
    id: 'duplicate-papyrus',
    name: 'Duplicate Papyrus',
    description: 'Create a copy of current chat',
    shortcut: ['mod', 'd'],
    category: 'papyrus',
    icon: '📑',
    enabled: true,
  },

  // Navigation Commands (Sacred Chambers)
  {
    id: 'open-book-of-dead',
    name: 'Book of the Dead',
    description: 'Open the command palette',
    shortcut: ['mod', 'k'],
    category: 'navigation',
    icon: '📖',
    enabled: true,
  },
  {
    id: 'focus-input',
    name: 'Focus Sacred Quill',
    description: 'Focus on message input',
    shortcut: ['mod', 'l'],
    category: 'navigation',
    icon: '🖋️',
    enabled: true,
  },
  {
    id: 'chamber-1',
    name: 'First Sacred Chamber',
    description: 'Navigate to chat 1',
    shortcut: ['alt', '1'],
    category: 'navigation',
  },
  {
    id: 'chamber-2',
    name: 'Second Sacred Chamber',
    description: 'Navigate to chat 2',
    shortcut: ['alt', '2'],
    category: 'navigation',
  },
  {
    id: 'chamber-3',
    name: 'Third Sacred Chamber',
    description: 'Navigate to chat 3',
    shortcut: ['alt', '3'],
    category: 'navigation',
  },
  {
    id: 'chamber-4',
    name: 'Fourth Sacred Chamber',
    description: 'Navigate to chat 4',
    shortcut: ['alt', '4'],
    category: 'navigation',
  },
  {
    id: 'chamber-5',
    name: 'Fifth Sacred Chamber',
    description: 'Navigate to chat 5',
    shortcut: ['alt', '5'],
    category: 'navigation',
  },
  {
    id: 'chamber-6',
    name: 'Sixth Sacred Chamber',
    description: 'Navigate to chat 6',
    shortcut: ['alt', '6'],
    category: 'navigation',
  },
  {
    id: 'chamber-7',
    name: 'Seventh Sacred Chamber',
    description: 'Navigate to chat 7',
    shortcut: ['alt', '7'],
    category: 'navigation',
  },
  {
    id: 'chamber-8',
    name: 'Eighth Sacred Chamber',
    description: 'Navigate to chat 8',
    shortcut: ['alt', '8'],
    category: 'navigation',
  },
  {
    id: 'chamber-9',
    name: 'Ninth Sacred Chamber',
    description: 'Navigate to chat 9',
    shortcut: ['alt', '9'],
    category: 'navigation',
  },
  {
    id: 'previous-chamber',
    name: 'Previous Chamber',
    description: 'Navigate to previous chat',
    shortcut: ['mod', '['],
    category: 'navigation',
    icon: '⬅️',
  },
  {
    id: 'next-chamber',
    name: 'Next Chamber',
    description: 'Navigate to next chat',
    shortcut: ['mod', ']'],
    category: 'navigation',
    icon: '➡️',
  },
  {
    id: 'search-scrolls',
    name: 'Search Sacred Scrolls',
    description: 'Search through all conversations',
    shortcut: ['mod', 'shift', 'f'],
    category: 'navigation',
    icon: '🔍',
    enabled: true,
  },
  {
    id: 'toggle-sidebar',
    name: 'Toggle Sacred Wall',
    description: 'Show/hide chat sidebar',
    shortcut: ['mod', 'b'],
    category: 'navigation',
    icon: '📜',
    enabled: true,
  },
  {
    id: 'scroll-to-bottom',
    name: 'Descend to Depths',
    description: 'Scroll to bottom of chat',
    shortcut: ['mod', 'down'],
    category: 'navigation',
    icon: '⬇️',
    enabled: true,
  },
  {
    id: 'scroll-to-top',
    name: 'Ascend to Heights',
    description: 'Scroll to top of chat',
    shortcut: ['mod', 'up'],
    category: 'navigation',
    icon: '⬆️',
    enabled: true,
  },

  // Divine Powers (AI & Models)
  {
    id: 'summon-anubis',
    name: 'Summon Anubis',
    description: 'Select AI agent for guidance',
    shortcut: ['mod', 'shift', 'a'],
    category: 'divine',
    icon: '🐺',
    enabled: true,
  },
  {
    id: 'divine-models',
    name: 'Choose Divine Oracle',
    description: 'Select AI model (Claude, GPT, etc)',
    shortcut: ['mod', 'shift', 'm'],
    category: 'divine',
    icon: '⚡',
    enabled: true,
  },
  {
    id: 'toggle-reasoning',
    name: 'Toggle Deep Wisdom',
    description: 'Enable/disable reasoning mode',
    shortcut: ['mod', 'shift', 'w'],
    category: 'divine',
    icon: '🧠',
    enabled: true,
  },
  {
    id: 'quick-claude',
    name: 'Summon Claude',
    description: 'Quick switch to Claude',
    shortcut: ['mod', '1'],
    category: 'divine',
    icon: '🎭',
    enabled: true,
  },
  {
    id: 'quick-gpt',
    name: 'Summon GPT',
    description: 'Quick switch to GPT-4',
    shortcut: ['mod', '2'],
    category: 'divine',
    icon: '🤖',
    enabled: true,
  },

  // Temple Settings
  {
    id: 'temple-settings',
    name: 'Temple Configuration',
    description: 'Open chat settings',
    shortcut: ['mod', ','],
    category: 'temple',
    icon: '🏛️',
    enabled: true,
  },
  {
    id: 'toggle-theme',
    name: 'Toggle Day/Night',
    description: 'Switch between light and dark theme',
    shortcut: ['mod', 'shift', 't'],
    category: 'temple',
    icon: '🌓',
    enabled: true,
  },
  {
    id: 'upload-papyrus',
    name: 'Upload Sacred Text',
    description: 'Upload file to chat',
    shortcut: ['mod', 'u'],
    category: 'temple',
    icon: '📁',
    enabled: true,
  },
  {
    id: 'export-chat',
    name: 'Export Sacred Texts',
    description: 'Export chat as markdown',
    shortcut: ['mod', 'shift', 'e'],
    category: 'temple',
    icon: '📤',
    enabled: true,
  },
  {
    id: 'preferences',
    name: 'User Preferences',
    description: 'Open user preferences',
    shortcut: ['mod', 'shift', ','],
    category: 'temple',
    icon: '⚙️',
    enabled: true,
  },

  // Sacred Knowledge
  {
    id: 'commands-maat',
    name: "Commands of Ma'at",
    description: 'Show all keyboard shortcuts',
    shortcut: ['mod', '?'],
    category: 'knowledge',
    icon: '⚖️',
    enabled: true,
  },
  {
    id: 'divine-guidance',
    name: 'Divine Guidance',
    description: 'Open help documentation',
    shortcut: ['f1'],
    category: 'knowledge',
    icon: '❓',
    enabled: true,
  },
  {
    id: 'escape-underworld',
    name: 'Escape',
    description: 'Close dialog or cancel action',
    shortcut: ['escape'],
    category: 'knowledge',
    icon: '🚪',
    enabled: true,
  },
  {
    id: 'roadmap-scroll',
    name: 'Path of Enlightenment',
    description: 'View product roadmap',
    shortcut: ['mod', 'shift', 'i'],
    category: 'knowledge',
    icon: '🗺️',
    enabled: true,
  },
];

// Helper function to format shortcuts for display
export function formatShortcut(shortcut: string[]): string {
  const platformKey = getPlatformKey();
  return shortcut
    .map((key) => {
      switch (key) {
        case 'mod':
          return platformKey === 'Cmd' ? '⌘' : 'Ctrl';
        case 'shift':
          return '⇧';
        case 'alt':
          return '⌥';
        case 'enter':
          return '↵';
        case 'escape':
          return 'Esc';
        default:
          return key.toUpperCase();
      }
    })
    .join('');
}

// Get commands by category
export function getCommandsByCategory(
  category: MaatCommand['category'],
  onlyEnabled = true
): MaatCommand[] {
  return COMMANDS_OF_MAAT.filter(
    (cmd) =>
      cmd.category === category && (!onlyEnabled || cmd.enabled !== false)
  );
}

// Get command by ID
export function getCommandById(id: string): MaatCommand | undefined {
  return COMMANDS_OF_MAAT.find((cmd) => cmd.id === id);
}

// Get enabled commands
export function getEnabledCommands(): MaatCommand[] {
  return COMMANDS_OF_MAAT.filter((cmd) => cmd.enabled !== false);
}

// Categories with display names
export const MAAT_CATEGORIES = {
  papyrus: {
    name: 'Papyrus Commands',
    description: 'Chat and message management',
    icon: '📜',
  },
  navigation: {
    name: 'Sacred Navigation',
    description: 'Navigate through chambers',
    icon: '🧭',
  },
  divine: {
    name: 'Divine Powers',
    description: 'AI and model controls',
    icon: '⚡',
  },
  temple: {
    name: 'Temple Settings',
    description: 'Preferences and configuration',
    icon: '🏛️',
  },
  knowledge: {
    name: 'Sacred Knowledge',
    description: 'Help and information',
    icon: '📚',
  },
} as const;
