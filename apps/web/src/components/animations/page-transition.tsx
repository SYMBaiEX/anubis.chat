'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { pageTransition } from '@/lib/animations/variants';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageTransition component that wraps pages with smooth transitions
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        animate="animate"
        className={className}
        exit="exit"
        initial="initial"
        key={pathname}
        variants={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Section transition for smaller content sections
 */
export function SectionTransition({
  children,
  className,
  delay = 0,
}: PageTransitionProps & { delay?: number }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}
