# Design: Squad Assembly Wizard

## Architecture

5-step React wizard backed by Express API and modular scoring engine. SQLite + Prisma for persistence.

### Component Flow
```
SquadWizard (state manager)
  → Step 1: CreateRequestStep → POST /api/squad-requests
  → Step 2: DefineRolesStep → PATCH /api/squad-requests/:id/roles
  → Step 3: RecommendationsStep → POST /api/squad-requests/:id/recommend
  → Step 4: AssembleSquadStep → PATCH /api/squad-requests/:id/squad
  → Step 5: ReviewFinaliseStep → POST /api/squad-requests/:id/finalise
```

### Data Model
- SquadRequest (title, objective, urgency, dates, status: draft→recommended→assembled→finalised)
- RequestRole → links SquadRequest to Role
- RequestSkill → links RequestRole to Skill (priority, requiredProficiency)
- SquadSelection → links SquadRequest + RequestRole + Candidate

### Scoring Engine
Pipeline: Filter (mandatory gate + availability gate) → Score (6 rules) → Aggregate → Tiebreak → Urgency override → Top 10

Rules: skillMatch (0.30), proficiency (0.15), experience (0.10), availability (0.20), workload (0.10), urgency (0.15)

### Error Handling
- 400 VALIDATION_ERROR (field-level errors array)
- 404 NOT_FOUND
- 409 INVALID_STATE (state transition violations)
- Frontend: inline errors, preserve form state, never navigate away on error

### Key Decisions
- Server-side scoring (testable, deterministic)
- Client-side assembly state (responsive UX)
- Wizard state in React useState (no external state lib)
- Rule fault tolerance (try-catch per rule, skip failures)
