# Testing Standards

## Test Runners

| Type | Runner | Location |
|------|--------|----------|
| Server unit tests | Vitest (Node env) | `server/tests/` |
| Client component tests | Vitest (jsdom env) | `client/tests/` |
| E2E tests | Playwright | `client/e2e/` |

## Running Tests

```bash
npm test                              # All unit + component tests
npm run test:watch --workspace=client # Watch mode (client)
npm run test:watch --workspace=server # Watch mode (server)
npm run test:coverage --workspace=server  # Coverage report
npm run test:e2e                      # Playwright E2E
```

## Test File Naming

- Unit/component: `*.test.ts` or `*.test.tsx`
- E2E: `*.spec.ts`
- Property-based: `*.property.test.ts`

## Component Testing Patterns

- Use Testing Library (`@testing-library/react`)
- Query by `data-testid` for test-specific selectors
- Use `screen.getByTestId()` for assertions
- Mock fetch in setup (`client/tests/setup.ts` stubs `globalThis.fetch`)

## Scoring Engine Tests

- Test rules in isolation — pass `CandidateContext` and `RequestContext` directly
- No database dependency in unit tests (use factory fixtures)
- Property-based tests use `fast-check` with ≥100 iterations
- Custom arbitraries for: Candidate, ScoringConfig, RequestContext

## E2E Testing Patterns

- Playwright auto-starts both dev servers
- Tests run against a seeded test database
- Use `page.getByTestId()` for selectors
- Test complete wizard flows end-to-end

## Coverage Expectations

- Scoring rules: high coverage (critical business logic)
- Validation functions: full coverage (field-level validators)
- Route handlers: test response shapes and status codes
- UI components: test rendering and basic interactions
