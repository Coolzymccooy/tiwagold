# Tiwa Gold — go-live runbook

How to take the app from mock mode to a live, controlled-cohort launch against
the cloud-api at `https://tiwa.tiwaton.co.uk`.

## What "live" means
`app.config.ts` overlays env onto `app.json#extra`. The app uses the live
backend when `isLiveBackendEnabled()` → `USE_LIVE_BACKEND=true` **and**
`PERSONA_OVERSEER_BASE_URL` set. Dev (`expo start`) stays on mock unless you set
those env vars locally.

## 1. Code (merged)
- cloud-api: data-isolation hardening (diag endpoints admin-gated; approve UPDATE
  userId-scoped; `queueCancel` userId param) and the deduped health-brief verdict.
- mobile: `mt5.ts` skips the mock signed-intent on the live backend so Secure
  Connect reaches `POST /broker/connections` (Bearer-only). Approvals already use
  the on-device P-256 signed-intent flow.

## 2. Build config
- **Non-secret** (committed in `eas.json` `preview`/`production` `env`):
  `USE_LIVE_BACKEND=true`, `PERSONA_OVERSEER_BASE_URL=https://tiwa.tiwaton.co.uk`.
- **Secrets** (set as EAS secrets — needed only for the Path-B `/trading/*`
  read screens, NOT for connect/approve):
  ```
  eas secret:create --scope project --name PERSONA_OVERSEER_API_KEY --value <DASHBOARD_API_KEY>
  eas secret:create --scope project --name PERSONA_OVERSEER_DEVICE_TOKEN --value <TIWA_DEVICE_TOKEN>
  ```
  (Values are the cloud-api Coolify env of the same name.)

## 3. Build + distribute
```
eas build --profile preview --platform android   # internal APK for the cohort
# or --platform ios (simulator/internal)
```

## 4. Device dry-run (the launch gate — unit tests can't cover device crypto)
On a real device, with a demo MT5 account (IC Markets / Blue Guardian):
1. **Sign in** → access token issued.
2. **Settings → Secure Connect** the demo account (login/password/server). Expect
   "connected" — no "signed-intent not wired" error. → requirement #1.
3. **Confirm isolation**: a second test user sees only their own portfolio /
   pending. → requirement #2 (also enforced + tested server-side).
4. **Approve a signal**: Pending Signals → Approve → device signs (Secure
   Enclave/Keystore) → mint → row flips `approved` → EA fills on MT5. → req #3.

## 5. Per-user execution bridge (operator)
Each connected user needs their MT5 container/bridge provisioned. The admin
provisioning daemon consumes `GET/POST /admin/broker-connections/...` (Bearer
`TIWA_PROVISIONING_KEY`). For a few users this can be run manually; see
`apps/execution-image/provision.sh` in the cloud-api repo.

## 6. Ops / security
- `TIWA_PROVISIONING_KEY` — must be set on cloud-api (it is). Also gates the
  `/api/diag/*` endpoints now.
- **Rotate `BRIDGE_SECRET`** — do this in a **coordinated** step: it's shared with
  the live EA/sidecar, so rotate the cloud-api env **and** the EA's
  `Common\Files\tiwa-bridge\secret.txt` together, or the live bridge disconnects.
  (Not done automatically for this reason.)
- Do not widen beyond the test cohort until the device dry-run passes.
