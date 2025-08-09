import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Whether to show the text next to the logo */
  showText?: boolean;
  /** Size of the logo in pixels */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Whether the logo should link to home */
  asLink?: boolean;
  /** Custom text to display (default: "ISIS Chat") */
  text?: string;
  /** Text style variant */
  textVariant?: 'default' | 'gradient' | 'egypt';
}

const sizeMap = {
  sm: { image: 24, text: 'text-base' },
  md: { image: 32, text: 'text-lg' },
  lg: { image: 40, text: 'text-xl' },
  xl: { image: 48, text: 'text-2xl' },
};

export function Logo({
  showText = true,
  size = 'md',
  className,
  asLink = true,
  text = 'ISIS Chat',
  textVariant = 'default',
}: LogoProps) {
  const dimensions = sizeMap[size];

  const textClasses = cn('font-semibold tracking-wide', dimensions.text, {
    'text-gradient': textVariant === 'gradient',
    'egypt-text': textVariant === 'egypt',
    '': textVariant === 'default',
  });

  const logoContent = (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        alt="ISIS logo"
        className={cn('object-contain', {
          'h-6 w-6': size === 'sm',
          'h-8 w-8': size === 'md',
          'h-10 w-10': size === 'lg',
          'h-12 w-12': size === 'xl',
        })}
        height={dimensions.image}
        priority
        src="/favicon.png"
        width={dimensions.image}
      />
      {showText && <span className={textClasses}>{text}</span>}
    </div>
  );

  if (asLink) {
    return (
      <Link
        aria-label="ISIS Chat Home"
        className="inline-flex transition-opacity hover:opacity-80"
        href="/"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

/**
 * Logo icon only variant
 */
export function LogoIcon({
  size = 'md',
  className,
}: Pick<LogoProps, 'size' | 'className'>) {
  return (
    <Logo asLink={false} className={className} showText={false} size={size} />
  );
}

/**
 * Logo with text variant for headers/navigation
 */
export function LogoWithText({
  size = 'md',
  className,
  textVariant = 'default',
  asLink = true,
}: Pick<LogoProps, 'size' | 'className' | 'textVariant' | 'asLink'>) {
  return (
    <Logo
      asLink={asLink}
      className={className}
      showText
      size={size}
      textVariant={textVariant}
    />
  );
}
