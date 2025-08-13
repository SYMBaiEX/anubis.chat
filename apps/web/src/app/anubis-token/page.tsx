'use client';

import { motion } from 'framer-motion';
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
  Coins
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import LandingFooter from '@/components/landing/landing-footer';
import LandingHeader from '@/components/landing/landing-header';
import { Button } from '@/components/ui/button';
import { Lightning } from '@/components/ui/hero-odyssey';

export default function AnubisTokenPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      {/* Background Lightning */}
      <div className="absolute inset-0 z-0">
        <Lightning />
      </div>

      <div className="relative z-10">
        <LandingHeader />
        
        {/* Hero Section */}
        <AnimatedSection
          allowOverlap
          aria-label="$ANUBIS Token Hero"
          className="isolate overflow-visible pt-28 pb-24 text-center md:pt-36 md:pb-32"
          dustIntensity="medium"
          parallaxY={32}
          revealStrategy="none"
          softEdges
          auroraVariant="gold"
        >
          <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-gradient-to-r from-yellow-500/15 to-orange-500/15 px-4 py-2 backdrop-blur-sm md:mb-12">
              <Coins className="h-4 w-4 animate-bounce text-yellow-500 motion-reduce:animate-none" />
              <span className="font-bold text-yellow-500 text-sm tracking-wide">
                $ANUBIS TOKEN - MEME LAUNCH
              </span>
              <Sparkles className="h-4 w-4 animate-pulse text-yellow-500 motion-reduce:animate-none" />
            </div>

            <motion.h1 
              className="mt-2 mb-10 font-bold text-5xl transition-all delay-100 duration-700 sm:text-6xl md:mt-4 md:mb-12 md:text-7xl lg:text-8xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent animate-pulse">
                $ANUBIS
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Powers the Future
              </span>
            </motion.h1>

            <motion.p 
              className="mx-auto mt-6 mb-16 max-w-4xl text-xl text-muted-foreground transition-all delay-200 duration-700 sm:text-2xl md:mt-10 md:mb-20 md:text-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              The official meme token of the ANUBIS AI Agent. 50% funds the agent, 50% powers the platform. 
              <span className="text-primary font-semibold">Ancient wisdom meets modern memes</span> on Solana.
            </motion.p>

            {/* Token Address */}
            <motion.div
              className="mb-12 mx-auto max-w-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="rounded-xl border border-primary/20 bg-background/50 backdrop-blur-sm p-4">
                <p className="text-sm text-muted-foreground mb-2">Token Contract Address</p>
                <div className="flex items-center justify-between gap-3">
                  <code className="text-primary font-mono text-sm bg-muted px-3 py-2 rounded-md flex-1 text-left">
                    {tokenAddress}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyTokenAddress}
                    className="border-primary/20 hover:border-primary/40"
                  >
                    {copiedAddress ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Link href="https://pump.fun" target="_blank" rel="noopener noreferrer">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold"
                  >
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Buy on Pump.Fun
                    <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
                    className="border-primary/20 backdrop-blur-sm hover:border-primary/40"
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
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
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                      Ancient Power,
                    </span>
                    <br />
                    <span className="text-foreground">Modern Utility</span>
                  </h2>
                  
                  <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                    $ANUBIS isn't just another meme token. It's the lifeblood of the ANUBIS ecosystem, 
                    directly funding both our revolutionary AI agent and the platform that hosts it.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-yellow-500/20 p-2 mt-1">
                        <Zap className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">AI Agent Funding</h3>
                        <p className="text-muted-foreground">50% of all proceeds directly fund ANUBIS AI development and operations</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/20 p-2 mt-1">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Platform Support</h3>
                        <p className="text-muted-foreground">50% goes to maintaining and improving the ANUBIS.Chat platform</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-orange-500/20 p-2 mt-1">
                        <Users className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Community Driven</h3>
                        <p className="text-muted-foreground">Built by the community, for the community, with transparent fund allocation</p>
                      </div>
                    </div>
                  </div>
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
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-yellow-500/10 via-primary/10 to-orange-500/10 backdrop-blur-sm">
                    {/* Placeholder for ANUBIS visual/logo */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <motion.div
                          className="mb-6"
                          animate={{ 
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{ 
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <Coins className="h-16 w-16 text-black" />
                          </div>
                        </motion.div>
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                          $ANUBIS
                        </h3>
                        <p className="text-muted-foreground mt-2">
                          The Future of AI Funding
                        </p>
                      </div>
                    </div>
                    
                    {/* Animated particles */}
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
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
          className="py-24 md:py-32 bg-muted/30"
          dustIntensity="medium"
          parallaxY={16}
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
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Transparent <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Tokenomics</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Every $ANUBIS purchase directly contributes to the ecosystem. Here's exactly where your investment goes.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* AI Agent Panel */}
              <motion.div
                className="relative group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-blue-500/10 backdrop-blur-sm p-8 h-full">
                  <div className="absolute top-4 right-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="h-8 w-8 text-primary opacity-20" />
                    </motion.div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 mb-4">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-primary font-semibold text-sm">50% ALLOCATION</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">ANUBIS AI Agent</h3>
                    <p className="text-muted-foreground mb-6">
                      Powers the development and operation of our revolutionary AI agent with advanced reasoning capabilities.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">AI Model Training & Fine-tuning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Infrastructure & Computing Costs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Research & Development</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Agent Performance Optimization</span>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </motion.div>

              {/* Platform Panel */}
              <motion.div
                className="relative group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 backdrop-blur-sm p-8 h-full">
                  <div className="absolute top-4 right-4">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Shield className="h-8 w-8 text-orange-500 opacity-20" />
                    </motion.div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-3 py-1 mb-4">
                      <Shield className="h-4 w-4 text-orange-500" />
                      <span className="text-orange-500 font-semibold text-sm">50% ALLOCATION</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">ANUBIS.Chat Platform</h3>
                    <p className="text-muted-foreground mb-6">
                      Maintains and enhances the platform infrastructure that hosts our AI services and community.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Server Infrastructure & Hosting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Platform Development & Updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Security & Compliance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Community Support & Growth</span>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection
          className="py-24 md:py-32"
          dustIntensity="high"
          parallaxY={24}
          revealStrategy="scroll"
          auroraVariant="primary"
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Join the <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">$ANUBIS</span> Revolution
              </h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                Be part of the future of AI funding. Every token purchased helps build the next generation of artificial intelligence.
              </p>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="https://pump.fun" target="_blank" rel="noopener noreferrer">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        className="group bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8 py-6"
                      >
                        <TrendingUp className="mr-2 h-6 w-6" />
                        Launch on Pump.Fun
                        <ExternalLink className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </motion.div>
                  </Link>
                  
                  <Link href="https://raydium.io" target="_blank" rel="noopener noreferrer">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-primary/20 backdrop-blur-sm hover:border-primary/40 px-8 py-6"
                      >
                        <Zap className="mr-2 h-5 w-5" />
                        Trade on Raydium
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                </div>

                <p className="text-sm text-muted-foreground">
                  🚀 Token will graduate to Raydium automatically at $69K market cap
                </p>
              </div>
            </motion.div>
          </div>
        </AnimatedSection>

        <LandingFooter />
      </div>
    </div>
  );
}