'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import FallingHieroglyphs from './effects/falling-hieroglyphs';

/**
 * Global background that applies off-white papyrus for light and charcoal basalt for dark,
 * with tasteful, slow randomized falling hieroglyphics.
 */
export function SiteBackground() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div aria-hidden className="fixed inset-0 -z-10">
      {/* Base tone */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: isDark ? '#1b1b1c' : '#F5F2E8', // charcoal vs off-white papyrus
        }}
      />

      {/* Subtle surface texture matching theme */}
      <div className={isDark ? 'basalt-surface absolute inset-0' : 'papyrus-surface absolute inset-0'} />

      {/* Falling hieroglyphics layer */}
      <FallingHieroglyphs />
    </div>
  );
}

export default SiteBackground;


