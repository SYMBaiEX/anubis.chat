"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

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

export function DustParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Memoized particle count to prevent unnecessary recalculations
  const particleCount = useMemo(() => 20, []); // Reduced from 30 to 20 for performance

  // Memoized initial particle generator
  const createParticle = useCallback((id: string, isReset = false): Particle => {
    const maxLife = 200 + Math.random() * 300;
    return {
      id,
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
      y: isReset ? (typeof window !== 'undefined' ? window.innerHeight : 800) + 10 : Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
      size: 1 + Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.3,
      velocityX: (Math.random() - 0.5) * 0.5,
      velocityY: -0.2 - Math.random() * 0.3,
      life: isReset ? 0 : Math.random() * maxLife,
      maxLife,
    };
  }, []);

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
      if (currentTime - lastTime >= 50) {
        setParticles(prevParticles => 
          prevParticles.map(particle => {
            let newParticle = { ...particle };
            
            // Update position
            newParticle.x += newParticle.velocityX;
            newParticle.y += newParticle.velocityY;
            newParticle.life += 1;
            
            // Reset particle if it goes out of bounds or dies
            if (
              newParticle.x < 0 || 
              newParticle.x > (typeof window !== 'undefined' ? window.innerWidth : 1200) || 
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
    initializeParticles();
    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [particleCount, createParticle]);

  return (
    <div className="absolute inset-0 pointer-events-none z-2 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: `rgba(180, 135, 90, ${particle.opacity})`,
            boxShadow: `0 0 ${particle.size * 2}px rgba(180, 135, 90, ${particle.opacity * 0.5})`,
            transition: 'all 0.1s ease-out',
          }}
        />
      ))}
      
      {/* Ambient light rays */}
      <div className="absolute top-0 left-1/4 w-1 h-full opacity-5 animate-sway"
           style={{
             background: 'linear-gradient(to bottom, rgba(255, 215, 0, 0.1), transparent)',
             transform: 'rotate(15deg)',
             animationDuration: '20s',
           }} />
      
      <div className="absolute top-0 right-1/3 w-1 h-full opacity-3"
           style={{
             background: 'linear-gradient(to bottom, rgba(255, 215, 0, 0.08), transparent)',
             transform: 'rotate(-10deg)',
             animation: 'sway-reverse 25s ease-in-out infinite',
           }} />
    </div>
  );
}