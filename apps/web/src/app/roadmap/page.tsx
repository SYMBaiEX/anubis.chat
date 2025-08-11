import Link from 'next/link';
import LandingFooter from '@/components/landing/landing-footer';
import LandingHeader from '@/components/landing/landing-header';
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
                <section className="bg-gradient-to-b from-primary/10 to-background px-6 py-12">
                    <div className="mx-auto max-w-4xl text-center">
                        <h1 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
                            Product Roadmap
                        </h1>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            High-level plans and milestones. Timelines are estimates and may
                            change.
                        </p>
                        <div className="mt-6 text-xs text-muted-foreground">
                            Last updated: 2025-08-11
                        </div>
                    </div>
                </section>

                {/* Roadmap Grid */}
                <section className="px-6 py-10">
                    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* 2025 Q3 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-baseline justify-between">
                                    <span>2025 · Q3</span>
                                    <span className="text-xs font-medium text-primary">In progress</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <ul className="list-inside list-disc space-y-2">
                                    <li>
                                        MCP Server connections (alpha): foundational client, secure
                                        connection lifecycle, connection catalog.
                                    </li>
                                    <li>
                                        Workflow connections (design): execution graph model,
                                        connector schema, error handling patterns.
                                    </li>
                                    <li>
                                        Memories Management (spec): unified memory types (short,
                                        long, vector), retention policy, privacy model.
                                    </li>
                                    <li>Landing and docs polish; accessibility improvements.</li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* 2025 Q4 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-baseline justify-between">
                                    <span>2025 · Q4</span>
                                    <span className="text-xs font-medium text-accent">Planned</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <ul className="list-inside list-disc space-y-2">
                                    <li>
                                        MCP Server connections (beta): curated server gallery,
                                        permission prompts, connection health.
                                    </li>
                                    <li>
                                        Workflow connections (alpha): trigger + action nodes,
                                        schedules, run logs, retry policy.
                                    </li>
                                    <li>
                                        Memories Management (alpha): capture from chats/agents,
                                        search/retrieval UI, export controls.
                                    </li>
                                    <li>Improved telemetry, quality, and performance.</li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* 2026 Q1 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-baseline justify-between">
                                    <span>2026 · Q1</span>
                                    <span className="text-xs font-medium text-accent">Planned</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <ul className="list-inside list-disc space-y-2">
                                    <li>
                                        MCP Server connections (stable): versioning, sandboxing,
                                        auditing, enterprise allowlists.
                                    </li>
                                    <li>
                                        Workflow connections (beta): branching, approvals,
                                        variables/secrets manager, templates.
                                    </li>
                                    <li>
                                        Memories Management (beta): cross-agent memory sharing with
                                        guardrails, memory lifespan tuning.
                                    </li>
                                    <li>General platform reliability and UX upgrades.</li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* 2026 Q2 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-baseline justify-between">
                                    <span>2026 · Q2</span>
                                    <span className="text-xs font-medium text-accent">Planned</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <ul className="list-inside list-disc space-y-2">
                                    <li>
                                        MCP Server connections: marketplace quality bar, community
                                        submissions, usage insights.
                                    </li>
                                    <li>
                                        Workflow connections: hosted runners, alerts, and
                                        incident-handling workflows.
                                    </li>
                                    <li>
                                        Memories Management: memory analytics, redaction tools,
                                        organization policies.
                                    </li>
                                    <li>
                                        Vague general: continued model upgrades, new agent
                                        capabilities, and ecosystem integrations.
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Footer CTA */}
                <section className="px-6 py-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <p className="text-muted-foreground">
                            Have feedback or suggestions?{' '}
                            <Link className="text-primary underline underline-offset-4" href="/referral-info">
                                Learn about referrals
                            </Link>{' '}
                            or head back to{' '}
                            <Link className="text-primary underline underline-offset-4" href="/">
                                Home
                            </Link>
                            .
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}


