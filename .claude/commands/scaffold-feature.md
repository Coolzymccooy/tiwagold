Scaffold a new feature folder for Tiwa Gold:
<feature_name>
$ARGUMENTS
</feature_name>
<instructions>
Given a feature name (kebab-case, e.g. `trade-feed`, `macro-radar`), create:

1. Feature folder `src/features/<name>/` with:
   - `<Name>Screen.tsx` — thin screen using `Screen` primitive, renders loading/empty/error/success states; PascalCase conversion of the feature name
   - `components/` — empty folder (with `.gitkeep`) for feature-scoped components
   - `hooks.ts` — feature-scoped hooks (start empty with a comment header; no `export *`)
   - `selectors.ts` — pure transforms (start empty with a comment header)
   - `types.ts` — feature-local types (imports domain types from `src/types/` — never redeclares them)
   - `index.ts` — public surface; exports `<Name>Screen` and any public hooks/types

2. Route wiring:
   - If the feature is a tab: `app/(tabs)/<name>.tsx` that imports `<Name>Screen` from the feature index
   - If the feature is a stacked route: `app/<name>/[id].tsx` that reads params via `useLocalSearchParams` and passes them to the screen
   - Route file is thin — no business logic, no styling beyond `<Stack.Screen options={...} />`

3. Service and state (only if the feature fetches data):
   - `src/services/<name>.ts` — TanStack Query hooks (`use<Name>s`, `use<Name>`, mutations); cache keys per `.claude/rules/11-queries.md`
   - `src/state/<name>Store.ts` — only if feature-local state cannot live in component state

4. Do NOT create a boilerplate `CLAUDE.md` inside the feature folder. Add one only if the feature has non-obvious contracts that the numbered rules cannot cover.

5. Use design tokens from `src/design/tokens.ts` — never inline colors, spacing, radii, or type sizes.

After scaffolding:
- Run `npm run typecheck && npm run lint`
- Run `/verify-states app/(tabs)/<name>.tsx` (or the matching route) and report results
- Report every file created with its absolute-from-root path
</instructions>
<constraints>
- Named exports only (default export only allowed in `app/` route files)
- No cross-feature internal imports — consume other features via their `index.ts`
- `src/components/` must not import from `src/features/*`
</constraints>
