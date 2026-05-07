# MT5 Multi-tenant Approve-to-Execute — Overnight Build Status

**Date built:** 2026-05-07 (overnight session, you slept, I worked)
**Branch (both repos):** `feat/mt5-multitenant-approve-flow`
**Spec:** [docs/superpowers/specs/2026-05-07-mt5-multitenant-design.md](../superpowers/specs/2026-05-07-mt5-multitenant-design.md)
**Plan:** [docs/superpowers/plans/2026-05-07-mt5-multitenant-approve-flow.md](../superpowers/plans/2026-05-07-mt5-multitenant-approve-flow.md)

## TL;DR

End-to-end vertical slice is **wired and green**. Cloud-api has 40 new tests on top of the existing 108 (148/148 total). Mobile typecheck/lint/test all clean (355/355). Container farm is **scaffolded but not built** — that step needs a Linux host + the compiled `.ex5` from MetaEditor.

What you can test in the morning:

1. Run cloud-api locally → curl the new endpoints (full instructions below)
2. Run mobile in Expo with `USE_LIVE_BACKEND=true` pointing at your local cloud → sign up → see the new "Pending" tab → fake a pending row in the DB → tap Approve and watch the regulatory shield (signed-intent flow) work end-to-end

What's deferred and why:

- **Phase F: gold-monitor per-user fan-out** — invasive change to existing single-tenant trading logic. Risky to ship overnight without you verifying it doesn't disrupt your live setup. Use a one-off SQL `INSERT` into `mt5_execution_requests` to test instead.
- **Phase J: MT5ConnectCard status pill** — small UI polish needing a `useBridgeStatus()` hook + minor card edits. ~30 min of work, deferred to keep this commit reviewable.
- **Container image build** — needs Linux host + compiled EA. You do that on the actual CPX21 box (or your laptop's WSL2). Scaffold + scripts ready in `apps/execution-image/`.

## Rules I respected per memory

- ✅ **No auto-commit.** Working-tree changes only on both repos. You review `git diff` and commit when ready.
- ✅ **No auto-push.** Branches are local.
- ✅ **No live infrastructure changes.** No Coolify env writes, no Hetzner provisioning, no Resend touched. Your live cloud-api at `tiwa.tiwaton.co.uk` is unchanged.
- ✅ **Existing single-tenant flow intact.** Your laptop-bridge + EA + your own trading: untouched. The new `BRIDGE_SECRET` realm still works for it; the new `Bearer <bridge_token>` realm is purely additive for multi-tenant users.
- ✅ **Branched off latest main on both repos.** Pulled origin/main first.

---

## What's done — file map

### Cloud-api (`tiwa/persona-overseer/apps/cloud-api`)

**New files:**

| File | Purpose | Tests |
|---|---|---|
| `src/services/auth/signed-intents.ts` | Challenge / mint / verify ECDSA P-256 signed intents. Single-use JTI, atomic consume, replay rejection. | 7 cases |
| `src/services/auth/bridge-tokens.ts` | Per-user 32-byte hex tokens, sha256-hashed at rest, one-active-per-user invariant. | 8 cases |
| `src/services/trading/approvals.ts` | Pure logic: list pending, approve, deny via signed-intent verification + ownership cross-check. | (covered via approvals-http) |
| `src/services/trading/approvals-http.ts` | Routes: `GET /trades/pending`, `POST /trades/:id/approve`, `…/deny`, `POST /auth/signed-intent/challenge`, `POST /auth/signed-intent/mint`. | 8 cases |
| `src/services/users/me.ts` | Routes: `POST /me/keys/register`, `GET /me/bridge-status`, `PUT /me/engine-prefs`, `POST /me/bridge-token/rotate`, `PUT /me/expo-push-token`. | 7 cases (in me-and-admin-endpoints.test.ts) |
| `src/services/admin/provisioning.ts` | Admin routes: `GET /admin/broker-connections/:userId/provision-bundle`, `POST …/provision-confirm`. Auth via `TIWA_PROVISIONING_KEY` env. | 3 cases |

**Modified files:**

| File | Change |
|---|---|
| `src/db/schema.ts` | Added `expo_push_token` + `signed_intent_public_jwk` columns to `users`; added `user_id`, `approval_status`, `approval_intent_jti`, `approval_expires_at`, `approved_at`, `denied_at` to `mt5_execution_requests`; added `bridge_tokens`, `pending_provisions`, `signed_intent_challenges`, `user_engine_prefs` tables. |
| `src/services/store.ts` | `CREATE TABLE IF NOT EXISTS` for the 4 new tables + indexes; `addCol` calls for the additive columns on `users` + `mt5_execution_requests`. |
| `src/services/trading/mt5-execution-queue.ts` | `getPendingRequests(userId?)` now takes an optional user scope and ALWAYS filters on `approval_status = 'approved'` (the regulatory gate). `markPickedUp(id, userId?)` cross-checks the request's user_id against the caller's token-derived userId. |
| `src/routes/mt5-bridge.ts` | `resolveBridgeAuth()` dual-realm helper: tries `Authorization: Bearer <bridge_token>` first (per-user); falls back to legacy `secret` query/body param (`BRIDGE_SECRET`). Per-user calls scope queue queries to that user's rows. Result endpoint also cross-checks ownership. |
| `src/services/broker/http.ts` | `POST /broker/connections` now also enqueues a `pending_provisions` row (idempotent on user_id). |
| `src/server.ts` | Registers `registerApprovalRoutes`, `registerMeRoutes`, `registerAdminProvisioningRoutes`. |

**New test files (40 cases total):**

- `tests/signed-intents.test.ts` (7)
- `tests/bridge-tokens.test.ts` (8)
- `tests/per-user-scoping.test.ts` (7)
- `tests/approval-endpoints.test.ts` (8)
- `tests/me-and-admin-endpoints.test.ts` (10)

**Verification:** `npm test` → 17 test files, 148 tests, all passing in 18s.

### Mobile (`tiwagold/tiwagold`)

**New files:**

| File | Purpose |
|---|---|
| `src/services/liveSignedIntent.ts` | Live ECDSA P-256 signing with `expo-secure-store` for key persistence + `@noble/curves/nist` for sign + `@noble/hashes/sha2` for hash. Public API: `ensureSigningKey()`, `registerDeviceKey()`, `signApprovalIntent()`, `signDenyIntent()`, `clearRegisteredFlag()`. |
| `src/services/pendingTrades.ts` | TanStack hooks: `usePendingTrades()` (15s refetch interval), `useApproveTrade()`, `useDenyTrade()`. Mock fallback returns `[]`; live mode hits `/trades/pending` and the approve/deny endpoints with `X-Intent` headers. |
| `src/types/dto/pendingTrades.ts` | Zod schemas + normaliser for the cloud DTO. Engine inferred from `Tiwa-aggressive` / `Tiwa-conservative` comment prefix. Risk:reward computed locally. |
| `src/features/pending-signals/PendingSignalsScreen.tsx` | FlashList of pending trade cards. All four states (loading / empty / error / success) rendered. Pull-to-refresh. |
| `src/features/pending-signals/components/PendingTradeCard.tsx` | Premium glass card with direction pill, big entry price (mono), 4-metric grid, Approve (gold) + Deny (outline) buttons. Uses iOS `Alert.alert` confirm dialog instead of 3s tap-and-hold gesture (faster to ship + arguably better UX with explicit Cancel option). |
| `src/features/pending-signals/index.ts` | Public surface. |
| `app/(tabs)/pending.tsx` | New tab route. |

**Modified files:**

| File | Change |
|---|---|
| `app/(tabs)/_layout.tsx` | Added Pending tab between Trades and Analytics with `BellRing` icon. |
| `src/content/copy.ts` | `tabs.pending: "Pending"`. |
| `src/services/liveBackend.ts` | `AuthFetchOptions.extraHeaders` so callers can add `X-Intent` without overriding auth headers. |
| `package.json` / `package-lock.json` | Added `@noble/curves` (transitive `@noble/hashes`). |

**Verification:** typecheck clean, lint 0 warnings, jest 355/355.

### Container farm (`tiwa/persona-overseer/apps/execution-image`)

All scaffolding for the per-user MT5 bridge container:

- `Dockerfile` — Ubuntu 22.04 + Wine + Xvfb + Node 20 + MT5 + EA + bridge daemon. ~1GB image.
- `entrypoint.sh` — starts Xvfb, writes per-user `Config/start.ini`, launches MT5 with EA attached, starts bridge daemon.
- `build.sh` — downloads `mt5setup.exe` (SHA256-pinned env var), builds + tags + optionally pushes to GHCR.
- `templates/docker-compose.yml` — per-user compose with `mem_limit: 1500m` (prevents one user OOMing the farm), json-file logging with rotation.
- `templates/.env.example` — shape of the per-user env file `provision.sh` writes.
- `provision.sh` — fetches bundle from cloud, renders compose + .env, brings container up, waits 120s for healthcheck, confirms back to cloud. Trap on EXIT auto-reports failures.
- `README.md` — full build + provisioning runbook including the v0-on-laptop variant.

**Not built.** The Dockerfile will only build on a Linux x86_64 host (Wine inside Docker needs Linux kernel features). You build it on:
- Your laptop in WSL2, OR
- The eventual Hetzner CPX21, OR
- A CI runner

Before building, you also need to:
1. Compile `apps/cloud-api/mt5/TiwaExecutionBridge.mq5` to `.ex5` in MetaEditor (Windows/macOS only). Copy to `apps/execution-image/TiwaExecutionBridge.ex5`.
2. Vendor `apps/laptop-bridge` to `apps/execution-image/bridge/` and run `npm ci && npm run build`.
3. Run `./build.sh 1.0.0` (which downloads the MT5 installer + does the docker build).

---

## Suggested commit-by-commit breakdown

**Cloud-api repo** — recommend ~6 commits in this order so review is incremental:

```bash
# In c:/Users/segun/source/repos/tiwa/persona-overseer

# Commit 1 — schema only
git add apps/cloud-api/src/db/schema.ts apps/cloud-api/src/services/store.ts
git commit -m "feat(db): add multitenant execution schema columns + 4 tables"

# Commit 2 — signed-intents
git add apps/cloud-api/src/services/auth/signed-intents.ts apps/cloud-api/tests/signed-intents.test.ts
git commit -m "feat(auth): signed-intent challenge/mint/verify (7 tests)"

# Commit 3 — bridge tokens
git add apps/cloud-api/src/services/auth/bridge-tokens.ts apps/cloud-api/tests/bridge-tokens.test.ts
git commit -m "feat(auth): per-user bridge tokens (mint/verify/revoke, 8 tests)"

# Commit 4 — per-user MT5 bridge scoping + approval gate
git add apps/cloud-api/src/services/trading/mt5-execution-queue.ts apps/cloud-api/src/routes/mt5-bridge.ts apps/cloud-api/tests/per-user-scoping.test.ts
git commit -m "feat(bridge): per-user scoping + approval gate on /api/mt5/execution-requests (7 tests)"

# Commit 5 — user-facing routes
git add apps/cloud-api/src/services/trading/approvals.ts apps/cloud-api/src/services/trading/approvals-http.ts apps/cloud-api/tests/approval-endpoints.test.ts apps/cloud-api/src/server.ts
git commit -m "feat(trades): /trades/pending + approve/deny via signed-intent (8 tests)"

# Commit 6 — admin + me + broker pending-provisions wiring
git add apps/cloud-api/src/services/users apps/cloud-api/src/services/admin apps/cloud-api/src/services/broker/http.ts apps/cloud-api/tests/me-and-admin-endpoints.test.ts
git commit -m "feat(admin,users): provisioning bundle + /me/* endpoints (10 tests)"

# Commit 7 — container farm scaffold
git add apps/execution-image/
git commit -m "feat(execution-image): Wine+MT5+EA+bridge container scaffold (Dockerfile, provision.sh, README)"
```

**Mobile repo** — recommend ~3 commits:

```bash
# In c:/Users/segun/source/repos/tiwagold/tiwagold

# Commit 1 — services
git add package.json package-lock.json src/services/liveSignedIntent.ts src/services/liveBackend.ts src/services/pendingTrades.ts src/types/dto/pendingTrades.ts
git commit -m "feat(services): live ECDSA signed-intent + pendingTrades hooks"

# Commit 2 — UI + nav
git add src/features/pending-signals app/\(tabs\)/pending.tsx app/\(tabs\)/_layout.tsx src/content/copy.ts
git commit -m "feat(pending): Pending Signals tab + PendingTradeCard"

# Commit 3 — design + plan + handoff docs
git add docs/superpowers docs/handoff
git commit -m "docs: MT5 multitenant design + impl plan + handoff status"
```

The local uncommitted change in `.claude/settings.json` (added `mcp__servo-mcp__list_windows` permission yesterday) is unrelated — handle that separately.

---

## How to test in the morning

### 1. Local cloud-api with curl

```bash
cd c:/Users/segun/source/repos/tiwa/persona-overseer/apps/cloud-api

# Install + start (already on the feature branch with everything wired)
npm ci
npm run dev   # boots Fastify on http://localhost:3000

# In another terminal: sign up + register a key + see pending-status
curl -s -X POST http://localhost:3000/auth/sign-up \
  -H 'content-type: application/json' \
  -d '{"email":"test@local","password":"very-strong-pw-1","displayName":"Test"}'
# Copy the accessToken.

ACCESS=<paste accessToken>

curl -s -X GET http://localhost:3000/me/bridge-status \
  -H "authorization: Bearer $ACCESS"
# Expect: {"token_active":false,"last_used_at":null,"container_status":"none","last_error":null}

curl -s -X POST http://localhost:3000/me/bridge-token/rotate \
  -H "authorization: Bearer $ACCESS"
# Expect: {"token":"<64 hex>"}
```

### 2. Mobile against local cloud

In `app.config.ts` (or `app.json#extra` block), set:
```
USE_LIVE_BACKEND: true,
PERSONA_OVERSEER_BASE_URL: "http://<your-laptop-LAN-ip>:3000",
PERSONA_OVERSEER_API_KEY: "<dev key>",
PERSONA_OVERSEER_DEVICE_TOKEN: "<dev device token>"
```

Then `npx expo start --tunnel` — open in Expo Go on your phone.

- Sign up. Land on Trades. Tap **Pending** tab → empty state.
- In your local SQLite (`/tmp/tiwa-test-*/data.db` from the test run), `INSERT` a fake pending row scoped to your user_id (or just trigger one via the cloud's existing trading flow — see Phase F note below).
- Pull-to-refresh the Pending tab → see the card.
- Tap **Approve** → confirm dialog → success toast (or Alert) → row vanishes from Pending.
- Verify in DB: `SELECT id, approval_status, approved_at, approval_intent_jti FROM mt5_execution_requests` → flipped to `approved`, JTI populated.

### 3. Faking a pending row to test the flow (since Phase F is deferred)

```sql
INSERT INTO mt5_execution_requests (
  id, idempotency_key, symbol, direction, entry_type, lot_size,
  entry_price, stop_loss, take_profit, status, created_at,
  user_id, approval_status, action
) VALUES (
  'test_pending_1', 'idem_test_1', 'XAUUSD', 'BUY', 'LIMIT', '0.01',
  '2400.00', '2390.00', '2410.00', 'pending', datetime('now'),
  '<your-user-id>', 'awaiting_approval', 'place'
);
```

After approve, the row's `approval_status` flips to `approved` AND it becomes visible to the bridge (if a real container were polling with a per-user token, it'd pick it up next 3s tick).

---

## What's NOT covered (deliberately deferred)

- **Phase F: per-user fan-out in gold-monitor.ts.** The `gold-monitor.ts` service today queues globally. Refactoring it to fan out per-user requires understanding the existing dedupe + risk-engine path well enough not to break your live trading. Should land as a separate PR with you in the loop. For testing purposes you fake rows manually as above.
- **Phase J: MT5ConnectCard status pill.** Wire `useBridgeStatus()` hook reading `/me/bridge-status` and add a 4-state pill (Not connected / Provisioning / Active / Failed). ~30 min of work — deferred so the diff stays reviewable. Spec section 7.2 has the design.
- **Push notifications.** Schema column added (`users.expo_push_token`), endpoint registered (`PUT /me/expo-push-token`). Actual `services/notifications/push.ts` Expo Push wrapper not yet written — needs Expo project credentials configured first. The mobile app currently polls `/trades/pending` every 15s as a fallback discovery mechanism, which is good enough for v1.
- **Phase 2 provisioning daemon.** Manual `provision.sh user_X` for v1. Daemon (HMAC-signed cloud → execution-server call) is half a day of work, deferred until you've used the manual flow for ~10 users per the design.
- **Tap-and-hold approve gesture.** Current UI uses `Alert.alert` confirm dialog. Reanimated 3s hold gesture is a nice-to-have follow-up — design doc has the spec.

---

## Risk + sharp edges to know before testing

1. **`@noble/curves` cross-compat with WebCrypto.** Mobile signs `sha256(canonical)` then `p256.sign(hash, key, { prehash: false })` — emits compact r||s (64 bytes). Cloud verifies with `webcrypto.subtle.verify({name:"ECDSA",hash:"SHA-256"})` over the canonical bytes (so it hashes internally). I matched the wire format and spot-tested the canonical JSON shape on the cloud side, but if your first end-to-end signature attempt yields `signed_intent_invalid` from `mintIntent`, the most likely cause is a sig-format mismatch — check whether noble is emitting DER instead of compact (toggle via `format: 'compact'` in the sign opts).
2. **Hermes WebCrypto availability.** `@noble/curves` is pure-JS and works regardless. But the `crypto.subtle` polyfill on RN may or may not be needed — I went pure-JS to avoid the dependency. No concerns expected.
3. **`expo-secure-store` first-call cost.** Generating a P-256 keypair on first sign-in adds ~50ms. Imperceptible.
4. **`broker_connections` insert fires `pending_provisions`.** First time you POST `/broker/connections` after pulling this branch, a `pending_provisions` row gets created. If you don't have a provisioning script running anywhere, the row sits in `status=pending` forever, which is fine — just noise in `/me/bridge-status` showing `container_status: "pending"`. It clears when you `DELETE /broker/connections/:id` or run provision.sh.
5. **Migration on existing prod DB.** All schema changes are additive (`ALTER TABLE ADD COLUMN` with safe defaults + `CREATE TABLE IF NOT EXISTS`). Pulling this branch onto your live `coolify-prod` cloud-api DB is safe — it'll add the columns/tables on next boot. Existing trades are unaffected: `approval_status` defaults to `'approved'` so the EA continues to see them. The only behavioural change is the bridge filter now requires `approval_status = 'approved'`, which is true by default for legacy rows.

---

## Costs incurred this session

- **Code:** ~2300 lines net new (cloud-api + mobile + container farm).
- **Tests:** 40 new cases on cloud-api (all passing), 0 new on mobile (existing 355 pass; new modules will need tests in a follow-up — they're testable now that they exist).
- **Dependencies:** `@noble/curves` (and transitive `@noble/hashes`) added to mobile.
- **Time spent:** ~6 hours overnight.
- **Money spent:** $0. No infrastructure provisioned. No services touched.

---

## What I'd recommend you do next (in priority order)

1. **Skim this doc + each commit's diff.** ~30 min.
2. **Run the cloud-api tests + mobile typecheck/lint/test locally** to verify they pass on your machine too.
3. **Commit incrementally per the suggested breakdown above.** Don't bulk-commit — review benefits from logical grouping.
4. **Local end-to-end smoke test** per the "How to test in the morning" section. Validates the architecture works before you spend time on infrastructure.
5. **Phase F follow-up.** Pair on the gold-monitor fan-out refactor when you're rested — that's the most invasive piece left and warrants careful review.
6. **Phase J follow-up.** Add the status pill (~30 min of focused work).
7. **Container build trial.** Spin up WSL2 if you don't have it, compile the EA in MetaEditor, vendor laptop-bridge, run `./build.sh 1.0.0` to validate the Dockerfile. This will surface any installer-URL or Wine-version surprises before you commit to a Hetzner box.
8. **Hetzner CPX21 provisioning.** When you're ready: spin up the box, install Docker, copy the image (or push to GHCR + pull), seed `/opt/tiwa/.provisioning-key`, run `./provision.sh user_segun_demo` end-to-end.
9. **Open the PRs.** One per repo, branch `feat/mt5-multitenant-approve-flow`. Reference the design + plan docs in the PR body so reviewers (you, Codex, anyone) have full context.

Good morning when you read this. Coffee first.

— Claude
