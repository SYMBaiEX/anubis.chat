# =============================================================================
# STAGE 1: Dependencies - Install and cache workspace dependencies
# =============================================================================
FROM oven/bun:1.2.18-alpine AS deps

# Install dependencies for node-gyp and other native modules
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

WORKDIR /app

# Copy package files for dependency installation
COPY package.json bun.lockb ./
COPY apps/web/package.json ./apps/web/
COPY packages/backend/package.json ./packages/backend/
COPY turbo.json ./

# Install dependencies with frozen lockfile for reproducibility
RUN bun install --frozen-lockfile

# =============================================================================
# STAGE 2: Builder - Build the Next.js application
# =============================================================================
FROM oven/bun:1.2.18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/backend/node_modules ./packages/backend/node_modules

# Copy all source files
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN bun run build

# =============================================================================
# STAGE 3: Runner - Production runtime with minimal footprint
# =============================================================================
FROM oven/bun:1.2.18-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
# The standalone folder contains a minimal server with only necessary files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Create data directory for any runtime data
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Environment variables for runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun --eval "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the server using bun
CMD ["bun", "apps/web/server.js"]