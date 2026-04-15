# Design token rules
All color, spacing, radius, typography, and motion values come from `src/design/tokens.ts`. No hardcoded hex, padding numbers, or font sizes in feature files.

## Palette (dark-only)
- `bg.base`          — near-black page background
- `bg.elevated`      — cards, sheets, modals
- `bg.glass`         — translucent panel fill behind blur
- `fg.primary`       — primary text
- `fg.muted`         — secondary text, captions
- `fg.subtle`        — tertiary text, disabled
- `accent.gold`      — brand amber (primary actions, scores)
- `accent.goldBright`— hover/press accent
- `accent.goldDeep`  — pressed/active accent
- `status.success`   — green (profit, valid)
- `status.warn`      — amber (caution, pending)
- `status.danger`    — red (loss, rejected)
- `hairline`         — 1px border color on glass and dividers

## Spacing scale
`xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`, `2xl 32`, `3xl 48`. Use the token name — never the raw number.

## Radius scale
`sm 8`, `md 14`, `lg 20`, `pill 999`.

## Type scale (size / lineHeight)
- `caption`  12 / 16
- `body`     15 / 22
- `title`    18 / 24
- `headline` 22 / 28
- `display`  32 / 38

Font family token: `font.sans` (system stack) and `font.mono` (for numerics in trade cards).

## Motion easings
- `easing.gentle` — `[0.32, 0.72, 0, 1]` (enter, reveal)
- `easing.snap`   — `[0.2, 0.8, 0.2, 1]` (tap feedback)
- `duration.fast` — 180ms
- `duration.base` — 240ms
- `duration.slow` — 320ms
- `duration.screen` — 480ms

## Glass recipe
`GlassCard` primitive only. Parameters:
- `expo-blur` `intensity={30}`, `tint="dark"`
- fill: `rgba(255,255,255,0.06)`
- border: 1px `hairline` color, `radius.md`
- elevation: subtle shadow, `shadowOpacity <= 0.15`

Never re-style blur per screen; always compose via `<GlassCard>`.

## Enforcement
- PRs touching colors/spacing/typography must show zero inline values in the diff
- `tokens.ts` is the single source of truth — changes to the palette or scale happen there first, then propagate
