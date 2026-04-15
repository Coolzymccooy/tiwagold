# Performance rules
## Lists
- Any list with more than 20 items uses `@shopify/flash-list` `FlashList` — never `ScrollView.map` or plain `FlatList` for long feeds
- `renderItem` must be a stable reference — declare outside the component or wrap with `useCallback`
- `keyExtractor` must be stable and pure — never return `index`
- Provide `estimatedItemSize` to `FlashList`
- No anonymous inline styles inside `renderItem` — hoist to `StyleSheet.create` or a memoized object
## Memoization
- `useMemo` only for derivations whose recomputation cost is measurable — do not wrap cheap expressions
- `useCallback` only when the callback is passed to a memoized child or a dependency array
- `React.memo` only when profiling shows unnecessary renders — not preemptively
## Animation
- Animated values use Reanimated `useSharedValue` + `useAnimatedStyle` — never the legacy `Animated` API
- Mutations to shared values happen on the UI thread via worklets — never `setState` inside a gesture handler
- Gesture-driven animations use `react-native-gesture-handler` `Gesture.Pan()` / `Gesture.Tap()` with worklets
- No animated props rendered inside `FlashList` `renderItem` cells
## Rendering discipline
- Avoid global state for view-local data — prefer component state or a feature-scoped Zustand slice
- Split screens that exceed 200 lines so re-renders stay local
- Avoid passing fresh object/array literals as props — memoize or hoist
## Assets
- Use `expo-image` for remote images (built-in caching, blurhash placeholders)
- Lazy-load heavy screens via `expo-router` route code-splitting — never import a chart library at the root layout
## Budget
- Treat jank, dropped frames, and layout jumps as bugs — not polish items
- Verify scroll smoothness on iPhone SE before claiming done
