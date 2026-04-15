# Mobile UI rules
## Primitives
- Use React Native primitives only: `View`, `Text`, `Pressable`, `ScrollView`, `FlatList`, `FlashList`, `TextInput`, `Image`
- Never use `div`, `span`, `input`, `button`, `a`, or any DOM element
- Never use `onClick` — use `onPress` on `Pressable`
- All text must live inside `<Text>` — never render strings directly in a `View`
## Screen structure
- Every route screen must be wrapped in `src/design/primitives/Screen`
- `Screen` handles SafeAreaView + StatusBar + optional KeyboardAvoidingView
- Safe-area insets come from `useSafeAreaInsets()` — never hardcode top/bottom padding for notches or home-indicator
- Any screen containing a `TextInput` must use `KeyboardAvoidingView` with `keyboardVerticalOffset` and `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`
## Responsive rules
- Target smallest first: iPhone SE (375x667)
- Verify on iPhone 15 Pro (notch + Dynamic Island) and Pixel 7 (gesture nav)
- No horizontal overflow at 360px logical width
- No text clipping — wrap via `numberOfLines` or allow multi-line
- Tap targets >= 44x44 pt
## Empty / loading / error / success
- Every screen that fetches data must render all four states
- Loading uses a Reanimated skeleton or native `ActivityIndicator` wrapped in the glass aesthetic
- Empty states use product copy from `src/content/copy.ts`
- Error states must offer a retry affordance
## Visual discipline
- Dark mode only — no light-mode variants
- Colors, spacing, radii, and type sizes come from `src/design/tokens.ts`
- Glass panels use `GlassCard` primitive (expo-blur + hairline border); do not re-style blur per screen
