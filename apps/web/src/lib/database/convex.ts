/**
 * Convex Database Client
 * Simple client for API route integration with Convex backend
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@convex/_generated/api';

// Environment validation
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
}

// Create a singleton Convex client instance
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export { convex, api };