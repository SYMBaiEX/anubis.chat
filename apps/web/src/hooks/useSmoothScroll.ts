'use client';

/**
 * React Hooks for Smooth Scrolling (2025 Best Practices)
 * Custom hooks for smooth scrolling functionality in React components
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getScrollDirection,
  getScrollPosition,
  isInViewport,
  prefersReducedMotion,
  type ScrollToOptions,
  type SmoothScrollOptions,
  scrollIntoView,
  scrollTo,
  scrollToBottom,
  scrollToHash,
  scrollToTop,
  smoothScrollTo,
} from '@/lib/smooth-scroll';

/**
 * Hook for smooth scrolling functionality
 */
export const useSmoothScroll = () => {
  const scrollToElement = useCallback(async (options: ScrollToOptions) => {
    return scrollTo(options);
  }, []);

  const scrollToElementSmooth = useCallback(
    async (options: SmoothScrollOptions) => {
      return smoothScrollTo(options);
    },
    []
  );

  const scrollToTopSmooth = useCallback(
    async (options?: Partial<SmoothScrollOptions>) => {
      return scrollToTop(options);
    },
    []
  );

  const scrollToBottomSmooth = useCallback(
    async (options?: Partial<SmoothScrollOptions>) => {
      return scrollToBottom(options);
    },
    []
  );

  const scrollIntoViewSmooth = useCallback(
    (
      element: Element,
      options?: {
        offset?: number;
        behavior?: ScrollBehavior;
        block?: ScrollLogicalPosition;
        inline?: ScrollLogicalPosition;
      }
    ) => {
      scrollIntoView(element, options);
    },
    []
  );

  const scrollToHashSmooth = useCallback(
    async (hash: string, options?: Partial<SmoothScrollOptions>) => {
      return scrollToHash(hash, options);
    },
    []
  );

  return {
    scrollTo: scrollToElement,
    scrollToSmooth: scrollToElementSmooth,
    scrollToTop: scrollToTopSmooth,
    scrollToBottom: scrollToBottomSmooth,
    scrollIntoView: scrollIntoViewSmooth,
    scrollToHash: scrollToHashSmooth,
  };
};

/**
 * Hook for scroll position tracking
 */
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateScrollPosition = () => {
      setScrollPosition(getScrollPosition());
    };

    // Set initial position
    updateScrollPosition();

    // Add scroll listener
    window.addEventListener('scroll', updateScrollPosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScrollPosition);
    };
  }, []);

  return scrollPosition;
};

/**
 * Hook for scroll direction tracking
 */
export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(
    null
  );

  useEffect(() => {
    const updateScrollDirection = () => {
      setScrollDirection(getScrollDirection());
    };

    window.addEventListener('scroll', updateScrollDirection, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScrollDirection);
    };
  }, []);

  return scrollDirection;
};

/**
 * Hook for element visibility tracking using Intersection Observer
 */
export const useInViewport = (
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) => {
  const [isInView, setIsInView] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return { isInView, hasIntersected };
};

/**
 * Hook for scroll-triggered animations
 */
export const useScrollAnimation = (
  elementRef: React.RefObject<Element>,
  options?: {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
    onEnter?: () => void;
    onLeave?: () => void;
  }
) => {
  const [isVisible, setIsVisible] = useState(false);
  const hasTriggered = useRef(false);

  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = false,
    onEnter,
    onLeave,
  } = options || {};

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;

        if (isIntersecting && !hasTriggered.current) {
          setIsVisible(true);
          onEnter?.();
          if (triggerOnce) {
            hasTriggered.current = true;
          }
        } else if (!(isIntersecting || triggerOnce)) {
          setIsVisible(false);
          onLeave?.();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, threshold, rootMargin, triggerOnce, onEnter, onLeave]);

  return isVisible;
};

/**
 * Hook for scroll-based parallax effects
 */
export const useParallaxScroll = (
  speed = 0.5,
  elementRef?: React.RefObject<Element>
) => {
  const [offset, setOffset] = useState(0);
  const element = elementRef?.current || document.documentElement;

  useEffect(() => {
    const updateParallax = () => {
      const scrollPosition = getScrollPosition().y;
      const newOffset = scrollPosition * speed;
      setOffset(newOffset);
    };

    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateParallax);
    };
  }, [speed]);

  return offset;
};

/**
 * Hook for scroll restoration (useful for SPA navigation)
 */
export const useScrollRestoration = (key: string) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    // Restore scroll position on mount
    const savedPosition = sessionStorage.getItem(`scroll-${key}`);
    if (savedPosition) {
      const position = Number.parseInt(savedPosition, 10);
      window.scrollTo(0, position);
      setScrollPosition(position);
    }

    // Save scroll position on unmount
    return () => {
      const currentPosition = getScrollPosition().y;
      sessionStorage.setItem(`scroll-${key}`, currentPosition.toString());
    };
  }, [key]);

  return scrollPosition;
};

/**
 * Hook for infinite scroll functionality
 */
export const useInfiniteScroll = (
  onLoadMore: () => void,
  options?: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  }
) => {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    enabled = true,
  } = options || {};
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !isLoading) {
          setIsLoading(true);
          try {
            await onLoadMore();
          } finally {
            setIsLoading(false);
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
    };
  }, [onLoadMore, threshold, rootMargin, enabled, isLoading]);

  return { isLoading, sentinelRef };
};

/**
 * Hook for scroll-based header visibility
 */
export const useScrollHeader = (threshold = 100) => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateHeaderVisibility = () => {
      const scrollY = getScrollPosition().y;
      const direction = getScrollDirection();

      setIsScrolled(scrollY > threshold);

      if (direction === 'up' || scrollY < threshold) {
        setIsHeaderVisible(true);
      } else if (direction === 'down' && scrollY > threshold) {
        setIsHeaderVisible(false);
      }
    };

    window.addEventListener('scroll', updateHeaderVisibility, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', updateHeaderVisibility);
    };
  }, [threshold]);

  return { isHeaderVisible, isScrolled };
};
