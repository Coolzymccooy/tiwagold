/* eslint-disable import/first -- jest.mock blocks must precede SUT imports so the mocked bindings are in place when the SUT is loaded. */
// Mock authFetch BEFORE importing the SUT so the binding the SUT closes over
// is the mock function. The same pattern as liveBackend.test.ts.
const mockAuthFetch = jest.fn();
jest.mock("@/services/liveBackend", () => ({
  __esModule: true,
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

// Re-import the SecureStore mock so we can introspect it (set up globally in
// jest.setup.ts).
import * as SecureStoreMock from "expo-secure-store";

import {
  ensureSigningKey,
  registerDeviceKey,
  signApprovalIntent,
  signDenyIntent,
  clearRegisteredFlag,
  LiveSignedIntentError,
} from "@/services/liveSignedIntent";

const PRIVATE_KEY_STORE_KEY = "tiwa_signed_intent_priv_key_v1";
const REGISTERED_FLAG_STORE_KEY = "tiwa_signed_intent_key_registered_v1";

interface SecureStoreTestApi {
  __reset: () => void;
}

beforeEach(() => {
  mockAuthFetch.mockReset();
  (SecureStoreMock as unknown as SecureStoreTestApi).__reset();
});

describe("ensureSigningKey", () => {
  test("generates and persists a P-256 keypair on first call", async () => {
    const jwk = await ensureSigningKey();
    expect(jwk.kty).toBe("EC");
    expect(jwk.crv).toBe("P-256");
    expect(typeof jwk.x).toBe("string");
    expect(typeof jwk.y).toBe("string");
    // base64url — no '+', '/', '='
    expect(jwk.x).not.toMatch(/[+/=]/);
    expect(jwk.y).not.toMatch(/[+/=]/);

    const stored = await SecureStoreMock.getItemAsync(PRIVATE_KEY_STORE_KEY);
    expect(stored).toMatch(/^[0-9a-f]+$/);
  });

  test("returns the same public JWK on subsequent calls", async () => {
    const a = await ensureSigningKey();
    const b = await ensureSigningKey();
    expect(b.x).toBe(a.x);
    expect(b.y).toBe(a.y);
  });
});

describe("registerDeviceKey", () => {
  test("POSTs the public JWK to /me/keys/register on first call", async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: true });
    await registerDeviceKey({ bearerToken: "tok-1" });

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    const [path, opts] = mockAuthFetch.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe("/me/keys/register");
    expect(opts.method).toBe("POST");
    expect(opts.bearerToken).toBe("tok-1");
    const body = opts.body as { public_jwk: { kty: string; crv: string } };
    expect(body.public_jwk.kty).toBe("EC");
    expect(body.public_jwk.crv).toBe("P-256");

    const flag = await SecureStoreMock.getItemAsync(REGISTERED_FLAG_STORE_KEY);
    expect(flag).toBe("1");
  });

  test("is idempotent — second call does not re-POST", async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: true });
    await registerDeviceKey({ bearerToken: "tok-1" });
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);

    await registerDeviceKey({ bearerToken: "tok-1" });
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
  });

  test("clearRegisteredFlag forces a re-POST on next call", async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: true });
    await registerDeviceKey({ bearerToken: "tok-1" });

    await clearRegisteredFlag();
    mockAuthFetch.mockResolvedValueOnce({ ok: true });
    await registerDeviceKey({ bearerToken: "tok-2" });
    expect(mockAuthFetch).toHaveBeenCalledTimes(2);
  });

  test("wraps an authFetch failure in LiveSignedIntentError(key_register_failed)", async () => {
    mockAuthFetch.mockRejectedValueOnce(new Error("boom"));
    await expect(registerDeviceKey({ bearerToken: "tok-1" })).rejects.toMatchObject({
      name: "LiveSignedIntentError",
      code: "key_register_failed",
    });
  });
});

describe("signApprovalIntent / signDenyIntent", () => {
  test("performs full register → challenge → sign → mint round-trip and returns intent_jwt", async () => {
    mockAuthFetch
      // 1. /me/keys/register
      .mockResolvedValueOnce({ ok: true })
      // 2. /auth/signed-intent/challenge
      .mockResolvedValueOnce({
        jti: "jti-abc",
        nonce: "0123456789abcdef",
        expiresAt: "2026-05-07T00:01:00Z",
      })
      // 3. /auth/signed-intent/mint
      .mockResolvedValueOnce({
        intent_jwt: "header.payload.sig",
        expires_at: "2026-05-07T00:02:00Z",
      });

    const jwt = await signApprovalIntent({
      bearerToken: "tok-1",
      tradeId: "trade_99",
    });
    expect(jwt).toBe("header.payload.sig");
    expect(mockAuthFetch).toHaveBeenCalledTimes(3);

    const challengeCall = mockAuthFetch.mock.calls[1] as [string, { body: { kind: string; subject_id: string } }];
    expect(challengeCall[0]).toBe("/auth/signed-intent/challenge");
    expect(challengeCall[1].body.kind).toBe("approve_trade");
    expect(challengeCall[1].body.subject_id).toBe("trade_99");

    const mintCall = mockAuthFetch.mock.calls[2] as [string, { body: { jti: string; signature: string } }];
    expect(mintCall[0]).toBe("/auth/signed-intent/mint");
    expect(mintCall[1].body.jti).toBe("jti-abc");
    // hex-encoded compact r||s = 128 hex chars
    expect(mintCall[1].body.signature).toMatch(/^[0-9a-f]{128}$/);
  });

  test("signDenyIntent uses kind=deny_trade", async () => {
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ jti: "j2", nonce: "fff", expiresAt: "x" })
      .mockResolvedValueOnce({ intent_jwt: "deny.jwt", expires_at: "y" });

    const jwt = await signDenyIntent({
      bearerToken: "tok-2",
      tradeId: "trade_x",
    });
    expect(jwt).toBe("deny.jwt");
    const challengeCall = mockAuthFetch.mock.calls[1] as [string, { body: { kind: string } }];
    expect(challengeCall[1].body.kind).toBe("deny_trade");
  });

  test("wraps a challenge failure as LiveSignedIntentError(challenge_failed)", async () => {
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error("502"));
    await expect(
      signApprovalIntent({ bearerToken: "t", tradeId: "x" }),
    ).rejects.toMatchObject({
      name: "LiveSignedIntentError",
      code: "challenge_failed",
    });
  });

  test("wraps a mint failure as LiveSignedIntentError(mint_failed)", async () => {
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ jti: "j", nonce: "n", expiresAt: "x" })
      .mockRejectedValueOnce(new Error("400 invalid_signature"));
    await expect(
      signApprovalIntent({ bearerToken: "t", tradeId: "x" }),
    ).rejects.toMatchObject({
      name: "LiveSignedIntentError",
      code: "mint_failed",
    });
  });
});

describe("LiveSignedIntentError", () => {
  test("preserves code on instances", () => {
    const e = new LiveSignedIntentError("key_init_failed", "no entropy");
    expect(e.code).toBe("key_init_failed");
    expect(e.message).toBe("no entropy");
  });
});
