/**
 * Environment Configuration for ISIS Chat
 * Centralized environment variable management with validation
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3001'),
  
  // OpenAI Configuration
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  OPENAI_ORG_ID: z.string().startsWith('org-').optional(),
  
  // Convex Backend
  CONVEX_DEPLOYMENT: z.string().optional(),
  CONVEX_URL: z.string().url().optional(),
  NEXT_PUBLIC_CONVEX_URL: z.string().url().optional(),
  
  // JWT and Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // CORS and Security
  ALLOWED_ORIGINS: z.string().default('http://localhost:3001'),
  CORS_CREDENTIALS: z.string().default('true').transform(val => val === 'true'),
  
  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(val => parseInt(val)),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(val => parseInt(val)),
  
  // Database
  STORAGE_TYPE: z.enum(['convex', 'supabase', 'memory']).default('convex'),
  
  // External Services (Optional)
  QDRANT_URL: z.string().url().optional(),
  QDRANT_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  
  // Development
  DEBUG: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment variables
function parseEnv() {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_ORG_ID: process.env.OPENAI_ORG_ID,
    CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
    CONVEX_URL: process.env.CONVEX_URL,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    CORS_CREDENTIALS: process.env.CORS_CREDENTIALS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    STORAGE_TYPE: process.env.STORAGE_TYPE,
    QDRANT_URL: process.env.QDRANT_URL,
    QDRANT_API_KEY: process.env.QDRANT_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    DEBUG: process.env.DEBUG,
    LOG_LEVEL: process.env.LOG_LEVEL,
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your .env.local file.`
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const env = parseEnv();

// Type-safe environment access
export type Env = z.infer<typeof envSchema>;

// Runtime environment checks
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// OpenAI configuration
export const openaiConfig = {
  apiKey: env.OPENAI_API_KEY,
  organization: env.OPENAI_ORG_ID,
  enabled: !!env.OPENAI_API_KEY,
};

// Convex configuration
export const convexConfig = {
  deployment: env.CONVEX_DEPLOYMENT,
  url: env.CONVEX_URL,
  publicUrl: env.NEXT_PUBLIC_CONVEX_URL,
  enabled: !!(env.CONVEX_URL || env.NEXT_PUBLIC_CONVEX_URL),
};

// JWT configuration
export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
};

// CORS configuration
export const corsConfig = {
  origins: env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
  credentials: env.CORS_CREDENTIALS,
};

// Rate limiting configuration
export const rateLimitConfig = {
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
};

// Storage configuration
export const storageConfig = {
  type: env.STORAGE_TYPE,
};

// External services configuration
export const externalServices = {
  qdrant: {
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY,
    enabled: !!(env.QDRANT_URL && env.QDRANT_API_KEY),
  },
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    enabled: !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY),
  },
};

// Development configuration
export const devConfig = {
  debug: env.DEBUG,
  logLevel: env.LOG_LEVEL,
  isDevelopment,
  isProduction,
  isTest,
};

// Validation helpers
export function requireEnv(key: keyof Env): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value as string;
}

export function getEnv(key: keyof Env, defaultValue?: string): string | undefined {
  return (env[key] as string) || defaultValue;
}

// Environment validation on import (fail fast)
if (isProduction) {
  // Ensure critical production variables are set
  const requiredProdVars = ['JWT_SECRET'] as const;
  for (const varName of requiredProdVars) {
    if (!env[varName]) {
      throw new Error(`Required production environment variable ${varName} is not set`);
    }
  }

  // Warn about missing optional but recommended variables
  const recommendedVars = [
    { name: 'OPENAI_API_KEY', purpose: 'AI functionality' },
    { name: 'CONVEX_URL', purpose: 'Backend database' },
  ] as const;

  for (const { name, purpose } of recommendedVars) {
    if (!env[name as keyof Env]) {
      console.warn(`Warning: ${name} not set - ${purpose} will be disabled`);
    }
  }
}