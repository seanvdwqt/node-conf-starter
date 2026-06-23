# Technology Decisions — Rapid Squad Assembly

## Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Runtime | Node.js | 22 LTS | Pinned via `.nvmrc` |
| Frontend | React | 18.3 | SPA with HMR via Vite |
| Bundler | Vite | 5.4 | Fast dev server, proxy API calls |
| Styling | Tailwind CSS | 3.4 | Utility-first, rapid prototyping |
| Backend | Express | 4.21 | Minimal HTTP server + routing |
| ORM | Prisma | 5.22 | Type-safe queries, schema-driven |
| Database | SQLite | file-based | Zero-config, portable |
| Language | TypeScript | 5.6 (strict) | End-to-end type safety |
| Unit Tests | Vitest | 1.6 | Vite-native, fast |
| Component Tests | Testing Library | 16.1 | DOM-based React testing |
| E2E Tests | Playwright | 1.49 | Multi-browser integration |
| Linting | ESLint | 9 (flat config) | Code quality |
| Formatting | Prettier | — | Consistent style |
| Monorepo | npm Workspaces | — | Single install, shared lockfile |

## Module System

- ESM throughout (`"type": "module"` in both packages)
- Server: `NodeNext` module resolution, `ES2022` target
- Client: Vite bundler resolution, `ES2020` target, React JSX transform

## Key Architectural Patterns

- **Modular scoring engine:** Each scoring factor is an independent rule object with a standard interface. Rules can be added/removed/reweighted via configuration.
- **Service layer:** Business logic separated from route handlers (services/ directory).
- **Typed API client:** Frontend fetch wrappers with full TypeScript types matching server responses.
- **Pipeline pattern:** Scoring follows filter → score → aggregate → rank pipeline.

## Development Commands

```bash
npm run dev          # Concurrent server + client (hot reload)
npm run build        # TypeScript compile + production bundle
npm test             # All unit + component tests
npm run test:e2e     # Playwright E2E tests
npm run lint         # ESLint
npm run format       # Prettier
```

## Database Commands

```bash
npm run db:generate --workspace=server   # Regenerate Prisma client
npm run db:migrate --workspace=server    # Create + apply migration
npx prisma db seed                       # Seed mock data (idempotent)
npm run db:studio --workspace=server     # Visual DB browser
```

## Environment Variables

| Variable | Default | Location |
|----------|---------|----------|
| PORT | 3001 | server/.env |
| NODE_ENV | development | server/.env |
| DATABASE_URL | file:./dev.db | server/.env |
| VITE_API_URL | http://localhost:3001 | client/.env |
