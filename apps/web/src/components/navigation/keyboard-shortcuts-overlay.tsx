'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Command,
  Keyboard,
  MessageSquare,
  FileText,
  Search,
  Settings,
  User,
  Globe,
  Terminal,
  Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
  icon?: React.ComponentType<any>;
}

interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  customShortcuts?: Shortcut[];
  className?: string;
}

const defaultShortcuts: Shortcut[] = [
  // General
  { keys: ['⌘', 'K'], description: 'Open command palette', category: 'general', icon: Command },
  { keys: ['⌘', '/'], description: 'Show keyboard shortcuts', category: 'general', icon: Keyboard },
  { keys: ['⌘', ','], description: 'Open settings', category: 'general', icon: Settings },
  { keys: ['Esc'], description: 'Close dialog / Cancel', category: 'general' },
  
  // Chat
  { keys: ['⌘', 'N'], description: 'New chat', category: 'chat', icon: MessageSquare },
  { keys: ['⌘', 'Enter'], description: 'Send message', category: 'chat' },
  { keys: ['⌘', 'Shift', 'Enter'], description: 'New line in message', category: 'chat' },
  { keys: ['⌘', 'E'], description: 'Edit last message', category: 'chat' },
  { keys: ['⌘', 'R'], description: 'Regenerate response', category: 'chat' },
  { keys: ['⌘', 'D'], description: 'Delete message', category: 'chat' },
  { keys: ['⌘', 'C'], description: 'Copy message', category: 'chat' },
  
  // Navigation
  { keys: ['⌘', '1-9'], description: 'Switch to chat 1-9', category: 'navigation', icon: Navigation },
  { keys: ['⌘', '['], description: 'Previous chat', category: 'navigation' },
  { keys: ['⌘', ']'], description: 'Next chat', category: 'navigation' },
  { keys: ['⌘', 'Shift', 'F'], description: 'Search conversations', category: 'navigation', icon: Search },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar', category: 'navigation' },
  { keys: ['↑', '↓'], description: 'Navigate messages', category: 'navigation' },
  
  // File & Media
  { keys: ['⌘', 'U'], description: 'Upload file', category: 'files', icon: FileText },
  { keys: ['⌘', 'Shift', 'U'], description: 'Paste from clipboard', category: 'files' },
  { keys: ['Space'], description: 'Preview file (when selected)', category: 'files' },
  
  // Agent & Model
  { keys: ['⌘', 'Shift', 'M'], description: 'Change model', category: 'agent' },
  { keys: ['⌘', 'Shift', 'A'], description: 'Select agent', category: 'agent' },
  { keys: ['⌘', 'Shift', 'P'], description: 'Edit system prompt', category: 'agent' },
];

const getPlatformKey = () => {
  if (typeof window === 'undefined') return '⌘';
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? '⌘' : 'Ctrl';
};

export function KeyboardShortcutsOverlay({
  isOpen,
  onClose,
  customShortcuts = [],
  className
}: KeyboardShortcutsOverlayProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformKey, setPlatformKey] = useState('⌘');

  useEffect(() => {
    setPlatformKey(getPlatformKey());
  }, []);

  const allShortcuts = [...defaultShortcuts, ...customShortcuts].map(shortcut => ({
    ...shortcut,
    keys: shortcut.keys.map(key => key === '⌘' ? platformKey : key)
  }));

  const categories = ['all', ...Array.from(new Set(allShortcuts.map(s => s.category)))];
  
  const filteredShortcuts = allShortcuts.filter(shortcut => {
    const matchesCategory = activeCategory === 'all' || shortcut.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const ShortcutKey = ({ children }: { children: React.ReactNode }) => (
    <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border rounded">
      {children}
    </kbd>
  );

  const categoryIcons: Record<string, React.ComponentType<any>> = {
    general: Globe,
    chat: MessageSquare,
    navigation: Navigation,
    files: FileText,
    agent: Terminal,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-3xl max-h-[80vh] overflow-hidden", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick reference for all available keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Categories */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
              {categories.map(category => {
                const Icon = categoryIcons[category];
                return (
                  <TabsTrigger key={category} value={category} className="capitalize">
                    {Icon && <Icon className="h-4 w-4 mr-1" />}
                    {category}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={activeCategory} className="mt-4">
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                <AnimatePresence mode="popLayout">
                  {filteredShortcuts.map((shortcut, index) => (
                    <motion.div
                      key={`${shortcut.keys.join('-')}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {shortcut.icon && (() => {
                          const IconComponent = shortcut.icon;
                          return <IconComponent className="h-4 w-4 text-muted-foreground" />;
                        })()}
                        <span className="text-sm">{shortcut.description}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <ShortcutKey>{key}</ShortcutKey>
                            {i < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground text-xs">+</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredShortcuts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No shortcuts found matching your search
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Tips */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Tip</Badge>
                <span>Press <ShortcutKey>{platformKey}</ShortcutKey> <ShortcutKey>/</ShortcutKey> anytime to show this dialog</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Platform:</span>
                <Badge>{platformKey === '⌘' ? 'macOS' : 'Windows/Linux'}</Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export the hook from the dedicated hooks file
export { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export default KeyboardShortcutsOverlay;