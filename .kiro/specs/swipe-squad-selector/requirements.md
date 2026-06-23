# Requirements Document

## Introduction

The Swipe Squad Selector provides a Tinder-style card-swiping interface for browsing and selecting team members by role. It offers a casual, gesture-driven alternative to the existing 5-step wizard, allowing a Delivery Lead to browse individual candidates one at a time filtered by role, and accumulate selections into a squad cart through swipe gestures. The feature operates independently of the squad request lifecycle, uses existing API endpoints, and persists cart state across role changes for cross-functional squad assembly.

**Tech Stack:** React 18 + Vite + Tailwind CSS (frontend), Express 4 + Prisma 5 + SQLite (backend), TypeScript throughout.

## Glossary

- **Swipe_Squad_Selector**: The top-level container component orchestrating the card-swiping squad assembly flow
- **Delivery_Lead**: Primary user who assembles delivery squads by swiping through candidates
- **Swipe_Card_Stack**: The component managing the deck of candidate cards and swipe gesture detection
- **Swipe_Card**: An individual candidate card displayed in the swipe stack showing candidate details
- **Squad_Cart**: A floating cart indicator tracking selected candidates with add/remove capabilities
- **Cart_Review**: A full-screen review panel showing all selected squad members before finalisation
- **Role_Picker**: A horizontal role selector allowing filtering of candidates by role
- **Swipe_Gesture**: A pointer-based drag interaction (touch or mouse) that triggers skip, next, or add actions
- **Candidate**: A mock internal employee with skills, proficiency, experience, and availability data
- **Availability**: Derived from capacityFree — available (≥75%), partially_available (25–74%), unavailable (<25%)
- **Cart_Item**: A record in the squad cart linking a candidate to the role they were browsed under

## Requirements

### Requirement 1: Access Swipe Flow

**User Story:** As a Delivery Lead, I want to access the swipe flow from the home page, so that I can casually browse candidates without starting a formal squad request.

#### Acceptance Criteria

1. WHEN the Delivery_Lead clicks the "Swipe to Build" button on the home page, THE Swipe_Squad_Selector SHALL render as a full-screen overlay within 1 second
2. WHEN the Swipe_Squad_Selector renders, THE Swipe_Squad_Selector SHALL fetch roles from GET /api/roles and candidates from GET /api/candidates and display a loading indicator until both responses are received
3. IF either GET /api/roles or GET /api/candidates returns an error or fails to respond within 5 seconds, THEN THE Swipe_Squad_Selector SHALL display an error message indicating the data could not be loaded and offer a retry action
4. WHEN the Delivery_Lead clicks the close button or completes the flow, THE Swipe_Squad_Selector SHALL close the overlay and return to the home page

### Requirement 2: Role Selection

**User Story:** As a Delivery Lead, I want to select a role to browse candidates for, so that I can focus on filling specific positions in my squad.

#### Acceptance Criteria

1. WHEN roles are fetched successfully from the server, THE Role_Picker SHALL display all available roles as selectable chips within 1 second of the response arriving
2. WHEN the Delivery_Lead selects a role chip, THE Role_Picker SHALL visually distinguish the selected chip from unselected chips and THE Swipe_Card_Stack SHALL display only candidates whose currentRole matches the selected role
3. THE Role_Picker SHALL display a numeric badge on each role chip indicating the count of candidates already added to the Squad_Cart for that role
4. WHILE no role is selected, THE Swipe_Card_Stack SHALL display a text prompt instructing the Delivery_Lead to select a role before candidates can be browsed
5. IF the roles fetch fails or returns an empty list, THEN THE Role_Picker SHALL display an error message indicating roles could not be loaded and no role chips SHALL be rendered

### Requirement 3: Candidate Filtering

**User Story:** As a Delivery Lead, I want only relevant available candidates shown in the swipe deck, so that I do not waste time on unavailable people.

#### Acceptance Criteria

1. THE Swipe_Card_Stack SHALL exclude all candidates where availability equals "unavailable" (capacityFree < 25%)
2. THE Swipe_Card_Stack SHALL display only candidates whose currentRole matches the selected role
3. THE Swipe_Card_Stack SHALL exclude candidates whose id is already present in the Squad_Cart
4. THE Swipe_Card_Stack SHALL sort candidates with "available" (capacityFree ≥ 75%) candidates before "partially_available" (capacityFree 25–74%) candidates, then by yearsExperience descending within each availability group
5. IF no candidates remain after applying exclusion and role-matching filters, THEN THE Swipe_Card_Stack SHALL display an empty state message indicating no matching candidates are available for the selected role

### Requirement 4: Card Swiping Interaction

**User Story:** As a Delivery Lead, I want to swipe cards in different directions to take different actions, so that I can quickly browse and select candidates.

#### Acceptance Criteria

1. WHEN the Delivery_Lead swipes a card left (or presses ArrowLeft), THE Swipe_Card_Stack SHALL skip the current candidate and advance to the next card
2. WHEN the Delivery_Lead swipes a card right (or presses ArrowRight), THE Swipe_Card_Stack SHALL advance to the next card
3. WHEN the Delivery_Lead swipes a card down (or presses ArrowDown or Enter), THE Swipe_Card_Stack SHALL add the current candidate to the Squad_Cart and advance to the next card
4. WHEN a swipe gesture distance is below the configured threshold (default 100 pixels), THE Swipe_Card SHALL animate back to its original position without triggering any action
5. WHEN the Delivery_Lead completes a swipe gesture, THE Swipe_Gesture SHALL determine direction by dominant axis — if vertical displacement exceeds horizontal and is downward, direction is "down"; otherwise horizontal displacement determines "left" or "right"
6. WHEN all candidates in the filtered deck are exhausted, THE Swipe_Card_Stack SHALL display an empty state message indicating no more candidates remain for the selected role
7. WHEN a swipe gesture velocity exceeds 0.5 px/ms in any direction, THE Swipe_Gesture SHALL trigger the corresponding action regardless of whether the distance threshold was met

### Requirement 5: Squad Cart Management

**User Story:** As a Delivery Lead, I want to accumulate candidate selections into a cart with clear limits, so that I can build a squad across multiple roles without duplicates.

#### Acceptance Criteria

1. THE Squad_Cart SHALL enforce a maximum capacity of 20 Cart_Items
2. IF the Delivery_Lead attempts to add a candidate whose id already exists in the Squad_Cart, THEN THE Squad_Cart SHALL reject the addition and maintain the current state
3. WHEN the Squad_Cart reaches 20 items, THE Swipe_Card_Stack SHALL prevent further additions via swipe-down and display a toast notification indicating the cart is full, visible for at least 3 seconds
4. WHEN the Delivery_Lead removes a candidate from the Squad_Cart, THE Squad_Cart SHALL decrement the item count by one and preserve the relative order of all remaining items
5. WHEN a candidate is added to the Squad_Cart, THE Cart_Item SHALL record the candidateId, candidateName, role browsed under, timestamp, and full candidate data including skills, availability, years of experience, and current team
6. WHEN the Delivery_Lead changes the selected role in the Role_Picker, THE Squad_Cart SHALL retain all existing Cart_Items unchanged
7. WHEN the Delivery_Lead removes a candidate from a full Squad_Cart (20 items), THE Swipe_Card_Stack SHALL re-enable additions via swipe-down

### Requirement 6: Cart Review and Finalisation

**User Story:** As a Delivery Lead, I want to review all my selected squad members grouped by role before finalising, so that I can verify coverage and make adjustments.

#### Acceptance Criteria

1. WHEN the Delivery_Lead clicks "Review Squad", THE Cart_Review SHALL display all Cart_Items grouped by role, with roles ordered alphabetically and candidates within each group ordered by the sequence in which they were added
2. THE Cart_Review SHALL display a Gap_Indicator for any role defined in the system that has zero Cart_Items selected
3. WHEN the Delivery_Lead removes a member from the Cart_Review, THE Squad_Cart SHALL remove that Cart_Item immediately, and IF the removal causes a role to have zero remaining Cart_Items, THEN THE Cart_Review SHALL display a Gap_Indicator for that role
4. WHEN the Delivery_Lead clicks "Done", THE Swipe_Squad_Selector SHALL close and return to the home page
5. WHEN the Delivery_Lead clicks "Back to Swiping", THE Cart_Review SHALL close and return to the swipe flow, retaining all current Cart_Items so the Delivery_Lead can continue adding or removing candidates
6. IF the Cart_Review contains zero Cart_Items across all roles, THEN THE Cart_Review SHALL disable the "Done" button and display a message indicating at least one candidate must be selected to finalise

### Requirement 7: Candidate Card Display

**User Story:** As a Delivery Lead, I want to see key candidate information on each card, so that I can make informed swiping decisions.

#### Acceptance Criteria

1. THE Swipe_Card SHALL display candidate name, current role, up to 5 skills ordered by proficiency level descending (displaying fewer if the candidate has fewer than 5 skills), each skill's proficiency level (1–3), availability status, years of experience, and current team
2. WHILE the Delivery_Lead is dragging a card, THE Swipe_Card SHALL display a directional hint overlay indicating the mapped action for the current drag direction: left for skip, right for next, down for add to cart
3. THE Swipe_Card SHALL render only the top 2 cards in the DOM at any time, loading the next card into the DOM only when the current top card is dismissed

### Requirement 8: Keyboard Accessibility

**User Story:** As a Delivery Lead, I want to navigate the swipe flow using keyboard controls, so that I can use the feature without a mouse or touch screen.

#### Acceptance Criteria

1. WHEN the Swipe_Card_Stack has focus and the Delivery_Lead presses ArrowLeft, THE Swipe_Card_Stack SHALL skip the current candidate and advance to the next card; WHEN ArrowRight is pressed, THE Swipe_Card_Stack SHALL advance to the next card; WHEN ArrowDown or Enter is pressed, THE Swipe_Card_Stack SHALL add the current candidate to the Squad_Cart and advance to the next card
2. THE Swipe_Card_Stack SHALL have a tabIndex of 0, role="application", and an aria-label that describes the available keyboard controls
3. THE Swipe_Card_Stack SHALL be reachable via Tab key in the normal document tab order and SHALL display a visible focus indicator when focused
4. WHEN a keyboard action (ArrowLeft, ArrowRight, ArrowDown, or Enter) is performed on the Swipe_Card_Stack, THE Swipe_Card_Stack SHALL retain keyboard focus after the action completes

### Requirement 9: Availability Derivation

**User Story:** As a Delivery Lead, I want candidate availability consistently derived from capacity data, so that filtering and display are accurate.

#### Acceptance Criteria

1. WHEN a candidate's capacityFree integer percentage (0–100) is greater than or equal to 75, THE Swipe_Squad_Selector SHALL derive availability as "available"
2. WHEN capacityFree is between 25 and 74 inclusive, THE Swipe_Squad_Selector SHALL derive availability as "partially_available"
3. WHEN capacityFree is less than 25, THE Swipe_Squad_Selector SHALL derive availability as "unavailable"
4. IF capacityFree is null or undefined, THEN THE Swipe_Squad_Selector SHALL derive availability as "unavailable"

### Requirement 10: Error Handling

**User Story:** As a Delivery Lead, I want graceful handling of failures, so that I can recover from errors without losing my progress.

#### Acceptance Criteria

1. IF GET /api/roles or GET /api/candidates returns a non-2xx status or a network error, THEN THE Swipe_Squad_Selector SHALL display an error banner with a "Retry" button and disable the Role_Picker and Swipe_Card_Stack until data is successfully loaded
2. IF the Delivery_Lead swipes down when the Squad_Cart contains 20 items, THEN THE Swipe_Squad_Selector SHALL show a toast notification stating "Cart full — maximum 20 members" and ignore the add action while still allowing left and right swipes
3. IF a vertical drag displacement is within a 15-pixel dead zone from the starting point, THEN THE Swipe_Gesture SHALL treat the motion as a page scroll rather than a swipe gesture
4. WHEN the Delivery_Lead clicks the retry button after an API error, THE Swipe_Squad_Selector SHALL re-fetch both GET /api/roles and GET /api/candidates and remove the error banner upon successful responses
