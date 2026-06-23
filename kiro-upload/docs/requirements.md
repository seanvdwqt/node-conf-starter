# Requirements Document — Rapid Squad Assembly

## Introduction

Rapid Squad Assembly is a prototype system for rapidly assembling cross-functional delivery squads. A Delivery Lead uses the system to define delivery work requirements, specify required roles and skills with proficiency levels, and receive rules-based candidate recommendations from a mock internal talent pool. The system calculates match scores based on skill alignment, proficiency depth, years of experience, availability, and workload, then presents a ranked shortlist with explainable reasoning.

**Tech Stack:** React 18 + Vite + Tailwind CSS (frontend), Express 4 + Prisma 5 + SQLite (backend), Vitest + Playwright (testing), TypeScript throughout. Monorepo with npm workspaces.

---

## Glossary

| Term | Definition |
|------|-----------|
| Squad_Assembly_System | The full-stack prototype application |
| Delivery_Lead | Primary user — forms delivery squads |
| Squad_Request | Structured request capturing objectives, roles, skills, urgency, timeline |
| Candidate | Mock internal employee with skills, proficiency, experience, projects |
| Skill_Proficiency | 1–3 scale: 1 (foundational), 2 (proficient), 3 (expert) |
| Match_Score | Numeric 0–100 fit score based on weighted rules |
| Talent_Pool | Mock dataset of internal employees |
| Scoring_Engine | Backend module evaluating candidates via configurable rules |
| Shortlist | Ranked candidate list per role (max 10) |
| Proposed_Squad | Candidates selected by Delivery_Lead to fill roles |
| Availability_Indicator | available (≥75%), partially_available (25–74%), unavailable (<25%) |
| Gap_Indicator | Visual flag for roles with no matching candidates |

---

## Functional Requirements (EARS Format)

### REQ-001: Delivery Need Capture

The system SHALL allow a Delivery_Lead to create a new Squad_Request using mock delivery, skill, employee, and availability data.

### REQ-002: Request Attributes

The system SHALL capture: work request title (max 100 chars), business unit, delivery objective (max 500 chars), required roles, required skills, urgency (low/medium/high), expected start date, expected duration (1–52 weeks), and required capacity (10–100% in increments of 10).

### REQ-003: Field Validation

WHEN the Delivery_Lead submits a Squad_Request, the system SHALL validate all mandatory fields are non-empty and conform to format/range constraints.

### REQ-004: Missing Field Prevention

IF any mandatory field is missing or empty, THEN the system SHALL prevent submission and display the specific field(s) requiring completion.

### REQ-005: Duration Validation

IF expected duration is zero, negative, not a whole number, or exceeds 52 weeks, THEN the system SHALL reject the value and prompt for valid input.

### REQ-006: Start Date Validation

IF the expected start date is earlier than the current date, THEN the system SHALL display a validation message and prevent request creation.

### REQ-007: Business Unit Restriction

The system SHALL restrict all requests and recommendations to a single pre-configured business unit ("Digital Platforms") containing at least 20 mock Candidates.

### REQ-008: Role Selection

The system SHALL allow selection of predefined roles: architect, engineer, tester, data specialist, business analyst, delivery lead.

### REQ-009: Role-Skill Display

WHEN a role is selected, the system SHALL display relevant predefined skills associated with that role.

### REQ-010: Skill Priority

The system SHALL allow marking each skill as mandatory or preferred.

### REQ-011: Availability Indicators

The system SHALL represent availability using capacity indicators: available (≥75%), partially_available (25–74%), unavailable (<25%).

### REQ-012: Custom Skills

IF a skill is not in the predefined list, THEN the system SHALL allow adding it as "other" with a description (1–200 chars), priority, and proficiency level.

### REQ-013: Candidate Evaluation

WHEN recommendations are requested, the Scoring_Engine SHALL evaluate candidates using skill match, proficiency alignment, role alignment, availability, workload, and urgency.

### REQ-014: Match Score Calculation

The system SHALL calculate a Match_Score (0–100) where mandatory skills are weighted higher than preferred skills, and proficiency meeting/exceeding requirements scores higher.

### REQ-015: Mandatory Skill Gate

IF a candidate matches zero mandatory skills for a role, THEN exclude from that role's shortlist.

### REQ-016: Availability Gate

IF a candidate is unavailable, THEN exclude from the shortlist.

### REQ-017: Partial Availability Reduction

IF partially_available, THEN reduce ranking per configured availability weighting.

### REQ-018: Workload Threshold

IF workload exceeds configured threshold, THEN reduce ranking and flag as high workload.

### REQ-019: Urgency Override

WHERE urgency is high, the system SHALL prioritise available candidates over those with higher scores but partial availability.

### REQ-020: Tiebreak Rule

WHILE multiple candidates have equal Match_Scores, rank by greater availability.

### REQ-021: Gap Indicator

WHILE insufficient matching candidates exist, display a Gap_Indicator for the unfilled role.

### REQ-022: Ranked Shortlist

WHEN matching completes, display a ranked shortlist of up to 10 candidates per role, ordered by Match_Score descending.

### REQ-023: Candidate Display

Display each candidate's role, matched skills, Availability_Indicator, workload indicator, and Match_Score (0–100).

### REQ-024: Scoring Explanation

Display the rule(s) that caused each candidate to be recommended, reduced, excluded, or flagged — in plain language.

### REQ-025: Squad Selection

WHEN shortlist is displayed, allow selecting one or more candidates per role (max 20 total).

### REQ-026: Risk Warning

IF selecting a partially_available or high-workload candidate, THEN display a warning (may be dismissed).

### REQ-027: Role Coverage Gate

WHILE mandatory roles are not all filled, display missing roles and prevent finalisation.

### REQ-028: Review & Close

WHEN squad is complete, allow review of all details, explanations, and coverage before reset or close.

---

## Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-001 | Performance | Recommendations returned within ≤3 seconds for up to 100 candidates |
| NFR-002 | Usability | Full workflow in ≤5 steps |
| NFR-003 | Usability | Recommendations explained in plain language |
| NFR-004 | Reliability | Invalid inputs handled gracefully — no crashes |
| NFR-005 | Scalability | Operates within mock dataset (≤100 candidates, ≤10 roles, ≤50 skills) |
| NFR-006 | Security | Mock data only — no real PII, credentials, or external connections |
| NFR-007 | Maintainability | Modular scoring rules — add/remove/reweight without touching other code |
| NFR-008 | Transparency | Full traceability of scoring decisions |

---

## User Stories

### US-1: Create Delivery Squad Request
**As a** Delivery_Lead, **I want to** create a delivery request **so that** I can define work requirements quickly.

### US-2: Define Roles and Skills
**As a** Delivery_Lead, **I want to** define roles, skills, and proficiency levels **so that** candidates can be matched accurately.

### US-3: Generate Recommendations
**As a** Delivery_Lead, **I want to** get ranked candidates **so that** I can identify best-fit resources.

### US-4: View Recommendations
**As a** Delivery_Lead, **I want to** see ranked and explained results **so that** I can make informed decisions.

### US-5: Assemble Squad
**As a** Delivery_Lead, **I want to** select candidates **so that** I can form a squad.

### US-6: Review & Finalise
**As a** Delivery_Lead, **I want to** review and finalise **so that** I confirm the squad.

### US-7: Instant Squad Search
**As a** Delivery_Lead, **I want to** type a natural-language description **so that** I can rapidly find the best available squad without the full wizard.
