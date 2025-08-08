'use client';

import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  ChevronRight,
  Database,
  FileText,
  Globe,
  Lock,
  MessageSquare,
  Network,
  Rocket,
  Shield,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import LandingHeader from '@/components/landing/landing-header';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeroLogo } from '@/components/ui/hero-logo';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Brain,
    title: 'Advanced AI Models',
    description:
      'Access Claude 3.5, GPT-4, and DeepSeek for unparalleled intelligence',
    gradient: 'from-accent to-primary',
  },
  {
    icon: Shield,
    title: 'Blockchain Security',
    description: 'Solana-powered authentication and encrypted message storage',
    gradient: 'from-egypt-gold to-primary',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Real-time responses with optimized streaming and caching',
    gradient: 'from-primary to-egypt-amber',
  },
  {
    icon: Globe,
    title: 'RAG Integration',
    description: 'Advanced retrieval system for contextual, accurate responses',
    gradient: 'from-accent to-egypt-gold',
  },
  {
    icon: Database,
    title: 'Vector Search',
    description: 'Semantic search powered by Qdrant for intelligent responses',
    gradient: 'from-primary to-accent',
  },
  {
    icon: Network,
    title: 'Real-time Sync',
    description: 'Instant updates across all devices with Convex backend',
    gradient: 'from-egypt-gold to-egypt-bronze',
  },
];

const useCases = [
  {
    icon: Bot,
    title: 'AI Agents',
    description:
      'Deploy autonomous agents for trading, DeFi, and portfolio management',
  },
  {
    icon: MessageSquare,
    title: 'Smart Chat',
    description:
      'Context-aware conversations with memory and learning capabilities',
  },
  {
    icon: FileText,
    title: 'Document Analysis',
    description: 'Process and understand complex documents with AI precision',
  },
  {
    icon: TrendingUp,
    title: 'DeFi Trading',
    description: 'Execute swaps, provide liquidity, and manage positions',
  },
];

const pricingTiers = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for trying out ISIS Chat',
    features: [
      '100 messages per month',
      'Basic AI models',
      'Wallet authentication',
      'Community support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '29',
    description: 'For professionals and traders',
    features: [
      'Unlimited messages',
      'All AI models access',
      'Priority response time',
      'Advanced RAG system',
      'Custom AI agents',
      'API access',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For teams and organizations',
    features: [
      'Everything in Pro',
      'Custom deployment',
      'SLA guarantee',
      'Dedicated support',
      'Custom integrations',
      'Team management',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'DeFi Trader',
    content:
      'ISIS Chat has revolutionized my trading workflow. The AI agents execute strategies flawlessly.',
    rating: 5,
  },
  {
    name: 'Michael Roberts',
    role: 'Data Scientist',
    content:
      'The RAG capabilities are incredible. It understands context better than any other platform.',
    rating: 5,
  },
  {
    name: 'Emma Wilson',
    role: 'Product Manager',
    content:
      'Fast, secure, and intelligent. ISIS Chat is the future of Web3 AI integration.',
    rating: 5,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  return (
    <>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        {/* Hero Section */}
        <AnimatedSection
          className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900/20 to-emerald-950 dark:from-emerald-950 dark:via-emerald-900/15 dark:to-emerald-950"
          dustIntensity="high"
          glyphIntensity="high"
        >
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-6xl text-center flex flex-col items-center justify-center">
              <HeroLogo className="mb-10" showIcon iconSize="xl" />

              <p className="mb-12 text-muted-foreground text-2xl lg:text-3xl leading-relaxed">
                Experience the future of decentralized AI with Solana security,
                <br className="hidden lg:block" />
                advanced RAG capabilities, and multi-model intelligence
              </p>

              <div className="flex flex-col gap-6 sm:flex-row sm:justify-center items-center">
                <Link href="/auth">
                  <Button
                    className="button-press glow-primary min-w-[240px] gap-3 text-lg h-14"
                    size="lg"
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    className="button-press glow-accent min-w-[240px] gap-3 text-lg h-14"
                    size="lg"
                    variant="outline"
                  >
                    Learn More
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
            </div>
          </div>
        </AnimatedSection>
        
        {/* Wave separator between Hero and Features */}
        <div className="relative -mt-24 md:-mt-32 pointer-events-none z-10">
          <svg className="w-full h-24 md:h-32" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="rgb(245, 242, 232)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {/* Multiple wave layers for depth */}
            <path d="M0,40 C320,80 420,20 720,40 C1020,60 1120,80 1440,40 L1440,120 L0,120 Z" fill="url(#waveGradient1)" />
            <path d="M0,60 C320,30 640,90 960,60 C1280,30 1360,50 1440,70 L1440,120 L0,120 Z" fill="rgba(16, 185, 129, 0.1)" />
            <path d="M0,80 C480,50 960,100 1440,70 L1440,120 L0,120 Z" fill="rgba(245, 242, 232, 0.2)" />
          </svg>
        </div>

        {/* Features Section */}
        <AnimatedSection
          id="features"
          auroraVariant="gold"
          className="relative bg-gradient-to-b from-card/50 via-card/30 to-transparent pt-8 pb-20 lg:pt-12 lg:pb-32 dark:from-muted/30 dark:via-muted/20 dark:to-transparent"
          dustIntensity="low"
          glyphIntensity="low"
        >
          {/* Wave separator at top of Features - flipped */}
          <div className="absolute -top-1 left-0 right-0 pointer-events-none z-10">
            <svg className="w-full h-24 md:h-32 rotate-180" viewBox="0 0 1440 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="waveGradient4" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(255, 215, 0)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="rgb(245, 242, 232)" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              <path d="M0,40 C320,80 420,20 720,40 C1020,60 1120,80 1440,40 L1440,120 L0,120 Z" fill="url(#waveGradient4)" />
              <path d="M0,60 C320,30 640,90 960,60 C1280,30 1360,50 1440,70 L1440,120 L0,120 Z" fill="rgba(255, 215, 0, 0.08)" />
              <path d="M0,80 C480,50 960,100 1440,70 L1440,120 L0,120 Z" fill="rgba(245, 242, 232, 0.12)" />
            </svg>
          </div>
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 font-bold text-3xl lg:text-5xl">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Powerful Features</span>
              </h2>
              <p className="mb-12 text-lg text-muted-foreground">
                Everything you need for intelligent AI-powered blockchain
                interactions
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    className="card-hover group relative overflow-hidden border-border bg-background/80 backdrop-blur ring-1 ring-primary/10 hover:ring-primary/30 dark:border-border/50 dark:bg-card/50"
                    key={index}
                  >
                    <div
                      className={cn(
                        'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-20 dark:group-hover:opacity-10',
                        feature.gradient
                      )}
                      style={{
                        backgroundImage:
                          'linear-gradient(to bottom right, var(--tw-gradient-stops))',
                      }}
                    />
                    <div className="relative p-6">
                      <div
                        className={cn(
                          'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br shadow-md shadow-primary/20',
                          feature.gradient
                        )}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="mb-2 font-semibold text-xl">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
          {/* Gradient transition overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
        </AnimatedSection>

        {/* Use Cases */}
        <section className="relative py-20 lg:py-32 bg-gradient-to-b from-background via-primary/5 to-card/30 dark:from-background dark:via-accent/5 dark:to-muted/20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 font-bold text-3xl lg:text-5xl">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Built for Web3</span>
              </h2>
              <p className="mb-12 text-lg text-muted-foreground">
                Seamlessly interact with the Solana ecosystem through natural
                language
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {useCases.map((useCase, index) => {
                const Icon = useCase.icon;
                return (
                  <div
                    className="group flex flex-col items-center text-center"
                    key={index}
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 ring-1 ring-primary/30 transition-all group-hover:scale-110 dark:shadow-primary/10">
                      <Icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="mb-2 font-semibold text-lg">
                      {useCase.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {useCase.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        
        {/* Wave separator between Use Cases and Pricing */}
        <div className="relative -mt-24 md:-mt-32 pointer-events-none z-10">
          <svg className="w-full h-24 md:h-32" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(130, 71, 229)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="rgb(180, 135, 81)" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            <path d="M0,50 C360,90 720,20 1080,50 C1260,70 1380,60 1440,40 L1440,120 L0,120 Z" fill="url(#waveGradient3)" />
            <path d="M0,70 C240,40 480,100 720,70 C960,40 1200,100 1440,70 L1440,120 L0,120 Z" fill="rgba(180, 135, 81, 0.1)" />
            <path d="M0,90 C480,60 960,100 1440,80 L1440,120 L0,120 Z" fill="rgba(245, 242, 232, 0.12)" />
          </svg>
        </div>

        {/* Pricing Section */}
        <AnimatedSection
          auroraVariant="primary"
          className="relative bg-gradient-to-b from-card/50 via-card/40 to-transparent py-20 lg:py-32 dark:from-muted/30 dark:via-muted/25 dark:to-transparent"
          dustIntensity="low"
          glyphIntensity="low"
        >
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 font-bold text-3xl lg:text-5xl">
                <span className="bg-gradient-to-r from-egypt-gold to-egypt-bronze bg-clip-text text-transparent dark:from-egypt-gold dark:to-primary">Simple, Transparent Pricing</span>
              </h2>
              <p className="mb-12 text-lg text-muted-foreground">
                Choose the plan that fits your needs. Upgrade or downgrade
                anytime.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {pricingTiers.map((tier, index) => (
                <Card
                  className={cn(
                    'relative overflow-hidden bg-background/90 backdrop-blur dark:bg-card/80',
                    tier.highlighted &&
                      'scale-105 border-primary shadow-xl shadow-primary/30 dark:shadow-primary/20'
                  )}
                  key={index}
                >
                  {tier.highlighted && (
                    <div className="-right-12 absolute top-8 rotate-45 bg-gradient-to-r from-primary to-accent px-12 py-1 font-semibold text-primary-foreground text-xs">
                      POPULAR
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="mb-2 font-bold text-2xl">{tier.name}</h3>
                    <div className="mb-2 flex items-baseline">
                      {tier.price === 'Custom' ? (
                        <span className="font-bold text-3xl">{tier.price}</span>
                      ) : (
                        <>
                          <span className="font-bold text-4xl">
                            ${tier.price}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            /month
                          </span>
                        </>
                      )}
                    </div>
                    <p className="mb-6 text-muted-foreground">
                      {tier.description}
                    </p>

                    <ul className="mb-6 space-y-3">
                      {tier.features.map((feature, featureIndex) => (
                        <li
                          className="flex items-center gap-2"
                          key={featureIndex}
                        >
                          <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href="/auth">
                      <Button
                        className={cn(
                          'button-press w-full',
                          tier.highlighted ? '' : ''
                        )}
                        variant={tier.highlighted ? 'default' : 'outline'}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          {/* Gradient transition overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
        </AnimatedSection>

        {/* Testimonials */}
        <section className="relative py-20 lg:py-32 bg-gradient-to-b from-background via-accent/5 to-background/90 dark:from-background dark:via-primary/5 dark:to-background/90">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 font-bold text-3xl lg:text-5xl">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Loved by Web3 Builders</span>
              </h2>
              <p className="mb-12 text-lg text-muted-foreground">
                See what our community is saying
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card className="bg-background/80 backdrop-blur border-border ring-1 ring-primary/10 hover:ring-primary/30 dark:bg-card/50 dark:border-border/50" key={index}>
                  <div className="p-6">
                    <div className="mb-4 flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          className="h-4 w-4 fill-egypt-gold text-egypt-gold"
                          key={i}
                        />
                      ))}
                    </div>
                    <p className="mb-4 text-muted-foreground">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          {/* Gradient transition overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background pointer-events-none" />
        </section>

        {/* CTA Section */}
        <section className="relative py-20 lg:py-32 bg-gradient-to-b from-background to-background/95">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/20 via-accent/20 to-background shadow-2xl dark:border-primary/20 dark:from-primary/15 dark:via-accent/15 dark:to-background">
              <div className="relative p-12 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/15 dark:to-accent/15" />
                <div className="pointer-events-none absolute inset-0 golden-grid opacity-15" aria-hidden="true" />
                <h2 className="relative mb-4 font-bold text-3xl lg:text-5xl">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Ready to Experience the Future?</span>
                </h2>
                <p className="relative mb-8 text-lg text-muted-foreground">
                  Join thousands leveraging AI for Web3 interactions
                </p>
                <div className="relative flex flex-col justify-center gap-4 sm:flex-row">
                  <Link href="/auth">
                    <Button
                      className="button-press glow-primary min-w-[200px] gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground"
                      size="lg"
                    >
                      Connect Wallet
                      <Wallet className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/chat">
                    <Button
                      className="button-press glow-accent min-w-[200px] gap-2"
                      size="lg"
                      variant="outline"
                    >
                      Try Demo
                      <Rocket className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
