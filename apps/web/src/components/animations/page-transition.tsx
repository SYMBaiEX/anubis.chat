'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useNavigationLoading } from '@/hooks/use-navigation-loading';
import { 
  contentFadeItem, 
  contentFadeStagger, 
  enhancedPageTransition, 
  loadingBar, 
  loadingSpinner, 
  pageTransition, 
  routeLoadingOverlay 
} from '@/lib/animations/variants';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'enhanced';
}

/**
 * Re-export the navigation loading hook for convenience
 */
export { useRouteLoading } from '@/hooks/use-navigation-loading';

/**
 * PageTransition component that wraps pages with smooth transitions
 */
export function PageTransition({ 
  children, 
  className, 
  variant = 'default' 
}: PageTransitionProps) {
  const pathname = usePathname();
  const transitionVariant = variant === 'enhanced' ? enhancedPageTransition : pageTransition;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        animate="animate"
        className={className}
        exit="exit"
        initial="initial"
        key={pathname}
        variants={transitionVariant}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Loading overlay that appears during route transitions
 */
export function RouteLoadingOverlay() {
  const { isLoading, progress } = useNavigationLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          variants={routeLoadingOverlay}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="flex flex-col items-center gap-4">
            {/* Spinning loader */}
            <motion.div
              variants={loadingSpinner}
              animate="animate"
              className="relative"
            >
              <Loader2 className="h-8 w-8 text-primary" />
            </motion.div>
            
            {/* Loading text with progress */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              Loading... {Math.round(progress)}%
            </motion.p>

            {/* Progress bar */}
            <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                animate={{ 
                  scaleX: progress / 100,
                  transition: { duration: 0.3, ease: 'easeOut' }
                }}
                style={{ originX: 0 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Top loading bar component
 */
export function TopLoadingBar() {
  const { isLoading, progress } = useNavigationLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60"
            animate={{ 
              width: `${progress}%`,
              transition: { duration: 0.3, ease: 'easeOut' }
            }}
            style={{ originX: 0 }}
          />
          
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
            style={{ width: '30%' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Enhanced page content wrapper with staggered animations
 */
export function PageContent({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <motion.div
      className={className}
      variants={contentFadeStagger}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual content item with fade animation
 */
export function ContentItem({ 
  children, 
  className,
  delay = 0 
}: { 
  children: ReactNode; 
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={contentFadeItem}
      transition={{ delay }}
    >
      {children}
    </motion.div>
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

/**
 * Route transition wrapper with multiple animation options
 */
export function RouteTransition({
  children,
  className,
  type = 'slide',
}: {
  children: ReactNode;
  className?: string;
  type?: 'slide' | 'fade' | 'scale' | 'blur';
}) {
  const pathname = usePathname();

  const getVariants = () => {
    switch (type) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1, transition: { duration: 0.3 } },
          exit: { opacity: 0, transition: { duration: 0.2 } },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
          exit: { opacity: 0, scale: 1.05, transition: { duration: 0.2 } },
        };
      case 'blur':
        return enhancedPageTransition;
      default:
        return pageTransition;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className={className}
        variants={getVariants()}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
