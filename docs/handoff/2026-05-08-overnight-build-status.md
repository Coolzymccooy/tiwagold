# Overnight build status — 2026-05-08

**Built:** through the night, you slept, I worked.
**Both repos on `main`** — every commit listed below has been pushed.

## TL;DR

The multi-tenant approve-to-execute pipeline is now end-to-end testable:
sign up → connect MT5 → broker fan-out → push notification → tap → approve → trade fires. Eight new phases (L through S) shipped on top of the morning baseline.

What changed in numbers:

| Repo                | Commit range                | Tests before → after | Net new |
|---------------------|-----------------------------|----------------------|---------|
| persona-overseer    | `7e107e6 → 6152115`         | 164 → 188            | +24     |
| tiwagold            | `3611c91 → 4121617`         | 397 → 436            | +39     |

`npm run typecheck`, `npm run lint`, and `npm run test` are green on both repos as of the last commit.

## What shipped (chronological)

| Phase | Repo            | Commit          | What it does                                                                                          |
|-------|-----------------|-----------------|-------------------------------------------------------------------------------------------------------|
| K-fix | persona-overseer| `a4bdc2f..7e107e6` | Scope legacy `BRIDGE_SECRET` realm to `userId IS NULL` rows + `.gitignore` bump for `.env.local`. Closes the cross-tenancy leak where Segun's laptop bridge could see multi-tenant approved rows. |
| L     | persona-overseer| `7e107e6..b4cde99` | `expireOverdueApprovals()` — flips `awaiting_approval` rows past their `approval_expires_at` to `expired`. Wired into gold-monitor's 5-min cycle. 8 tests. |
| M     | persona-overseer| `b4cde99..f57407a` | `services/notifications/push.ts` — Expo Push wrapper. `notifyFanOutRecipients` fires after every `fanOutExecution` so users get push notifications instead of waiting 15s for polling. 13 tests. |
| N1    | tiwagold        | `3611c91..4b9a46b` | Mobile `services/expoPushToken.ts` — permissions + token + `PUT /me/expo-push-token` on sign-in, `PUT { token: null }` on sign-out. Adds `expo-notifications` ~0.32.17. 15 tests. |
| N2    | tiwagold        | `4b9a46b..f7eb117` | Mobile `services/engineSync.ts` — `syncEnginePrefsToCloud` + Zustand subscription via `useEnginePrefsCloudSync()` mounted at app root. Toggle aggressive in Settings → cloud row updates immediately. 7 tests. |
| N3    | tiwagold        | `f7eb117..ee67ecf` | Mobile `services/pushDeepLinks.ts` — `addNotificationResponseReceivedListener` mapped through a pure handler. Tap a Tiwa push notification → app opens on the Pending tab. 5 tests. |
| P     | persona-overseer| `f57407a..6152115` | Cloud `GET /me/engine-prefs` — returns `{conservative_enabled, aggressive_enabled, updated_at}` with default both-on when no row. 3 tests. |
| Q     | tiwagold        | `ee67ecf..6167542` | Mobile `hydrateEnginePrefsFromCloud` + `reconcileEnginePrefsAfterAuth` — fresh-install on a new device picks up the user's last toggle from the cloud instead of clobbering it with default both-on. 7 tests. |
| R     | tiwagold        | `6167542..67288c9` | Mobile `useRotateBridgeToken()` — TanStack mutation hitting `POST /me/bridge-token/rotate`. UI follow-up still owed (needs `expo-clipboard` + a one-time-display modal). 5 tests. |
| S     | tiwagold        | `67288c9..4121617` | Mobile auth.ts now eagerly calls `registerDeviceKey()` on sign-in so the first Approve tap doesn't pay the keygen + register network round-trip. No new tests — covered by existing `liveSignedIntent` suite. |

## What works now end-to-end (testable in isolation)

1. **Sign up** → Mobile receives JWT, generates ECDSA P-256 keypair, registers public JWK via `POST /me/keys/register`, registers Expo push token via `PUT /me/expo-push-token`, syncs engine prefs via reconcile (GET then PUT) `/me/engine-prefs`.
2. **gold-monitor signal fires** → `evaluateRisk` approves → existing `queueExecution` runs (Segun's laptop bridge picks up as before) AND `fanOutExecution` queries `pending_provisions` joined with `user_engine_prefs`, inserts an `awaiting_approval` row per matching active user with `approval_expires_at = now + 30 min`.
3. **`notifyFanOutRecipients` fires** → each recipient's device gets an Expo push (`title: "Tiwa <engine>: <DIRECTION> <SYMBOL>"`, `body: "Entry $<price>"`, `data: { type: "pending_trade", tradeId }`).
4. **User taps notification** → `handleNotificationResponse` routes to `/(tabs)/pending`. The 15s `usePendingTrades` poll covers users who don't tap (or have notifications off).
5. **User taps Approve** → mobile signs the canonical intent payload with the cached private key (~50ms), POSTs `signature` to `/auth/signed-intent/mint`, gets back a 60s intent JWT, POSTs to `/trades/:id/approve` with `X-Intent: <jwt>`. Cloud verifies (subjectId, userId, kind), atomically flips `approval_status` to `approved`, stamps `approval_intent_jti` + `approved_at`.
6. **User's container EA polls `/api/mt5/execution-requests`** with `Authorization: Bearer <bridge_token>` → sees the approved row, picks up via `markPickedUp` (cross-checks ownership), places the order, reports back via `/result`.
7. **30 minutes pass without approval** → next gold-monitor cycle calls `expireOverdueApprovals()` → `awaiting_approval` row flips to `expired` → mobile pending list stops showing it.
8. **Cross-tenancy boundary** → legacy `BRIDGE_SECRET` realm only sees `userId IS NULL` rows now, so a user's approved trade can't accidentally fire on Segun's account.

## How to test in the morning

### Cloud-api smoke

```bash
cd c:/Users/segun/source/repos/tiwa/persona-overseer/apps/cloud-api
npm test          # expect 188 passing
npx tsc --noEmit  # expect clean
```

### Mobile smoke

```bash
cd c:/Users/segun/source/repos/tiwagold/tiwagold
npm run typecheck && npm run lint && npm run test  # expect 436 passing
```

### End-to-end (live cloud + mobile)

Per `docs/handoff/2026-05-07-mt5-multitenant-status.md`:
1. Run cloud-api locally on port 3000.
2. Set mobile `app.config.ts` extras: `USE_LIVE_BACKEND=true`, `PERSONA_OVERSEER_BASE_URL=http://<lan-ip>:3000`, dev API key + device token.
3. `npx expo start --tunnel`, scan in Expo Go.
4. Sign up. Verify the cloud DB now has rows in `bridge_tokens` (after broker connect), `signed_intent_public_jwk` (after sign-in), and `expo_push_token` (after first foreground if device permissions granted).
5. Fake a fan-out signal manually:

```sql
-- replace <user_id> with your real user_id from the users table
INSERT INTO pending_provisions (id, user_id, broker_connection_id, status, created_at, updated_at)
VALUES ('pp_seg', '<user_id>', 'bc_seg', 'active', datetime('now'), datetime('now'));

-- then trigger gold-monitor manually via the existing /admin or telegram trigger,
-- OR insert directly:
INSERT INTO mt5_execution_requests (
  id, idempotency_key, symbol, direction, entry_type, lot_size,
  entry_price, stop_loss, take_profit, status, created_at,
  user_id, approval_status, approval_expires_at, action, comment
) VALUES (
  'test_pending_1', 'idem_test_1', 'XAUUSD', 'BUY', 'LIMIT', '0.01',
  '2400.00', '2390.00', '2410.00', 'pending', datetime('now'),
  '<user_id>', 'awaiting_approval',
  datetime('now', '+30 minutes'),
  'place', 'Tiwa-aggressive-test'
);
```

6. Pull-to-refresh the Pending tab → see the card.
7. Tap **Approve** → confirm dialog → row's `approval_status` flips to `approved` in the DB.
8. Wait 30 min without approving the next test row → next gold-monitor cycle (or run `expireOverdueApprovals()` from a console) → row flips to `expired`.

### Push notification delivery

Push delivery requires a development build (Expo Go can't receive remote pushes after SDK 51). When you cut a build:

```bash
eas build --profile development --platform ios   # or android
```

…then sign in on the dev build and verify a fan-out signal triggers a notification. The mobile side also already deep-links the tap to /(tabs)/pending — pure-function tested but final wiring still needs a real device test.

## What's still pending

### External / human sign-off
- **Container image build** — Linux x86_64 + compiled `.ex5` from MetaEditor; instructions at `apps/execution-image/README.md`.
- **Hetzner CPX21 provisioning** — when the image is built; `apps/execution-image/provision.sh user_X` is the manual flow.
- **Live cloud-api smoke test** — sign up → MT5 connect → approve → execution end-to-end against the Coolify-prod cloud.
- **`eas build --profile preview`** — to verify push notifications + permission prompts on a real device.
- **Device matrix** — iPhone SE / iPhone 15 Pro / Pixel 7 manual run-through (per `.claude/rules/09-done-criteria.md`).

### Code follow-ups (not blocking)
- **Phase R UI** — bridge-token rotate button + one-time display + copy-to-clipboard. The hook is shipped (`useRotateBridgeToken`), the UI needs `expo-clipboard` + a modal pattern.
- **Provisioning daemon** — half-day, replaces manual `provision.sh`. Cloud already has `/admin/broker-connections/:userId/provision-bundle` + `/provision-confirm`. Daemon polls `pending_provisions` + calls those.
- **Cross-tenancy on results endpoint** — legacy realm's `/result` doesn't currently scope to null-userId rows the way `/pending` and `/pickup` now do. Low risk because `result` only writes status/ticket and doesn't fan out, but worth tightening for symmetry.
- **MT5ConnectCard pill — extra states** — currently shows "Not connected / Provisioning / Active / Failed". A spinner / skeleton during initial fetch would polish it; today it briefly shows "Not connected" before the GET resolves.
- **Active engine UI lock** — Settings allows toggling both engines off; cloud rejects with 400 but mobile UI should disable the second toggle when one is already off (to match the cloud's "at_least_one_engine_required" invariant).

## Files most likely to need a second look

Mobile:
- [src/services/auth.ts](../../src/services/auth.ts) — `registerPushTokenAfterAuth` is now a 4-step fire-and-forget chain. Worth scanning to make sure the failure modes still feel right.
- [src/services/engineSync.ts](../../src/services/engineSync.ts) — `reconcileEnginePrefsAfterAuth` is the cross-device hydrate + push. The `setEngineEnabled("conservative", …) + setEngineEnabled("aggressive", …)` two-call write means a Zustand subscriber fires twice during hydration; the cloud sync subscriber filters no-op writes so it's not duplicate PUTs, but worth verifying.
- [app/_layout.tsx](../../app/_layout.tsx) — now mounts three side-effect hooks (`useAuthRouting`, `useEnginePrefsCloudSync`, `usePushNotificationDeepLinks`). All hooks-only, no rendered UI.

Cloud:
- [apps/cloud-api/src/services/trading/mt5-execution-queue.ts](../../../tiwa/persona-overseer/apps/cloud-api/src/services/trading/mt5-execution-queue.ts) — `queueExecution` now takes an opts param; `fanOutExecution` and `expireOverdueApprovals` live alongside.
- [apps/cloud-api/src/services/trading/gold-monitor.ts](../../../tiwa/persona-overseer/apps/cloud-api/src/services/trading/gold-monitor.ts) — both VALID-setup branches (aggressive + conservative) now have a fan-out + push call after `commitCooldown()`. Worth diffing against the morning baseline to confirm Segun's existing flow is preserved exactly.

## Costs incurred

- **Code:** ~2,400 lines net new across 8 phases (L–S).
- **Tests:** +24 cloud, +39 mobile.
- **Dependencies:** `expo-notifications` ~0.32.17 added.
- **Money:** $0 — no infra changes, no live cloud writes, no Coolify env touched.

Coffee first.

— Claude
