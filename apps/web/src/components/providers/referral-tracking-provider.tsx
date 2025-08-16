'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useReferralTracking } from '@/hooks/use-referral-tracking';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('referral-tracking-provider');

interface ReferralTrackingContextValue {
  getStoredReferralCode: () => string | null;
  clearStoredReferralCode: () => void;
  trackReferralCode: (code: string) => Promise<boolean>;
}

const ReferralTrackingContext = createContext<ReferralTrackingContextValue | null>(null);

interface ReferralTrackingProviderProps {
  children: ReactNode;
}

export function ReferralTrackingProvider({ children }: ReferralTrackingProviderProps) {
  const searchParams = useSearchParams();
  const { getStoredReferralCode, clearStoredReferralCode, trackReferralCode } = useReferralTracking();

  // Global referral tracking on provider mount
  useEffect(() => {
    const refParam = searchParams.get('ref');
    
    if (refParam) {
      log.info('Referral code detected in URL', { referralCode: refParam });
      
      // Validate referral code format (4-12 characters, alphanumeric)
      const isValidCode = /^[A-Z0-9]{4,12}$/i.test(refParam);
      
      if (isValidCode) {
        trackReferralCode(refParam.toUpperCase()).then((success) => {
          if (success) {
            log.info('Referral code tracked successfully', { referralCode: refParam.toUpperCase() });
          } else {
            log.warn('Failed to track referral code', { referralCode: refParam.toUpperCase() });
          }
        });
      } else {
        log.warn('Invalid referral code format', { referralCode: refParam });
      }
    }
  }, [searchParams, trackReferralCode]);

  const contextValue: ReferralTrackingContextValue = {
    getStoredReferralCode,
    clearStoredReferralCode,
    trackReferralCode,
  };

  return (
    <ReferralTrackingContext.Provider value={contextValue}>
      {children}
    </ReferralTrackingContext.Provider>
  );
}

export function useReferralTrackingContext(): ReferralTrackingContextValue {
  const context = useContext(ReferralTrackingContext);
  if (!context) {
    throw new Error('useReferralTrackingContext must be used within a ReferralTrackingProvider');
  }
  return context;
}