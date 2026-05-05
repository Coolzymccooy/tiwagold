import type { ExpoConfig, ConfigContext } from "expo/config";

/**
 * Overlay env-driven config onto the static `app.json`.
 *
 * Resolution order, highest priority first:
 *   1. `process.env.<NAME>` (set by EAS Secrets at build time, or by the local
 *      shell for `expo start`)
 *   2. `app.json#extra.<NAME>` (committed defaults — typically empty / off)
 *
 * Live-backend keys never live in source control. Set them via:
 *   - EAS Secrets:  `eas secret:create --scope project --name <NAME> --value …`
 *   - Local dev:    `$env:USE_LIVE_BACKEND="true"` etc. in the shell that
 *                   runs `npx expo start`
 */

function pickString(envValue: string | undefined, jsonValue: unknown): string {
  if (typeof envValue === "string" && envValue.length > 0) return envValue;
  if (typeof jsonValue === "string") return jsonValue;
  return "";
}

function pickBoolean(envValue: string | undefined, jsonValue: unknown): boolean {
  if (typeof envValue === "string") return envValue.toLowerCase() === "true";
  if (typeof jsonValue === "boolean") return jsonValue;
  return false;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseExtra = (config.extra ?? {}) as Record<string, unknown>;
  return {
    ...config,
    name: config.name ?? "Tiwa Gold",
    slug: config.slug ?? "tiwagold",
    extra: {
      ...baseExtra,
      USE_LIVE_BACKEND: pickBoolean(
        process.env.USE_LIVE_BACKEND,
        baseExtra.USE_LIVE_BACKEND,
      ),
      PERSONA_OVERSEER_BASE_URL: pickString(
        process.env.PERSONA_OVERSEER_BASE_URL,
        baseExtra.PERSONA_OVERSEER_BASE_URL,
      ),
      PERSONA_OVERSEER_API_KEY: pickString(
        process.env.PERSONA_OVERSEER_API_KEY,
        baseExtra.PERSONA_OVERSEER_API_KEY,
      ),
      PERSONA_OVERSEER_DEVICE_TOKEN: pickString(
        process.env.PERSONA_OVERSEER_DEVICE_TOKEN,
        baseExtra.PERSONA_OVERSEER_DEVICE_TOKEN,
      ),
    },
  };
};
