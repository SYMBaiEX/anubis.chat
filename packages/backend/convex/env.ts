/**
 * Convex Environment Configuration
 * Centralized environment variable management for Convex backend
 */

import { z } from 'zod';

// Define the schema for Convex environment variables
const convexEnvSchema = z.object({
  // OpenAI Configuration
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  OPENAI_ORG_ID: z.string().startsWith('org-').optional(),
  
  // Storage Configuration
  STORAGE_TYPE: z.enum(['convex', 'supabase', 'memory']).default('convex'),
  
  // External Services (Optional)
  QDRANT_URL: z.string().url().optional(),
  QDRANT_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  
  // Application Settings
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEBUG: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment variables
function parseConvexEnv() {
  // In Convex, environment variables are accessed differently
  // Using process.env for consistency with Node.js patterns
  const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_ORG_ID: process.env.OPENAI_ORG_ID,
    STORAGE_TYPE: process.env.STORAGE_TYPE || 'convex',
    QDRANT_URL: process.env.QDRANT_URL,
    QDRANT_API_KEY: process.env.QDRANT_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DEBUG: process.env.DEBUG,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  };

  try {
    return convexEnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `Convex environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your environment variables.`
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const convexEnv = parseConvexEnv();

// Type-safe environment access
export type ConvexEnv = z.infer<typeof convexEnvSchema>;

// Runtime environment checks
export const isDevelopment = convexEnv.NODE_ENV === 'development';
export const isProduction = convexEnv.NODE_ENV === 'production';
export const isTest = convexEnv.NODE_ENV === 'test';

// OpenAI configuration
export const openaiConfig = {
  apiKey: convexEnv.OPENAI_API_KEY,
  organization: convexEnv.OPENAI_ORG_ID,
  enabled: !!convexEnv.OPENAI_API_KEY,
};

// External services configuration
export const externalServices = {
  qdrant: {
    url: convexEnv.QDRANT_URL,
    apiKey: convexEnv.QDRANT_API_KEY,
    enabled: !!(convexEnv.QDRANT_URL && convexEnv.QDRANT_API_KEY),
  },
  supabase: {
    url: convexEnv.SUPABASE_URL,
    anonKey: convexEnv.SUPABASE_ANON_KEY,
    enabled: !!(convexEnv.SUPABASE_URL && convexEnv.SUPABASE_ANON_KEY),
  },
};

// Validation helpers
export function requireEnv(key: keyof ConvexEnv): string {
  const value = convexEnv[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value as string;
}

export function getEnv(key: keyof ConvexEnv, defaultValue?: string): string | undefined {
  return (convexEnv[key] as string) || defaultValue;
}

// Environment validation on import (fail fast)
if (isProduction) {
  // Warn about missing optional but recommended variables in Convex
  const recommendedVars = [
    { name: 'OPENAI_API_KEY', purpose: 'AI functionality' },
  ] as const;

  for (const { name, purpose } of recommendedVars) {
    if (!convexEnv[name as keyof ConvexEnv]) {
      console.warn(`Warning: ${name} not set - ${purpose} will be disabled`);
    }
  }
}