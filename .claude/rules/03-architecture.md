# Architecture rules
## Folder layout
- `app/` — Expo Router entry. Route files are thin: import a feature screen, pass route params, nothing else. No business logic, no fetching, no styling beyond a header config.
- `app/_layout.tsx` — Root Stack. Mounts `GestureHandlerRootView`, `SafeAreaProvider`, `QueryClientProvider`.
- `app/(auth)/` — login, onboarding (outside the tab shell).
- `app/(tabs)/` — Home (Trades), Analytics, Copilot, Settings.
- `app/trade/[id].tsx` — Trade detail (stacked, not a tab).
- `src/design/` — `tokens.ts`, `theme.ts`, `primitives/{Screen, GlassCard, PressableScale}`.
- `src/features/<feature>/` — one folder per feature. Contents:
  - `<Name>Screen.tsx` — the thin screen component
  - `components/` — feature-scoped components
  - `hooks.ts` — feature-scoped hooks
  - `selectors.ts` — pure, testable transforms
  - `types.ts` — feature-local types
  - `index.ts` — public surface
- `src/components/` — cross-feature shared UI (TradeCard, EngineChip, SessionBadge, TabBar).
- `src/services/` — typed data access. Exports TanStack Query hooks only (see `11-queries.md`).
- `src/types/` — domain models (Trade, User, Copilot).
- `src/mocks/` — typed mock fixtures.
- `src/content/copy.ts` — user-facing strings.
- `src/hooks/` — shared hooks (`useAuth`, `useReducedMotion`, `useHaptics`).
- `src/state/` — Zustand stores, persisted via `expo-secure-store` when needed.
## Boundaries
- Screens must not import from another feature's internals — only from `index.ts` of that feature.
- Components in `src/components/` must not import from `src/features/*`.
- Business logic lives in hooks/services/selectors — never in presentational components.
- Design tokens flow one direction: `src/design/tokens.ts` → everything else. Never inline a hex or raw padding number in a feature file.
## Scaling rule
- Prefer simple, scalable abstractions over speculative architecture.
- Extract a new shared primitive only after the third duplicate.
