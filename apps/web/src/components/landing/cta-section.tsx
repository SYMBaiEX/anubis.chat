"use client";

import { WalletConnectButton } from '@/components/wallet';

export function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto">
        {/* Main CTA */}
        <div className="text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-3">
              <span className="text-4xl">𓋹</span>
              <h2 className="text-4xl md:text-5xl font-bold"
                  style={{
                    background: `linear-gradient(
                      135deg,
                      #FFD700 0%,
                      #14F195 50%,
                      #FFD700 100%
                    )`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                  }}>
                Begin Your Journey
              </h2>
              <span className="text-4xl">𓋹</span>
            </div>
            
            <p className="text-xl text-amber-200/80 max-w-2xl mx-auto leading-relaxed">
              Join the revolution where ancient wisdom meets modern AI. 
              Your wallet is your key to unlimited possibilities.
            </p>
          </div>

          {/* Main CTA Button */}
          <div className="space-y-4">
            <WalletConnectButton />
            
            <p className="text-amber-200/60 text-sm">
              No signup required • Start chatting in seconds
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="text-4xl">𓊪</div>
            <h3 className="font-semibold text-amber-200">Your Data, Your Control</h3>
            <p className="text-amber-200/60 text-sm">
              All conversations and documents are tied to your wallet. Only you have access.
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="text-4xl">𓍯</div>
            <h3 className="font-semibold text-amber-200">Transparent Pricing</h3>
            <p className="text-amber-200/60 text-sm">
              Smart contract pricing with no hidden fees. Pay exactly what you see.
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="text-4xl">𓇯</div>
            <h3 className="font-semibold text-amber-200">Community Rewards</h3>
            <p className="text-amber-200/60 text-sm">
              Earn SOL through referrals and help grow the AI revolution on Solana.
            </p>
          </div>
        </div>

        {/* Footer decoration */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center space-x-6 text-amber-600/30">
            <span className="text-2xl">𓂋</span>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent" />
            <span className="text-4xl animate-pulse" style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.2)' }}>𓇳</span>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent" />
            <span className="text-2xl">𓂋</span>
          </div>
          
          <p className="mt-6 text-amber-200/50 text-sm">
            isis.chat • Where Ancient Wisdom Meets Modern AI • Built on Solana
          </p>
        </div>
      </div>
      
      {/* Background enhancement */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full max-w-4xl opacity-10 pointer-events-none">
        <div className="w-full h-full"
             style={{
               background: `radial-gradient(
                 ellipse at center,
                 rgba(20, 241, 149, 0.1) 0%,
                 rgba(255, 215, 0, 0.05) 50%,
                 transparent 100%
               )`,
               filter: 'blur(60px)',
             }} />
      </div>
    </section>
  );
}