'use client';

import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code,
  Database,
  Layers,
  Lock,
  Network,
  Palette,
  Shield,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import LandingFooter from '@/components/landing/landingFooter';
import LandingHeader from '@/components/landing/landingHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import SiteLinksSection from '../(landing)/components/siteLinksSection';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 70,
      damping: 14,
    },
  },
};

const scaleVariants = {
  hidden: { scale: 0.92, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 20,
    },
  },
};

// Feature Categories
const featureCategories = {
  ai: {
    title: 'AI Models & Intelligence',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    features: [
      {
        title: 'Multi-Model AI System',
        description:
          'Access cutting-edge AI models including GPT-5, GPT-5 Mini, Gemini 2.5 Pro, and o4-mini for premium intelligence.',
        icon: Brain,
        details: [
          'Seamlessly switch between models mid-conversation',
          'Compare responses from different models',
          'Model-specific optimization for best results',
          'Automatic fallback for maximum reliability',
        ],
      },
      {
        title: 'Free Model Access',
        description:
          'Start with powerful free models including GPT-OSS-20B, GLM-4.5-Air, Qwen3-Coder, and Kimi K2.',
        icon: Sparkles,
        details: [
          'No credit card required to start',
          '50 free messages per month',
          'Access to community models',
          'Upgrade anytime for premium features',
        ],
      },
      {
        title: 'Intelligent Context Management',
        description:
          'Advanced context retention and conversation memory for more coherent and relevant responses.',
        icon: Database,
        details: [
          'Long-term conversation memory',
          'Cross-session context retention',
          'Smart context compression',
          'Relevance-based memory recall',
        ],
      },
    ],
  },
  web3: {
    title: 'Web3 & Blockchain',
    icon: Wallet,
    color: 'from-green-500 to-emerald-500',
    features: [
      {
        title: 'Wallet Authentication',
        description:
          'Secure, passwordless authentication using your Solana wallet signature.',
        icon: Wallet,
        details: [
          'Support for Phantom, Solflare, and Backpack',
          'No email or password required',
          'One-click secure sign-in',
          'Wallet-based identity management',
        ],
      },
      {
        title: 'On-Chain Payments',
        description:
          'Pay for subscriptions directly with SOL or SPL tokens through secure blockchain transactions.',
        icon: Lock,
        details: [
          'Instant payment processing',
          'No credit card required',
          'Transparent pricing in SOL',
          'Smart contract security',
        ],
      },
      {
        title: 'Decentralized Storage',
        description:
          'Your data is encrypted and stored with blockchain-level security.',
        icon: Shield,
        details: [
          'End-to-end encryption',
          'Wallet-scoped data isolation',
          'Distributed backup systems',
          'User-controlled data ownership',
        ],
      },
    ],
  },
  platform: {
    title: 'Platform Features',
    icon: Layers,
    color: 'from-blue-500 to-cyan-500',
    features: [
      {
        title: 'Real-Time Streaming',
        description:
          'Experience instant AI responses with ultra-low latency streaming technology.',
        icon: Zap,
        details: [
          'Sub-second response times',
          'Progressive content rendering',
          'Smooth typing animations',
          'Network-optimized delivery',
        ],
      },
      {
        title: 'Conversation History',
        description:
          'All your chats are automatically saved and synced across all your devices.',
        icon: Clock,
        details: [
          'Unlimited conversation storage',
          'Cross-device synchronization',
          'Advanced search capabilities',
          'Export conversations anytime',
        ],
      },
      {
        title: 'Egyptian-Themed UI',
        description:
          'Unique ancient Egyptian aesthetics combined with modern design principles.',
        icon: Palette,
        details: [
          'Custom hieroglyphic elements',
          'Dark and light theme support',
          'Smooth animations and transitions',
          'Accessibility-first design',
        ],
      },
    ],
  },
  developer: {
    title: 'Developer Tools',
    icon: Code,
    color: 'from-orange-500 to-red-500',
    features: [
      {
        title: 'API Access',
        description:
          'Coming soon: RESTful API for integrating ANUBIS AI into your applications.',
        icon: Code,
        details: [
          'RESTful and GraphQL endpoints',
          'WebSocket support for streaming',
          'Comprehensive documentation',
          'SDKs for popular languages',
        ],
      },
      {
        title: 'Custom Agents',
        description:
          'Build and deploy custom AI agents with specialized knowledge and behaviors.',
        icon: Network,
        details: [
          'Visual agent builder',
          'Custom training data',
          'Behavior scripting',
          'Performance analytics',
        ],
      },
      {
        title: 'Workflow Automation',
        description:
          'Create complex multi-step workflows with conditional logic and integrations.',
        icon: Layers,
        details: [
          'Drag-and-drop workflow editor',
          'Conditional branching',
          'Third-party integrations',
          'Scheduled automation',
        ],
      },
    ],
  },
};

// Interactive Feature Card Component
function InteractiveFeatureCard({
  feature,
  index,
}: {
  feature: any;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial="hidden"
      transition={{ type: 'spring', stiffness: 300 }}
      variants={scaleVariants}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ y: -5 }}
      whileInView="visible"
    >
      <Card className="group relative h-full overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-xl">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          initial={false}
        />

        <CardHeader className="relative">
          <motion.div
            className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10"
            transition={{ type: 'spring' as const, stiffness: 400 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <feature.icon className="h-6 w-6 text-primary" />
          </motion.div>

          <CardTitle className="text-xl">{feature.title}</CardTitle>
          <CardDescription className="mt-2">
            {feature.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative">
          <Button
            className="mb-3 w-full justify-between"
            onClick={() => setIsExpanded(!isExpanded)}
            size="sm"
            variant="ghost"
          >
            <span>View Details</span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ type: 'spring' as const, stiffness: 200 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </Button>

          <AnimatePresence>
            {isExpanded && (
              <motion.ul
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-2 overflow-hidden"
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {feature.details.map((detail: string, idx: number) => (
                  <motion.li
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-start gap-2 text-muted-foreground text-sm"
                    initial={{ x: -20, opacity: 0 }}
                    key={idx}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                    <span>{detail}</span>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function FeaturesPageClient() {
  const [activeCategory, setActiveCategory] = useState('ai');
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  return (
    <div className="min-h-screen w-full">
      <LandingHeader />

      <main className="relative w-full flex-1">
        {/* Hero Section */}
        <AnimatedSection
          className="isolate overflow-visible px-4 pt-28 pb-24 text-center sm:px-6 md:pt-36 md:pb-32 lg:px-8"
          dustIntensity="low"
          parallaxY={24}
          revealStrategy="none"
          softEdges
        >
          <motion.div
            animate="visible"
            className="relative z-10 mx-auto w-full max-w-5xl"
            initial="hidden"
            style={{ opacity, scale }}
            variants={containerVariants}
          >
            <motion.div
              className="mb-10 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-emerald-500/10 px-3 py-1 backdrop-blur-sm md:mb-12"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="font-medium text-primary text-xs tracking-wide">
                Comprehensive Feature Suite
              </span>
            </motion.div>

            <motion.h1
              className="mt-2 mb-10 font-bold text-4xl sm:text-5xl md:mt-4 md:mb-12 md:text-6xl lg:text-7xl"
              variants={itemVariants}
            >
              <motion.span
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                className="bg-gradient-to-r from-foreground via-primary to-primary bg-clip-text text-transparent"
                style={{ backgroundSize: '200% 100%' }}
                transition={{
                  duration: 5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }}
              >
                Powerful Features
              </motion.span>
              <br />
              <span className="text-foreground">Built for the Future</span>
            </motion.h1>

            <motion.p
              className="mx-auto mt-6 mb-16 max-w-3xl text-lg text-muted-foreground sm:text-xl md:mt-10 md:mb-20 md:text-2xl"
              variants={itemVariants}
            >
              Explore the comprehensive suite of features that make ANUBIS the
              most advanced Web3-native AI platform available today.
            </motion.p>

            <motion.div
              className="mt-12 mb-14 flex flex-col items-center justify-center gap-6 sm:flex-row md:mt-14 md:mb-16 md:gap-7"
              variants={itemVariants}
            >
              <Link href="/auth">
                <motion.div
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="group" size="lg">
                    <Wallet className="mr-2 h-5 w-5" />
                    Get Started Now
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/pricing">
                <motion.div
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="outline">
                    View Pricing
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </AnimatedSection>

        {/* Feature Categories with Tabs */}
        <AnimatedSection
          className="px-4 py-20 sm:px-6 md:py-28 lg:px-8 lg:py-32"
          dustIntensity="low"
          edgeMask={false}
          includeTomb={false}
          parallaxY={20}
          revealStrategy="none"
          softEdges={false}
          useSurface={false}
        >
          <div className="container mx-auto">
            <Tabs
              className="w-full"
              onValueChange={setActiveCategory}
              value={activeCategory}
            >
              <TabsList className="mb-12 grid w-full grid-cols-2 lg:grid-cols-4">
                {Object.entries(featureCategories).map(([key, category]) => {
                  const Icon = category.icon;
                  return (
                    <TabsTrigger
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      key={key}
                      value={key}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{category.title}</span>
                      <span className="sm:hidden">
                        {category.title.split(' ')[0]}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {Object.entries(featureCategories).map(([key, category]) => (
                <TabsContent className="mt-0" key={key} value={key}>
                  <motion.div
                    animate="visible"
                    initial="hidden"
                    variants={containerVariants}
                  >
                    <motion.div
                      className="mb-12 text-center"
                      variants={itemVariants}
                    >
                      <h2 className="mb-4 font-bold text-3xl md:text-4xl">
                        <span
                          className={cn(
                            'bg-gradient-to-r bg-clip-text text-transparent',
                            category.color
                          )}
                        >
                          {category.title}
                        </span>
                      </h2>
                      <p className="mx-auto max-w-2xl text-muted-foreground">
                        Discover the advanced capabilities that set ANUBIS
                        apart.
                      </p>
                    </motion.div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {category.features.map((feature, index) => (
                        <InteractiveFeatureCard
                          feature={feature}
                          index={index}
                          key={feature.title}
                        />
                      ))}
                    </div>
                  </motion.div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection
          className="px-4 py-20 text-center sm:px-6 md:py-28 lg:px-8 lg:py-32"
          dustIntensity="low"
          edgeMask={false}
          includeTomb={false}
          parallaxY={20}
          revealStrategy="none"
          softEdges={false}
          useSurface={false}
        >
          <motion.div
            className="mx-auto max-w-4xl"
            initial="hidden"
            variants={containerVariants}
            viewport={{ once: true }}
            whileInView="visible"
          >
            <motion.h2
              className="mb-6 font-bold text-3xl md:text-4xl"
              variants={itemVariants}
            >
              Ready to Experience the Future?
            </motion.h2>
            <motion.p
              className="mb-10 text-lg text-muted-foreground md:text-xl"
              variants={itemVariants}
            >
              Join thousands of users already leveraging the power of
              Web3-native AI.
            </motion.p>
            <motion.div
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              variants={itemVariants}
            >
              <Link href="/auth">
                <Button className="group" size="lg">
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet & Start
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  View Pricing
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </AnimatedSection>
      </main>

      <SiteLinksSection />
      <LandingFooter />
    </div>
  );
}
