'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ThemeImageProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export function ThemeImage({
  lightSrc,
  darkSrc,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder,
  blurDataURL,
  sizes,
  fill = false,
  style,
  onLoad,
  onError,
}: ThemeImageProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [imageSrc, setImageSrc] = useState(lightSrc);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setImageSrc(resolvedTheme === 'dark' ? darkSrc : lightSrc);
    }
  }, [resolvedTheme, mounted, darkSrc, lightSrc]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div
        className={cn('animate-pulse rounded bg-muted', className)}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          ...style,
        }}
      />
    );
  }

  if (fill) {
    return (
      <Image
        alt={alt}
        blurDataURL={blurDataURL}
        className={className}
        fill
        onError={onError}
        onLoad={onLoad}
        placeholder={placeholder}
        priority={priority}
        quality={quality}
        sizes={sizes}
        src={imageSrc}
        style={style}
      />
    );
  }

  return (
    <Image
      alt={alt}
      blurDataURL={blurDataURL}
      className={className}
      height={height || 100}
      onError={onError}
      onLoad={onLoad}
      placeholder={placeholder}
      priority={priority}
      quality={quality}
      sizes={sizes}
      src={imageSrc}
      style={style}
      width={width || 100}
    />
  );
}

// Theme-aware icon component
interface ThemeIconProps {
  lightIcon: React.ReactNode;
  darkIcon: React.ReactNode;
  className?: string;
}

export function ThemeIcon({ lightIcon, darkIcon, className }: ThemeIconProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn('h-5 w-5 animate-pulse rounded bg-muted', className)}
      />
    );
  }

  return (
    <div className={className}>
      {resolvedTheme === 'dark' ? darkIcon : lightIcon}
    </div>
  );
}

// Theme-aware SVG component
interface ThemeSvgProps extends React.SVGProps<SVGSVGElement> {
  lightColor?: string;
  darkColor?: string;
}

export function ThemeSvg({
  lightColor = 'currentColor',
  darkColor = 'currentColor',
  className,
  ...props
}: ThemeSvgProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const color = resolvedTheme === 'dark' ? darkColor : lightColor;

  return <svg className={className} fill={color} stroke={color} {...props} />;
}

// Adaptive logo component
export function AdaptiveLogo({
  className,
  width = 120,
  height = 40,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <ThemeImage
      alt="ANUBIS Chat Logo"
      className={className}
      darkSrc="/logo-dark.svg"
      height={height}
      lightSrc="/logo-light.svg"
      priority
      width={width}
    />
  );
}

// Theme-aware background pattern
export function ThemePattern({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const patternColor =
    resolvedTheme === 'dark'
      ? 'rgba(255, 255, 255, 0.03)'
      : 'rgba(0, 0, 0, 0.02)';

  return (
    <div
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: `
          linear-gradient(to right, ${patternColor} 1px, transparent 1px),
          linear-gradient(to bottom, ${patternColor} 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }}
    />
  );
}
