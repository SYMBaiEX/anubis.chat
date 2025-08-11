import {
  CheckCircle2,
  Compass,
  Rocket,
  Settings2,
  Sparkles,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import AnimatedSection from '@/components/landing/animated-section';
import LandingFooter from '@/components/landing/landing-footer';
import LandingHeader from '@/components/landing/landing-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Roadmap • anubis.chat',
  description:
    'Quarterly roadmap for anubis.chat including MCP Server connections, Workflow connections, and Memories Management.',
};

export default function RoadmapPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <LandingFooter />

      <main className="w-full flex-1 pt-16 pb-10">
        {/* Hero */}
        <AnimatedSection auroraVariant="gold" className="px-6 py-12">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-4 font-bold text-3xl sm:text-4xl md:text-5xl">
              <span className="text-gradient">Product Roadmap</span>
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              A clear view of what’s shipping now, what’s coming next, and what
              we’re exploring. Timelines are directional and may change.
            </p>
            <div className="mt-6 text-muted-foreground text-xs">
              Last updated: 2025-08-11
            </div>
          </div>
        </AnimatedSection>

        {/* Roadmap Sections */}
        <section className="px-6 py-10">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
            {/* NOW */}
            <Card className="card-hover lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" /> Now
                  </span>
                  <Badge variant="secondary">Q3 · 2025</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">
                        Wallet Auth & Subscriptions
                      </div>
                      <p className="text-muted-foreground">
                        Stable Solana wallet sign-in and SOL-based plans. UX
                        polish ongoing.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">MCP Servers (Alpha)</div>
                      <p className="text-muted-foreground">
                        UI to initialize servers like Context7 and Solana MCP.
                        Server catalog and status surfaced.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">Referral Program</div>
                      <p className="text-muted-foreground">
                        Pro+ gated referrals with tiered commissions and instant
                        wallet payouts.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Link
                          className="text-primary underline underline-offset-4"
                          href="/referral-info"
                        >
                          Referral details
                        </Link>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">Landing & A11y Polish</div>
                      <p className="text-muted-foreground">
                        Unified typography, gradients, and improved
                        accessibility across public pages.
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* NEXT */}
            <Card className="card-hover lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" /> Next
                  </span>
                  <Badge>Q4 · 2025</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Settings2 className="mt-0.5 h-4 w-4 text-accent" />
                    <div>
                      <div className="font-medium">MCP Beta</div>
                      <p className="text-muted-foreground">
                        Permission prompts, connection health checks, and
                        curated server gallery.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Upload className="mt-0.5 h-4 w-4 text-accent" />
                    <div>
                      <div className="font-medium">Memories (Alpha)</div>
                      <p className="text-muted-foreground">
                        Document uploads, embedding, and retrieval for
                        context-aware chats.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Compass className="mt-0.5 h-4 w-4 text-accent" />
                    <div>
                      <div className="font-medium">Workflows (Alpha)</div>
                      <p className="text-muted-foreground">
                        Trigger/action nodes, schedules, run logs, and retry
                        policy.
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* LATER */}
            <Card className="card-hover lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-muted-foreground" /> Later
                  </span>
                  <Badge variant="outline">2026</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Settings2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        Workflows (Beta → Stable)
                      </div>
                      <p className="text-muted-foreground">
                        Branching, approvals, variables/secrets, templates,
                        hosted runners.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Upload className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        Memories (Beta → Stable)
                      </div>
                      <p className="text-muted-foreground">
                        Analytics, redaction tools, organization policies,
                        cross-agent sharing with guardrails.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">MCP Marketplace</div>
                      <p className="text-muted-foreground">
                        Quality bar, community submissions, usage insights and
                        versioning.
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer CTA */}
        <AnimatedSection auroraVariant="primary" className="px-6 py-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-muted-foreground">
              Have feedback or suggestions?{' '}
              <Link
                className="text-primary underline underline-offset-4"
                href="/referral-info"
              >
                Learn about referrals
              </Link>{' '}
              or head back to{' '}
              <Link
                className="text-primary underline underline-offset-4"
                href="/"
              >
                Home
              </Link>
              .
            </p>
          </div>
        </AnimatedSection>
      </main>
    </div>
  );
}
