'use client';

import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RosettaHieroglyphs } from '@/components/effects/rosetta-hieroglyphs';
import IsisAurora from '@/components/IsisAurora';
import { HieroglyphicAnimations } from '@/components/landing/hieroglyphic-animations';
import { TombBackground } from '@/components/landing/tomb-background';

export type AnimationIntensity = 'low' | 'medium' | 'high';

/**
 * AnimatedSection wraps a content block with layered background animations.
 *
 * Intensity levels control visual density and motion:
 * - 'low': minimal elements, longer durations, lower opacity (default)
 * - 'medium': balanced elements and durations
 * - 'high': more elements, shorter durations, higher opacity
 *
 * Notes:
 * - Respects prefers-reduced-motion and disables animations when enabled
 * - Uses IntersectionObserver to pause animations when section is off-screen
 * - Decorative layers can be toggled via props:
 *   - includeRosetta (default false) shows subtle Rosetta Stone overlay
 *   - includeHieroglyphs (default true) renders ambient hieroglyphic animations
 */
interface AnimatedSectionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'className'> {
  children: React.ReactNode;
  className?: string;
  auroraVariant?: 'primary' | 'gold' | undefined;
  includeTomb?: boolean;
  includeRosetta?: boolean;
  /** Toggle decorative hieroglyphic effects (default: true) */
  includeHieroglyphs?: boolean;
  glyphIntensity?: AnimationIntensity;
  dustIntensity?: AnimationIntensity;
  edgeMask?: boolean;
  /** Allow background visuals to bleed beyond section bounds */
  allowOverlap?: boolean;
}

export default function AnimatedSection({
  children,
  className,
  auroraVariant,
  includeTomb = false,
  includeRosetta = false,
  includeHieroglyphs = false,
  glyphIntensity = 'low',
  dustIntensity = 'low',
  edgeMask = false,
  allowOverlap = false,
  ...rest
}: AnimatedSectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState<boolean>(true);

  const effectiveIntensity = useMemo(() => {
    // Base on props
    let glyph = glyphIntensity;
    let dust = dustIntensity;

    // Reduce for small screens
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      glyph = 'low';
      dust = 'low';
    }
    // Reduce for low device memory if available
    const dm = (typeof navigator !== 'undefined' &&
      (navigator as any).deviceMemory) as number | undefined;
    if (dm && dm < 4) {
      glyph = 'low';
      dust = 'low';
    }
    return { glyph, dust } as const;
  }, [glyphIntensity, dustIntensity]);

  useEffect(() => {
    if (!ref.current) return;
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      setActive(false);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setActive(entry.isIntersecting);
        }
      },
      { root: null, threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className={`relative ${allowOverlap ? 'overflow-visible' : 'overflow-hidden'} ${className ?? ''}`}
      ref={ref}
      {...rest}
    >
      {/* Background layers (non-interactive) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={
          edgeMask
            ? {
                WebkitMaskImage:
                  'radial-gradient(circle at 50% 50%, transparent 0 55%, white 75%)',
                maskImage:
                  'radial-gradient(circle at 50% 50%, transparent 0 55%, white 75%)',
              }
            : undefined
        }
      >
        {includeTomb && <TombBackground showAccentGlow={false} />}
        {includeRosetta && <RosettaHieroglyphs />}
        {includeHieroglyphs && (
          <HieroglyphicAnimations
            intensity={effectiveIntensity.glyph}
            shouldAnimate={active}
          />
        )}
      </div>
      {auroraVariant !== undefined &&
        (auroraVariant ? (
          <IsisAurora variant={auroraVariant} />
        ) : (
          <IsisAurora />
        ))}

      {/* Foreground content */}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
