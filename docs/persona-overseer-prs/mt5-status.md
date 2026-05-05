# PR draft for `persona-overseer` — sanitized `GET /trading/mt5-status`

**Target repo:** [persona-overseer](https://github.com/Coolzymccooy/persona-overseer)
**Target file:** `apps/cloud-api/src/services/trading/tradingview-webhook.ts`
**Auth realm:** `DASHBOARD_API_KEY` (`x-api-key` header or `?key=` query)
**Branch suggestion:** `feat/sanitized-mt5-status`

> This file is a **draft prepared by the Tiwa Gold mobile repo** for human review. The mobile repo will not push to `persona-overseer` autonomously. Copy the snippet into a feature branch on the persona-overseer repo, run its existing tests, and open the PR yourself.

## Why

The mobile app needs to render an "MT5 connection" status card on Settings that shows whether the EA is online, the bound account/server/broker, balance, and equity. Today, the only way to read this is `GET /api/mt5/status?secret=…` which is gated by `BRIDGE_SECRET` — a privileged secret meant for the laptop EA only.

Embedding `BRIDGE_SECRET` in the mobile app would be a leakage of a high-privilege secret onto a public-by-default client. Industry guidance (Expo docs, OWASP MASVS) is clear: **never embed bridge / EA / write-scope secrets in a mobile binary**.

The fix is a sanitized read endpoint behind the existing `DASHBOARD_API_KEY` realm — the same realm the React dashboard already uses for `/trading/journal`, `/trading/gold`, etc.

## What this PR does

Adds a single new route to the existing trading routes module, registered alongside `/trading/journal` and friends:

```ts
// apps/cloud-api/src/services/trading/tradingview-webhook.ts

import { getLastHeartbeat, isBridgeOnline } from "./mt5-execution-queue";

export function registerTradingRoutes(app: FastifyInstance) {
  // ... existing routes ...

  // Sanitized MT5 status — DASHBOARD_API_KEY-gated, read-only.
  // Mirror of /api/mt5/status but without exposing BRIDGE_SECRET.
  // Mobile clients consume this via x-api-key header.
  app.get("/trading/mt5-status", async (request, reply) => {
    if (!checkAuth(request, reply)) return;
    try {
      const hb = getLastHeartbeat();
      const online = isBridgeOnline();
      // Surface only fields a mobile client legitimately needs to render
      // a status card. Never return secrets, never return execution-queue
      // contents, never return raw position arrays (those leak strategy).
      const account = hb
        ? {
            number: hb.accountNumber ?? hb.account_number ?? null,
            broker: hb.broker ?? null,
            server: hb.server ?? null,
            balance: typeof hb.balance === "number" ? hb.balance : null,
            equity: typeof hb.equity === "number" ? hb.equity : null,
            openPositions: hb.openPositions ?? hb.open_positions ?? 0,
            connectedToBroker:
              (hb.connectedToBroker ?? hb.connected_to_broker ?? false) === true,
          }
        : null;
      return reply.send({
        online,
        lastHeartbeat: hb?.createdAt ?? hb?.created_at ?? null,
        account,
      });
    } catch (err: any) {
      app.log.error(`mt5-status error: ${err?.message ?? err}`);
      return reply.status(500).send({ error: "mt5_status_unavailable" });
    }
  });
}
```

## Response shape (the mobile contract will pin to this)

```ts
interface Mt5StatusDto {
  online: boolean;
  lastHeartbeat: string | null;  // ISO-8601
  account: {
    number: number | string | null;
    broker: string | null;
    server: string | null;
    balance: number | null;
    equity: number | null;
    openPositions: number;
    connectedToBroker: boolean;
  } | null;
}
```

Mobile pins this in `src/types/dto/mt5-status.ts` (Zod-validated) once the endpoint ships.

## What this PR does NOT do

- **No write semantics.** No place / cancel / modify routes. Mobile remains read-only against this endpoint.
- **No position arrays exposed.** The existing `/api/mt5/status` returns `recentRequests` and indirectly leaks pending order details — the sanitized version drops these.
- **No `BRIDGE_SECRET` change.** Same secret, same EA polling path, untouched.
- **No new dependencies.**

## Test plan

- [ ] Add a unit test for `/trading/mt5-status`:
  - returns 401 when `DASHBOARD_API_KEY` is set and request lacks `x-api-key`
  - returns 200 with the sanitized shape when key matches
  - returns `online: false, account: null` when no heartbeat row exists
- [ ] Hit the live deployment with `curl -H "x-api-key: $DASHBOARD_API_KEY" https://tiwa.tiwaton.co.uk/trading/mt5-status` and confirm shape matches the DTO above.
- [ ] Verify EA still polls `/api/mt5/heartbeat` and `/api/mt5/execution-requests` — no behavior change to BRIDGE_SECRET routes.

## Rollout

Additive endpoint. No migration. Coolify auto-deploys on push to main.

## Follow-up (NOT this PR)

These are separate persona-overseer PRs that the Tiwa Gold mobile app will eventually need:

1. `GET /trading/kill-switch` — sanitized read of the global kill-switch state (DASHBOARD_API_KEY).
2. `POST /trading/kill-switch/confirm` — kill-switch toggle via signed-intent (requires JWT auth realm, blocking on mobile JWT system).
3. `GET /trading/candidates` — pre-trigger candidate list with approve/reject actions (requires JWT auth realm).
4. Full per-user JWT auth realm + per-user broker connection storage (multi-tenant pivot — see `tiwagold/docs/backend-gap-matrix.md` §0.8).

## Author note

Drafted by Tiwa Gold mobile repo for review. Authoritative source: [tiwagold/docs/persona-overseer-prs/mt5-status.md](docs/persona-overseer-prs/mt5-status.md). Sync this file back into the mobile repo if the PR shape changes.
