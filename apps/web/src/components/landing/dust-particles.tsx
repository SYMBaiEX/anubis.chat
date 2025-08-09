'use client';

import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
}

export type AnimationIntensity = 'low' | 'medium' | 'high';

interface Props {
  shouldAnimate?: boolean;
  intensity?: AnimationIntensity;
}

export function DustParticles({
  shouldAnimate = true,
  intensity = 'low',
}: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Memoized particle count to prevent unnecessary recalculations
  const particleCount = useMemo(
    () => (intensity === 'high' ? 18 : intensity === 'medium' ? 14 : 10),
    [intensity]
  );

  // Memoized initial particle generator
  const createParticle = useCallback(
    (id: string, isReset = false): Particle => {
      const maxLife = 200 + Math.random() * 300;
      return {
        id,
        x:
          Math.random() *
          (typeof window !== 'undefined' ? window.innerWidth : 1200),
        y: isReset
          ? (typeof window !== 'undefined' ? window.innerHeight : 800) + 10
          : Math.random() *
            (typeof window !== 'undefined' ? window.innerHeight : 800),
        size: 1 + Math.random() * 3,
        opacity: 0.1 + Math.random() * 0.3,
        velocityX: (Math.random() - 0.5) * 0.5,
        velocityY: -0.2 - Math.random() * 0.3,
        life: isReset ? 0 : Math.random() * maxLife,
        maxLife,
      };
    },
    []
  );

  useEffect(() => {
    // Initialize particles with memoized generator
    const initializeParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        newParticles.push(createParticle(`particle-${i}`));
      }
      setParticles(newParticles);
    };

    // Optimized animation loop using requestAnimationFrame
    let animationId: number;
    let lastTime = 0;

    const animate = (currentTime: number) => {
      // Throttle to ~20fps for performance
      const frameGap =
        intensity === 'high' ? 55 : intensity === 'medium' ? 65 : 75;
      if (currentTime - lastTime >= frameGap) {
        setParticles((prevParticles) =>
          prevParticles.map((particle) => {
            const newParticle = { ...particle };

            // Update position
            newParticle.x += newParticle.velocityX;
            newParticle.y += newParticle.velocityY;
            newParticle.life += 1;

            // Reset particle if it goes out of bounds or dies
            if (
              newParticle.x < 0 ||
              newParticle.x >
                (typeof window !== 'undefined' ? window.innerWidth : 1200) ||
              newParticle.y < 0 ||
              newParticle.life > newParticle.maxLife
            ) {
              return createParticle(particle.id, true);
            }

            // Optimized fade effect
            const lifeRatio = newParticle.life / newParticle.maxLife;
            if (lifeRatio > 0.8) {
              newParticle.opacity = particle.opacity * (1 - lifeRatio) * 5;
            } else if (lifeRatio < 0.2) {
              newParticle.opacity = particle.opacity * lifeRatio * 5;
            }

            return newParticle;
          })
        );
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(animate);
    };

    // Initialize and start animation
    if (shouldAnimate) {
      initializeParticles();
      animationId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [particleCount, createParticle, intensity, shouldAnimate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const isDark = resolvedTheme === 'dark';

  // Use ISIS primary (bright green) for dark theme particles with glow effect
  // Use Egyptian stone colors for light theme for subtle, sandstorm-like effect
  const particleColor = isDark
    ? 'var(--isis-primary)' // Bright green particles for dark theme
    : 'var(--egypt-stone)'; // Sandy brown for light theme

  // Accent particles for variety
  const accentParticleColor = isDark
    ? 'var(--isis-accent)' // Purple accent for dark theme
    : 'var(--egypt-bronze)'; // Bronze accent for light theme

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-2 overflow-hidden"
    >
      {shouldAnimate &&
        particles.map((particle, index) => {
          // Alternate between primary and accent colors for variety
          const useAccent = index % 3 === 0;
          const currentColor = useAccent ? accentParticleColor : particleColor;

          return (
            <div
              className="absolute rounded-full"
              key={particle.id}
              style={{
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: currentColor,
                opacity: particle.opacity,
                boxShadow: isDark
                  ? `0 0 ${particle.size * 3}px ${currentColor}, 0 0 ${particle.size * 6}px ${currentColor}66`
                  : `0 0 ${particle.size * 2}px rgba(0,0,0,0.1)`,
                filter: isDark ? 'blur(0.5px)' : 'blur(0.3px)',
                transition: 'all 0.1s ease-out',
              }}
            />
          );
        })}

      {/* Ambient light rays */}
      {shouldAnimate && (
        <div
          className="absolute top-0 left-1/4 h-full w-2 animate-sway"
          style={{
            background: isDark
              ? 'linear-gradient(to bottom, var(--isis-primary)20, transparent 60%)'
              : 'linear-gradient(to bottom, var(--egypt-gold)15, transparent 50%)',
            transform: 'rotate(15deg)',
            animationDuration: '20s',
            opacity: isDark ? 0.08 : 0.05,
            filter: 'blur(20px)',
          }}
        />
      )}

      {shouldAnimate && (
        <div
          className="absolute top-0 right-1/3 h-full w-2"
          style={{
            background: isDark
              ? 'linear-gradient(to bottom, var(--isis-accent)18, transparent 65%)'
              : 'linear-gradient(to bottom, var(--egypt-bronze)12, transparent 55%)',
            transform: 'rotate(-10deg)',
            animation: 'sway-reverse 25s ease-in-out infinite',
            opacity: isDark ? 0.06 : 0.04,
            filter: 'blur(25px)',
          }}
        />
      )}
    </div>
  );
}
