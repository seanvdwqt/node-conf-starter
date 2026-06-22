# Implementation Plan: Rapid Squad Assembly

## Overview

Build a full-stack prototype for assembling cross-functional delivery squads from a mock talent pool. Implementation proceeds bottom-up: data layer (Prisma models + seed) → scoring engine → API routes → React wizard UI → E2E tests. TypeScript throughout, using the existing monorepo structure.

## Tasks

- [ ] 1. Data layer — Prisma schema and seed script
  - [ ] 1.1 Extend Prisma schema with squad assembly models
    - Add Candidate, Role, Skill, RoleSkill, CandidateSkill, SquadRequest, RequestRole, RequestSkill, and SquadSelection models to `server/prisma/schema.prisma`
    - Keep the existing User model untouched
    - Run `npx prisma migrate dev --name squad-assembly-models` to generate migration
    - Run `npx prisma generate` to update the client
    - _Requirements: 1.2, 3.1, 4.1, 5.2_

  - [ ] 1.2 Create mock data seed script
    - Create `server/prisma/seed.ts` using Prisma upsert for idempotency
    - Seed 6 fixed roles (architect, engineer, tester, data specialist, business analyst, delivery lead)
    - Seed ~30 predefined skills (5 per role average) across categories (technical, domain, soft)
    - Seed RoleSkill associations linking default skills to roles
    - Seed 30–50 candidates with randomised names, skills (3–8 each), capacityFree (20–100%), currentWorkload (10–90%), all in business unit "Digital Platforms"
    - Seed CandidateSkill records with proficiency (1–5)
    - Add `"prisma": { "seed": "npx tsx prisma/seed.ts" }` to `server/package.json`
    - _Requirements: 2.1, 10.3_

  - [ ] 1.3 Create Prisma client singleton
    - Create `server/src/lib/prisma.ts` exporting a shared PrismaClient instance
    - _Requirements: 10.1_

- [ ] 2. Scoring engine — rules, config, and engine orchestrator
  - [ ] 2.1 Create scoring configuration and types
    - Create `server/src/scoring/config.ts` with default ScoringConfig (weights: skillMatch 0.45, availability 0.25, workload 0.15, urgency 0.15; thresholds: workloadHigh 80, minMandatorySkills 1)
    - Create `server/src/scoring/types.ts` with ScoringRule, RuleResult, CandidateContext, RequestContext, and ScoringConfig interfaces
    - _Requirements: 9.1, 9.2_

  - [ ] 2.2 Implement SkillMatchRule
    - Create `server/src/scoring/rules/skillMatch.ts`
    - Score formula: `(mandatoryMatched × 2 + preferredMatched) / (totalMandatory × 2 + totalPreferred) × 100`
    - Exclude candidate if mandatoryMatched = 0 (set `exclude: true`)
    - Include matched skill names in explanation
    - _Requirements: 5.2, 5.3_

  - [ ] 2.3 Implement AvailabilityRule
    - Create `server/src/scoring/rules/availability.ts`
    - Classify capacity: ≥75% → available (score 100), 25–74% → partially_available (score 50), <25% → unavailable (exclude)
    - Null/undefined capacity → unavailable (exclude)
    - _Requirements: 4.1, 4.3, 5.4, 5.5_

  - [ ] 2.4 Implement WorkloadRule
    - Create `server/src/scoring/rules/workload.ts`
    - Score: `max(0, 100 - currentWorkload)`
    - Flag `high_workload` when workload > configured threshold
    - _Requirements: 5.6_

  - [ ] 2.5 Implement UrgencyRule
    - Create `server/src/scoring/rules/urgency.ts`
    - High urgency: available=100, partially_available=40
    - Medium urgency: available=80, partially_available=60
    - Low urgency: all=70 (neutral)
    - _Requirements: 5.7_

  - [ ] 2.6 Implement scoring engine orchestrator
    - Create `server/src/scoring/engine.ts`
    - Filter phase: remove candidates failing mandatory skill gate or availability gate
    - Score phase: iterate rules, wrap each in try-catch (skip failed rules, log warning)
    - Aggregate: `totalScore = Σ(rule.score × rule.weight)`, clamp 0–100
    - Tiebreak: equal scores broken by higher capacityFree
    - Urgency override: when urgency=high, sort available candidates above partially_available regardless of score
    - Return top 10 per role with breakdown and explanation
    - _Requirements: 5.1, 5.7, 5.8, 6.1, 9.1, 9.3, 9.4_

  - [ ] 2.7 Implement explanation generator
    - Create `server/src/scoring/explanation.ts`
    - Generate human-readable explanation referencing matched skills by name, availability status, and applied scoring rules
    - No technical jargon or rule identifiers in output
    - _Requirements: 6.3, 6.4_

  - [ ]* 2.8 Write property tests for scoring engine (Properties 4–10)
    - Create `server/tests/properties/scoring-engine.property.test.ts`
    - **Property 4: Business Unit Invariant** — all returned candidates share business unit with request
    - **Property 5: Eligibility Gates** — candidates with 0 mandatory skills or unavailable status excluded
    - **Property 6: Score Bounds and Mandatory Skill Weighting** — scores 0–100, mandatory > preferred
    - **Property 7: Reduced Ranking for Partial Availability and High Workload** — available > partially_available; below threshold > above threshold
    - **Property 8: High Urgency Availability Override** — available candidates rank above partially_available when urgency=high
    - **Property 9: Tiebreak by Availability** — equal scores broken by capacity
    - **Property 10: Shortlist Size and Ordering** — max 10 per role, descending order
    - Use fast-check with minimum 100 iterations per property
    - Create custom arbitraries for Candidate, ScoringConfig, and RequestContext
    - **Validates: Requirements 2.1, 2.2, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.1**

  - [ ]* 2.9 Write property tests for scoring configuration (Properties 13–14)
    - Create or extend `server/tests/properties/scoring-engine.property.test.ts`
    - **Property 13: Configuration Weights Affect Scoring** — changing weights changes score contributions proportionally
    - **Property 14: Failing Rule Resilience** — a throwing rule is excluded, remaining rules still produce valid output
    - **Validates: Requirements 9.2, 9.4**

- [ ] 3. Validation utilities and availability classifier
  - [ ] 3.1 Implement squad request validation
    - Create `server/src/validation/squadRequest.ts`
    - Validate: title ≤100 chars, objective ≤500 chars, urgency in {low, medium, high}, durationWeeks 1–52 integer, requiredCapacity in {10,20,...,100}, startDate ≥ today, businessUnit = "Digital Platforms"
    - Return array of field-level errors (field name + message)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.3_

  - [ ] 3.2 Implement availability classification function
    - Create `server/src/utils/availability.ts`
    - Pure function: capacityFree → available | partially_available | unavailable
    - Handle null/undefined → unavailable
    - _Requirements: 4.1, 4.3_

  - [ ] 3.3 Implement custom skill validation
    - Create `server/src/validation/customSkill.ts`
    - Validate description length 1–200 characters
    - _Requirements: 3.4_

  - [ ]* 3.4 Write property tests for validation (Properties 1–3, 16)
    - Create `server/tests/properties/validation.property.test.ts`
    - **Property 1: Squad Request Round-Trip** — valid fields create and read back identically
    - **Property 2: Validation Identifies All Field Violations** — rejected inputs return exactly the violating fields
    - **Property 16: Custom Skill Description Validation** — strings outside 1–200 rejected, within accepted
    - Create `server/tests/properties/availability.property.test.ts`
    - **Property 3: Availability Indicator Classification** — correct classification for all integers 0–100 and null
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 3.4, 4.1, 4.3**

- [ ] 4. Checkpoint — data layer and scoring engine
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. API routes and services
  - [ ] 5.1 Create squad request service
    - Create `server/src/services/squadRequest.service.ts`
    - Implement create, getById, updateRoles, saveSquad, finalise operations
    - Use Prisma client for all DB operations
    - Enforce business unit restriction ("Digital Platforms")
    - _Requirements: 1.1, 1.2, 1.7, 2.1, 7.1, 8.3_

  - [ ] 5.2 Create scoring service
    - Create `server/src/services/scoring.service.ts`
    - Query candidates from DB filtered by business unit
    - Map DB records to CandidateContext objects
    - Invoke scoring engine per requested role
    - Detect gaps (roles with zero matching candidates)
    - _Requirements: 5.1, 5.9, 6.1_

  - [ ] 5.3 Implement API route handlers
    - Extend `server/src/routes/api.ts` or create `server/src/routes/squadRequests.ts`
    - `POST /api/squad-requests` — validate input, create request, return 201
    - `PATCH /api/squad-requests/:id/roles` — update roles and skills for request
    - `POST /api/squad-requests/:id/recommend` — trigger scoring, return shortlists
    - `PATCH /api/squad-requests/:id/squad` — save proposed squad selections (max 20)
    - `POST /api/squad-requests/:id/finalise` — validate all mandatory roles filled, close request
    - `GET /api/roles` — return all roles with predefined skills
    - `GET /api/candidates` — return all candidates in talent pool
    - _Requirements: 1.1, 1.3, 1.7, 3.1, 5.1, 7.1, 7.3, 8.3_

  - [ ] 5.4 Implement missing roles detection utility
    - Create `server/src/utils/missingRoles.ts`
    - Given a squad request's roles and current selections, return the set of unfilled mandatory roles
    - _Requirements: 7.3, 8.1_

  - [ ]* 5.5 Write property test for missing roles (Property 15)
    - Create `server/tests/properties/squad-assembly.property.test.ts`
    - **Property 15: Missing Roles Identification** — exactly identifies unfilled roles, no false positives/negatives
    - **Validates: Requirements 7.3**

  - [ ]* 5.6 Write unit tests for API route handlers
    - Create `server/tests/routes/squadRequests.test.ts`
    - Test validation error responses (400), not found (404), state conflicts (409)
    - Test successful create/update/recommend/finalise flows
    - Mock Prisma client
    - _Requirements: 1.3, 1.4, 10.2_

- [ ] 6. Checkpoint — API layer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Frontend — wizard container and shared UI components
  - [ ] 7.1 Create wizard container and step navigation
    - Create `client/src/components/SquadWizard.tsx`
    - Manage wizard state: current step (1–5), squad request data, selections
    - Implement forward/back navigation with step validation
    - Restrict to 5 screens maximum
    - _Requirements: 8.5_

  - [ ] 7.2 Create shared UI components
    - Create `client/src/components/ui/CandidateCard.tsx` — displays candidate name, role, skills, score, availability, workload
    - Create `client/src/components/ui/ScoreBadge.tsx` — numeric match score with colour coding
    - Create `client/src/components/ui/AvailabilityBadge.tsx` — availability indicator with colour (green/amber/red)
    - Create `client/src/components/ui/GapIndicator.tsx` — warning for unfilled roles/skills
    - Use Tailwind CSS for all styling
    - _Requirements: 6.2, 5.9_

  - [ ] 7.3 Create API client utility
    - Create `client/src/api/squadRequests.ts`
    - Typed fetch wrappers for all 7 API endpoints
    - Error handling: parse error responses, preserve form state on failure
    - _Requirements: 10.2_

- [ ] 8. Frontend — wizard steps
  - [ ] 8.1 Implement Step 1: Create Request form
    - Create `client/src/components/steps/CreateRequestStep.tsx`
    - Form fields: title (max 100), business unit (fixed "Digital Platforms"), objective (max 500), urgency dropdown, start date picker, duration weeks (1–52), required capacity (10–100 step 10)
    - Client-side validation with inline error messages (Tailwind `text-red-500`)
    - Prevent submission if validation fails, preserve entered data
    - Call `POST /api/squad-requests` on submit
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 2.3, 10.2_

  - [ ] 8.2 Implement Step 2: Define Roles & Skills
    - Create `client/src/components/steps/DefineRolesStep.tsx`
    - Fetch roles from `GET /api/roles`
    - Allow selecting one or more roles from the 6 predefined options
    - Display predefined skills per selected role
    - Allow marking skills as mandatory or preferred
    - Allow adding custom skills (category "other", description 1–200 chars)
    - Validate at least one skill per role before proceeding
    - Call `PATCH /api/squad-requests/:id/roles` on submit
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 8.3 Implement Step 3: Recommendations display
    - Create `client/src/components/steps/RecommendationsStep.tsx`
    - Call `POST /api/squad-requests/:id/recommend` on mount
    - Display ranked shortlist (up to 10 per role) using CandidateCard
    - Show match score, matched skills, availability badge, workload indicator
    - Show explanation text for each candidate
    - Show GapIndicator for roles with no matches
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 5.9_

  - [ ] 8.4 Implement Step 4: Assemble Squad
    - Create `client/src/components/steps/AssembleSquadStep.tsx`
    - Allow selecting candidates per role (max 20 total)
    - Show warning when selecting partially_available or high workload candidates
    - Allow confirming or dismissing warnings
    - Display missing roles when not all mandatory roles filled
    - Prevent advancing until all mandatory roles have at least one candidate
    - Call `PATCH /api/squad-requests/:id/squad` to save selections
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 8.5 Implement Step 5: Review & Finalise
    - Create `client/src/components/steps/ReviewFinaliseStep.tsx`
    - Display full summary: request details, selected candidates with scores, coverage gaps, explanations
    - Allow navigating back to modify selections
    - Confirm button calls `POST /api/squad-requests/:id/finalise`
    - Reset button clears all selections and returns to step 3
    - Display confirmation message on success
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 8.6 Wire wizard into App component
    - Update `client/src/App.tsx` to render SquadWizard as the main content
    - _Requirements: 8.5_

- [ ] 9. Checkpoint — full-stack integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. End-to-end tests
  - [ ]* 10.1 Write Playwright E2E test for happy path wizard flow
    - Create `client/e2e/squad-wizard.spec.ts`
    - Test complete flow: create request → define roles → view recommendations → assemble squad → finalise
    - Verify confirmation message displayed at end
    - _Requirements: 8.5, 1.7, 8.3_

  - [ ]* 10.2 Write Playwright E2E test for validation and error handling
    - Extend `client/e2e/squad-wizard.spec.ts`
    - Test inline validation errors display correctly
    - Test form data preserved on validation failure
    - Test gap indicator display when no candidates match a role
    - Test warning display for partially_available candidate selection
    - _Requirements: 1.3, 1.4, 10.2, 5.9, 7.2_

- [ ] 11. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The scoring engine is tested in isolation (no DB dependency) using factory fixtures
- E2E tests run against a seeded test database
- All implementation uses TypeScript ESM with the existing monorepo tooling

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "2.5", "3.4"] },
    { "id": 4, "tasks": ["2.6", "2.7"] },
    { "id": 5, "tasks": ["2.8", "2.9", "5.1", "5.2", "5.4"] },
    { "id": 6, "tasks": ["5.3", "5.5"] },
    { "id": 7, "tasks": ["5.6", "7.1", "7.2", "7.3"] },
    { "id": 8, "tasks": ["8.1", "8.2"] },
    { "id": 9, "tasks": ["8.3", "8.4"] },
    { "id": 10, "tasks": ["8.5", "8.6"] },
    { "id": 11, "tasks": ["10.1", "10.2"] }
  ]
}
```
