"use client";

import { useTheme } from '@/contexts/ThemeContext';

const features = [
  {
    icon: "𓅃", // Falcon - representing Solana speed
    title: "Solana Wallet Authentication",
    description: "Connect with Phantom, Backpack, or any Solana wallet. No emails, no passwords - just your wallet signature.",
    highlight: "Crypto-native identity",
  },
  {
    icon: "𓂀", // Eye of Horus - representing AI vision
    title: "Advanced AI Models",
    description: "Chat with Claude 3.5, GPT-4o, DeepSeek V2, and Groq. Switch between models seamlessly for different tasks.",
    highlight: "Multi-model intelligence",
  },
  {
    icon: "𓊪", // Papyrus - representing documents
    title: "Document Upload & RAG",
    description: "Upload your documents and notes. AI will remember and reference them in conversations, personalized to your wallet.",
    highlight: "Your knowledge, enhanced",
  },
  {
    icon: "𓋹", // Ankh - representing eternal life/memory
    title: "Persistent Chat History",
    description: "Access all your conversations from any device. Your chat history is saved to your wallet identity forever.",
    highlight: "Cross-device memory",
  },
  {
    icon: "𓇯", // Sun disk - representing sharing/viral
    title: "Shareable Conversations",
    description: "Export conversations as images or GIFs. Share with built-in referral rewards - earn SOL when others join.",
    highlight: "Viral referral system",
  },
  {
    icon: "𓍯", // Gold symbol - representing value
    title: "SOL-Based Subscriptions",
    description: "Pay 0.15 SOL monthly or 1.5 SOL yearly. Smart contracts handle payments with built-in grace periods.",
    highlight: "Transparent pricing",
  },
];

export function FeaturesSection() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const getCardStyles = () => {
    if (isDark) {
      return {
        background: `linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(180, 135, 90, 0.05) 100%)`,
        border: '1px solid rgba(255, 215, 0, 0.2)',
        boxShadow: `
          0 4px 20px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 215, 0, 0.15)
        `,
      };
    } else {
      return {
        background: `linear-gradient(135deg, rgba(205, 133, 63, 0.08) 0%, rgba(160, 120, 87, 0.05) 100%)`,
        border: '1px solid rgba(205, 133, 63, 0.3)',
        boxShadow: `
          0 4px 20px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(205, 133, 63, 0.2)
        `,
      };
    }
  };

  const getHoverCardStyles = () => {
    if (isDark) {
      return {
        boxShadow: `
          0 8px 30px rgba(255, 215, 0, 0.2),
          inset 0 1px 0 rgba(255, 215, 0, 0.3)
        `,
      };
    } else {
      return {
        boxShadow: `
          0 8px 30px rgba(205, 133, 63, 0.15),
          inset 0 1px 0 rgba(205, 133, 63, 0.35)
        `,
      };
    }
  };

  return (
    <section id="features-section" className="py-24 px-4 sm:px-6 lg:px-8 relative" aria-label="Features section">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center space-x-3">
            <span className={`text-4xl transition-colors duration-300 ${
              isDark ? 'text-egypt-gold/80' : 'text-egypt-bronze/70'
            }`}>𓊃</span>
            <h2 className="text-4xl md:text-5xl font-bold transition-all duration-700"
                style={{
                  background: `linear-gradient(
                    135deg,
                    #FFD700 0%,
                    #B48751 50%,
                    #FFD700 100%
                  )`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: `0 0 20px rgba(255, 215, 0, ${isDark ? '0.4' : '0.2'})`,
                }}>
              Ancient Powers
            </h2>
            <span className={`text-4xl transition-colors duration-300 ${
              isDark ? 'text-egypt-gold/80' : 'text-egypt-bronze/70'
            }`}>𓊃</span>
          </div>
          <p className={`text-xl max-w-2xl mx-auto transition-colors duration-300 ${
            isDark ? 'text-foreground/80' : 'text-muted-foreground'
          }`}>
            Discover the mystical capabilities that make isis.chat the most powerful AI platform in the Solana ecosystem
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-lg transition-all duration-300 hover:scale-105"
              style={getCardStyles()}
              onMouseEnter={(e) => {
                const hoverStyles = getHoverCardStyles();
                Object.assign(e.currentTarget.style, hoverStyles);
              }}
              onMouseLeave={(e) => {
                const normalStyles = getCardStyles();
                Object.assign(e.currentTarget.style, normalStyles);
              }}
            >
              {/* Hieroglyph Icon */}
              <div className="text-6xl mb-4 text-center transition-all duration-300"
                   style={{
                     color: isDark ? '#FFD700' : '#B48751',
                     textShadow: `
                       0 0 20px rgba(255, 215, 0, ${isDark ? '0.5' : '0.2'}),
                       0 0 40px rgba(255, 215, 0, ${isDark ? '0.3' : '0.1'})
                     `,
                     filter: `drop-shadow(0 2px 4px rgba(0, 0, 0, ${isDark ? '0.5' : '0.2'}))`,
                   }}>
                {feature.icon}
              </div>

              {/* Feature Content */}
              <div className="space-y-4">
                <h3 className={`text-xl font-semibold group-hover:text-primary transition-colors duration-300 ${
                  isDark ? 'text-foreground' : 'text-foreground'
                }`}>
                  {feature.title}
                </h3>
                
                <p className={`leading-relaxed transition-colors duration-300 ${
                  isDark ? 'text-muted-foreground' : 'text-muted-foreground'
                }`}>
                  {feature.description}
                </p>
                
                <div className="pt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 transition-all duration-300">
                    {feature.highlight}
                  </span>
                </div>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                   style={{
                     background: `radial-gradient(
                       circle at 50% 50%,
                       rgba(255, 215, 0, ${isDark ? '0.05' : '0.03'}) 0%,
                       transparent 70%
                     )`,
                   }} />
            </div>
          ))}
        </div>

        {/* Bottom decoration */}
        <div className="mt-20 text-center">
          <div className={`flex items-center justify-center space-x-4 transition-colors duration-300 ${
            isDark ? 'text-egypt-gold/40' : 'text-egypt-bronze/30'
          }`}>
            <span className="text-2xl">𓂋</span>
            <div className={`w-24 h-px transition-colors duration-300 ${
              isDark ? 'bg-gradient-to-r from-transparent via-egypt-gold/40 to-transparent' : 'bg-gradient-to-r from-transparent via-egypt-bronze/30 to-transparent'
            }`} />
            <span className="text-3xl">𓇳</span>
            <div className={`w-24 h-px transition-colors duration-300 ${
              isDark ? 'bg-gradient-to-r from-transparent via-egypt-gold/40 to-transparent' : 'bg-gradient-to-r from-transparent via-egypt-bronze/30 to-transparent'
            }`} />
            <span className="text-2xl">𓂋</span>
          </div>
        </div>
      </div>
    </section>
  );
}