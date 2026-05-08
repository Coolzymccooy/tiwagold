# First end-to-end approve-to-execute test — runbook

**Date:** 2026-05-08
**Audience:** the human running this on a machine with the mobile app installed and a real test broker account.
**Why this exists:** the provisioning daemon is now deployed as a systemd unit on the Hetzner box — every step from "user signs up + connects broker" to "trade executes on broker" is automated. But the **first** real run must be human-driven so any latent issues (EA WebRequest whitelist, broker-side IP filtering, signed-intent JWT verification on the live cloud) surface in a session you can debug.

After this runbook passes once, every subsequent paying user is fully self-serve.

---

## What's already running (no action needed)

| Component | State | How to verify |
|---|---|---|
| Hetzner CCX13 `tiwa-exec-1` (Falkenstein, `168.119.244.150`) | up, hardened | `ssh root@168.119.244.150 'uptime'` |
| Docker image `ghcr.io/coolzymccooy/tiwa-execution:1.0.0` | on box | `ssh root@168.119.244.150 'docker images \| grep tiwa-execution'` |
| `/opt/tiwa/.provisioning-key` (matches Coolify env) | seeded, mode 600 | `ssh root@168.119.244.150 'stat -c "%a %U:%G" /opt/tiwa/.provisioning-key'` |
| `tiwa-provisioning.service` systemd unit | active, polling every 60s | `ssh root@168.119.244.150 'systemctl is-active tiwa-provisioning'` |
| Cloud-api `TIWA_PROVISIONING_KEY` env var | set + redeployed | endpoint smoke: `curl -H "Authorization: Bearer $KEY" https://tiwa.tiwaton.co.uk/admin/broker-connections/pending` returns `{"items":[]}` |

---

## Pre-flight (one-off, do these once before the first test)

### P1. ~~Whitelist WebRequest~~ — N/A in 1.0.1

In image **1.0.1+** (current default), the EA does **not** call `WebRequest()`. A
small Linux side-car (`/opt/tiwa/tiwa-sidecar`, single static Go binary) runs
in the same container as Wine + MT5 and translates file IPC into cloud HTTP:

```
EA  ──writes──►  Common\Files\tiwa-bridge\outbox\<id>.result.json
                 Common\Files\tiwa-bridge\outbox\heartbeat.json
                                    │
                                    ▼
                          tiwa-sidecar (Linux, polls outbox/)
                                    │
                                    ▼ HTTPS (no whitelist needed)
                            cloud-api  /api/mt5/heartbeat
                                       /api/mt5/execution-requests/<id>/{pickup,result}
```

Inbound side: the side-car polls `GET /api/mt5/execution-requests` every
`POLL_INTERVAL_MS` and writes `<id>.json` files into `…\inbox\` for the EA to
pick up. No MT5 GUI seed required, no encrypted `Config/settings.ini` to bake.

If you're on the legacy 1.0.0 image (only relevant for nodes provisioned before
the 1.0.1 rollout), the original WebRequest whitelist instructions apply — but
the recommended fix is to bump the image tag in
`/opt/tiwa/templates/docker-compose.yml` to 1.0.1 and re-provision.

### P2. Have a test broker account ready

Use a **demo** account first, not live money. Most brokers (ICMarkets, Pepperstone, FXTM, etc.) offer demo MT5 accounts with paper money. You'll need:

- MT5 login (numeric, e.g. `52812281`)
- MT5 password
- Broker server name (e.g. `ICMarketsSC-Demo`)

### P3. Have the mobile app installed and signed in

Either:
- The latest `eas build --profile preview` APK / iOS sim build (if you've already done one), or
- A dev-client build with `USE_LIVE_BACKEND=true` flipped in `app.json#extra` and rebuilt locally.

You should be able to log in to your test account on `tiwa.tiwaton.co.uk`.

---

## The actual end-to-end test

### Step 1 — Connect the broker in the app

1. Mobile app → Settings → MT5 Connect card.
2. Tap "Connect MT5".
3. Enter the demo MT5 login + password + server.
4. Tap submit.

**Expected:** card flips to "Pending" with an orange status pill. Cloud-api creates `broker_connections` row + `pending_provisions` row.

**Verify on cloud:**
```sh
# From your laptop:
ssh root@168.119.244.150 "
  BEARER=\$(cat /opt/tiwa/.provisioning-key)
  curl -fsS -H \"Authorization: Bearer \$BEARER\" \
    https://tiwa.tiwaton.co.uk/admin/broker-connections/pending | jq .
"
```

**Expected:** `{"items":[{"user_id":"<your_user_id>","broker_connection_id":"...","status":"pending","updated_at":null}]}`

### Step 2 — Watch the daemon pick it up

The daemon polls every 60s. Within a minute of step 1, it should:

```sh
ssh root@168.119.244.150 "journalctl -u tiwa-provisioning --no-pager -f"
```

**Expected log sequence:**
```
[daemon] tick: 1 pending
[daemon] provision start user=<your_user_id> status=pending
[provision] <your_user_id> — fetching bundle
[provision] <your_user_id> — rendering compose into /opt/tiwa-bridges/<your_user_id>
[provision] <your_user_id> — docker compose up
[provision] <your_user_id> — waiting for healthcheck (max 240s; HEALTHCHECK start-period is 180s)
[provision] <your_user_id> — confirming active to cloud
[provision] <your_user_id> — DONE
[daemon] provision ok user=<your_user_id>
```

If you see `provision fail` instead, the most likely causes are:
- Broker rejected the login (wrong password / server / IP-blocked) → check `docker compose logs bridge` in `/opt/tiwa-bridges/<your_user_id>/`
- Healthcheck never passed → MT5 didn't start under Wine → check container's logs

**Verify the container is up:**
```sh
ssh root@168.119.244.150 "docker ps | grep <your_user_id>"
```

**Verify the EA is loaded** (look for "TiwaExecutionBridge (XAUUSD,H1) loaded successfully" in the MT5 log inside the container):
```sh
ssh root@168.119.244.150 "
  CID=\$(docker ps -q -f name=<your_user_id>)
  docker exec \$CID cat /opt/tiwa/.wine/drive_c/users/root/AppData/Roaming/MetaQuotes/Terminal/*/Logs/$(date -u +%Y%m%d).log 2>&1 | tail -20
"
```

### Step 3 — Trigger a Tiwa signal (or wait for the next one)
you 
The cloud's `gold-monitor` cron emits signals on its schedule (typically hourly). To not wait:

**Option A: trigger manually** if the cloud has an admin endpoint for it (check `apps/cloud-api/src/routes/admin/`).

**Option B: wait** for the next natural fan-out. Could be up to an hour.

**When fan-out happens**, you should:
- Receive an Expo push notification on the device (Phase M).
- Tapping the notification opens the Pending Signals tab (Phase N3).

### Step 4 — Approve the trade in the app

1. Open the Pending Signals tab.
2. The new signal appears as a `PendingTradeCard`.
3. Tap **Approve**.

**What happens behind the scenes:**
- Mobile app uses its bootstrapped signing key (Phase S — warm cache from sign-in) to mint a signed-intent ECDSA P-256 JWT.
- Mobile POSTs `X-Intent: <jwt>` header + `{"intent":"approve"}` body to `/me/trades/<trade_id>/approve`.
- Cloud verifies the signature against the user's public key, flips the trade row to `approved` + `executionState=awaiting_execution`.

**Expected:** card flips to "Approved — awaiting execution". Cloud reflects:
```sh
ssh root@168.119.244.150 "
  BEARER=\$(cat /opt/tiwa/.provisioning-key)
  curl -fsS -H \"Authorization: Bearer \$BEARER\" \
    'https://tiwa.tiwaton.co.uk/admin/trades?user_id=<your_user_id>&limit=1' | jq .
"
```
*(If `/admin/trades` doesn't exist, query the DB directly via cloud-api's Coolify shell.)*

### Step 5 — Watch the EA execute

The EA inside the user's container polls cloud every 3 seconds. Within ~5 seconds of approval, it should:

```sh
ssh root@168.119.244.150 "
  CID=\$(docker ps -q -f name=<your_user_id>)
  docker exec \$CID tail -30 /opt/tiwa/.wine/drive_c/users/root/AppData/Roaming/MetaQuotes/Terminal/*/Logs/$(date -u +%Y%m%d).log 2>&1
"
```

**Expected log lines (from the EA):**
- `[poll] received approved trade <trade_id>, side=BUY/SELL, vol=0.01`
- `[order] OrderSend OK ticket=<broker_ticket>`
- `[poll] reported execution to cloud: {ticket, fillPrice, ...}`

### Step 6 — Verify executed state in app

Within 10 seconds of step 5, the mobile app's TanStack Query polling should pick up the new `executionState=executed` + `brokerTicket=<n>` from cloud and update the trade card.

**Expected:** card flips from "Approved — awaiting execution" → "Executed @ <fillPrice>" with the broker ticket number visible.

---

## If something breaks

| Symptom | Most likely cause | Fix |
|---|---|---|
| `provision fail user=... exit=2: container did not start` | Docker compose template path wrong | `ssh root@... 'cat /opt/tiwa/templates/docker-compose.yml'` — verify env interpolation |
| `provision fail user=... exit=3: healthcheck never passed` | MT5 didn't start under Wine | `docker compose -f /opt/tiwa-bridges/<user>/docker-compose.yml logs` — usually broker creds |
| Container healthy but no trades execute after approval | side-car not running, or EA can't read inbox | `docker exec <user> pgrep -f tiwa-sidecar` should return a PID; check entrypoint log for "tiwa-sidecar exited immediately" |
| EA executes order but cloud never sees brokerTicket | side-car can't reach cloud-api, or outbox file write failed | `docker exec <user> ls -la "$WINE_MT5_DIR/Common/Files/tiwa-bridge/outbox/"` — if files pile up, side-car can't POST; check `docker logs <user> 2>&1 \| grep sidecar` |
| Approve tap returns 401 from cloud | Signing key not warmed | sign out + back in (Phase S bootstraps signing key on `/auth/login`) |
| Approve tap returns 403 from cloud | Signed-intent JWT signature mismatch | clock skew between phone + cloud (>5min); fix phone time |

---

## Aftermath

Once this runbook passes once **with a demo broker**, repeat with a **live broker** for one user. Then mark the multi-tenant approve-to-execute flow GA.

Until then, hold off on aggressive marketing — the system works in code but hasn't been observed end-to-end on production.

**Pending items still on the user's plate** (separate from this runbook):
- Mobile L–S device matrix (iPhone SE / iPhone 15 Pro / Pixel 7) per `2026-05-08-live-smoke-and-eas-preview-runbook.md`.
- `eas build --profile preview` for Android APK + iOS simulator.
- Master ICMarkets MT5 → eventually move from your laptop to a separate small VPS so signals don't depend on your laptop being on (per the side question earlier today).
