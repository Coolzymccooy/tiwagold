# Live cloud-api smoke + `eas build --profile preview` runbook

**Date:** 2026-05-08
**Audience:** the human running this on a machine with EAS CLI + Apple/Google credentials.
**Why this exists:** Phases L–S shipped overnight (signed-intent approve flow, push fan-out + deep links, engine-prefs cloud sync + cross-device hydration, bridge-token rotate hook + UI, signing-key warm cache). The agent cannot run `eas build` or hit the production cloud-api from its sandbox, so this doc captures the exact verification steps the human owner needs to run.

This runbook covers two pieces:

1. A **live cloud-api smoke test** — confirms the multi-tenant approve flow + push works end-to-end against `https://tiwa.tiwaton.co.uk`.
2. An **`eas build --profile preview` build** — produces an internal-distribution APK + iOS simulator build for Phases L–S.

---

## Part 1 — Live cloud-api smoke

### 1.1 Prereqs (one-off)

- A working test account on the live cloud (`https://tiwa.tiwaton.co.uk`). If you don't have one, register via the mobile app's onboarding or:
  ```sh
  curl -X POST https://tiwa.tiwaton.co.uk/auth/register \
    -H "x-api-key: $DEVICE_API_KEY" \
    -H "x-tiwa-device-token: $DEVICE_TOKEN" \
    -H "content-type: application/json" \
    -d '{"email":"smoke+1@tiwaton.co.uk","password":"<test>","displayName":"Smoke 1"}'
  ```
  Note the returned `accessToken` for the rest of the run.
- A second, **separate** test account if you want to exercise per-user scoping (recommended).
- The provisioning bearer token (`TIWA_PROVISIONING_KEY` on cloud) for the admin paths used in steps 1.4–1.5.

### 1.2 Auth realm sanity (Phase B / Tier 1)

```sh
ACCESS=<accessToken from register/login>

curl -fsS -H "Authorization: Bearer $ACCESS" \
  https://tiwa.tiwaton.co.uk/users/me | jq .
```

Expect: `{ user: { id, email, displayName, tier, createdAt } }`.

### 1.3 Engine prefs cloud sync (Phase N2 / Q)

```sh
# PUT new prefs
curl -fsS -X PUT \
  -H "Authorization: Bearer $ACCESS" \
  -H "content-type: application/json" \
  -d '{"engines":{"swing":true,"intraday":false,"scalp":true}}' \
  https://tiwa.tiwaton.co.uk/me/engine-prefs | jq .

# Read back
curl -fsS -H "Authorization: Bearer $ACCESS" \
  https://tiwa.tiwaton.co.uk/me/engine-prefs | jq .
```

Expect the GET to mirror the PUT exactly.

### 1.4 Broker connection + bridge-token rotate (Phase F / R)

Connect a broker via the mobile app's MT5 Connect card, then:

```sh
# Rotate bridge token; the JSON returned exposes the plaintext exactly once
curl -fsS -X POST \
  -H "Authorization: Bearer $ACCESS" \
  https://tiwa.tiwaton.co.uk/me/bridge-token/rotate | jq .
```

Expect: `{ bridgeToken: "<32-byte hex>", brokerConnectionId, rotatedAt }`. Save the token; the bridge container will need it.

### 1.5 Pending provisions admin endpoint (Phase G + provisioning daemon)

```sh
ADMIN=<TIWA_PROVISIONING_KEY>

curl -fsS -H "Authorization: Bearer $ADMIN" \
  "https://tiwa.tiwaton.co.uk/admin/broker-connections/pending?staleAfterMinutes=10" \
  | jq .
```

Expect a JSON array of `{ user_id, broker_connection_id, status, updated_at }` rows for users whose `pending_provisions` row is `pending` or has been stuck in `provisioning` for >10 min.

If the row you just connected in 1.4 is there, you can either:
- Run the provisioning daemon (see `apps/provisioning-daemon/README.md`) on the execution server, or
- Run `./provision.sh <user_id>` manually for that user.

### 1.6 Signed-intent approve flow (Phases I / J)

This is the full multi-tenant journey:

1. **Trigger a Tiwa signal** that fan-outs to your test user (the gold-monitor cron normally does this; if you can't trigger it manually, wait for the next hourly tick).
2. **Verify the user receives an Expo push** (Phase M) — check device notifications on the phone running the app.
3. **Tap the notification** — should deep-link to the Pending Signals tab (Phase N3).
4. **Tap a `PendingTradeCard`'s Approve button** — the mobile app builds a signed-intent JWT and POSTs it to `/me/trades/<id>/approve`.
5. **The MT5 bridge container** (provisioned in 1.5) polls the cloud, sees the approved intent, executes the trade on MT5, and writes back `executionState=executed` + `brokerTicket=<MT5 ticket>`.
6. **The mobile app** sees the trade flip to executed within a few seconds via TanStack Query polling.

If any step stalls, check:
- Cloud logs (`docker logs tiwa-cloud-api -f` on the cloud host) for fan-out / approve / refresh-token errors.
- Bridge container logs (`docker compose logs -f bridge` on the execution server) for poll / signature-verify / MT5 connect errors.

### 1.7 Per-user scoping sanity

If you have two test accounts, repeat 1.2–1.6 on the second account and confirm:

- Account A's `/users/me` returns A's row, B's returns B's.
- A's `/me/trades` does **not** include B's pending or executed trades.
- A's bridge container only sees signals fanned out to A.

These are covered by the cloud-side `per-user-scoping.test.ts` and `fan-out-execution.test.ts` integration tests, but smoking them on the live host catches deployment-config drift (e.g. wrong `JWT_SECRET`, missing migration).

---

## Part 2 — `eas build --profile preview`

### 2.1 Prereqs

- EAS CLI installed and you are logged in to the `coolzy` Expo account that owns this project (`projectId: 63a5ce76-d497-4fc2-ab61-efd6349d314f`).
- For the iOS simulator build: macOS with Xcode toolchain (or use the EAS cloud builder).
- For the Android APK: no local toolchain needed — the EAS cloud builder produces an `.apk`.

### 2.2 Wire the live backend in `app.json#extra`

The preview profile in `eas.json` does **not** override `extra`, so the values committed to `app.json` are baked into the build. Before kicking off the build, edit `app.json` and set:

```jsonc
"extra": {
  "USE_LIVE_BACKEND": true,
  "PERSONA_OVERSEER_BASE_URL": "https://tiwa.tiwaton.co.uk",
  "PERSONA_OVERSEER_API_KEY": "<the device-realm x-api-key>",
  "PERSONA_OVERSEER_DEVICE_TOKEN": "<the device-realm x-tiwa-device-token>",
  // ... leave the eas/router/etc. blocks untouched
}
```

Do **not** commit those secrets — flip them locally for the build, then revert before pushing. (If you want a permanent split between dev and preview, define a separate `extra.preview.*` block and read it via `Constants.expoConfig?.extra` in `liveBackend.ts`. That's a follow-up — out of scope here.)

### 2.3 Run the build

```sh
cd c:/Users/segun/source/repos/tiwagold/tiwagold

# Android internal APK
eas build --profile preview --platform android --non-interactive

# iOS simulator build
eas build --profile preview --platform ios --non-interactive
```

EAS will return an artifact URL when each finishes (typically 8–15 min for Android, 15–30 min for iOS).

### 2.4 Install on devices

- **Android (Pixel 7):** download the `.apk` from the EAS artifact URL and `adb install` or sideload it.
- **iOS Simulator:** download the `.tar.gz`, extract, drag the `.app` into a running simulator. Add iPhone SE (3rd gen) and iPhone 15 Pro simulators if not already present.

### 2.5 Device matrix smoke

Run through this checklist on each device — these are the items the agent reports as **pending human sign-off**:

- [ ] iPhone SE — onboard (register or log in), connect MT5, rotate bridge token, copy + verify token reveal modal closes cleanly.
- [ ] iPhone 15 Pro — same plus: Dynamic Island doesn't overlap the status pill, safe-area top inset is correct.
- [ ] Pixel 7 — same plus: gesture-back from Trade detail works, edge-to-edge bottom inset is correct, push notification tap deep-links to Pending Signals tab.
- [ ] On all three: trigger an approve flow (1.6 above) end-to-end and confirm executed-state shows brokerTicket.

### 2.6 What can fail and where to look

| Symptom | Likely cause | Where to look |
|---|---|---|
| App boots but every API call 403s | Wrong `PERSONA_OVERSEER_API_KEY` / `_DEVICE_TOKEN` in `app.json#extra` | Cloud logs: `device-token reject` |
| `LiveBackendDisabledError` in red overlay | `USE_LIVE_BACKEND` not flipped to `true` before build | Re-edit `app.json`, rebuild |
| Push notifications never arrive | Expo push token not registered for this user | Mobile: check `app/_layout.tsx` push registration logs; cloud: `select * from push_tokens where user_id = ...` |
| Approve button does nothing | Signed-intent JWT signing-key not warmed | Mobile: `useBootstrapSigningKey` — verify it ran on sign-in (see `auth.ts`) |
| Trade approved but never executes | Bridge container not running or MT5 creds wrong | Execution server: `docker compose logs bridge`; cloud: `select * from broker_connections where user_id = ...` |

---

## Part 3 — Reporting back

When you finish, file a one-line update in the project memory:

> Build #N (commit `<sha>`) — preview APK + iOS sim built, smoke pass on iPhone SE / iPhone 15 Pro / Pixel 7.

That closes the human sign-off line for Phases L–S.

---

**Agent-automated gate: PASS** — doc-only change, `npm run typecheck` / `lint` / `test` not affected.
**Human sign-off pending:** Live cloud-api smoke (steps 1.1–1.7), `eas build --profile preview` for Android + iOS, Device matrix (iPhone SE / iPhone 15 Pro / Pixel 7).
