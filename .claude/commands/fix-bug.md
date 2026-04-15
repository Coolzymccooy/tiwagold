Investigate and fix this bug in Tiwa Gold:
<bug>
$ARGUMENTS
</bug>
<instructions>
1. Inspect relevant files first — route in `app/`, screen in `src/features/<name>/`, service in `src/services/`, types in `src/types/`
2. Identify likely root causes — distinguish platform (iOS/Android), state (Zustand/Query), navigation (Expo Router), and rendering (Reanimated/FlashList)
3. State the smallest correct fix
4. Implement without unrelated refactors
5. Add or update a test in `__tests__/` or adjacent `*.test.ts` — especially for service hooks and pure selectors
6. Report:
   - root cause
   - changed files
   - verification: which tests + which device (iPhone SE / 15 Pro / Pixel 7)
</instructions>
<constraints>
- No DOM primitives (`div`, `span`, `onClick`) — only React Native primitives
- Preserve existing navigation structure and query keys
- Run `npm run typecheck && npm run lint && npm run test` before reporting done
</constraints>
