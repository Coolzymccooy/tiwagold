# Tiwa Gold — Backend Gap Matrix (v1)

Companion to `docs/API_CONTRACT.v1.md`. For every endpoint surfaced in `src/services/*`, this matrix answers:

1. **Mock fidelity** — what the current in-memory mock faithfully reproduces.
2. **Backend gap** — what a real production backend MUST implement beyond the mock.
3. **Risk class** — blocking (cannot ship without it), functional (behavior-shaping), or hardening (production polish).

Legend:
- `[MOCK]`  — implemented in `src/services/*` today, consumable from the RN app.
- `[GAP]`   — backend-only concern; mock cheats deliberately.
- `[B]`     — **Blocking** (required before first real user).
- `[F]`     — **Functional** (must exist before GA, behavior would silently drift without it).
- `[H]`     — **Hardening** (nice-to-have for MVP, must-have at scale).

---

## 0. Cross-cutting concerns

### 0.1 JWT issuance, signing, rotation
- `[MOCK]` Access + refresh tokens are opaque IDs (`createId("at")`, `createId("rt")`) stored in a module-scoped Map.
- `[GAP][B]` Real backend signs JWTs with RS256 (preferred) or HS256. Claims: `sub`, `iss`, `aud`, `iat`, `exp`, `jti`, `scope`. Access TTL 15 min; refresh TTL 30 d.
- `[GAP][B]` Refresh rotation: every `POST /auth/refresh` must issue a new refresh token and **invalidate the old one** (token family). Replay of an already-rotated refresh token trips a family-wide revocation.
- `[GAP][B]` Asymmetric signing keys rotated via JWKS; client validates `kid` against cached JWKS.
- `[GAP][F]` Revocation list for access tokens (short-lived Redis set keyed by `jti`).

### 0.2 Signed-intent tokens
- `[MOCK]` `src/services/auth.ts` does not yet expose `useRequestSignedIntent`. Services that consume `intentToken` (`useApproveTrade`, `useExecuteTrade`, `useConfirmKillSwitch`) accept any non-empty string.
- `[GAP][B]` Backend issues a signed JWS bound to `{userId, purpose, subjectId, nonce, exp}` with TTL ≤ 60s, single-use. Server burns the `nonce` in a Redis set on first use.
- `[GAP][B]` Mint endpoint (`POST /auth/signed-intent/mint`) verifies **at least one** of: fresh MFA code, device-attestation signature (App Attest on iOS, Play Integrity on Android), or recent password re-entry.
- `[GAP][B]` Server-side purpose whitelist: `trade.approve`, `trade.execute`, `kill_switch.confirm`. Any other value returns 400 `invalid_purpose`.
- `[GAP][F]` Client hook `useRequestSignedIntent(purpose, subjectId)` must exist before any real destructive mutation ships. Currently a consumer-level shim.

### 0.3 Transport + headers
- `[MOCK]` `simulateFetch` bypasses HTTP. No real `Authorization`, `X-Request-Id`, or `X-Tiwa-Device-Id` headers are exercised.
- `[GAP][B]` Real `createHttpClient` sends `Authorization: Bearer <access>` on every non-public call; auto-refresh on 401 via the in-flight `coordinateRefresh` singleton already present in `src/services/http.ts`.
- `[GAP][B]` Every request carries `X-Request-Id` (UUIDv7) and `X-Tiwa-Device-Id` (persisted in `expo-secure-store`). Server logs by request-id for correlatable incident review.
- `[GAP][H]` Request signing for signed-intent calls: client attaches the signed-intent JWS in `X-Tiwa-Intent` header (not body) to keep the body verb-clean.

### 0.4 Query-key invalidation parity
- `[MOCK]` Client `onSuccess` handlers invalidate exact query-key tuples per `docs/API_CONTRACT.v1.md`. Mock returns the updated row so screens repaint via re-fetch.
- `[GAP][F]` Backend MUST preserve the exact query-key tuple contract — rename the endpoint family without updating the client breaks cache invalidation silently. Any v2 endpoint rename is a breaking change; bump major version.
- `[GAP][H]` Server-sent cache invalidation via WebSocket or SSE push (`X-Invalidate: ["trades"]`) would let screens repaint without polling. Deferred to v1.1.

### 0.5 Observability
- `[MOCK]` None — mock throws `HttpError` with a stringly-typed code.
- `[GAP][F]` Structured logging: every endpoint emits `{requestId, userId?, endpoint, latencyMs, statusCode, errorCode?}`.
- `[GAP][F]` Per-endpoint latency SLO tracked in Datadog/Grafana; alert on p95 > 400ms for market-data calls, > 800ms for analytics aggregations.
- `[GAP][H]` Distributed trace propagation (`traceparent` header) end-to-end from RN to broker adapters.

### 0.6 Rate limiting
- `[MOCK]` None.
- `[GAP][B]` Per-user + per-IP limits: 60 req/min default, 5 req/min for `POST /auth/*`, 10 req/min for signed-intent mint, 1 req/min for `POST /safety/kill-switch/confirm`.
- `[GAP][B]` 429 response includes `Retry-After` header; `createHttpClient` respects it.

### 0.7 Input validation
- `[MOCK]` Minimal — services check presence and throw `HttpError` for missing fields.
- `[GAP][B]` Every endpoint validates its request body server-side via Zod (shared schema pkg) or a language-equivalent schema library. Client-side Zod alone is insufficient.
- `[GAP][B]` Reject unknown fields (strict mode) to prevent forwards-compat footguns from leaking into storage.

---

## 1. Auth domain

| Endpoint | Mock fidelity | Backend gap | Risk |
|---|---|---|---|
| `POST /auth/sign-in` | Validates credentials against in-memory store; returns tokens + user. | Real bcrypt/argon2 password verify; MFA challenge flow (if enabled on account); device-attestation on first sign-in per device; emit `auth.signin` audit event. | B |
| `GET /auth/session` | Returns stored session. | Validate access-token signature + expiry; load session from Redis keyed by `jti`. | B |
| `POST /auth/refresh` | Issues fresh opaque ids, does not rotate. | **Rotating** refresh tokens (family invalidation on replay); detect concurrent refresh attempts; emit `auth.refresh` + `auth.refresh.replay` events. | B |
| `GET /users/me` | Returns mock user. | Join users + feature-flag + risk-tier tables; cache in Redis 60s keyed by userId. | F |
| `POST /auth/sign-out` | Forgets tokens locally. | Revoke refresh-token family + blacklist access `jti` for remaining TTL. | B |
| `POST /auth/forgot-password` | Always returns `{accepted:true}`. | Actually send email via SES/Postmark; rate-limit to 3/hour per email; no timing-difference between known/unknown accounts (mock already does this — server must preserve). | B |
| `POST /auth/reset-password` | Accepts any non-expired reset token from in-memory map. | Cryptographic reset token (HMAC over userId+issuedAt), single-use, 15-min TTL, invalidated on password change; force all refresh-token-family revocation on success. | B |

---

## 2. Trades domain

| Endpoint | Mock fidelity | Backend gap | Risk |
|---|---|---|---|
| `GET /trades` | Returns in-memory list. | Paginated (`?cursor=`, default 50); filterable by status/engine/session; server-side sort by `openedAt desc`; 5s cache invalidation on broker position-update webhook. | F |
| `GET /trades/:id` | Direct Map lookup. | Include fresh broker position snapshot (currentPrice, mfe/mae) by joining broker-adapter read-through cache. | F |
| `PATCH /trades/:id/status` | Mutates in-memory store. | Validate allowed state transitions (`pending→approved→executed→closed`, never backwards); reject if broker reports stale state; emit `trade.status.changed` event. | B |
| `POST /trades/:id/approve` | Requires `intentToken` (accepts any string); sets `status: "approved"`. | **Verify signed-intent** bound to `trade.approve` + `tradeId`; check risk-tier allows approval; lock trade row with `SELECT … FOR UPDATE`; audit log. | B |
| `POST /trades/:id/execute` | Requires `intentToken`; enforces approval + kill-switch + broker-connected; mock broker always fills at `currentPrice ?? proposedEntry`. | Real broker routing per connection.kind (MT5/OANDA/cTrader/paper); honor `bestExecutionWithin` slippage ceiling server-side; handle partial fills; persist broker order id; emit `trade.executed` event with audit chain. | B |
| `GET /trades/:id/execution` | Returns synthesized status from trade.status. | Poll broker adapter for live fill phase (`submitted→working→filled/cancelled/rejected`); reconcile with internal trade row; 5s TTL. | F |

---

## 3. Analytics domain

| Endpoint | Mock fidelity | Backend gap | Risk |
|---|---|---|---|
| `GET /analytics/summary?range=…` | Returns fixture scaled by range via `scaleSummaryForRange`. | Aggregate from trades table over requested range; pre-compute nightly snapshot per user (materialized view) for common ranges (7d/30d/90d/all); compute totalR from closed trades only. | F |
| `GET /analytics/equity?range=…` | Returns synthesized curve with 2dp rounding. | Time-series aggregation from `trade_closed` ledger events; stream daily points via `/analytics/equity/stream` SSE in v1.1 for live updates. | F |

---

## 4. Macro domain

| Endpoint | Mock fidelity | Backend gap | Risk |
|---|---|---|---|
| `GET /macro/events` | Returns fixture list. | Pull from economic calendar feed (ForexFactory, FXStreet, or internal curator); cache 5 min; include only events affecting XAU/USD (DXY, FOMC, CPI, NFP, PMI). | F |
| `GET /macro/events/:id` | Direct lookup; key levels for DXY entries. | Enrich with live price-level breach detection; emit `macro.level.breached` webhook when DXY crosses a keyLevel. | F |

---

## 5. Copilot domain

| Endpoint | Mock fidelity | Backend gap | Risk |
|---|---|---|---|
| `GET /copilot/conversations` | In-memory list, ordered desc by updatedAt. | Paginated; soft-delete support; store in Postgres with `tsvector` full-text index for server-side search in v1.1. | F |
| `GET /copilot/conversations/:id` | Direct lookup. | Load messages in paginated chunks (`?before=messageId&limit=50`); RN infinite-scroll upward. | F |
| `GET /copilot/suggested-prompts` | Static array. | Personalize based on current open trades + recent macro events; cache per-user 1 h. | H |
| `POST /copilot/conversations/:id/messages` | Appends user message and synthesized assistant reply. | Persist message, fan-out to LLM (Gemini 1.5 Pro via `@google/genai`), stream response tokens back via `/copilot/chat` SSE; never store assistant replies from client — server is sole writer for `role: "assistant"` rows. | B |
| `POST /copilot/chat` | Returns a single `CopilotChatResponseChunk` with `status: "complete"`. | **Real streaming** via SSE (`text/event-stream`) or WebSocket: emit `chunk` events with deltas, final `complete` event with full text + citations; handle client disconnect (cancel LLM call + emit `cancelled`); rate-limit to 30 msgs/hr/user on free tier. | B |

Citations: mock injects citations only when `context.tradeId` is present. Backend MUST attach citations for any claim referencing an internal trade — missing citations on a tradeId-context chat is a contract violation.

---

## 6. Profile domain

| Endpoint | Mock fidelity | Backend gap | Risk |
|---|---|---|---|
| `GET /users/me` | Returns mock user. | Covered under §1. | B |
| `PATCH /users/me` | Conditional-spread; unspecified fields preserved. | Server MUST enforce the same semantics — partial patches never clobber. Audit-log diff (before → after). | B |
| `POST /users/me/avatar` | Synthesizes CDN URL without upload. | Presigned S3/R2 URL flow: client POSTs `{contentType, size}`, server returns `{uploadUrl, publicUrl}`; client PUTs to S3 directly; server validates size ≤ 5 MB, mime in `image/jpeg|png|webp`, pixel dims ≤ 2048²; strip EXIF on server-side processor (Lambda@Edge or equivalent). | B |

---

## 7. Settings domain

| Endpoint | Mock fidelity | Backend gap | Risk |
|---|---|---|---|
| `GET /settings/risk` | Returns fixture. | Load from user_settings table; per-tier defaults merged. | F |
| `PATCH /settings/risk` | Conditional-spread merge. | Same semantics server-side; validate `maxDailyLossR ≤ hardTierCap`; emit `settings.risk.changed` event (ops visibility into aggressive risk posture). | B |
| `GET /settings/engine` | Returns fixture, tier-keyed. | Same shape; join engine_enabled table keyed by `(userId, engineTier)`. | F |
| `PATCH /settings/engine` | **Tier-keyed merge** via `EngineToggleUpdate` — never replace-all. | Server must preserve the same merge semantics; validate at least one engine remains enabled after patch (or allow all-off only with explicit `allowAllOff: true` flag). | B |

---

## 8. Broker domain

| Endpoint | Mock fidelity | Backend gap | Risk |
|---|---|---|---|
| `GET /broker/connections` | In-memory list. | Load from encrypted `broker_connections` table (column-level AES-GCM on credentials using per-user KMS key); never return credentials to client. | B |
| `GET /broker/connections/:id` | Direct lookup. | Include live `lastHeartbeatAt` from broker adapter ping job. | F |
| `POST /broker/connections` | Stores credentials in memory (!). | **Encrypt credentials at rest** with per-user KMS envelope; test connection before 201; return 201 with connection row sans credentials; emit `broker.connected` event. | B |
| `DELETE /broker/connections/:id` | Removes from Map. | Cancel all open orders on that connection first; settle pending trades; emit `broker.disconnected`; keep audit row with `deletedAt` (no hard delete). | B |
| `PATCH /broker/connections/:id` | Conditional-spread merge. | Re-encrypt on credential rotation; re-test connection if credentials or `kind` change. | B |
| `POST /broker/connections/:id/test` | Mock always returns `status: "connected", currency: "USD"`. | **Real handshake per kind**: MT5 terminal RPC ping, OANDA REST `/accounts/:id/summary`, cTrader OpenAPI `ProtoOAGetAccountsByAccessTokenReq`, paper broker always ok. Return live `currency`, `balance`, `equity`, `server`. | B |

---

## 9. Safety domain

| Endpoint | Mock fidelity | Backend gap | Risk |
|---|---|---|---|
| `GET /safety/kill-switch` | Returns fixture status. | Load from singleton `kill_switch` table row (global, not per-user for MVP); 10s TTL is fine; broadcast via Pub/Sub if state changes. | B |
| `POST /safety/kill-switch/confirm` | Requires `intentToken` + exact phrase; returns counts from fixture. | **Verify signed-intent** bound to `kill_switch.confirm`; **atomic** position-close across ALL connected brokers (2-phase: cancel all orders → close all positions → flip flag); roll back and surface `broker_failed` if any broker returns non-OK; all-or-nothing semantics. | B |

---

## 10. Signed-Intent auxiliary (not yet in services)

| Endpoint | Mock fidelity | Backend gap | Risk |
|---|---|---|---|
| `POST /auth/signed-intent/challenge` | Not implemented. | Issue nonce + TTL 60s, bound to `{userId, purpose, subjectId}`; store in Redis with TTL; rate-limit 10/min/user. | B |
| `POST /auth/signed-intent/mint` | Not implemented. | Validate proof (MFA code TOTP + device-attestation); mint single-use JWS; burn nonce on mint; return `{token, exp}`. | B |

Client work needed before shipping destructive flows:
1. Add `useRequestSignedIntent(purpose, subjectId)` hook to `src/services/auth.ts`.
2. Wire it through approval/execution/kill-switch screens so the user only sees a single confirm modal (the MFA challenge happens inline).
3. Replace current "any non-empty string" mock acceptance with a real challenge-then-mint flow behind the same hook surface.

---

## 11. Compliance & audit

- `[GAP][B]` **Immutable audit log** for every state-changing trade mutation and every signed-intent use. Append-only table; cryptographic chaining (`prev_hash` column) to detect tampering.
- `[GAP][B]` **PII handling**: email + name encrypted at rest; avatar URL + uploaded image stored in region-pinned bucket (EU users → eu-west-1).
- `[GAP][F]` **Data export** endpoint (`GET /users/me/export`) for GDPR Article 20 portability.
- `[GAP][F]` **Account deletion** endpoint (`DELETE /users/me`) with 30-day soft-delete grace period.
- `[GAP][H]` **SOC 2** trail: who accessed which user's trades, when, from what IP.

---

## 12. Launch readiness checklist (backend side)

Blocking items before first real user (from `[B]` rows above):

- [ ] JWT signing + rotating refresh token family (0.1)
- [ ] Signed-intent challenge + mint + nonce burn (0.2, 10)
- [ ] Real `Authorization` + `X-Request-Id` headers plumbed (0.3)
- [ ] Rate limiting per-user + per-IP (0.6)
- [ ] Server-side Zod-equivalent input validation, strict unknown-field rejection (0.7)
- [ ] Argon2/bcrypt password verify + real MFA challenge on sign-in (§1)
- [ ] Refresh rotation + family revocation on replay (§1)
- [ ] Real email send for forgot-password (§1)
- [ ] Trade state-transition validation + row locking (§2)
- [ ] Real broker routing + partial-fill handling + persisted broker order id (§2)
- [ ] LLM streaming via SSE/WebSocket for copilot chat (§5)
- [ ] Presigned S3 avatar upload + EXIF strip (§6)
- [ ] Encrypted broker credentials at rest (per-user KMS envelope) (§8)
- [ ] Atomic kill-switch across all brokers (§9)
- [ ] Immutable audit log with hash chain (§11)
- [ ] PII encryption + region pinning (§11)

Functional items before GA (from `[F]` rows):

- [ ] Pagination on trades list + copilot conversations
- [ ] Live broker heartbeat + `lastHeartbeatAt`
- [ ] Analytics nightly materialized views
- [ ] Macro calendar feed integration + key-level breach webhook
- [ ] Structured logging + per-endpoint latency SLO
- [ ] `useRequestSignedIntent` client hook wired into approval/execution/kill-switch
- [ ] GDPR export + account soft-delete

Hardening before scale (from `[H]` rows):

- [ ] Personalized copilot prompt suggestions
- [ ] Distributed tracing end-to-end
- [ ] Server-sent cache invalidation via WebSocket
- [ ] Request signing via `X-Tiwa-Intent` header (body-clean)
- [ ] SOC 2 access log

---

## 13. Contract-drift detection

Once a real backend is stood up, the client and server agree on `docs/API_CONTRACT.v1.md` as ground truth. Drift detection:

1. **Schema diff CI job**: OpenAPI spec exported from backend → diffed against a client-side fixture generated from `src/types/*` + the contract doc. Any breaking drift fails CI on both repos.
2. **Query-key audit**: every `['…']` tuple in `src/services/*.ts` must appear in the contract doc under a documented endpoint. A linter check (not yet built — deferred to Phase 3) walks the service files and asserts tuple coverage.
3. **Versioning**: additive-only changes stay on v1. Any rename / removal / semantic shift bumps the URL prefix to `/v2/*` and the client stays pinned to v1 until the RN app ships a compatible build.
