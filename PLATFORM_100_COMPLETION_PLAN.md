# ANUBIS Chat Platform - 100% Completion Implementation Plan

**Generated**: January 14, 2025  
**Total Features Requiring Completion**: 109  
**Estimated Total Effort**: 16-20 weeks with 3-4 developers  
**Priority**: P1 (Critical) → P2 (Important) → P3 (Enhancement)

## Executive Summary

This document provides a comprehensive plan to bring every feature of the ANUBIS Chat platform to 100% completion. Each feature includes:
- Current state analysis with proof of incompletion
- Detailed implementation steps
- Code examples and technical specifications
- Testing requirements
- Time estimates

The platform currently sits at 72% overall completion with 109 features requiring work to reach 100%.

## Quick Navigation

1. [Core Platform Infrastructure](#1-core-platform-infrastructure) - 7 features
2. [AI & Language Model System](#2-ai--language-model-system) - 16 features  
3. [Authentication & Security](#3-authentication--security) - 13 features
4. [Subscription & Payment System](#4-subscription--payment-system) - 11 features
5. [Web3 & Blockchain Integration](#5-web3--blockchain-integration) - 12 features
6. [Backend Infrastructure](#6-backend-infrastructure) - 11 features
7. [User Interface & Experience](#7-user-interface--experience) - 10 features
8. [Testing & Quality Assurance](#8-testing--quality-assurance) - 9 features
9. [Documentation & DevOps](#9-documentation--devops) - 10 features

---

## 1. Core Platform Infrastructure

### 1.1 PWA Support (90% → 100%)

**Current State**: Basic PWA manifest and service workers implemented  
**Missing**: Offline functionality, background sync, push notifications

**Proof of Incompletion**:
- No offline page at `/home/user/anubis.chat/apps/web/public/offline.html`
- Service worker lacks caching strategies in `/public/sw.js`
- No push notification implementation

**Implementation Plan**:
```typescript
// 1. Create offline.html
// apps/web/public/offline.html
<!DOCTYPE html>
<html>
<head>
  <title>ANUBIS Chat - Offline</title>
  <style>/* Offline styles */</style>
</head>
<body>
  <h1>You're offline</h1>
  <p>Check your connection and reload</p>
</body>
</html>

// 2. Enhanced service worker with caching
// apps/web/public/sw.js
const CACHE_NAME = 'anubis-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/favicon.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 3. Add push notification support
// apps/web/src/lib/notifications.ts
export async function subscribeToPushNotifications() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(PUBLIC_VAPID_KEY)
  });
  return subscription;
}
```

**Testing Requirements**:
- Test offline mode functionality
- Verify cache invalidation
- Test push notification delivery
- Lighthouse PWA audit score > 95

**Time Estimate**: 3 days

---

### 1.2 Responsive Design ✅ COMPLETED (100%)

**Implementation Completed**: Full responsive design with tablet optimization and landscape fixes implemented.

---

### 1.3 Error Boundaries ✅ COMPLETED (100%)

**Implementation Completed**: Full error boundary system with route-level boundaries, smart recovery, and error reporting service integration.

**Implemented Features**:
- Route-level error boundaries for app, chat, and admin sections
- Smart error recovery with exponential backoff and strategy selection
- Complete error reporting service with queue management
- Error context management with history tracking
- Specialized error fallback components for different contexts
- Integration with existing error boundaries for reporting

**Files Created/Updated**:
- Created route error boundaries: `/app/(app)/error.tsx`, `/app/(app)/chat/error.tsx`, `/app/(app)/admin/error.tsx`
- Created ErrorRecovery component with intelligent retry strategies
- Created comprehensive error reporting service at `/lib/error-reporting.ts`
- Created ErrorContext for centralized error state management
- Created ChatErrorFallback for specialized chat error handling
- Updated existing error boundaries with reporting integration
- Added error service configuration to `.env.example`

---

### 1.4 Loading States (90% → 100%)

**Current State**: Skeleton loaders implemented  
**Missing**: Streaming SSR loading, progressive enhancement

**Proof of Incompletion**:
- No streaming suspense boundaries
- Missing loading priorities
- No progressive data loading

**Implementation Plan**:
```typescript
// 1. Implement streaming SSR
// apps/web/src/app/layout.tsx
export default function RootLayout({ children }: Props) {
  return (
    <html>
      <body>
        <Suspense fallback={<HeaderSkeleton />}>
          <Header />
        </Suspense>
        <Suspense fallback={<MainSkeleton />}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}

// 2. Add loading priorities
// apps/web/src/hooks/useProgressiveLoad.ts
export function useProgressiveLoad<T>(
  loader: () => Promise<T>,
  priority: 'high' | 'normal' | 'low'
) {
  const [data, setData] = useState<T>();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const delay = priority === 'high' ? 0 : 
                  priority === 'normal' ? 100 : 300;
    
    const timeout = setTimeout(async () => {
      const result = await loader();
      setData(result);
      setIsLoading(false);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [loader, priority]);
  
  return { data, isLoading };
}

// 3. Implement progressive enhancement
// apps/web/src/components/ProgressiveImage.tsx
export function ProgressiveImage({ src, placeholder, alt }: Props) {
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setCurrentSrc(src);
  }, [src]);
  
  return (
    <img 
      src={currentSrc} 
      alt={alt}
      className={cn(
        'transition-opacity',
        currentSrc === placeholder && 'opacity-50'
      )}
    />
  );
}
```

**Testing Requirements**:
- Test streaming SSR performance
- Verify loading priorities
- Test progressive enhancement
- Measure Core Web Vitals

**Time Estimate**: 2 days

---

### 1.5 Environment Configuration (60% → 100%)

**Current State**: .env.example files exist  
**Missing**: Validation, rotation strategy, secrets management

**Proof of Incompletion**:
- No environment validation at startup
- No secrets rotation mechanism
- Missing environment-specific configs

**Implementation Plan**:
```typescript
// 1. Create environment validator
// apps/web/src/lib/env-validator.ts
import { z } from 'zod';

const envSchema = z.object({
  // Required variables
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  CONVEX_DEPLOYMENT: z.string().min(1),
  OPENAI_API_KEY: z.string().regex(/^sk-/),
  
  // Optional with defaults
  RATE_LIMIT_ENABLED: z.boolean().default(true),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Environment-specific
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  
  return parsed.data;
}

// 2. Implement secrets rotation
// apps/web/src/lib/secrets-manager.ts
export class SecretsManager {
  private secrets: Map<string, Secret> = new Map();
  
  async rotateSecret(key: string) {
    const newValue = await this.generateNewSecret(key);
    const oldValue = this.secrets.get(key);
    
    // Update in vault
    await this.updateVault(key, newValue);
    
    // Graceful rotation with overlap period
    this.secrets.set(key, {
      current: newValue,
      previous: oldValue?.current,
      rotatedAt: Date.now(),
      expiresAt: Date.now() + 86400000 // 24 hours
    });
    
    // Schedule cleanup
    setTimeout(() => {
      this.cleanupOldSecret(key);
    }, 86400000);
  }
  
  async getSecret(key: string): Promise<string> {
    const secret = this.secrets.get(key);
    
    if (!secret || Date.now() > secret.expiresAt) {
      await this.rotateSecret(key);
      return this.secrets.get(key)!.current;
    }
    
    return secret.current;
  }
}

// 3. Environment-specific configurations
// apps/web/src/config/index.ts
export const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    logLevel: 'debug',
    cache: { ttl: 60 },
    rateLimit: { enabled: false }
  },
  staging: {
    apiUrl: 'https://staging.anubis.chat',
    logLevel: 'info',
    cache: { ttl: 300 },
    rateLimit: { enabled: true, max: 100 }
  },
  production: {
    apiUrl: 'https://anubis.chat',
    logLevel: 'warn',
    cache: { ttl: 3600 },
    rateLimit: { enabled: true, max: 50 }
  }
}[process.env.NODE_ENV || 'development'];
```

**Testing Requirements**:
- Test environment validation
- Verify secrets rotation
- Test environment switching
- Security audit

**Time Estimate**: 3 days

---

### 1.6 CI/CD Pipeline (0% → 100%)

**Current State**: No CI/CD pipeline  
**Missing**: Complete GitHub Actions workflow

**Proof of Incompletion**:
- Only Claude Code workflows exist
- No build/test/deploy pipelines
- No automated releases

**Implementation Plan**:
```yaml
# 1. Create main CI pipeline
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run linting
        run: bun run check
      
      - name: Type checking
        run: bun run check-types

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run unit tests
        run: bun test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Build application
        run: bun run build
        env:
          NEXT_PUBLIC_CONVEX_URL: ${{ secrets.CONVEX_URL }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: apps/web/.next

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
          path: apps/web/.next
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

# 2. Create staging deployment
# .github/workflows/staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run tests
        run: bun test
      
      - name: Build for staging
        run: bun run build
        env:
          NODE_ENV: staging
          NEXT_PUBLIC_CONVEX_URL: ${{ secrets.STAGING_CONVEX_URL }}
      
      - name: Deploy to staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--env=preview'
          alias-domains: staging.anubis.chat

# 3. Create release workflow
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Generate changelog
        id: changelog
        uses: TriPSs/conventional-changelog-action@v3
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          output-file: 'CHANGELOG.md'
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: ${{ steps.changelog.outputs.clean_changelog }}
          draft: false
          prerelease: false
```

**Testing Requirements**:
- Test all workflow paths
- Verify secret handling
- Test deployment rollback
- Monitor pipeline performance

**Time Estimate**: 4 days

---

### 1.7 Docker Configuration (0% → 100%)

**Current State**: No containerization  
**Missing**: Complete Docker setup

**Proof of Incompletion**:
- No Dockerfile exists
- No docker-compose.yml
- No container orchestration

**Implementation Plan**:
```dockerfile
# 1. Create multi-stage Dockerfile
# Dockerfile
# Stage 1: Dependencies
FROM oven/bun:1.2.18-alpine AS deps
WORKDIR /app
COPY package.json bun.lockb ./
COPY apps/web/package.json ./apps/web/
COPY packages/backend/package.json ./packages/backend/
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1.2.18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1.2.18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/web/server.js"]

# 2. Create docker-compose.yml
# docker-compose.yml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_CONVEX_URL=${CONVEX_URL}
      - CONVEX_DEPLOYMENT=${CONVEX_DEPLOYMENT}
    depends_on:
      - redis
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web
    restart: unless-stopped

volumes:
  redis_data:

# 3. Create development docker-compose
# docker-compose.dev.yml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    command: bun dev

  convex:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
    ports:
      - "3210:3210"
    environment:
      - CONVEX_DEPLOYMENT=development
    volumes:
      - ./packages/backend:/app
    command: bun dev
```

**Testing Requirements**:
- Test container builds
- Verify multi-stage optimization
- Test orchestration
- Load test containerized app

**Time Estimate**: 3 days

---

## 2. AI & Language Model System

### 2.1 Streaming Responses (95% → 100%)

**Current State**: Basic streaming implemented  
**Missing**: Error recovery, chunk validation, backpressure handling

**Proof of Incompletion**:
- No chunk validation in streaming
- Missing error recovery mid-stream
- No adaptive backpressure

**Implementation Plan**:
```typescript
// 1. Add chunk validation
// apps/web/src/lib/streaming/chunk-validator.ts
export class ChunkValidator {
  private buffer = '';
  private decoder = new TextDecoder();
  
  validateChunk(chunk: Uint8Array): ValidatedChunk {
    const text = this.decoder.decode(chunk, { stream: true });
    this.buffer += text;
    
    // Check for complete JSON objects
    const messages: any[] = [];
    const lines = this.buffer.split('\n');
    
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          messages.push(data);
        } catch (e) {
          console.warn('Invalid chunk:', line);
        }
      }
    }
    
    this.buffer = lines[lines.length - 1];
    
    return {
      valid: messages.length > 0,
      messages,
      partial: this.buffer
    };
  }
}

// 2. Implement error recovery
// apps/web/src/lib/streaming/stream-recovery.ts
export class StreamRecovery {
  private retryCount = 0;
  private maxRetries = 3;
  private lastCheckpoint: string = '';
  
  async recoverStream(
    error: Error,
    resumeFrom: string,
    originalRequest: Request
  ): Promise<ReadableStream> {
    if (this.retryCount >= this.maxRetries) {
      throw new Error('Max retries exceeded');
    }
    
    this.retryCount++;
    
    // Exponential backoff
    await new Promise(resolve => 
      setTimeout(resolve, Math.pow(2, this.retryCount) * 1000)
    );
    
    // Resume from checkpoint
    const resumeRequest = new Request(originalRequest, {
      headers: {
        ...originalRequest.headers,
        'X-Resume-From': resumeFrom,
        'X-Retry-Count': String(this.retryCount)
      }
    });
    
    const response = await fetch(resumeRequest);
    
    if (!response.ok) {
      return this.recoverStream(
        new Error(response.statusText),
        resumeFrom,
        originalRequest
      );
    }
    
    return response.body!;
  }
}

// 3. Adaptive backpressure
// apps/web/src/lib/streaming/backpressure-controller.ts
export class BackpressureController {
  private queue: any[] = [];
  private processing = false;
  private pressure = 0;
  private maxPressure = 100;
  
  async enqueue(chunk: any, writer: WritableStreamDefaultWriter) {
    this.queue.push(chunk);
    this.pressure++;
    
    if (!this.processing) {
      await this.process(writer);
    }
    
    // Apply backpressure
    if (this.pressure > this.maxPressure) {
      await new Promise(resolve => 
        setTimeout(resolve, this.pressure * 10)
      );
    }
  }
  
  private async process(writer: WritableStreamDefaultWriter) {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const chunk = this.queue.shift();
      this.pressure--;
      
      try {
        await writer.ready;
        await writer.write(chunk);
        
        // Adaptive delay based on pressure
        if (this.pressure > this.maxPressure * 0.7) {
          await new Promise(resolve => 
            setTimeout(resolve, 50)
          );
        }
      } catch (error) {
        console.error('Write error:', error);
        this.queue.unshift(chunk); // Re-queue
        this.pressure++;
        break;
      }
    }
    
    this.processing = false;
  }
}
```

**Testing Requirements**:
- Test chunk validation with malformed data
- Test stream recovery scenarios
- Verify backpressure handling
- Load test streaming endpoints

**Time Estimate**: 3 days

---

### 2.2 Tool Calling Framework (85% → 100%)

**Current State**: Basic tool calling implemented  
**Missing**: Tool validation, versioning, sandboxing

**Proof of Incompletion**:
- No tool input validation
- Missing tool versioning system
- No sandboxed execution

**Implementation Plan**:
```typescript
// 1. Tool validation system
// apps/web/src/lib/tools/tool-validator.ts
import { z } from 'zod';

export class ToolValidator {
  private schemas = new Map<string, z.ZodSchema>();
  
  registerTool(name: string, schema: z.ZodSchema) {
    this.schemas.set(name, schema);
  }
  
  validateInput(toolName: string, input: unknown): ValidationResult {
    const schema = this.schemas.get(toolName);
    
    if (!schema) {
      return {
        valid: false,
        error: `Unknown tool: ${toolName}`
      };
    }
    
    const result = schema.safeParse(input);
    
    if (!result.success) {
      return {
        valid: false,
        error: result.error.message,
        details: result.error.flatten()
      };
    }
    
    return {
      valid: true,
      data: result.data
    };
  }
}

// 2. Tool versioning
// apps/web/src/lib/tools/tool-registry.ts
export class ToolRegistry {
  private tools = new Map<string, Map<string, Tool>>();
  
  registerTool(tool: Tool) {
    const versions = this.tools.get(tool.name) || new Map();
    versions.set(tool.version, tool);
    this.tools.set(tool.name, versions);
  }
  
  getTool(name: string, version?: string): Tool | undefined {
    const versions = this.tools.get(name);
    if (!versions) return undefined;
    
    if (version) {
      return versions.get(version);
    }
    
    // Get latest version
    const sortedVersions = Array.from(versions.keys()).sort(
      (a, b) => semver.compare(b, a)
    );
    
    return versions.get(sortedVersions[0]);
  }
  
  listVersions(name: string): string[] {
    const versions = this.tools.get(name);
    return versions ? Array.from(versions.keys()) : [];
  }
}

// 3. Sandboxed execution
// apps/web/src/lib/tools/tool-sandbox.ts
export class ToolSandbox {
  private worker: Worker;
  private timeout: number = 30000;
  
  constructor() {
    this.worker = new Worker('/workers/tool-executor.js');
  }
  
  async execute(tool: Tool, input: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.worker.terminate();
        this.worker = new Worker('/workers/tool-executor.js');
        reject(new Error('Tool execution timeout'));
      }, this.timeout);
      
      const messageHandler = (event: MessageEvent) => {
        clearTimeout(timeoutId);
        this.worker.removeEventListener('message', messageHandler);
        
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.result);
        }
      };
      
      this.worker.addEventListener('message', messageHandler);
      
      // Send tool execution request
      this.worker.postMessage({
        tool: {
          name: tool.name,
          code: tool.code,
          permissions: tool.permissions
        },
        input
      });
    });
  }
}

// Worker implementation
// apps/web/public/workers/tool-executor.js
self.addEventListener('message', async (event) => {
  const { tool, input } = event.data;
  
  try {
    // Create sandboxed context
    const sandbox = {
      console: {
        log: (...args) => self.postMessage({ log: args }),
        error: (...args) => self.postMessage({ error: args })
      },
      fetch: tool.permissions.includes('network') ? fetch : undefined,
      crypto: tool.permissions.includes('crypto') ? crypto : undefined
    };
    
    // Execute tool in sandbox
    const fn = new Function('input', 'context', tool.code);
    const result = await fn(input, sandbox);
    
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
});
```

**Testing Requirements**:
- Test tool validation with various inputs
- Verify version compatibility
- Test sandbox isolation
- Security audit sandbox

**Time Estimate**: 4 days

---

### 2.3 MCP Server Integration (90% → 100%)

**Current State**: Basic MCP integration working  
**Missing**: Server health monitoring, automatic reconnection, request queuing

**Proof of Incompletion**:
- No health check mechanism
- Missing reconnection logic
- No request queue during disconnections

**Implementation Plan**:
```typescript
// 1. Health monitoring
// apps/web/src/lib/mcp/health-monitor.ts
export class MCPHealthMonitor {
  private healthChecks = new Map<string, HealthStatus>();
  private intervals = new Map<string, NodeJS.Timeout>();
  
  startMonitoring(serverId: string, client: MCPClient) {
    const interval = setInterval(async () => {
      try {
        const start = Date.now();
        await client.ping();
        const latency = Date.now() - start;
        
        this.healthChecks.set(serverId, {
          status: 'healthy',
          latency,
          lastCheck: Date.now(),
          consecutiveFailures: 0
        });
      } catch (error) {
        const current = this.healthChecks.get(serverId);
        const failures = (current?.consecutiveFailures || 0) + 1;
        
        this.healthChecks.set(serverId, {
          status: failures > 3 ? 'unhealthy' : 'degraded',
          latency: -1,
          lastCheck: Date.now(),
          consecutiveFailures: failures,
          error: error.message
        });
        
        if (failures > 3) {
          this.handleUnhealthyServer(serverId, client);
        }
      }
    }, 30000); // Check every 30 seconds
    
    this.intervals.set(serverId, interval);
  }
  
  private async handleUnhealthyServer(
    serverId: string,
    client: MCPClient
  ) {
    // Trigger reconnection
    await client.reconnect();
    
    // Notify monitoring system
    await this.notifyMonitoring({
      event: 'mcp_server_unhealthy',
      serverId,
      timestamp: Date.now()
    });
  }
}

// 2. Automatic reconnection
// apps/web/src/lib/mcp/reconnection-manager.ts
export class ReconnectionManager {
  private reconnectAttempts = new Map<string, number>();
  private maxAttempts = 5;
  private backoffMultiplier = 2;
  
  async reconnect(serverId: string, client: MCPClient): Promise<boolean> {
    const attempts = this.reconnectAttempts.get(serverId) || 0;
    
    if (attempts >= this.maxAttempts) {
      console.error(`Max reconnection attempts reached for ${serverId}`);
      return false;
    }
    
    this.reconnectAttempts.set(serverId, attempts + 1);
    
    // Exponential backoff
    const delay = Math.pow(this.backoffMultiplier, attempts) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await client.connect();
      this.reconnectAttempts.delete(serverId);
      console.log(`Successfully reconnected to ${serverId}`);
      return true;
    } catch (error) {
      console.error(`Reconnection attempt ${attempts + 1} failed:`, error);
      return this.reconnect(serverId, client);
    }
  }
}

// 3. Request queuing
// apps/web/src/lib/mcp/request-queue.ts
export class MCPRequestQueue {
  private queues = new Map<string, QueueItem[]>();
  private processing = new Map<string, boolean>();
  
  enqueue(serverId: string, request: MCPRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      const queue = this.queues.get(serverId) || [];
      queue.push({ request, resolve, reject });
      this.queues.set(serverId, queue);
      
      this.processQueue(serverId);
    });
  }
  
  private async processQueue(serverId: string) {
    if (this.processing.get(serverId)) return;
    
    this.processing.set(serverId, true);
    const queue = this.queues.get(serverId) || [];
    
    while (queue.length > 0) {
      const item = queue.shift()!;
      
      try {
        const client = await this.getHealthyClient(serverId);
        const result = await client.execute(item.request);
        item.resolve(result);
      } catch (error) {
        // Re-queue if temporary failure
        if (this.isTemporaryError(error)) {
          queue.unshift(item);
          await this.waitForReconnection(serverId);
        } else {
          item.reject(error);
        }
      }
    }
    
    this.processing.set(serverId, false);
  }
  
  private async getHealthyClient(serverId: string): Promise<MCPClient> {
    const client = this.clients.get(serverId);
    
    if (!client || !client.isConnected()) {
      await this.reconnectionManager.reconnect(serverId, client);
    }
    
    return client;
  }
}
```

**Testing Requirements**:
- Test health monitoring accuracy
- Verify reconnection logic
- Test queue persistence
- Load test with failures

**Time Estimate**: 3 days

---

### 2.4 Agent Orchestration (80% → 100%)

**Current State**: Basic orchestration working  
**Missing**: Agent communication protocol, state persistence, distributed execution

**Proof of Incompletion**:
- No inter-agent communication
- Agent state not persisted
- Single-node execution only

**Implementation Plan**:
```typescript
// 1. Inter-agent communication protocol
// apps/web/src/lib/agents/communication.ts
export interface AgentMessage {
  from: string;
  to: string;
  type: 'request' | 'response' | 'broadcast';
  payload: any;
  correlationId: string;
  timestamp: number;
}

export class AgentCommunicationBus {
  private subscribers = new Map<string, Set<MessageHandler>>();
  private messageQueue = new Map<string, AgentMessage[]>();
  
  subscribe(agentId: string, handler: MessageHandler) {
    const handlers = this.subscribers.get(agentId) || new Set();
    handlers.add(handler);
    this.subscribers.set(agentId, handlers);
    
    // Process queued messages
    const queued = this.messageQueue.get(agentId) || [];
    queued.forEach(msg => handler(msg));
    this.messageQueue.delete(agentId);
  }
  
  async send(message: AgentMessage) {
    const handlers = this.subscribers.get(message.to);
    
    if (!handlers || handlers.size === 0) {
      // Queue message if recipient not ready
      const queue = this.messageQueue.get(message.to) || [];
      queue.push(message);
      this.messageQueue.set(message.to, queue);
      return;
    }
    
    // Deliver to all handlers
    await Promise.all(
      Array.from(handlers).map(handler => handler(message))
    );
  }
  
  async broadcast(from: string, payload: any) {
    const message: AgentMessage = {
      from,
      to: '*',
      type: 'broadcast',
      payload,
      correlationId: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    // Send to all agents except sender
    for (const [agentId, handlers] of this.subscribers) {
      if (agentId !== from) {
        await Promise.all(
          Array.from(handlers).map(handler => handler(message))
        );
      }
    }
  }
}

// 2. State persistence
// apps/web/src/lib/agents/state-manager.ts
export class AgentStateManager {
  private states = new Map<string, AgentState>();
  
  async saveState(agentId: string, state: AgentState) {
    // Save to memory
    this.states.set(agentId, state);
    
    // Persist to database
    await this.convex.mutation(api.agents.saveState, {
      agentId,
      state: JSON.stringify(state),
      timestamp: Date.now()
    });
    
    // Save checkpoint for recovery
    if (state.checkpoint) {
      await this.saveCheckpoint(agentId, state.checkpoint);
    }
  }
  
  async loadState(agentId: string): Promise<AgentState | null> {
    // Try memory first
    const memoryState = this.states.get(agentId);
    if (memoryState) return memoryState;
    
    // Load from database
    const dbState = await this.convex.query(api.agents.getState, {
      agentId
    });
    
    if (dbState) {
      const state = JSON.parse(dbState.state);
      this.states.set(agentId, state);
      return state;
    }
    
    return null;
  }
  
  async saveCheckpoint(agentId: string, checkpoint: Checkpoint) {
    await this.convex.mutation(api.agents.saveCheckpoint, {
      agentId,
      checkpoint: {
        step: checkpoint.step,
        data: checkpoint.data,
        timestamp: Date.now()
      }
    });
  }
  
  async recoverFromCheckpoint(agentId: string): Promise<Checkpoint | null> {
    const checkpoint = await this.convex.query(api.agents.getLatestCheckpoint, {
      agentId
    });
    
    return checkpoint;
  }
}

// 3. Distributed execution
// apps/web/src/lib/agents/distributed-executor.ts
export class DistributedAgentExecutor {
  private workers: Map<string, Worker> = new Map();
  private loadBalancer: LoadBalancer;
  
  constructor() {
    this.loadBalancer = new LoadBalancer();
    this.initializeWorkers();
  }
  
  private initializeWorkers() {
    const workerCount = navigator.hardwareConcurrency || 4;
    
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker('/workers/agent-executor.js');
      this.workers.set(`worker-${i}`, worker);
    }
  }
  
  async executeAgent(agent: Agent, input: any): Promise<any> {
    // Select optimal worker
    const workerId = this.loadBalancer.selectWorker(
      Array.from(this.workers.keys())
    );
    
    const worker = this.workers.get(workerId)!;
    
    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent) => {
        if (event.data.agentId === agent.id) {
          worker.removeEventListener('message', messageHandler);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };
      
      worker.addEventListener('message', messageHandler);
      
      worker.postMessage({
        type: 'execute',
        agent: {
          id: agent.id,
          code: agent.code,
          config: agent.config
        },
        input
      });
      
      // Track load
      this.loadBalancer.incrementLoad(workerId);
      
      // Decrement load when done
      setTimeout(() => {
        this.loadBalancer.decrementLoad(workerId);
      }, 0);
    });
  }
  
  async distributeTask(task: Task, agents: Agent[]): Promise<any[]> {
    // Split task into subtasks
    const subtasks = this.splitTask(task, agents.length);
    
    // Execute in parallel across workers
    const results = await Promise.all(
      agents.map((agent, i) => 
        this.executeAgent(agent, subtasks[i])
      )
    );
    
    // Merge results
    return this.mergeResults(results);
  }
}
```

**Testing Requirements**:
- Test agent communication
- Verify state persistence
- Test distributed execution
- Performance benchmarks

**Time Estimate**: 5 days

---

### 2.5 Vector Database Integration (0% → 100%)

**Current State**: No external vector database  
**Missing**: Complete Qdrant/Pinecone integration

**Proof of Incompletion**:
- Only Convex vector search exists
- No external vector DB connections
- Limited to 1536 dimensions

**Implementation Plan**:
```typescript
// 1. Qdrant integration
// apps/web/src/lib/vector/qdrant-client.ts
import { QdrantClient } from '@qdrant/js-client-rest';

export class QdrantVectorStore {
  private client: QdrantClient;
  private collectionName: string;
  
  constructor(config: QdrantConfig) {
    this.client = new QdrantClient({
      url: config.url,
      apiKey: config.apiKey
    });
    this.collectionName = config.collection;
  }
  
  async initialize() {
    // Check if collection exists
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(
      c => c.name === this.collectionName
    );
    
    if (!exists) {
      // Create collection with proper configuration
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: 1536, // OpenAI embedding size
          distance: 'Cosine'
        },
        optimizers_config: {
          default_segment_number: 2
        },
        replication_factor: 2
      });
      
      // Create indexes for metadata filtering
      await this.client.createFieldIndex(this.collectionName, {
        field_name: 'userId',
        field_schema: 'keyword'
      });
      
      await this.client.createFieldIndex(this.collectionName, {
        field_name: 'type',
        field_schema: 'keyword'
      });
    }
  }
  
  async upsert(documents: VectorDocument[]) {
    const points = documents.map(doc => ({
      id: doc.id,
      vector: doc.embedding,
      payload: {
        content: doc.content,
        metadata: doc.metadata,
        userId: doc.userId,
        type: doc.type,
        timestamp: Date.now()
      }
    }));
    
    await this.client.upsert(this.collectionName, {
      wait: true,
      points
    });
  }
  
  async search(
    embedding: number[],
    filter?: VectorFilter,
    limit: number = 10
  ): Promise<SearchResult[]> {
    const searchParams: any = {
      vector: embedding,
      limit,
      with_payload: true
    };
    
    if (filter) {
      searchParams.filter = this.buildFilter(filter);
    }
    
    const results = await this.client.search(
      this.collectionName,
      searchParams
    );
    
    return results.map(r => ({
      id: r.id,
      score: r.score,
      content: r.payload.content,
      metadata: r.payload.metadata
    }));
  }
  
  private buildFilter(filter: VectorFilter) {
    const conditions: any[] = [];
    
    if (filter.userId) {
      conditions.push({
        key: 'userId',
        match: { value: filter.userId }
      });
    }
    
    if (filter.type) {
      conditions.push({
        key: 'type',
        match: { value: filter.type }
      });
    }
    
    if (filter.dateRange) {
      conditions.push({
        key: 'timestamp',
        range: {
          gte: filter.dateRange.start,
          lte: filter.dateRange.end
        }
      });
    }
    
    return conditions.length > 0 ? { must: conditions } : undefined;
  }
}

// 2. Pinecone integration
// apps/web/src/lib/vector/pinecone-client.ts
import { Pinecone } from '@pinecone-database/pinecone';

export class PineconeVectorStore {
  private client: Pinecone;
  private index: any;
  
  constructor(config: PineconeConfig) {
    this.client = new Pinecone({
      apiKey: config.apiKey,
      environment: config.environment
    });
  }
  
  async initialize() {
    // Check if index exists
    const indexes = await this.client.listIndexes();
    
    if (!indexes.includes(this.indexName)) {
      await this.client.createIndex({
        name: this.indexName,
        dimension: 1536,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-west-2'
          }
        }
      });
    }
    
    this.index = this.client.Index(this.indexName);
  }
  
  async upsert(documents: VectorDocument[]) {
    const vectors = documents.map(doc => ({
      id: doc.id,
      values: doc.embedding,
      metadata: {
        content: doc.content,
        ...doc.metadata,
        userId: doc.userId,
        type: doc.type
      }
    }));
    
    // Batch upsert for performance
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await this.index.upsert(batch);
    }
  }
  
  async search(
    embedding: number[],
    filter?: VectorFilter,
    limit: number = 10
  ): Promise<SearchResult[]> {
    const queryRequest: any = {
      vector: embedding,
      topK: limit,
      includeValues: false,
      includeMetadata: true
    };
    
    if (filter) {
      queryRequest.filter = this.buildFilter(filter);
    }
    
    const response = await this.index.query(queryRequest);
    
    return response.matches.map(match => ({
      id: match.id,
      score: match.score,
      content: match.metadata.content,
      metadata: match.metadata
    }));
  }
  
  private buildFilter(filter: VectorFilter) {
    const conditions: any = {};
    
    if (filter.userId) {
      conditions.userId = { $eq: filter.userId };
    }
    
    if (filter.type) {
      conditions.type = { $eq: filter.type };
    }
    
    if (filter.tags && filter.tags.length > 0) {
      conditions.tags = { $in: filter.tags };
    }
    
    return Object.keys(conditions).length > 0 ? conditions : undefined;
  }
}

// 3. Vector store abstraction
// apps/web/src/lib/vector/vector-store.ts
export class VectorStore {
  private provider: QdrantVectorStore | PineconeVectorStore;
  
  constructor(config: VectorStoreConfig) {
    switch (config.provider) {
      case 'qdrant':
        this.provider = new QdrantVectorStore(config.qdrant);
        break;
      case 'pinecone':
        this.provider = new PineconeVectorStore(config.pinecone);
        break;
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
  
  async initialize() {
    await this.provider.initialize();
  }
  
  async addDocuments(documents: Document[]) {
    // Generate embeddings
    const embeddings = await this.generateEmbeddings(
      documents.map(d => d.content)
    );
    
    // Create vector documents
    const vectorDocs = documents.map((doc, i) => ({
      id: doc.id || crypto.randomUUID(),
      content: doc.content,
      embedding: embeddings[i],
      metadata: doc.metadata,
      userId: doc.userId,
      type: doc.type
    }));
    
    await this.provider.upsert(vectorDocs);
  }
  
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    // Generate query embedding
    const embedding = await this.generateEmbedding(query);
    
    // Search
    return this.provider.search(
      embedding,
      options?.filter,
      options?.limit || 10
    );
  }
  
  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts })
    });
    
    const data = await response.json();
    return data.embeddings;
  }
  
  private async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }
}
```

**Testing Requirements**:
- Test vector store operations
- Verify embedding generation
- Test search accuracy
- Performance benchmarks

**Time Estimate**: 1 week

---

### 2.6 RAG System Implementation (0% → 100%)

**Current State**: No RAG implementation  
**Missing**: Complete retrieval-augmented generation

**Proof of Incompletion**:
- No document chunking strategy
- No retrieval pipeline
- No context augmentation

**Implementation Plan**:
```typescript
// 1. Document chunking
// apps/web/src/lib/rag/chunker.ts
export class DocumentChunker {
  private chunkSize: number = 1000;
  private chunkOverlap: number = 200;
  
  chunkDocument(document: string): Chunk[] {
    const sentences = this.splitIntoSentences(document);
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let chunkStart = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const tokens = this.countTokens(sentence);
      
      if (currentTokens + tokens > this.chunkSize) {
        // Save current chunk
        chunks.push({
          content: currentChunk.trim(),
          startIndex: chunkStart,
          endIndex: i - 1,
          tokens: currentTokens
        });
        
        // Start new chunk with overlap
        const overlapSentences = this.getOverlapSentences(
          sentences,
          i - 1,
          this.chunkOverlap
        );
        
        currentChunk = overlapSentences + sentence;
        currentTokens = this.countTokens(currentChunk);
        chunkStart = i;
      } else {
        currentChunk += ' ' + sentence;
        currentTokens += tokens;
      }
    }
    
    // Add last chunk
    if (currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        startIndex: chunkStart,
        endIndex: sentences.length - 1,
        tokens: currentTokens
      });
    }
    
    return chunks;
  }
  
  private splitIntoSentences(text: string): string[] {
    // Use NLP library for better sentence splitting
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }
  
  private countTokens(text: string): number {
    // Approximate token count (more accurate would use tiktoken)
    return Math.ceil(text.length / 4);
  }
  
  private getOverlapSentences(
    sentences: string[],
    endIndex: number,
    targetTokens: number
  ): string {
    let overlap = '';
    let tokens = 0;
    
    for (let i = endIndex; i >= 0 && tokens < targetTokens; i--) {
      const sentence = sentences[i];
      tokens += this.countTokens(sentence);
      overlap = sentence + ' ' + overlap;
    }
    
    return overlap;
  }
}

// 2. Retrieval pipeline
// apps/web/src/lib/rag/retriever.ts
export class RAGRetriever {
  constructor(
    private vectorStore: VectorStore,
    private reranker: Reranker
  ) {}
  
  async retrieve(
    query: string,
    options: RetrievalOptions
  ): Promise<RetrievalResult> {
    // Step 1: Initial retrieval
    const initialResults = await this.vectorStore.search(query, {
      limit: options.topK * 3, // Over-retrieve for reranking
      filter: options.filter
    });
    
    // Step 2: Rerank results
    const rerankedResults = await this.reranker.rerank(
      query,
      initialResults,
      options.topK
    );
    
    // Step 3: Expand context
    const expandedResults = await this.expandContext(
      rerankedResults,
      options.contextWindow
    );
    
    // Step 4: Deduplicate
    const deduplicatedResults = this.deduplicate(expandedResults);
    
    return {
      documents: deduplicatedResults,
      metadata: {
        query,
        retrievalTime: Date.now(),
        documentsRetrieved: initialResults.length,
        documentsAfterReranking: rerankedResults.length,
        finalDocuments: deduplicatedResults.length
      }
    };
  }
  
  private async expandContext(
    results: SearchResult[],
    contextWindow: number
  ): Promise<SearchResult[]> {
    const expanded: SearchResult[] = [];
    
    for (const result of results) {
      // Get surrounding chunks
      const surroundingChunks = await this.getSurroundingChunks(
        result.id,
        contextWindow
      );
      
      expanded.push({
        ...result,
        content: this.mergeChunks([
          surroundingChunks.before,
          result.content,
          surroundingChunks.after
        ])
      });
    }
    
    return expanded;
  }
  
  private deduplicate(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const deduplicated: SearchResult[] = [];
    
    for (const result of results) {
      const hash = this.hashContent(result.content);
      if (!seen.has(hash)) {
        seen.add(hash);
        deduplicated.push(result);
      }
    }
    
    return deduplicated;
  }
}

// 3. Context augmentation
// apps/web/src/lib/rag/augmenter.ts
export class ContextAugmenter {
  augmentPrompt(
    userQuery: string,
    retrievedDocs: SearchResult[],
    options: AugmentationOptions
  ): string {
    // Build context section
    const context = this.buildContext(retrievedDocs, options);
    
    // Create augmented prompt
    const augmentedPrompt = `
You are a helpful AI assistant. Use the following context to answer the user's question.
If the context doesn't contain relevant information, say so and provide the best answer you can based on your general knowledge.

Context:
${context}

User Question: ${userQuery}

Instructions:
1. Answer based primarily on the provided context
2. Cite sources when possible using [Source N] notation
3. Be concise but thorough
4. If the context is insufficient, clearly state this

Answer:`;
    
    return augmentedPrompt;
  }
  
  private buildContext(
    docs: SearchResult[],
    options: AugmentationOptions
  ): string {
    let context = '';
    let currentTokens = 0;
    
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const docTokens = this.countTokens(doc.content);
      
      if (currentTokens + docTokens > options.maxContextTokens) {
        // Truncate if necessary
        const remainingTokens = options.maxContextTokens - currentTokens;
        const truncated = this.truncateToTokens(doc.content, remainingTokens);
        context += `\n\n[Source ${i + 1}]:\n${truncated}`;
        break;
      }
      
      context += `\n\n[Source ${i + 1}]:\n${doc.content}`;
      currentTokens += docTokens;
      
      // Add metadata if relevant
      if (doc.metadata?.title) {
        context += `\n(From: ${doc.metadata.title})`;
      }
    }
    
    return context.trim();
  }
  
  private countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
  
  private truncateToTokens(text: string, maxTokens: number): string {
    const approximateChars = maxTokens * 4;
    if (text.length <= approximateChars) return text;
    
    return text.slice(0, approximateChars) + '... [truncated]';
  }
}
```

**Testing Requirements**:
- Test chunking strategies
- Verify retrieval accuracy
- Test context augmentation
- Measure RAG performance

**Time Estimate**: 1 week

---

## 3. Authentication & Security

### 3.1 Convex Auth Integration (95% → 100%)

**Current State**: Basic auth working  
**Missing**: Token refresh, session validation, auth middleware

**Proof of Incompletion**:
- No automatic token refresh
- Missing session validation
- Incomplete auth middleware

**Implementation Plan**:
```typescript
// 1. Token refresh mechanism
// packages/backend/convex/auth/tokenRefresh.ts
export const refreshToken = mutation({
  args: {
    refreshToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate refresh token
    const tokenData = await ctx.db
      .query('refreshTokens')
      .withIndex('by_token', (q) => q.eq('token', args.refreshToken))
      .first();
    
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      throw new Error('Invalid or expired refresh token');
    }
    
    // Get user
    const user = await ctx.db.get(tokenData.userId);
    if (!user) throw new Error('User not found');
    
    // Generate new tokens
    const accessToken = await generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken();
    
    // Save new refresh token
    await ctx.db.patch(tokenData._id, {
      token: newRefreshToken,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      lastUsed: Date.now(),
    });
    
    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600, // 1 hour
    };
  },
});

// 2. Session validation
// packages/backend/convex/auth/sessionValidator.ts
export const validateSession = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_id', (q) => q.eq('sessionId', args.sessionId))
      .first();
    
    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }
    
    // Check expiration
    if (session.expiresAt < Date.now()) {
      await ctx.db.delete(session._id);
      return { valid: false, reason: 'Session expired' };
    }
    
    // Check for suspicious activity
    const recentActivity = await ctx.db
      .query('sessionActivity')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect();
    
    const suspicious = this.detectSuspiciousActivity(recentActivity);
    if (suspicious) {
      await ctx.db.patch(session._id, { 
        status: 'suspended',
        suspendedReason: suspicious.reason 
      });
      return { valid: false, reason: 'Suspicious activity detected' };
    }
    
    // Update last activity
    await ctx.db.patch(session._id, {
      lastActivity: Date.now(),
    });
    
    return {
      valid: true,
      userId: session.userId,
      permissions: session.permissions,
    };
  },
});

// 3. Complete auth middleware
// apps/web/src/middleware/auth.ts
export async function authMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json(
      { error: 'No authentication token provided' },
      { status: 401 }
    );
  }
  
  try {
    // Verify token
    const payload = await verifyAccessToken(token);
    
    // Validate session
    const session = await validateSession(payload.sessionId);
    if (!session.valid) {
      return NextResponse.json(
        { error: session.reason },
        { status: 401 }
      );
    }
    
    // Check permissions for route
    const requiredPermission = getRequiredPermission(request.nextUrl.pathname);
    if (requiredPermission && !session.permissions.includes(requiredPermission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Add user context to request
    const requestWithAuth = new NextRequest(request);
    requestWithAuth.headers.set('x-user-id', session.userId);
    requestWithAuth.headers.set('x-session-id', payload.sessionId);
    requestWithAuth.headers.set('x-permissions', session.permissions.join(','));
    
    return NextResponse.next({
      request: requestWithAuth,
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Invalid authentication token' },
      { status: 401 }
    );
  }
}
```

**Testing Requirements**:
- Test token refresh flow
- Verify session validation
- Test middleware on all routes
- Security penetration testing

**Time Estimate**: 3 days

---

### 3.2 Role-Based Access Control (60% → 100%)

**Current State**: Basic roles defined  
**Missing**: Permission system, role hierarchy, dynamic permissions

**Proof of Incompletion**:
- No permission checking in API routes
- Missing role inheritance
- No dynamic permission assignment

**Implementation Plan**:
```typescript
// 1. Permission system
// packages/backend/convex/rbac/permissions.ts
export const PERMISSIONS = {
  // User permissions
  'user:read': 'Read user data',
  'user:write': 'Modify user data',
  'user:delete': 'Delete users',
  
  // Chat permissions
  'chat:read': 'Read chats',
  'chat:write': 'Create/modify chats',
  'chat:delete': 'Delete chats',
  'chat:read:all': 'Read all users chats',
  
  // Admin permissions
  'admin:access': 'Access admin panel',
  'admin:users': 'Manage users',
  'admin:billing': 'Manage billing',
  'admin:system': 'System configuration',
  
  // API permissions
  'api:read': 'Read API data',
  'api:write': 'Write API data',
  'api:admin': 'Admin API access',
} as const;

export const ROLES = {
  user: {
    name: 'User',
    permissions: [
      'user:read',
      'chat:read',
      'chat:write',
      'api:read',
    ],
  },
  pro: {
    name: 'Pro User',
    inherits: ['user'],
    permissions: [
      'api:write',
      'chat:delete',
    ],
  },
  moderator: {
    name: 'Moderator',
    inherits: ['pro'],
    permissions: [
      'chat:read:all',
      'user:write',
    ],
  },
  admin: {
    name: 'Administrator',
    inherits: ['moderator'],
    permissions: [
      'admin:access',
      'admin:users',
      'admin:billing',
      'user:delete',
    ],
  },
  superAdmin: {
    name: 'Super Administrator',
    inherits: ['admin'],
    permissions: [
      'admin:system',
      'api:admin',
    ],
  },
} as const;

// 2. Permission checking
// packages/backend/convex/rbac/checker.ts
export class PermissionChecker {
  private userPermissions: Set<string>;
  
  constructor(userRole: string, customPermissions?: string[]) {
    this.userPermissions = this.buildPermissionSet(userRole, customPermissions);
  }
  
  private buildPermissionSet(
    roleName: string,
    customPermissions: string[] = []
  ): Set<string> {
    const permissions = new Set<string>(customPermissions);
    
    const addRolePermissions = (role: string) => {
      const roleConfig = ROLES[role];
      if (!roleConfig) return;
      
      // Add role's own permissions
      roleConfig.permissions.forEach(p => permissions.add(p));
      
      // Add inherited permissions
      if (roleConfig.inherits) {
        roleConfig.inherits.forEach(addRolePermissions);
      }
    };
    
    addRolePermissions(roleName);
    return permissions;
  }
  
  hasPermission(permission: string): boolean {
    // Check exact permission
    if (this.userPermissions.has(permission)) return true;
    
    // Check wildcard permissions
    const parts = permission.split(':');
    for (let i = parts.length - 1; i > 0; i--) {
      const wildcard = parts.slice(0, i).join(':') + ':*';
      if (this.userPermissions.has(wildcard)) return true;
    }
    
    return false;
  }
  
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }
  
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }
}

// 3. Dynamic permission assignment
// packages/backend/convex/rbac/dynamic.ts
export const grantPermission = mutation({
  args: {
    userId: v.id('users'),
    permission: v.string(),
    expiresAt: v.optional(v.number()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if granter has permission to grant
    const granter = await getCurrentUser(ctx);
    if (!granter) throw new Error('Not authenticated');
    
    const checker = new PermissionChecker(granter.role);
    if (!checker.hasPermission('admin:users')) {
      throw new Error('Insufficient permissions to grant permissions');
    }
    
    // Grant permission
    await ctx.db.insert('userPermissions', {
      userId: args.userId,
      permission: args.permission,
      grantedBy: granter._id,
      grantedAt: Date.now(),
      expiresAt: args.expiresAt,
      reason: args.reason,
      active: true,
    });
    
    // Log the action
    await ctx.db.insert('auditLog', {
      action: 'permission_granted',
      actor: granter._id,
      target: args.userId,
      details: {
        permission: args.permission,
        reason: args.reason,
      },
      timestamp: Date.now(),
    });
  },
});

// 4. API route protection
// apps/web/src/lib/rbac/protect.ts
export function requirePermission(permission: string | string[]) {
  return async function (
    request: NextRequest,
    context: any
  ): Promise<NextResponse> {
    const userId = request.headers.get('x-user-id');
    const userPermissions = request.headers.get('x-permissions')?.split(',') || [];
    
    const checker = new PermissionChecker('user', userPermissions);
    
    const required = Array.isArray(permission) ? permission : [permission];
    if (!checker.hasAllPermissions(required)) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          required,
          message: `This action requires: ${required.join(', ')}`,
        },
        { status: 403 }
      );
    }
    
    return context.handler(request, context);
  };
}
```

**Testing Requirements**:
- Test permission inheritance
- Verify permission checking
- Test dynamic permissions
- Audit permission usage

**Time Estimate**: 4 days

---

### 3.3 Admin Dashboard (40% → 100%)

**Current State**: Basic UI exists  
**Missing**: Full functionality, analytics, user management

**Proof of Incompletion**:
- Limited admin features
- No analytics dashboard
- Missing user management tools

**Implementation Plan**:
```typescript
// 1. Enhanced admin dashboard
// apps/web/src/app/(app)/admin/dashboard/page.tsx
export default function AdminDashboard() {
  const stats = useQuery(api.admin.getStats);
  const realtimeMetrics = useSubscription(api.admin.realtimeMetrics);
  
  return (
    <div className="admin-dashboard">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={stats?.totalUsers}
          change={stats?.userGrowth}
          icon={<Users />}
        />
        <MetricCard
          title="Active Sessions"
          value={realtimeMetrics?.activeSessions}
          live
          icon={<Activity />}
        />
        <MetricCard
          title="Revenue (30d)"
          value={`$${stats?.monthlyRevenue}`}
          change={stats?.revenueGrowth}
          icon={<DollarSign />}
        />
        <MetricCard
          title="API Calls"
          value={stats?.apiCalls}
          change={stats?.apiGrowth}
          icon={<Zap />}
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <UsageChart data={stats?.usageData} />
        <RevenueChart data={stats?.revenueData} />
      </div>
      
      {/* Real-time Activity */}
      <RealtimeActivity events={realtimeMetrics?.events} />
      
      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}

// 2. User management interface
// apps/web/src/app/(app)/admin/users/page.tsx
export default function UserManagement() {
  const [filters, setFilters] = useState<UserFilters>({});
  const users = useQuery(api.admin.getUsers, filters);
  
  return (
    <div className="user-management">
      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <SearchInput
          placeholder="Search users..."
          onChange={(search) => setFilters({ ...filters, search })}
        />
        <Select
          options={['all', 'active', 'suspended', 'deleted']}
          value={filters.status}
          onChange={(status) => setFilters({ ...filters, status })}
        />
        <Select
          options={['all', 'free', 'pro', 'pro_plus']}
          value={filters.tier}
          onChange={(tier) => setFilters({ ...filters, tier })}
        />
      </div>
      
      {/* Users Table */}
      <DataTable
        columns={[
          { key: 'avatar', label: '', render: (user) => <Avatar src={user.avatar} /> },
          { key: 'displayName', label: 'Name' },
          { key: 'walletAddress', label: 'Wallet' },
          { key: 'subscription.tier', label: 'Tier' },
          { key: 'createdAt', label: 'Joined', render: (user) => formatDate(user.createdAt) },
          { key: 'lastActiveAt', label: 'Last Active', render: (user) => formatRelative(user.lastActiveAt) },
          {
            key: 'actions',
            label: '',
            render: (user) => <UserActions user={user} />
          },
        ]}
        data={users}
        onRowClick={(user) => router.push(`/admin/users/${user._id}`)}
      />
    </div>
  );
}

// 3. Analytics dashboard
// apps/web/src/components/admin/analytics-dashboard.tsx
export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  
  const analytics = useQuery(api.admin.getAnalytics, dateRange);
  
  return (
    <div className="analytics-dashboard">
      {/* Date Range Selector */}
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        presets={[
          { label: 'Last 7 days', days: 7 },
          { label: 'Last 30 days', days: 30 },
          { label: 'Last 90 days', days: 90 },
        ]}
      />
      
      {/* KPI Grid */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <KPICard
          title="Conversion Rate"
          value={`${analytics?.conversionRate}%`}
          target={5}
          chart={<MiniChart data={analytics?.conversionTrend} />}
        />
        <KPICard
          title="ARPU"
          value={`$${analytics?.arpu}`}
          target={50}
          chart={<MiniChart data={analytics?.arpuTrend} />}
        />
        <KPICard
          title="Churn Rate"
          value={`${analytics?.churnRate}%`}
          target={2}
          inverse
          chart={<MiniChart data={analytics?.churnTrend} />}
        />
      </div>
      
      {/* Detailed Analytics */}
      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage">
          <UsageAnalytics data={analytics?.usage} />
        </TabsContent>
        
        <TabsContent value="revenue">
          <RevenueAnalytics data={analytics?.revenue} />
        </TabsContent>
        
        <TabsContent value="engagement">
          <EngagementAnalytics data={analytics?.engagement} />
        </TabsContent>
        
        <TabsContent value="retention">
          <RetentionAnalytics data={analytics?.retention} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Testing Requirements**:
- Test admin functionality
- Verify data accuracy
- Test real-time updates
- Performance testing

**Time Estimate**: 5 days

---

## 4. Subscription & Payment System

### 4.1 Invoice Generation (10% → 100%)

**Current State**: Schema exists  
**Missing**: Complete invoice generation system

**Proof of Incompletion**:
- No invoice generation logic
- Missing PDF generation
- No email delivery

**Implementation Plan**:
```typescript
// 1. Invoice generation logic
// packages/backend/convex/invoices/generator.ts
export const generateInvoice = mutation({
  args: {
    userId: v.id('users'),
    subscriptionId: v.id('subscriptions'),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const subscription = await ctx.db.get(args.subscriptionId);
    
    if (!user || !subscription) {
      throw new Error('User or subscription not found');
    }
    
    // Calculate invoice items
    const items = await this.calculateInvoiceItems(
      ctx,
      args.userId,
      args.periodStart,
      args.periodEnd
    );
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.1; // 10% tax rate
    const total = subtotal + tax;
    
    // Create invoice
    const invoice = await ctx.db.insert('invoices', {
      subscriptionId: args.subscriptionId,
      walletAddress: user.walletAddress,
      invoiceNumber: await this.generateInvoiceNumber(ctx),
      amount: total,
      currency: 'USD',
      status: 'draft',
      dueDate: args.periodEnd + 7 * 24 * 60 * 60 * 1000, // 7 days
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      items,
      tax,
      subtotal,
      metadata: {
        userName: user.displayName,
        userEmail: user.email,
        tier: subscription.plan.name,
      },
      createdAt: Date.now(),
    });
    
    return invoice;
  },
});

// 2. PDF generation
// apps/web/src/lib/invoices/pdf-generator.ts
import { jsPDF } from 'jspdf';

export class InvoicePDFGenerator {
  generate(invoice: Invoice): Uint8Array {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.text('INVOICE', 20, 20);
    
    // Company info
    doc.setFontSize(10);
    doc.text('ANUBIS Chat', 20, 30);
    doc.text('123 AI Street', 20, 35);
    doc.text('San Francisco, CA 94102', 20, 40);
    
    // Invoice details
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 120, 30);
    doc.text(`Date: ${formatDate(invoice.createdAt)}`, 120, 35);
    doc.text(`Due: ${formatDate(invoice.dueDate)}`, 120, 40);
    
    // Bill to
    doc.text('Bill To:', 20, 60);
    doc.setFontSize(10);
    doc.text(invoice.metadata.userName || 'Customer', 20, 65);
    doc.text(invoice.metadata.userEmail || '', 20, 70);
    doc.text(invoice.walletAddress, 20, 75);
    
    // Items table
    this.drawItemsTable(doc, invoice.items, 90);
    
    // Totals
    const y = 90 + (invoice.items.length * 10) + 20;
    doc.text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, 140, y);
    doc.text(`Tax: $${invoice.tax.toFixed(2)}`, 140, y + 5);
    doc.setFontSize(12);
    doc.text(`Total: $${invoice.amount.toFixed(2)}`, 140, y + 10);
    
    // Payment instructions
    doc.setFontSize(10);
    doc.text('Payment Instructions:', 20, y + 30);
    doc.text('Pay via Solana to: ' + COMPANY_WALLET_ADDRESS, 20, y + 35);
    doc.text('Reference: ' + invoice.invoiceNumber, 20, y + 40);
    
    return doc.output('arraybuffer');
  }
  
  private drawItemsTable(doc: jsPDF, items: InvoiceItem[], startY: number) {
    // Table headers
    doc.setFontSize(10);
    doc.text('Description', 20, startY);
    doc.text('Quantity', 100, startY);
    doc.text('Price', 130, startY);
    doc.text('Amount', 160, startY);
    
    // Draw line
    doc.line(20, startY + 2, 190, startY + 2);
    
    // Table items
    let y = startY + 7;
    for (const item of items) {
      doc.text(item.description, 20, y);
      doc.text(item.quantity.toString(), 100, y);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 130, y);
      doc.text(`$${item.amount.toFixed(2)}`, 160, y);
      y += 7;
    }
  }
}

// 3. Invoice delivery
// apps/web/src/lib/invoices/delivery.ts
export class InvoiceDelivery {
  async sendInvoice(invoice: Invoice, recipient: string) {
    // Generate PDF
    const pdfGenerator = new InvoicePDFGenerator();
    const pdfData = pdfGenerator.generate(invoice);
    
    // Upload to storage
    const pdfUrl = await this.uploadPDF(pdfData, invoice.invoiceNumber);
    
    // Send email
    await this.sendEmail({
      to: recipient,
      subject: `Invoice #${invoice.invoiceNumber} from ANUBIS Chat`,
      html: this.generateEmailHTML(invoice, pdfUrl),
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: Buffer.from(pdfData),
        },
      ],
    });
    
    // Update invoice status
    await this.updateInvoiceStatus(invoice._id, 'sent');
  }
  
  private generateEmailHTML(invoice: Invoice, pdfUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .invoice-header { background: #f5f5f5; padding: 20px; }
            .invoice-details { margin: 20px 0; }
            .items-table { width: 100%; border-collapse: collapse; }
            .items-table th, .items-table td { 
              padding: 10px; 
              border-bottom: 1px solid #ddd; 
            }
            .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
            .cta-button {
              display: inline-block;
              padding: 12px 24px;
              background: #6366f1;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <h1>Invoice #${invoice.invoiceNumber}</h1>
            <p>Date: ${formatDate(invoice.createdAt)}</p>
            <p>Due: ${formatDate(invoice.dueDate)}</p>
          </div>
          
          <div class="invoice-details">
            <h2>Invoice Details</h2>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.unitPrice.toFixed(2)}</td>
                    <td>$${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <p>Subtotal: $${invoice.subtotal.toFixed(2)}</p>
            <p>Tax: $${invoice.tax.toFixed(2)}</p>
            <p class="total">Total: $${invoice.amount.toFixed(2)}</p>
          </div>
          
          <a href="${pdfUrl}" class="cta-button">Download PDF</a>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p>Payment Instructions:</p>
            <p>Send ${invoice.amount} USD worth of SOL to:</p>
            <p><code>${COMPANY_WALLET_ADDRESS}</code></p>
            <p>Reference: ${invoice.invoiceNumber}</p>
          </div>
        </body>
      </html>
    `;
  }
}
```

**Testing Requirements**:
- Test invoice generation
- Verify PDF output
- Test email delivery
- Validate calculations

**Time Estimate**: 4 days

---

### 4.2 Stripe Integration (0% → 100%)

**Current State**: No Stripe integration  
**Missing**: Complete fiat payment system

**Proof of Incompletion**:
- No Stripe SDK
- No payment intents
- No webhook handling

**Implementation Plan**:
```typescript
// 1. Stripe configuration
// apps/web/src/lib/stripe/client.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// 2. Payment intent creation
// apps/web/src/app/api/stripe/create-payment-intent/route.ts
export async function POST(request: Request) {
  const { amount, tier, userId } = await request.json();
  
  try {
    // Create or retrieve customer
    const customer = await getOrCreateStripeCustomer(userId);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      customer: customer.id,
      metadata: {
        userId,
        tier,
        type: 'subscription',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

// 3. Webhook handling
// apps/web/src/app/api/stripe/webhook/route.ts
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }
  
  // Handle events
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
      
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
      
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(event.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      await handleInvoicePayment(event.data.object);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  return NextResponse.json({ received: true });
}

// 4. Payment component
// apps/web/src/components/payment/stripe-payment-form.tsx
export function StripePaymentForm({ amount, tier }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;
    
    setProcessing(true);
    
    // Create payment intent
    const { clientSecret } = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, tier }),
    }).then(res => res.json());
    
    // Confirm payment
    const result = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
    });
    
    if (result.error) {
      setError(result.error.message);
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      
      {error && (
        <div className="alert alert-error mt-4">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn btn-primary w-full mt-4"
      >
        {processing ? 'Processing...' : `Pay $${amount}`}
      </button>
    </form>
  );
}
```

**Testing Requirements**:
- Test payment flow
- Verify webhook handling
- Test subscription management
- Security audit

**Time Estimate**: 5 days

---

## 5. Implementation Summary

### Total Features Requiring Completion: 109

### Time Estimates by Category:
1. **Core Platform**: 20 days
2. **AI & Language Model**: 35 days
3. **Authentication & Security**: 19 days
4. **Subscription & Payment**: 18 days
5. **Web3 & Blockchain**: 25 days
6. **Backend Infrastructure**: 22 days
7. **User Interface**: 18 days
8. **Testing & QA**: 30 days
9. **Documentation & DevOps**: 15 days

### Total Estimated Time: 202 developer-days

### Recommended Team Structure:
- **2 Senior Full-Stack Developers**: Focus on core platform and AI
- **1 Backend Specialist**: Handle infrastructure and security
- **1 Frontend Developer**: UI/UX improvements
- **1 DevOps Engineer**: CI/CD, monitoring, deployment
- **1 QA Engineer**: Testing and quality assurance

### With Parallel Development:
- **Optimistic Timeline**: 12-14 weeks
- **Realistic Timeline**: 16-18 weeks
- **Conservative Timeline**: 20-22 weeks

## Next Steps

1. **Prioritize P1 Features**: Start with blocking features
2. **Set Up Development Environment**: Ensure all developers have proper access
3. **Create Feature Branches**: One branch per major feature
4. **Implement Daily Standups**: Track progress and blockers
5. **Weekly Integration Tests**: Ensure features work together
6. **Bi-weekly Demos**: Show progress to stakeholders

This plan provides the complete roadmap to achieve 100% feature completion for the ANUBIS Chat platform.