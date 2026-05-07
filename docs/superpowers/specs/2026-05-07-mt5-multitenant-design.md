# MT5 multi-tenant approve-to-execute — design

- **Date:** 2026-05-07
- **Author:** Segun (with Claude Code as principal developer)
- **Status:** Draft for user review
- **Repos affected:** `tiwagold/tiwagold` (mobile), `tiwa/persona-overseer/apps/cloud-api` (backend), new `tiwa/persona-overseer/apps/execution-server` (container farm host) and new image `apps/execution-image` (Wine+MT5+EA)
- **Sprint label:** Path C — multi-tenant pivot, sprints C.3 (mobile broker connect end-to-end) and C.4 (per-user signals + execution)

## 1. Goal

Let real users sign up to Tiwa Gold, attach their own MT5 account, receive Tiwa's XAU/USD signals filtered to their setup, and tap **Approve** in the mobile app to have Tiwa place that single trade on their broker. No copy-trading. No discretionary authority. No user-side install. Tiwa runs the execution infrastructure on its own cloud.

## 2. Non-goals

- **Auto-execution.** Every entry must have an explicit per-trade signed-intent approval from the user. No "auto-approve matching signals" toggle. Discretionary execution is regulatorily distinct (copy-trading regulation territory) and out of scope.
- **Multi-asset.** XAU/USD only, per project rules.
- **Multiple broker types.** v1 is MT5 only. cTrader, OANDA, paper accounts are deferred — schema is shaped for them via `broker_connections.kind` but only `mt5` is wired.
- **MetaApi or other paid third-party gateways.** Killed during brainstorming on cost grounds. Tiwa runs its own container farm reusing the existing TiwaExecutionBridge.mq5 + laptop-bridge code.
- **Web app.** Mobile-only, dark-mode-only, per project rules.
- **Public app store launch.** Out of scope; closed beta only at the end of this design's lifecycle.

## 3. Background — what already exists

### 3.1 Cloud-api (single-tenant, in production)

- `gold-monitor.ts` checks XAU/USD every 5 minutes, generates signals, queues executions via `mt5-execution-queue.ts`. Idempotency-keyed.
- `mt5-bridge.ts` exposes `GET /api/mt5/execution-requests` (poll), `POST .../pickup` (claim), `POST .../result` (report fill). Auth via shared `BRIDGE_SECRET` header.
- `broker_connections` table (from C.2) stores per-user encrypted MT5 creds (AES-256-GCM, base64 `iv|tag|ciphertext`), JWT-protected CRUD already shipped.
- `validateCredentialsStub()` in `services/broker/connections.ts` is a shape-check only — no real MT5 handshake yet.
- Telegram approval UI exists for coding-job workflows but is **not** wired to MT5 trades. MT5 trades currently auto-execute after EA pickup.

### 3.2 Bridge layer

- `apps/cloud-api/mt5/TiwaExecutionBridge.mq5` (v1.05) — MQL5 EA running inside MT5 on Segun's laptop. Polls cloud every 3s, executes `place | cancel | modify_sltp | partial_close`, manages persistent idempotency via `LoadProcessedIds()`, automated TP1 partial close.
- `apps/laptop-bridge/` — Node.js daemon on the same laptop. Mediates HTTP between cloud-api and EA, handles heartbeat → fill detection (pending order → position transition).

### 3.3 Mobile

- `MT5ConnectCard` (in `src/features/settings/components/`) — form collects `accountId`, `password`, `server`. Server today is a hardcoded dropdown of three values.
- `useConnectMT5` (in `src/services/mt5.ts`) — gets a signed intent, optionally pings an MT5_BRIDGE base URL, calls `useConnectBroker`.
- `useConnectBroker`, `useBrokerConnections`, `useBrokerConnection`, `useDisconnectBroker`, `useTestBroker` (in `src/services/broker.ts`) — TanStack Query hooks already wired to the live `/broker/connections` endpoints with mock fallback.
- Tier 1/2 auth shipped: signup / signin / refresh-token rotation / forgot-password / reset-password / account deletion all live.

### 3.4 What does **not** exist yet

- Per-user scoping of `execution_requests` rows (no `user_id` column, no `approval_status` column).
- Per-user signal fan-out — `gold-monitor.ts` queues globally, hardcodes a single Telegram chat ID.
- Per-user bridge tokens (today: single shared `BRIDGE_SECRET`).
- Real MT5 handshake (`validateCredentialsStub` is shape-only).
- Mobile Pending Signals feed.
- Mobile Approve / Deny signed-intent flow.
- Push notifications.
- Container farm host (the new Hetzner CPX21 / laptop Docker setup).
- Provisioning admin endpoints + `provision.sh` script + Wine+MT5+EA Docker image.

## 4. Architecture

### 4.1 Picture

```
┌─────────────────────────────────────────────────────────────┐
│  Mobile (Tiwa Gold)                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐   │
│  │ Connect MT5    │  │ Pending Signals│  │ Trades feed  │   │
│  │ (creds form)   │  │ + Approve/Deny │  │ (read-only)  │   │
│  └───────┬────────┘  └───────┬────────┘  └──────────────┘   │
└──────────┼───────────────────┼──────────────────────────────┘
           │ POST /broker/     │ POST /trades/:id/approve
           │   connections     │   (signed-intent)
           ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloud-api (Coolify host, existing)                         │
│  ┌──────────────────┐  ┌──────────────────────────────┐     │
│  │ broker_          │  │ execution_requests (NEW cols)│     │
│  │ connections      │  │ + user_id                    │     │
│  │ (AES-GCM creds)  │  │ + approval_status            │     │
│  └────────┬─────────┘  │ + approval_intent_jti        │     │
│           │            └──────────┬───────────────────┘     │
│           │                       │                         │
│  ┌────────▼────────────────┐  ┌──▼─────────────────┐        │
│  │ provisioning admin API  │  │ gold-monitor       │        │
│  │ (bundle / confirm)      │  │ (per-user fan-out) │        │
│  └────────┬────────────────┘  └────────────────────┘        │
└───────────┼─────────────────────────────────────────────────┘
            │ (manual SSH or HMAC-signed daemon call)
            ▼
┌─────────────────────────────────────────────────────────────┐
│  Execution server (laptop v0 → Hetzner CPX21 v1)            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ container   │  │ container   │  │ container   │          │
│  │ user_42     │  │ user_43     │  │ user_44     │          │
│  │ ─────────   │  │ ─────────   │  │ ─────────   │          │
│  │ Wine        │  │ Wine        │  │ Wine        │          │
│  │ + MT5       │  │ + MT5       │  │ + MT5       │          │
│  │ + EA (.ex5) │  │ + EA (.ex5) │  │ + EA (.ex5) │          │
│  │ + bridge    │  │ + bridge    │  │ + bridge    │          │
│  │   daemon    │  │   daemon    │  │   daemon    │          │
│  │ (per-user   │  │ (per-user   │  │ (per-user   │          │
│  │  token)     │  │  token)     │  │  token)     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
└──────────────────────────┼──────────────────────────────────┘
                           │ poll GET /api/mt5/execution-
                           │   requests?token=<per-user>
                           ▼
                 (back to cloud-api, scoped to this user only)
```

### 4.2 Why this shape

- **Existing code is reused unchanged.** `TiwaExecutionBridge.mq5`, `mt5-execution-queue.ts`, `mt5-bridge.ts` (with auth changes), `laptop-bridge` daemon all keep working. We're packaging them, not rewriting them.
- **Tiwa never has discretionary authority.** Each row in `execution_requests` is born `awaiting_approval`. Only after a signed-intent challenge is verified does the row flip to `approved`, at which point the user's container EA picks it up. A bug in cloud-api code cannot bypass this gate because the EA filters on `approval_status = approved`.
- **Per-user scoping is enforced at the auth layer.** Each container's bridge daemon authenticates with a per-user `bridge_token` minted from that user's JWT. Cloud-api's request handler scopes queue queries by `user_id` derived from the token — there's no path to fetch another user's queue.
- **Containerized = portable.** Same `docker compose up` runs on Segun's laptop today (v0, free), Hetzner CPX21 tomorrow (v1, €5.83/mo), CPX31 later (v2, €11.66/mo). Migration is `docker compose down` here, `docker compose up` there.
- **Regulatorily clean.** Approve-gate is the regulatory shield: every entry has explicit per-trade user consent, signed cryptographically. Tiwa publishes signals + provides an approval helper. Same posture as a broker's web trading interface, not a copy-trade service or money manager.

## 5. Data model

### 5.1 New columns on existing tables

#### `execution_requests` (in `apps/cloud-api/src/db/schema.ts`)

| Column | Type | Notes |
|---|---|---|
| `user_id` | text NOT NULL FK→`users.id` | Scopes the row to one user. Index for `(user_id, status)`. |
| `approval_status` | enum: `awaiting_approval`, `approved`, `denied`, `expired` | Default `awaiting_approval` for any row created by `gold-monitor.ts`. Existing rows from Segun's single-tenant setup default to `approved` via migration to preserve current behavior. |
| `approval_intent_jti` | text NULL | JTI of the signed-intent JWT used to flip `awaiting_approval` → `approved`. Non-replayable (single-use). |
| `approval_expires_at` | timestamp NULL | Default **15 minutes** from row creation — long enough to survive a user not being immediately in-app, short enough that the price hasn't drifted significantly from the signal entry. Background sweeper flips stale `awaiting_approval` rows to `expired` on a 1-minute cadence. |
| `approved_at` / `denied_at` | timestamp NULL | Audit. |

#### `broker_connections` (already exists from C.2)

No schema changes. We start using `kind = "mt5"` for real instead of stub, and `last_synced_at` becomes meaningful once the container's heartbeat fires.

#### `users` (already exists from Tier 1)

| Column | Type | Notes |
|---|---|---|
| `expo_push_token` | text NULL | Latest registered Expo push token. Cleared on sign-out. |
| `signed_intent_public_jwk` | jsonb NULL | Device's public key for signed-intent verification. Set on first sign-in via the new `/me/keys/register` endpoint. Re-key flow on device wipe. |

### 5.2 New tables

#### `bridge_tokens`

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | nanoid |
| `user_id` | text NOT NULL FK→`users.id` UNIQUE | One token per user (for now). |
| `token_hash` | text NOT NULL | sha256 of the actual token. The token itself is shown once at mint and never persisted in plaintext. |
| `created_at` | timestamp | |
| `last_used_at` | timestamp NULL | |
| `revoked_at` | timestamp NULL | |
| `revoked_reason` | enum: `user_revoked`, `admin_revoke`, `provisioning_failed` | NULL when active. |

Tokens are 32-byte hex (64 chars). Used in `Authorization: Bearer <token>` header on container → cloud-api requests. Mintable by the user from Settings (one button: "Rotate bridge token") and from the admin provisioning endpoint.

#### `pending_provisions`

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | nanoid |
| `user_id` | text NOT NULL FK→`users.id` UNIQUE | One pending request per user at a time. |
| `broker_connection_id` | text NOT NULL FK→`broker_connections.id` | The connection awaiting provisioning. |
| `status` | enum: `pending`, `provisioning`, `active`, `failed` | |
| `last_error` | text NULL | If `failed`, what went wrong. Surfaced to mobile. |
| `created_at` / `updated_at` | timestamp | |

When a user POSTs `/broker/connections` (existing endpoint), cloud-api inserts a `pending_provisions` row in addition to the existing behavior. The provisioning side fetches pending rows, runs the script, flips status.

#### `signed_intent_challenges`

| Column | Type | Notes |
|---|---|---|
| `jti` | text PK | UUID. |
| `user_id` | text NOT NULL FK→`users.id` | |
| `intent_kind` | enum: `approve_trade`, `deny_trade`, `kill_switch_confirm` | Reserved for future kill-switch in scope C.4-followup. |
| `subject_id` | text NOT NULL | `execution_request.id` for trade approvals. |
| `nonce` | text NOT NULL | Random 16 bytes hex; baked into the JWT, prevents replay. |
| `issued_at` | timestamp | |
| `expires_at` | timestamp | Default 60s. |
| `consumed_at` | timestamp NULL | When the JWT is verified + flipped, this is set. Subsequent verification of the same JTI → 410. |

#### `user_engine_prefs`

| Column | Type | Notes |
|---|---|---|
| `user_id` | text PK FK→`users.id` | One row per user. |
| `conservative_enabled` | boolean NOT NULL DEFAULT true | |
| `aggressive_enabled` | boolean NOT NULL DEFAULT true | (matches the post-2026-05-06 default for new installs) |
| `updated_at` | timestamp | |

`gold-monitor.ts` consults this on fan-out: an Aggressive engine signal only generates `execution_requests` rows for users with `aggressive_enabled = true`. Mobile mirrors the existing `tradingPrefsStore` to this table on change. Deeper risk filtering (max position size, max concurrent positions, allowed sessions) is **deferred to a follow-up sprint** — not in this design.

## 6. API changes

### 6.1 Cloud-api → mobile (user-facing)

| Method | Path | Purpose |
|---|---|---|
| `GET /trades/pending` (NEW) | List `execution_requests` for `req.user.id` where `approval_status = awaiting_approval`. Includes signal context (entry, SL, TP, confidence, engine, why-this-fired). FlashList-ready. |
| `POST /auth/signed-intent/challenge` (NEW) | Body `{ kind, subject_id }`. Returns `{ jti, nonce, expires_at }`. Mobile signs `{ jti, nonce, kind, subject_id }` with the device's Secure Enclave / Keystore key (set up on first signin) and posts back to `/auth/signed-intent/mint`. |
| `POST /auth/signed-intent/mint` (NEW) | Body `{ jti, signature, public_key_jwk }`. Verifies signature against the user's registered device public key, returns `{ intent_jwt }` valid for 60s. |
| `POST /trades/:id/approve` (NEW) | Header `X-Intent: <intent_jwt>`. Verifies JWT, flips row from `awaiting_approval` → `approved` atomically. Idempotent on `jti`. |
| `POST /trades/:id/deny` (NEW) | Same shape as approve, flips to `denied`. |
| `POST /me/bridge-token/rotate` (NEW) | Mints a fresh token, returns it once. Old token revoked. Used for "I think my bridge is compromised" recovery. |
| `GET /me/bridge-status` (NEW) | Returns `{ token_active: bool, last_used_at: timestamp \| null, container_status: "active" \| "provisioning" \| "failed" \| "none", last_error?: string }`. Drives the Connect MT5 status pill in Settings without exposing the token itself. |
| `POST /me/keys/register` (NEW) | Body `{ public_jwk }`. Registers the device's signed-intent public key. Idempotent on the same key; replacing a key revokes pending challenges. |
| `PUT /me/engine-prefs` (NEW) | Body `{ conservative_enabled, aggressive_enabled }`. Mirrors the local `tradingPrefsStore` to the server-side fan-out filter. |

### 6.2 Cloud-api → bridge (container-facing)

| Method | Path | Auth | Change |
|---|---|---|---|
| `GET /api/mt5/execution-requests` | `Bearer <bridge_token>` (NEW) or `x-bridge-secret` (legacy, kept for Segun's laptop) | Now scopes by `user_id` derived from the token. Legacy `x-bridge-secret` still returns the global queue. |
| `POST /api/mt5/execution-requests/:id/pickup` | same | Cross-checks that the request's `user_id` matches the token's `user_id`. 403 otherwise. |
| `POST /api/mt5/execution-requests/:id/result` | same | same |

The pickup endpoint additionally **filters out rows where `approval_status != approved`**. This is the regulatory gate. A bug elsewhere cannot let a container pick up an unapproved trade.

### 6.3 Cloud-api → admin / provisioning

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET /admin/pending-provisions` (NEW) | Admin bearer (env-stored, never user-issued) | List rows in `pending_provisions.status = pending`. |
| `GET /admin/broker-connections/:user_id/provision-bundle` (NEW) | Admin bearer | Returns `{ user_id, broker_token, mt5_login, mt5_password, mt5_server }`. Decrypts creds server-side, mints fresh `bridge_token`, marks `pending_provisions.status = provisioning`. **Token + creds returned over TLS once; never logged.** |
| `POST /admin/broker-connections/:user_id/provision-confirm` (NEW) | Admin bearer | Body `{ status: active \| failed, error?: string }`. Flips `pending_provisions.status` and (on `active`) emits a push notification "Tiwa is live on your account". |

The admin bearer is a separate env var from `DASHBOARD_API_KEY` and `BRIDGE_SECRET` — call it `TIWA_PROVISIONING_KEY`. Stored on `coolify-prod` env. Never ships to mobile, never embedded in the Docker image.

### 6.4 Notification surface

Push notifications via Expo Push Notifications (already in the project's dependency tree because of `expo-notifications`):

- "New signal: gold buy 2,387.50 — tap to review" (on `execution_request` insert with `awaiting_approval`)
- "Tiwa is live on your account" (on `provision-confirm` with `active`)
- "Provisioning failed: <reason>" (on `provision-confirm` with `failed`)
- "Trade filled: +$42.30" (on `execution_request` result reporting a fill)

Tokens registered in `users.expo_push_token` (new column, NULL allowed). Cleanup on sign-out / reinstall.

## 7. Mobile UX

### 7.1 New surfaces

- **Connect MT5 wizard** (replaces today's `MT5ConnectCard` in Settings; same component, different copy and onboarding placement). Three steps: pick broker (typeahead of MT5 servers, free-text fallback), enter login + password, confirm. On submit shows "Provisioning… we'll notify you when ready (~5 min)".
- **Pending Signals feed** (new tab or top-of-Trades section — TBD in the writing-plans phase). Shows live `awaiting_approval` cards with: side, entry, SL, TP, RR, engine (Conservative / Aggressive), confidence, brief "why this fired" copy. Two large buttons: **Approve** (gold gradient) + **Deny** (subtle outline). Approve fires the signed-intent flow, deny just flips the row.
- **Approve interaction.** Tap → light haptic, button morphs into a 3-second confirm-hold (similar to "Slide to unlock") to prevent accidental taps. Hold → Secure-Enclave signs the intent → POST /trades/:id/approve → optimistic UI flip → push notification on fill. Net latency target: tap-to-fill ≤ 4s on a 4G connection (3s confirm-hold + ~1s signed-intent + queue + EA pickup loop).
- **Onboarding gate (soft).** Signup → preview Trades feed (read-only, sample data marked "Connect MT5 to see your live feed"). Approve buttons disabled with "Connect MT5 to enable" CTA pointing to Settings. After Connect MT5 completes successfully, full feed unlocks.

### 7.2 Existing surfaces touched

- `SettingsScreen` — Connect MT5 row gets a status pill: `Not connected` / `Provisioning` / `Active` / `Failed (tap to retry)`.
- Trade detail screen (`app/trade/[id].tsx`) — adds an "Approval status" panel showing `awaiting_approval | approved at <time> | denied at <time> | expired`.

### 7.3 Files affected

| File | Change |
|---|---|
| `src/features/settings/components/MT5ConnectCard.tsx` | Add status pill, read from `pending_provisions` via new `usePendingProvision` hook. |
| `src/services/broker.ts` | `useConnectBroker` mutation now invalidates `["pending-provisions"]` cache; new `usePendingProvision()` hook. |
| `src/services/pendingTrades.ts` (NEW) | `usePendingTrades()` (TanStack list) + `useApproveTrade(id)` + `useDenyTrade(id)` mutations. Naming follows existing camelCase convention (`broker.ts`, `mt5.ts`). |
| `src/features/pending-signals/PendingSignalsScreen.tsx` (NEW) | FlashList of pending cards. |
| `src/features/pending-signals/components/PendingTradeCard.tsx` (NEW) | Card UI with approve-hold gesture. |
| `src/services/signedIntent.ts` (NEW) | Wraps Secure Enclave / Keystore signing via `expo-local-authentication` + `react-native-keychain` (or equivalent) into a single `signIntent(kind, subjectId)` helper. |
| `src/hooks/useExpoPushToken.ts` (NEW) | Registers + posts the token to `users.expo_push_token`. |
| `app/(tabs)/_layout.tsx` | Adds Pending Signals tab badge for unread count (or integrates into Trades tab — final placement decided in implementation plan). |

## 8. Container farm

### 8.1 Image

`apps/execution-image/Dockerfile` (new workspace under `persona-overseer`):

```
FROM ubuntu:22.04
# Wine + Xvfb (headless X)
RUN apt-get update && apt-get install -y \
    wine64 wine32 winbind xvfb xauth \
    nodejs npm curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# MT5 installer — downloaded by build.sh before docker build; baked into the image.
# Source: official broker mirror (e.g. https://download.mql5.com/cdn/web/...).
# Pinned by SHA256 in build.sh so image rebuilds are reproducible.
COPY mt5setup.exe /tmp/mt5setup.exe
RUN xvfb-run -a wine /tmp/mt5setup.exe /auto && rm /tmp/mt5setup.exe

# Compiled EA (.ex5) baked in
COPY TiwaExecutionBridge.ex5 /opt/tiwa/Experts/TiwaExecutionBridge.ex5

# Bridge daemon (existing apps/laptop-bridge code, packaged)
COPY laptop-bridge/ /opt/tiwa/bridge/
RUN cd /opt/tiwa/bridge && npm ci --omit=dev

# Entrypoint: start Xvfb, configure MT5 with creds from env, start EA, start bridge daemon
COPY entrypoint.sh /opt/tiwa/entrypoint.sh
RUN chmod +x /opt/tiwa/entrypoint.sh
ENTRYPOINT ["/opt/tiwa/entrypoint.sh"]

# Healthcheck: bridge daemon exposes /healthz on 8080 inside the container
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD curl -fsS http://localhost:8080/healthz || exit 1
```

### 8.2 Per-user `docker-compose.yml` template

`/opt/tiwa-bridges/<user_id>/docker-compose.yml`:

```
services:
  bridge:
    image: ghcr.io/coolzymccooy/tiwa-execution:1.0.0
    restart: unless-stopped
    env_file: .env
    networks: [bridge-net]
    volumes:
      - /opt/tiwa-bridges/<user_id>/data:/opt/tiwa/data
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
networks:
  bridge-net:
```

`.env` for that user:

```
USER_ID=user_42
BRIDGE_TOKEN=<32-byte-hex-from-provision-bundle>
MT5_LOGIN=<from-provision-bundle>
MT5_PASSWORD=<from-provision-bundle>
MT5_SERVER=<from-provision-bundle>
CLOUD_API_URL=https://tiwa.tiwaton.co.uk
POLL_INTERVAL_MS=3000
```

The `entrypoint.sh` reads these env vars, configures MT5 via Wine, launches the EA with the credentials baked in, starts the bridge daemon polling the cloud with `Authorization: Bearer ${BRIDGE_TOKEN}`.

### 8.3 `provision.sh` (~80 lines of bash, lives at `/opt/tiwa/provision.sh` on the execution server)

```
#!/usr/bin/env bash
# Usage: ./provision.sh <user_id>
set -euo pipefail

USER_ID="$1"
ADMIN_BEARER="$(cat /opt/tiwa/.provisioning-key)"
CLOUD_API="https://tiwa.tiwaton.co.uk"

# 1. Fetch bundle
BUNDLE="$(curl -fsS \
  -H "Authorization: Bearer $ADMIN_BEARER" \
  "$CLOUD_API/admin/broker-connections/$USER_ID/provision-bundle")"

# 2. Render compose + .env into /opt/tiwa-bridges/<user_id>/
DEST="/opt/tiwa-bridges/$USER_ID"
mkdir -p "$DEST/data"
cp /opt/tiwa/templates/docker-compose.yml "$DEST/docker-compose.yml"
echo "$BUNDLE" | jq -r '
  "USER_ID=\(.user_id)
BRIDGE_TOKEN=\(.broker_token)
MT5_LOGIN=\(.mt5_login)
MT5_PASSWORD=\(.mt5_password)
MT5_SERVER=\(.mt5_server)
CLOUD_API_URL=https://tiwa.tiwaton.co.uk
POLL_INTERVAL_MS=3000
"' > "$DEST/.env"
chmod 600 "$DEST/.env"

# 3. Bring container up
cd "$DEST"
docker compose up -d

# 4. Wait for healthcheck (max 120s)
for i in {1..40}; do
  if [ "$(docker inspect --format '{{.State.Health.Status}}' $(docker compose ps -q bridge))" = "healthy" ]; then
    # 5. Confirm
    curl -fsS -X POST \
      -H "Authorization: Bearer $ADMIN_BEARER" \
      -H "Content-Type: application/json" \
      -d '{"status":"active"}' \
      "$CLOUD_API/admin/broker-connections/$USER_ID/provision-confirm"
    echo "[ok] $USER_ID provisioned"
    exit 0
  fi
  sleep 3
done

# Failure path
LAST_ERR="$(docker compose logs --tail=20 bridge | tail -c 1000)"
docker compose down -v
curl -fsS -X POST \
  -H "Authorization: Bearer $ADMIN_BEARER" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg err "$LAST_ERR" '{status:"failed", error:$err}')" \
  "$CLOUD_API/admin/broker-connections/$USER_ID/provision-confirm"
echo "[fail] $USER_ID provisioning failed"
exit 1
```

### 8.4 Phase 2 — provisioning daemon (deferred until 10+ users)

`apps/provisioning-agent/` — small Fastify daemon, runs on the execution server, exposes `POST /provision { user_id }` authenticated by HMAC of the payload using a shared secret in cloud-api `.env`. Daemon binds to `127.0.0.1:9000`; cloud-api reaches it via SSH tunnel or Tailscale (decided in implementation plan). Daemon shells out to the same `provision.sh`.

## 9. Provisioning lifecycle

### 9.1 Phase 1 — manual (v0 + first ~10 users)

```
T+0     User taps Save in Connect MT5
        → POST /broker/connections (existing)
        → broker_connections row inserted
        → pending_provisions row inserted (NEW)
        → cloud-api fires Telegram alert to Segun's bot
        → mobile shows "Provisioning… (~5 min)"

T+30s   Segun receives Telegram alert
        → ssh root@<execution-server-ip>
        → /opt/tiwa/provision.sh user_42
        Script runs ~60-90s

T+90s   Container healthy, /provision-confirm fires
        → pending_provisions.status = active
        → push notification to user: "Tiwa is live on your account"
        → mobile Connect MT5 status pill flips to "Active"

(Later) First signal fires
        → execution_requests row inserted, awaiting_approval
        → push notification "New signal: gold buy 2,387.50"
        → user opens app, lands on Pending Signals
        → taps Approve, holds 3s
        → signed-intent flow → POST /trades/:id/approve
        → execution_requests.approval_status = approved
        → user's container EA picks it up next 3s poll
        → MT5 places order on broker
        → fill reported back via /result
        → push notification "Trade filled: +$42.30"
```

### 9.2 Phase 2 — automated (after ~10 successful provisions)

Same flow, except `T+30s … T+90s` becomes:

```
T+5s    Cloud-api calls provisioning-agent on execution-server
        (HMAC-signed, over SSH tunnel or private network)
        Daemon runs provision.sh, returns 200 when active
T+90s   Confirmation posted, push fires
```

No Segun. No SSH. ~half a day to build the daemon once Phase 1 is battle-tested.

## 10. Security & regulatory posture

### 10.1 Credential handling

- MT5 creds stored AES-256-GCM in `broker_connections.encrypted_credentials` (already in C.2). Never logged. Never returned by user-facing endpoints.
- `provision-bundle` admin endpoint returns plaintext creds **once over TLS** to the provisioning script. The provisioning script writes them into a `.env` file on the execution server (chmod 600). The container reads them at boot. They live in container memory until shutdown.
- On disconnect (`DELETE /broker/connections/:id`): cloud-api revokes the bridge token, the container's next poll 401s, container detects this, runs an MT5 cancel-all + close-all sweep, then exits. The execution-server cron tears down stopped containers nightly.

### 10.2 Bridge token security

- 32 bytes of randomness (cryptographically secure RNG), shown once at mint, sha256-hashed at rest.
- Per-user; cannot be used to query another user's queue. Pickup endpoint cross-checks `request.user_id == token.user_id` and 403s otherwise.
- Rotatable from mobile Settings → "Rotate bridge token" → mints fresh, revokes old, marks `pending_provisions` for re-provisioning.

### 10.3 Signed-intent security

- One-time keypair generated on first sign-in, private key stored in iOS Secure Enclave / Android Keystore. Public key registered with cloud-api in `users.signed_intent_public_jwk`.
- Challenge-mint-verify flow: challenge nonce baked into JWT prevents replay; 60s window narrows attack surface; `consumed_at` on `signed_intent_challenges` ensures single-use.
- Tap-and-hold UX (3s) prevents accidental taps from triggering live trades. User must consciously hold.

### 10.4 Regulatory framing

- **Tiwa never has discretionary authority.** Every entry has explicit per-trade, cryptographically-signed user consent before the user's own broker connection executes. Same posture as IBKR's web app or eToro's manual trading interface — both regulated as "trading platforms," not as copy-trade providers or money managers.
- **Marketing language must reinforce this.** No "we trade for you", "auto-pilot trading", "follow our trades" — those phrases trigger copy-trade regulation in many jurisdictions. Use "AI signal alerts" + "one-tap trade execution" + "you approve every trade".
- **No performance fees.** A subscription tier (flat monthly) is fine; performance-based fees pull Tiwa into RIA/FINRA territory.
- **T&Cs must include**: user authorizes Tiwa to relay their MT5 credentials to a Tiwa-managed execution server for the sole purpose of placing trades the user explicitly approves. Tiwa does not execute trades on its own initiative. User can revoke at any time via Settings.

### 10.5 Open regulatory questions (out of scope, for legal review later)

- KYC / AML obligations under Tiwa's jurisdiction once the user count grows. Minimal at <50 closed-beta users; non-trivial at public launch.
- Storage of MT5 master passwords on Tiwa infrastructure may put Tiwa in scope of the broker's T&C clause about "no third-party access". Some brokers explicitly forbid it. We'll need to survey the brokers Tiwa wants to support.
- Whether MT5 + Wine inside a non-residential cloud IP triggers broker fraud filters. Mitigation: warm up new container IPs by logging in via the user's mobile (geolocated to their phone) first, then handing off to the container — out of scope for v1.

## 11. Deployment phases

### 11.1 v0 — laptop docker (€0, you only)

- Docker Desktop on Segun's laptop.
- One container running alongside the existing native `tiwabridge` setup. Container is `user_segun_demo` (a separate MT5 demo account, NOT Segun's live account).
- Validates: Wine+MT5 boots and logs into ICMarkets-Demo, EA compiles and runs, per-user `bridge_token` scoping works, full mobile approve flow lands a trade on the demo account.
- Existing live single-tenant setup is **untouched**. Both flows run in parallel.

### 11.2 v1 — Hetzner CPX21 (~€5.83/mo, you + 1-2 testers)

- Provision CPX21 manually via Hetzner Cloud Console, same Nuremberg DC as `coolify-prod`. Install Docker, copy `provision.sh`, set `/opt/tiwa/.provisioning-key`.
- **Do not connect to Coolify.** Coolify is for stateless web apps; the execution server runs raw Docker.
- Migrate Segun's demo container off the laptop onto CPX21 (same compose file, same env, same image).
- Onboard 1-2 closed-beta testers manually.

### 11.3 v2 — Hetzner CPX31 (~€11.66/mo, 5-10 users)

- Resize CPX21 → CPX31 in Hetzner console (5-min reboot). All existing containers come back unchanged.
- Build `provisioning-agent` daemon and switch from manual SSH to automated calls.

### 11.4 v3+ (out of scope — flagged for future consideration)

- Multi-execution-server orchestration (when one box runs out of room).
- AX-line dedicated server when 30+ users.
- Backup automation for container-side data (idempotency state in EA).
- Hetzner backup add-on on `coolify-prod` (independent of MT5 work — should be done regardless).

## 12. Operations

- **Monitoring:** each container's bridge daemon emits structured logs (Pino); container logs collected by Docker's json-file driver with 10MB rotation. Aggregated via Loki/Grafana later if needed; for v1, `docker compose logs` on the execution server is the audit trail.
- **Alerting:** `pending_provisions.status = failed` fires a Telegram alert to Segun's bot. Container healthcheck failure (3 retries) fires the same. No PagerDuty for v1 — beta users tolerate manual response.
- **Backups:** the existence of an MT5 container is fully reproducible from `pending_provisions` + `broker_connections` + the Docker image + `provision.sh`. Per-user runtime state (idempotency tracking inside the EA) is on a Docker volume, included in any future backup automation. v1 is best-effort: if the execution server dies, run `provision.sh` for each user and they're back.
- **Disaster recovery:** if the execution server is destroyed, all in-flight `awaiting_approval` rows expire after 5 min (existing approval_expires_at sweep). Re-provisioning brings users back online; signals that fired during the outage are gone (acceptable: signals are 5-min cadence, missing one is fine).
- **Bridge / EA upgrades:** roll out by `docker compose pull && docker compose up -d` on each user's container. Compatible-version policy: mobile + cloud-api + bridge image must all be N or N-1. Breaking changes require synchronized release.

## 13. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Wine + MT5 + ICMarkets-Live combo unstable in Docker | Medium | Architecture-blocking | v0 on laptop validates this BEFORE any user spend or Hetzner commitment |
| Broker T&C forbids cred sharing | Medium | Legal | Survey target brokers in v1 sprint; fall back to per-user laptop-bridge distribution if needed |
| Container memory leak takes down execution server | Medium | All users offline | Per-container memory limit in compose (`mem_limit: 1.5g`), Docker auto-restart, healthcheck monitoring |
| User's broker rejects login from non-residential IP | Medium | One user can't connect | Surface "broker rejected login" error to user; document workaround (whitelist Hetzner IP with broker support) |
| Signed-intent private key lost (user wipes phone) | Low | User can't approve | Re-key flow at next sign-in: post a fresh public key, invalidate the old one; in-flight approvals become stuck (expire after 5 min, no harm) |
| Cloud-api bug allows unapproved pickup | Low | Regulatory exposure (auto-trade) | EA pickup filter on `approval_status = approved` is the second line of defense; integration tests assert this on every PR |
| Hetzner bills overrun | Low | Cost | CPX21 → CPX31 is the only scaling path before v3; both are <€15/mo |
| Approve latency exceeds 4s on poor network | Medium | UX | Surface "slow network — fill may be delayed" toast if signed-intent mint > 2s; option for user to skip the 3s confirm-hold (off by default) |
| EA crashes mid-execution, reports incomplete state | Low | Reconciliation | EA's persistent idempotency tracking already handles this (`LoadProcessedIds` survives restarts); next poll resyncs |

## 14. Testing strategy

### 14.1 Cloud-api (vitest, in `apps/cloud-api/tests/`)

- `execution-requests-multitenant.test.ts` — per-user isolation: token A cannot fetch token B's queue, pickup cross-check 403s, result cross-check 403s.
- `approval-gate.test.ts` — pickup filter: rows with `approval_status != approved` are invisible to the bridge.
- `signed-intent.test.ts` — challenge/mint/verify happy path + replay (jti reused → 410) + expired (>60s → 410) + bad signature (401).
- `bridge-tokens.test.ts` — mint, revoke, rehash, unique-per-user, sha256 at rest.
- `pending-provisions.test.ts` — insert on POST /broker/connections, transition to active on confirm, transition to failed on confirm-failure, push notification fires.
- `gold-monitor-fanout.test.ts` — one signal generates N rows scoped to N users, filtered by their engine prefs / risk settings.

### 14.2 Mobile (jest-expo)

- `useApproveTrade.test.ts` — mutation triggers signed-intent flow, optimistic UI flip, rollback on error.
- `usePendingTrades.test.ts` — list query, FlashList rendering, empty / loading / error / success states.
- `signedIntent.test.ts` — wraps the secure-store key correctly, posts the right payload, handles re-key.
- `MT5ConnectCard.test.tsx` — status pill renders all four states (Not connected / Provisioning / Active / Failed).

### 14.3 End-to-end smoke (manual, on v0)

Documented in `docs/runbooks/mt5-multitenant-smoke.md` (out of scope to write here, included in implementation plan):
- Spin up Segun's demo container locally via `docker compose up`
- Sign up a fresh test user in mobile
- Connect demo MT5 account
- Manually run `./provision.sh user_test`
- Wait for "Tiwa is live" push
- Wait for first signal (or trigger one via a debug endpoint)
- Tap Approve → hold 3s
- Verify order lands on demo MT5 within 4s
- Verify fill notification fires

## 15. Implementation surface — file-by-file

(Concrete file list lives in the implementation plan that follows this design. Coarse outline:)

### 15.1 Cloud-api (persona-overseer)

- `apps/cloud-api/src/db/schema.ts` — column additions on `execution_requests`, three new tables.
- `apps/cloud-api/drizzle/<timestamp>_multitenant_execution.sql` — migration.
- `apps/cloud-api/src/services/trading/gold-monitor.ts` — per-user fan-out logic.
- `apps/cloud-api/src/services/trading/mt5-execution-queue.ts` — `user_id` + `approval_status` aware enqueue.
- `apps/cloud-api/src/services/trading/mt5-bridge.ts` — bridge_token auth, per-user scoping, approval-status filter on pickup.
- `apps/cloud-api/src/services/auth/signed-intents.ts` (NEW) — challenge / mint / verify.
- `apps/cloud-api/src/services/auth/bridge-tokens.ts` (NEW) — mint / revoke / verify.
- `apps/cloud-api/src/services/admin/provisioning.ts` (NEW) — bundle / confirm endpoints.
- `apps/cloud-api/src/services/notifications/push.ts` (NEW) — Expo push wrapper.
- `apps/cloud-api/src/server.ts` — register new routes.

### 15.2 Mobile (tiwagold)

- `src/services/pendingTrades.ts` (NEW) — TanStack list + approve / deny mutations.
- `src/services/signedIntent.ts` (NEW) — Secure Enclave / Keystore signing.
- `src/services/broker.ts` — add `usePendingProvision()`.
- `src/features/pending-signals/` (NEW) — screen + components.
- `src/features/settings/components/MT5ConnectCard.tsx` — status pill.
- `src/hooks/useExpoPushToken.ts` (NEW) — register Expo push token.
- `app/(tabs)/_layout.tsx` — Pending Signals tab integration.
- `app/(auth)/_layout.tsx` — soft onboarding gate to Settings → Connect MT5.

### 15.3 Container farm (new persona-overseer workspaces)

- `apps/execution-image/Dockerfile` (NEW)
- `apps/execution-image/entrypoint.sh` (NEW)
- `apps/execution-image/build.sh` (NEW) — builds + pushes to GHCR
- `apps/laptop-bridge/` — repackaged for in-container use; minor changes to read `BRIDGE_TOKEN` from env.
- Provisioning host: `/opt/tiwa/provision.sh`, `/opt/tiwa/templates/docker-compose.yml`, `/opt/tiwa/.provisioning-key` (deployed to laptop in v0, CPX21 in v1, never checked into git)
- (v2) `apps/provisioning-agent/` (NEW Fastify daemon)

## 16. Open questions parked for implementation phase

These are deliberately not resolved here; they're sized to be settled when the implementation plan is written, not in design:

1. Final placement of the Pending Signals surface — separate tab vs. top-of-Trades section.
2. Exact Expo push token lifecycle (refresh on app foreground? sign-in only? both?).
3. Whether to use SSH tunnel or Tailscale for cloud-api → provisioning-agent in Phase 2.
4. Final list of MT5 servers in the typeahead (curated vs free-text vs both).
5. Whether to keep the existing `BRIDGE_SECRET` realm forever (for Segun's personal laptop) or migrate it to a `bridge_token` row marked `is_owner = true`.
6. Push notification copy for each event (UX writing pass).

## 17. Acceptance criteria

A user — call her Alice — can complete the following in under 10 minutes from a fresh app install:

1. Sign up with email / password.
2. Land on Trades preview with a "Connect MT5 to enable" CTA.
3. Tap Settings → Connect MT5, enter her ICMarkets-Live login + password + server, tap Save.
4. See "Provisioning… (~5 min)" status.
5. Receive "Tiwa is live on your account" push within 5 minutes.
6. Receive her first signal push notification ("New signal: gold buy …") later that session.
7. Open the app, see the Pending Signals card, tap Approve, hold 3 seconds.
8. See the trade flip to Approved in the Trades feed within ~4 seconds.
9. See it filled on her ICMarkets MT5 account directly (verifiable on her broker terminal).
10. Receive a "Trade filled" push.

All ten happen with **zero user-side install** and **explicit per-trade approval** for every entry.

---

**End of design.**
