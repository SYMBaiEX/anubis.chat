'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Crown,
  HelpCircle,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import LandingFooter from '@/components/landing/landingFooter';
import LandingHeader from '@/components/landing/landingHeader';
import SiteLinksSection from '../(landing)/components/siteLinksSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

// Pricing Plans Data
const pricingPlans = {
  monthly: [
    {
      name: 'Free',
      price: '0',
      currency: 'SOL',
      period: '/month',
      description: 'Perfect for trying out ANUBIS',
      icon: Sparkles,
      color: 'from-gray-500 to-gray-600',
      features: [
        { text: '50 messages per month', included: true },
        { text: 'Access to free AI models', included: true },
        { text: '7-day conversation history', included: true },
        { text: 'Basic support', included: true },
        { text: 'Premium AI models', included: false },
        { text: 'API access', included: false },
        { text: 'Custom agents', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'Get Started Free',
      href: '/auth',
    },
    {
      name: 'Pro',
      price: '0.05',
      currency: 'SOL',
      period: '/month',
      description: 'Most popular for individuals',
      icon: Rocket,
      color: 'from-primary to-emerald-500',
      featured: true,
      badge: 'Most Popular',
      features: [
        { text: '500 messages per month', included: true },
        { text: 'All free AI models', included: true },
        { text: '100 premium model messages', included: true },
        { text: 'Unlimited conversation history', included: true },
        { text: '1 custom agent', included: true },
        { text: 'API access (coming soon)', included: true },
        { text: 'Email support', included: true },
        { text: 'Priority support', included: false },
      ],
      cta: 'Upgrade to Pro',
      href: '/auth',
    },
    {
      name: 'Pro+',
      price: '0.1',
      currency: 'SOL',
      period: '/month',
      description: 'Best for power users & developers',
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      features: [
        { text: '1,000 messages per month', included: true },
        { text: 'All AI models unlimited', included: true },
        { text: '300 premium model messages', included: true },
        { text: 'Unlimited conversation history', included: true },
        { text: '5 custom agents', included: true },
        { text: 'Full API access', included: true },
        { text: 'Referral program access', included: true },
        { text: '24/7 priority support', included: true },
      ],
      cta: 'Go Pro+',
      href: '/auth',
    },
  ],
  annual: [
    {
      name: 'Free',
      price: '0',
      currency: 'SOL',
      period: '/year',
      description: 'Perfect for trying out ANUBIS',
      icon: Sparkles,
      color: 'from-gray-500 to-gray-600',
      features: [
        { text: '50 messages per month', included: true },
        { text: 'Access to free AI models', included: true },
        { text: '7-day conversation history', included: true },
        { text: 'Basic support', included: true },
        { text: 'Premium AI models', included: false },
        { text: 'API access', included: false },
        { text: 'Custom agents', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'Get Started Free',
      href: '/auth',
    },
    {
      name: 'Pro',
      price: '0.57',
      currency: 'SOL',
      period: '/year',
      originalPrice: '0.6',
      description: 'Save 5% with annual billing',
      icon: Rocket,
      color: 'from-primary to-emerald-500',
      featured: true,
      badge: 'Best Value',
      features: [
        { text: '500 messages per month', included: true },
        { text: 'All free AI models', included: true },
        { text: '100 premium model messages', included: true },
        { text: 'Unlimited conversation history', included: true },
        { text: '1 custom agent', included: true },
        { text: 'API access (coming soon)', included: true },
        { text: 'Email support', included: true },
        { text: 'Priority support', included: false },
      ],
      cta: 'Upgrade to Pro',
      href: '/auth',
    },
    {
      name: 'Pro+',
      price: '1.14',
      currency: 'SOL',
      period: '/year',
      originalPrice: '1.2',
      description: 'Save 5% with annual billing',
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      features: [
        { text: '1,000 messages per month', included: true },
        { text: 'All AI models unlimited', included: true },
        { text: '300 premium model messages', included: true },
        { text: 'Unlimited conversation history', included: true },
        { text: '5 custom agents', included: true },
        { text: 'Full API access', included: true },
        { text: 'Referral program access', included: true },
        { text: '24/7 priority support', included: true },
      ],
      cta: 'Go Pro+',
      href: '/auth',
    },
  ],
};

// Feature comparison data
const featureComparison = [
  {
    category: 'AI Models',
    features: [
      { name: 'Free AI Models', free: '✓', pro: '✓', proPlus: '✓' },
      { name: 'Premium Models Access', free: '✗', pro: '100/month', proPlus: '300/month' },
      { name: 'GPT-5 & GPT-5 Mini', free: '✗', pro: 'Limited', proPlus: '✓' },
      { name: 'Gemini 2.5 Pro', free: '✗', pro: 'Limited', proPlus: '✓' },
      { name: 'Model Switching', free: '✗', pro: '✓', proPlus: '✓' },
    ],
  },
  {
    category: 'Features',
    features: [
      { name: 'Messages per Month', free: '50', pro: '500', proPlus: '1,000' },
      { name: 'Conversation History', free: '7 days', pro: 'Unlimited', proPlus: 'Unlimited' },
      { name: 'Custom Agents', free: '✗', pro: '1', proPlus: '5' },
      { name: 'API Access', free: '✗', pro: 'Coming Soon', proPlus: 'Full Access' },
      { name: 'Workflow Automation', free: '✗', pro: '✗', proPlus: '✓' },
    ],
  },
  {
    category: 'Support & Extras',
    features: [
      { name: 'Support Level', free: 'Basic', pro: 'Email', proPlus: '24/7 Priority' },
      { name: 'Response Time', free: '48-72h', pro: '24h', proPlus: '<2h' },
      { name: 'Referral Program', free: '✗', pro: '✗', proPlus: '✓' },
      { name: 'Early Feature Access', free: '✗', pro: '✗', proPlus: '✓' },
      { name: 'Custom Integrations', free: '✗', pro: '✗', proPlus: '✓' },
    ],
  },
];

// FAQ Data
const faqData = [
  {
    question: 'How does SOL payment work?',
    answer: 'Payments are processed directly through your Solana wallet. Simply connect your wallet and approve the transaction. No credit cards or traditional payment methods required.',
  },
  {
    question: 'Can I switch plans anytime?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any unused time.',
  },
  {
    question: 'What happens if I exceed my message limit?',
    answer: 'You\'ll be notified when you\'re approaching your limit. Once exceeded, you can either upgrade your plan or wait for the next billing cycle.',
  },
  {
    question: 'Is there a refund policy?',
    answer: 'Due to the nature of blockchain transactions, we don\'t offer refunds. However, you can cancel your subscription at any time to prevent future charges.',
  },
  {
    question: 'Do unused messages roll over?',
    answer: 'Messages reset each billing cycle and don\'t roll over. We recommend choosing a plan that matches your typical usage.',
  },
];

// Pricing Card Component
function PricingCard({ plan, billingPeriod }: { plan: any; billingPeriod: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = plan.icon;

  return (
    <motion.div
      variants={scaleVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      className={cn('relative h-full', plan.featured && 'lg:scale-105')}
    >
      {plan.featured && (
        <motion.div
          className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary to-emerald-500 opacity-75 blur"
          animate={{
            opacity: isHovered ? 1 : 0.75,
          }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      <Card className={cn(
        'relative h-full overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50',
        plan.featured && 'border-primary/30'
      )}>
        {plan.badge && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-primary text-primary-foreground">
              {plan.badge}
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-4">
          <motion.div
            className={cn(
              'mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
              plan.color
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring' as const, stiffness: 400 }}
          >
            <Icon className="h-7 w-7 text-white" />
          </motion.div>
          
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <CardDescription className="mt-2">{plan.description}</CardDescription>
          
          <div className="mt-4">
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="ml-2 text-xl text-muted-foreground">{plan.currency}</span>
              <span className="ml-1 text-muted-foreground">{plan.period}</span>
            </div>
            {plan.originalPrice && (
              <div className="mt-1 text-sm text-muted-foreground">
                <span className="line-through">{plan.originalPrice} SOL</span>
                <span className="ml-2 text-primary">Save {Math.round((1 - parseFloat(plan.price) / parseFloat(plan.originalPrice)) * 100)}%</span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pb-6">
          <ul className="space-y-3">
            {plan.features.map((feature: any, idx: number) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-3"
              >
                {feature.included ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                ) : (
                  <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground/50" />
                )}
                <span className={cn(
                  'text-sm',
                  !feature.included && 'text-muted-foreground/50'
                )}>
                  {feature.text}
                </span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
        
        <CardFooter>
          <Link href={plan.href} className="w-full">
            <Button
              size="lg"
              variant={plan.featured ? 'default' : 'outline'}
              className="group w-full"
            >
              <Wallet className="mr-2 h-5 w-5" />
              {plan.cta}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={index}
    >
      <Card className="border-primary/10 bg-gradient-to-br from-background to-background/50">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">{question}</CardTitle>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: 'spring' as const, stiffness: 200 }}
            >
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </div>
        </CardHeader>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="pt-0">
                <p className="text-muted-foreground">{answer}</p>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function PricingPageClient() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  return (
    <div className="min-h-screen w-full">
      <LandingHeader />
      
      <main className="relative w-full flex-1">
        {/* Hero Section */}
        <AnimatedSection
          className="isolate overflow-visible pt-28 pb-24 text-center px-4 sm:px-6 md:pt-36 md:pb-32 lg:px-8"
          dustIntensity="low"
          parallaxY={24}
          revealStrategy="none"
          softEdges
        >
          <motion.div
            animate="visible"
            className="relative z-10 mx-auto w-full max-w-5xl"
            initial="hidden"
            variants={containerVariants}
          >
            <motion.div
              className="mb-10 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-emerald-500/10 px-3 py-1 backdrop-blur-sm md:mb-12"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="font-medium text-primary text-xs tracking-wide">
                Simple, Transparent Pricing
              </span>
            </motion.div>
            
            <motion.h1
              className="mt-2 mb-10 font-bold text-4xl sm:text-5xl md:mt-4 md:mb-12 md:text-6xl lg:text-7xl"
              variants={itemVariants}
            >
              <span className="bg-gradient-to-r from-foreground via-primary to-primary bg-clip-text text-transparent">
                Choose Your Plan
              </span>
              <br />
              <span className="text-foreground">Pay with SOL</span>
            </motion.h1>
            
            <motion.p
              className="mx-auto mt-6 mb-16 max-w-3xl text-lg text-muted-foreground sm:text-xl md:mt-10 md:mb-20 md:text-2xl"
              variants={itemVariants}
            >
              Unlock the full potential of Web3-native AI with flexible pricing that scales with your needs.
            </motion.p>
            
            {/* Billing Toggle */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-4"
            >
              <span className={cn(
                'text-sm font-medium',
                billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
              )}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <motion.span
                  className="inline-block h-4 w-4 rounded-full bg-primary"
                  animate={{ x: billingPeriod === 'monthly' ? 2 : 24 }}
                  transition={{ type: 'spring' as const, stiffness: 300 }}
                />
              </button>
              <span className={cn(
                'text-sm font-medium',
                billingPeriod === 'annual' ? 'text-foreground' : 'text-muted-foreground'
              )}>
                Annual
                <Badge className="ml-2" variant="secondary">Save 5%</Badge>
              </span>
            </motion.div>
          </motion.div>
        </AnimatedSection>
        
        {/* Pricing Cards */}
        <AnimatedSection
          className="py-20 px-4 sm:px-6 md:py-28 lg:py-32 lg:px-8"
          dustIntensity="low"
          edgeMask={false}
          includeTomb={false}
          parallaxY={20}
          revealStrategy="none"
          softEdges={false}
          useSurface={false}
        >
          <div className="container mx-auto">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {pricingPlans[billingPeriod as keyof typeof pricingPlans].map((plan, index) => (
                <PricingCard
                  key={`${plan.name}-${billingPeriod}`}
                  plan={plan}
                  billingPeriod={billingPeriod}
                />
              ))}
            </div>
          </div>
        </AnimatedSection>
        
        {/* Feature Comparison */}
        <AnimatedSection
          className="py-20 px-4 sm:px-6 md:py-28 lg:py-32 lg:px-8"
          dustIntensity="low"
          edgeMask={false}
          includeTomb={false}
          parallaxY={20}
          revealStrategy="none"
          softEdges={false}
          useSurface={false}
        >
          <div className="container mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
              className="mx-auto mb-16 text-center"
            >
              <motion.h2
                className="mb-4 font-bold text-3xl md:text-4xl"
                variants={itemVariants}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: '-100px' }}
              >
                Detailed Feature Comparison
              </motion.h2>
              <motion.p
                className="mx-auto max-w-2xl text-muted-foreground"
                variants={itemVariants}
              >
                See exactly what you get with each plan
              </motion.p>
            </motion.div>
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
              className="overflow-x-auto"
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left font-medium"></th>
                    <th className="p-4 text-center">
                      <div className="font-bold text-lg">Free</div>
                      <div className="text-sm text-muted-foreground">0 SOL</div>
                    </th>
                    <th className="p-4 text-center">
                      <div className="font-bold text-lg text-primary">Pro</div>
                      <div className="text-sm text-muted-foreground">0.05 SOL/mo</div>
                    </th>
                    <th className="p-4 text-center">
                      <div className="font-bold text-lg text-purple-500">Pro+</div>
                      <div className="text-sm text-muted-foreground">0.1 SOL/mo</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((category) => (
                    <>
                      <tr key={category.category} className="border-b border-border bg-muted/30">
                        <td colSpan={4} className="p-4 font-semibold">
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, idx) => (
                        <motion.tr
                          key={feature.name}
                          variants={itemVariants}
                          custom={idx}
                          className="border-b border-border/50"
                        >
                          <td className="p-4 text-sm">{feature.name}</td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              'inline-block text-sm',
                              feature.free === '✓' ? 'text-green-500' : 
                              feature.free === '✗' ? 'text-muted-foreground/50' : ''
                            )}>
                              {feature.free}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              'inline-block text-sm',
                              feature.pro === '✓' ? 'text-green-500' : 
                              feature.pro === '✗' ? 'text-muted-foreground/50' : ''
                            )}>
                              {feature.pro}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              'inline-block text-sm',
                              feature.proPlus === '✓' ? 'text-green-500' : 
                              feature.proPlus === '✗' ? 'text-muted-foreground/50' : ''
                            )}>
                              {feature.proPlus}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </AnimatedSection>
        
        {/* FAQ Section */}
        <AnimatedSection
          className="py-20 px-4 sm:px-6 md:py-28 lg:py-32 lg:px-8"
          dustIntensity="low"
          edgeMask={false}
          includeTomb={false}
          parallaxY={20}
          revealStrategy="none"
          softEdges={false}
          useSurface={false}
        >
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
              className="mx-auto mb-16 text-center"
            >
              <motion.h2
                className="mb-4 font-bold text-3xl md:text-4xl"
                variants={itemVariants}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: '-100px' }}
              >
                Frequently Asked Questions
              </motion.h2>
              <motion.p
                className="text-muted-foreground"
                variants={itemVariants}
              >
                Got questions? We've got answers
              </motion.p>
            </motion.div>
            
            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  index={index}
                />
              ))}
            </div>
          </div>
        </AnimatedSection>
        
        {/* CTA Section */}
        <AnimatedSection
          className="py-20 px-4 text-center sm:px-6 md:py-28 lg:py-32 lg:px-8"
          dustIntensity="low"
          edgeMask={false}
          includeTomb={false}
          parallaxY={20}
          revealStrategy="none"
          softEdges={false}
          useSurface={false}
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mx-auto max-w-4xl"
          >
            <motion.h2
              className="mb-6 font-bold text-3xl md:text-4xl"
              variants={itemVariants}
            >
              Ready to Get Started?
            </motion.h2>
            <motion.p
              className="mb-10 text-lg text-muted-foreground md:text-xl"
              variants={itemVariants}
            >
              Join thousands of users already experiencing the future of Web3-native AI.
            </motion.p>
            <motion.div
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              variants={itemVariants}
            >
              <Link href="/auth">
                <Button size="lg" className="group">
                  <Wallet className="mr-2 h-5 w-5" />
                  Start Free Trial
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline">
                  Explore Features
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