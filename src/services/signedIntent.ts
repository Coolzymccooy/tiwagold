import {
  useMutation,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { SignedIntent, SignedIntentPurpose } from "@/types/auth";
import { nowIso, simulateFetch } from "./client";

const MOCK_TOKEN_PREFIX = "signed_intent_mock_";
const MOCK_INTENT_TTL_MS = 60_000;

export type SignedIntentErrorCode =
  | "missing_intent"
  | "invalid_intent"
  | "backend_unavailable"
  | "network";

export class SignedIntentError extends Error {
  readonly code: SignedIntentErrorCode;
  constructor(code: SignedIntentErrorCode, message: string) {
    super(message);
    this.name = "SignedIntentError";
    this.code = code;
  }
}

export interface RequestSignedIntentInput {
  purpose: SignedIntentPurpose;
  subjectId: string;
}

const recordedCalls: RequestSignedIntentInput[] = [];

export function __getRecordedSignedIntentCalls(): readonly RequestSignedIntentInput[] {
  return recordedCalls;
}

export function __resetSignedIntentRecorder(): void {
  recordedCalls.length = 0;
}

function mockIntentToken(purpose: SignedIntentPurpose, subjectId: string): string {
  return `${MOCK_TOKEN_PREFIX}${purpose}_${subjectId}`;
}

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

function buildMockSignedIntent(input: RequestSignedIntentInput): SignedIntent {
  const issuedAt = nowIso();
  const expiresAt = new Date(Date.now() + MOCK_INTENT_TTL_MS).toISOString();
  return {
    token: mockIntentToken(input.purpose, input.subjectId),
    purpose: input.purpose,
    subjectId: input.subjectId,
    issuedAt,
    expiresAt,
  };
}

export async function __requestSignedIntentForTest(
  input: RequestSignedIntentInput,
): Promise<SignedIntent> {
  return requestSignedIntent(input);
}

async function requestSignedIntent(
  input: RequestSignedIntentInput,
): Promise<SignedIntent> {
  recordedCalls.push(input);
  if (isProductionEnv()) {
    throw new SignedIntentError(
      "backend_unavailable",
      "Signed-intent backend is not wired in this build. Production flows are blocked until the API is live.",
    );
  }
  return simulateFetch<SignedIntent>(() => buildMockSignedIntent(input), {
    latencyMs: 160,
  });
}

export function useRequestSignedIntent(): UseMutationResult<
  SignedIntent,
  Error,
  RequestSignedIntentInput
> {
  return useMutation({
    mutationFn: requestSignedIntent,
  });
}

export function isMockSignedIntentToken(token: string | undefined): boolean {
  return typeof token === "string" && token.startsWith(MOCK_TOKEN_PREFIX);
}

export function assertSignedIntentInProduction(
  token: string | undefined,
): void {
  if (!isProductionEnv()) return;
  if (!token) {
    throw new SignedIntentError(
      "missing_intent",
      "A signed intent token is required for this action in production.",
    );
  }
  if (isMockSignedIntentToken(token)) {
    throw new SignedIntentError(
      "invalid_intent",
      "Mock signed-intent tokens are not accepted in production builds.",
    );
  }
  throw new SignedIntentError(
    "backend_unavailable",
    "Signed-intent verification is not wired in this build. Production flows are blocked until the API is live.",
  );
}
