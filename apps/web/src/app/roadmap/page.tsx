'use client';

import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  Grid3x3,
  List,
  Rocket,
  Search,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { useState } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import LandingFooter from '@/components/landing/landing-footer';
import LandingHeader from '@/components/landing/landing-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  categoryColors,
  type RoadmapFeature,
  roadmapData,
  statusConfig,
} from '@/lib/constants/roadmap-data';
import { cn } from '@/lib/utils';
import SiteLinksSection from '../(landing)/components/siteLinksSection';

type FeatureStatus = 'completed' | 'in-progress' | 'upcoming';
type ViewMode = 'timeline' | 'kanban' | 'list';

interface EmptySearchStateProps {
  Icon: React.ComponentType<{ className?: string }>;
  onClearFilters: () => void;
}

function EmptySearchState({ Icon, onClearFilters }: EmptySearchStateProps) {
  return (
    <div className="py-12 text-center">
      <Icon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">
        No features match your search criteria
      </p>
      <Button
        className="mt-4"
        onClick={onClearFilters}
        size="sm"
        variant="outline"
      >
        Clear filters
      </Button>
    </div>
  );
}

function FeatureCard({
  feature,
  expanded,
  onToggle,
}: {
  feature: RoadmapFeature;
  expanded: boolean;
  onToggle: () => void;
}) {
  const StatusIcon = statusConfig[feature.status].icon;
  const FeatureIcon = feature.icon;

  return (
    <Card
      className={cn(
        'group relative transform-gpu overflow-hidden border-primary/10 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl',
        expanded && 'scale-[1.02] shadow-xl ring-2 ring-primary'
      )}
    >
      <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <CardHeader className="relative pb-4">
        <button
          aria-expanded={expanded}
          aria-label={`${feature.title} - ${feature.status} - Click to ${expanded ? 'collapse' : 'expand'} details`}
          className="relative w-full rounded-lg text-left transition-all duration-200 hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={onToggle}
          type="button"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'rounded-lg p-2 transition-transform duration-200 group-hover:scale-110',
                  statusConfig[feature.status].bgColor
                )}
              >
                <FeatureIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {feature.title}
                  <StatusIcon
                    className={cn(
                      'h-4 w-4',
                      statusConfig[feature.status].color
                    )}
                  />
                </CardTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge
                    className={cn('border', categoryColors[feature.category])}
                  >
                    {feature.category}
                  </Badge>
                  <Badge variant="outline">{feature.quarter}</Badge>
                  {feature.estimatedDate && (
                    <Badge variant="secondary">{feature.estimatedDate}</Badge>
                  )}
                </div>
              </div>
              <div className="flex h-6 w-6 items-center justify-center">
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>
        </button>
      </CardHeader>
      <CardContent className="relative">
        <p className="text-muted-foreground text-sm">{feature.description}</p>

        {feature.status !== 'upcoming' && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Progress</span>
              <span className="font-medium text-xs">{feature.progress}%</span>
            </div>
            <Progress
              className="h-2"
              value={feature.progress}
              variant={feature.progress === 100 ? 'success' : 'default'}
            />
          </div>
        )}

        {expanded && (
          <div className="fade-in-0 slide-in-from-top-2 mt-4 animate-in space-y-4 duration-300">
            {feature.details && (
              <div>
                <h4 className="mb-2 font-medium text-sm">Key Features:</h4>
                <ul className="space-y-1">
                  {feature.details.map((detail) => (
                    <li
                      className="flex items-start gap-2 text-muted-foreground text-sm"
                      key={detail}
                    >
                      <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {feature.links && (
              <div className="flex gap-2">
                {feature.links.map((link) => (
                  <Link
                    className="text-primary text-sm underline underline-offset-4 transition-colors hover:text-primary/80"
                    href={link.href}
                    key={link.href}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to avoid nested ternary
function getQuarterStatus(index: number): string {
  switch (index) {
    case 0:
      return 'Shipped';
    case 1:
      return 'In Development';
    default:
      return 'Planning';
  }
}

function TimelineView({
  features,
  expandedCards,
  onToggleCard,
}: {
  features: RoadmapFeature[];
  expandedCards: Set<string>;
  onToggleCard: (id: string) => void;
}) {
  const quarters = ['Q3 2025', 'Q4 2025', '2026'] as const;

  // Calculate statistics for the progress card
  const stats = {
    completed: features.filter((f) => f.status === 'completed').length,
    inProgress: features.filter((f) => f.status === 'in-progress').length,
    upcoming: features.filter((f) => f.status === 'upcoming').length,
    totalProgress: Math.round(
      (features.filter((f) => f.status === 'completed').length /
        features.length) *
        100
    ),
  };

  return (
    <div className="space-y-8">
      {/* Overall Progress with glow */}
      <Card className="relative overflow-hidden border-primary/20">
        <div className="-inset-2 pointer-events-none absolute rounded-xl">
          <div className="absolute inset-0 rounded-xl bg-[radial-gradient(50%_30%_at_50%_20%,rgba(34,197,94,0.12)_0%,rgba(34,197,94,0.06)_40%,transparent_85%)] opacity-40 blur-[6px]" />
        </div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Overall Roadmap Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-4">
            <Progress
              className="h-3"
              value={stats.totalProgress}
              variant="success"
            />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-2xl text-green-600 dark:text-green-400">
                  {stats.completed}
                </div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-yellow-600 dark:text-yellow-400">
                  {stats.inProgress}
                </div>
                <div className="text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-gray-600 dark:text-gray-400">
                  {stats.upcoming}
                </div>
                <div className="text-muted-foreground">Upcoming</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-8 w-0.5 bg-gradient-to-b from-green-500 via-yellow-500 to-gray-400"
        />

        {quarters.map((quarter, qIdx) => {
          const quarterFeatures = features.filter((f) => f.quarter === quarter);

          return (
            <div className="relative mb-12" key={quarter}>
              {/* Quarter Marker with enhanced glow */}
              <div className="mb-6 flex items-center gap-4">
                <div className="relative">
                  {/* Glow effect behind marker */}
                  <div className="-inset-2 pointer-events-none absolute rounded-full">
                    <div className="absolute inset-0 rounded-full bg-primary/20 opacity-60 blur-[8px]" />
                  </div>
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary bg-background shadow-lg transition-transform duration-200 hover:scale-105">
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl">{quarter}</h3>
                  <p className="text-muted-foreground text-sm">
                    {getQuarterStatus(qIdx)}
                  </p>
                </div>
              </div>

              {/* Features with enhanced spacing */}
              <div className="ml-20 space-y-6">
                {quarterFeatures.map((feature) => (
                  <FeatureCard
                    expanded={expandedCards.has(feature.id)}
                    feature={feature}
                    key={feature.id}
                    onToggle={() => onToggleCard(feature.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanView({
  features,
  expandedCards,
  onToggleCard,
}: {
  features: RoadmapFeature[];
  expandedCards: Set<string>;
  onToggleCard: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {(['completed', 'in-progress', 'upcoming'] as FeatureStatus[]).map(
        (status) => {
          const statusFeatures = features.filter((f) => f.status === status);
          const config = statusConfig[status];
          const Icon = config.icon;

          return (
            <div className="space-y-4" key={status}>
              <div className={cn('rounded-lg border p-4', config.bgColor)}>
                <h3 className="flex items-center gap-2 font-semibold">
                  <Icon className={cn('h-5 w-5', config.color)} />
                  {config.label}
                  <Badge className="ml-auto" variant="secondary">
                    {statusFeatures.length}
                  </Badge>
                </h3>
              </div>
              <div className="space-y-4">
                {statusFeatures.map((feature) => (
                  <FeatureCard
                    expanded={expandedCards.has(feature.id)}
                    feature={feature}
                    key={feature.id}
                    onToggle={() => onToggleCard(feature.id)}
                  />
                ))}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

function ListView({
  features,
  expandedCards,
  onToggleCard,
}: {
  features: RoadmapFeature[];
  expandedCards: Set<string>;
  onToggleCard: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {features.map((feature) => (
        <FeatureCard
          expanded={expandedCards.has(feature.id)}
          feature={feature}
          key={feature.id}
          onToggle={() => onToggleCard(feature.id)}
        />
      ))}
    </div>
  );
}

export default function RoadmapPage(): ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FeatureStatus | 'all'>(
    'all'
  );
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (id: string): void => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredFeatures = roadmapData.filter((feature) => {
    const matchesSearch =
      searchQuery === '' ||
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.details?.some((detail) =>
        detail.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFilter =
      selectedFilter === 'all' || feature.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen w-full">
      <LandingHeader />

      <main className="relative w-full flex-1 pb-10">
        {/* Hero */}
        <AnimatedSection
          allowOverlap
          auroraVariant="gold"
          className="isolate overflow-visible px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8"
          dustIntensity="low"
          parallaxY={24}
          revealStrategy="none"
          softEdges
        >
          <div className="relative z-10 mx-auto w-full max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-orange-500/10 px-3 py-1 backdrop-blur-sm md:mb-8">
              <Sparkles className="h-3 w-3 animate-pulse text-primary" />
              <span className="font-medium text-primary text-xs tracking-wide">
                Live Updates • Community Driven
              </span>
              <Sparkles className="h-3 w-3 animate-pulse text-primary" />
            </div>

            <h1 className="mt-2 mb-4 font-bold text-4xl transition-all delay-100 duration-700 sm:text-5xl md:mt-4 md:mb-6 md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-black via-primary to-primary bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-primary">
                Interactive Product Roadmap
              </span>
            </h1>

            <p className="mx-auto mt-3 mb-10 max-w-3xl text-lg text-muted-foreground transition-all delay-200 duration-700 sm:text-xl md:mt-4 md:mb-12 md:text-2xl">
              Track our progress, explore upcoming features, and see what we're
              building next. Click on any card to see more details.
            </p>
            {/* Info badges with glow background */}
            <div className="relative mt-6">
              {/* Glow effect behind info */}
              <div className="-inset-4 pointer-events-none absolute rounded-xl">
                <div className="absolute inset-0 rounded-xl bg-[radial-gradient(50%_30%_at_50%_50%,rgba(34,197,94,0.08)_0%,rgba(34,197,94,0.04)_40%,transparent_85%)] opacity-50 blur-[6px]" />
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs sm:flex-row sm:gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last updated: {new Date().toISOString().split('T')[0]}
                </span>
                <Badge className="gap-1" variant="outline">
                  <Sparkles className="h-3 w-3" />
                  Pro+ users can vote on features
                </Badge>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Controls */}
        <AnimatedSection
          auroraVariant="primary"
          className="px-4 py-12 sm:px-6 lg:px-8"
          dustIntensity="low"
          parallaxY={8}
          revealStrategy="inview"
          softEdges
        >
          <div className="relative z-10 mx-auto max-w-6xl space-y-4">
            {/* Show results count when searching */}
            {searchQuery && (
              <div className="mb-4 text-muted-foreground text-sm">
                Found {filteredFeatures.length}{' '}
                {filteredFeatures.length === 1 ? 'feature' : 'features'}{' '}
                matching "{searchQuery}"
              </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Search roadmap features"
                  className="pr-4 pl-9"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search features by name, category, or description..."
                  type="search"
                  value={searchQuery}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="transition-all"
                  onClick={() => setSelectedFilter('all')}
                  size="sm"
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                >
                  <Filter className="mr-1 h-4 w-4" />
                  All
                  {searchQuery && ` (${filteredFeatures.length})`}
                </Button>
                <Button
                  className="transition-all"
                  onClick={() => setSelectedFilter('completed')}
                  size="sm"
                  variant={
                    selectedFilter === 'completed' ? 'default' : 'outline'
                  }
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Completed
                </Button>
                <Button
                  className="transition-all"
                  onClick={() => setSelectedFilter('in-progress')}
                  size="sm"
                  variant={
                    selectedFilter === 'in-progress' ? 'default' : 'outline'
                  }
                >
                  <Clock className="mr-1 h-4 w-4" />
                  In Progress
                </Button>
                <Button
                  className="transition-all"
                  onClick={() => setSelectedFilter('upcoming')}
                  size="sm"
                  variant={
                    selectedFilter === 'upcoming' ? 'default' : 'outline'
                  }
                >
                  <Calendar className="mr-1 h-4 w-4" />
                  Upcoming
                </Button>
              </div>
            </div>

            {/* View Tabs */}
            <Tabs
              onValueChange={(v) => setViewMode(v as ViewMode)}
              value={viewMode}
            >
              <TabsList className="mb-2 grid w-full max-w-md grid-cols-3">
                <TabsTrigger className="gap-2" value="timeline">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger className="gap-2" value="kanban">
                  <Grid3x3 className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger className="gap-2" value="list">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
              </TabsList>

              <TabsContent className="mt-6" value="timeline">
                {filteredFeatures.length > 0 ? (
                  <TimelineView
                    expandedCards={expandedCards}
                    features={filteredFeatures}
                    onToggleCard={toggleCard}
                  />
                ) : (
                  <EmptySearchState
                    Icon={Search}
                    onClearFilters={() => {
                      setSearchQuery('');
                      setSelectedFilter('all');
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent className="mt-6" value="kanban">
                {filteredFeatures.length > 0 ? (
                  <KanbanView
                    expandedCards={expandedCards}
                    features={filteredFeatures}
                    onToggleCard={toggleCard}
                  />
                ) : (
                  <EmptySearchState
                    Icon={Grid3x3}
                    onClearFilters={() => {
                      setSearchQuery('');
                      setSelectedFilter('all');
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent className="mt-6" value="list">
                {filteredFeatures.length > 0 ? (
                  <ListView
                    expandedCards={expandedCards}
                    features={filteredFeatures}
                    onToggleCard={toggleCard}
                  />
                ) : (
                  <EmptySearchState
                    Icon={List}
                    onClearFilters={() => {
                      setSearchQuery('');
                      setSelectedFilter('all');
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </AnimatedSection>

        {/* Footer CTA */}
        <AnimatedSection
          allowOverlap
          auroraVariant="primary"
          className="isolate overflow-visible px-4 py-16 text-center sm:px-6 md:py-20 lg:px-8"
          dustIntensity="medium"
          parallaxY={16}
          revealStrategy="inview"
          softEdges
          useSurface={false}
        >
          <div className="relative z-10 mx-auto max-w-4xl">
            <h3 className="mb-4 font-bold text-2xl md:text-3xl">
              <span className="bg-gradient-to-r from-black via-primary to-primary bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-primary">
                Have feedback or feature requests?
              </span>
            </h3>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:mb-10">
              We'd love to hear from you! Pro+ users can vote on upcoming
              features and influence our roadmap.
            </p>

            {/* Glow effect behind buttons */}
            <div className="relative">
              <div className="-inset-8 pointer-events-none absolute rounded-2xl">
                <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(60%_40%_at_50%_50%,rgba(34,197,94,0.10)_0%,rgba(34,197,94,0.05)_40%,transparent_85%)] opacity-60 blur-[12px]" />
              </div>

              <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 md:gap-4">
                <Button
                  className="group relative overflow-hidden"
                  size="lg"
                  variant="default"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <Sparkles className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                  Vote on Features (Pro+)
                </Button>
                <Link href="/referral-info">
                  <Button
                    className="group border-primary/20 backdrop-blur-sm hover:border-primary/40"
                    size="lg"
                    variant="outline"
                  >
                    Learn about referrals
                  </Button>
                </Link>
                {/* Removed Back to Home CTA per design update */}
              </div>
            </div>
          </div>
        </AnimatedSection>
        <SiteLinksSection />
      </main>
      <LandingFooter />
    </div>
  );
}
