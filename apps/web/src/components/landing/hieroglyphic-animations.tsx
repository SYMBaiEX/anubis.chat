"use client";

import { useEffect, useState, useMemo } from "react";

// Authentic hieroglyphs from the Rosetta Stone and common Egyptian symbols
const hieroglyphs = [
  "𓀀", "𓀁", "𓀂", "𓀃", "𓀄", "𓀅", "𓀆", "𓀇", "𓀈", "𓀉",
  "𓀊", "𓀋", "𓀌", "𓀍", "𓀎", "𓀏", "𓀐", "𓀑", "𓀒", "𓀓",
  "𓁀", "𓁁", "𓁂", "𓁃", "𓁄", "𓁅", "𓁆", "𓁇", "𓁈", "𓁉",
  "𓂀", "𓂁", "𓂂", "𓂃", "𓂄", "𓂅", "𓂆", "𓂇", "𓂈", "𓂉",
  "𓃀", "𓃁", "𓃂", "𓃃", "𓃄", "𓃅", "𓃆", "𓃇", "𓃈", "𓃉",
  "𓄀", "𓄁", "𓄂", "𓄃", "𓄄", "𓄅", "𓄆", "𓄇", "𓄈", "𓄉",
  "𓅀", "𓅁", "𓅂", "𓅃", "𓅄", "𓅅", "𓅆", "𓅇", "𓅈", "𓅉",
  "𓆀", "𓆁", "𓆂", "𓆃", "𓆄", "𓆅", "𓆆", "𓆇", "𓆈", "𓆉",
  "𓇀", "𓇁", "𓇂", "𓇃", "𓇄", "𓇅", "𓇆", "𓇇", "𓇈", "𓇉",
  "𓈀", "𓈁", "𓈂", "𓈃", "𓈄", "𓈅", "𓈆", "𓈇", "𓈈", "𓈉",
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

export function HieroglyphicAnimations() {
  // Memoize hieroglyph data to prevent regeneration on re-renders
  const hieroglyphData = useMemo<HieroglyphData[]>(() => {
    const count = 25; // Number of hieroglyphs to display
    const newHieroglyphs: HieroglyphData[] = [];

    for (let i = 0; i < count; i++) {
      const symbol = hieroglyphs[Math.floor(Math.random() * hieroglyphs.length)];
      const x = Math.random() * 100; // Percentage
      const y = Math.random() * 100; // Percentage
      const animationDelay = Math.random() * 10; // 0-10 seconds delay
      const duration = 8 + Math.random() * 12; // 8-20 seconds duration
      const opacity = 0.1 + Math.random() * 0.2; // 0.1-0.3 opacity

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
  }, []); // Empty dependency array ensures this only runs once

  return (
    <div className="absolute inset-0 pointer-events-none z-1 overflow-hidden">
      {hieroglyphData.map((glyph) => (
        <div
          key={glyph.id}
          className="absolute text-6xl md:text-8xl animate-pulse hieroglyph-glow"
          style={{
            left: `${glyph.x}%`,
            top: `${glyph.y}%`,
            color: `rgba(180, 135, 90, ${glyph.opacity})`,
            animationDelay: `${glyph.animationDelay}s`,
            animationDuration: `${glyph.duration}s`,
            fontSize: `${3 + Math.random() * 2}rem`,
            transform: `rotate(${-15 + Math.random() * 30}deg)`,
          }}
        >
          {glyph.symbol}
        </div>
      ))}
      
      {/* Floating hieroglyph sequences - like ancient inscriptions */}
      <div className="absolute top-10 left-10 animate-fade-in-out">
        <div 
          className="text-amber-700/20 text-4xl font-bold tracking-wider"
          style={{ 
            animationDelay: '2s',
            animationDuration: '15s',
            textShadow: '0 0 20px rgba(180, 135, 90, 0.1)'
          }}
        >
          𓊪 𓏏 𓊖 𓀭 𓈖
        </div>
      </div>
      
      <div className="absolute top-1/3 right-10 animate-fade-in-out">
        <div 
          className="text-amber-600/15 text-5xl font-bold tracking-wider"
          style={{ 
            animationDelay: '5s',
            animationDuration: '12s',
            textShadow: '0 0 25px rgba(180, 135, 90, 0.15)'
          }}
        >
          𓅓 𓂋 𓇯 𓍘 𓈗
        </div>
      </div>
      
      <div className="absolute bottom-1/4 left-1/4 animate-fade-in-out">
        <div 
          className="text-yellow-800/10 text-6xl font-bold tracking-wider"
          style={{ 
            animationDelay: '8s',
            animationDuration: '18s',
            textShadow: '0 0 30px rgba(180, 135, 90, 0.08)'
          }}
        >
          𓋹 𓍑 𓏏 𓊪 𓂋
        </div>
      </div>
    </div>
  );
}