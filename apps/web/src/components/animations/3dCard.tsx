'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  intensity?: number;
  scale?: number;
  perspective?: number;
}

export function Card3D({
  children,
  className,
  containerClassName,
  intensity = 10,
  scale = 1.05,
  perspective = 1000,
}: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    [`${intensity}deg`, `-${intensity}deg`]
  );
  const rotateY = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    [`-${intensity}deg`, `${intensity}deg`]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div className={cn('relative', containerClassName)} style={{ perspective }}>
      <motion.div
        animate={{
          scale: isHovered ? scale : 1,
        }}
        className={cn('relative transform-gpu transition-transform', className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        ref={ref}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        transition={{
          scale: {
            duration: 0.3,
            ease: 'easeOut',
          },
        }}
      >
        {children}

        {/* Glossy overlay effect */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%)',
            opacity: isHovered ? 1 : 0,
          }}
        />
      </motion.div>
    </div>
  );
}

// 3D Flip Card
interface FlipCard3DProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  containerClassName?: string;
  flipDirection?: 'horizontal' | 'vertical';
}

export function FlipCard3D({
  front,
  back,
  className,
  containerClassName,
  flipDirection = 'horizontal',
}: FlipCard3DProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const rotateValue = flipDirection === 'horizontal' ? 'rotateY' : 'rotateX';

  return (
    <div
      className={cn('relative h-full w-full', containerClassName)}
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{ [rotateValue]: isFlipped ? 180 : 0 }}
        className={cn('relative h-full w-full', className)}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ transformStyle: 'preserve-3d' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {front}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform:
              flipDirection === 'horizontal'
                ? 'rotateY(180deg)'
                : 'rotateX(180deg)',
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}

// 3D Parallax Container
interface Parallax3DProps {
  children: React.ReactNode;
  className?: string;
  layers?: number;
  offset?: number;
}

export function Parallax3D({
  children,
  className,
  layers = 3,
  offset = 50,
}: Parallax3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setPosition({ x, y });
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onMouseLeave={() => setPosition({ x: 0, y: 0 })}
      onMouseMove={handleMouseMove}
      ref={ref}
      style={{ perspective: 1000 }}
    >
      {Array.from({ length: layers }).map((_, index) => {
        const depth = (index + 1) / layers;
        const movement = offset * depth;

        return (
          <motion.div
            animate={{
              x: position.x * movement,
              y: position.y * movement,
              scale: 1 + depth * 0.1,
            }}
            className="absolute inset-0"
            key={index}
            style={{
              zIndex: layers - index,
            }}
            transition={{
              type: 'spring',
              stiffness: 150,
              damping: 15,
            }}
          >
            {index === 0 && children}
          </motion.div>
        );
      })}
    </div>
  );
}

// 3D Cube
interface Cube3DProps {
  faces: {
    front?: React.ReactNode;
    back?: React.ReactNode;
    left?: React.ReactNode;
    right?: React.ReactNode;
    top?: React.ReactNode;
    bottom?: React.ReactNode;
  };
  size?: number;
  className?: string;
  autoRotate?: boolean;
}

export function Cube3D({
  faces,
  size = 200,
  className,
  autoRotate = false,
}: Cube3DProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  return (
    <div
      className={cn('relative', className)}
      style={{
        width: size,
        height: size,
        perspective: size * 4,
      }}
    >
      <motion.div
        animate={
          autoRotate
            ? {
                rotateX: [0, 360],
                rotateY: [0, 360],
              }
            : {
                rotateX: rotation.x,
                rotateY: rotation.y,
              }
        }
        className="relative h-full w-full"
        drag
        dragElastic={0.2}
        onDrag={(_, info) => {
          setRotation({
            x: rotation.x + info.delta.y,
            y: rotation.y + info.delta.x,
          });
        }}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
        transition={
          autoRotate
            ? {
                duration: 20,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              }
            : {
                type: 'spring',
                stiffness: 100,
                damping: 10,
              }
        }
      >
        {/* Front */}
        {faces.front && (
          <div
            className="absolute flex items-center justify-center border bg-card"
            style={{
              width: size,
              height: size,
              transform: `translateZ(${size / 2}px)`,
            }}
          >
            {faces.front}
          </div>
        )}

        {/* Back */}
        {faces.back && (
          <div
            className="absolute flex items-center justify-center border bg-card"
            style={{
              width: size,
              height: size,
              transform: `rotateY(180deg) translateZ(${size / 2}px)`,
            }}
          >
            {faces.back}
          </div>
        )}

        {/* Left */}
        {faces.left && (
          <div
            className="absolute flex items-center justify-center border bg-card"
            style={{
              width: size,
              height: size,
              transform: `rotateY(-90deg) translateZ(${size / 2}px)`,
            }}
          >
            {faces.left}
          </div>
        )}

        {/* Right */}
        {faces.right && (
          <div
            className="absolute flex items-center justify-center border bg-card"
            style={{
              width: size,
              height: size,
              transform: `rotateY(90deg) translateZ(${size / 2}px)`,
            }}
          >
            {faces.right}
          </div>
        )}

        {/* Top */}
        {faces.top && (
          <div
            className="absolute flex items-center justify-center border bg-card"
            style={{
              width: size,
              height: size,
              transform: `rotateX(90deg) translateZ(${size / 2}px)`,
            }}
          >
            {faces.top}
          </div>
        )}

        {/* Bottom */}
        {faces.bottom && (
          <div
            className="absolute flex items-center justify-center border bg-card"
            style={{
              width: size,
              height: size,
              transform: `rotateX(-90deg) translateZ(${size / 2}px)`,
            }}
          >
            {faces.bottom}
          </div>
        )}
      </motion.div>
    </div>
  );
}
