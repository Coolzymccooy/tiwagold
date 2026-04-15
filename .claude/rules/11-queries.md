# TanStack Query rules
## Where queries live
- All queries and mutations live in `src/services/*.ts`
- Services export hooks only (`useTrades`, `useTrade`, `useUpdateTradeStatus`) — never expose `queryClient` or raw fetchers
- Screens and feature hooks consume service hooks — never call `useQuery` or `useMutation` inline in a screen

## Cache key conventions
- Lists use a bare tuple: `['trades']`, `['analytics']`
- Detail queries append an id: `['trade', id]`, `['user', 'me']`
- Scoped sub-resources nest: `['copilot', 'session', sessionId]`, `['trade', id, 'autopsy']`
- Keys are defined as typed factories inside the service file — never inlined at the call site

## Staleness
- Market-data queries: `staleTime: 10_000`
- User profile, settings: `staleTime: 60_000`
- Static reference data: `staleTime: Infinity`
- `cacheTime` left at the default unless there is a reason to evict sooner

## Mutations
- Every mutation invalidates its parent list key in `onSuccess`
- Optimistic updates use `onMutate` + `onError` rollback — never mutate cache without a rollback path
- Mutation side effects (haptics, toasts) live in the hook, not the screen

## Gating and errors
- Auth-gated queries use `enabled: Boolean(authStore.userId)`
- Errors bubble to the screen via `QueryErrorResetBoundary` — screens render the error state with retry
- Never swallow a query error silently

## Provider
- `QueryClientProvider` mounts in `app/_layout.tsx` with one shared `QueryClient`
- No per-screen `QueryClient` instances
- Default options: `retry: 2`, `refetchOnWindowFocus: false` (mobile), `refetchOnReconnect: true`
