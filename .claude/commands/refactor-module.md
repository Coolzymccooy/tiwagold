Refactor this area without changing user-visible behavior:
<scope>
$ARGUMENTS
</scope>
<constraints>
- Preserve behavior (visual, navigation, data flow)
- Reduce complexity — split files over 400 lines, screens over 200 lines, functions over 50 lines
- Improve type safety — eliminate `any`, tighten with `unknown` + narrowing
- Preserve feature folder boundaries — `src/components/` must not import from `src/features/*`
- Preserve query keys in `src/services/*` — rename only if explicitly in scope
- Preserve design tokens — no inline colors/spacing introduced
- No speculative abstractions — extract a new shared primitive only after the third duplicate
- No dependency additions unless justified
</constraints>
<required_output>
1. Current issues (with file:line references)
2. Proposed structure (folder or file diagram)
3. Exact files affected (edit / create / delete / move)
4. Implementation plan (ordered steps)
Then implement, then run `npm run typecheck && npm run lint && npm run test`.
</required_output>
