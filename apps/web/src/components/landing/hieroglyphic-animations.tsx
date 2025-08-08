'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';

// Authentic hieroglyphs from the Rosetta Stone and common Egyptian symbols
const hieroglyphs = [
  '𓀀',
  '𓀁',
  '𓀂',
  '𓀃',
  '𓀄',
  '𓀅',
  '𓀆',
  '𓀇',
  '𓀈',
  '𓀉',
  '𓀊',
  '𓀋',
  '𓀌',
  '𓀍',
  '𓀎',
  '𓀏',
  '𓀐',
  '𓀑',
  '𓀒',
  '𓀓',
  '𓁀',
  '𓁁',
  '𓁂',
  '𓁃',
  '𓁄',
  '𓁅',
  '𓁆',
  '𓁇',
  '𓁈',
  '𓁉',
  '𓂀',
  '𓂁',
  '𓂂',
  '𓂃',
  '𓂄',
  '𓂅',
  '𓂆',
  '𓂇',
  '𓂈',
  '𓂉',
  '𓃀',
  '𓃁',
  '𓃂',
  '𓃃',
  '𓃄',
  '𓃅',
  '𓃆',
  '𓃇',
  '𓃈',
  '𓃉',
  '𓄀',
  '𓄁',
  '𓄂',
  '𓄃',
  '𓄄',
  '𓄅',
  '𓄆',
  '𓄇',
  '𓄈',
  '𓄉',
  '𓅀',
  '𓅁',
  '𓅂',
  '𓅃',
  '𓅄',
  '𓅅',
  '𓅆',
  '𓅇',
  '𓅈',
  '𓅉',
  '𓆀',
  '𓆁',
  '𓆂',
  '𓆃',
  '𓆄',
  '𓆅',
  '𓆆',
  '𓆇',
  '𓆈',
  '𓆉',
  '𓇀',
  '𓇁',
  '𓇂',
  '𓇃',
  '𓇄',
  '𓇅',
  '𓇆',
  '𓇇',
  '𓇈',
  '𓇉',
  '𓈀',
  '𓈁',
  '𓈂',
  '𓈃',
  '𓈄',
  '𓈅',
  '𓈆',
  '𓈇',
  '𓈈',
  '𓈉',
];

interface HieroglyphData {
  id: string;
  symbol: string;
  x: number;
  y: number;
  animationDelay: number;
  duration: number;
  opacity: number;
}

export type AnimationIntensity = 'low' | 'medium' | 'high';

interface Props {
  shouldAnimate?: boolean;
  intensity?: AnimationIntensity;
}

export function HieroglyphicAnimations({
  shouldAnimate = true,
  intensity = 'low',
}: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Memoize hieroglyph data to prevent regeneration on re-renders
  const hieroglyphData = useMemo<HieroglyphData[]>(() => {
    const count = intensity === 'high' ? 20 : intensity === 'medium' ? 14 : 10;
    const newHieroglyphs: HieroglyphData[] = [];

    // Create a grid-based distribution with randomization
    const cols = 5;
    const rows = Math.ceil(count / cols);
    const cellWidth = 100 / cols;
    const cellHeight = 100 / rows;

    for (let i = 0; i < count; i++) {
      const symbol =
        hieroglyphs[Math.floor(Math.random() * hieroglyphs.length)];
      
      // Calculate grid position
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      // Add randomization within each cell to avoid perfect grid
      // Keep glyphs away from center (40-60% range)
      let x = col * cellWidth + (Math.random() * cellWidth * 0.8);
      let y = row * cellHeight + (Math.random() * cellHeight * 0.8);
      
      // Push glyphs away from the center hero area
      if (x > 35 && x < 65) {
        x = x < 50 ? x - 15 : x + 15;
      }
      if (y > 35 && y < 65) {
        y = y < 50 ? y - 15 : y + 15;
      }
      const animationDelay =
        Math.random() *
        (intensity === 'high' ? 15 : intensity === 'medium' ? 20 : 25);
      const duration =
        intensity === 'high'
          ? 5 + Math.random() * 10
          : intensity === 'medium'
            ? 8 + Math.random() * 12
            : 10 + Math.random() * 15;
      const opacityBase =
        intensity === 'high' ? 0.14 : intensity === 'medium' ? 0.12 : 0.08;
      const opacity = opacityBase + Math.random() * 0.08;

      newHieroglyphs.push({
        id: `hieroglyph-${i}`,
        symbol,
        x,
        y,
        animationDelay,
        duration,
        opacity,
      });
    }

    return newHieroglyphs;
  }, [intensity]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add CSS animation to document if not already present
  useEffect(() => {
    const styleId = 'hieroglyph-fade-animation';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes hieroglyphFadeInOut {
          0% { opacity: 0; }
          25% { opacity: 0.3; }
          50% { opacity: 0.5; }
          75% { opacity: 0.3; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const isDark = resolvedTheme === 'dark';
  
  // Use ISIS primary (bright green) and Egyptian gold for dark theme
  // Use Egyptian bronze and amber for light theme for better contrast
  const glyphColors = isDark
    ? ['var(--isis-primary)', 'var(--egypt-gold)', 'var(--egypt-amber)']
    : ['var(--egypt-bronze)', 'var(--egypt-dark-stone)', 'var(--egypt-stone)'];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-1 overflow-hidden"
    >
      {shouldAnimate &&
        hieroglyphData.map((glyph, index) => {
          // Cycle through available colors for variety
          const colorIndex = index % glyphColors.length;
          const currentColor = glyphColors[colorIndex];
          
          return (
            <div
              className="hieroglyph-glow absolute text-6xl md:text-8xl"
              key={glyph.id}
              style={{
                left: `${glyph.x}%`,
                top: `${glyph.y}%`,
                color: currentColor,
                animation: `hieroglyphFadeInOut ${glyph.duration}s ${glyph.animationDelay}s infinite ease-in-out`,
                fontSize: `${3 + Math.random() * 2}rem`,
                transform: `rotate(${-15 + Math.random() * 30}deg)`,
                textShadow: isDark 
                  ? `0 0 20px ${currentColor}, 0 0 40px ${currentColor}33` 
                  : `0 2px 4px rgba(0,0,0,0.1)`,
              }}
            >
              {glyph.symbol}
            </div>
          );
        })}

      {/* Floating hieroglyph sequences - like ancient inscriptions */}
      {shouldAnimate && (
        <div className="absolute top-10 left-10 animate-fade-in-out">
          <div
            className="font-bold text-4xl tracking-wider"
            style={{
              color: isDark ? 'var(--egypt-gold)' : 'var(--egypt-bronze)',
              opacity: isDark ? 0.15 : 0.12,
              animationDelay: '2s',
              animationDuration: '15s',
              textShadow: isDark 
                ? '0 0 30px var(--egypt-gold), 0 0 60px var(--isis-primary)' 
                : '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            𓊪 𓏏 𓊖 𓀭 𓈖
          </div>
        </div>
      )}

      {shouldAnimate && (
        <div className="absolute top-1/3 right-10 animate-fade-in-out">
          <div
            className="font-bold text-5xl tracking-wider"
            style={{
              color: isDark ? 'var(--isis-primary)' : 'var(--egypt-dark-stone)',
              opacity: isDark ? 0.12 : 0.1,
              animationDelay: '5s',
              animationDuration: '12s',
              textShadow: isDark 
                ? '0 0 35px var(--isis-primary), 0 0 70px var(--isis-accent)' 
                : '0 3px 10px rgba(0,0,0,0.12)',
            }}
          >
            𓅓 𓂋 𓇯 𓍘 𓈗
          </div>
        </div>
      )}

      {shouldAnimate && (
        <div className="absolute bottom-1/4 left-1/4 animate-fade-in-out">
          <div
            className="font-bold text-6xl tracking-wider"
            style={{
              color: isDark ? 'var(--isis-accent)' : 'var(--egypt-amber)',
              opacity: isDark ? 0.1 : 0.08,
              animationDelay: '8s',
              animationDuration: '18s',
              textShadow: isDark 
                ? '0 0 40px var(--isis-accent), 0 0 80px var(--isis-primary)' 
                : '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            𓋹 𓍑 𓏏 𓊪 𓂋
          </div>
        </div>
      )}
    </div>
  );
}
