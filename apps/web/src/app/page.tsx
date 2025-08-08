'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Brain,
  Globe,
  Users,
  Rocket,
  Bot,
  MessageSquare,
  FileText,
  BarChart3,
  Star,
  Check,
  ChevronRight,
  Database,
  Network,
  TrendingUp,
  Wallet,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Brain,
    title: 'Advanced AI Models',
    description: 'Access Claude 3.5, GPT-4, and DeepSeek for unparalleled intelligence',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Shield,
    title: 'Blockchain Security',
    description: 'Solana-powered authentication and encrypted message storage',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Real-time responses with optimized streaming and caching',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Globe,
    title: 'RAG Integration',
    description: 'Advanced retrieval system for contextual, accurate responses',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Database,
    title: 'Vector Search',
    description: 'Semantic search powered by Qdrant for intelligent responses',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Network,
    title: 'Real-time Sync',
    description: 'Instant updates across all devices with Convex backend',
    gradient: 'from-rose-500 to-pink-500',
  },
];

const useCases = [
  {
    icon: Bot,
    title: 'AI Agents',
    description: 'Deploy autonomous agents for trading, DeFi, and portfolio management',
  },
  {
    icon: MessageSquare,
    title: 'Smart Chat',
    description: 'Context-aware conversations with memory and learning capabilities',
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
    content: 'ISIS Chat has revolutionized my trading workflow. The AI agents execute strategies flawlessly.',
    rating: 5,
  },
  {
    name: 'Michael Roberts',
    role: 'Data Scientist',
    content: 'The RAG capabilities are incredible. It understands context better than any other platform.',
    rating: 5,
  },
  {
    name: 'Emma Wilson',
    role: 'Product Manager',
    content: 'Fast, secure, and intelligent. ISIS Chat is the future of Web3 AI integration.',
    rating: 5,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background" />
          <div className="absolute inset-0 bg-center" style={{ backgroundImage: "url('/grid.svg')", maskImage: 'radial-gradient(white, transparent 70%)' }} />
        
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-primary">Ancient Wisdom • Modern Technology</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-bold tracking-tight lg:text-7xl">
              <span className="text-gradient">ISIS CHAT</span>
              <br />
              <span className="text-foreground">Where AI Meets Blockchain</span>
            </h1>
            
            <p className="mb-8 text-xl text-muted-foreground lg:text-2xl">
              Experience the future of decentralized AI with Solana security,
              <br className="hidden lg:block" />
              advanced RAG capabilities, and multi-model intelligence
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/auth">
                <Button size="lg" className="button-press gap-2 min-w-[200px]">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="button-press min-w-[200px]">
                  Learn More
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Bank-grade encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Wallet-based auth</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>10,000+ users</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold lg:text-5xl">
              Powerful Features
            </h2>
            <p className="mb-12 text-lg text-muted-foreground">
              Everything you need for intelligent AI-powered blockchain interactions
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="card-hover group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-10"
                    style={{
                      backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                    }}
                    className={cn(feature.gradient)}
                  />
                  <div className="relative p-6">
                    <div
                      className={cn(
                        'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br',
                        feature.gradient
                      )}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold lg:text-5xl">
              Built for Web3
            </h2>
            <p className="mb-12 text-lg text-muted-foreground">
              Seamlessly interact with the Solana ecosystem through natural language
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <div
                  key={index}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-all group-hover:scale-110 group-hover:bg-primary/20">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {useCase.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold lg:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mb-12 text-lg text-muted-foreground">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {pricingTiers.map((tier, index) => (
              <Card
                key={index}
                className={cn(
                  \'relative overflow-hidden\',
                  tier.highlighted && \'border-primary shadow-lg shadow-primary/20 scale-105\'
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -right-12 top-8 rotate-45 bg-primary px-12 py-1 text-xs font-semibold text-primary-foreground">
                    POPULAR
                  </div>
                )}
                <div className="p-6">
                  <h3 className="mb-2 text-2xl font-bold">{tier.name}</h3>
                  <div className="mb-2 flex items-baseline">
                    {tier.price === \'Custom\' ? (
                      <span className="text-3xl font-bold">{tier.price}</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">${tier.price}</span>
                        <span className="ml-2 text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>
                  <p className="mb-6 text-muted-foreground">{tier.description}</p>
                  
                  <ul className="mb-6 space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/auth">
                    <Button
                      className={cn(
                        \'w-full button-press\',
                        tier.highlighted ? \'\' : \'\'
                      )}
                      variant={tier.highlighted ? \'default\' : \'outline\'}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold lg:text-5xl">
              Loved by Web3 Builders
            </h2>
            <p className="mb-12 text-lg text-muted-foreground">
              See what our community is saying
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur">
                <div className="p-6">
                  <div className="mb-4 flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-500 text-yellow-500"
                      />
                    ))}
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden bg-gradient-to-br from-primary/20 via-accent/20 to-background border-primary/20">
            <div className="p-12 text-center">
              <h2 className="mb-4 text-3xl font-bold lg:text-5xl">
                Ready to Experience the Future?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join thousands leveraging AI for Web3 interactions
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth">
                  <Button size="lg" className="button-press gap-2 min-w-[200px]">
                    Connect Wallet
                    <Wallet className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button size="lg" variant="outline" className="button-press gap-2 min-w-[200px]">
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