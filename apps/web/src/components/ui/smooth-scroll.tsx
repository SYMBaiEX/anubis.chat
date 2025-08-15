'use client';

/**
 * Smooth Scroll Components (2025 Best Practices)
 * Reusable React components for smooth scrolling functionality
 */

import type React from 'react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { useScrollPosition, useSmoothScroll } from '@/hooks/useSmoothScroll';
import { cn } from '@/lib/utils';

// ========================================
// Smooth Scroll Link Component
// ========================================

interface SmoothScrollLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  offset?: number;
  duration?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  onScrollComplete?: () => void;
  children: React.ReactNode;
}

export const SmoothScrollLink = forwardRef<
  HTMLAnchorElement,
  SmoothScrollLinkProps
>(
  (
    {
      href,
      offset = 0,
      duration = 800,
      easing = 'ease-in-out',
      onScrollComplete,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { scrollToHash } = useSmoothScroll();

    const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();

      if (href.startsWith('#')) {
        await scrollToHash(href, {
          offset,
          duration,
          easing,
          onComplete: onScrollComplete,
        });
      } else {
        // Handle external links normally
        window.location.href = href;
      }
    };

    return (
      <a
        className={cn('cursor-pointer', className)}
        href={href}
        onClick={handleClick}
        ref={ref}
        {...props}
      >
        {children}
      </a>
    );
  }
);

SmoothScrollLink.displayName = 'SmoothScrollLink';

// ========================================
// Scroll To Top Button Component
// ========================================

interface ScrollToTopButtonProps {
  threshold?: number;
  duration?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  className?: string;
  children?: React.ReactNode;
  showOnScroll?: boolean;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  threshold = 400,
  duration = 800,
  easing = 'ease-in-out',
  className,
  children,
  showOnScroll = true,
}) => {
  const { scrollToTop } = useSmoothScroll();
  const scrollPosition = useScrollPosition();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showOnScroll) {
      setIsVisible(scrollPosition.y > threshold);
    } else {
      setIsVisible(true);
    }
  }, [scrollPosition.y, threshold, showOnScroll]);

  const handleClick = async () => {
    await scrollToTop({ duration, easing });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      aria-label="Scroll to top"
      className={cn(
        'fixed right-6 bottom-6 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'animate-fade-in',
        className
      )}
      onClick={handleClick}
    >
      {children || (
        <svg
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      )}
    </button>
  );
};

// ========================================
// Scroll Progress Indicator Component
// ========================================

interface ScrollProgressIndicatorProps {
  className?: string;
  color?: string;
  height?: number;
  showPercentage?: boolean;
}

export const ScrollProgressIndicator: React.FC<
  ScrollProgressIndicatorProps
> = ({
  className,
  color = 'hsl(var(--primary))',
  height = 3,
  showPercentage = false,
}) => {
  const scrollPosition = useScrollPosition();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = scrollPosition.y;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setProgress(Math.min(scrollPercent, 100));
    };

    updateProgress();
  }, [scrollPosition.y]);

  return (
    <div className={cn('fixed top-0 left-0 z-50 w-full', className)}>
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          height: `${height}px`,
          background: `linear-gradient(to right, ${color} ${progress}%, transparent ${progress}%)`,
        }}
      />
      {showPercentage && (
        <div className="absolute top-2 right-2 text-muted-foreground text-xs">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

// ========================================
// Scroll Container Component
// ========================================

interface ScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  snapType?: 'none' | 'x' | 'y' | 'both';
  snapAlign?: 'start' | 'center' | 'end';
  customScrollbar?: boolean;
  smoothScroll?: boolean;
  children: React.ReactNode;
}

export const ScrollContainer = forwardRef<HTMLDivElement, ScrollContainerProps>(
  (
    {
      snapType = 'none',
      snapAlign = 'start',
      customScrollbar = true,
      smoothScroll = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const getSnapClasses = () => {
      if (snapType === 'none') {
        return '';
      }

      const snapClasses = [];
      if (snapType === 'x' || snapType === 'both') {
        snapClasses.push('scroll-snap-x');
      }
      if (snapType === 'y' || snapType === 'both') {
        snapClasses.push('scroll-snap-y');
      }

      return snapClasses.join(' ');
    };

    const getSnapAlignClass = () => {
      switch (snapAlign) {
        case 'start':
          return 'scroll-snap-start';
        case 'center':
          return 'scroll-snap-center';
        case 'end':
          return 'scroll-snap-end';
        default:
          return 'scroll-snap-start';
      }
    };

    return (
      <div
        className={cn(
          'overflow-auto',
          smoothScroll && 'smooth-scroll',
          customScrollbar && 'custom-scrollbar',
          getSnapClasses(),
          getSnapAlignClass(),
          className
        )}
        ref={ref || containerRef}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollContainer.displayName = 'ScrollContainer';

// ========================================
// Scroll Animation Wrapper Component
// ========================================

interface ScrollAnimationWrapperProps
  extends React.HTMLAttributes<HTMLDivElement> {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  animation?:
    | 'fadeIn'
    | 'fadeInUp'
    | 'fadeInDown'
    | 'slideInLeft'
    | 'slideInRight'
    | 'scaleIn';
  delay?: number;
  duration?: number;
  children: React.ReactNode;
}

export const ScrollAnimationWrapper: React.FC<ScrollAnimationWrapperProps> = ({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
  animation = 'fadeIn',
  delay = 0,
  duration = 600,
  className,
  children,
  ...props
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [threshold, rootMargin, triggerOnce]);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-600';

    if (!isVisible) {
      switch (animation) {
        case 'fadeIn':
          return `${baseClasses} opacity-0`;
        case 'fadeInUp':
          return `${baseClasses} opacity-0 translate-y-8`;
        case 'fadeInDown':
          return `${baseClasses} opacity-0 -translate-y-8`;
        case 'slideInLeft':
          return `${baseClasses} opacity-0 -translate-x-8`;
        case 'slideInRight':
          return `${baseClasses} opacity-0 translate-x-8`;
        case 'scaleIn':
          return `${baseClasses} opacity-0 scale-95`;
        default:
          return `${baseClasses} opacity-0`;
      }
    }

    return `${baseClasses} opacity-100 translate-y-0 translate-x-0 scale-100`;
  };

  return (
    <div
      className={cn(getAnimationClasses(), className)}
      ref={elementRef}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// ========================================
// Scroll Section Component
// ========================================

interface ScrollSectionProps extends React.HTMLAttributes<HTMLElement> {
  id: string;
  children: React.ReactNode;
}

export const ScrollSection: React.FC<ScrollSectionProps> = ({
  id,
  children,
  className,
  ...props
}) => {
  return (
    <section className={cn('scroll-mt-20', className)} id={id} {...props}>
      {children}
    </section>
  );
};

// ========================================
// Scroll Navigation Component
// ========================================

interface ScrollNavigationProps {
  sections: Array<{ id: string; label: string }>;
  className?: string;
  activeClassName?: string;
  offset?: number;
}

export const ScrollNavigation: React.FC<ScrollNavigationProps> = ({
  sections,
  className,
  activeClassName = 'text-primary font-semibold',
  offset = 80,
}) => {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, offset]);

  const { scrollToHash } = useSmoothScroll();

  const handleClick = (id: string) => {
    scrollToHash(`#${id}`, { offset });
  };

  return (
    <nav className={cn('flex flex-col space-y-2', className)}>
      {sections.map((section) => (
        <button
          className={cn(
            'rounded-md px-3 py-2 text-left transition-colors duration-200 hover:bg-muted',
            activeSection === section.id && activeClassName
          )}
          key={section.id}
          onClick={() => handleClick(section.id)}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
};
