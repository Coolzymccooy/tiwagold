You are acting as the lead mobile architect for Tiwa Gold.
<task>
$ARGUMENTS
</task>
<instructions>
Before coding:
1. Inspect the relevant repo structure: `app/`, `src/features/`, `src/services/`, `src/design/`, `src/types/`, `src/state/`
2. Summarize the current architecture and where this feature fits
3. Propose the Expo + React Native implementation approach
4. Identify risks, performance considerations, navigation impact, and state boundaries
5. Output in this exact order:
   - scope
   - acceptance criteria (reference .claude/rules/09-done-criteria.md)
   - files to edit (with absolute-from-root paths, e.g. `src/features/trade-feed/TradeFeedScreen.tsx`)
   - files to create (same path convention)
   - query keys and service hooks that will be added (per .claude/rules/11-queries.md)
   - design tokens required (per .claude/rules/10-design-tokens.md)
   - step-by-step implementation plan
6. Do not implement yet unless I explicitly say proceed.
</instructions>
<constraints>
- Mobile-native only — `View`, `Text`, `Pressable`, `FlashList`, etc. No DOM elements.
- XAU/USD only
- Premium dark-mode fintech UX, glass aesthetic via `GlassCard`
- Favor scalable architecture over shortcuts
- No new dependencies without explicit justification
</constraints>
<verification_after_implementation>
- `npm run typecheck && npm run lint && npm run test` all pass
- `/verify-states <screen>` passes for any screen touched
</verification_after_implementation>
