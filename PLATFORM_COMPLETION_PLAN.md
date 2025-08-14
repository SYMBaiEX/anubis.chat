## Anubis Chat — 100% Completion Plan (v1)

Last updated: 2025-08-14

Source of truth: `PRODUCTION_READINESS.md` feature matrix and codebase review. This plan covers every area below 100% and provides: reason, proof, and an actionable implementation plan with acceptance criteria.

### Snapshot of areas <100%

- Subscriptions (SOL): 85%
- Message credits: 80%
- Chat streaming: 85%
- RAG pipeline: 80%
- Files: 85%
- Memory extraction: 75%
- MCP servers: 65%
- Agents: 60%
- Workflows: 70%
- Admin + Monitoring: 70%
- Security & rate limiting: 70%
- PWA: 80%
- Testing: 15%
- Docs: 60%
- Referrals: 70%

---

 

### 2) Subscriptions (SOL) + Message Credits

- Reason not 100%: Robust verification exists, but add idempotency, retry backoff, and full dual-payment coverage tests.
- Proof (verification present, advanced logic but no explicit idempotency layer on HTTP action path):
```824:894:packages/backend/convex/paymentVerification.ts
      const result = await ctx.runMutation(
        internal.subscriptions.processVerifiedPayment,
        {
          tier: tier as 'pro' | 'pro_plus',
          txSignature,
          amountSol: amountForProcessing,
          walletAddress,
          isProrated,
          verificationDetails: (verificationResult as any).transactionDetails || { ... }
        }
      );
```

- Plan to 100%:
  - Add durable idempotency keys by `txSignature` in mutation layer; short-circuit duplicates.
  - Integration tests: verification success/failure, duplicate submissions, referral split A/B.
  - Add reconciliation job to re-verify pending/timeout transactions.
  - Acceptance: Duplicate submissions are no-ops; reconciliation recovers from RPC flaps; tests green.

---

### 3) Chat Streaming

- Reason not 100%: HTTP action lacks rate limiting and JWT validation (wallet address used as fallback); model routing guardrails exist but need tests.
- Proof:
```662:671:packages/backend/convex/streaming.ts
  // Note: For HTTP actions, authentication should be handled via Authorization header
  // with a JWT token from your auth provider
  const _authHeader = request.headers.get('Authorization');
  // For now, we'll use wallet address verification as a temporary measure
  const user = await ctx.runQuery(api.users.getUserByWallet, { walletAddress });
```

- Plan to 100%:
  - Enforce Convex Auth JWT for HTTP actions; reject missing/invalid tokens.
  - Introduce shared rate limiter (IP+wallet) for `/stream-chat` POST.
  - Tests: unauthorized, rate-limited, allowed model, disallowed model.
  - Acceptance: Unauthorized blocked; 429 when exceeding limit; model allowlist enforced.

---

### 4) RAG Pipeline

- Reason not 100%: No offline eval harness; lifecycle for re-chunk/re-embed and GC not automated.
- Proof: Retrieval and formatting exist; no eval utilities or scheduled background maintenance found.

- Plan to 100%:
  - Add `ragEval` action + fixtures to compute precision/recall on a small gold dataset.
  - Background jobs: re-chunk/re-embed on file updates; GC of orphaned chunks.
  - Tests: eval computes stable metrics; lifecycle jobs update counts; search returns expected items.
  - Acceptance: Baseline P@5/R@5 thresholds met; docs lifecycle verified.

---

### 5) Files

- Reason not 100%: Add stricter MIME sniffing and extension allowlist on server; size-bounded streaming and virus-scan hook.
- Proof: Upload/serve implemented; explicit MIME sniffing/AV hooks not present in code reviewed.

- Plan to 100%:
  - Enforce server-side MIME verification; configurable allowlist; reject double extensions.
  - Add AV scan hook (pluggable) pre-index; quarantine on detection.
  - Tests: upload disallowed types; oversize rejection; AV positive flow; serve only allowlisted.
  - Acceptance: Security tests pass; zero dangerous content indexed.

---

### 6) Memory Extraction

- Reason not 100%: No end-to-end regression tests; error tolerance in extraction path could be improved.
- Proof: Extraction invoked during streaming on both user/assistant messages without dedicated tests.

- Plan to 100%:
  - Add unit tests for extractor rules; integration test ensuring memories are created and later retrieved by RAG.
  - Backoff on extractor failures and capture metrics.
  - Acceptance: Memories created deterministically; downstream RAG shows lift on contextual queries.

---

### 7) MCP Servers

- Reason not 100%: API routes exist; lack of e2e tests validating spin-up/tear-down and tool execution UX.
- Proof (routes present):
```209:212:apps/web/src/app/api/mcp/servers/route.ts
export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
```

- Plan to 100%:
  - Write e2e tests covering list → init → call → close flows.
  - Add rate limits + auth to MCP endpoints; log errors to Sentry.
  - Acceptance: E2E passes; abuse paths rate-limited; errors observable.

---

### 8) Agents

- Reason not 100%: CRUD present, but tool execution orchestration and UI coupling not fully validated with tests.
- Proof: Agents CRUD in Convex; no tests asserting executions + tool steps end-to-end.

- Plan to 100%:
  - Add engine tests: create → execute → tool_calls → step updates → completion.
  - UI binds execution streaming and error states; record usage metrics.
  - Acceptance: Deterministic executions; retries on tool flakes; telemetry visible.

---

### 9) Workflows

- Reason not 100%: Visual builder + storage exist; execution engine semantics across step types need test coverage; approvals flow.
- Proof (rich CRUD present):
```335:368:packages/backend/convex/workflows.ts
export const createExecution = mutation({ ... status: 'pending', currentStep: '' ... })
```

- Plan to 100%:
  - Implement execution driver (pending→running→completed/failed) with timers and human_approval.
  - Tests for branching, parallel, approval, failure/retry semantics.
  - Acceptance: Complex flows pass; persisted step results accurate; UI updates in real-time.

---

### 10) Admin + Monitoring

- Reason not 100%: Payments monitoring exists; expand to auth failures, streaming latency, RAG hit ratio; add alerts.
- Proof (payments-focused monitoring):
```77:96:packages/backend/convex/monitoring.ts
export const getPaymentMetrics = query({ args: { timeframe, eventType }, ... })
```

- Plan to 100%:
  - Add metrics for login failures, challenge replays, streaming TTFB, vector search latency.
  - Alerting thresholds and dashboard queries.
  - Acceptance: Dashboards cover core SLOs; alerts fire on threshold breaches.

---

### 11) Security & Rate Limiting

- Reason not 100%: Good per-route utilities on web; Convex HTTP actions need shared limiter; CSP/site headers need verification.
- Proof (rate limiter exists on web):
```113:124:apps/web/src/lib/middleware/rate-limit.ts
export const rateLimitConfigs = {
  auth: { ... },
  messages: { ... },
```
Proof (Convex HTTP routes lack limiter wrapper):
```53:66:packages/backend/convex/http.ts
http.route({ path: '/stream-chat', method: 'POST', handler: streamChat });
```
Proof (API security headers exist; site-wide CSP not shown):
```140:160:apps/web/src/lib/utils/cors.ts
export function addSecurityHeaders(...) {
  response.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none';");
}
```

- Plan to 100%:
  - Introduce shared limiter module for Convex HTTP actions; apply to `/stream-chat`, `/verify-payment`, file routes.
  - Add Next.js headers or middleware to set CSP for pages (script/style/img/connect-src with strict nonces/origins); set HSTS, Referrer-Policy.
  - SAST/secret scan in CI; rate-limit auth and payment paths specifically.
  - Acceptance: Headers present on all pages/APIs; Convex endpoints rate-limited; CI checks pass.

---

### 12) PWA

- Reason not 100%: Manifest + SW exist; add offline cache strategy tests and update flow (skipWaiting/clientsClaim) validation.
- Proof: Assets present per report; tests absent.

- Plan to 100%:
  - Audit SW caching strategy; add versioned precache; validate update UX.
  - Acceptance: Lighthouse PWA 100; offline basic chat UI loads; update prompts work.

---

### 13) Testing

- Reason not 100%: Only minimal smoke test for web; no Convex unit/integration; no e2e.
- Proof:
```1:8:apps/web/src/smoke/smoke.test.ts
describe('smoke', () => {
  it('runs the test runner', () => { expect(true).toBe(true); });
});
```

- Plan to 100%:
  - Backend: Add Vitest harness for Convex actions/queries/mutations (auth, payments, files, RAG).
  - Integration: Devnet tests for payment verification end-to-end (happy/failure/duplicate).
  - E2E: Playwright or Cypress covering wallet connect → pay → chat → upload → RAG answer → export.
  - Acceptance: CI runs unit+integration+e2e; flake rate <1%; coverage on critical modules >80%.

---

### 14) Docs

- Reason not 100%: Core docs exist; missing deployment/ops runbooks, SLOs, API contracts for MCP/Convex HTTP.
- Proof: Readmes present; no runbooks or API reference verified.

- Plan to 100%:
  - Add Fumadocs sections: Auth, Payments, RAG, Files, Agents, Workflows, MCP, SLOs/alerts, incident response.
  - Generate OpenAPI-like references for Next API routes + Convex HTTP endpoints.
  - Acceptance: New dev can deploy and operate using docs alone.

---

### 15) Referrals

- Reason not 100%: Logic present; need definitive tests for single/dual-transfer flows, rounding, and commissions.
- Proof: Dual-payment verification path implemented; no tests observed.

- Plan to 100%:
  - Unit tests for commission math; integration for both A) two-signature and B) single-tx dual transfer.
  - Backfill payouts analytics and fraud checks (anomalous rates).
  - Acceptance: Tests pass; metrics visible; fraud alerts configured.

---

### 16) Observability & SLOs (Sentry + Metrics)

- Reason not 100%: Payment monitoring exists; no Sentry, limited metrics outside payments.
- Proof (no Sentry found): repo contains no `@sentry` imports.

- Plan to 100%:
  - Add Sentry for Next (client/server) and wrap Convex actions with error capture.
  - Define SLOs: auth success rate, payment success rate, chat latency p95, RAG hit ratio. Export to dashboards.
  - Acceptance: Error traces visible; alerts configured; SLO dashboards populated.

---

## Implementation Workstreams

1) Security Hardening (Auth, Headers, Rate Limits)
- Deliverables: [x] ed25519 verification; site-wide CSP/HSTS; shared limiter on Convex HTTP.
- Exit: All security tests pass; headers present; unauthorized blocked.

2) Reliability & Payments
- Deliverables: Idempotency; reconciliation; referral tests; monitoring alerts.
- Exit: No double-processing; alerting live; integration tests green.

3) Intelligence Quality (RAG + Memory)
- Deliverables: Eval harness; lifecycle jobs; extractor tests.
- Exit: Meets baseline P/R; stable memory enrichment.

4) Platforms (Agents, Workflows, MCP)
- Deliverables: Execution engines finalized; e2e tests; UX wiring.
- Exit: Deterministic runs; retries; visibility.

5) Test & Ops
- Deliverables: Unit/integration/e2e CI; Sentry; runbooks/docs.
- Exit: Green CI; SLO dashboards; incident playbooks.

## Acceptance Criteria (Global)

- Security checklist in `PRODUCTION_READINESS.md` fully checked.
- CI runs lint, typecheck, unit, integration, e2e on PRs; green required for merge.
- Sentry events visible from web + Convex; alerts configured.
- Dashboards show SLOs for auth, payments, chat, RAG.
- E2E covers primary user journey; flake rate <1% over 100 runs.

## Dependencies & Credentials

- Solana devnet/mainnet RPC; payment address configured.
- Sentry DSN; CI secrets for providers; OpenAI/OpenRouter/Google keys.

## Risk Mitigation

- Feature flags for new auth enforcement and model routing.
- Staged rollout with canary deploy; error budgets.

---

This plan will be updated as each area reaches 100% with linked PRs and test reports.


