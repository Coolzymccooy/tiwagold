/**
 * Voice service — Tiwa Gold copilot text-to-speech.
 *
 * Calls the cloud-api `POST /voice/speak` endpoint, persists the returned
 * audio bytes into the app cache directory, and returns a `file://` URI ready
 * to feed into `expo-audio`'s `createAudioPlayer`.
 *
 * Cache strategy: keyed on hash(text, voice, format). Re-playing the same
 * assistant reply doesn't round-trip the server. Cache lives under
 * `Paths.cache` so the OS can evict it under memory pressure.
 */
import { Directory, File, Paths } from "expo-file-system";
import { authFetchBinary, LiveBackendDisabledError } from "./liveBackend";
import { selectAccessToken, useAuthStore } from "@/state/authStore";

const CACHE_DIR_NAME = "tiwa-voice-cache";

export type VoiceFormat = "mp3" | "ogg-opus";

export interface SpeakResult {
  /** file:// URI ready to pass to `createAudioPlayer({ uri })` */
  uri: string;
  /** Which TTS engine the cloud-api used. Useful for analytics/debug. */
  provider: string;
  format: VoiceFormat;
  /** Cache hit — true when the bytes were already on disk and no network call happened. */
  cached: boolean;
}

export class VoiceServiceError extends Error {
  public readonly reason?: unknown;
  constructor(message: string, reason?: unknown) {
    super(message);
    this.name = "VoiceServiceError";
    this.reason = reason;
  }
}

export class VoiceServiceUnauthenticatedError extends VoiceServiceError {
  constructor() {
    super("No active access token for /voice/speak");
    this.name = "VoiceServiceUnauthenticatedError";
  }
}

export interface SpeakRequest {
  text: string;
  voice?: string;
  format?: VoiceFormat;
}

/**
 * Stable, filename-safe digest of the request. Used as the cache filename.
 * Plain DJB2 — collision odds are negligible for our cardinality (a few
 * hundred unique assistant replies per session) and we don't have a hash
 * library handy in RN without adding deps.
 */
function digest(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function fileExtension(format: VoiceFormat): string {
  return format === "mp3" ? "mp3" : "ogg";
}

function ensureCacheDir(): void {
  // The cache subdir may not exist on first launch. `idempotent: true` makes
  // create() a no-op when the directory is already there.
  const dir = new Directory(Paths.cache, CACHE_DIR_NAME);
  if (!dir.exists) dir.create({ idempotent: true });
}

function cacheFileFor(request: SpeakRequest, format: VoiceFormat): File {
  const key = digest(`${format}|${request.voice ?? "default"}|${request.text}`);
  return new File(Paths.cache, CACHE_DIR_NAME, `${key}.${fileExtension(format)}`);
}

/**
 * Synthesize `text` via the cloud-api and return a playable file URI.
 *
 * Throws:
 *   - {@link VoiceServiceUnauthenticatedError} — no bearer token in authStore
 *   - {@link LiveBackendDisabledError} — USE_LIVE_BACKEND=false (config error)
 *   - {@link VoiceServiceError} — network / server / disk failure
 */
export async function speakRemote(request: SpeakRequest): Promise<SpeakResult> {
  const format: VoiceFormat = request.format ?? "mp3";
  const cacheFile = cacheFileFor(request, format);
  ensureCacheDir();

  if (cacheFile.exists) {
    return { uri: cacheFile.uri, provider: "cache", format, cached: true };
  }

  const token = selectAccessToken(useAuthStore.getState());
  if (!token || token.value.length === 0) {
    throw new VoiceServiceUnauthenticatedError();
  }

  let response;
  try {
    response = await authFetchBinary("/voice/speak", {
      method: "POST",
      body: { text: request.text, voice: request.voice, format },
      bearerToken: token.value,
    });
  } catch (err) {
    if (err instanceof LiveBackendDisabledError) throw err;
    throw new VoiceServiceError("voice_request_failed", err);
  }

  if (response.body.byteLength === 0) {
    throw new VoiceServiceError("empty_audio_response");
  }

  try {
    if (!cacheFile.exists) cacheFile.create();
    cacheFile.write(new Uint8Array(response.body));
  } catch (err) {
    throw new VoiceServiceError("cache_write_failed", err);
  }

  const provider = response.responseHeaders.get("x-tts-provider") ?? "unknown";
  return { uri: cacheFile.uri, provider, format, cached: false };
}

/**
 * Clear every cached voice file. Useful from the Settings screen when the
 * user changes voice and wants the new one to start being used immediately.
 */
export function clearVoiceCache(): void {
  try {
    const dir = new Directory(Paths.cache, CACHE_DIR_NAME);
    if (dir.exists) dir.delete();
  } catch {
    // best-effort
  }
}
