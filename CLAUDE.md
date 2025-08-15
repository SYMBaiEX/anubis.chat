# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

```bash
# Install dependencies (using Bun package manager)
bun install

# Development - starts all services
bun dev                    # Runs turbo dev (all apps)
bun dev:web               # Frontend only on port 3001
bun dev:server            # Backend Convex server only
bun dev:setup             # Initial Convex setup

# Code quality
bun check                 # Biome format and lint
npx ultracite format      # Format staged files (runs on pre-commit)

# Build
bun build                 # Build all apps
bun check-types           # TypeScript validation across monorepo

# Testing
# No test commands configured yet - tests would typically be:
# bun test                # Would run tests if configured
# bun test:watch          # Would run tests in watch mode
```

### Convex Backend Commands

```bash
cd packages/backend
bun dev                   # Start Convex dev server
bun dev:setup            # Configure Convex project
```

### Frontend Specific

```bash
cd apps/web
bun dev                   # Start Next.js dev server on port 3001
bun build                 # Build production bundle
bun generate-pwa-assets   # Generate PWA icons and manifest
```

## Platform Architecture Overview

### ANUBIS Chat Platform Vision

**Mission**: "Democratize advanced AI capabilities while empowering users through decentralized Web3 technologies and economic models."

ANUBIS Chat is the next-generation AI-powered chat platform that bridges traditional AI interaction with decentralized Web3 capabilities. The platform combines cutting-edge multi-model AI excellence with Web3-native experiences for real-time collaboration.

### Core Technology Stack

**Frontend Architecture**:
- **Framework**: Next.js 15 with App Router and React 19
- **Styling**: Tailwind CSS v4 with Shadcn UI components  
- **State Management**: Convex reactive queries and mutations
- **Progressive Web App**: Offline support with service workers
- **Performance**: <3s load on 3G, <100ms interactions, <500KB bundles

**Backend & Real-Time**:
- **Platform**: Convex serverless backend with built-in reactivity
- **Schema**: 80+ tables covering users, chats, messages, agents, workflows
- **Real-Time**: Automatic subscriptions and live data synchronization
- **Streaming**: HTTP actions for AI model streaming responses

**AI & ML Pipeline**:
- **Multi-Model Support**: Claude 3.5, GPT-4o, DeepSeek v3, Gemini 2.0
- **Intelligent Routing**: Context-aware model selection with performance optimization
- **RAG System**: Vector embeddings with semantic search and document ingestion
- **Streaming**: <2s time-to-first-token, <50ms inter-token latency

**Web3 & Blockchain**:
- **Primary Chain**: Solana with Mobile Wallet Adapter Protocol integration
- **Wallets**: Multi-wallet support (Phantom, Backpack, Solflare)
- **Token Economics**: $ANUBIS utility token with DeFi ecosystem
- **Authentication**: Signature-based auth with challenge/nonce verification

### Monorepo Architecture

**Turborepo Structure**:
- **apps/web**: Next.js 15 frontend with App Router, React 19, TypeScript
- **packages/backend**: Convex backend-as-a-service for real-time data
- **apps/fumadocs**: Documentation site (Next.js + Fumadocs)

**Key Architectural Patterns**:
- Server Components by default for data fetching
- Client Components only for interactivity with 'use client' directive
- Component composition in `src/components/` with UI primitives
- Provider orchestration in `src/components/providers.tsx`
- Schema-driven development with strict TypeScript typing

### Database Schema Highlights

The Convex schema includes comprehensive tables for:
- **Core Chat**: users, chats, messages, documents with per-wallet isolation
- **AI System**: models, agents, workflows, rag operations, embeddings
- **Web3**: wallets, transactions, subscriptions, payments, referrals
- **Analytics**: events, metrics, performance tracking, user behavior
- **Enterprise**: organizations, teams, permissions, audit logs

## Critical Development Standards

### TypeScript Excellence

```typescript
// ✅ REQUIRED: Strict TypeScript with no any types
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
}

// ✅ REQUIRED: camelCase for all identifiers
const chatMessages: ChatMessage[] = [];

// ❌ FORBIDDEN: any types
const badData: any = {}; // Never do this

// ✅ PREFERRED: Result<T, E> pattern for error handling
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };
```

### Component Development Pattern

```tsx
// ✅ Server Component (default) - for data fetching
export default async function ChatPage() {
  // Server-side data fetching
  return <ChatInterface />;
}

// ✅ Client Component - for interactivity only
'use client';
export function ChatInterface() {
  // Interactive UI with hooks
  return <div>...</div>;
}
```

### Convex Integration Pattern

```tsx
// ✅ Query pattern
const messages = useQuery(api.messages.getByChat, { chatId });

// ✅ Mutation pattern  
const sendMessage = useMutation(api.messages.create);

// ✅ Schema-driven types
const message: Doc<"messages"> = {
  // Fully typed based on schema
};
```

## Performance Requirements

### Enterprise Performance Targets

**Frontend Performance**:
- Load Time: <3s on 3G networks, <1s on WiFi
- Bundle Size: <500KB initial, <2MB total application
- Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1
- Interaction Response: <100ms for all user interactions

**AI & ML Performance**:
- Time-to-First-Token: <2s for all AI models
- Streaming Latency: <50ms between tokens
- Vector Search: <100ms query time for 1M+ documents
- Model Switching: <500ms between different AI models

**Web3 Performance**:
- Wallet Connection: <500ms for connection/auth
- Transaction Status: <2s for confirmation updates
- On-Chain Queries: <200ms for balance/history

## Security & Web3 Integration

### Authentication Architecture

```typescript
// Solana wallet-based authentication with Convex Auth
const { isAuthenticated, userId } = useAuthToken();

// Signature-based security with nonce challenge
const signature = await wallet.signMessage(challengeMessage);
```

### Security Standards

- **Input Validation**: Zod schemas across all server boundaries
- **Access Control**: Per-wallet data isolation enforced in Convex functions
- **Web3 Security**: Signature verification, transaction validation
- **CORS**: Environment-configurable allowlist for origins
- **Rate Limiting**: Request throttling and abuse prevention

## Development Workflow

### Git Conventions

```bash
# Commit message format (enforced by tooling)
feat: New feature
fix: Bug fix
docs: Documentation
refactor: Code restructuring
test: Test updates
chore: Maintenance

# Pre-commit hooks run automatically:
# - Ultracite formatting
# - TypeScript type checking
```

## Solana Mobile Integration

### Mobile Wallet Adapter Protocol

The platform includes comprehensive Solana Mobile support:

```typescript
// Mobile Wallet Adapter integration
import { SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';

// Polyfills for web compatibility
import '@solana-mobile/wallet-adapter-mobile/lib/adapter';
```

**Key Components**:
- **WalletProvider**: Multi-wallet support with mobile detection
- **Mobile Polyfills**: Web compatibility for mobile wallet features
- **Deep Linking**: Native app integration with URL schemes
- **Transaction Handling**: Optimized mobile transaction flows

## File Organization Patterns

### Component Structure

```
src/components/
├── ui/                 # Shadcn UI primitives
├── chat/              # Chat interface components  
├── auth/              # Authentication flows
├── wallet/            # Web3 wallet integration
├── providers/         # Context providers
└── error-boundary/    # Error handling components
```

### Backend Organization

```
packages/backend/convex/
├── schema.ts          # Database schema definition
├── auth.ts           # Authentication functions
├── messages.ts       # Chat message operations
├── streaming.ts      # AI streaming responses
├── http.ts          # HTTP router endpoints
└── lib/             # Shared utilities
```

### Environment Configuration

**Frontend** (`apps/web/.env.local`):
```bash
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
OPENROUTER_API_KEY=...  # Multi-model AI access
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Backend** (Convex dashboard/CLI):
```bash
OPENROUTER_API_KEY=...
ALLOWED_ORIGINS=http://localhost:3001
RATE_LIMIT_MAX_REQUESTS=100
SOLANA_NETWORK=devnet
```

## Critical Integration Points

### Provider Orchestration

The app uses a sophisticated provider hierarchy:

```tsx
<ConvexErrorBoundary>
  <SidebarProvider>
    <ConvexAuthProvider>
      <ClientOnlyWrapper>
        <WalletProvider>           // Web3 wallet integration
          <AuthProvider>           // Authentication state
            <ThemeSync />          // Theme synchronization
            <NotificationProvider>
              <SolanaAgentProvider> // AI agent integration
                {children}
              </SolanaAgentProvider>
            </NotificationProvider>
          </AuthProvider>
        </WalletProvider>
      </ClientOnlyWrapper>
    </ConvexAuthProvider>
  </SidebarProvider>
</ConvexErrorBoundary>
```

### API Architecture

**Next.js API Routes** (frontend bridge):
```
POST /api/chat                   # Stream chat via AI SDK
POST /api/ai/chat                # Tool-enabled endpoints
GET  /api/models                 # Available model list
POST /api/subscriptions/payment  # Payment webhooks
```

**Convex HTTP Routes** (backend):
```
POST /stream-chat                # HTTP streaming fallback
POST /generateUploadUrl          # File upload URLs
POST /verify-payment             # Solana payment verification
```

## Business Logic & Token Economics

### Platform Roadmap

- **Phase 1**: Core AI chat with basic Web3 integration (Current)
- **Phase 2**: $ANUBIS token launch and DeFi features
- **Phase 3**: AI agent marketplace and ecosystem expansion
- **Phase 4**: Research partnerships and innovation lab

### Revenue Streams

- **Subscription Tiers**: Free, Pro, Enterprise with usage limits
- **Token Utility**: $ANUBIS for premium features and governance
- **Creator Economy**: Revenue sharing for AI agents and content
- **Enterprise Solutions**: Custom deployments and integrations

## Development Restrictions & Guidelines

### Critical Constraints

- **No any types**: Always use proper TypeScript types or create them
- **camelCase strictly**: All identifiers must use camelCase convention
- **No unnecessary files**: Don't create .md files unless explicitly requested
- **Edit over create**: Always prefer editing existing files
- **Auth boundaries**: Don't modify auth, convex config, or core APIs

### Quality Standards

- **Test Coverage**: 90%+ unit tests, 85%+ branch coverage
- **Accessibility**: WCAG 2.1 AA compliance minimum
- **Performance**: Core Web Vitals targets must be met
- **Security**: Zero-trust architecture with audit trails

## Technology References

### Key Dependencies

- **Runtime**: Bun 1.2.18 (package manager and runtime)
- **Framework**: Next.js 15 with React 19
- **Backend**: Convex 1.25.4 with built-in auth
- **Styling**: Tailwind CSS 4.1, Shadcn UI components
- **Forms**: Tanstack Form with Zod validation
- **Web3**: Solana Web3.js, Mobile Wallet Adapter
- **AI**: Vercel AI SDK with multi-provider support

### Development Tools

- **IDE**: Cursor with .cursor/rules integration
- **Quality**: Biome, Ultracite, Husky pre-commit hooks
- **Build**: Turborepo for monorepo orchestration
- **PWA**: Next.js PWA with offline capabilities

## Context from Cursor Rules

The platform follows comprehensive development rules located in:
- **Root rules** (`.cursor/rules/`): Platform architecture, AI integration, Web3 patterns
- **Web-specific rules** (`apps/web/.cursor/rules/`): Frontend optimization, PWA features

**Key Rule Highlights**:
- **Platform Vision**: Next-generation AI & Web3 platform with democratic access
- **Technical Excellence**: Enterprise-grade performance and security standards
- **Innovation Focus**: Cutting-edge AI-blockchain intersection technology
- **Developer Experience**: Comprehensive APIs, testing, and documentation

## Known Implementation Status

### Completed Features

- ✅ Basic Convex backend with 80+ table schema
- ✅ Next.js 15 frontend with React 19
- ✅ Solana Mobile Wallet Adapter integration
- ✅ Multi-model AI support with streaming
- ✅ PWA configuration with offline support
- ✅ Authentication system with wallet-based auth
- ✅ Theme switching and responsive design

### In Development

- 🚧 Advanced RAG system with vector search
- 🚧 $ANUBIS token economics and DeFi integration
- 🚧 AI agent marketplace and workflows
- 🚧 Enterprise analytics and monitoring
- 🚧 Comprehensive testing infrastructure

## Emergency Information

**Critical Files**:
- `packages/backend/convex/schema.ts`: Core database schema
- `apps/web/src/components/providers.tsx`: Provider orchestration
- `apps/web/src/app/layout.tsx`: Root application layout
- `.cursor/rules/`: Comprehensive development guidelines

**Performance Monitoring**:
- Core Web Vitals tracking enabled
- Real-time error boundary with structured logging
- Convex performance monitoring built-in

**Support Resources**:
- [Convex Documentation](https://docs.convex.dev)
- [Next.js 15 Guide](https://nextjs.org/docs)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Cursor Rules Documentation](https://cursor.com/docs)