export type AuthTokenType = "Bearer";

export interface AccessToken {
  value: string;
  tokenType: AuthTokenType;
  issuedAt: string;
  expiresAt: string;
}

export interface RefreshToken {
  value: string;
  issuedAt: string;
  expiresAt: string;
}

export interface AuthSession {
  userId: string;
  access: AccessToken;
  refresh: RefreshToken;
  scope?: string[];
}

export interface AuthLoginInput {
  email: string;
  password: string;
  deviceId?: string;
}

export interface AuthRefreshInput {
  refreshToken: string;
  deviceId?: string;
}

export interface AuthForgotPasswordInput {
  email: string;
}

export interface AuthResetPasswordInput {
  token: string;
  newPassword: string;
}

export type AuthErrorCode =
  | "invalid_credentials"
  | "rate_limited"
  | "mfa_required"
  | "account_locked"
  | "token_expired"
  | "token_invalid"
  | "server_error";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  retryAfterSeconds?: number;
}

export type SignedIntentPurpose =
  | "trade.approve"
  | "trade.execute"
  | "kill_switch.confirm"
  | "broker.connect";

export interface SignedIntent {
  token: string;
  purpose: SignedIntentPurpose;
  subjectId: string;
  issuedAt: string;
  expiresAt: string;
}

export interface SignedIntentChallenge {
  purpose: SignedIntentPurpose;
  subjectId: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
}
