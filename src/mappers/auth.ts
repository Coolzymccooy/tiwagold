import type {
  AuthErrorDto,
  AuthForgotPasswordRequestDto,
  AuthLoginRequestDto,
  AuthLoginResponseDto,
  AuthRefreshRequestDto,
  AuthResetPasswordRequestDto,
  AuthSessionDto,
  AuthTokenDto,
  RefreshTokenDto,
  SignedIntentChallengeDto,
  SignedIntentDto,
} from "@/types/dto";
import type {
  AccessToken,
  AuthError,
  AuthForgotPasswordInput,
  AuthLoginInput,
  AuthRefreshInput,
  AuthResetPasswordInput,
  AuthSession,
  RefreshToken,
  SignedIntent,
  SignedIntentChallenge,
} from "@/types/auth";
import type { UserProfile } from "@/types/user";

import { toOptional } from "./primitives";

export function accessTokenFromDto(dto: AuthTokenDto): AccessToken {
  return {
    value: dto.value,
    tokenType: dto.token_type,
    issuedAt: dto.issued_at,
    expiresAt: dto.expires_at,
  };
}

export function accessTokenToDto(domain: AccessToken): AuthTokenDto {
  return {
    value: domain.value,
    token_type: domain.tokenType,
    issued_at: domain.issuedAt,
    expires_at: domain.expiresAt,
  };
}

export function refreshTokenFromDto(dto: RefreshTokenDto): RefreshToken {
  return {
    value: dto.value,
    issuedAt: dto.issued_at,
    expiresAt: dto.expires_at,
  };
}

export function refreshTokenToDto(domain: RefreshToken): RefreshTokenDto {
  return {
    value: domain.value,
    issued_at: domain.issuedAt,
    expires_at: domain.expiresAt,
  };
}

export function authSessionFromDto(dto: AuthSessionDto): AuthSession {
  return {
    userId: dto.user_id,
    access: accessTokenFromDto(dto.access),
    refresh: refreshTokenFromDto(dto.refresh),
    scope: dto.scope,
  };
}

export function authSessionToDto(domain: AuthSession): AuthSessionDto {
  return {
    user_id: domain.userId,
    access: accessTokenToDto(domain.access),
    refresh: refreshTokenToDto(domain.refresh),
    scope: domain.scope,
  };
}

type LoginUserSummary = AuthLoginResponseDto["user"];

export function loginUserFromDto(
  dto: LoginUserSummary,
): Pick<
  UserProfile,
  | "id"
  | "email"
  | "displayName"
  | "tier"
  | "createdAt"
  | "onboardingCompletedAt"
  | "avatarUrl"
  | "locale"
  | "timezone"
> {
  return {
    id: dto.id,
    email: dto.email,
    displayName: dto.display_name,
    tier: dto.tier,
    createdAt: dto.created_at,
    onboardingCompletedAt: toOptional(dto.onboarding_completed_at),
    avatarUrl: toOptional(dto.avatar_url),
    locale: toOptional(dto.locale),
    timezone: toOptional(dto.timezone),
  };
}

export interface LoginResult {
  session: AuthSession;
  user: ReturnType<typeof loginUserFromDto>;
}

export function loginResponseFromDto(dto: AuthLoginResponseDto): LoginResult {
  return {
    session: authSessionFromDto(dto.session),
    user: loginUserFromDto(dto.user),
  };
}

export function loginRequestToDto(
  input: AuthLoginInput,
): AuthLoginRequestDto {
  return {
    email: input.email,
    password: input.password,
    device_id: input.deviceId,
  };
}

export function refreshRequestToDto(
  input: AuthRefreshInput,
): AuthRefreshRequestDto {
  return {
    refresh_token: input.refreshToken,
    device_id: input.deviceId,
  };
}

export function forgotPasswordRequestToDto(
  input: AuthForgotPasswordInput,
): AuthForgotPasswordRequestDto {
  return { email: input.email };
}

export function resetPasswordRequestToDto(
  input: AuthResetPasswordInput,
): AuthResetPasswordRequestDto {
  return {
    token: input.token,
    new_password: input.newPassword,
  };
}

export function authErrorFromDto(dto: AuthErrorDto): AuthError {
  return {
    code: dto.code,
    message: dto.message,
    retryAfterSeconds: dto.retry_after_seconds,
  };
}

export function signedIntentFromDto(dto: SignedIntentDto): SignedIntent {
  return {
    token: dto.token,
    purpose: dto.purpose,
    subjectId: dto.subject_id,
    issuedAt: dto.issued_at,
    expiresAt: dto.expires_at,
  };
}

export function signedIntentToDto(domain: SignedIntent): SignedIntentDto {
  return {
    token: domain.token,
    purpose: domain.purpose,
    subject_id: domain.subjectId,
    issued_at: domain.issuedAt,
    expires_at: domain.expiresAt,
  };
}

export function signedIntentChallengeFromDto(
  dto: SignedIntentChallengeDto,
): SignedIntentChallenge {
  return {
    purpose: dto.purpose,
    subjectId: dto.subject_id,
    nonce: dto.nonce,
    issuedAt: dto.issued_at,
    expiresAt: dto.expires_at,
  };
}
