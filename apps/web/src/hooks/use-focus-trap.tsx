import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  enabled?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
}

/**
 * Hook to trap focus within an element
 * Useful for modals, dialogs, and dropdowns
 */
export function useFocusTrap({
  enabled = true,
  autoFocus = true,
  restoreFocus = true,
}: UseFocusTrapOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!(enabled && containerRef.current)) {
      return;
    }

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store previously focused element
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    // Auto-focus first element
    if (autoFocus) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return;
      }

      // If shift + tab on first element, focus last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // If tab on last element, focus first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('keydown', handleEscape);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('keydown', handleEscape);

      // Restore focus when unmounting
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [enabled, autoFocus, restoreFocus]);

  return containerRef;
}

/**
 * Component wrapper for focus trap
 */
interface FocusTrapProps {
  children: React.ReactNode;
  enabled?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export function FocusTrap({
  children,
  enabled = true,
  autoFocus = true,
  restoreFocus = true,
  className,
}: FocusTrapProps) {
  const ref = useFocusTrap({ enabled, autoFocus, restoreFocus });

  return (
    <div className={className} ref={ref}>
      {children}
    </div>
  );
}
