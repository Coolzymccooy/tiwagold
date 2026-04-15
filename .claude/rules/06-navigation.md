# Navigation rules
## Router
- Navigation uses **Expo Router** exclusively — never `react-navigation` primitives imported directly (Expo Router owns them)
- Never import from `react-router-dom` or any web router — those are web-only
## Route structure
- Route groups: `(auth)` and `(tabs)` under `app/`
- `app/_layout.tsx` — root Stack, mounts providers (`GestureHandlerRootView`, `SafeAreaProvider`, `QueryClientProvider`)
- `app/index.tsx` — redirects to `(tabs)` or `(auth)/login` based on `authStore`
- `app/(auth)/_layout.tsx` — Stack, no header, gesture dismiss enabled
- `app/(tabs)/_layout.tsx` — Bottom Tabs: `index` (Trades), `analytics`, `copilot`, `settings`
- `app/trade/[id].tsx` — stacked modal-style route, presents from Trades tab
## Navigation discipline
- Every navigation call goes through `router` from `expo-router` — never pass navigation objects as props
- Route files are thin: import a feature screen, pass route params via `useLocalSearchParams`, nothing else
- Headers configured per screen via `<Stack.Screen options={...} />` — never ad-hoc styled header components
- Deep links declared via `expo-linking` and `app.json#scheme` — never hardcoded URLs in components
## Mobile feel
- Tab bar sits above the home indicator via `useSafeAreaInsets().bottom`
- Stacked routes use native gesture-back on iOS
- No modal that traps focus without an explicit close affordance
