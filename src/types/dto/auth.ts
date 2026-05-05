export interface AuthTokenDto {
  value: string;
  token_type: "Bearer";
  issued_at: string;
  expires_at: string;
}

export interface RefreshTokenDto {
  value: string;
  issued_at: string;
  expires_at: string;
}

export interface AuthSessionDto {
  user_id: string;
  access: AuthTokenDto;
  refresh?: RefreshTokenDto;
  scope?: string[];
}

export interface AuthLoginRequestDto {
  email: string;
  password: string;
  device_id?: string;
}

export interface AuthLoginResponseDto {
  session: AuthSessionDto;
  user: {
    id: string;
    email: string;
    display_name: string;
    tier: "founder" | "pro" | "trial";
    created_at: string;
    onboarding_completed_at?: string | null;
    avatar_url?: string | null;
    locale?: string | null;
    timezone?: string | null;
  };
}

export interface AuthRefreshRequestDto {
  refresh_token: string;
  device_id?: string;
}

export interface AuthForgotPasswordRequestDto {
  email: string;
}

export interface AuthForgotPasswordResponseDto {
  accepted: true;
  request_id: string;
}

export interface AuthResetPasswordRequestDto {
  token: string;
  new_password: string;
}

export interface AuthResetPasswordResponseDto {
  accepted: true;
}

export interface AuthErrorDto {
  code:
    | "invalid_credentials"
    | "rate_limited"
    | "mfa_required"
    | "account_locked"
    | "token_expired"
    | "token_invalid"
    | "server_error";
  message: string;
  retry_after_seconds?: number;
}

export interface SignedIntentChallengeDto {
  purpose:
    | "trade.approve"
    | "trade.execute"
    | "kill_switch.confirm"
    | "broker.connect";
  subject_id: string;
  nonce: string;
  issued_at: string;
  expires_at: string;
}

export interface SignedIntentDto {
  token: string;
  purpose: SignedIntentChallengeDto["purpose"];
  subject_id: string;
  issued_at: string;
  expires_at: string;
}
