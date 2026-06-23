# Test Cases — Rapid Squad Assembly

## Overview

Acceptance criteria organised by feature area. Each test case maps to one or more functional requirements (REQ-XXX) from the requirements document.

---

## TC-1: Squad Request Creation

### TC-1.1: Successful creation with all valid fields
**Given** the Delivery_Lead fills in all required fields with valid data  
**When** they submit the form  
**Then** a squad request is created with status "draft" and a confirmation is displayed  
**Validates:** REQ-001, REQ-002

### TC-1.2: Missing mandatory field blocks submission
**Given** one or more mandatory fields are empty  
**When** the Delivery_Lead attempts to submit  
**Then** submission is blocked and the specific missing field(s) are highlighted  
**Validates:** REQ-003, REQ-004

### TC-1.3: Invalid duration rejected
**Given** duration is zero, negative, non-integer, or >52  
**When** submitted  
**Then** validation error is displayed with guidance for valid range (1–52)  
**Validates:** REQ-005

### TC-1.4: Past start date rejected
**Given** expected start date is before today  
**When** submitted  
**Then** a validation message prevents creation  
**Validates:** REQ-006

### TC-1.5: Business unit restriction enforced
**Given** the Delivery_Lead attempts a non-"Digital Platforms" business unit  
**When** submitted  
**Then** the system rejects with a message indicating only Digital Platforms is supported  
**Validates:** REQ-007

### TC-1.6: Title max length (100 chars) enforced
**Given** title exceeds 100 characters  
**When** submitted  
**Then** validation error shown for title field  
**Validates:** REQ-002

### TC-1.7: Objective max length (500 chars) enforced
**Given** objective exceeds 500 characters  
**When** submitted  
**Then** validation error shown for objective field  
**Validates:** REQ-002

---

## TC-2: Role & Skill Definition

### TC-2.1: Predefined roles displayed
**Given** the step loads  
**When** the Delivery_Lead views roles  
**Then** all 6 predefined roles are available: architect, engineer, tester, data specialist, business analyst, delivery lead  
**Validates:** REQ-008

### TC-2.2: Skills displayed per role
**Given** a role is selected  
**When** expanded  
**Then** predefined skills for that role are displayed  
**Validates:** REQ-009

### TC-2.3: Skills can be marked mandatory/preferred
**Given** a skill is displayed  
**When** the Delivery_Lead toggles its category  
**Then** it switches between mandatory and preferred  
**Validates:** REQ-010

### TC-2.4: Proficiency level selectable (1–3)
**Given** a skill is displayed  
**When** the Delivery_Lead clicks proficiency dots  
**Then** the required proficiency level is set (1/2/3)  
**Validates:** REQ-012

### TC-2.5: Custom skill with valid description accepted
**Given** a skill not in the predefined list is needed  
**When** the Delivery_Lead enters a description (1–200 chars) and clicks Add  
**Then** the custom skill is added to the role's skill list  
**Validates:** REQ-012

### TC-2.6: Custom skill with invalid description rejected
**Given** description is empty or >200 characters  
**When** the add button is clicked  
**Then** the button is disabled / no skill is added  
**Validates:** REQ-012

### TC-2.7: At least one skill required per role
**Given** a role is selected with no skills  
**When** the Delivery_Lead attempts to save  
**Then** a validation error is displayed for that role  
**Validates:** REQ-009

---

## TC-3: Candidate Recommendations

### TC-3.1: Candidates scored and ranked
**Given** roles and skills are defined  
**When** recommendations are requested  
**Then** a ranked shortlist appears per role (up to 10 candidates, ordered by Match_Score desc)  
**Validates:** REQ-013, REQ-014, REQ-022

### TC-3.2: Zero mandatory skills → exclusion
**Given** a candidate matches no mandatory skills for a role  
**When** scoring completes  
**Then** that candidate does not appear in the shortlist  
**Validates:** REQ-015

### TC-3.3: Unavailable candidate excluded
**Given** a candidate has <25% capacity free  
**When** scoring completes  
**Then** that candidate is excluded  
**Validates:** REQ-016

### TC-3.4: Partial availability reduces ranking
**Given** a candidate is partially_available (25–74%)  
**When** compared to an otherwise-identical available candidate  
**Then** the available candidate ranks higher  
**Validates:** REQ-017

### TC-3.5: High workload reduces ranking and flags
**Given** a candidate's workload exceeds 80%  
**When** scored  
**Then** their ranking is reduced and they are flagged as "high workload"  
**Validates:** REQ-018

### TC-3.6: High urgency prioritises availability
**Given** urgency is "high"  
**When** an available candidate has a lower score than a partially_available one  
**Then** the available candidate still ranks higher  
**Validates:** REQ-019

### TC-3.7: Tiebreak by availability
**Given** two candidates have identical Match_Scores  
**When** displayed in the shortlist  
**Then** the one with higher capacityFree ranks first  
**Validates:** REQ-020

### TC-3.8: Gap indicator displayed
**Given** a role has zero matching candidates after scoring  
**When** results are displayed  
**Then** a Gap_Indicator is shown for that role  
**Validates:** REQ-021

### TC-3.9: Explanation displayed per candidate
**Given** a candidate appears in the shortlist  
**When** their details are viewed  
**Then** a plain-language explanation states matched skills, availability, and rules applied  
**Validates:** REQ-024

### TC-3.10: Score breakdown available
**Given** a scored candidate  
**When** details are expanded  
**Then** breakdown shows each rule's name, weight, and contribution  
**Validates:** REQ-023

---

## TC-4: Squad Assembly

### TC-4.1: Candidate can be selected for a role
**Given** a shortlist is displayed  
**When** the Delivery_Lead selects a candidate  
**Then** the candidate is added to the proposed squad  
**Validates:** REQ-025

### TC-4.2: Warning for risk selection
**Given** a partially_available or high-workload candidate  
**When** selected  
**Then** a warning is displayed (can be dismissed)  
**Validates:** REQ-026

### TC-4.3: Missing roles prevent finalisation
**Given** not all mandatory roles have a candidate  
**When** the Delivery_Lead tries to finalise  
**Then** the system displays missing role(s) and blocks finalisation  
**Validates:** REQ-027

### TC-4.4: Maximum 20 selections enforced
**Given** 20 candidates are already selected  
**When** another selection is attempted  
**Then** the system prevents it (or validation error on save)  
**Validates:** REQ-025

---

## TC-5: Review & Finalise

### TC-5.1: Review summary displayed
**Given** all mandatory roles are filled  
**When** the review step loads  
**Then** full details are shown: request info, selected candidates, scores, explanations, gaps  
**Validates:** REQ-028

### TC-5.2: Back navigation available
**Given** the review step is displayed  
**When** the Delivery_Lead clicks "Back"  
**Then** they return to modify selections without losing data  
**Validates:** REQ-028

### TC-5.3: Finalise closes the request
**Given** the review is confirmed  
**When** "Finalise" is clicked  
**Then** the request status becomes "finalised" and a confirmation is shown  
**Validates:** REQ-028

### TC-5.4: Reset clears selections
**Given** the review step  
**When** "Reset" is clicked  
**Then** all selections are cleared and the user returns to recommendations  
**Validates:** REQ-028

---

## TC-6: Instant Squad Search

### TC-6.1: Search bar displayed with placeholder
**Given** the landing page loads  
**When** the search section is visible  
**Then** a search bar with example query placeholder is shown  
**Validates:** REQ (Instant Search)

### TC-6.2: Example queries shown on focus
**Given** the search bar is focused and empty  
**When** the user looks below the bar  
**Then** 3–5 clickable example query chips are shown  
**Validates:** REQ (Instant Search)

### TC-6.3: Debounced search triggers after 300ms
**Given** the user types "2 engineers with React"  
**When** they pause for 300ms  
**Then** the query is sent to the server and suggestions appear  
**Validates:** REQ (Instant Search)

### TC-6.4: Team suggestions displayed
**Given** a valid query  
**When** results return  
**Then** up to 5 team cards show members, scores, roles, skills, and explanation  
**Validates:** REQ (Instant Search)

### TC-6.5: No-match message
**Given** the query doesn't match any roles or skills  
**When** results return  
**Then** a helpful "no matches found" message is shown  
**Validates:** REQ (Instant Search)

### TC-6.6: Selecting a suggestion pre-populates wizard
**Given** team suggestions are displayed  
**When** the user selects one  
**Then** the wizard jumps to step 4 with those candidates pre-selected  
**Validates:** REQ (Instant Search)

---

## TC-7: Scoring Engine Maintainability

### TC-7.1: Rules are independent
**Given** the scoring engine  
**When** a single rule is removed or added  
**Then** other rules continue functioning without modification  
**Validates:** REQ (Maintainability)

### TC-7.2: Weights are configurable
**Given** scoring weights are changed in configuration  
**When** scoring runs  
**Then** results reflect the new weights without code changes  
**Validates:** REQ (Maintainability)

### TC-7.3: Failing rule is skipped gracefully
**Given** a rule throws an error during evaluation  
**When** scoring completes  
**Then** the failed rule is excluded from the score, other rules produce valid results  
**Validates:** REQ (Maintainability)

---

## TC-8: Performance & Reliability

### TC-8.1: Recommendations within 3 seconds
**Given** up to 100 candidates in the pool  
**When** recommendations are requested  
**Then** results return in ≤3 seconds  
**Validates:** NFR-001

### TC-8.2: Invalid input preserves state
**Given** invalid data is submitted at any step  
**When** the error is displayed  
**Then** all previously entered data is preserved and the user stays on the same step  
**Validates:** NFR-004

### TC-8.3: No crashes on incomplete submissions
**Given** partial form data  
**When** an error occurs  
**Then** the system displays an error without crashing or navigating away  
**Validates:** NFR-004
