import type { Variants } from 'framer-motion';

/**
 * Fade animations
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * Scale animations
 */
export const scaleIn: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

export const popIn: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  exit: { scale: 0, opacity: 0 },
};

/**
 * Slide animations
 */
export const slideInLeft: Variants = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
};

export const slideInRight: Variants = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
};

/**
 * Stagger animations for lists
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Page transition animations
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

/**
 * Enhanced page transition with scale and blur effects
 */
export const enhancedPageTransition: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    filter: 'blur(4px)'
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { 
      duration: 0.4, 
      ease: [0.23, 1, 0.32, 1], // easeOutQuart
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    y: -20,
    filter: 'blur(4px)',
    transition: { 
      duration: 0.3, 
      ease: [0.76, 0, 0.24, 1], // easeInQuart
    },
  },
};

/**
 * Loading spinner animation
 */
export const loadingSpinner: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Number.POSITIVE_INFINITY,
      ease: 'linear',
    },
  },
};

/**
 * Loading bar animation
 */
export const loadingBar: Variants = {
  initial: { scaleX: 0, originX: 0 },
  loading: {
    scaleX: [0, 0.3, 0.7, 1],
    transition: {
      duration: 2,
      ease: [0.23, 1, 0.32, 1],
      times: [0, 0.2, 0.8, 1],
    },
  },
  complete: {
    scaleX: 1,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Route loading overlay
 */
export const routeLoadingOverlay: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3, delay: 0.2 },
  },
};

/**
 * Content fade with stagger
 */
export const contentFadeStagger: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const contentFadeItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

/**
 * Modal/Overlay animations
 */
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15 },
  },
};

/**
 * Button hover animations
 */
export const buttonHover = {
  scale: 1.05,
  transition: { type: 'spring', stiffness: 400, damping: 10 },
};

export const buttonTap = {
  scale: 0.95,
  transition: { type: 'spring', stiffness: 400, damping: 10 },
};

/**
 * Shimmer loading animation
 */
export const shimmer: Variants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      ease: 'linear',
      repeat: Number.POSITIVE_INFINITY,
    },
  },
};

/**
 * Pulse animation
 */
export const pulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: 'easeInOut',
    },
  },
};

/**
 * Floating animation
 */
export const float: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 3,
      repeat: Number.POSITIVE_INFINITY,
      ease: 'easeInOut',
    },
  },
};

/**
 * Sidebar animations
 */
export const sidebarVariants: Variants = {
  collapsed: {
    width: 56,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  expanded: {
    width: 224,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

export const sidebarMobileVariants: Variants = {
  closed: {
    x: '-100%',
    opacity: 0.8,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 35,
      mass: 0.8,
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
  open: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 35,
      mass: 0.8,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const sidebarContentVariants: Variants = {
  closed: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
  open: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

export const chatItemVariants: Variants = {
  initial: {
    opacity: 0,
    x: -10,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: -10,
    scale: 0.98,
    transition: {
      duration: 0.2,
    },
  },
  hover: {
    x: 2,
    scale: 1.01,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
  tap: {
    scale: 0.99,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
};

export const chatListContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const deleteButtonVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    x: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    x: 10,
    transition: {
      duration: 0.15,
    },
  },
  hover: {
    scale: 1.1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
  tap: {
    scale: 0.9,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
};
