# Tiwa Gold API Contract — v1

Status: Draft v1 · Scope: XAU/USD only · Auth: JWT access + refresh, Signed-Intent for gated mutations

This document defines the backend contract that the Expo/RN client already consumes via mocked `src/services/*` hooks. Request/response shapes trace 1:1 to `src/types/*` domain models; any deviation is a breaking change and bumps the contract version.

## Conventions

- **Base URL**: `https://api.tiwagold.app/v1`
- **Content type**: `application/json; charset=utf-8`
- **Time**: all timestamps are ISO-8601 UTC strings (`2026-04-14T08:30:00.000Z`)
- **IDs**: opaque strings; prefixes match mock generators (`at_`, `rt_`, `usr_`, `trd_`, `exe_`, `msg_`, `cps_`, `brk_`, `pwreq_`, `av_`)
- **Errors**: `{ code: string, message: string, details?: unknown }` with HTTP status set appropriately (400/401/403/404/409/422/429/5xx)
- **Pagination**: not required for MVP — all list endpoints return full sets (bounded by product scope)
- **Auth header**: `Authorization: Bearer <access.value>`
- **Signed-Intent header**: `X-Signed-Intent: <SignedIntent.token>` for mutations marked "signed-intent"
- **Refresh**: 401 on any access-token request triggers a single refresh retry via `POST /auth/refresh`; a second 401 throws `RefreshFailedError` and forces re-auth
- **Query-key parity**: every endpoint lists the exact TanStack Query key used by the client — server must keep semantics stable across minor versions

## Auth rules at a glance

| Scope | Header requirement | Applies to |
|---|---|---|
| `public` | none | login, refresh, forgot/reset password, kill-switch status |
| `access-token` | `Authorization: Bearer …` | everything else (reads and most writes) |
| `signed-intent` | `Authorization` + `X-Signed-Intent` | `trade.approve`, `trade.execute`, `kill_switch.confirm` |

Signed-Intent tokens are minted by a separate challenge endpoint (see §10) and expire within 60s. A SignedIntent is single-use, bound to `(purpose, subjectId)`.

---

## 1. Auth (`/auth`)

Domain types: `src/types/auth.ts`.

### 1.1 `POST /auth/sign-in`

- **Hook**: `useSignIn`
- **Query key**: mutation (sets `["user","me"]` on success)
- **Auth**: public
- **Request**: `AuthLoginInput` → `{ email: string, password: string, mfaCode?: string }`
- **Response 200**: `AuthSession` → `{ userId, access: AccessToken, refresh: RefreshToken, scope?: string[] }`
- **Response 401**: `{ code: "invalid_credentials" | "mfa_required" | "account_locked", message }`
- **Response 429**: `{ code: "rate_limited", message, details: { retryAfterSeconds } }`

### 1.2 `GET /auth/session`

- **Hook**: `useAuthSession(enabled)`
- **Query key**: `["auth","session"]`
- **Auth**: access-token
- **staleTime**: `60_000`
- **Response 200**: `AuthSession`
- **Response 401**: `{ code: "token_expired" | "token_invalid" }`

### 1.3 `POST /auth/refresh`

- **Hook**: `useRefreshSession` (also called internally by the http client on 401)
- **Query key**: mutation
- **Auth**: public (body carries refresh token)
- **Request**: `AuthRefreshInput` → `{ refresh: RefreshToken }`
- **Response 200**: `AuthSession` (access rotated; refresh MAY rotate — refresh rotation is recommended for defense-in-depth)
- **Response 401**: `{ code: "token_expired" | "token_invalid" }` → client must re-auth

### 1.4 `GET /users/me`

- **Hook**: `useCurrentUser(enabled)`
- **Query key**: `["user","me"]`
- **Auth**: access-token
- **staleTime**: `60_000`
- **Response 200**: `UserProfile` (see `src/types/user.ts`)

### 1.5 `POST /auth/sign-out`

- **Hook**: `useSignOut`
- **Query key**: mutation (removes `["user","me"]` and `["auth","session"]` from cache)
- **Auth**: access-token
- **Request**: empty body
- **Response 204**: no content — server revokes refresh token family

### 1.6 `POST /auth/forgot-password`

- **Hook**: `useForgotPassword`
- **Query key**: mutation
- **Auth**: public
- **Request**: `AuthForgotPasswordInput` → `{ email: string }`
- **Response 202**: `{ accepted: true, requestId: string }` — always 202 to avoid email enumeration

### 1.7 `POST /auth/reset-password`

- **Hook**: `useResetPassword`
- **Query key**: mutation
- **Auth**: public (one-time token from email)
- **Request**: `AuthResetPasswordInput` → `{ token: string, newPassword: string }`
- **Response 200**: `{ accepted: true }`
- **Response 401**: `{ code: "token_expired" | "token_invalid" }`

---

## 2. Trades (`/trades`)

Domain types: `src/types/trade.ts`. `TRADE_SYMBOL` is always `"XAU/USD"`.

### 2.1 `GET /trades`

- **Hook**: `useTrades`
- **Query key**: `["trades"]`
- **Auth**: access-token
- **staleTime**: `10_000`
- **Response 200**: `Trade[]`

### 2.2 `GET /trades/:id`

- **Hook**: `useTrade(id)`
- **Query key**: `["trade", id]`
- **Auth**: access-token
- **staleTime**: `10_000`
- **Response 200**: `Trade` (closed trades include `autopsy: TradeAutopsy`)
- **Response 404**: `{ code: "not_found", message }`

### 2.3 `PATCH /trades/:id/status`

- **Hook**: `useUpdateTradeStatus`
- **Query key**: mutation (invalidates `["trades"]` + `["trade", id]`)
- **Auth**: access-token
- **Request**: `UpdateTradeStatusInput` → `{ id, status: CandidateStatus, note?: string }`
- **Response 200**: `Trade` (with appended `TradeTimelineEvent`: kind `"cancelled"` when status ∈ {cancelled, expired, risk_blocked}, else `"note"`)
- **Response 409**: `{ code: "illegal_transition", message, details: { from, to } }`

### 2.4 `POST /trades/:id/approve`

- **Hook**: `useApproveTrade`
- **Query key**: mutation (invalidates `["trades"]` + `["trade", id]`)
- **Auth**: **signed-intent** (`purpose: "trade.approve"`, `subjectId: tradeId`)
- **Request**: `ApproveTradeVariables` → `{ id, intentToken: string }`
- **Response 200**: `Trade` with `status="approved"`, timeline kind `"approved"`
- **Response 403**: `{ code: "intent_invalid" | "intent_expired" | "intent_subject_mismatch" }`
- **Response 409**: `{ code: "already_approved" | "already_executed" | "risk_blocked" }`

### 2.5 `POST /trades/:id/execute`

- **Hook**: `useExecuteTrade`
- **Query key**: mutation (invalidates `["trades"]`, `["trade", id]`, `["trade", id, "execution"]`)
- **Auth**: **signed-intent** (`purpose: "trade.execute"`, `subjectId: tradeId`)
- **Request**: `ExecuteTradeVariables` → `{ id, intentToken: string }`
- **Response 200**: `Trade` with `status="executed"`, `fillPrice = currentPrice ?? proposedEntry`, timeline kind `"triggered"`
- **Response 403**: `{ code: "intent_invalid" | "intent_expired" | "intent_subject_mismatch" }`
- **Response 409**: `{ code: "not_approved" | "kill_switch_tripped" | "broker_disconnected" | "risk_blocked" }`
- **Response 424**: `{ code: "broker_failed", message, details: { brokerErrorCode } }` — execution reached broker but failed downstream

### 2.6 `GET /trades/:id/execution`

- **Hook**: `useExecutionStatus(id)`
- **Query key**: `["trade", id, "execution"]`
- **Auth**: access-token
- **staleTime**: `5_000`
- **Response 200**: `ExecutionStatus` → `{ tradeId, phase: ExecutionPhase, attempts, brokerOrderId?, brokerFillPrice?, lastEventAt, error? }`
  - Phase mapping from candidate status:
    - `executed` → `filled`
    - `cancelled` | `expired` → `cancelled`
    - `risk_blocked` → `rejected`
    - `approved` → `queued`
    - else → `pending_fill`

---

## 3. Analytics (`/analytics`)

Domain types: `src/types/analytics.ts`.

### 3.1 `GET /analytics/summary?range=<AnalyticsRange>`

- **Hook**: `useAnalyticsSummary(range)`
- **Query key**: `["analytics","summary", range]`
- **Auth**: access-token
- **staleTime**: `60_000`
- **Request**: `range ∈ {"7d","30d","90d","ytd","all"}` (default `"30d"`)
- **Response 200**: `AnalyticsSummary` — `totalTrades`, `winRate`, `avgR`, `totalR`, `bestTradeR`, `worstTradeR`, `expectancy`, `equityCurve: EquityPoint[]` filtered to range, `byEngine`, `bySession`, `byMode`, `streak`
  - Server recomputes `totalR` from first/last `rRunning` within the range; client does the same in the mock (see `scaleSummaryForRange`) and expects parity.

### 3.2 `GET /analytics/equity?range=<AnalyticsRange>`

- **Hook**: `useAnalyticsEquity(range)`
- **Query key**: `["analytics","equity", range]`
- **Auth**: access-token
- **staleTime**: `60_000`
- **Response 200**: `AnalyticsEquitySeries` → `{ range, points: EquityPoint[], startingEquity, endingEquity, peakEquity, maxDrawdownR (2dp) }`

---

## 4. Macro (`/macro`)

Domain types: `src/types/macro.ts`.

### 4.1 `GET /macro/events`

- **Hook**: `useMacroEvents`
- **Query key**: `["macro"]`
- **Auth**: access-token
- **staleTime**: `60_000`
- **Response 200**: `MacroRadarEvent[]` ordered ascending by `at`

### 4.2 `GET /macro/events/:id`

- **Hook**: `useMacroEventDetail(id)`
- **Query key**: `["macro","event", id]`
- **Auth**: access-token
- **staleTime**: `60_000`
- **Response 200**: `MacroRadarEventDetail` → base event + `narrative`, `keyLevels? { support, resistance, invalidation }` (present for `category: "dxy"`), `relatedTradeIds?`, `updatedAt`
- **Response 404**: `{ code: "not_found" }`

---

## 5. Copilot (`/copilot`)

Domain types: `src/types/copilot.ts`.

### 5.1 `GET /copilot/conversations`

- **Hook**: `useCopilotConversations`
- **Query key**: `["copilot","conversations"]`
- **Auth**: access-token
- **staleTime**: `30_000`
- **Response 200**: `CopilotConversation[]` — `{ id, title, createdAt, updatedAt, messageCount, previewSnippet? }` ordered by `updatedAt` desc

### 5.2 `GET /copilot/conversations/:id`

- **Hook**: `useCopilotSession(id)`
- **Query key**: `["copilot","session", id]`
- **Auth**: access-token
- **staleTime**: `10_000`
- **Response 200**: `CopilotSession` (includes full `messages: CopilotMessage[]`)
- **Response 404**: `{ code: "not_found" }`

### 5.3 `GET /copilot/suggested-prompts`

- **Hook**: `useCopilotSuggestedPrompts`
- **Query key**: `["copilot","prompts"]`
- **Auth**: access-token
- **staleTime**: `Infinity` (static; rotated server-side via cache bust)
- **Response 200**: `CopilotSuggestedPrompt[]`

### 5.4 `POST /copilot/conversations/:id/messages`

- **Hook**: `useSendCopilotMessage`
- **Query key**: mutation (optimistic append to `["copilot","session", id]`; invalidates `["copilot","conversations"]`)
- **Auth**: access-token
- **Request**: `SendCopilotMessageInput` → `{ sessionId, content }`
- **Response 200**: `CopilotMessage` (role `"assistant"`, `status: "complete"`)

### 5.5 `POST /copilot/chat` (streaming)

- **Hook**: `useCopilotChat`
- **Query key**: mutation (invalidates `["copilot","session", chunk.conversationId]` and `["copilot","conversations"]` on completion)
- **Auth**: access-token
- **Request**: `CopilotChatRequest` → `{ conversationId?, prompt, context?: { tradeId?, range?: "7d"|"30d"|"90d" } }`
- **Transport**: Server-Sent Events (`text/event-stream`) or WebSocket — client treats each chunk as `CopilotChatResponseChunk`
- **Response stream**: sequence of `CopilotChatResponseChunk` → `{ conversationId, messageId, deltaText, status: "streaming" | "complete", citations? }`
- **Citations**: when `context.tradeId` is provided, the final chunk MUST include `citations: [{ label: "Trade <id>", tradeId }]`

---

## 6. Profile (`/users/me`)

Domain types: `src/types/user.ts`.

### 6.1 `GET /users/me` — see §1.4

### 6.2 `PATCH /users/me`

- **Hook**: `useUpdateProfile`
- **Query key**: mutation (sets `["user","me"]`)
- **Auth**: access-token
- **Request**: `UserProfilePatch` → partial of `{ displayName, tier, notifications, riskProfile, locale, timezone, onboardingCompletedAt }` (conditional-spread on server — never clobber unspecified fields)
- **Response 200**: full `UserProfile`

### 6.3 `POST /users/me/avatar`

- **Hook**: `useUploadAvatar`
- **Query key**: mutation (invalidates `["user","me"]`)
- **Auth**: access-token
- **Request**: `UploadAvatarInput` → `{ uri: string, mimeType: "image/png" | "image/jpeg", byteSize }`
- **Response 200**: `UploadAvatarResult` → `{ url: string, updatedAt: string }` where `url = https://cdn.tiwagold.app/avatars/<avId>.<ext>`
- **Response 413**: `{ code: "file_too_large", message, details: { maxBytes } }`

---

## 7. Settings (`/settings`)

Domain types: `src/types/settings.ts`.

### 7.1 `GET /settings/risk`

- **Hook**: `useRiskSettings`
- **Query key**: `["settings","risk"]`
- **Auth**: access-token
- **staleTime**: `60_000`
- **Response 200**: `RiskSettings` → `{ minRR, maxRiskPercent, allowedSessions, maxDataAgeMinutes, maxDailyDrawdownPct, maxOpenPositions, cooldownAfterLossMinutes }`

### 7.2 `PATCH /settings/risk`

- **Hook**: `useUpdateRiskSettings`
- **Query key**: mutation (sets `["settings","risk"]`)
- **Auth**: access-token
- **Request**: `RiskSettingsPatch` (partial of `RiskSettings`; conditional-spread server-side)
- **Response 200**: `RiskSettings`
- **Response 422**: `{ code: "invalid_risk_config", message, details: { field, reason } }`

### 7.3 `GET /settings/engine`

- **Hook**: `useEngineSettings`
- **Query key**: `["settings","engine"]`
- **Auth**: access-token
- **staleTime**: `60_000`
- **Response 200**: `EngineSettings` → `{ engines: EngineToggle[], autoApprove, autoApproveMinScore?, cooldownMinutes }`

### 7.4 `PATCH /settings/engine`

- **Hook**: `useUpdateEngineSettings`
- **Query key**: mutation (sets `["settings","engine"]`)
- **Auth**: access-token
- **Request**: `EngineSettingsPatch` → `{ engines?: EngineToggleUpdate[], autoApprove?, autoApproveMinScore?, cooldownMinutes? }`
  - `EngineToggleUpdate`: `{ tier, enabled?, minScore? }` — tier-keyed merge (no replace-all)
- **Response 200**: `EngineSettings`

---

## 8. Broker (`/broker/connections`)

Domain types: `src/types/broker.ts`. Broker credentials never round-trip to the client — the server stores them encrypted and returns only `BrokerConnection` (no secrets).

### 8.1 `GET /broker/connections`

- **Hook**: `useBrokerConnections`
- **Query key**: `["broker","connections"]`
- **Auth**: access-token
- **staleTime**: `30_000`
- **Response 200**: `BrokerConnection[]`

### 8.2 `GET /broker/connections/:id`

- **Hook**: `useBrokerConnection(id)`
- **Query key**: `["broker","connection", id]`
- **Auth**: access-token
- **staleTime**: `30_000`
- **Response 200**: `BrokerConnection`
- **Response 404**: `{ code: "not_found" }`

### 8.3 `POST /broker/connections`

- **Hook**: `useConnectBroker`
- **Query key**: mutation (invalidates `["broker","connections"]`)
- **Auth**: access-token
- **Request**: `BrokerConnectionInput` → `{ kind, accountLabel, server?, login?, password?, apiKey?, apiSecret?, environment? }`
- **Response 201**: `BrokerConnection` with `status="connected"`, `currency="USD"`
- **Response 422**: `{ code: "broker_auth_failed" | "broker_unreachable", message }`

### 8.4 `DELETE /broker/connections/:id`

- **Hook**: `useDisconnectBroker`
- **Query key**: mutation (invalidates `["broker","connections"]`, removes `["broker","connection", id]`)
- **Auth**: access-token
- **Request**: `DisconnectBrokerInput` → `{ id }`
- **Response 204**: no content

### 8.5 `PATCH /broker/connections/:id`

- **Hook**: `useUpdateBrokerConnection`
- **Query key**: mutation (invalidates `["broker","connections"]`, sets `["broker","connection", id]`)
- **Auth**: access-token
- **Request**: `UpdateBrokerConnectionInput` → `{ id, patch: BrokerConnectionPatch }` where `patch ⊂ { accountLabel, environment }`
- **Response 200**: `BrokerConnection`

### 8.6 `POST /broker/connections/:id/test`

- **Hook**: `useTestBroker`
- **Query key**: mutation (sets `["broker","connection", id, "test"]`)
- **Auth**: access-token
- **Request**: `TestBrokerInput` → `{ id }`
- **Response 200**: `BrokerConnectionTestResult` → `{ ok, latencyMs?, checkedAt, errorCode?, errorMessage? }`

---

## 9. Safety (`/safety/kill-switch`)

Domain types: `src/types/safety.ts`.

### 9.1 `GET /safety/kill-switch`

- **Hook**: `useKillSwitchStatus`
- **Query key**: `["safety","kill-switch"]`
- **Auth**: public (status is safe to expose pre-auth for ops monitoring; server may still gate on a lightweight session cookie)
- **staleTime**: `10_000`
- **Response 200**: `KillSwitchStatus` → `{ state: "armed"|"tripped"|"cooldown", reason?, trippedAt?, trippedBy?, cooldownEndsAt?, affectedTradeIds? }`

### 9.2 `POST /safety/kill-switch/confirm`

- **Hook**: `useConfirmKillSwitch`
- **Query key**: mutation (sets `["safety","kill-switch"]`, invalidates `["trades"]`)
- **Auth**: **signed-intent** (`purpose: "kill_switch.confirm"`, `subjectId: userId`)
- **Request**: `KillSwitchConfirmationInput` → `{ intentToken, confirmationPhrase: "STOP ALL TRADING", reason? }`
  - Server MUST reject if `confirmationPhrase !== "STOP ALL TRADING"` (exact match, case-sensitive, no whitespace trimming beyond outer)
- **Response 200**: `KillSwitchConfirmationResult` → `{ accepted: true, status: KillSwitchStatus, cancelledOrders, closedPositions, completedAt }`
- **Response 403**: `{ code: "intent_invalid" | "intent_expired" | "phrase_mismatch" }`

---

## 10. Signed-Intent challenge (`/auth/signed-intent`)

Used by any UI flow that calls a `signed-intent`-scoped mutation (§2.4, §2.5, §9.2).

### 10.1 `POST /auth/signed-intent/challenge`

- **Hook**: (implementation detail; lives in a future `useRequestSignedIntent` service hook)
- **Query key**: mutation
- **Auth**: access-token
- **Request**: `SignedIntentChallenge` (minus `nonce`, `issuedAt`, `expiresAt`) → `{ purpose: "trade.approve" | "trade.execute" | "kill_switch.confirm", subjectId: string }`
- **Response 200**: `SignedIntentChallenge` → `{ purpose, subjectId, nonce, issuedAt, expiresAt }` (TTL ≤ 60s)

### 10.2 `POST /auth/signed-intent/mint`

- **Request**: `{ challenge: SignedIntentChallenge, proof: { mfaCode?: string, deviceAttestation?: string } }`
- **Response 200**: `SignedIntent` → `{ token, purpose, subjectId, issuedAt, expiresAt }`
  - `token` is a short-lived JWS bound to `(userId, purpose, subjectId, nonce)`; single-use — server burns `nonce` on first successful consumption

---

## 11. Versioning

- This contract is **v1**. Any breaking change (field removal, semantic change, key-factory rename, auth-scope upgrade) bumps to **v2** and the client ships a parallel service module.
- Additive changes (new optional fields, new endpoints) are allowed in v1 and MUST remain backward-compatible.
- Query-key tuples are part of the contract — renaming a key is a breaking change (invalidation semantics depend on exact tuples).
- Mock parity: `src/services/*` is the canonical behavior reference for v1 until the server is live. PRs to services/types update this doc in the same diff.
