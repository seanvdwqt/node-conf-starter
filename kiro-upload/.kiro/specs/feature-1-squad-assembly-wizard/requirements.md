# Requirements: Squad Assembly Wizard

## Introduction

The core wizard workflow allowing a Delivery Lead to create a squad request, define roles and skills with proficiency levels, generate scored recommendations, assemble a proposed squad, and finalise.

## Requirements

### Requirement 1: Create Squad Request

**User Story:** As a Delivery_Lead, I want to create a delivery squad request, so that I can define work requirements quickly.

#### Acceptance Criteria
1. The system SHALL allow creation of a squad request with: title (max 100), business unit, objective (max 500), urgency (low/medium/high), start date (≥today), duration (1–52 weeks), capacity (10–100 step 10)
2. WHEN submitted, SHALL validate all mandatory fields
3. IF fields missing/invalid, THEN block submission and show specific errors
4. IF duration invalid or start date in past, THEN reject with message
5. SHALL restrict to "Digital Platforms" business unit

### Requirement 2: Define Roles & Skills

**User Story:** As a Delivery_Lead, I want to define required roles, skills, and proficiency levels, so that candidates can be matched accurately.

#### Acceptance Criteria
1. SHALL allow selecting from 6 predefined roles
2. WHEN a role is selected, SHALL display its predefined skills
3. SHALL allow marking each skill mandatory or preferred
4. SHALL allow setting required proficiency (1–3) per skill
5. SHALL allow adding custom skills (1–200 char description)
6. Each role must have ≥1 skill before proceeding

### Requirement 3: Generate Recommendations

**User Story:** As a Delivery_Lead, I want ranked candidate recommendations with explanations.

#### Acceptance Criteria
1. SHALL evaluate candidates using skill match, proficiency, experience, availability, workload, urgency
2. SHALL calculate Match_Score 0–100 (mandatory weighted higher, proficiency alignment)
3. SHALL exclude candidates with 0 mandatory skills matched or unavailable
4. SHALL reduce ranking for partial availability and high workload
5. High urgency: available candidates rank above partial regardless of score
6. Equal scores: tiebreak by greater availability
7. SHALL display gap indicator for roles with no matches
8. SHALL show ranked shortlist (max 10 per role) with explanation

### Requirement 4: Assemble Squad

**User Story:** As a Delivery_Lead, I want to select candidates to form a squad.

#### Acceptance Criteria
1. SHALL allow selecting candidates per role (max 20 total)
2. SHALL display warning for partially_available or high-workload selections
3. SHALL display missing roles and prevent finalisation until all filled

### Requirement 5: Review & Finalise

**User Story:** As a Delivery_Lead, I want to review and confirm the squad.

#### Acceptance Criteria
1. SHALL display full summary: request details, candidates, scores, explanations, gaps
2. SHALL allow back navigation to modify selections
3. SHALL allow finalise (closes request) or reset (clears selections)
4. Full workflow in ≤5 steps
