'use client';

import React, { useMemo } from 'react';

const GLYPHS = [
  '𓀀','𓀁','𓀂','𓀃','𓀄','𓀅','𓀆','𓀇','𓀈','𓀉',
  '𓁀','𓁁','𓁂','𓁃','𓁄','𓁅','𓁆','𓁇','𓁈','𓁉',
  '𓂀','𓂁','𓂂','𓂃','𓂄','𓂅','𓂆','𓂇','𓂈','𓂉',
  '𓃀','𓃁','𓃂','𓃃','𓃄','𓃅','𓃆','𓃇','𓃈','𓃉',
  '𓄀','𓄁','𓄂','𓄃','𓄄','𓄅','𓄆','𓄇','𓄈','𓄉',
  '𓅀','𓅁','𓅂','𓅃','𓅄','𓅅','𓅆','𓅇','𓅈','𓅉',
  '𓆀','𓆁','𓆂','𓆃','𓆄','𓆅','𓆆','𓆇','𓆈','𓆉',
  '𓇀','𓇁','𓇂','𓇃','𓇄','𓇅','𓇆','𓇇','𓇈','𓇉',
  '𓈀','𓈁','𓈂','𓈃','𓈄','𓈅','𓈆','𓈇','𓈈','𓈉',
];

interface FallingGlyph {
  id: string;
  xPct: number;
  sizeRem: number;
  delaySec: number;
  durationSec: number;
  opacity: number;
  rotateDeg: number;
  content: string;
}

export function FallingHieroglyphs() {
  const items = useMemo<FallingGlyph[]>(() => {
    const count = 28;
    const usedXs: number[] = [];
    const list: FallingGlyph[] = [];
    for (let i = 0; i < count; i++) {
      // Distribute columns without clustering too much
      let x = Math.random() * 100;
      // Avoid too-close x columns for readability
      let attempts = 0;
      while (usedXs.some((ux) => Math.abs(ux - x) < 4) && attempts < 10) {
        x = Math.random() * 100;
        attempts++;
      }
      usedXs.push(x);

      const sizeRem = 1.8 + Math.random() * 2.2; // 1.8rem - 4rem
      const delaySec = Math.random() * 12; // Staggered
      const durationSec = 18 + Math.random() * 18; // Slow 18-36s
      const opacity = 0.06 + Math.random() * 0.12; // Very subtle
      const rotateDeg = -8 + Math.random() * 16;
      const content = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

      list.push({
        id: `hiero-${i}`,
        xPct: x,
        sizeRem,
        delaySec,
        durationSec,
        opacity,
        rotateDeg,
        content,
      });
    }
    return list;
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {items.map((g) => (
        <div
          key={g.id}
          className="falling-hiero hieroglyphic select-none"
          style={{
            left: `${g.xPct}%`,
            fontSize: `${g.sizeRem}rem`,
            animationDelay: `${g.delaySec}s`,
            animationDuration: `${g.durationSec}s`,
            opacity: g.opacity,
            transform: `rotate(${g.rotateDeg}deg)`,
            color: 'rgba(180, 135, 90, 0.8)', // bronze-gold tint
          }}
        >
          {g.content}
        </div>
      ))}
    </div>
  );
}

export default FallingHieroglyphs;


