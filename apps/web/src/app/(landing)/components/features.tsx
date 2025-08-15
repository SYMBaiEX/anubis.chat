'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Brain, Database, Globe, Network, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { Card3D } from '@/components/animations/3dCard';
import AnimatedSection from '@/components/landing/animated-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const featureList = [
  {
    icon: Brain,
    title: 'Multi-Model AI',
    description:
      'Access premium models like GPT-5, GPT-5 Mini, Gemini 2.5 Pro, o4-mini, plus free models like GPT-OSS-20B, GLM-4.5-Air, and Kimi K2.',
    gradient: 'from-primary to-accent',
  },
  {
    icon: Shield,
    title: 'Wallet Authentication',
    description:
      'Secure access with Solana wallet signatures - no passwords needed.',
    gradient: 'from-emerald-400 to-primary',
  },
  {
    icon: Zap,
    title: 'Real-time Streaming',
    description:
      'Instant AI responses with ultra-low latency streaming technology.',
    gradient: 'from-accent to-emerald-400',
  },
  {
    icon: Globe,
    title: 'Web3 Native',
    description: 'Built for the blockchain era with native Solana integration.',
    gradient: 'from-primary to-emerald-400',
  },
  {
    icon: Database,
    title: 'Conversation History',
    description: 'Persistent chat history synced across all your devices.',
    gradient: 'from-accent to-primary',
  },
  {
    icon: Network,
    title: 'Egyptian-Themed UI',
    description:
      'Unique ancient Egyptian aesthetics with modern design principles.',
    gradient: 'from-emerald-400 to-accent',
  },
];

function Features() {
  return (
    <AnimatedSection
      className="py-20 md:py-28 lg:py-32"
      dustIntensity="low"
      edgeMask={false}
      id="features"
      includeTomb={false}
      parallaxY={20}
      revealStrategy="none"
      softEdges={false}
      useSurface={false}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 text-center">
          <h2 className="mb-4 font-bold text-3xl md:text-4xl">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Everything You Need to Conquer the Digital Frontier
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Our platform is packed with features designed to give you an edge in
            the new era of decentralized AI.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureList.map((f, index) => {
            const Icon = f.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                key={f.title}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                viewport={{ margin: '-100px' }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
              >
                <Card3D>
                  <Card className="group relative h-full overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
                    <motion.div
                      className={`pointer-events-none absolute inset-0 z-0 bg-gradient-to-br ${f.gradient}`}
                      initial={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ opacity: 0.1 }}
                    />

                    <CardHeader className="relative z-10">
                      <motion.div
                        className={`mb-3 inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} shadow-lg`}
                        initial={{ scale: 0.95 }}
                        transition={{
                          delay: index * 0.1 + 0.2,
                          duration: 0.4,
                          type: 'spring',
                          stiffness: 280,
                          damping: 24,
                        }}
                        viewport={{ once: true, margin: '-100px' }}
                        whileHover={{
                          scale: 1.1,
                          transition: {
                            type: 'spring',
                            stiffness: 400,
                            damping: 25,
                          },
                        }}
                        whileInView={{ scale: 1 }}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        transition={{
                          delay: index * 0.1 + 0.3,
                          duration: 0.5,
                        }}
                        viewport={{ margin: '-100px' }}
                        whileInView={{ opacity: 1, x: 0 }}
                      >
                        <CardTitle className="text-lg leading-snug">
                          {f.title}
                        </CardTitle>
                      </motion.div>
                    </CardHeader>

                    <CardContent className="relative z-10">
                      <motion.p
                        className="text-muted-foreground text-sm leading-relaxed"
                        initial={{ opacity: 0 }}
                        transition={{
                          delay: index * 0.1 + 0.4,
                          duration: 0.5,
                        }}
                        viewport={{ once: true, margin: '-100px' }}
                        whileInView={{ opacity: 1 }}
                      >
                        {f.description}
                      </motion.p>
                    </CardContent>
                  </Card>
                </Card3D>
              </motion.div>
            );
          })}
        </div>
        
        {/* CTA to explore more features */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          viewport={{ once: true, margin: '-50px' }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Link href="/features">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Button size="lg" className="group">
                Explore All Features in Detail
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

export default Features;
