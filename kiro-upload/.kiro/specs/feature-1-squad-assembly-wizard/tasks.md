# Tasks: Squad Assembly Wizard

## Tasks

- [x] 1. Data layer — Prisma schema with squad assembly models (Candidate, Role, Skill, SquadRequest, etc.)
- [x] 2. Seed script — 6 roles, ~30 skills, 30–50 candidates with proficiency, experience, projects
- [x] 3. Prisma client singleton
- [x] 4. Scoring types, config, and rule interface definitions
- [x] 5. Implement scoring rules (skillMatch, proficiency, experience, availability, workload, urgency)
- [x] 6. Scoring engine orchestrator (filter → score → aggregate → tiebreak → urgency override)
- [x] 7. Explanation generator (human-readable, no jargon)
- [x] 8. Validation utilities (squad request fields, custom skill description)
- [x] 9. Availability classification utility
- [x] 10. Squad request service (create, getById, updateRoles, saveSquad, finalise)
- [x] 11. Scoring service (fetch candidates, map to context, invoke engine, detect gaps)
- [x] 12. API route handlers (POST/PATCH/GET endpoints)
- [x] 13. Wizard container with step navigation
- [x] 14. Shared UI components (CandidateCard, ScoreBadge, AvailabilityBadge, ProficiencyIndicator, GapIndicator, FilterBar)
- [x] 15. Typed API client (fetch wrappers for all endpoints)
- [x] 16. Step 1: Create Request form with validation
- [x] 17. Step 2: Define Roles & Skills with proficiency selector and custom skills
- [x] 18. Step 3: Recommendations display with filters and explanations
- [x] 19. Step 4: Assemble Squad with warnings and missing roles detection
- [x] 20. Step 5: Review & Finalise with summary and reset
- [x] 21. Wire wizard into App component
