'use client';

import type * as React from 'react';
import { cn } from '@/lib/utils';

type LandingSectionProps = React.ComponentProps<'section'>;

export function LandingSection({ className, children, ...props }: LandingSectionProps) {
  return (
    <section
      className={cn(
        'relative bg-background light:papyrus-surface dark:basalt-surface py-20 md:py-28',
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}


