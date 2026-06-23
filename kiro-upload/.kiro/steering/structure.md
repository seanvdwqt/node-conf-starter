# File Organisation — Rapid Squad Assembly

## Project Root

```
node-conf-starter/
├── package.json              # Workspace root — shared scripts & devDeps
├── tsconfig.json             # Base strict TypeScript config (no emit)
├── eslint.config.mjs         # Flat ESLint config (TS + React + Prettier)
├── .nvmrc                    # Pins Node 22
├── .prettierrc.json          # Prettier config
├── .prettierignore           # Prettier ignore patterns
│
├── server/                   # Express backend workspace
│   ├── package.json
│   ├── tsconfig.json         # Extends root — ES2022, NodeNext
│   ├── vitest.config.ts
│   ├── .env.example
│   ├── src/
│   │   ├── index.ts          # Express app entry point
│   │   ├── lib/
│   │   │   └── prisma.ts     # PrismaClient singleton
│   │   ├── routes/
│   │   │   ├── api.ts        # Health/info/echo routes
│   │   │   └── squadRequests.ts  # All squad assembly routes
│   │   ├── services/
│   │   │   ├── squadRequest.service.ts  # CRUD + state transitions
│   │   │   └── scoring.service.ts       # Scoring orchestration
│   │   ├── scoring/
│   │   │   ├── types.ts      # ScoringRule, CandidateContext, etc.
│   │   │   ├── config.ts     # Default weights and thresholds
│   │   │   ├── engine.ts     # Core scoring pipeline
│   │   │   ├── explanation.ts # Human-readable explanation generator
│   │   │   └── rules/
│   │   │       ├── skillMatch.ts
│   │   │       ├── proficiency.ts
│   │   │       ├── experience.ts
│   │   │       ├── availability.ts
│   │   │       ├── workload.ts
│   │   │       └── urgency.ts
│   │   ├── search/
│   │   │   ├── queryParser.ts    # NLP tokenizer (keyword-based)
│   │   │   └── teamComposer.ts  # Team combination generator
│   │   ├── validation/
│   │   │   ├── squadRequest.ts   # Field validation
│   │   │   └── customSkill.ts    # Custom skill description validation
│   │   ├── utils/
│   │   │   ├── availability.ts   # Capacity → indicator classifier
│   │   │   └── missingRoles.ts   # Unfilled role detection
│   │   └── middleware/
│   │       └── errorHandler.ts   # Centralised error formatting
│   ├── prisma/
│   │   ├── schema.prisma     # Full data model
│   │   ├── seed.ts           # Mock data generation (idempotent)
│   │   └── migrations/       # Prisma migrations
│   └── tests/
│       └── ...               # Unit + property tests
│
├── client/                   # React + Vite frontend workspace
│   ├── package.json
│   ├── tsconfig.json         # Extends root — ES2020, bundler
│   ├── vite.config.ts        # Vite + proxy config
│   ├── vitest.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── playwright.config.ts
│   ├── index.html            # Vite entry HTML
│   ├── src/
│   │   ├── main.tsx          # React mount point
│   │   ├── App.tsx           # Landing page (search + wizard)
│   │   ├── index.css         # Tailwind imports
│   │   ├── api/
│   │   │   └── squadRequests.ts  # Typed API client
│   │   └── components/
│   │       ├── SquadWizard.tsx         # Wizard container (state + nav)
│   │       ├── InstantSquadSearch.tsx  # Search bar + results
│   │       ├── steps/
│   │       │   ├── CreateRequestStep.tsx
│   │       │   ├── DefineRolesStep.tsx
│   │       │   ├── RecommendationsStep.tsx
│   │       │   ├── AssembleSquadStep.tsx
│   │       │   └── ReviewFinaliseStep.tsx
│   │       └── ui/
│   │           ├── CandidateCard.tsx
│   │           ├── TeamSuggestionCard.tsx
│   │           ├── ScoreBadge.tsx
│   │           ├── AvailabilityBadge.tsx
│   │           ├── ProficiencyIndicator.tsx
│   │           ├── GapIndicator.tsx
│   │           └── FilterBar.tsx
│   ├── tests/
│   │   ├── setup.ts
│   │   ├── *.test.tsx        # Component tests
│   │   └── components/ui/    # UI component tests
│   └── e2e/
│       └── *.spec.ts         # Playwright E2E tests
│
└── .kiro/
    ├── specs/
    │   └── rapid-squad-assembly/
    │       ├── requirements.md
    │       ├── design.md
    │       └── tasks.md
    └── hooks/
        └── commit-after-task.kiro.hook
```

## Conventions

- **One component per file** — named after the component
- **UI components** in `components/ui/` — reusable presentational components
- **Step components** in `components/steps/` — one per wizard step
- **Scoring rules** in `scoring/rules/` — one per rule, factory function pattern
- **Services** handle business logic; routes handle HTTP concerns only
- **Tests** mirror source structure under `tests/`
