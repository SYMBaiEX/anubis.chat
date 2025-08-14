'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

interface AIConfig {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  streamingEnabled: boolean;
  toolsEnabled: boolean;
  maxSteps: number;
}

interface AIContextType {
  config: AIConfig;
  updateConfig: (updates: Partial<AIConfig>) => void;
  resetConfig: () => void;
}

const defaultConfig: AIConfig = {
  defaultModel: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  streamingEnabled: true,
  toolsEnabled: true,
  maxSteps: 5,
};

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AIConfig>(defaultConfig);

  const updateConfig = (updates: Partial<AIConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  return (
    <AIContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAIConfig() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAIConfig must be used within an AIProvider');
  }
  return context;
}
