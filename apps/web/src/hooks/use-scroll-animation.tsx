import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollAnimation({
  threshold = 0.1,
  triggerOnce = false,
  rootMargin = '0px',
}: UseScrollAnimationOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const isInView = useInView(ref, {
    once: triggerOnce,
    margin: rootMargin as any,
    amount: threshold,
  });

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    } else if (!triggerOnce) {
      controls.start('hidden');
    }
  }, [isInView, controls, triggerOnce]);

  return {
    ref,
    controls,
    isInView,
  };
}

/**
 * Preset animation variants for scroll animations
 */
export const scrollAnimationVariants = {
  fadeInUp: {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
  rotateIn: {
    hidden: { opacity: 0, rotate: -10 },
    visible: {
      opacity: 1,
      rotate: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
};

/**
 * Component wrapper for scroll animations
 */
interface ScrollAnimationProps {
  children: React.ReactNode;
  variant?: keyof typeof scrollAnimationVariants;
  className?: string;
  delay?: number;
}

export function ScrollAnimation({
  children,
  variant = 'fadeInUp',
  className,
  delay = 0,
}: ScrollAnimationProps) {
  const { ref, controls } = useScrollAnimation({ triggerOnce: true });

  return (
    <motion.div
      animate={controls}
      className={className}
      initial="hidden"
      ref={ref}
      transition={{ delay }}
      variants={scrollAnimationVariants[variant] as any}
    >
      {children}
    </motion.div>
  );
}
