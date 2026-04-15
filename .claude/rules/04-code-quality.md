# Code quality rules
## TypeScript
- `tsconfig.json` must have `strict: true`, `noUncheckedIndexedAccess: true`
- No `any` — use `unknown` + narrowing, or a precise type
- Prefer `interface` for extensible object shapes, `type` for unions/utility types
- Export domain types from `src/types/*` — never redeclare in features
## File and function size
- Files <= 400 lines; screens <= 200 lines
- Functions <= 50 lines; if longer, extract a helper
- No deep nesting beyond 4 levels — use early returns
## Module style
- No default exports except Expo Router route files under `app/`
- Named exports everywhere else; makes refactor/rename safe
- No `export *` barrel re-exports deeper than one level
## Purity and reuse
- Selectors, mappers, formatters must be pure and live in `selectors.ts` or `src/hooks/`
- No duplicated styling — reuse primitives from `src/design/primitives/`
- No duplicated domain logic — if it exists in a service, import it
## Hygiene
- No `console.log`, `debugger`, or commented-out code at commit time
- No unrelated refactors in the same diff
- Descriptive names — avoid `utils`, `helpers`, `data`, `foo` as filenames
