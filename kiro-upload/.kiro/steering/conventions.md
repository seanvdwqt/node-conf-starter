# Coding Conventions — Rapid Squad Assembly

## Language & Module System

- TypeScript strict mode throughout (both workspaces)
- ESM only (`"type": "module"` in package.json)
- Use `.js` extensions in server imports (NodeNext resolution)
- No `require()` — all imports are ES module `import`

## TypeScript

- Prefer `interface` for object shapes, `type` for unions/intersections
- Export types separately from implementations
- Use `as const` for literal tuples and constant objects
- Prefer explicit return types on exported functions
- No `any` — use `unknown` with type narrowing if needed

## Naming

- **Files:** camelCase for modules (`squadRequest.service.ts`), PascalCase for React components (`SquadWizard.tsx`)
- **Variables/functions:** camelCase
- **Types/interfaces:** PascalCase
- **Constants:** UPPER_SNAKE_CASE for configuration values, camelCase for derived constants
- **Test files:** `*.test.ts` / `*.test.tsx` (unit), `*.spec.ts` (E2E)

## React Components

- Functional components only (no class components)
- Use `React.FC<Props>` or plain function signatures — either is acceptable
- Hooks: `useCallback` for event handlers passed to children, `useEffect` with cleanup
- State management: React state + props (no external state library)
- All interactive elements must have `data-testid` attributes

## Styling (Tailwind CSS)

- Utility classes inline — no custom CSS unless absolutely necessary
- Colour coding conventions:
  - Primary actions: `indigo-600`
  - Success/available: `green-*`
  - Warning/partial: `amber-*`
  - Error/unavailable: `red-*`
  - Neutral: `gray-*`
- Responsive: mobile-first but desktop primary target

## API Layer

- Typed fetch wrappers in `client/src/api/`
- All API functions return typed promises
- Error responses parsed into `ApiError` class
- No direct `fetch()` calls in components — always go through the API layer

## Backend

- Route handlers: thin — validate input, call service, format response
- Services: business logic, Prisma queries, error throwing
- Custom error classes: `NotFoundError`, `ValidationFailedError`, `InvalidStateError`
- Scoring rules: factory function pattern (`createXxxRule(weight): ScoringRule`)
- Pure utility functions: no side effects, easily testable

## Error Handling

- Backend: custom error classes with HTTP status codes; centralised `errorHandler` middleware
- Frontend: try-catch in async operations, error state in components, inline field errors for forms
- Never let errors crash the app — graceful degradation

## Testing

- Vitest for unit + component tests
- Testing Library for React component assertions
- Playwright for E2E
- Test IDs: `data-testid="component-name-action"` pattern
- Mock Prisma in service tests
- Scoring engine tested in isolation (no DB dependency)

## Git

- Conventional commits: `feat(scope): description`, `fix(scope): description`
- No force pushes, no direct commits to main
- One feature per branch
