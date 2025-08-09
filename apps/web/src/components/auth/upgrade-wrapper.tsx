'use client';

import { createContext, useContext, ReactNode } from 'react';
import { UpgradeModal } from './upgrade-modal';
import { useUpgradeModal, UseUpgradeModalOptions, UpgradeTrigger } from '@/hooks/use-upgrade-modal';
// useCurrentUser replacement - using getCurrentUserProfile query
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

interface UpgradeContextValue {
  openUpgradeModal: (config?: {
    tier?: 'pro' | 'pro_plus';
    trigger?: UpgradeTrigger;
  }) => void;
  showForLimitReached: () => void;
  showForFeatureRequest: (feature: 'api_access' | 'large_files' | 'advanced_agents') => void;
  showForPremiumModel: () => void;
  currentTier: string | undefined;
  isOpen: boolean;
}

const UpgradeContext = createContext<UpgradeContextValue | null>(null);

interface UpgradeProviderProps {
  children: ReactNode;
  options?: UseUpgradeModalOptions;
}

export function UpgradeProvider({ children, options }: UpgradeProviderProps) {
  const {
    isOpen,
    suggestedTier,
    trigger,
    openModal,
    closeModal,
    showForLimitReached,
    showForFeatureRequest,
    showForPremiumModel,
    currentTier,
  } = useUpgradeModal(options);

  const contextValue: UpgradeContextValue = {
    openUpgradeModal: openModal,
    showForLimitReached,
    showForFeatureRequest,
    showForPremiumModel,
    currentTier,
    isOpen,
  };

  return (
    <UpgradeContext.Provider value={contextValue}>
      {children}
      <UpgradeModal
        isOpen={isOpen}
        onClose={closeModal}
        suggestedTier={suggestedTier}
        trigger={trigger}
      />
    </UpgradeContext.Provider>
  );
}

export function useUpgrade() {
  const context = useContext(UpgradeContext);
  if (!context) {
    throw new Error('useUpgrade must be used within an UpgradeProvider');
  }
  return context;
}

// HOC for protecting premium features
interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeButton?: boolean;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showUpgradeButton = true 
}: FeatureGateProps) {
  const { openUpgradeModal } = useUpgrade();
  const user = useQuery(api.users.getCurrentUserProfile);
  const subscription = useQuery(
    api.subscriptions.getSubscriptionStatus,
    user ? {} : 'skip'
  );
  
  // Feature requirements mapping
  const featureRequirements: Record<string, 'free' | 'pro' | 'pro_plus'> = {
    'basic_chat': 'free',
    'document_upload': 'pro',
    'premium_models': 'pro',
    'api_access': 'pro_plus',
    'large_files': 'pro_plus',
    'advanced_agents': 'pro_plus',
    'unlimited_chats': 'pro_plus',
  };

  const requiredTier = featureRequirements[feature] || 'pro_plus';
  const tierLevel = { 'free': 0, 'pro': 1, 'pro_plus': 2 };
  const currentTier = subscription?.tier || 'free';
  const currentLevel = tierLevel[currentTier as keyof typeof tierLevel] || 0;
  const hasAccess = currentLevel >= tierLevel[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradeButton) {
    return null;
  }

  // Default upgrade prompt
  const suggestedTier = requiredTier === 'pro_plus' ? 'pro_plus' : 'pro';
  
  return (
    <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        This feature requires {requiredTier === 'pro_plus' ? 'Pro+' : 'Pro'}
      </div>
      <button
        onClick={() => openUpgradeModal({ 
          tier: suggestedTier, 
          trigger: 'feature_request' 
        })}
        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
      >
        Upgrade to access →
      </button>
    </div>
  );
}

export default UpgradeProvider;