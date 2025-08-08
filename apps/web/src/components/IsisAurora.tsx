"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface IsisAuroraProps {
  className?: string;
  variant?: 'primary' | 'gold' | 'both';
}

export function IsisAurora({ className, variant = 'both' }: IsisAuroraProps) {
  return (
    <div className={cn('pointer-events-none absolute inset-0', className)} aria-hidden="true">
      {(variant === 'primary' || variant === 'both') && (
        <div className="aurora aurora-primary" />
      )}
      {(variant === 'gold' || variant === 'both') && (
        <div className="aurora aurora-gold" />
      )}
    </div>
  );
}

export default IsisAurora;


