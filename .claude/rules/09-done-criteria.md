# Done criteria
A task is only complete when every item below is true. This is a checklist — not a narrative.

## Product
- [ ] Matches Tiwa Gold product scope (XAU/USD only, premium, dark-mode-only)
- [ ] No multi-asset, crypto, or web-only feature creep

## Architecture
- [ ] Follows Expo Router layout under `app/` and feature layout under `src/features/`
- [ ] Route files stay thin — no business logic
- [ ] Shared primitives reused from `src/design/primitives/` — no duplicated styling
- [ ] Design tokens come from `src/design/tokens.ts` — no inline hex or raw padding

## Code quality
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] No `any`, no `console.log`, no commented-out code

## UX
- [ ] Loading, empty, error, and success states all render for fetched data
- [ ] `/verify-states <screen>` run and passed if a screen was touched
- [ ] Safe-area handled via `useSafeAreaInsets()` — never hardcoded padding
- [ ] Keyboard does not overlap inputs (KeyboardAvoidingView where needed)
- [ ] No horizontal overflow at 360px logical width

## Device matrix (human-verified — out of agent sandbox)
Agent environments without iOS/Android toolchains cannot execute these. The agent marks them **pending human sign-off** and must not claim a phase complete in a PR description without the user confirming each checkbox on real or simulated devices.
- [ ] Verified on iPhone SE (375x667)
- [ ] Verified on iPhone 15 Pro (notch + Dynamic Island)
- [ ] Verified on Pixel 7 (gesture nav)
- [ ] At least one production build per phase via `eas build --profile preview` (run by user on a machine with EAS CLI + Apple/Google credentials)

## Diff hygiene
- [ ] No unrelated refactors in the diff
- [ ] No new dependencies without justification
- [ ] Feature folder boundaries respected (no cross-feature internal imports)

## Agent-stop gate
For a Claude Code session to be allowed to stop, the **Code quality** block above must be fully green (`npm run typecheck`, `npm run lint`, `npm run test` all pass) and `npx expo-doctor` must report 0 failures. The **Device matrix** block is handed off to the user — the agent reports it as **pending human sign-off** rather than blocking on it.

## Required completion wording
Every phase summary / final response that claims work is done must end with exactly these two lines so the Stop hook can verify the agent-stop gate vs. human sign-off split:

```
Agent-automated gate: PASS | FAIL
Human sign-off pending: <comma-separated items, or "none">
```

- `Agent-automated gate: PASS` means `npm run typecheck`, `npm run lint`, `npm run test`, and `npx expo-doctor` were all run in the session and green (or the change was doc/config-only and the gate was not applicable — say so explicitly).
- `Human sign-off pending: none` is valid when the change has no UX/device surface (docs, hooks, lint-only).
- Otherwise list the exact pending items, e.g. `Device matrix (iPhone SE / iPhone 15 Pro / Pixel 7), eas build --profile preview`.
- Never omit these two lines when reporting a phase complete. Never claim full completion without acknowledging outstanding human sign-off items.

For rule detail, see `CLAUDE.md#Done criteria` and the numbered rules in this directory.
