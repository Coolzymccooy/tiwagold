# Testing rules
## Runner
- Test runner is `jest-expo` with `@testing-library/react-native` and `@testing-library/jest-native`
- `npm run test` must pass before claiming done
- `npm run typecheck` and `npm run lint` must pass on every commit
## Mandatory coverage
- Every function in `src/services/*` has a unit test (mocked network layer)
- Every pure transform in `src/features/**/selectors.ts` has a unit test
- Every Zustand store in `src/state/*` has a unit test for its actions and persistence contract
- Every custom hook in `src/hooks/*` has a render test via `renderHook`
## Screen tests
- Screens do not need full snapshot coverage — test interaction and state transitions only
- Test all four render states (loading, empty, error, success) for any screen that fetches data
- Use `@testing-library/react-native` queries — never reach into internals via refs
## Data and mocks
- Tests use the fixtures in `src/mocks/*` — never hand-roll trade/user objects inline
- Network calls are mocked via `msw` or a typed stub — never hit a real backend from a unit test
## Validation on every diff
- Navigation flows that changed must be verified in the simulator before the diff lands
- Empty/loading/error/success states must be verified for any screen added or touched
- Run `/verify-states <screen>` before marking screen work done
