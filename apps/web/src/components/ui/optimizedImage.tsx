'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  containerClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  sizes?: string;
  fill?: boolean;
}

/**
 * Optimized image component with Next.js Image optimization
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  className,
  containerClassName,
  onLoad,
  onError,
  fallbackSrc = '/assets/placeholder.png',
  sizes,
  fill = false,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [_hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    onError?.();
  };

  if (fill) {
    return (
      <div className={cn('relative overflow-hidden', containerClassName)}>
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
        <Image
          alt={alt}
          blurDataURL={blurDataURL}
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading && 'opacity-0',
            !isLoading && 'opacity-100',
            className
          )}
          fill
          onError={handleError}
          onLoad={handleLoad}
          placeholder={placeholder}
          priority={priority}
          quality={quality}
          sizes={sizes || '100vw'}
          src={imgSrc}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative', containerClassName)}>
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse rounded bg-muted"
          style={{ width, height }}
        />
      )}
      <Image
        alt={alt}
        blurDataURL={blurDataURL}
        className={cn(
          'transition-opacity duration-300',
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100',
          className
        )}
        height={height || 500}
        onError={handleError}
        onLoad={handleLoad}
        placeholder={placeholder}
        priority={priority}
        quality={quality}
        sizes={sizes}
        src={imgSrc}
        width={width || 500}
      />
    </div>
  );
}

/**
 * Avatar image with optimization
 */
interface OptimizedAvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackSrc?: string;
}

export function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  className,
  fallbackSrc = '/default-avatar.svg',
}: OptimizedAvatarProps) {
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  const dimension = sizeMap[size];

  return (
    <OptimizedImage
      alt={alt}
      className={cn('rounded-full', className)}
      containerClassName={cn('overflow-hidden rounded-full', className)}
      fallbackSrc={fallbackSrc}
      height={dimension}
      priority={size === 'lg' || size === 'xl'}
      src={src || fallbackSrc}
      width={dimension}
    />
  );
}

/**
 * Background image with optimization
 */
interface OptimizedBackgroundProps {
  src: string;
  alt: string;
  children?: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

export function OptimizedBackground({
  src,
  alt,
  children,
  className,
  overlay = false,
  overlayOpacity = 0.5,
}: OptimizedBackgroundProps) {
  return (
    <div className={cn('relative', className)}>
      <OptimizedImage
        alt={alt}
        className="object-cover"
        fill
        priority
        quality={90}
        sizes="100vw"
        src={src}
      />
      {overlay && (
        <div
          className="absolute inset-0 bg-background dark:bg-foreground"
          style={{ opacity: overlayOpacity }}
        />
      )}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
