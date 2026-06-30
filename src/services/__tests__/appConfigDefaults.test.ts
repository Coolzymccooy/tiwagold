import appJson from "../../../app.json";

/**
 * Regression guard for a recurring footgun.
 *
 * `eas update` (OTA) does NOT apply the build-profile `env` from eas.json — only
 * `eas build` does. So an OTA bakes whatever app.config.ts resolves at publish
 * time, which falls back to `app.json#extra` when the publishing shell has no
 * USE_LIVE_BACKEND/baseUrl set. If those committed defaults are the mock values,
 * any OTA published without the live env in the shell silently ships MOCK config
 * to every user (stale trades, no signals, broken approve). This has bitten prod
 * twice.
 *
 * Committing live defaults makes production safe-by-default; dev builds opt back
 * into mock via the eas.json `base` profile env (USE_LIVE_BACKEND="false") or a
 * local `$env:USE_LIVE_BACKEND="false"`. These keys are NOT secrets — only the
 * api-key/device-token are, and the per-user flows use Bearer auth (no api-key).
 */
describe("app.json committed defaults are live (OTA safety)", () => {
  const extra = (appJson as any).expo?.extra ?? (appJson as any).extra;

  it("USE_LIVE_BACKEND defaults to true", () => {
    expect(extra.USE_LIVE_BACKEND).toBe(true);
  });

  it("PERSONA_OVERSEER_BASE_URL defaults to the production API", () => {
    expect(extra.PERSONA_OVERSEER_BASE_URL).toBe("https://tiwa.tiwaton.co.uk");
  });

  it("secret keys stay empty in source control", () => {
    expect(extra.PERSONA_OVERSEER_API_KEY).toBe("");
    expect(extra.PERSONA_OVERSEER_DEVICE_TOKEN).toBe("");
  });
});
