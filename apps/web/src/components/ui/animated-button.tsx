'use client';

import type { VariantProps } from 'class-variance-authority';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Button, type buttonVariants } from './button';

export interface AnimatedButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  ripple?: boolean;
  scale?: boolean;
  glow?: boolean;
  shake?: boolean;
}

/**
 * Animated button with micro-interactions
 */
const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      className,
      variant,
      size,
      children,
      ripple = true,
      scale = true,
      glow = false,
      shake = false,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled) {
        // Create ripple effect
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const rippleElement = document.createElement('span');
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;

        rippleElement.style.width =
          rippleElement.style.height = `${diameter}px`;
        rippleElement.style.left = `${e.clientX - rect.left - radius}px`;
        rippleElement.style.top = `${e.clientY - rect.top - radius}px`;
        rippleElement.className =
          'animate-ripple absolute rounded-full bg-current opacity-20 pointer-events-none';

        button.appendChild(rippleElement);
        setTimeout(() => rippleElement.remove(), 600);
      }

      onClick?.(e);
    };

    return (
      <Button
        className={cn(
          'relative overflow-hidden transition-transform',
          scale && !disabled && 'hover:scale-105 active:scale-95',
          glow &&
            'shadow-lg transition-shadow hover:shadow-primary/25 hover:shadow-xl',
          shake && 'animate-shake',
          className
        )}
        disabled={disabled}
        onClick={handleClick}
        ref={ref}
        size={size}
        variant={variant}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

export { AnimatedButton };
