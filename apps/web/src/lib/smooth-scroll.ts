/**
 * Modern Smooth Scrolling Utilities (2025 Best Practices)
 * Comprehensive smooth scrolling implementation with accessibility and performance optimizations
 */

export interface SmoothScrollOptions {
  /** Target element to scroll to */
  target: Element | string;
  /** Offset from the top of the viewport */
  offset?: number;
  /** Scroll behavior - 'smooth' | 'auto' | 'instant' */
  behavior?: ScrollBehavior;
  /** Duration of the scroll animation in milliseconds */
  duration?: number;
  /** Easing function for the animation */
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  /** Callback function called when scroll completes */
  onComplete?: () => void;
  /** Whether to respect user motion preferences */
  respectMotion?: boolean;
}

export interface ScrollToOptions {
  /** Target element or selector */
  target: Element | string;
  /** Offset from the top */
  offset?: number;
  /** Scroll behavior */
  behavior?: ScrollBehavior;
  /** Callback on completion */
  onComplete?: () => void;
}

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get the target element from a string selector or Element
 */
const getTargetElement = (target: Element | string): Element | null => {
  if (typeof target === 'string') {
    return document.querySelector(target);
  }
  return target;
};

/**
 * Calculate the target scroll position
 */
const calculateScrollPosition = (target: Element, offset = 0): number => {
  const rect = target.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return rect.top + scrollTop - offset;
};

/**
 * Custom easing functions
 */
const easingFunctions = {
  ease: (t: number): number => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  'ease-in': (t: number): number => t * t,
  'ease-out': (t: number): number => t * (2 - t),
  'ease-in-out': (t: number): number =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  linear: (t: number): number => t,
};

/**
 * Smooth scroll to element with custom animation
 */
export const smoothScrollTo = async (
  options: SmoothScrollOptions
): Promise<void> => {
  const {
    target,
    offset = 0,
    behavior = 'smooth',
    duration = 800,
    easing = 'ease-in-out',
    onComplete,
    respectMotion = true,
  } = options;

  // Respect user motion preferences
  if (respectMotion && prefersReducedMotion()) {
    const element = getTargetElement(target);
    if (element) {
      element.scrollIntoView({ behavior: 'auto' });
      onComplete?.();
    }
    return;
  }

  const targetElement = getTargetElement(target);
  if (!targetElement) {
    console.warn('Smooth scroll target not found:', target);
    return;
  }

  const startPosition = window.pageYOffset;
  const targetPosition = calculateScrollPosition(targetElement, offset);
  const distance = targetPosition - startPosition;

  // Use native smooth scrolling if available and no custom duration
  if (behavior === 'smooth' && duration === 800) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    // Wait for scroll to complete
    setTimeout(() => {
      onComplete?.();
    }, duration);
    return;
  }

  // Custom smooth scrolling animation
  return new Promise((resolve) => {
    const startTime = performance.now();
    const easingFn = easingFunctions[easing];

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);

      const currentPosition = startPosition + distance * easedProgress;
      window.scrollTo(0, currentPosition);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
};

/**
 * Scroll to element with simplified options
 */
export const scrollTo = async (options: ScrollToOptions): Promise<void> => {
  const { target, offset = 0, behavior = 'smooth', onComplete } = options;

  return smoothScrollTo({
    target,
    offset,
    behavior,
    onComplete,
  });
};

/**
 * Scroll to top of the page
 */
export const scrollToTop = async (
  options?: Partial<SmoothScrollOptions>
): Promise<void> => {
  return smoothScrollTo({
    target: document.documentElement,
    offset: 0,
    behavior: 'smooth',
    ...options,
  });
};

/**
 * Scroll to bottom of the page
 */
export const scrollToBottom = async (
  options?: Partial<SmoothScrollOptions>
): Promise<void> => {
  const scrollHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;

  return smoothScrollTo({
    target: document.documentElement,
    offset: -(scrollHeight - viewportHeight),
    behavior: 'smooth',
    ...options,
  });
};

/**
 * Scroll element into view with offset
 */
export const scrollIntoView = (
  element: Element,
  options?: {
    offset?: number;
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
    inline?: ScrollLogicalPosition;
  }
): void => {
  const {
    offset = 0,
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest',
  } = options || {};

  if (prefersReducedMotion()) {
    element.scrollIntoView({ behavior: 'auto', block, inline });
    return;
  }

  // Apply offset using scroll-padding
  const originalScrollPadding = document.documentElement.style.scrollPaddingTop;
  document.documentElement.style.scrollPaddingTop = `${offset}px`;

  element.scrollIntoView({ behavior, block, inline });

  // Restore original scroll-padding
  setTimeout(() => {
    document.documentElement.style.scrollPaddingTop = originalScrollPadding;
  }, 100);
};

/**
 * Smooth scroll to hash in URL
 */
export const scrollToHash = async (
  hash: string,
  options?: Partial<SmoothScrollOptions>
): Promise<void> => {
  const element = document.querySelector(hash);
  if (element) {
    return smoothScrollTo({
      target: element,
      ...options,
    });
  }
};

/**
 * Initialize smooth scrolling for anchor links
 */
export const initSmoothScrolling = (): void => {
  if (typeof window === 'undefined') return;

  // Handle anchor link clicks
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href^="#"]');

    if (link) {
      const href = link.getAttribute('href');
      if (href && href !== '#') {
        event.preventDefault();
        scrollToHash(href);
      }
    }
  });

  // Handle hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash) {
      scrollToHash(hash);
    }
  });
};

/**
 * Get current scroll position
 */
export const getScrollPosition = (): { x: number; y: number } => {
  if (typeof window === 'undefined') return { x: 0, y: 0 };

  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  };
};

/**
 * Check if element is in viewport
 */
export const isInViewport = (element: Element): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Get scroll direction
 */
export const getScrollDirection = (): 'up' | 'down' | null => {
  if (typeof window === 'undefined') return null;

  const currentScroll = getScrollPosition().y;
  const previousScroll = (window as any).__previousScroll || 0;

  (window as any).__previousScroll = currentScroll;

  if (currentScroll > previousScroll) return 'down';
  if (currentScroll < previousScroll) return 'up';
  return null;
};
