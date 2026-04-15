import type {
  AccessToken,
  AuthSession,
  RefreshToken,
  SignedIntent,
  SignedIntentChallenge,
} from "@/types/auth";

const ISSUED_AT = "2026-04-14T00:55:00.000Z";
const ACCESS_EXPIRES_AT = "2026-04-14T01:10:00.000Z";
const REFRESH_EXPIRES_AT = "2026-05-14T00:55:00.000Z";

export const MOCK_ACCESS_TOKEN: AccessToken = {
  value: "mock.access.jwt.demo",
  tokenType: "Bearer",
  issuedAt: ISSUED_AT,
  expiresAt: ACCESS_EXPIRES_AT,
};

export const MOCK_REFRESH_TOKEN: RefreshToken = {
  value: "mock.refresh.jwt.demo",
  issuedAt: ISSUED_AT,
  expiresAt: REFRESH_EXPIRES_AT,
};

export const MOCK_AUTH_SESSION: AuthSession = {
  userId: "usr_demo",
  access: MOCK_ACCESS_TOKEN,
  refresh: MOCK_REFRESH_TOKEN,
  scope: ["trades:read", "trades:write", "analytics:read"],
};

export const MOCK_SIGNED_INTENT_CHALLENGE: SignedIntentChallenge = {
  purpose: "trade.approve",
  subjectId: "trd_01HXYZDEMO0001",
  nonce: "nonce_demo_9f3c",
  issuedAt: ISSUED_AT,
  expiresAt: "2026-04-14T01:00:00.000Z",
};

export const MOCK_SIGNED_INTENT: SignedIntent = {
  token: "mock.intent.jwt.demo",
  purpose: "trade.approve",
  subjectId: "trd_01HXYZDEMO0001",
  issuedAt: ISSUED_AT,
  expiresAt: "2026-04-14T01:00:00.000Z",
};
