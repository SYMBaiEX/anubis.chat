# gg

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/wes-projects-9373916e/v0-gg)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/XzjxnoBkHUx)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/wes-projects-9373916e/v0-gg](https://vercel.com/wes-projects-9373916e/v0-gg)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/XzjxnoBkHUx](https://v0.app/chat/projects/XzjxnoBkHUx)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Development

- bun install
- bun dev

### Convex (Database)

This project uses Convex for realtime data.

Setup:

1. Install deps: `bun add convex`
2. Create a dev deployment: `bun x convex dev --once`
3. Copy your Convex deployment URL to `.env.local`:

```
NEXT_PUBLIC_CONVEX_URL="https://YOUR-DEPLOYMENT.convex.cloud"
ADMIN_WALLETS="Base58Wallet1,Base58Wallet2"
NEXT_PUBLIC_ADMIN_WALLETS=""
```

Dev loop:

- `bun run convex:watch` in one terminal to sync Convex functions
- `bun dev` in another terminal
