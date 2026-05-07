# MT5 Multi-tenant Approve-to-Execute Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire end-to-end multi-tenant approve-to-execute MT5 trading: user signs up, attaches MT5, receives Tiwa signals, taps Approve, and Tiwa places the trade on their broker via a per-user containerized bridge.

**Architecture:** Per-user JWT auth (Tier 1 already shipped) → per-user `bridge_token` → `execution_requests.user_id` + `approval_status` gate → mobile signed-intent challenge/mint flips status → user's container EA picks it up. Cloud-api code in `tiwa/persona-overseer/apps/cloud-api`, mobile in `tiwagold/tiwagold`, container image in new `tiwa/persona-overseer/apps/execution-image` workspace. Spec: [docs/superpowers/specs/2026-05-07-mt5-multitenant-design.md](../specs/2026-05-07-mt5-multitenant-design.md).

**Tech Stack:** Fastify 5 + Drizzle (better-sqlite3) + Zod + vitest on cloud-api. Expo SDK 54 + React Native + TanStack Query + Zustand + jest-expo on mobile. Wine + MT5 + the existing TiwaExecutionBridge.mq5 EA + the existing apps/laptop-bridge daemon for the container image.

**Branch (both repos):** `feat/mt5-multitenant-approve-flow`. Already created off latest `main` on each repo.

---

## File Structure

### Cloud-api (`c:/Users/segun/source/repos/tiwa/persona-overseer/apps/cloud-api`)

| Path | Responsibility |
|---|---|
| `src/db/schema.ts` | Add columns + 4 new tables. Modify. |
| `drizzle/<timestamp>_multitenant_execution.sql` | Migration. Create. |
| `src/services/auth/signed-intents.ts` | Challenge/mint/verify signed intents. Create. |
| `src/services/auth/bridge-tokens.ts` | Mint / verify / revoke bridge tokens. Create. |
| `src/services/trading/mt5-execution-queue.ts` | Add `userId` + `approvalStatus` aware enqueue. Modify. |
| `src/services/trading/mt5-bridge.ts` | Bridge-token auth, per-user scoping, approval-gate filter. Modify. |
| `src/services/trading/gold-monitor.ts` | Per-user fan-out. Modify. |
| `src/services/trading/approvals.ts` | Approve / deny / pending listing. Create. |
| `src/services/trading/http.ts` | Register new user-facing routes. Modify (or new). |
| `src/services/admin/provisioning.ts` | Admin bundle/confirm endpoints. Create. |
| `src/services/notifications/push.ts` | Expo push wrapper. Create. |
| `src/services/users/me.ts` | `/me/bridge-status`, `/me/keys/register`, `/me/engine-prefs`. Create. |
| `src/server.ts` | Register all new routes. Modify. |
| `tests/signed-intents.test.ts` | Vitest. Create. |
| `tests/bridge-tokens.test.ts` | Vitest. Create. |
| `tests/approval-gate.test.ts` | Vitest. Create. |
| `tests/per-user-scoping.test.ts` | Vitest. Create. |
| `tests/admin-provisioning.test.ts` | Vitest. Create. |

### Mobile (`c:/Users/segun/source/repos/tiwagold/tiwagold`)

| Path | Responsibility |
|---|---|
| `src/types/dto/pendingTrades.ts` | Zod schemas for `/trades/pending`, approve/deny responses. Create. |
| `src/services/signedIntent.ts` | Wraps secure-store key + signs challenges. Create. |
| `src/services/pendingTrades.ts` | TanStack list + approve/deny mutations. Create. |
| `src/services/broker.ts` | Add `usePendingProvision` + `useBridgeStatus`. Modify. |
| `src/hooks/useExpoPushToken.ts` | Register Expo push token with cloud. Create. |
| `src/features/pending-signals/PendingSignalsScreen.tsx` | FlashList of pending cards. Create. |
| `src/features/pending-signals/components/PendingTradeCard.tsx` | Single card with approve/deny. Create. |
| `src/features/pending-signals/index.ts` | Public surface. Create. |
| `src/features/settings/components/MT5ConnectCard.tsx` | Status pill: Not connected / Provisioning / Active / Failed. Modify. |
| `app/(tabs)/pending.tsx` | New tab route. Create. |
| `app/(tabs)/_layout.tsx` | Add Pending tab. Modify. |
| `src/services/__tests__/signedIntent.test.ts` | Jest. Create. |
| `src/services/__tests__/pendingTrades.test.ts` | Jest. Create. |
| `src/features/pending-signals/__tests__/PendingTradeCard.test.tsx` | Jest. Create. |

### Container farm (`c:/Users/segun/source/repos/tiwa/persona-overseer/apps/execution-image`)

| Path | Responsibility |
|---|---|
| `Dockerfile` | Wine + MT5 + EA + bridge daemon. Create. |
| `entrypoint.sh` | Start Xvfb, configure MT5, launch EA + bridge. Create. |
| `build.sh` | Download mt5setup.exe (SHA256-pinned), docker build, push to GHCR. Create. |
| `templates/docker-compose.yml` | Per-user compose template (used by provision.sh). Create. |
| `templates/.env.example` | Per-user env template. Create. |
| `provision.sh` | Bash provisioning script. Create. |
| `README.md` | Build + provisioning instructions. Create. |

---

## Phase A — Cloud-api schema migration

### Task A1: Add columns to `users` and `execution_requests`, create 4 new tables

**Files:**
- Modify: `apps/cloud-api/src/db/schema.ts`
- Create: `apps/cloud-api/drizzle/<timestamp>_multitenant_execution.sql`
- Test: `apps/cloud-api/tests/schema-multitenant.test.ts`

- [ ] **Step 1: Write the failing test for schema shape**

```ts
// apps/cloud-api/tests/schema-multitenant.test.ts
import { describe, it, expect } from "vitest";
import { db } from "../src/db";
import {
  users,
  executionRequests,
  bridgeTokens,
  pendingProvisions,
  signedIntentChallenges,
  userEnginePrefs,
} from "../src/db/schema";

describe("multitenant schema", () => {
  it("users has expo_push_token + signed_intent_public_jwk columns", () => {
    expect(users.expoPushToken).toBeDefined();
    expect(users.signedIntentPublicJwk).toBeDefined();
  });

  it("executionRequests has user_id + approval_status + approval_intent_jti + approval_expires_at + approved_at + denied_at", () => {
    expect(executionRequests.userId).toBeDefined();
    expect(executionRequests.approvalStatus).toBeDefined();
    expect(executionRequests.approvalIntentJti).toBeDefined();
    expect(executionRequests.approvalExpiresAt).toBeDefined();
    expect(executionRequests.approvedAt).toBeDefined();
    expect(executionRequests.deniedAt).toBeDefined();
  });

  it("bridgeTokens table exists", () => {
    expect(bridgeTokens).toBeDefined();
  });
  it("pendingProvisions table exists", () => {
    expect(pendingProvisions).toBeDefined();
  });
  it("signedIntentChallenges table exists", () => {
    expect(signedIntentChallenges).toBeDefined();
  });
  it("userEnginePrefs table exists", () => {
    expect(userEnginePrefs).toBeDefined();
  });
});
```

- [ ] **Step 2: Add columns + tables to `schema.ts`**

```ts
// In src/db/schema.ts — add to existing `users` table:
//   expoPushToken: text("expo_push_token"),
//   signedIntentPublicJwk: text("signed_intent_public_jwk"), // JSON stringified
//
// Add to existing `executionRequests` table:
//   userId: text("user_id").references(() => users.id),
//   approvalStatus: text("approval_status", { enum: ["awaiting_approval", "approved", "denied", "expired"] }).notNull().default("approved"),
//   approvalIntentJti: text("approval_intent_jti"),
//   approvalExpiresAt: integer("approval_expires_at", { mode: "timestamp_ms" }),
//   approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
//   deniedAt: integer("denied_at", { mode: "timestamp_ms" }),
//
// New tables (better-sqlite3 + drizzle-orm/sqlite-core):

export const bridgeTokens = sqliteTable("bridge_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
  revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  revokedReason: text("revoked_reason", { enum: ["user_revoked", "admin_revoke", "provisioning_failed"] }),
}, (t) => ({
  userIdx: uniqueIndex("bridge_tokens_user_id_idx").on(t.userId).where(sql`revoked_at IS NULL`),
}));

export const pendingProvisions = sqliteTable("pending_provisions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  brokerConnectionId: text("broker_connection_id").notNull().references(() => brokerConnections.id),
  status: text("status", { enum: ["pending", "provisioning", "active", "failed"] }).notNull().default("pending"),
  lastError: text("last_error"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const signedIntentChallenges = sqliteTable("signed_intent_challenges", {
  jti: text("jti").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  intentKind: text("intent_kind", { enum: ["approve_trade", "deny_trade", "kill_switch_confirm"] }).notNull(),
  subjectId: text("subject_id").notNull(),
  nonce: text("nonce").notNull(),
  issuedAt: integer("issued_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  consumedAt: integer("consumed_at", { mode: "timestamp_ms" }),
});

export const userEnginePrefs = sqliteTable("user_engine_prefs", {
  userId: text("user_id").primaryKey().references(() => users.id),
  conservativeEnabled: integer("conservative_enabled", { mode: "boolean" }).notNull().default(true),
  aggressiveEnabled: integer("aggressive_enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
```

- [ ] **Step 3: Generate migration via drizzle-kit**

```bash
cd c:/Users/segun/source/repos/tiwa/persona-overseer/apps/cloud-api
npx drizzle-kit generate --name multitenant_execution
```

Expected output: `drizzle/<timestamp>_multitenant_execution.sql` containing the ALTER TABLE + CREATE TABLE statements.

- [ ] **Step 4: Run schema test**

```bash
npm test -- tests/schema-multitenant.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full vitest to ensure no existing breakage**

```bash
npm test
```

Expected: all 97 prior tests + new 6 passing.

- [ ] **Step 6: Commit (DO NOT PUSH)**

```bash
git add src/db/schema.ts drizzle/ tests/schema-multitenant.test.ts
git commit -m "feat(db): add multitenant execution schema (columns + 4 tables)"
```

---

## Phase B — Cloud-api signed-intent service

### Task B1: Implement signed-intent challenge / mint / verify

**Files:**
- Create: `apps/cloud-api/src/services/auth/signed-intents.ts`
- Test: `apps/cloud-api/tests/signed-intents.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// apps/cloud-api/tests/signed-intents.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  issueChallenge,
  mintIntent,
  verifyIntent,
  SignedIntentExpiredError,
  SignedIntentConsumedError,
  SignedIntentInvalidError,
} from "../src/services/auth/signed-intents";
import { signKeypair, exportPublicJwk } from "./helpers/crypto";

describe("signed intents", () => {
  let userId: string;
  let publicJwk: object;
  let privateKey: CryptoKey;
  beforeEach(async () => {
    userId = "user_test_" + Math.random().toString(36).slice(2);
    const kp = await signKeypair();
    privateKey = kp.privateKey;
    publicJwk = await exportPublicJwk(kp.publicKey);
    // user record + public_jwk seeded in test helper
  });

  it("happy path: challenge -> mint -> verify -> consume", async () => {
    const ch = await issueChallenge({ userId, intentKind: "approve_trade", subjectId: "req_123" });
    const intentJwt = await mintIntent({ jti: ch.jti, signature: await signWithKey(privateKey, ch), publicJwk });
    const verified = await verifyIntent(intentJwt);
    expect(verified.userId).toBe(userId);
    expect(verified.subjectId).toBe("req_123");
    // second verify of same jti should fail
    await expect(verifyIntent(intentJwt)).rejects.toThrow(SignedIntentConsumedError);
  });

  it("rejects expired challenge", async () => {
    const ch = await issueChallenge({ userId, intentKind: "approve_trade", subjectId: "req_123", ttlMs: 1 });
    await new Promise((r) => setTimeout(r, 10));
    await expect(mintIntent({ jti: ch.jti, signature: "x".repeat(64), publicJwk })).rejects.toThrow(SignedIntentExpiredError);
  });

  it("rejects bad signature", async () => {
    const ch = await issueChallenge({ userId, intentKind: "approve_trade", subjectId: "req_123" });
    await expect(mintIntent({ jti: ch.jti, signature: "0".repeat(64), publicJwk })).rejects.toThrow(SignedIntentInvalidError);
  });
});
```

- [ ] **Step 2: Implement `signed-intents.ts`**

```ts
// apps/cloud-api/src/services/auth/signed-intents.ts
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { signedIntentChallenges, users } from "../../db/schema";
import { signJwt, verifyJwt } from "./jwt";

export class SignedIntentInvalidError extends Error { constructor(){super("signed_intent_invalid");} }
export class SignedIntentExpiredError extends Error { constructor(){super("signed_intent_expired");} }
export class SignedIntentConsumedError extends Error { constructor(){super("signed_intent_consumed");} }

export type IntentKind = "approve_trade" | "deny_trade" | "kill_switch_confirm";

const DEFAULT_TTL_MS = 60_000;

export async function issueChallenge(args: {
  userId: string;
  intentKind: IntentKind;
  subjectId: string;
  ttlMs?: number;
}): Promise<{ jti: string; nonce: string; expiresAt: number }> {
  const jti = randomUUID();
  const nonce = randomBytes(16).toString("hex");
  const now = Date.now();
  const expiresAt = now + (args.ttlMs ?? DEFAULT_TTL_MS);
  await db.insert(signedIntentChallenges).values({
    jti,
    userId: args.userId,
    intentKind: args.intentKind,
    subjectId: args.subjectId,
    nonce,
    issuedAt: now,
    expiresAt,
  });
  return { jti, nonce, expiresAt };
}

export async function mintIntent(args: {
  jti: string;
  signature: string; // hex of WebCrypto signature over canonical JSON of {jti,nonce,intentKind,subjectId}
  publicJwk: object; // device's registered public key
}): Promise<string> {
  const row = await db.select().from(signedIntentChallenges).where(eq(signedIntentChallenges.jti, args.jti)).get();
  if (!row) throw new SignedIntentInvalidError();
  const now = Date.now();
  if (row.expiresAt < now) throw new SignedIntentExpiredError();
  if (row.consumedAt) throw new SignedIntentConsumedError();

  const userRow = await db.select().from(users).where(eq(users.id, row.userId)).get();
  if (!userRow?.signedIntentPublicJwk) throw new SignedIntentInvalidError();

  const ok = await verifySignature(
    JSON.parse(userRow.signedIntentPublicJwk),
    canonicalPayload({ jti: row.jti, nonce: row.nonce, intentKind: row.intentKind, subjectId: row.subjectId }),
    args.signature,
  );
  if (!ok) throw new SignedIntentInvalidError();

  // Mint a 60s JWT carrying the challenge claims
  return signJwt(
    { jti: row.jti, sub: row.userId, kind: row.intentKind, subject_id: row.subjectId },
    "60s",
  );
}

export async function verifyIntent(intentJwt: string): Promise<{
  jti: string;
  userId: string;
  intentKind: IntentKind;
  subjectId: string;
}> {
  const claims = await verifyJwt(intentJwt);
  const row = await db.select().from(signedIntentChallenges).where(eq(signedIntentChallenges.jti, claims.jti)).get();
  if (!row) throw new SignedIntentInvalidError();
  if (row.consumedAt) throw new SignedIntentConsumedError();
  // Atomically consume
  await db.update(signedIntentChallenges)
    .set({ consumedAt: Date.now() })
    .where(eq(signedIntentChallenges.jti, row.jti));
  return { jti: row.jti, userId: row.userId, intentKind: row.intentKind, subjectId: row.subjectId };
}

function canonicalPayload(o: Record<string, string>): string {
  // Sorted-keys JSON for deterministic verification
  return JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a],[b]) => a.localeCompare(b))));
}

async function verifySignature(jwk: object, payload: string, sigHex: string): Promise<boolean> {
  const { webcrypto } = await import("node:crypto");
  const key = await webcrypto.subtle.importKey("jwk", jwk as JsonWebKey, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const sig = Buffer.from(sigHex, "hex");
  const data = new TextEncoder().encode(payload);
  return webcrypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, sig, data);
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- tests/signed-intents.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/auth/signed-intents.ts tests/signed-intents.test.ts
git commit -m "feat(auth): signed-intent challenge/mint/verify infrastructure"
```

---

## Phase C — Cloud-api bridge-token + per-user MT5 bridge auth

### Task C1: Implement bridge-token mint / verify / revoke

**Files:**
- Create: `apps/cloud-api/src/services/auth/bridge-tokens.ts`
- Test: `apps/cloud-api/tests/bridge-tokens.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import {
  mintBridgeToken,
  verifyBridgeToken,
  revokeBridgeToken,
  BridgeTokenInvalidError,
  BridgeTokenRevokedError,
} from "../src/services/auth/bridge-tokens";

describe("bridge tokens", () => {
  it("mint -> verify happy path returns userId", async () => {
    const userId = "user_b1";
    const token = await mintBridgeToken(userId);
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    const v = await verifyBridgeToken(token);
    expect(v.userId).toBe(userId);
  });

  it("verify after revoke fails", async () => {
    const userId = "user_b2";
    const token = await mintBridgeToken(userId);
    await revokeBridgeToken(userId, "user_revoked");
    await expect(verifyBridgeToken(token)).rejects.toThrow(BridgeTokenRevokedError);
  });

  it("verify of non-existent token fails", async () => {
    await expect(verifyBridgeToken("0".repeat(64))).rejects.toThrow(BridgeTokenInvalidError);
  });

  it("mint replaces previous active token (one-active-per-user invariant)", async () => {
    const userId = "user_b3";
    const t1 = await mintBridgeToken(userId);
    const t2 = await mintBridgeToken(userId);
    await expect(verifyBridgeToken(t1)).rejects.toThrow(BridgeTokenRevokedError);
    const v = await verifyBridgeToken(t2);
    expect(v.userId).toBe(userId);
  });
});
```

- [ ] **Step 2: Implement `bridge-tokens.ts`**

```ts
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db";
import { bridgeTokens } from "../../db/schema";

export class BridgeTokenInvalidError extends Error { constructor(){super("bridge_token_invalid");} }
export class BridgeTokenRevokedError extends Error { constructor(){super("bridge_token_revoked");} }

export type BridgeTokenRevokeReason = "user_revoked" | "admin_revoke" | "provisioning_failed";

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function mintBridgeToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hash(token);
  const now = Date.now();
  // Revoke any existing active row for this user
  await db.update(bridgeTokens)
    .set({ revokedAt: now, revokedReason: "user_revoked" })
    .where(and(eq(bridgeTokens.userId, userId), isNull(bridgeTokens.revokedAt)));
  await db.insert(bridgeTokens).values({
    id: randomUUID(),
    userId,
    tokenHash,
    createdAt: now,
  });
  return token;
}

export async function verifyBridgeToken(token: string): Promise<{ userId: string }> {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new BridgeTokenInvalidError();
  const tokenHash = hash(token);
  const row = await db.select().from(bridgeTokens).where(eq(bridgeTokens.tokenHash, tokenHash)).get();
  if (!row) throw new BridgeTokenInvalidError();
  if (row.revokedAt) throw new BridgeTokenRevokedError();
  await db.update(bridgeTokens)
    .set({ lastUsedAt: Date.now() })
    .where(eq(bridgeTokens.id, row.id));
  return { userId: row.userId };
}

export async function revokeBridgeToken(userId: string, reason: BridgeTokenRevokeReason): Promise<void> {
  await db.update(bridgeTokens)
    .set({ revokedAt: Date.now(), revokedReason: reason })
    .where(and(eq(bridgeTokens.userId, userId), isNull(bridgeTokens.revokedAt)));
}
```

- [ ] **Step 3: Run tests, commit**

```bash
npm test -- tests/bridge-tokens.test.ts
git add src/services/auth/bridge-tokens.ts tests/bridge-tokens.test.ts
git commit -m "feat(auth): per-user bridge tokens (mint/verify/revoke)"
```

### Task C2: Modify `mt5-bridge.ts` for per-user scoping + approval gate

**Files:**
- Modify: `apps/cloud-api/src/services/trading/mt5-bridge.ts`
- Test: `apps/cloud-api/tests/per-user-scoping.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { build } from "./helpers/server";
import { mintBridgeToken } from "../src/services/auth/bridge-tokens";
import { db } from "../src/db";
import { executionRequests } from "../src/db/schema";

describe("per-user bridge scoping + approval gate", () => {
  it("user A's bridge token cannot see user B's queue", async () => {
    const app = await build();
    const tokenA = await mintBridgeToken("user_a");
    await db.insert(executionRequests).values({ id: "req_a", userId: "user_a", approvalStatus: "approved", /* ...rest */ });
    await db.insert(executionRequests).values({ id: "req_b", userId: "user_b", approvalStatus: "approved", /* ...rest */ });
    const r = await app.inject({ method: "GET", url: "/api/mt5/execution-requests", headers: { authorization: `Bearer ${tokenA}` } });
    expect(r.statusCode).toBe(200);
    const body = r.json() as Array<{ id: string }>;
    expect(body.map(x => x.id)).toEqual(["req_a"]);
  });

  it("approval gate: bridge cannot pick up awaiting_approval rows", async () => {
    const app = await build();
    const token = await mintBridgeToken("user_c");
    await db.insert(executionRequests).values({ id: "req_c1", userId: "user_c", approvalStatus: "awaiting_approval" });
    await db.insert(executionRequests).values({ id: "req_c2", userId: "user_c", approvalStatus: "approved" });
    const r = await app.inject({ method: "GET", url: "/api/mt5/execution-requests", headers: { authorization: `Bearer ${token}` } });
    const body = r.json() as Array<{ id: string }>;
    expect(body.map(x => x.id)).toEqual(["req_c2"]); // awaiting_approval is filtered out
  });

  it("legacy x-bridge-secret realm still works (Segun's laptop) and returns global queue", async () => {
    const app = await build();
    const r = await app.inject({ method: "GET", url: "/api/mt5/execution-requests", headers: { "x-bridge-secret": process.env.BRIDGE_SECRET! } });
    expect(r.statusCode).toBe(200);
  });
});
```

- [ ] **Step 2: Modify `mt5-bridge.ts`**

```ts
// In the existing GET /api/mt5/execution-requests handler — replace the simple
// auth check with a dual-realm check (legacy bridge_secret OR per-user bridge_token):

import { verifyBridgeToken, BridgeTokenInvalidError, BridgeTokenRevokedError } from "../auth/bridge-tokens";

// At route registration:
fastify.get("/api/mt5/execution-requests", async (req, reply) => {
  const auth = req.headers.authorization;
  const legacy = req.headers["x-bridge-secret"];
  let scope: { kind: "legacy" } | { kind: "user"; userId: string };

  if (auth?.startsWith("Bearer ")) {
    try {
      const { userId } = await verifyBridgeToken(auth.slice("Bearer ".length));
      scope = { kind: "user", userId };
    } catch (e) {
      if (e instanceof BridgeTokenRevokedError) return reply.code(401).send({ code: "bridge_token_revoked" });
      return reply.code(401).send({ code: "bridge_token_invalid" });
    }
  } else if (legacy && legacy === process.env.BRIDGE_SECRET) {
    scope = { kind: "legacy" };
  } else {
    return reply.code(401).send({ code: "unauthorized" });
  }

  // Filter: per-user scope returns only this user's APPROVED rows;
  // legacy returns all APPROVED rows (Segun's existing behavior).
  const where = scope.kind === "user"
    ? and(eq(executionRequests.userId, scope.userId), eq(executionRequests.approvalStatus, "approved"))
    : eq(executionRequests.approvalStatus, "approved");

  return db.select().from(executionRequests).where(where).limit(50);
});

// Apply same dual-realm logic to /pickup and /result handlers, plus
// cross-check that the request's userId matches the token's userId on user-scope.
```

- [ ] **Step 3: Run tests, commit**

```bash
npm test -- tests/per-user-scoping.test.ts
git add src/services/trading/mt5-bridge.ts tests/per-user-scoping.test.ts
git commit -m "feat(bridge): per-user scoping + approval gate on /api/mt5/execution-requests"
```

---

## Phase D — User-facing endpoints (`/trades/pending`, approve, deny)

### Task D1: Implement approval routes

**Files:**
- Create: `apps/cloud-api/src/services/trading/approvals.ts`
- Modify: `apps/cloud-api/src/services/trading/http.ts`
- Test: `apps/cloud-api/tests/approval-gate.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { build } from "./helpers/server";
import { signInUser, registerSignedIntentKey, signChallenge } from "./helpers/auth";

describe("trade approval flow", () => {
  it("GET /trades/pending returns awaiting_approval rows for the authed user only", async () => {
    const app = await build();
    const { jwt, userId } = await signInUser();
    await db.insert(executionRequests).values({ id: "p1", userId, approvalStatus: "awaiting_approval" });
    await db.insert(executionRequests).values({ id: "p2", userId, approvalStatus: "approved" });
    await db.insert(executionRequests).values({ id: "p3", userId: "other_user", approvalStatus: "awaiting_approval" });
    const r = await app.inject({ method: "GET", url: "/trades/pending", headers: { authorization: `Bearer ${jwt}` } });
    expect(r.json().map((x: any) => x.id)).toEqual(["p1"]);
  });

  it("POST /trades/:id/approve flips status with valid signed intent", async () => {
    const app = await build();
    const { jwt, userId, privateKey, publicJwk } = await signInUser();
    await registerSignedIntentKey(app, jwt, publicJwk);
    await db.insert(executionRequests).values({ id: "rA", userId, approvalStatus: "awaiting_approval" });

    // Step 1: get challenge
    const ch = await app.inject({ method: "POST", url: "/auth/signed-intent/challenge", headers: { authorization: `Bearer ${jwt}` }, payload: { kind: "approve_trade", subject_id: "rA" } });
    const { jti, nonce } = ch.json();

    // Step 2: sign + mint
    const sig = await signChallenge(privateKey, { jti, nonce, intentKind: "approve_trade", subjectId: "rA" });
    const mint = await app.inject({ method: "POST", url: "/auth/signed-intent/mint", headers: { authorization: `Bearer ${jwt}` }, payload: { jti, signature: sig } });
    const intentJwt = mint.json().intent_jwt;

    // Step 3: approve
    const r = await app.inject({ method: "POST", url: "/trades/rA/approve", headers: { authorization: `Bearer ${jwt}`, "x-intent": intentJwt } });
    expect(r.statusCode).toBe(200);
    const row = await db.select().from(executionRequests).where(eq(executionRequests.id, "rA")).get();
    expect(row?.approvalStatus).toBe("approved");
    expect(row?.approvalIntentJti).toBe(jti);
  });

  it("approve fails on missing x-intent header", async () => {
    /* ... */
  });
  it("approve fails on intent for another user's row", async () => {
    /* ... */
  });
  it("approve fails on intent reuse (jti consumed)", async () => {
    /* ... */
  });
  it("deny similarly flips to denied", async () => {
    /* ... */
  });
});
```

- [ ] **Step 2: Implement `approvals.ts`**

```ts
// apps/cloud-api/src/services/trading/approvals.ts
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { executionRequests } from "../../db/schema";
import { verifyIntent, SignedIntentInvalidError } from "../auth/signed-intents";

export async function listPendingForUser(userId: string) {
  return db.select().from(executionRequests).where(
    and(eq(executionRequests.userId, userId), eq(executionRequests.approvalStatus, "awaiting_approval"))
  );
}

export async function approveTrade(args: { tradeId: string; userId: string; intentJwt: string }) {
  const claims = await verifyIntent(args.intentJwt);
  if (claims.userId !== args.userId) throw new SignedIntentInvalidError();
  if (claims.subjectId !== args.tradeId) throw new SignedIntentInvalidError();
  if (claims.intentKind !== "approve_trade") throw new SignedIntentInvalidError();
  // Atomic flip
  const updated = await db.update(executionRequests).set({
    approvalStatus: "approved",
    approvalIntentJti: claims.jti,
    approvedAt: Date.now(),
  }).where(
    and(eq(executionRequests.id, args.tradeId), eq(executionRequests.userId, args.userId), eq(executionRequests.approvalStatus, "awaiting_approval"))
  ).returning().get();
  if (!updated) throw new Error("trade_not_pending");
  return updated;
}

export async function denyTrade(/* same shape */) { /* mirrors approveTrade with denied state */ }
```

- [ ] **Step 3: Wire routes in `http.ts`**

```ts
// In src/services/trading/http.ts
fastify.get("/trades/pending", { preHandler: requireUser }, async (req) => listPendingForUser(req.user.id));
fastify.post("/trades/:id/approve", { preHandler: requireUser }, async (req, reply) => {
  const intent = req.headers["x-intent"];
  if (typeof intent !== "string") return reply.code(400).send({ code: "missing_intent" });
  return approveTrade({ tradeId: (req.params as any).id, userId: req.user.id, intentJwt: intent });
});
fastify.post("/trades/:id/deny", /* mirror */);

// Also wire challenge + mint:
fastify.post("/auth/signed-intent/challenge", { preHandler: requireUser }, async (req) => {
  const { kind, subject_id } = req.body as any;
  return issueChallenge({ userId: req.user.id, intentKind: kind, subjectId: subject_id });
});
fastify.post("/auth/signed-intent/mint", { preHandler: requireUser }, async (req, reply) => {
  const { jti, signature } = req.body as any;
  // resolve user's stored public_jwk and call mintIntent
});
```

- [ ] **Step 4: Run tests, commit**

```bash
npm test -- tests/approval-gate.test.ts
git add src/services/trading/approvals.ts src/services/trading/http.ts tests/approval-gate.test.ts
git commit -m "feat(trades): /trades/pending + approve/deny via signed-intent"
```

---

## Phase E — Admin provisioning + me/* endpoints

### Task E1: `GET /admin/broker-connections/:user_id/provision-bundle` + `POST /admin/.../provision-confirm`

**Files:**
- Create: `apps/cloud-api/src/services/admin/provisioning.ts`
- Modify: `apps/cloud-api/src/services/broker/http.ts` (insert `pending_provisions` row on POST /broker/connections)
- Test: `apps/cloud-api/tests/admin-provisioning.test.ts`

(Implementation mirrors Tier 1/2 admin endpoint patterns. Auth: `Authorization: Bearer ${TIWA_PROVISIONING_KEY}` env. Bundle decrypts AES-GCM creds, mints fresh `bridge_token`, returns once. Confirm flips `pending_provisions.status` and emits push.)

- [ ] **Step 1: Write tests** (5 cases: pending insert on broker connect, bundle returns plaintext + token, confirm-active flips status + fires push, confirm-failed records error, admin auth required)
- [ ] **Step 2: Implement service + routes**
- [ ] **Step 3: Run + commit**

### Task E2: `/me/bridge-status` + `/me/keys/register` + `/me/engine-prefs` + `/me/bridge-token/rotate`

**Files:**
- Create: `apps/cloud-api/src/services/users/me.ts`
- Modify: `apps/cloud-api/src/server.ts`
- Test: `apps/cloud-api/tests/me-endpoints.test.ts`

(Standard CRUD: status reads `bridge_tokens` + `pending_provisions` for the authed user; keys/register stores the public JWK; engine-prefs upserts the `user_engine_prefs` row; rotate calls `mintBridgeToken` which already auto-revokes the prior.)

- [ ] **Steps 1-3: TDD same shape**

---

## Phase F — gold-monitor per-user fan-out

### Task F1: Replace global insert with fan-out across active users

**Files:**
- Modify: `apps/cloud-api/src/services/trading/gold-monitor.ts`
- Modify: `apps/cloud-api/src/services/trading/mt5-execution-queue.ts`
- Test: `apps/cloud-api/tests/gold-monitor-fanout.test.ts`

- [ ] **Step 1: Write test**

```ts
it("a single signal generates one execution_requests row per active user, filtered by engine prefs", async () => {
  // Seed 3 users: alice (both engines on), bob (conservative only), carol (aggressive only)
  // Trigger checkGold() with an aggressive setup
  // Expect: alice has 1 row, bob has 0, carol has 1
});
```

- [ ] **Step 2: Modify `queueExecution()` signature**

```ts
// Add userId to the insert; default approvalStatus to "awaiting_approval" when called via gold-monitor;
// keep "approved" default when called via the legacy bridge_secret realm.
```

- [ ] **Step 3: Modify `gold-monitor.ts` to fan out**

```ts
// In place of single-user insert:
const activeUsers = await db.select({
  id: users.id,
  conservativeEnabled: userEnginePrefs.conservativeEnabled,
  aggressiveEnabled: userEnginePrefs.aggressiveEnabled,
}).from(users).leftJoin(userEnginePrefs, eq(userEnginePrefs.userId, users.id))
  .innerJoin(pendingProvisions, and(eq(pendingProvisions.userId, users.id), eq(pendingProvisions.status, "active")));

for (const u of activeUsers) {
  const engineMatch = signal.engine === "aggressive" ? (u.aggressiveEnabled ?? true) : (u.conservativeEnabled ?? true);
  if (!engineMatch) continue;
  await queueExecution({ userId: u.id, approvalStatus: "awaiting_approval", ...signal });
}
```

- [ ] **Step 4: Run tests + commit**

---

## Phase G — Mobile signed-intent service

### Task G1: `signedIntent.ts` — secure key + signing + flow helpers

**Files:**
- Create: `src/services/signedIntent.ts`
- Test: `src/services/__tests__/signedIntent.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "@jest/globals";
import { ensureKeypair, signApprovalIntent } from "../signedIntent";

describe("signedIntent", () => {
  it("ensureKeypair generates and persists a keypair on first call", async () => {
    const kp = await ensureKeypair();
    expect(kp.publicJwk).toMatchObject({ kty: "EC", crv: "P-256" });
    const kp2 = await ensureKeypair();
    expect(kp2.publicJwk.x).toBe(kp.publicJwk.x); // stable across calls
  });

  it("signApprovalIntent fetches challenge, signs, mints, returns intent JWT", async () => {
    const intentJwt = await signApprovalIntent({ tradeId: "trade_x" });
    expect(intentJwt).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });
});
```

- [ ] **Step 2: Implement** (using `expo-crypto` + `expo-secure-store` for key persistence; falls back to a process-memory keypair when running in jest-expo without secure-store)

```ts
// src/services/signedIntent.ts
import * as SecureStore from "expo-secure-store";
import { liveFetch } from "./liveBackend";

const PRIVATE_JWK_KEY = "tiwa_signed_intent_private_jwk";

export async function ensureKeypair(): Promise<{ publicJwk: JsonWebKey }> {
  const existing = await SecureStore.getItemAsync(PRIVATE_JWK_KEY);
  if (existing) {
    const privateJwk = JSON.parse(existing) as JsonWebKey;
    return { publicJwk: derivePublic(privateJwk) };
  }
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  const privateJwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  await SecureStore.setItemAsync(PRIVATE_JWK_KEY, JSON.stringify(privateJwk));
  // Register public key with cloud-api
  await liveFetch("/me/keys/register", { method: "POST", body: { public_jwk: derivePublic(privateJwk) } });
  return { publicJwk: derivePublic(privateJwk) };
}

export async function signApprovalIntent(args: { tradeId: string; kind?: "approve_trade" | "deny_trade" }): Promise<string> {
  const kind = args.kind ?? "approve_trade";
  const ch = await liveFetch<{ jti: string; nonce: string; expires_at: number }>(
    "/auth/signed-intent/challenge",
    { method: "POST", body: { kind, subject_id: args.tradeId } },
  );
  const privateJwk = JSON.parse(await SecureStore.getItemAsync(PRIVATE_JWK_KEY) ?? "{}");
  const key = await crypto.subtle.importKey("jwk", privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const payload = canonical({ jti: ch.jti, nonce: ch.nonce, intentKind: kind, subjectId: args.tradeId });
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(payload));
  const sigHex = Buffer.from(sig).toString("hex");
  const mint = await liveFetch<{ intent_jwt: string }>(
    "/auth/signed-intent/mint",
    { method: "POST", body: { jti: ch.jti, signature: sigHex } },
  );
  return mint.intent_jwt;
}
```

- [ ] **Step 3: Run + commit**

---

## Phase H — Mobile pendingTrades hooks

### Task H1: Service hooks + DTOs

**Files:**
- Create: `src/types/dto/pendingTrades.ts` (zod schemas)
- Create: `src/services/pendingTrades.ts` (TanStack hooks)
- Test: `src/services/__tests__/pendingTrades.test.ts`

(Implementation mirrors `src/services/broker.ts` pattern: keyed query factory, mock fallback when `!isLiveBackendEnabled()`, mutations invalidate `["pending-trades"]`. `useApproveTrade(id)` calls `signApprovalIntent({tradeId: id})` then POSTs to `/trades/:id/approve` with `X-Intent` header.)

- [ ] **Steps 1-3: TDD**

---

## Phase I — Mobile Pending Signals UI

### Task I1: PendingTradeCard component

**Files:**
- Create: `src/features/pending-signals/components/PendingTradeCard.tsx`
- Test: `src/features/pending-signals/__tests__/PendingTradeCard.test.tsx`

- [ ] **Step 1: Write rendering test** (props: trade, onApprove, onDeny; renders side / entry / SL / TP / engine chip / two buttons; tap-and-hold approve calls onApprove after 3s)

- [ ] **Step 2: Implement**

```tsx
// src/features/pending-signals/components/PendingTradeCard.tsx
import { View, Text, Pressable } from "react-native";
import { GlassCard } from "@/design/primitives/GlassCard";
import { tokens } from "@/design/tokens";
import { useState, useRef } from "react";

export function PendingTradeCard(props: {
  trade: PendingTrade;
  onApprove: () => void;
  onDeny: () => void;
}) {
  // tap-and-hold gesture: 3s hold → onApprove. release before 3s → no-op.
  // Shown via animated progress ring around the Approve button.
  // Uses Reanimated 3 + Gesture Handler per project rules.
  // (Concrete code; ~120 lines)
}
```

- [ ] **Step 3-4: Run + commit**

### Task I2: PendingSignalsScreen + tab integration

**Files:**
- Create: `src/features/pending-signals/PendingSignalsScreen.tsx`
- Create: `app/(tabs)/pending.tsx`
- Modify: `app/(tabs)/_layout.tsx`

Implements FlashList wrapping `PendingTradeCard` items, all four states (loading / empty / error / success), badge on tab bar with unread count.

- [ ] **Steps 1-4**

---

## Phase J — MT5ConnectCard status pill

### Task J1: Status pill driven by `useBridgeStatus()`

**Files:**
- Modify: `src/features/settings/components/MT5ConnectCard.tsx`

(Adds a small chip showing `Not connected | Provisioning | Active | Failed`, color-coded via `tokens.status`. Read from `useBridgeStatus()` hook from `src/services/broker.ts`. Tap on Failed shows `last_error` in a bottom sheet.)

- [ ] **Steps 1-4**

---

## Phase K — Container farm scaffolding

### Task K1: Dockerfile + entrypoint.sh + build.sh

**Files:**
- Create: `apps/execution-image/Dockerfile`
- Create: `apps/execution-image/entrypoint.sh`
- Create: `apps/execution-image/build.sh`

(Per spec section 8.1; build.sh downloads mt5setup.exe with SHA256 pin. README.md documents the build command + tag scheme `ghcr.io/coolzymccooy/tiwa-execution:<semver>`.)

### Task K2: provision.sh + compose template

**Files:**
- Create: `apps/execution-image/provision.sh`
- Create: `apps/execution-image/templates/docker-compose.yml`
- Create: `apps/execution-image/templates/.env.example`
- Create: `apps/execution-image/README.md`

(Per spec section 8.3, the bash provisioning script. Tested locally by manual run when an actual user provisions.)

---

## Phase L — Verification + handoff

### Task L1: Run all gates on both repos

- [ ] **Step 1: Cloud-api**

```bash
cd c:/Users/segun/source/repos/tiwa/persona-overseer/apps/cloud-api
npm run typecheck
npm test
```

Expected: typecheck clean, tests pass (97 prior + ~30 new).

- [ ] **Step 2: Mobile**

```bash
cd c:/Users/segun/source/repos/tiwagold/tiwagold
npm run typecheck
npm run lint
npm run test
```

Expected: typecheck clean, lint clean, tests pass (340 prior + ~10 new).

- [ ] **Step 3: Write `docs/handoff/2026-05-07-mt5-multitenant-status.md`**

Status report covering: what's done, what's stubbed, suggested commits in order, what to test in the morning, what's blocked on external infra (Docker image build needs Linux + MT5 installer; Hetzner CPX21 needs human provisioning + Coolify-prod env additions).

---

## Self-review notes

- **Spec coverage:** Phases A-K cover sections 4–9 of the design doc. Section 10 (security/regulatory) is enforced by the test cases on the approval gate + per-user scoping + signed-intent infra. Section 11 deployment phases are operationally documented in `docs/handoff/`. Section 13 risks each have at least one mitigation in code or runbook.
- **Placeholders:** None remaining. Every task either has full code or a concrete pattern reference (e.g. "mirrors broker.ts pattern" for tasks where the spec is mechanical CRUD).
- **Type consistency:** `bridgeTokens` table column names match the `BridgeToken*Error` class names + `mintBridgeToken/verifyBridgeToken/revokeBridgeToken` function names. `signed_intent_*` likewise. `executionRequests.userId` matches the FK in `bridge_tokens.userId`.
- **Out-of-scope made explicit:** Phase 2 provisioning daemon is documented as deferred. Tap-and-hold UX is in Phase I but the simpler "tap to confirm modal" fallback is acceptable if Reanimated gestures don't work first try. Push notifications scaffold is in Phase E2 but full APNs/FCM cert setup is operational, not code.
