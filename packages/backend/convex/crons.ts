import { cronJobs } from 'convex/server';
import { api, internal } from './_generated/api';

const crons = cronJobs();

// Clean up expired token price cache entries every hour
crons.hourly(
  'cleanup-expired-token-prices',
  {
    minuteUTC: 0, // Run at the top of every hour
  },
  api.tokenPrices.cleanupExpiredPrices
);

// Process subscription maintenance (downgrade expired subscriptions) every 6 hours
crons.interval(
  'subscription-maintenance',
  {
    hours: 6,
  },
  internal.subscriptionMonitor.processSubscriptionMaintenance
);

export default crons;
