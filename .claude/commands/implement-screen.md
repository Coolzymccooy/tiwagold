Implement the following screen or feature for Tiwa Gold:
<task>
$ARGUMENTS
</task>
<requirements>
- Wrap the screen in `src/design/primitives/Screen`
- Keep the route file under `app/` thin — import the feature screen, pass params via `useLocalSearchParams`, nothing else
- Feature lives under `src/features/<name>/` with `<Name>Screen.tsx`, `components/`, `hooks.ts`, `selectors.ts`, `types.ts`, `index.ts`
- Use `View`, `Text`, `Pressable`, `ScrollView`, `FlashList`, `TextInput` — never DOM primitives
- Safe-area via `useSafeAreaInsets()`; `KeyboardAvoidingView` if any `TextInput` is present
- Lists > 20 items use `FlashList` with stable `renderItem` and `keyExtractor`, plus `estimatedItemSize`
- Data access via hooks in `src/services/*.ts` — no inline `useQuery` in the screen
- All colors, spacing, radii, typography from `src/design/tokens.ts`
- Motion via Reanimated worklets; respect `useReducedMotion()`
- Render all four states: loading, empty, error (with retry), success
</requirements>
<workflow>
1. Inspect target files first
2. Restate the plan: files to edit, files to create, query keys, tokens used
3. Implement in small coherent changes
4. Run `npm run typecheck && npm run lint && npm run test`
5. Run `/verify-states <route>` for the screen(s) touched
6. Report changed files, tradeoffs, and next recommended step
</workflow>
