# Requirements Document

## Introduction

Rapid Squad Assembly is a prototype system for rapidly assembling cross-functional delivery squads. A Delivery Lead uses the system to define delivery work requirements, specify required roles and skills, and receive rules-based candidate recommendations from a mock internal talent pool. The system calculates match scores based on skill alignment, availability, and workload, then presents a ranked shortlist with explainable reasoning. The Delivery Lead assembles a proposed squad from the recommendations, reviews coverage, and finalises the request.

This is a conference hackathon prototype using mock data only — no real persistence beyond the session, no integration with live HR or resource management systems.

**Tech Stack:** React 18 + Vite + Tailwind CSS (frontend), Express 4 + Prisma 5 + SQLite (backend), Vitest + Playwright (testing), TypeScript throughout. Monorepo with npm workspaces (server/ and client/).

## Glossary

- **Squad_Assembly_System**: The full-stack prototype application for assembling delivery squads
- **Delivery_Lead**: The primary user role; a person responsible for forming delivery squads
- **Squad_Request**: A structured request capturing delivery objectives, required roles, skills, urgency, and timeline
- **Candidate**: A mock internal employee who may be recommended for a squad role
- **Match_Score**: A numeric score (0–100) representing how well a Candidate fits a requested role based on skill match, availability, and workload
- **Talent_Pool**: The mock dataset of internal employees with skills, roles, and availability data
- **Scoring_Engine**: The backend module that evaluates candidates against squad request criteria using configurable rules
- **Shortlist**: The ranked list of recommended candidates for a specific role within a Squad_Request
- **Proposed_Squad**: The set of candidates selected by the Delivery_Lead to fill all required roles
- **Availability_Indicator**: A capacity representation for a Candidate: available (≥75% free), partially_available (25–74% free), or unavailable (<25% free)
- **Workload_Threshold**: A configurable limit above which a Candidate is flagged as high workload
- **Gap_Indicator**: A visual flag showing that a required role or skill has no suitable matching candidates

## Requirements

### Requirement 1: Create Squad Request

**User Story:** As a Delivery_Lead, I want to create a delivery squad request using mock data, so that I can define work requirements quickly.

#### Acceptance Criteria

1. THE Squad_Assembly_System SHALL allow the Delivery_Lead to create a new Squad_Request using mock delivery, skill, employee, and availability data
2. THE Squad_Assembly_System SHALL capture the following fields for each Squad_Request: work request title (maximum 100 characters), business unit, delivery objective (maximum 500 characters), at least one required role, required skills, urgency level (low, medium, or high), expected start date, expected duration (integer value in weeks, between 1 and 52 inclusive), and required capacity (percentage of full-time allocation, between 10 and 100 in increments of 10)
3. WHEN the Delivery_Lead submits a Squad_Request, THE Squad_Assembly_System SHALL validate that all mandatory fields are non-empty and conform to their field-specific format and range constraints
4. IF any mandatory Squad_Request field is missing or empty, THEN THE Squad_Assembly_System SHALL prevent submission and display the specific field or fields requiring completion
5. IF the expected duration is zero, negative, not a whole number, or exceeds 52 weeks, THEN THE Squad_Assembly_System SHALL reject the value and prompt the Delivery_Lead to enter a valid duration between 1 and 52 weeks
6. IF the expected start date is earlier than the current date, THEN THE Squad_Assembly_System SHALL display a validation message and prevent request creation entirely
7. WHEN the Squad_Assembly_System successfully validates and creates a Squad_Request, THE Squad_Assembly_System SHALL display a confirmation indicating the request was created and is ready for candidate matching

### Requirement 2: Restrict to Single Business Unit

**User Story:** As a Delivery_Lead, I want the system to operate within a single business unit talent pool, so that recommendations are scoped appropriately for this prototype.

#### Acceptance Criteria

1. THE Squad_Assembly_System SHALL restrict all Squad_Requests and candidate recommendations to a single pre-configured business unit Talent_Pool containing at least 20 mock Candidates, enforcing this restriction as a system invariant at all times
2. WHEN the Scoring_Engine evaluates Candidates for a Squad_Request, THE Squad_Assembly_System SHALL only return Candidates who belong to the same business unit as the Squad_Request
3. IF a Delivery_Lead attempts to create a Squad_Request for a business unit other than the pre-configured unit, THEN THE Squad_Assembly_System SHALL prevent submission and display a message indicating that only the configured business unit is supported in this prototype

### Requirement 3: Define Roles and Skills

**User Story:** As a Delivery_Lead, I want to define required roles and skills for a Squad_Request, so that candidates can be matched accurately.

#### Acceptance Criteria

1. THE Squad_Assembly_System SHALL allow the Delivery_Lead to specify one or more required roles from the following: architect, engineer, tester, data specialist, business analyst, and delivery lead
2. WHEN the Delivery_Lead selects a required role, THE Squad_Assembly_System SHALL display the predefined mock skills associated with that role
3. THE Squad_Assembly_System SHALL allow the Delivery_Lead to mark each required skill as mandatory or preferred
4. IF a required skill is not available in the predefined mock skill list, THEN THE Squad_Assembly_System SHALL allow the Delivery_Lead to add a custom skill classified as other with a system-enforced description of 1 to 200 characters, and mark the custom skill as mandatory or preferred
5. IF the Delivery_Lead attempts to save a role without selecting at least one skill, THEN THE Squad_Assembly_System SHALL display a validation message indicating that each role requires at least one associated skill

### Requirement 4: Represent Candidate Availability

**User Story:** As a Delivery_Lead, I want to see candidate availability clearly, so that I can factor capacity into squad decisions.

#### Acceptance Criteria

1. THE Squad_Assembly_System SHALL represent candidate availability using Availability_Indicators: available (75% or more capacity free), partially_available (between 25% and 74% capacity free), or unavailable (less than 25% capacity free)
2. THE Squad_Assembly_System SHALL display the Availability_Indicator for each Candidate in the Talent_Pool relative to the Squad_Request expected start date and expected duration
3. IF a Candidate does not have availability data in the mock dataset, THEN THE Squad_Assembly_System SHALL treat the Candidate as unavailable; a Candidate with 0% capacity free is treated as having valid data and standard availability rules apply

### Requirement 5: Generate Candidate Recommendations

**User Story:** As a Delivery_Lead, I want to receive ranked candidate recommendations, so that I can identify the best-fit resources for each role.

#### Acceptance Criteria

1. WHEN the Delivery_Lead requests squad recommendations, THE Scoring_Engine SHALL evaluate mock internal candidates using skill match, role alignment, availability, workload, and urgency
2. THE Scoring_Engine SHALL calculate a Match_Score between 0 and 100 for each Candidate, where mandatory skills matched are weighted higher than preferred skills matched, using the scoring weights defined in configuration
3. IF a Candidate does not match any mandatory skill for a requested role, THEN THE Scoring_Engine SHALL exclude the Candidate from the Shortlist for that role; any Candidate who matches at least one mandatory skill SHALL have a Match_Score above 0
4. IF a Candidate is marked as unavailable during the requested delivery period, THEN THE Scoring_Engine SHALL exclude the Candidate from the Shortlist
5. IF a Candidate is marked as partially_available, THEN THE Scoring_Engine SHALL reduce the Candidate ranking according to the configured availability weighting
6. IF a Candidate workload exceeds the configured Workload_Threshold, THEN THE Scoring_Engine SHALL reduce the Candidate ranking and mark the Candidate as high workload
7. WHERE urgency is marked as high, THE Scoring_Engine SHALL prioritise Candidates with an available Availability_Indicator over Candidates with a higher Match_Score but a partially_available Availability_Indicator
8. WHILE multiple Candidates have the same Match_Score, THE Scoring_Engine SHALL rank the Candidate with greater availability higher in the Shortlist
9. IF fewer than one matching Candidate exists for a requested role after scoring, THEN THE Squad_Assembly_System SHALL display a Gap_Indicator for the unfilled role or skill

### Requirement 6: Display Recommendation Results

**User Story:** As a Delivery_Lead, I want to see ranked and explained recommendation results, so that I can make informed squad assembly decisions.

#### Acceptance Criteria

1. WHEN matching is completed, THE Squad_Assembly_System SHALL display a ranked Shortlist of up to 10 suitable internal Candidates per requested role, ordered by Match_Score descending
2. THE Squad_Assembly_System SHALL display each recommended Candidate's role, matched skills, Availability_Indicator, workload indicator (normal or high), and overall Match_Score as a numeric value between 0 and 100
3. THE Squad_Assembly_System SHALL display the rule or rules that caused each Candidate to be recommended, reduced in ranking, excluded, or flagged
4. THE Squad_Assembly_System SHALL display a recommendation explanation for each Candidate that states the skills matched, the availability status considered, and the scoring rules applied, using complete sentences without technical jargon or rule identifiers

### Requirement 7: Assemble Proposed Squad

**User Story:** As a Delivery_Lead, I want to select candidates from the shortlist, so that I can form a proposed delivery squad.

#### Acceptance Criteria

1. WHEN a ranked Shortlist is displayed, THE Squad_Assembly_System SHALL allow the Delivery_Lead to select one or more Candidates per required role to form a Proposed_Squad, up to a maximum of 20 Candidates total
2. IF the Delivery_Lead selects a Candidate who is partially_available or marked as high workload, THEN THE Squad_Assembly_System SHALL display a warning indicating the Candidate's current Availability_Indicator and workload status; the Delivery_Lead may confirm or dismiss the warning, and the Candidate SHALL be added to the Proposed_Squad regardless of whether the warning was acknowledged
3. WHILE the Proposed_Squad does not cover all mandatory roles defined in the Squad_Request, THE Squad_Assembly_System SHALL display the missing role or roles and SHALL prevent the Delivery_Lead from finalising the request
4. WHEN the Delivery_Lead deselects a Candidate from the Proposed_Squad, THE Squad_Assembly_System SHALL remove the Candidate and update the missing roles display if the removal causes a mandatory role to become unfilled

### Requirement 8: Review and Finalise Squad

**User Story:** As a Delivery_Lead, I want to review the complete squad assembly before finalising, so that I can confirm all selections and coverage.

#### Acceptance Criteria

1. WHEN all mandatory roles in a Squad_Request have at least one selected Candidate in the Proposed_Squad, THE Squad_Assembly_System SHALL present a review summary displaying the delivery request details, selected Candidates with their Match_Scores, any remaining coverage gaps, and the recommendation explanations for each selection
2. WHILE the review summary is displayed, THE Squad_Assembly_System SHALL allow the Delivery_Lead to navigate back to modify Candidate selections before finalising
3. WHEN the Delivery_Lead confirms the Proposed_Squad from the review summary, THE Squad_Assembly_System SHALL close the request and display a confirmation indicating the squad assembly is complete
4. WHEN the Delivery_Lead chooses to reset from the review summary, THE Squad_Assembly_System SHALL clear all Candidate selections from the Proposed_Squad and return the Delivery_Lead to the recommendation results for reselection
5. THE Squad_Assembly_System SHALL complete the full squad assembly workflow from Squad_Request creation to finalisation in five distinct screens or fewer

### Requirement 9: Scoring Engine Maintainability

**User Story:** As a developer, I want modular and configurable scoring logic, so that matching rules can be adjusted and extended easily.

#### Acceptance Criteria

1. THE Scoring_Engine SHALL implement each scoring factor (skill match, availability, workload, and urgency) as an independent rule that can be added, removed, or modified without requiring changes to other scoring rules
2. THE Scoring_Engine SHALL allow adjustment of scoring weights for skill match, availability, workload, and urgency through a configuration object, without requiring code changes to the scoring rules themselves
3. THE Scoring_Engine SHALL record a scoring breakdown for each Candidate evaluation, including the rule name, the weight applied, and the individual score contribution of each rule to the total Match_Score
4. IF a scoring rule fails during evaluation, THEN THE Scoring_Engine SHALL exclude the failed rule from the Match_Score calculation, log the failure, and continue processing the remaining rules

### Requirement 10: Performance and Reliability

**User Story:** As a Delivery_Lead, I want the system to respond quickly and handle errors gracefully, so that the squad assembly workflow is smooth and reliable.

#### Acceptance Criteria

1. WHEN the Delivery_Lead requests recommendations, THE Scoring_Engine SHALL return results within three seconds for a Talent_Pool of up to 100 mock Candidates
2. IF the Delivery_Lead submits invalid input at any stage, THEN THE Squad_Assembly_System SHALL preserve all previously entered data and remain on the current workflow step without crashing or navigating away; the system SHOULD display an error message indicating the invalid field but partial compliance is acceptable provided stability is maintained
3. THE Squad_Assembly_System SHALL operate within a mock dataset of no more than 100 Candidates, 10 roles, and 50 skills, using mock data only with no connections to external systems
4. THE Squad_Assembly_System SHALL not store or expose passwords, authentication tokens, or personally identifiable information beyond the mock candidate names, skills, and availability displayed in the user interface
