## Cross-Platform Integrations Plan (Web ↔ Forum)

This document inventories what already exists in the shared backend and the web app, and lays out a concrete plan to unify and extend features so the forum and web work great together and independently.

### Shared Foundations (already in place)

- Auth and Users
  - Convex Auth with Solana wallet provider (`packages/backend/convex/auth.ts`)
  - Auth helpers (`authHelpers.ts`) with `getCurrentUser`, `requireAuth`, `requireAdmin`
  - Unified `users` table with roles/permissions (`schema.ts`)

- Forum Content (moved to shared backend)
  - `posts`, `replies`, `likes`, `sections.counts` (`packages/backend/convex/{posts,replies,sections}.ts`)

- Subscriptions, Usage Limits, Payment Events
  - Tier config, usage tracking, and payment processing (`subscriptions.ts`)
  - Streaming checks enforce subscription limits (`streaming.ts`)
  - Payment events (`paymentEvents` table in `schema.ts`)

- Referrals and Payouts
  - `referralCodes`, `referralAttributions`, `referralPayouts`, `referralBalances`, `referralSystemStats` (`schema.ts`)
  - Referral processing hooks in `subscriptions.ts`; payout helpers in `solanaPayouts.ts`

- Uploads
  - Client-upload flow via Convex storage; unified sign action (`uploads.ts` → `signUpload`)

- Admin Utilities
  - `admin.ts` (health/stats/cleanup/listAllUsers)

### 20 Cross-Platform Integrations

1. Unified wallet auth and session
   - Use `@convex-dev/auth/react` in both apps; one token.

2. Shared user profile service
   - Use `api.users.getCurrentUserProfile`, `api.users.updateProfile`, and shared avatar upload.

3. Global notifications center
   - Add `notifications` (new tables and queries). Enqueue on post/reply/payment events.

4. Cross-app search index
   - Reuse existing search indices in `schema.ts`; index forum content; expose `api.search.query`.

5. Moderation toolkit
   - Reuse `flags.ts` for create/resolve; one admin resolve UI.

6. Subscriptions and entitlements
   - Reuse `subscriptions.ts` and streaming checks; gate forum premium sections and features.

7. Referrals and rewards
   - Use existing referral tables and mutations; surface referrer badges and leaderboards.

8. Uploads/storage unification
   - Use `api.uploads.signUpload`; one media pipeline for both UIs.

9. Activity feed
   - Add `userEvents` (new); aggregate forum/web events; one feed component per app.

10. Feature flags/remote config
   - Add `featureFlags` (new); `api.features.getFlags`; web `FeatureGate` and forum consume same flags.

11. Shared rate limits
   - Reuse `rate_limits` ledger; expose helpers for common throttles.

12. Admin console
   - Expand `admin.ts` queries (users/content/payments) and render in web admin; forum uses links.

13. Webhooks/integrations hub
   - Use `webhooks` and `webhookDeliveries` tables; include forum events.

14. Cross-linking/deep-links
   - Conventions for URLs; create `api.links.resolve` to map ids→URLs.

15. Tags/taxonomy service
   - Add `taxonomy` (new) to centralize allowed tags/categories across apps.

16. Reactions/likes/bookmarks
   - Extend `likes` or add `reactions` (new) for replies/docs/chats; unify counts.

17. Saved content/collections
   - Add `collections` (new) with generic `entityType/entityId` for saved items.

18. Real-time presence and typing
   - Reuse web's `typing` service; extend to forum threads.

19. AI assistance/tools in forum
   - Reuse assistants/runs; add summarize-thread/draft-reply.

20. Analytics/metrics
   - Expand `admin.getSystemStats`; add per-section stats for forum; single analytics view.

### Build Plan (Phased)

Phase 1 – Quick Wins (backend + small UI)
- Show subscription tier in forum header using `api.users.getCurrentUserProfile`.
- Replace section counts and replies with shared Convex hooks (done).
- Use `api.uploads.signUpload` directly from client (shim removed).

Phase 2 – Moderation and Flags (reuse)
- Use `api.flags.create/listOpen/resolve` in both apps; surface admin action buttons.

Phase 3 – Subscriptions in Forum
- Gate premium forum sections and show tier/limits prompts using existing `subscriptions.ts` queries.

Phase 4 – Notifications and Feature Flags (new but small)
- Add `notifications` and `featureFlags` tables/queries in shared backend; read in both UIs.

Phase 5 – Search and Activity Feed (reuse + small new)
- Index forum content into existing search; add `userEvents` to power an activity feed in both apps.

### Implementation Notes

- All backend code lives in `packages/backend/convex/*` and is consumed via `@convex/_generated/api`.
- Avoid duplicating functionality; always extend shared modules.
- Keep forum and web UIs using Convex hooks (`useQuery`, `useMutation`, `useAction`).


