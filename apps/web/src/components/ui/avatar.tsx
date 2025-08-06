import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const statusVariants = cva(
  'absolute right-0 bottom-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-900',
  {
    variants: {
      status: {
        online: 'bg-green-400',
        offline: 'bg-gray-400',
        away: 'bg-yellow-400',
        busy: 'bg-red-400',
      },
      size: {
        xs: 'h-1.5 w-1.5',
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
        xl: 'h-3.5 w-3.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, status, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoading, setImageLoading] = React.useState(true);

    React.useEffect(() => {
      setImageError(false);
      setImageLoading(true);
    }, [src]);

    const handleImageLoad = () => {
      setImageLoading(false);
    };

    const handleImageError = () => {
      setImageError(true);
      setImageLoading(false);
    };

    return (
      <div
        className={cn(avatarVariants({ size }), className)}
        ref={ref}
        {...props}
      >
        {src && !imageError ? (
          <img
            alt={alt}
            className={cn(
              'aspect-square h-full w-full object-cover',
              imageLoading && 'opacity-0'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
            src={src}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
            <span className="font-medium text-muted-foreground text-sm">
              {fallback ?? (alt?.[0]?.toUpperCase() || '?')}
            </span>
          </div>
        )}
        {status && <span className={cn(statusVariants({ status, size }))} />}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar, avatarVariants };
