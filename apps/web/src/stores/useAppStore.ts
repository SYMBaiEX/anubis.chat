import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  language: string;
}

interface UiState {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  settingsModalOpen: boolean;
  currentChatId: string | null;
  isLoading: boolean;
  loadingMessage: string | null;
}

interface AppState {
  // User preferences
  preferences: UserPreferences;

  // UI state
  ui: UiState;

  // Connection status
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';

  // Actions
  setTheme: (theme: UserPreferences['theme']) => void;
  setFontSize: (size: UserPreferences['fontSize']) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  toggleSettingsModal: () => void;
  setCurrentChatId: (id: string | null) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setConnectionStatus: (status: AppState['connectionStatus']) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  resetUiState: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  fontSize: 'medium',
  soundEnabled: true,
  animationsEnabled: true,
  language: 'en',
};

const defaultUiState: UiState = {
  sidebarOpen: true,
  commandPaletteOpen: false,
  settingsModalOpen: false,
  currentChatId: null,
  isLoading: false,
  loadingMessage: null,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial state
        preferences: defaultPreferences,
        ui: defaultUiState,
        connectionStatus: 'disconnected',

        // Actions
        setTheme: (theme) =>
          set((state) => {
            state.preferences.theme = theme;
          }),

        setFontSize: (size) =>
          set((state) => {
            state.preferences.fontSize = size;
          }),

        toggleSidebar: () =>
          set((state) => {
            state.ui.sidebarOpen = !state.ui.sidebarOpen;
          }),

        setSidebarOpen: (open) =>
          set((state) => {
            state.ui.sidebarOpen = open;
          }),

        toggleCommandPalette: () =>
          set((state) => {
            state.ui.commandPaletteOpen = !state.ui.commandPaletteOpen;
          }),

        toggleSettingsModal: () =>
          set((state) => {
            state.ui.settingsModalOpen = !state.ui.settingsModalOpen;
          }),

        setCurrentChatId: (id) =>
          set((state) => {
            state.ui.currentChatId = id;
          }),

        setLoading: (loading, message) =>
          set((state) => {
            state.ui.isLoading = loading;
            state.ui.loadingMessage = message || null;
          }),

        setConnectionStatus: (status) =>
          set((state) => {
            state.connectionStatus = status;
          }),

        updatePreferences: (preferences) =>
          set((state) => {
            Object.assign(state.preferences, preferences);
          }),

        resetUiState: () =>
          set((state) => {
            state.ui = defaultUiState;
          }),
      })),
      {
        name: 'anubis-app-store',
        partialize: (state) => ({
          preferences: state.preferences,
        }),
      }
    )
  )
);
