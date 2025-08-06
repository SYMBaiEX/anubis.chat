# ISIS Chat

A next-generation AI chat platform combining advanced RAG (Retrieval-Augmented Generation) capabilities with Solana Web3 integration. ISIS Chat enables users to upload documents, create intelligent chatbots, and interact with multiple AI models through a secure, wallet-based authentication system.

## 🚀 Key Features

### AI & Chat
- **Multi-Model AI Support** - Integration with Claude 3.5, GPT-4o, DeepSeek v3, and Gemini 2.0
- **Document RAG System** - Upload and query documents with semantic search
- **Real-time Chat** - Streaming responses with conversation memory
- **Context-Aware Responses** - AI leverages uploaded documents for enhanced answers

### Web3 Integration
- **Solana Wallet Authentication** - Secure login with Phantom, Solflare, and other wallets
- **Signature-Based Security** - Cryptographic wallet signature verification
- **Smart Contract Ready** - Built for future Anchor framework integration

### Platform Architecture
- **TypeScript-First** - Strict type safety across frontend and backend
- **Next.js 15 App Router** - Modern React with Server Components
- **Convex Backend** - Real-time, reactive database with edge functions
- **Progressive Web App** - Mobile-optimized with offline capabilities
- **Enterprise Security** - JWT tokens, rate limiting, and input validation

### Document Management
- **Multi-Format Support** - Text, Markdown, PDF, and URL ingestion
- **Semantic Search** - Vector-based document retrieval
- **Chunking & Embedding** - Optimized for RAG performance
- **User Isolation** - Secure per-wallet document storage

## 🛠 Tech Stack

### Frontend
- **Next.js 15** with App Router and React 19
- **TypeScript** with strict mode enabled
- **Tailwind CSS 4** with Shadcn UI components
- **Tanstack Form** with Zod validation
- **Progressive Web App** support

### Backend
- **Convex** - Real-time backend-as-a-service
- **Edge Functions** - Serverless query/mutation functions
- **Real-time Database** - Reactive data synchronization
- **Full-text Search** - Built-in document search indexes

### Security & Auth
- **Wallet Authentication** - Solana signature verification
- **JWT Tokens** with blacklisting support
- **Rate Limiting** - Request throttling and abuse prevention
- **Input Validation** - Zod schemas with ReDoS protection

### Development
- **Turborepo** - Optimized monorepo orchestration
- **Bun** - Fast package manager and runtime
- **Biome** - Code formatting and linting
- **Husky** - Git hooks for code quality

## 🚦 Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.2.18 or later
- [Solana Wallet](https://phantom.app) (Phantom recommended)
- [Convex Account](https://convex.dev) for backend services

### Installation

1. **Clone and install dependencies**
```bash
git clone https://github.com/your-username/isis-chat.git
cd isis-chat
bun install
```

2. **Set up Convex backend**
```bash
bun dev:setup
```
Follow the prompts to create a new Convex project and connect it to your application.

3. **Configure environment variables**
```bash
# apps/web/.env.local
JWT_SECRET=your-super-secret-jwt-key
ALLOWED_ORIGINS=http://localhost:3001

# Convex configuration is handled automatically
```

4. **Start development server**
```bash
bun dev
```

Open [http://localhost:3001](http://localhost:3001) to see the application.

### Quick Commands

```bash
# Development
bun dev                    # Start all services
bun dev:web               # Frontend only
bun dev:server            # Convex backend only

# Code Quality
bun check                 # Format and lint
bun check-types           # TypeScript validation
bun build                 # Production build

# PWA
cd apps/web && bun generate-pwa-assets  # Generate PWA icons
```

## 📁 Project Structure

```
isis-chat/
├── apps/
│   └── web/                    # Next.js frontend application
│       ├── src/
│       │   ├── app/            # App Router pages and API routes
│       │   ├── components/     # React components and UI
│       │   └── lib/            # Utilities, types, and middleware
│       └── public/             # Static assets and PWA files
├── packages/
│   └── backend/                # Convex backend
│       └── convex/             # Database schema and functions
│           ├── schema.ts       # Database schema definition
│           ├── users.ts        # User management functions
│           ├── documents.ts    # Document CRUD operations
│           ├── chats.ts        # Chat conversation functions
│           └── auth.ts         # Authentication utilities
└── turbo.json                  # Turborepo configuration
```

## 🔧 API Reference

### Authentication Endpoints

```typescript
POST /api/auth/challenge        # Get wallet challenge nonce
POST /api/auth/verify          # Verify wallet signature
POST /api/auth/logout          # Blacklist JWT token
GET  /api/auth/me              # Get user profile
```

### Document Management

```typescript
GET    /api/documents          # List user documents
POST   /api/documents          # Upload new document
GET    /api/documents/[id]     # Get specific document
PUT    /api/documents/[id]     # Update document
DELETE /api/documents/[id]     # Delete document
```

### Search & RAG

```typescript
GET  /api/search               # Keyword-based document search
POST /api/search/semantic      # Semantic RAG search for AI context
```

### Chat System

```typescript
GET    /api/chats              # List user conversations
POST   /api/chats              # Create new chat
GET    /api/chats/[id]         # Get conversation
POST   /api/chats/[id]/message # Send message (streaming)
```

## 🔐 Security Features

### Wallet Authentication
- **Nonce-based challenges** - Prevents replay attacks
- **Signature verification** - Using NaCl/TweetNaCl cryptography  
- **JWT with blacklisting** - Secure logout and session management
- **Rate limiting** - Per-wallet request throttling

### Input Validation
- **Zod schemas** - Runtime type checking on all inputs
- **ReDoS protection** - Regular expression denial-of-service prevention
- **XSS prevention** - Content sanitization and escaping
- **CORS configuration** - Web3-compatible cross-origin headers

### Data Protection
- **User isolation** - Documents scoped to wallet addresses
- **Access control** - Owner verification on all operations
- **Audit logging** - Request tracking and error monitoring

## 🚀 Deployment

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret-256-bit-key
ALLOWED_ORIGINS=https://your-domain.com
```

### Build & Deploy

```bash
# Build for production
bun build

# Deploy Convex backend
cd packages/backend
npx convex deploy

# Deploy frontend (Vercel, Netlify, etc.)
cd apps/web
vercel deploy
```

## 🛡️ Security Considerations

- **Never commit secrets** - Use environment variables
- **Rotate JWT secrets** - Regular key rotation in production
- **Monitor rate limits** - Adjust based on usage patterns  
- **Update dependencies** - Regular security updates
- **Audit wallet integrations** - Verify signature implementations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper tests
4. Run quality checks: `bun check && bun check-types`
5. Commit with clear messages: `git commit -m 'Add amazing feature'`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) for the initial project template
- [Convex](https://convex.dev) for the real-time backend platform
- [Solana](https://solana.com) for Web3 infrastructure
- [Shadcn UI](https://ui.shadcn.com) for beautiful component library
