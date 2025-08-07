# 🎯 ISIS Chat - Web App Development Context

## IMPORTANT: This is the Web App Only!

You are working exclusively in the **web application** portion of the ISIS Chat monorepo.

### Your Working Directory
```
/Users/michelleeidschun/isis.chat/apps/web/
```

### What This Means
1. **ALL paths are relative to `/apps/web`**
2. **You DO NOT need to worry about:**
   - API services (`../api`)
   - Smart contracts (`../contracts`) 
   - Shared packages (`../packages`)
   - Other monorepo concerns

3. **You ONLY work with:**
   - Frontend code (React/Next.js)
   - Convex backend functions
   - Web-specific integrations

## 🏗️ Project Architecture

```
isis.chat/
├── apps/
│   ├── web/          ← YOU ARE HERE! 
│   │   ├── app/      ← Next.js pages
│   │   ├── components/ ← React components
│   │   ├── convex/   ← Backend functions
│   │   ├── hooks/    ← Custom hooks
│   │   └── lib/      ← Utilities
│   └── api/          ← IGNORE THIS
├── contracts/        ← IGNORE THIS
└── packages/         ← IGNORE THIS
```

## 🎨 Technology Stack (Web App)

- **Frontend Framework**: Next.js 15 (App Router)
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Backend**: Convex (Backend-as-a-Service)
- **Database**: Convex DB (built-in)
- **AI Integration**: Vercel AI SDK v5
- **Blockchain**: Solana Web3.js (wallet connection only)
- **Language**: TypeScript (strict mode)

## 📋 Common Tasks

When asked to:

### "Create a new component"
→ Add to `/components` directory with TypeScript and shadcn/ui

### "Add a new page"
→ Create in `/app` directory following Next.js 15 conventions

### "Create backend functionality"
→ Add Convex functions in `/convex` directory

### "Add authentication"
→ Use Solana wallet integration in `/lib/solana`

### "Handle AI chat"
→ Use Vercel AI SDK hooks in `/hooks/use-chat.ts`

## 🚫 Out of Scope

Do NOT attempt to:
- Modify API services
- Deploy smart contracts
- Change monorepo configuration
- Work on non-web packages

## ✅ Quick Checklist

Before implementing anything:
1. ✓ Am I in `/apps/web`?
2. ✓ Is this web-specific?
3. ✓ Am I using the right tech stack?
4. ✓ Is TypeScript strict mode on?
5. ✓ No `any` types?

---

**Remember**: You're building the web interface for ISIS Chat. Everything else is handled by other teams/services!