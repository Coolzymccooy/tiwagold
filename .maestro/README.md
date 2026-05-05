# Maestro flows

End-to-end flows for Tiwa Gold running in Expo Go.

Maestro instruments at the React Native bridge layer, so taps reliably reach Reanimated-wrapped `PressableScale` components that `adb shell input` cannot drive.

## Prerequisites
- Maestro 2.5.x on PATH (`maestro --version`)
- JDK 11+ (`java -version`)
- Android emulator booted and visible to `adb devices`
- Metro bundler running on `http://localhost:8081`
- `adb reverse tcp:8081 tcp:8081` (re-run after every emulator boot)

## Flows
| File | Purpose | Pre-condition |
|---|---|---|
| `smoke.yaml` | App launches, Trades feed renders | User signed in (default after first sign-in due to `expo-secure-store` persistence) |
| `login.yaml` | Sign-in happy path → Trades | User signed out |
| `forgot-password.yaml` | Login → Forgot password → Back to login | User signed out |
| `signup.yaml` | Login → Create an account → Back to login | User signed out |
| `helpers/open-tiwa-gold.yaml` | Taps the "Tiwa Gold" tile on Expo Go's recently-opened list, no-op if already inside the app | — |
| `helpers/sign-out-if-signed-in.yaml` | Walks Settings → Sign out when Trades is visible | — |

## Run
```bash
# all flows
npm run e2e
# just smoke (fast, no auth state assumption)
npm run e2e:smoke
# auth journey (requires signed-out state)
npm run e2e:auth
# capture a video of a flow
npm run e2e:record
```

## Notes
- All flows target `host.exp.exponent` (Expo Go) and use `openLink` / a tile-tap helper to enter the project.
- Auth flows use mock-backed credentials (any email + password >= 8 chars succeeds via `simulateFetch`).
- If a flow fails, artifacts (screenshots, view hierarchy, log) are saved under `~/.maestro/tests/<timestamp>/`.
