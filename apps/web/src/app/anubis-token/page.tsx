'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
  Shield,
  Zap,
  ExternalLink,
  Copy,
  Check,
  Coins,
  Rocket,
  Star,
  Flame,
  DollarSign
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import LandingFooter from '@/components/landing/landing-footer';
import LandingHeader from '@/components/landing/landing-header';
import { Button } from '@/components/ui/button';
import SiteLinksSection from '@/app/(landing)/components/siteLinksSection';

// Countdown Timer removed

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 10
    }
  }
};

const scaleVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

// Animated Stats Component
function AnimatedStats() {
  const stats = [
    { label: 'Total Supply', value: '1B', icon: Coins, suffix: 'ANUB', fullValue: '1,000,000,000' },
    { label: 'Initial Price', value: '0.00001', icon: DollarSign, prefix: '$' },
    { label: 'Bonding Curve', value: '100', icon: TrendingUp, suffix: '%' },
    { label: 'Community', value: '100', icon: Users, suffix: '%', fullLabel: 'Community Owned' },
  ];

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-4 gap-6"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          variants={scaleVariants}
          whileHover={{ 
            scale: 1.05,
            transition: { type: "spring", stiffness: 300 }
          }}
          className="relative group"
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-xl blur-xl"
            animate={{
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.2
            }}
          />
          <div className="relative bg-background/50 backdrop-blur-sm rounded-xl p-3 xs:p-4 sm:p-5 md:p-6 border border-primary/20 hover:border-primary/40 transition-all duration-300">
            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ 
                delay: 0.3 + index * 0.1,
                type: "spring",
                stiffness: 200
              }}
            >
              <stat.icon className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary mb-2 sm:mb-3" />
            </motion.div>
            <div className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold">
              {stat.prefix}
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="inline-block"
                title={stat.fullValue || stat.value}
              >
                {stat.value}
              </motion.span>
              {stat.suffix && <span className="text-sm xs:text-base sm:text-lg ml-1 text-muted-foreground">{stat.suffix}</span>}
            </div>
            <p className="text-xs xs:text-sm text-muted-foreground mt-1 truncate" title={stat.fullLabel || stat.label}>{stat.fullLabel || stat.label}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Floating Particles Component
function FloatingParticles() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (windowSize.width === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            x: Math.random() * windowSize.width,
            y: windowSize.height + 100,
          }}
          animate={{
            y: -100,
            x: Math.random() * windowSize.width,
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10,
          }}
        >
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {i % 3 === 0 ? (
              <Coins className="h-6 w-6 text-primary/30" />
            ) : i % 3 === 1 ? (
              <Star className="h-4 w-4 text-emerald-400/30" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary/30" />
            )}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

export default function AnubisTokenPage() {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  const tokenAddress = "Coming Soon - Launching on Pump.Fun";

  const copyTokenAddress = async () => {
    try {
      await navigator.clipboard.writeText(tokenAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Floating Particles */}
      <FloatingParticles />

      <div className="relative z-10">
        <LandingHeader />

        {/* Epic Hero Section with 3D Effects */}
        <AnimatedSection
          allowOverlap
          aria-label="$ANUBIS Token Hero"
          className="isolate overflow-visible pt-28 pb-24 text-center md:pt-36 md:pb-32"
          dustIntensity="high"
          parallaxY={48}
          revealStrategy="none"
          softEdges
        >
          <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            {/* Animated Badge */}
            <motion.div
              className="mb-8 sm:mb-10 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/20 to-emerald-500/20 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-sm md:mb-12"
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                boxShadow: [
                  "0 0 20px rgba(16, 185, 129, 0.3)",
                  "0 0 40px rgba(16, 185, 129, 0.5)",
                  "0 0 20px rgba(16, 185, 129, 0.3)"
                ]
              }}
              transition={{ 
                duration: 0.6,
                boxShadow: {
                  duration: 2,
                  repeat: Infinity
                }
              }}
              whileHover={{
                scale: 1.05,
                transition: { type: "spring", stiffness: 400 }
              }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </motion.div>
              <motion.span 
                className="font-bold text-primary text-xs sm:text-sm tracking-wide uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Meme Token Launch 🔥
              </motion.span>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Rocket className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
              </motion.div>
            </motion.div>

            <motion.h1
              className="mt-2 mb-6 sm:mb-8 md:mb-10 font-bold text-2xl min-[425px]:text-3xl sm:text-4xl transition-all delay-100 duration-700 md:text-5xl md:mt-4 md:mb-12 lg:text-6xl xl:text-7xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-primary via-emerald-400 to-emerald-500 bg-clip-text text-transparent animate-pulse">
                $ANUBIS
              </span>
              <br />
              <span className="text-xl min-[425px]:text-2xl sm:text-3xl md:text-4xl lg:text-5xl bg-gradient-to-r from-primary/80 via-primary to-emerald-500 bg-clip-text text-transparent">
                Powers the Future
              </span>
            </motion.h1>

            {/* Token Contract Address (moved below heading) */}
            <motion.div
              className="mt-6 sm:mt-8 mx-auto max-w-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-emerald-500/30 rounded-xl blur-2xl" />
                <div className="relative rounded-xl border border-primary/40 bg-background/60 backdrop-blur-lg p-4 sm:p-6">
                  <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wider">Token Contract Address</p>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-primary font-mono text-[10px] min-[425px]:text-xs sm:text-sm bg-muted px-2 min-[425px]:px-2.5 sm:px-3 py-1.5 min-[425px]:py-2 rounded-md flex-1 text-left break-all overflow-x-auto">
                      {tokenAddress}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyTokenAddress}
                      className="border-primary/20 hover:border-primary/40 text-xs sm:text-sm"
                    >
                      {copiedAddress ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Primary CTAs (moved below heading and address) */}
            <motion.div
              className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <Link href="https://pump.fun" target="_blank" rel="noopener noreferrer">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-600 text-white font-bold text-sm sm:text-base w-full sm:w-auto"
                  >
                    <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Buy on Pump.Fun
                    <ExternalLink className="ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="#tokenomics">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary/20 backdrop-blur-sm hover:border-primary/40 text-sm sm:text-base w-full sm:w-auto"
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <motion.p
              className="mx-auto mt-4 sm:mt-6 mb-8 sm:mb-12 md:mb-16 max-w-4xl text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground transition-all delay-200 duration-700 md:mt-10 md:mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Join the revolution where <span className="text-primary font-bold">ancient wisdom</span> meets <span className="text-emerald-400 font-bold">modern memes</span>.
              50% funds the AI, 50% powers the platform.
              <motion.span
                className="block mt-4 text-primary font-bold"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                100% Community Driven 🚀
              </motion.span>
            </motion.p>

            {/* Stats Section */}
            <AnimatedStats />
          </div>
        </AnimatedSection>

        {/* Info Section with Image */}
        <AnimatedSection
          className="py-24 md:py-32"
          dustIntensity="low"
          parallaxY={20}
          revealStrategy="scroll"
          id="about"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Text Content */}
              <div className="order-2 lg:order-1">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl min-[425px]:text-3xl sm:text-4xl md:text-5xl font-bold mb-4 min-[425px]:mb-5 sm:mb-6">
                    <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                      Ancient Power,
                    </span>
                    <br />
                    <span className="text-foreground">Modern Utility</span>
                  </h2>

                  <p className="text-sm min-[425px]:text-base sm:text-lg md:text-xl text-muted-foreground mb-4 min-[425px]:mb-6 sm:mb-8 leading-relaxed">
                    $ANUBIS isn't just another meme token. It's the lifeblood of the ANUBIS ecosystem,
                    directly funding both our revolutionary AI agent and the platform that hosts it.
                  </p>

                  <motion.div 
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                  >
                    {[
                      { icon: Zap, color: "primary", title: "AI Agent Funding", desc: "50% of all proceeds directly fund ANUBIS AI development and operations" },
                      { icon: Shield, color: "primary", title: "Platform Support", desc: "50% goes to maintaining and improving the ANUBIS.Chat platform" },
                      { icon: Users, color: "emerald-500", title: "Community Driven", desc: "Built by the community, for the community, with transparent fund allocation" }
                    ].map((feature, index) => (
                      <motion.div 
                        key={feature.title}
                        className="flex items-start gap-3"
                        variants={itemVariants}
                        whileHover={{ x: 10 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <motion.div 
                          className={`rounded-full ${feature.color === 'emerald-500' ? 'bg-emerald-500/20' : 'bg-primary/20'} p-2 mt-1`}
                          initial={{ rotate: -180, scale: 0 }}
                          whileInView={{ rotate: 0, scale: 1 }}
                          transition={{ 
                            delay: 0.2 + index * 0.1,
                            type: "spring",
                            stiffness: 200
                          }}
                          viewport={{ once: true }}
                        >
                          <feature.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${feature.color === 'emerald-500' ? 'text-emerald-500' : 'text-primary'}`} />
                        </motion.div>
                        <div>
                          <motion.h3 
                            className="font-semibold text-base sm:text-lg mb-1"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            viewport={{ once: true }}
                          >
                            {feature.title}
                          </motion.h3>
                          <motion.p 
                            className="text-muted-foreground"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            viewport={{ once: true }}
                          >
                            {feature.desc}
                          </motion.p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              </div>

              {/* Image/Visual */}
              <div className="order-1 lg:order-2">
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  {/* Green glow effect behind container - square with rounded corners */}
                  <div className="absolute -inset-0.5 sm:-inset-1 lg:-inset-1.5">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-emerald-500/10 to-primary/15 rounded-3xl blur-xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-emerald-500/8 rounded-3xl blur-lg animate-pulse" />
                  </div>

                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-emerald-500/10 to-primary/5 backdrop-blur-sm">
                    {/* ANUBIS Token Image - Static and Large */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Glow effect behind the token */}
                      <div className="absolute w-[150%] h-[150%] bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-full blur-3xl" />

                      {/* Token image - larger than container */}
                      <div className="relative w-[140%] h-[140%]">
                        <Image
                          src="/assets/token.png"
                          alt="$ANUBIS Token"
                          fill
                          className="object-contain drop-shadow-2xl"
                          priority
                        />
                      </div>
                    </div>

                    {/* Animated particles */}
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-primary rounded-full"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                          }}
                          animate={{
                            y: [-10, 10, -10],
                            opacity: [0.3, 0.8, 0.3],
                          }}
                          transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Tokenomics Panels */}
        <AnimatedSection
          className="py-24 md:py-32"
          dustIntensity="low"
          parallaxY={20}
          revealStrategy="scroll"
          id="tokenomics"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl min-[425px]:text-3xl sm:text-4xl md:text-5xl font-bold mb-3 min-[425px]:mb-4 sm:mb-6">
                Transparent <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Tokenomics</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Every $ANUBIS purchase directly contributes to the ecosystem. Here's exactly where your investment goes.
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {/* AI Agent Panel */}
              <motion.div
                className="relative"
                variants={scaleVariants}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(16, 185, 129, 0.15)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl"
                  animate={{
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity
                  }}
                />
                <div className="relative rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-sm p-6 sm:p-8 h-full">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-primary/20 p-3">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm">
                          50% ALLOCATION
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-3">ANUBIS AI Agent</h3>
                      <p className="text-muted-foreground mb-6">
                        Powers the development and operation of our revolutionary AI agent with advanced reasoning capabilities.
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span className="text-sm text-muted-foreground">AI Model Training & Fine-tuning</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span className="text-sm text-muted-foreground">Infrastructure & Computing Costs</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span className="text-sm text-muted-foreground">Research & Development</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span className="text-sm text-muted-foreground">Agent Performance Optimization</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Platform Panel */}
              <motion.div
                className="relative"
                variants={scaleVariants}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(52, 211, 153, 0.15)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl"
                  animate={{
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: 0.5
                  }}
                />
                <div className="relative rounded-2xl border border-emerald-500/20 bg-background/50 backdrop-blur-sm p-6 sm:p-8 h-full">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-emerald-500/20 p-3">
                      <Shield className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-2 text-emerald-500 font-semibold text-sm">
                          50% ALLOCATION
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-3">ANUBIS.Chat Platform</h3>
                      <p className="text-muted-foreground mb-6">
                        Maintains and enhances the platform infrastructure that hosts our AI services and community.
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm text-muted-foreground">Server Infrastructure & Hosting</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm text-muted-foreground">Platform Development & Updates</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm text-muted-foreground">Security & Compliance</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm text-muted-foreground">Community Support & Growth</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection
          className="py-24 md:py-32"
          dustIntensity="high"
          parallaxY={24}
          revealStrategy="scroll"
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl min-[425px]:text-3xl sm:text-4xl md:text-5xl font-bold mb-3 min-[425px]:mb-4 sm:mb-6">
                Join the <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">$ANUBIS</span> Revolution
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto">
                Be part of the future of AI funding. Every token purchased helps build the next generation of artificial intelligence.
              </p>

              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <motion.div 
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <motion.div variants={itemVariants}>
                    <Link href="https://pump.fun" target="_blank" rel="noopener noreferrer">
                      <motion.div
                        whileHover={{ 
                          scale: 1.05,
                          rotate: [0, -1, 1, 0],
                          transition: { rotate: { duration: 0.3 } }
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          size="lg"
                          className="group bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-600 text-white font-bold px-6 py-4 sm:px-8 sm:py-6 text-sm sm:text-base relative overflow-hidden"
                        >
                          <motion.span
                            className="absolute inset-0 bg-white/20"
                            initial={{ x: "-100%" }}
                            whileHover={{ x: "100%" }}
                            transition={{ duration: 0.5 }}
                          />
                          <TrendingUp className="mr-2 h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
                          <span className="relative z-10">Launch on Pump.Fun</span>
                          <ExternalLink className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 relative z-10" />
                        </Button>
                      </motion.div>
                    </Link>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Link href="https://raydium.io" target="_blank" rel="noopener noreferrer">
                      <motion.div
                        whileHover={{ 
                          scale: 1.05,
                          rotate: [0, 1, -1, 0],
                          transition: { rotate: { duration: 0.3 } }
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-primary/20 backdrop-blur-sm hover:border-primary/40 px-6 py-4 sm:px-8 sm:py-6 text-sm sm:text-base relative overflow-hidden group"
                        >
                          <motion.span
                            className="absolute inset-0 bg-primary/10"
                            initial={{ scale: 0, opacity: 0 }}
                            whileHover={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                          <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                          <span className="relative z-10">Trade on Raydium</span>
                          <ExternalLink className="ml-2 h-3 w-3 sm:h-4 sm:w-4 relative z-10 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </Button>
                      </motion.div>
                    </Link>
                  </motion.div>
                </motion.div>

                <motion.p 
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  🚀 Token will graduate to Raydium automatically at $69K market cap
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Site Links Section */}
        <SiteLinksSection />

        <LandingFooter />
      </div>
    </div>
  );
}