import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      preferences: {
        theme: 'system',
        fontSize: 'medium',
        soundEnabled: true,
        animationsEnabled: true,
        language: 'en',
      },
      ui: {
        sidebarOpen: true,
        commandPaletteOpen: false,
        settingsModalOpen: false,
        currentChatId: null,
        isLoading: false,
        loadingMessage: null,
      },
      connectionStatus: 'disconnected',
    });
  });

  describe('Theme management', () => {
    it('should update theme preference', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.preferences.theme).toBe('dark');
    });

    it('should cycle through theme options', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setTheme('light');
      });
      expect(result.current.preferences.theme).toBe('light');

      act(() => {
        result.current.setTheme('dark');
      });
      expect(result.current.preferences.theme).toBe('dark');

      act(() => {
        result.current.setTheme('system');
      });
      expect(result.current.preferences.theme).toBe('system');
    });
  });

  describe('Font size management', () => {
    it('should update font size', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setFontSize('large');
      });

      expect(result.current.preferences.fontSize).toBe('large');
    });
  });

  describe('Sidebar management', () => {
    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.ui.sidebarOpen).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.ui.sidebarOpen).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.ui.sidebarOpen).toBe(true);
    });

    it('should set sidebar open state directly', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSidebarOpen(false);
      });

      expect(result.current.ui.sidebarOpen).toBe(false);

      act(() => {
        result.current.setSidebarOpen(true);
      });

      expect(result.current.ui.sidebarOpen).toBe(true);
    });
  });

  describe('Loading state management', () => {
    it('should set loading state with message', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setLoading(true, 'Loading data...');
      });

      expect(result.current.ui.isLoading).toBe(true);
      expect(result.current.ui.loadingMessage).toBe('Loading data...');
    });

    it('should clear loading state', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setLoading(true, 'Loading...');
      });

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.ui.isLoading).toBe(false);
      expect(result.current.ui.loadingMessage).toBe(null);
    });
  });

  describe('Connection status', () => {
    it('should update connection status', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setConnectionStatus('connecting');
      });
      expect(result.current.connectionStatus).toBe('connecting');

      act(() => {
        result.current.setConnectionStatus('connected');
      });
      expect(result.current.connectionStatus).toBe('connected');

      act(() => {
        result.current.setConnectionStatus('error');
      });
      expect(result.current.connectionStatus).toBe('error');
    });
  });

  describe('Preferences update', () => {
    it('should update multiple preferences at once', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updatePreferences({
          soundEnabled: false,
          animationsEnabled: false,
          language: 'es',
        });
      });

      expect(result.current.preferences.soundEnabled).toBe(false);
      expect(result.current.preferences.animationsEnabled).toBe(false);
      expect(result.current.preferences.language).toBe('es');
      expect(result.current.preferences.theme).toBe('system'); // Unchanged
    });
  });

  describe('UI state reset', () => {
    it('should reset UI state to defaults', () => {
      const { result } = renderHook(() => useAppStore());

      // Modify UI state
      act(() => {
        result.current.setSidebarOpen(false);
        result.current.toggleCommandPalette();
        result.current.setCurrentChatId('chat-123');
        result.current.setLoading(true, 'Test');
      });

      // Reset UI state
      act(() => {
        result.current.resetUiState();
      });

      expect(result.current.ui).toEqual({
        sidebarOpen: true,
        commandPaletteOpen: false,
        settingsModalOpen: false,
        currentChatId: null,
        isLoading: false,
        loadingMessage: null,
      });
    });
  });
});
