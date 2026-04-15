Audit a screen against Tiwa Gold mobile correctness rules:
<screen>
$ARGUMENTS
</screen>
<instructions>
The argument is a route path (e.g. `app/(tabs)/index.tsx`, `app/trade/[id].tsx`) or a screen file (e.g. `src/features/trade-feed/TradeFeedScreen.tsx`).

Read the target file and its immediate imports. Produce a pass/fail checklist with `file:line` references for every item.

## Required checks

1. **Render states** (per .claude/rules/02-mobile-ui.md):
   - [ ] Loading state renders (skeleton or `ActivityIndicator` wrapped in glass aesthetic)
   - [ ] Empty state renders with copy from `src/content/copy.ts`
   - [ ] Error state renders with a retry affordance
   - [ ] Success state renders

2. **Screen wrapper** (per .claude/rules/02 + 03):
   - [ ] Wrapped in `Screen` from `src/design/primitives/Screen`
   - [ ] Uses `useSafeAreaInsets()` when padding is applied — no hardcoded top/bottom values for notches/home-indicator

3. **Keyboard handling** (per .claude/rules/02):
   - [ ] If any `TextInput` is present, `KeyboardAvoidingView` is used with `keyboardVerticalOffset` and `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`

4. **Primitives** (per .claude/rules/02):
   - [ ] No `div`, `span`, `button`, `a`, `input` — only RN primitives
   - [ ] No `onClick` — `onPress` on `Pressable`
   - [ ] All text lives inside `<Text>`

5. **Design tokens** (per .claude/rules/10):
   - [ ] No hardcoded hex colors — all colors from `src/design/tokens.ts`
   - [ ] No raw spacing/radius/font-size literals — all from tokens

6. **Performance** (per .claude/rules/07):
   - [ ] Lists > 20 items use `FlashList` with stable `renderItem`, `keyExtractor`, `estimatedItemSize`
   - [ ] No anonymous inline styles in list cells

7. **Motion** (per .claude/rules/12):
   - [ ] Animations use Reanimated worklets — not legacy `Animated` API
   - [ ] `useReducedMotion()` respected where animations are present

8. **Layout** (per .claude/rules/02):
   - [ ] No horizontal overflow at 360px logical width (scan for hardcoded widths > 360)
   - [ ] Tap targets >= 44x44 pt (scan `Pressable`/`TouchableOpacity` hitSlops or sizes)
   - [ ] `numberOfLines` set on labels that could wrap beyond intended lines

9. **Queries** (per .claude/rules/11):
   - [ ] Data access via hook imported from `src/services/*` — no inline `useQuery`/`useMutation` in the screen

10. **Banned imports** (per CLAUDE.md):
    - [ ] No import from `react-dom`, `react-router-dom`, `motion/*`, `recharts`, `sonner`, `tailwindcss`, `@tailwindcss/*`, `lucide-react` (must be `-native`), `tailwind-merge`

## Output
- Pass/fail per item with file:line (use markdown links `[file.tsx:42](file.tsx#L42)`)
- Summary line: `N passed / M failed`
- Recommended fixes grouped by rule number
</instructions>
