# Architecture Document — Rapid Squad Assembly

## Overview

Full-stack monorepo (npm workspaces) implementing a delivery squad assembly prototype. The system follows a linear wizard workflow: create request → define roles/skills → generate scored recommendations → assemble squad → review & finalise. An alternative "Instant Squad Search" path provides natural-language team composition suggestions.

All data is mock-seeded into SQLite via Prisma. No authentication, no external integrations, no real PII.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (React + Vite)                     │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ InstantSquadSearch│  │        SquadWizard (5 steps)     │ │
│  │  • Search bar     │  │  Step 1: CreateRequestStep       │ │
│  │  • TeamCards      │  │  Step 2: DefineRolesStep         │ │
│  └──────────────────┘  │  Step 3: RecommendationsStep      │ │
│                         │  Step 4: AssembleSquadStep        │ │
│          API Client     │  Step 5: ReviewFinaliseStep       │ │
│    (typed fetch layer)  └──────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP (proxy :5173 → :3001)
┌────────────────────────────▼────────────────────────────────┐
│                    Server (Express + TS)                      │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Routes      │  │ Services          │  │ Scoring Engine │ │
│  │ • squad-req │  │ • squadRequest    │  │ • engine.ts    │ │
│  │ • roles     │  │ • scoring         │  │ • 6 rules      │ │
│  │ • search    │  │                   │  │ • config.ts    │ │
│  └─────────────┘  └──────────────────┘  └────────────────┘ │
│  ┌─────────────┐  ┌──────────────────┐                      │
│  │ Search      │  │ Validation        │                      │
│  │ • queryParser│  │ • squadRequest   │                      │
│  │ • teamComposer│ │ • customSkill    │                      │
│  └─────────────┘  └──────────────────┘                      │
└────────────────────────────┬────────────────────────────────┘
                             │ Prisma Client
┌────────────────────────────▼────────────────────────────────┐
│                   SQLite (dev.db via Prisma)                  │
│  Candidate, Role, Skill, SquadRequest, RequestRole,          │
│  RequestSkill, CandidateSkill, CandidateProject,             │
│  SquadSelection, RoleSkill                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| SQLite + Prisma | Zero-config, portable, type-safe ORM |
| Modular scoring engine with rule objects | Rules can be added/removed/reweighted independently |
| 5-step wizard (no SPA routing) | Simple state progression, meets ≤5 screens requirement |
| Server-side scoring, client-side assembly state | Scoring logic testable in isolation; UI stays stateless |
| Keyword-based query parser (no AI/ML) | Meets requirement for no external NLP services |
| Mock data seed script | Reproducible, idempotent demo state |

---

## Data Model (Entity Relationships)

```
SquadRequest ||--o{ RequestRole : has
RequestRole ||--o{ RequestSkill : requires
RequestRole }o--|| Role : references
RequestSkill }o--|| Skill : references
Role ||--o{ RoleSkill : "default skills"
RoleSkill }o--|| Skill : references
Candidate ||--o{ CandidateSkill : has
Candidate ||--o{ CandidateProject : "worked on"
CandidateSkill }o--|| Skill : references
SquadRequest ||--o{ SquadSelection : assembles
SquadSelection }o--|| RequestRole : "fills"
SquadSelection }o--|| Candidate : "assigned"
```

### Key Entities

| Entity | Key Fields |
|--------|-----------|
| Candidate | name, email, currentRole, businessUnit, capacityFree, currentWorkload, yearsExperience, currentTeam |
| Role | name (architect, engineer, tester, data specialist, business analyst, delivery lead) |
| Skill | name, category (technical, domain, soft, other) |
| CandidateSkill | proficiency (1–3) |
| SquadRequest | title, objective, urgency, startDate, durationWeeks, requiredCapacity, status |
| RequestSkill | priority (mandatory/preferred), requiredProficiency (1–3) |
| SquadSelection | squadRequestId, requestRoleId, candidateId |

---

## Scoring Engine Architecture

### Pipeline Flow

```
Candidate List
  → Filter: Mandatory Skill Gate (exclude if 0 mandatory matched)
  → Filter: Availability Gate (exclude if <25% capacity)
  → Score: SkillMatchRule (weight: 0.30)
  → Score: ProficiencyRule (weight: 0.15)
  → Score: ExperienceRule (weight: 0.10)
  → Score: AvailabilityRule (weight: 0.20)
  → Score: WorkloadRule (weight: 0.10)
  → Score: UrgencyRule (weight: 0.15)
  → Aggregate: totalScore = Σ(rule.score × weight), clamped 0–100
  → Tiebreak: equal scores → higher capacityFree wins
  → Urgency Override: high urgency → available above partially_available
  → Output: Top 10 per role with breakdown + explanation
```

### Scoring Rules

| Rule | Formula | Purpose |
|------|---------|---------|
| SkillMatch | `(mandatory×2 + preferred) / (totalMandatory×2 + totalPreferred) × 100` | Core skill alignment |
| Proficiency | Average of `(candidateLevel / requiredLevel × 100)` per matched skill | Depth matching |
| Experience | `min(100, yearsExperience × 10)` | Experience bonus |
| Availability | available=100, partially=50, unavailable=exclude | Capacity scoring |
| Workload | `max(0, 100 - currentWorkload)` | Workload penalty |
| Urgency | High: available=100/partial=40; Medium: 80/60; Low: 70 (neutral) | Urgency fit |

### Fault Tolerance

Each rule is wrapped in try-catch. A failing rule is skipped (logged), remaining rules produce valid output. The engine never crashes due to a single rule failure.

---

## Search Architecture (Instant Squad Search)

```
User Input ("2 engineers with React, urgent")
  → Query Parser (tokenizer)
     • Extract roles: engineer × 2
     • Extract skills: React
     • Extract urgency: high
     • Synonym mapping (dev→engineer, QA→tester, BA→business analyst)
  → Team Composer
     • Score all candidates per extracted role
     • Compose up to 5 team combinations
     • Calculate combined team score (avg of member scores)
     • Generate one-line explanation per team
  → Response: parsed criteria + team suggestions
```

---

## Request Flow

1. **Client** renders wizard or search. Each step calls the corresponding API endpoint.
2. **Express routes** validate input, delegate to service functions.
3. **Services** handle business logic, invoke Prisma for persistence.
4. **Scoring engine** is invoked on "recommend" step — queries candidates, applies rules, returns ranked shortlists.
5. **Assembly state** (selected candidates) managed client-side, persisted via PATCH on save.

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 22 LTS |
| Frontend | React + Vite | 18.3 / 5.4 |
| Styling | Tailwind CSS | 3.4 |
| Backend | Express | 4.21 |
| ORM | Prisma | 5.22 |
| Database | SQLite | File-based |
| Language | TypeScript (strict) | 5.6 |
| Unit Tests | Vitest | 1.6 |
| Component Tests | Testing Library | 16.1 |
| E2E Tests | Playwright | 1.49 |
| Linting | ESLint 9 (flat config) | — |
| Formatting | Prettier | — |
| Monorepo | npm Workspaces | — |

---

## Module Decomposition

### Server (`server/src/`)

| Directory | Responsibility |
|-----------|---------------|
| `routes/` | HTTP endpoint handlers, request validation |
| `services/` | Business logic (squad request CRUD, scoring orchestration) |
| `scoring/` | Scoring engine, rules, config, types, explanation generator |
| `scoring/rules/` | Individual rule implementations (one per file) |
| `search/` | Query parser (tokenizer) and team composer |
| `validation/` | Input validation (squad request fields, custom skills) |
| `utils/` | Pure utilities (availability classification, missing roles) |
| `lib/` | Shared singletons (Prisma client) |
| `middleware/` | Express middleware (error handler) |

### Client (`client/src/`)

| Directory | Responsibility |
|-----------|---------------|
| `components/` | Top-level components (SquadWizard, InstantSquadSearch) |
| `components/steps/` | Wizard step components (one per step) |
| `components/ui/` | Reusable UI components (badges, cards, indicators, filters) |
| `api/` | Typed fetch wrappers for all API endpoints |

---

## Mock Data Strategy

| Entity | Count | Strategy |
|--------|-------|----------|
| Roles | 6 | Fixed: architect, engineer, tester, data specialist, business analyst, delivery lead |
| Skills | ~30 | 5 per role average, across technical/domain/soft categories |
| Candidates | 30–50 | Randomised skills (3–8), proficiency (1–3), capacity (20–100%), workload (10–90%), experience (1–15y) |
| Projects | ~100–200 | Random names assigned to candidates with role played |
| Teams | 6 | Fixed pool of team names |

Seed is idempotent (uses `upsert`). Run via `npx prisma db seed`.

---

## Error Handling Strategy

### Backend
| Scenario | HTTP Status | Code |
|----------|-------------|------|
| Invalid fields | 400 | VALIDATION_ERROR |
| Not found | 404 | NOT_FOUND |
| Invalid state transition | 409 | INVALID_STATE |
| Rule failure (scoring) | 200 (partial) | N/A (logged, rule skipped) |
| Unexpected error | 500 | INTERNAL_ERROR |

### Frontend
- **Form errors:** Inline per field, preserve all entered data
- **API errors:** Toast/banner, never navigate away
- **Network failures:** "Connection lost" message, keep form state
- **Scoring gaps:** GapIndicator component (not an error state)

---

## Deployment (Development)

```bash
npm install          # Install all workspace dependencies
npm run dev          # Start server (:3001) + client (:5173) concurrently
npm run db:generate  # Generate Prisma client (after schema changes)
npm run db:migrate   # Apply migrations
npx prisma db seed   # Seed mock data
npm test             # Run all unit + component tests
npm run test:e2e     # Run Playwright E2E tests
```
