import { Button } from '@/components/ui/button';
import type { EmptyStateProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';

/**
 * EmptyState component - Display when no data is available
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      {/* Icon */}
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}

      {/* Title */}
      <h3 className="mb-2 font-semibold text-foreground text-lg">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mb-6 max-w-sm text-muted-foreground text-sm">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}

      {children}
    </div>
  );
}

export default EmptyState;
