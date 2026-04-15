# CLAUDE.md
## Mission
Build and evolve Tiwa Gold as a premium mobile-native Expo + React Native app for AI-powered Gold (XAU/USD) trading intelligence.
Prioritize iPhone and Android UX, native-feeling motion, safe-area correctness, strong typing, scalable architecture, and production-minded performance.
## Product boundaries
- This app is XAU/USD only for MVP.
- Do not introduce other trading symbols.
- Do not turn this into a generic crypto or multi-asset app.
- Keep the product premium, focused, dark-mode-only, and mobile-native.
## Required stack
- Expo (SDK 54+) + React Native + TypeScript
- Expo Router (route groups `(auth)`, `(tabs)`, stacked `trade/[id]`)
- React Native Reanimated + React Native Gesture Handler
- react-native-safe-area-context + react-native-screens
- TanStack Query (server/data state)
- Zustand with `expo-secure-store` persistence (client state)
- React Hook Form + Zod (forms + validation)
- @shopify/flash-list (all lists > 20 items)
- react-native-svg + victory-native (or react-native-svg-charts) for charts
- expo-blur (glass panels), expo-haptics, expo-splash-screen, expo-status-bar, expo-system-ui, expo-linking, expo-constants
- lucide-react-native (icons)
- burnt or Reanimated custom toast (never `sonner`)
- @google/genai (Copilot, works in RN over fetch)
- Use proper React Native primitives; never React DOM components
## Non-negotiable platform rules
- Never use `div` / `span` / `input` / `button` / `a` or browser-first layout assumptions
- Never import from `react-dom`, `react-router-dom`, `vite`, `@vitejs/*`, `motion/react`, `motion/*`, `tailwindcss`, `@tailwindcss/*`, `recharts`, `sonner`, `lucide-react` (use `lucide-react-native`), `tailwind-merge` — these are the exact guarded names
- Never use web-only libraries unless confirmed React Native compatible
- Always handle safe areas via `useSafeAreaInsets` — never hardcode padding for notches/home-indicator
- Always consider iPhone SE (small), iPhone 15 Pro (notch + Dynamic Island), and Pixel 7 (Android gesture nav)
- Always handle keyboard overlap via `KeyboardAvoidingView` with `keyboardVerticalOffset`
- Never allow horizontal overflow or clipped text at 360px width
- Never ship rough placeholder UI
- Prefer composition over giant monolithic screens
- Keep navigation, design tokens, mocks, and feature logic modular
## Architecture rules
- `app/` — Expo Router routes only; route files are thin and import a feature screen
- `src/design/` — `tokens.ts`, `theme.ts`, `primitives/` (Screen, GlassCard, PressableScale, etc.)
- `src/features/<feature>/` — `{index.ts, types.ts, hooks.ts, selectors.ts, <Name>Screen.tsx, components/}`
- `src/components/` — cross-feature shared UI
- `src/services/` — typed data access; exports TanStack Query hooks only
- `src/types/` — domain models (Trade, User, Copilot, etc.)
- `src/mocks/` — typed mock data
- `src/content/` — user-facing strings
- `src/hooks/` — shared hooks (useAuth, useReducedMotion, useHaptics)
- `src/state/` — Zustand stores
- Keep transformations/selectors pure and testable
- Keep business logic out of presentational components
- Reuse premium UI primitives instead of duplicating styling
## UI and design rules
- Dark mode only
- Visual language: ultra-premium, glassmorphic, elegant amber/orange accents, refined typography, zero clutter
- Motion should be smooth, restrained, intentional, and native-feeling
- Use the spacing/type/radius tokens from `src/design/tokens.ts` — never hardcode colors, spacing, or radii in components
- Every new screen must feel launch-ready, not scaffolded
## Performance rules
- Use `FlashList` for any list > 20 items; memoize `renderItem` + `keyExtractor`
- Memoize expensive derived values and stable callbacks when measured to help
- Reanimated worklets for animated values — never `setState` in gesture handlers
- Avoid anonymous inline styles in list items
- Avoid unnecessary global state
- Lazy load heavy modules/screens where sensible
- Treat jank, dropped frames, and layout jumps as bugs
## Working style
For any non-trivial task:
1. Inspect the relevant files first
2. Summarize current architecture constraints
3. Propose a short plan
4. List target files before editing
5. Implement in small coherent changes
6. Run relevant checks
7. Report what changed, risks, and next steps
## Change control
- Do not make unrelated refactors
- Do not rename files or move modules unless necessary
- Do not add dependencies unless justified
- During migration, the legacy Vite/React code under `legacy-web/` (or `src/` pre-move) may be **read** as reference but never imported from Expo/RN code; once an area is ported, the legacy source must be removed in the same diff
- Ask before making destructive or hard-to-reverse changes
- Keep diffs small and reviewable
## Code quality
- Strong TypeScript typing required, `strict: true` on
- No `any` — use `unknown` + narrowing or a precise type
- No default exports except Expo Router route files under `app/`
- Files ≤ 400 lines (≤ 200 lines for screens)
- Functions ≤ 50 lines
- Prefer explicit interfaces/types for domain models
- Prefer pure helpers over inline complexity
- Use descriptive names; avoid vague utils
## Testing and verification
Before finishing:
- `npm run typecheck` must pass
- `npm run lint` must pass
- `npm run test` must pass where tests exist for the touched area
- New logic under `src/services/*` and `src/features/**/selectors.ts` needs unit tests
- Validate navigation flows and edge states
- Verify empty/loading/error/success states
- Confirm mobile-safe rendering assumptions
## Done criteria
A task is not done unless:
- the UX is mobile-correct
- the code is typed and organized
- the relevant checks pass
- the result matches Tiwa Gold product and design constraints

### Agent-stop gate vs. human sign-off
- **Agent-stop gate (must be green before an agent may stop)**: `npm run typecheck`, `npm run lint`, `npm run test`, and `npx expo-doctor` all pass with 0 failures.
- **Human sign-off (out of agent sandbox)**: the Device matrix (iPhone SE, iPhone 15 Pro, Pixel 7) and at least one `eas build --profile preview` per phase are verified by the user on a machine with iOS/Android toolchains + EAS credentials. The agent reports these as **pending human sign-off** rather than blocking on them.
- See `.claude/rules/09-done-criteria.md` for the full checklist.
