Review the current diff as a senior Expo/React Native architect for Tiwa Gold.
<review_focus>
- Mobile-native correctness: `View`/`Text`/`Pressable`/`FlashList` only; no `div`/`span`/`onClick`; no imports from `react-dom`, `react-router-dom`, `motion/*`, `recharts`, `sonner`, `tailwindcss`, `@tailwindcss/*`, `lucide-react` (must be `-native`)
- Expo Router usage: thin route files, `router` from `expo-router`, params via `useLocalSearchParams`, headers per-screen via `<Stack.Screen options={...}>`
- Architecture: screens under 200 lines, files under 400 lines, functions under 50 lines, no cross-feature internal imports, no business logic in presentational components
- Type safety: no `any`; precise domain types from `src/types/`
- Performance: `FlashList` for lists > 20, stable `renderItem` + `keyExtractor`, no inline styles in list cells, Reanimated worklets (no legacy `Animated`), no `setState` in gesture handlers
- Safe-area / keyboard: `Screen` primitive wrapper, `useSafeAreaInsets()`, `KeyboardAvoidingView` on any screen with `TextInput`
- Design tokens: every color/space/radius/type size from `src/design/tokens.ts`; `GlassCard` primitive used (no ad-hoc blur)
- Queries: hooks live in `src/services/*`; cache key conventions per `.claude/rules/11-queries.md`; mutations invalidate parent list keys
- Motion: respects `useReducedMotion()`; durations imported from tokens
- States rendered: loading, empty, error (with retry), success
- Overengineering: no speculative abstraction, no unrelated refactor
</review_focus>
<output>
Return:
1. Critical issues (blocking — with file:line)
2. Important improvements (with file:line)
3. Nice-to-have polish
4. Final verdict: approve / revise
</output>
