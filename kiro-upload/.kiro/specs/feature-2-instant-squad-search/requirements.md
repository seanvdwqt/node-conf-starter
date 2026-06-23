# Requirements: Instant Squad Search

## Introduction

Natural-language search feature allowing a Delivery Lead to type a free-form description and receive instant pre-composed team suggestions without navigating the full wizard.

## Requirements

### Requirement 1: Search Interface

**User Story:** As a Delivery_Lead, I want to type what I need in natural language, so that I can rapidly find the best available squad.

#### Acceptance Criteria
1. SHALL display a prominent search bar with example query placeholder
2. SHALL show 3–5 clickable example queries when focused and empty
3. SHALL debounce input (300ms pause) before triggering search
4. SHALL display loading state while searching
5. IF no matches found, SHALL display helpful "no matches" message

### Requirement 2: Query Parsing

**User Story:** As a Delivery_Lead, I want my plain-text query understood without structured input.

#### Acceptance Criteria
1. SHALL tokenize input and extract: role keywords, skill keywords, quantity indicators, urgency signals
2. SHALL use case-insensitive keyword matching with synonym mapping (dev→engineer, QA→tester, BA→business analyst)
3. SHALL handle quantity patterns ("2 engineers", "an architect")
4. SHALL detect urgency signals (urgent/ASAP→high, next week/soon→medium, no rush→low)
5. All processing server-side — no AI, ML, or external NLP

### Requirement 3: Team Suggestions

**User Story:** As a Delivery_Lead, I want to see pre-composed squad options ranked by fit.

#### Acceptance Criteria
1. SHALL return up to 5 pre-composed squad suggestions ranked by combined team score
2. SHALL display each suggestion with: members, individual scores, roles, key skills with proficiency, one-line explanation
3. Combined team score = average of member match scores
4. Variety across suggestions by varying which candidates fill roles

### Requirement 4: Wizard Integration

**User Story:** As a Delivery_Lead, I want to select a suggestion and continue in the wizard.

#### Acceptance Criteria
1. WHEN a suggestion is selected, SHALL pre-populate wizard step 4 (Assemble Squad) with suggested candidates
2. SHALL allow the Delivery_Lead to modify selections from there
