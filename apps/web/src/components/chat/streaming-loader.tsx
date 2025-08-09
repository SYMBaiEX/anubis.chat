'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StreamingLoaderProps {
  className?: string;
  variant?: 'dots' | 'pulse' | 'typing' | 'wave';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function StreamingLoader({
  className,
  variant = 'dots',
  size = 'md',
  color,
}: StreamingLoaderProps) {
  const sizeClasses = {
    sm: 'h-1 w-1',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
  };

  const containerClasses = {
    sm: 'space-x-1',
    md: 'space-x-2',
    lg: 'space-x-3',
  };

  if (variant === 'dots') {
    return (
      <div
        className={cn('flex items-center', containerClasses[size], className)}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            animate={{
              y: [0, -8, 0],
              opacity: [0.3, 1, 0.3],
            }}
            className={cn('rounded-full bg-primary', sizeClasses[size])}
            key={index}
            style={{ backgroundColor: color }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              delay: index * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('relative', className)}>
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.75, 0.25, 0.75],
          }}
          className={cn(
            'rounded-full bg-primary opacity-75',
            size === 'sm' && 'h-4 w-4',
            size === 'md' && 'h-6 w-6',
            size === 'lg' && 'h-8 w-8'
          )}
          style={{ backgroundColor: color }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          className={cn(
            'absolute inset-0 rounded-full bg-primary',
            size === 'sm' && 'h-4 w-4',
            size === 'md' && 'h-6 w-6',
            size === 'lg' && 'h-8 w-8'
          )}
          style={{ backgroundColor: color }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
      </div>
    );
  }

  if (variant === 'typing') {
    return (
      <div className={cn('flex items-end', containerClasses[size], className)}>
        {[0, 1, 2].map((index) => (
          <motion.div
            animate={{
              scaleY: [1, 2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            className={cn(
              'bg-primary/60 backdrop-blur',
              sizeClasses[size],
              index === 0 && 'rounded-l-full',
              index === 2 && 'rounded-r-full',
              index === 1 && 'mx-0.5'
            )}
            key={index}
            style={{ backgroundColor: color }}
            transition={{
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
              delay: index * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={cn('flex items-center space-x-1', className)}>
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.div
            animate={{
              scaleY: [0.5, 1, 0.5],
            }}
            className={cn(
              'bg-gradient-to-t from-primary to-primary/50',
              size === 'sm' && 'h-3 w-0.5',
              size === 'md' && 'h-4 w-1',
              size === 'lg' && 'h-6 w-1.5'
            )}
            key={index}
            style={{
              background: color
                ? `linear-gradient(to top, ${color}, ${color}88)`
                : undefined,
            }}
            transition={{
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
              delay: index * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}

export default StreamingLoader;
