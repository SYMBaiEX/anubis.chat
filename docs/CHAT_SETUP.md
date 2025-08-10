# ANUBIS Chat System Setup Guide

## Overview

ANUBIS Chat uses Convex for real-time messaging with AI streaming capabilities. The system supports multiple AI models (OpenAI, Anthropic, Google) with real-time typing indicators and optimistic updates.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js   │────▶│ Convex HTTP  │────▶│  AI Models   │
│   Frontend  │     │   Actions    │     │   (Stream)   │
└─────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Convex    │     │   Convex     │     │   Response   │
│   Queries   │     │  Mutations   │     │   Saved      │
└─────────────┘     └──────────────┘     └──────────────┘
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Install all dependencies
bun install

# Install backend dependencies
cd packages/backend
bun install
```

### 2. Configure Environment Variables

#### For Convex Backend

Set these environment variables in Convex dashboard or via CLI:

```bash
# Set OpenAI API Key (required)
npx convex env set OPENAI_API_KEY "sk-your-openai-api-key"

# Set Anthropic API Key (optional - for Claude models)
npx convex env set ANTHROPIC_API_KEY "your-anthropic-api-key"

# Set Google AI API Key (optional - for Gemini models)
npx convex env set GOOGLE_GENERATIVE_AI_API_KEY "your-google-ai-api-key"
```

#### For Next.js Frontend

Create `.env.local` in the root directory:

```env
# Convex configuration (set by npx convex dev)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Other configurations
JWT_SECRET=your-secure-jwt-secret
OPENAI_API_KEY=same-as-convex-for-local-dev
```

### 3. Start Development Servers

```bash
# Start all services (recommended)
bun dev

# Or start individually:
# Terminal 1 - Convex backend
cd packages/backend
bun dev

# Terminal 2 - Next.js frontend
cd apps/web
bun dev
```

## Features

### Real-time Messaging

- Instant message delivery via Convex subscriptions
- Optimistic UI updates for better UX
- Message persistence and history

### AI Streaming

- Support for 14+ cutting-edge AI models (as of August 2025):
  - **OpenAI**: GPT-5, GPT-5 Pro, o3, o4-mini, GPT-4.1, GPT-4o
  - **Anthropic**: Claude Opus 4.1, Claude Sonnet 4, Claude 3.5 Sonnet, Claude 3.5 Haiku
  - **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash-Lite, Gemini 2.0 Flash
- Dynamic model switching with rich selector UI
- Model capabilities display (speed, intelligence level, pricing)
- Real-time streaming responses
- Automatic message saving after completion
- Model persistence per chat conversation

### Typing Indicators

- Real-time typing status
- Automatic cleanup (5-second timeout)
- Multi-user support

### Chat Management

- Create, update, delete chats
- Chat history and persistence
- Token counting and usage tracking

## API Endpoints

### Convex HTTP Actions

- `POST /stream-chat` - Stream AI responses
  - Body: `{ chatId, walletAddress, content, model?, temperature?, maxTokens? }`

### Convex Functions

#### Queries

- `chats.getById` - Get single chat
- `chats.getByOwner` - Get user's chats
- `messages.getByChatId` - Get chat messages
- `typing.getTypingUsers` - Get typing indicators

#### Mutations

- `chats.create` - Create new chat
- `chats.update` - Update chat settings
- `chats.remove` - Delete chat
- `messages.create` - Create message
- `typing.setTyping` - Set typing status

## Client-Side Hooks

### useConvexChat

```typescript
const { messages, sendMessage, isStreaming } = useConvexChat(chatId);
```

### useTypingIndicator

```typescript
const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
  chatId,
  walletAddress
);
```

## Troubleshooting

### Common Issues

1. **Streaming not working**

   - Check Convex HTTP action deployment
   - Verify environment variables are set
   - Check browser console for errors

2. **Messages not appearing**

   - Verify Convex connection
   - Check authentication status
   - Ensure chat ID is valid

3. **Typing indicators not showing**
   - Check WebSocket connection
   - Verify user authentication
   - Check browser network tab

### Debug Commands

```bash
# Check Convex deployment
npx convex dashboard

# View Convex logs
npx convex logs

# Check environment variables
npx convex env list
```

## Performance Optimization

- Messages are paginated (50 per request)
- Typing indicators use ephemeral storage
- Streaming uses HTTP actions for better scalability
- Real-time subscriptions are optimized for minimal data transfer

## Security Considerations

- All API keys should be stored in environment variables
- Never expose API keys in client-side code
- Use JWT for authentication
- Validate all inputs with Zod schemas
- Implement rate limiting for API calls

## Model Selection

### Available Models (August 2025)

The system includes a comprehensive model selector with the following options:

#### OpenAI Models

- **GPT-5** (Default): Latest flagship model with unified reasoning and generation
- **GPT-5 Pro**: Extended thinking variant for complex problems
- **o3**: Most powerful reasoning model for coding, math, and science
- **o4-mini**: Fast, cost-efficient reasoning model
- **GPT-4.1**: Enhanced GPT-4 with 1M token context
- **GPT-4o**: Optimized GPT-4 with June 2024 knowledge

#### Anthropic Models

- **Claude Opus 4.1**: World's best coding model with sustained performance
- **Claude Sonnet 4**: Excellent coding with fast responses
- **Claude 3.5 Sonnet**: Fast, intelligent, and cost-effective
- **Claude 3.5 Haiku**: Fastest Claude model for simple tasks

#### Google Models

- **Gemini 2.5 Pro**: Most intelligent model with thinking capabilities
- **Gemini 2.5 Flash**: Fast thinking model with excellent performance
- **Gemini 2.5 Flash-Lite**: Fastest and lowest cost Gemini model
- **Gemini 2.0 Flash**: Superior speed with native tool use

### Model Features Display

The model selector shows:

- **Provider Icon**: Visual indicator for OpenAI, Anthropic, or Google
- **Intelligence Level**: Basic, Advanced, Expert, or Frontier
- **Speed Indicator**: Fast, Medium, or Slow processing
- **Context Window**: Token limit (e.g., 128K, 200K, 1M)
- **Pricing**: Cost per million tokens for input/output
- **Capabilities**: Key features like coding, reasoning, vision, etc.

### Automatic Provider Detection

The system automatically routes to the correct provider based on model selection:

- Models starting with `gpt-`, `o3`, `o4` → OpenAI
- Models starting with `claude-` → Anthropic
- Models starting with `gemini-` → Google
- Unknown models → Default to GPT-4o with warning

## Future Enhancements

- [ ] File attachments and image support
- [ ] Voice messages
- [ ] Message reactions and threading
- [ ] Search functionality
- [ ] Export chat history
- [ ] Multi-language support
- [ ] Advanced AI tools integration
