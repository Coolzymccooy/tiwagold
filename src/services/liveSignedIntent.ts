/**
 * Live signed-intent service — Sprint C.3 (multitenant approve-to-execute).
 *
 * On-device ECDSA P-256 signing for trade approvals. The private key is
 * generated once on first use, persisted in `expo-secure-store` (Keystore on
 * Android / Keychain on iOS), and never leaves the device. The cloud verifies
 * each approval against the registered public JWK; without the device's key
 * material, no signature can be produced — so even a server compromise cannot
 * fake a user-approved trade.
 *
 * This is the LIVE path. The mock path in `signedIntent.ts` is preserved for
 * non-live builds (NODE_ENV=test, USE_LIVE_BACKEND=false). Callers dispatch on
 * `isLiveBackendEnabled()`.
 *
 * Wire format compatibility: the cloud uses WebCrypto subtle.verify with
 * { name: "ECDSA", hash: "SHA-256" } on raw bytes of the canonical JSON. We
 * pre-hash with SHA-256 here and call p256.sign(hash, key, { prehash: false }).
 * Noble emits compact r||s (64 bytes) which matches WebCrypto.
 */

import * as SecureStore from "expo-secure-store";
import { p256 } from "@noble/curves/nist.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { authFetch } from "./liveBackend";

const PRIVATE_KEY_STORE_KEY = "tiwa_signed_intent_priv_key_v1";
const REGISTERED_FLAG_STORE_KEY = "tiwa_signed_intent_key_registered_v1";

type IntentKind = "approve_trade" | "deny_trade" | "kill_switch_confirm";

export class LiveSignedIntentError extends Error {
  readonly code:
    | "key_init_failed"
    | "key_register_failed"
    | "challenge_failed"
    | "mint_failed";
  constructor(code: LiveSignedIntentError["code"], message: string) {
    super(message);
    this.name = "LiveSignedIntentError";
    this.code = code;
  }
}

interface ChallengeResponse {
  jti: string;
  nonce: string;
  expiresAt: string;
}
interface MintResponse {
  intent_jwt: string;
  expires_at: string;
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ?? 0;
    out += b.toString(16).padStart(2, "0");
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToB64Url(bytes: Uint8Array): string {
  // Express base64url without depending on a Buffer polyfill — fine for
  // 32-byte coordinate buffers used in JWK exports.
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i] ?? 0);
  }
  // btoa is available in modern RN (Hermes); fallback path just in case.
  const b64 =
    typeof btoa === "function"
      ? btoa(bin)
      : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

interface PublicJwk {
  kty: "EC";
  crv: "P-256";
  x: string;
  y: string;
}

/**
 * Loads the private key from secure-store, generating + persisting one on
 * first use. Returns the public JWK derived from the private key.
 */
export async function ensureSigningKey(): Promise<PublicJwk> {
  let privHex = await SecureStore.getItemAsync(PRIVATE_KEY_STORE_KEY);
  if (!privHex) {
    try {
      const kp = p256.keygen();
      privHex = bytesToHex(kp.secretKey);
      await SecureStore.setItemAsync(PRIVATE_KEY_STORE_KEY, privHex);
      // Force re-registration on next call since this is a fresh key.
      await SecureStore.deleteItemAsync(REGISTERED_FLAG_STORE_KEY).catch(() => {});
    } catch (err) {
      throw new LiveSignedIntentError(
        "key_init_failed",
        `Failed to generate or persist signing key: ${(err as Error)?.message ?? err}`,
      );
    }
  }

  const privBytes = hexToBytes(privHex);
  // Public key — uncompressed 0x04 || X(32) || Y(32) = 65 bytes
  const pubUncompressed = p256.getPublicKey(privBytes, false);
  const x = pubUncompressed.subarray(1, 33);
  const y = pubUncompressed.subarray(33, 65);
  return {
    kty: "EC",
    crv: "P-256",
    x: bytesToB64Url(x),
    y: bytesToB64Url(y),
  };
}

/**
 * Registers the device's public JWK with the cloud. Idempotent — the cloud
 * accepts re-registration of the same key. Caches a flag in secure-store so
 * we don't re-POST every approval round-trip.
 */
export async function registerDeviceKey(args: {
  bearerToken: string;
}): Promise<void> {
  const flag = await SecureStore.getItemAsync(REGISTERED_FLAG_STORE_KEY);
  if (flag === "1") return;

  const publicJwk = await ensureSigningKey();
  try {
    await authFetch<{ ok: boolean }>("/me/keys/register", {
      method: "POST",
      bearerToken: args.bearerToken,
      body: { public_jwk: publicJwk },
    });
    await SecureStore.setItemAsync(REGISTERED_FLAG_STORE_KEY, "1");
  } catch (err) {
    throw new LiveSignedIntentError(
      "key_register_failed",
      `Failed to register device key: ${(err as Error)?.message ?? err}`,
    );
  }
}

/**
 * Test/admin helper: forget the registered flag so the next call to
 * registerDeviceKey re-POSTs to the cloud. Use after device wipe / re-key.
 */
export async function clearRegisteredFlag(): Promise<void> {
  await SecureStore.deleteItemAsync(REGISTERED_FLAG_STORE_KEY).catch(() => {});
}

function canonicalIntentPayload(args: {
  jti: string;
  nonce: string;
  intentKind: IntentKind;
  subjectId: string;
}): string {
  // Keys sorted alphabetically — must match cloud's canonicalIntentPayload.
  const sorted: Record<string, string> = {
    intentKind: args.intentKind,
    jti: args.jti,
    nonce: args.nonce,
    subjectId: args.subjectId,
  };
  return JSON.stringify(sorted);
}

async function signCanonicalPayload(payload: string): Promise<string> {
  const privHex = await SecureStore.getItemAsync(PRIVATE_KEY_STORE_KEY);
  if (!privHex) {
    throw new LiveSignedIntentError("key_init_failed", "Signing key missing");
  }
  const privBytes = hexToBytes(privHex);
  const hash = sha256(new TextEncoder().encode(payload));
  // prehash: false => signature is over the supplied bytes (which we've
  // pre-hashed with SHA-256 ourselves). Compact format (r||s, 64 bytes)
  // matches WebCrypto on the cloud side.
  // noble returns compact r||s (64 bytes) by default — matches WebCrypto.
  const sig = p256.sign(hash, privBytes, { prehash: false });
  return bytesToHex(sig);
}

async function fullIntentFlow(args: {
  bearerToken: string;
  intentKind: IntentKind;
  subjectId: string;
}): Promise<string> {
  await registerDeviceKey({ bearerToken: args.bearerToken });

  let challenge: ChallengeResponse;
  try {
    challenge = await authFetch<ChallengeResponse>("/auth/signed-intent/challenge", {
      method: "POST",
      bearerToken: args.bearerToken,
      body: { kind: args.intentKind, subject_id: args.subjectId },
    });
  } catch (err) {
    throw new LiveSignedIntentError(
      "challenge_failed",
      `Failed to issue challenge: ${(err as Error)?.message ?? err}`,
    );
  }

  const payload = canonicalIntentPayload({
    jti: challenge.jti,
    nonce: challenge.nonce,
    intentKind: args.intentKind,
    subjectId: args.subjectId,
  });
  const signatureHex = await signCanonicalPayload(payload);

  let mint: MintResponse;
  try {
    mint = await authFetch<MintResponse>("/auth/signed-intent/mint", {
      method: "POST",
      bearerToken: args.bearerToken,
      body: { jti: challenge.jti, signature: signatureHex },
    });
  } catch (err) {
    throw new LiveSignedIntentError(
      "mint_failed",
      `Failed to mint intent JWT: ${(err as Error)?.message ?? err}`,
    );
  }

  return mint.intent_jwt;
}

export function signApprovalIntent(args: {
  bearerToken: string;
  tradeId: string;
}): Promise<string> {
  return fullIntentFlow({
    bearerToken: args.bearerToken,
    intentKind: "approve_trade",
    subjectId: args.tradeId,
  });
}

export function signDenyIntent(args: {
  bearerToken: string;
  tradeId: string;
}): Promise<string> {
  return fullIntentFlow({
    bearerToken: args.bearerToken,
    intentKind: "deny_trade",
    subjectId: args.tradeId,
  });
}
