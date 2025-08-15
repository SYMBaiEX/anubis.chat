'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Crown,
  DollarSign,
  Medal,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  position: number;
  userId: string;
  displayName: string;
  avatar?: string;
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  commissionRate: number;
  tier: number;
  isCurrentUser?: boolean;
  weeklyReferrals?: number;
  monthlyReferrals?: number;
  streak?: number;
}

export default function LeaderboardPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch top 100 users
  const leaderboardData = useQuery(api.referrals.getEnhancedLeaderboard, {
    limit: 100,
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 20,
      },
    },
  };

  const podiumVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 150,
        damping: 12,
      },
    },
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted font-bold text-xs">
            {position}
          </div>
        );
    }
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-amber-400 to-amber-600';
      default:
        return 'from-muted to-muted';
    }
  };

  const formatEarnings = (earnings: number) => {
    return `${earnings.toFixed(4)} SOL`;
  };

  // Pagination logic
  const allUsers = leaderboardData?.leaderboard || [];
  const topThree = allUsers.slice(0, 3);

  // Include ALL users in the paginated list (including top 3)
  const totalPages = Math.ceil(allUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageUsers = allUsers.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        key="leaderboard"
      >
        {/* Animated Background Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 h-32 w-32 animate-pulse rounded-full bg-yellow-500/10 blur-2xl" />
          <div className="absolute top-40 right-20 h-48 w-48 animate-pulse rounded-full bg-purple-500/10 blur-3xl delay-1000" />
          <div className="absolute bottom-20 left-1/3 h-40 w-40 animate-pulse rounded-full bg-blue-500/10 blur-2xl delay-2000" />
        </div>

        {/* Header Section - Matching Dashboard/Agents Style */}
        <div className="relative">
          <motion.div
            animate={{ opacity: 0.5 }}
            className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"
            initial={{ opacity: 0 }}
          >
            <div className="aurora-primary opacity-20" />
          </motion.div>
          <div className="relative px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
                initial={{ opacity: 0, y: -10 }}
              >
                <div>
                  <h1 className="animate-gradient-x bg-gradient-to-r from-primary via-accent to-primary bg-clip-text font-bold text-3xl text-transparent sm:text-4xl">
                    Referral Leaderboard
                  </h1>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Top performers in the ANUBIS Chat referral program
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 animate-pulse text-yellow-500 dark:text-yellow-400" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {leaderboardData?.systemStats && (
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <motion.div
              animate="visible"
              className="grid grid-cols-1 gap-4 sm:grid-cols-4"
              initial="hidden"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 text-center dark:border-green-800 dark:from-green-950/20 dark:to-emerald-950/20">
                  <CardContent className="p-4">
                    <DollarSign className="mx-auto mb-3 h-10 w-10 text-green-600" />
                    <div className="font-bold text-2xl text-green-700 dark:text-green-400">
                      {leaderboardData.systemStats.totalPayoutsSOL.toFixed(2)}{' '}
                      SOL
                    </div>
                    <p className="font-medium text-green-600 text-sm dark:text-green-500">
                      Total Rewards Distributed
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 text-center dark:border-blue-800 dark:from-blue-950/20 dark:to-cyan-950/20">
                  <CardContent className="p-4">
                    <Users className="mx-auto mb-3 h-10 w-10 text-blue-600" />
                    <div className="font-bold text-2xl text-blue-700 dark:text-blue-400">
                      {leaderboardData.systemStats.totalReferrers}
                    </div>
                    <p className="font-medium text-blue-600 text-sm dark:text-blue-500">
                      Active Referrers
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 text-center dark:border-purple-800 dark:from-purple-950/20 dark:to-pink-950/20">
                  <CardContent className="p-4">
                    <TrendingUp className="mx-auto mb-3 h-10 w-10 text-purple-600" />
                    <div className="font-bold text-2xl text-purple-700 dark:text-purple-400">
                      {leaderboardData.systemStats.totalReferrals}
                    </div>
                    <p className="font-medium text-purple-600 text-sm dark:text-purple-500">
                      Total Referrals
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 text-center dark:border-orange-800 dark:from-orange-950/20 dark:to-red-950/20">
                  <CardContent className="p-4">
                    <Zap className="mx-auto mb-3 h-10 w-10 text-orange-600" />
                    <div className="font-bold text-2xl text-orange-700 dark:text-orange-400">
                      {Math.round(
                        (leaderboardData.systemStats.totalPayoutsSOL /
                          Math.max(
                            leaderboardData.systemStats.totalReferrers,
                            1
                          )) *
                          1000
                      ) / 1000}
                    </div>
                    <p className="font-medium text-orange-600 text-sm dark:text-orange-500">
                      Avg. Earnings (SOL)
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <motion.div
              animate="visible"
              className="mb-6"
              initial="hidden"
              variants={containerVariants}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* 2nd Place */}
                {topThree[1] && (
                  <motion.div
                    className="md:order-1 md:mt-6"
                    variants={podiumVariants}
                  >
                    <Card className="relative overflow-hidden border-2 border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 dark:border-gray-600 dark:from-gray-800 dark:to-gray-900">
                      <div className="-mt-1 -mr-1 absolute top-0 right-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 dark:bg-gray-500">
                          <span className="font-bold text-white text-xs">
                            2
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-4 text-center">
                        <Medal className="mx-auto mb-3 h-10 w-10 text-gray-400 dark:text-gray-300" />
                        <Avatar className="mx-auto mb-3 h-16 w-16 border-3 border-gray-300 dark:border-gray-600">
                          <AvatarImage
                            alt={topThree[1].displayName}
                            src={
                              topThree[1].avatar || '/assets/default-avatar.png'
                            }
                          />
                          <AvatarFallback className="bg-gray-200 font-bold text-base text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                            {topThree[1].displayName?.charAt(0).toUpperCase() ||
                              'U'}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="mb-1 font-bold text-foreground text-lg">
                          {topThree[1].displayName}
                        </h3>
                        <p className="mb-2 font-mono text-muted-foreground text-sm">
                          {topThree[1].referralCode}
                        </p>
                        <div className="mb-1 font-bold text-gray-600 text-xl dark:text-gray-300">
                          {formatEarnings(topThree[1].totalEarnings)}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {topThree[1].totalReferrals} referrals
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* 1st Place */}
                <motion.div className="md:order-2" variants={podiumVariants}>
                  <Card className="relative overflow-hidden border-4 border-yellow-400 bg-gradient-to-br from-yellow-100 to-yellow-200 shadow-2xl shadow-yellow-500/20 dark:border-yellow-600 dark:from-yellow-900/20 dark:to-yellow-800/20">
                    <div className="-mt-2 -mr-2 absolute top-0 right-0">
                      <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-yellow-500">
                        <Crown className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-5 text-center">
                      <Crown className="mx-auto mb-3 h-12 w-12 animate-pulse text-yellow-500 dark:text-yellow-400" />
                      <Avatar className="mx-auto mb-4 h-20 w-20 border-4 border-yellow-400 dark:border-yellow-500">
                        <AvatarImage
                          alt={topThree[0].displayName}
                          src={
                            topThree[0].avatar || '/assets/default-avatar.png'
                          }
                        />
                        <AvatarFallback className="bg-yellow-200 font-bold text-lg text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                          {topThree[0].displayName?.charAt(0).toUpperCase() ||
                            'U'}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="mb-1 font-bold text-foreground text-xl">
                        {topThree[0].displayName}
                      </h3>
                      <p className="mb-3 font-mono text-muted-foreground text-sm">
                        {topThree[0].referralCode}
                      </p>
                      <div className="mb-1 font-bold text-2xl text-yellow-600 dark:text-yellow-400">
                        {formatEarnings(topThree[0].totalEarnings)}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {topThree[0].totalReferrals} referrals
                      </p>
                      <Badge className="mt-3 bg-yellow-500 text-white dark:bg-yellow-600">
                        👑 Champion
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* 3rd Place */}
                {topThree[2] && (
                  <motion.div
                    className="md:order-3 md:mt-6"
                    variants={podiumVariants}
                  >
                    <Card className="relative overflow-hidden border-2 border-amber-300 bg-gradient-to-br from-amber-100 to-amber-200 dark:border-amber-600 dark:from-amber-900/20 dark:to-amber-800/20">
                      <div className="-mt-1 -mr-1 absolute top-0 right-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500">
                          <span className="font-bold text-white text-xs">
                            3
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-4 text-center">
                        <Award className="mx-auto mb-3 h-10 w-10 text-amber-600 dark:text-amber-400" />
                        <Avatar className="mx-auto mb-3 h-16 w-16 border-3 border-amber-300 dark:border-amber-600">
                          <AvatarImage
                            alt={topThree[2].displayName}
                            src={
                              topThree[2].avatar || '/assets/default-avatar.png'
                            }
                          />
                          <AvatarFallback className="bg-amber-200 font-bold text-amber-800 text-base dark:bg-amber-800 dark:text-amber-200">
                            {topThree[2].displayName?.charAt(0).toUpperCase() ||
                              'U'}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="mb-1 font-bold text-foreground text-lg">
                          {topThree[2].displayName}
                        </h3>
                        <p className="mb-2 font-mono text-muted-foreground text-sm">
                          {topThree[2].referralCode}
                        </p>
                        <div className="mb-1 font-bold text-amber-600 text-xl dark:text-amber-400">
                          {formatEarnings(topThree[2].totalEarnings)}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {topThree[2].totalReferrals} referrals
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Full Leaderboard Dashboard */}
          {allUsers.length > 0 && (
            <motion.div
              animate="visible"
              initial="hidden"
              variants={containerVariants}
            >
              <Card className="overflow-hidden bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Trophy className="h-5 w-5 text-primary" />
                      Top 100 Leaderboard
                    </CardTitle>
                    <div className="text-muted-foreground text-sm">
                      Showing {startIndex + 1}-
                      {Math.min(endIndex, allUsers.length)} of {allUsers.length}{' '}
                      users
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 border-border/50 border-b bg-muted/30 px-4 py-2">
                    <div className="col-span-1 font-medium text-muted-foreground text-xs">
                      Rank
                    </div>
                    <div className="col-span-5 font-medium text-muted-foreground text-xs">
                      User
                    </div>
                    <div className="col-span-2 text-center font-medium text-muted-foreground text-xs">
                      Referrals
                    </div>
                    <div className="col-span-2 text-center font-medium text-muted-foreground text-xs">
                      Commission
                    </div>
                    <div className="col-span-2 text-right font-medium text-muted-foreground text-xs">
                      Earnings
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-border/50">
                    {currentPageUsers.map((entry, index) => {
                      const actualPosition = startIndex + index + 1; // Position starts at 1
                      return (
                        <motion.div
                          className={cn(
                            'grid grid-cols-12 gap-4 px-4 py-3 transition-colors hover:bg-muted/20',
                            entry.isCurrentUser &&
                              'border-primary border-l-2 bg-primary/5',
                            actualPosition === 1 &&
                              'border-yellow-500 border-l-2 bg-yellow-500/5',
                            actualPosition === 2 &&
                              'border-gray-400 border-l-2 bg-gray-400/5',
                            actualPosition === 3 &&
                              'border-amber-500 border-l-2 bg-amber-500/5'
                          )}
                          key={entry.userId || `user-${actualPosition}`}
                          variants={itemVariants}
                        >
                          {/* Rank */}
                          <div className="col-span-1 flex items-center">
                            {actualPosition === 1 ? (
                              <Crown className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                            ) : actualPosition === 2 ? (
                              <Medal className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                            ) : actualPosition === 3 ? (
                              <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted font-bold text-foreground text-xs">
                                {actualPosition}
                              </div>
                            )}
                          </div>

                          {/* User Info */}
                          <div className="col-span-5 flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                alt={entry.displayName}
                                src={
                                  entry.avatar || '/assets/default-avatar.png'
                                }
                              />
                              <AvatarFallback className="text-xs">
                                {entry.displayName?.charAt(0).toUpperCase() ||
                                  'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 truncate font-medium text-foreground text-sm">
                                {entry.displayName}
                                {entry.isCurrentUser && (
                                  <Badge
                                    className="px-1 py-0 text-xs"
                                    variant="secondary"
                                  >
                                    You
                                  </Badge>
                                )}
                              </div>
                              <p className="truncate font-mono text-muted-foreground text-xs">
                                {entry.referralCode}
                              </p>
                            </div>
                          </div>

                          {/* Referrals */}
                          <div className="col-span-2 flex items-center justify-center">
                            <span className="font-medium text-foreground text-sm">
                              {entry.totalReferrals}
                            </span>
                          </div>

                          {/* Commission Rate */}
                          <div className="col-span-2 flex items-center justify-center">
                            <Badge className="text-xs" variant="outline">
                              {((entry.commissionRate || 0.03) * 100).toFixed(
                                1
                              )}
                              %
                            </Badge>
                          </div>

                          {/* Earnings */}
                          <div className="col-span-2 flex items-center justify-end">
                            <div className="text-right">
                              <div className="font-bold text-foreground text-sm">
                                {formatEarnings(entry.totalEarnings)}
                              </div>
                              {entry.weeklyReferrals && (
                                <p className="text-green-600 text-xs dark:text-green-400">
                                  +{entry.weeklyReferrals} this week
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-border/50 border-t bg-muted/10 px-4 py-3">
                      <Button
                        className="gap-1"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        size="sm"
                        variant="outline"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((page, index) => (
                          <div key={index}>
                            {page === '...' ? (
                              <span className="px-2 text-muted-foreground">
                                ...
                              </span>
                            ) : (
                              <Button
                                className="h-8 w-8 p-0"
                                onClick={() => setCurrentPage(page as number)}
                                size="sm"
                                variant={
                                  currentPage === page ? 'default' : 'outline'
                                }
                              >
                                {page}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      <Button
                        className="gap-1"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        size="sm"
                        variant="outline"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Empty State */}
          {!leaderboardData?.leaderboard ||
          leaderboardData.leaderboard.length === 0 ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="py-8 text-center"
              initial={{ opacity: 0, y: 20 }}
            >
              <Trophy className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
              <h3 className="mb-2 font-semibold text-foreground text-xl">
                No Leaderboard Data Yet
              </h3>
              <p className="mx-auto max-w-md text-muted-foreground">
                Be the first to start referring users and claim your spot on the
                leaderboard!
              </p>
            </motion.div>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
