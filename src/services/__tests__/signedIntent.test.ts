import {
  SignedIntentError,
  __getRecordedSignedIntentCalls,
  __requestSignedIntentForTest,
  __resetSignedIntentRecorder,
  assertSignedIntentInProduction,
  isMockSignedIntentToken,
} from "../signedIntent";
import type { SignedIntentPurpose } from "@/types/auth";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

function setNodeEnv(value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) {
    env.NODE_ENV = undefined;
    return;
  }
  env.NODE_ENV = value;
}

beforeEach(() => {
  __resetSignedIntentRecorder();
});

afterEach(() => {
  setNodeEnv(ORIGINAL_NODE_ENV);
  __resetSignedIntentRecorder();
});

describe("signedIntent / mock mode", () => {
  it("returns a stable fake intent token and records the call", async () => {
    setNodeEnv("test");
    const purpose: SignedIntentPurpose = "trade.approve";
    const subjectId = "trd_123";

    const first = await __requestSignedIntentForTest({ purpose, subjectId });
    const second = await __requestSignedIntentForTest({ purpose, subjectId });

    expect(first.token).toBe(`signed_intent_mock_${purpose}_${subjectId}`);
    expect(first.purpose).toBe(purpose);
    expect(first.subjectId).toBe(subjectId);
    expect(second.token).toBe(first.token);
    expect(new Date(first.expiresAt).getTime()).toBeGreaterThan(
      new Date(first.issuedAt).getTime(),
    );
    expect(__getRecordedSignedIntentCalls()).toEqual([
      { purpose, subjectId },
      { purpose, subjectId },
    ]);
  });

  it("identifies mock tokens via the helper check", () => {
    expect(isMockSignedIntentToken("signed_intent_mock_trade.approve_trd_1")).toBe(true);
    expect(isMockSignedIntentToken("real_signed_intent_value")).toBe(false);
    expect(isMockSignedIntentToken(undefined)).toBe(false);
  });
});

describe("signedIntent / production guard", () => {
  it("is a no-op outside production, even with undefined or mock tokens", () => {
    setNodeEnv("test");
    expect(() => assertSignedIntentInProduction(undefined)).not.toThrow();
    expect(() => assertSignedIntentInProduction("signed_intent_mock_anything")).not.toThrow();
    expect(() => assertSignedIntentInProduction("real_token")).not.toThrow();
  });

  it("throws missing_intent when token absent in production", () => {
    setNodeEnv("production");
    const call = (): void => assertSignedIntentInProduction(undefined);
    expect(call).toThrow(SignedIntentError);
    try {
      call();
    } catch (err) {
      expect((err as SignedIntentError).code).toBe("missing_intent");
    }
  });

  it("throws invalid_intent when a mock token is passed in production", () => {
    setNodeEnv("production");
    const call = (): void =>
      assertSignedIntentInProduction("signed_intent_mock_trade.approve_trd_1");
    expect(call).toThrow(SignedIntentError);
    try {
      call();
    } catch (err) {
      expect((err as SignedIntentError).code).toBe("invalid_intent");
    }
  });

  it("throws backend_unavailable for real-looking tokens until backend is wired", () => {
    setNodeEnv("production");
    const call = (): void =>
      assertSignedIntentInProduction("real_signed_intent_token_from_backend");
    expect(call).toThrow(SignedIntentError);
    try {
      call();
    } catch (err) {
      expect((err as SignedIntentError).code).toBe("backend_unavailable");
    }
  });

  it("rejects the mock request flow in production with backend_unavailable", async () => {
    setNodeEnv("production");
    await expect(
      __requestSignedIntentForTest({
        purpose: "trade.approve",
        subjectId: "trd_123",
      }),
    ).rejects.toMatchObject({
      name: "SignedIntentError",
      code: "backend_unavailable",
    });
  });
});
