'use client';

import { motion } from 'framer-motion';
import { forwardRef, type InputHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

/**
 * Animated input with floating label and smooth transitions
 */
const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, label, error, icon, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value.length > 0);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    return (
      <div className="relative">
        {label && (
          <motion.label
            animate={{
              top: isFocused || hasValue || props.value ? '0%' : '50%',
              fontSize:
                isFocused || hasValue || props.value ? '0.75rem' : '1rem',
              color: isFocused
                ? 'hsl(var(--primary))'
                : error
                  ? 'hsl(var(--destructive))'
                  : 'hsl(var(--muted-foreground))',
            }}
            className={cn(
              'pointer-events-none absolute left-3 transition-all',
              'text-muted-foreground',
              isFocused || hasValue || props.value
                ? '-translate-y-5 top-0 bg-background px-1 text-xs'
                : '-translate-y-1/2 top-1/2'
            )}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          {icon && (
            <div className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
              {icon}
            </div>
          )}

          <input
            className={cn(
              'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
              'ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-colors',
              icon && 'pl-10',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
            ref={ref}
            style={{
              borderColor: isFocused
                ? 'hsl(var(--primary))'
                : error
                  ? 'hsl(var(--destructive))'
                  : undefined,
              transition: 'border-color 0.2s',
            }}
            {...props}
          />

          {/* Focus line animation */}
          <motion.div
            animate={{ width: isFocused ? '100%' : 0 }}
            className="absolute bottom-0 left-0 h-0.5 bg-primary"
            initial={{ width: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-destructive text-xs"
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';

export { AnimatedInput };
