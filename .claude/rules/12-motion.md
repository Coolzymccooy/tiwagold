# Motion rules
All motion is Reanimated 3 worklets and Gesture Handler. No legacy `Animated` API, no CSS-style transitions.

## Primitives
- Shared values: `useSharedValue`
- Styles: `useAnimatedStyle`
- Props: `useAnimatedProps` (for SVG, etc.)
- Reactions: `useAnimatedReaction` — never `useEffect` on a shared value
- Gestures: `react-native-gesture-handler` `Gesture.Pan()`, `Gesture.Tap()`, `Gesture.LongPress()` composed with `Gesture.Simultaneous` / `Gesture.Exclusive`

## Durations
- UI feedback (tap, press): 180–240ms (`duration.fast` / `duration.base`)
- Reveal, expand, collapse: 240–320ms (`duration.base` / `duration.slow`)
- Screen transitions and large surface moves: 400–600ms (`duration.screen`)
- Never hardcode durations — import from `src/design/tokens.ts`

## Easings
- `easing.gentle` for enters and reveals
- `easing.snap` for interactive feedback
- Spring configs used only when physical motion is desired (sheets, pull-to-refresh); parameters come from tokens

## Accessibility
- Every animation respects `useReducedMotion()` from `react-native-reanimated`
- When reduced motion is on: disable position/scale animations, keep only opacity fades under 150ms
- Do not animate text size or color in ways that degrade legibility

## Discipline
- Shared-value mutations happen on the UI thread — never call `setState` inside a gesture handler worklet
- No animated props rendered inside `FlashList` `renderItem` cells (destroys virtualization perf)
- Keep worklets small — extract helpers with `'worklet'` directive rather than inlining complex logic
- Avoid chaining more than two `withTiming` / `withSpring` per interaction — compose with `withSequence` and keep total duration under 800ms

## Haptics
- Tap and confirm use `expo-haptics` `Haptics.selectionAsync()` or `Haptics.impactAsync(Light)`
- Destructive confirm uses `Haptics.notificationAsync(Warning)`
- Haptics fire alongside visual animation — never as a replacement
