'use client';

import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { WalletModal } from './wallet-modal';
import Loader from '@/components/loader';

export function WalletConnectButton() {
  const [showModal, setShowModal] = useState(false);
  const { 
    isConnected, 
    isConnecting, 
    publicKey, 
    balance, 
    formatAddress,
    disconnect,
    signInWithSolana
  } = useWallet();

  const handleConnect = () => {
    if (!isConnected) {
      setShowModal(true);
    }
  };

  const handleSignIn = async () => {
    try {
      const result = await signInWithSolana();
      console.log('Signed in with Solana:', result);
      // TODO: Send to backend for authentication
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  if (isConnected && publicKey) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* Wallet Info Card */}
        <div className="flex items-center gap-4 p-4 rounded-lg border border-amber-600/20 bg-amber-600/5">
          <div className="text-left">
            <div className="text-sm font-semibold text-amber-200">
              {formatAddress()}
            </div>
            {balance !== null && (
              <div className="text-xs text-amber-200/60">
                {balance.toFixed(4)} SOL
              </div>
            )}
          </div>
          <button
            onClick={disconnect}
            className="px-4 py-2 text-sm rounded-md border border-amber-600/30 text-amber-200 hover:bg-amber-600/10 transition-colors"
          >
            Disconnect
          </button>
        </div>

        {/* Sign In & Start Chatting Button */}
        <button 
          onClick={handleSignIn}
          className="px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(
              135deg,
              #14F195 0%,
              #00D2FF 100%
            )`,
            color: '#0E0E10',
            boxShadow: `
              0 10px 30px rgba(20, 241, 149, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `
              0 15px 40px rgba(20, 241, 149, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.3)
            `;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = `
              0 10px 30px rgba(20, 241, 149, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `;
          }}
        >
          Sign In & Start Chatting
        </button>
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={handleConnect}
        disabled={isConnecting}
        className="px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3"
        style={{
          background: `linear-gradient(
            135deg,
            #14F195 0%,
            #00D2FF 100%
          )`,
          color: '#0E0E10',
          boxShadow: `
            0 10px 30px rgba(20, 241, 149, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)
          `,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `
            0 15px 40px rgba(20, 241, 149, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `
            0 10px 30px rgba(20, 241, 149, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)
          `;
        }}
      >
        {isConnecting ? (
          <>
            <Loader className="h-5 w-5" />
            Connecting Wallet...
          </>
        ) : (
          <>
            <span>Connect Wallet & Start Chatting</span>
            <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </>
        )}
      </button>

      <WalletModal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}