"use client";

import { WalletConnectButton } from '@/components/wallet';
import { useTheme } from '@/contexts/ThemeContext';

export function HeroSection() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const getTextStyles = () => {
    if (isDark) {
      return {
        primaryText: 'text-foreground',
        secondaryText: 'text-muted-foreground',
        heroglyphColor: 'text-egypt-amber/60',
        accentText: 'text-egypt-amber/80'
      };
    } else {
      return {
        primaryText: 'text-foreground',
        secondaryText: 'text-muted-foreground', 
        heroglyphColor: 'text-egypt-bronze/60',
        accentText: 'text-egypt-bronze/80'
      };
    }
  };

  const styles = getTextStyles();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" role="main" aria-label="Hero section">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Main Brand Logo */}
        <header className="space-y-4">
          <div className="inline-flex items-center justify-center p-4 rounded-full transition-all duration-700"
               style={{
                 background: `radial-gradient(
                   ellipse at center,
                   rgba(255, 215, 0, ${isDark ? '0.1' : '0.05'}) 0%,
                   transparent 70%
                 )`,
                 boxShadow: `
                   0 0 50px rgba(255, 215, 0, ${isDark ? '0.2' : '0.1'}),
                   inset 0 0 30px rgba(255, 215, 0, ${isDark ? '0.1' : '0.05'})
                 `,
               }}>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight transition-all duration-700"
                style={{
                  background: `linear-gradient(
                    135deg,
                    #FFD700 0%,
                    #B48751 25%,
                    #FFD700 50%,
                    #CD853F 75%,
                    #FFD700 100%
                  )`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: `
                    0 0 20px rgba(255, 215, 0, ${isDark ? '0.4' : '0.2'}),
                    0 0 40px rgba(255, 215, 0, ${isDark ? '0.3' : '0.1'}),
                    0 0 60px rgba(255, 215, 0, ${isDark ? '0.2' : '0.05'})
                  `,
                  filter: `drop-shadow(2px 2px 4px rgba(0, 0, 0, ${isDark ? '0.5' : '0.2'}))`,
                }}>
              isis.chat
            </h1>
          </div>
          
          {/* Hieroglyphic subtitle */}
          <div className={`flex items-center justify-center space-x-4 ${styles.heroglyphColor} transition-colors duration-300`} role="text" aria-label="Ancient wisdom modern AI">
            <span className="text-3xl" aria-hidden="true">𓊪</span>
            <span className={`text-sm md:text-base font-medium tracking-[0.2em] ${styles.accentText} transition-colors duration-300`}>
              ANCIENT WISDOM • MODERN AI
            </span>
            <span className="text-3xl" aria-hidden="true">𓊪</span>
          </div>
        </header>

        {/* Hero Description */}
        <div className="max-w-2xl mx-auto space-y-6">
          <p className={`text-xl md:text-2xl font-light leading-relaxed transition-all duration-300 ${styles.primaryText}`}
             style={{
               textShadow: `0 2px 10px rgba(0, 0, 0, ${isDark ? '0.8' : '0.2'})`,
             }}>
            The first{" "}
            <span className="font-semibold text-primary glow-text">
              Solana-native AI chat platform
            </span>
            {" "}where ancient wisdom meets cutting-edge technology
          </p>
          
          <p className={`text-lg leading-relaxed transition-colors duration-300 ${styles.secondaryText}`}>
            Authenticate with your wallet • Upload your knowledge • Chat with AI models • 
            Pay in SOL • Keep your conversations forever
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8" role="group" aria-label="Call to action buttons">
          <WalletConnectButton />
          
          <button 
            onClick={() => {
              const featuresSection = document.getElementById('features-section');
              featuresSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`px-8 py-4 rounded-lg font-semibold text-lg border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
              isDark 
                ? 'border-egypt-bronze text-egypt-gold hover:bg-egypt-bronze/10 hover:shadow-lg hover:shadow-egypt-gold/20 focus:ring-offset-background' 
                : 'border-egypt-bronze/70 text-egypt-bronze hover:bg-egypt-bronze/5 hover:border-egypt-bronze hover:shadow-lg hover:shadow-egypt-bronze/20 focus:ring-offset-background'
            }`}
            style={{
              textShadow: `0 0 10px rgba(255, 215, 0, ${isDark ? '0.4' : '0.2'})`,
            }}
            aria-label="Scroll to explore features section"
          >
            Explore Features
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className={`w-6 h-10 rounded-full border-2 flex justify-center transition-colors duration-300 ${
            isDark ? 'border-egypt-bronze/50' : 'border-egypt-bronze/30'
          }`}>
            <div className={`w-1 h-3 rounded-full mt-2 animate-pulse transition-colors duration-300 ${
              isDark ? 'bg-egypt-bronze/60' : 'bg-egypt-bronze/40'
            }`} />
          </div>
        </div>
      </div>
      
      {/* Ambient glow effects */}
      <div className={`absolute top-1/4 left-0 w-96 h-96 rounded-full transition-opacity duration-700 ${
        isDark ? 'opacity-10' : 'opacity-5'
      }`}
           style={{
             background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)',
             filter: 'blur(40px)',
           }} />
      <div className={`absolute bottom-1/4 right-0 w-96 h-96 rounded-full transition-opacity duration-700 ${
        isDark ? 'opacity-10' : 'opacity-5'
      }`}
           style={{
             background: 'radial-gradient(circle, #14F195 0%, transparent 70%)',
             filter: 'blur(40px)',
           }} />
    </section>
  );
}