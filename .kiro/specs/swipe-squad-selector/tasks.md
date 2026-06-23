# Implementation Plan: Swipe Squad Selector

## Overview

Implement a Tinder-style card-swiping interface for browsing and selecting team members by role. The feature is built as a React 18 + TypeScript client-side feature using Tailwind CSS, custom Pointer Events gesture handling, and existing API endpoints (GET /api/roles, GET /api/candidates). Implementation proceeds from data layer utilities through gesture handling to UI components, wiring everything together in App.tsx.

## Tasks

- [x] 1. Set up data models, types, and pure utility functions
  - [x] 1.1 Create TypeScript interfaces and types for the swipe feature
    - Create `client/src/swipe/types.ts` with interfaces: `SwipeCandidate`, `CandidateSkill`, `CandidateProject`, `CartItem`, `Role`, `RoleSkill`, `SwipeCallbacks`, `SwipeOptions`, `SwipeState`
    - Define the `Availability` type as `'available' | 'partially_available' | 'unavailable'`
    - Define the role colour mapping constant
    - _Requirements: 7.1, 9.1, 9.2, 9.3_

  - [x] 1.2 Implement pure utility functions
    - Create `client/src/swipe/utils.ts` with functions: `deriveAvailability`, `filterCandidatesByRole`, `addToCart`, `removeFromCart`
    - `deriveAvailability(capacityFree)`: returns availability tier based on thresholds (≥75 → available, 25–74 → partially_available, <25 → unavailable); treat null/undefined as unavailable
    - `filterCandidatesByRole(candidates, roleId, excludeIds)`: filters by role, excludes unavailable and cart members, sorts by availability then experience
    - `addToCart(cart, candidate, role)`: adds candidate if cart < 20 and no duplicate; returns unchanged cart otherwise
    - `removeFromCart(cart, candidateId)`: removes matching item preserving order
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.4, 9.1, 9.2, 9.3, 9.4_

- [x] 2. Implement data layer hooks
  - [x] 2.1 Implement useRoles and useCandidates data-fetching hooks
    - Create `client/src/swipe/hooks/useRoles.ts` — fetches GET /api/roles, returns `{ roles, loading, error, refetch }`
    - Create `client/src/swipe/hooks/useCandidates.ts` — fetches GET /api/candidates, maps raw data to SwipeCandidate (deriving availability from capacityFree), returns `{ candidates, loading, error, refetch }`
    - Handle loading, error, and success states
    - _Requirements: 1.2, 1.3, 2.1, 2.5, 10.1, 10.4_

  - [x] 2.2 Implement useSquadCart hook
    - Create `client/src/swipe/hooks/useSquadCart.ts`
    - Expose: `cart`, `add(candidate, role)`, `remove(candidateId)`, `clear()`, `isFull`, `contains(id)`, `countByRole`
    - Use `addToCart` and `removeFromCart` utility functions internally
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement useSwipeGesture hook
  - [x] 4.1 Implement the useSwipeGesture custom hook
    - Create `client/src/swipe/hooks/useSwipeGesture.ts`
    - Use Pointer Events API (pointerdown, pointermove, pointerup) for cross-platform touch/mouse support
    - Track drag state: startX, startY, currentX, currentY, startTime
    - Calculate direction based on dominant axis: vertical downward motion → 'down', horizontal → 'left'/'right'
    - Support distance threshold (default 100px) and velocity threshold (default 0.5 px/ms)
    - Implement 15px dead zone for vertical scroll disambiguation
    - Return SwipeState with offset, direction, isDragging, rotation
    - Use requestAnimationFrame for smooth drag tracking
    - Reset to original position on sub-threshold gestures
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 10.3_
- [x] 5. Implement UI components
  - [x] 5.1 Implement RolePicker component
    - Create `client/src/swipe/components/RolePicker.tsx`
    - Render roles as tappable chips/pills with role colour coding
    - Highlight selected role chip visually
    - Display badge count of cart members per role
    - Show prompt to select a role when none selected
    - Handle empty/error state for roles
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 Implement SwipeCard component
    - Create `client/src/swipe/components/SwipeCard.tsx`
    - Display candidate name, role, top 5 skills with proficiency, availability, years experience, current team
    - Show directional hint overlays during drag (skip/next/add icons)
    - Apply transform styles for drag animation (translateX, translateY, rotate)
    - _Requirements: 7.1, 7.2_

  - [x] 5.3 Implement SwipeCardStack component
    - Create `client/src/swipe/components/SwipeCardStack.tsx`
    - Render only top 2 cards in DOM (current + peek behind)
    - Integrate useSwipeGesture hook for gesture detection
    - Handle keyboard events: ArrowLeft (skip), ArrowRight (next), ArrowDown/Enter (add to cart)
    - Set tabIndex=0, role="application", aria-label for keyboard controls, aria-roledescription="swipe deck"
    - Show empty state when deck is exhausted
    - Animate card exit in swipe direction
    - Retain keyboard focus after actions
    - _Requirements: 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.3, 8.1, 8.2, 8.3, 8.4_

  - [x] 5.4 Implement SquadCart component
    - Create `client/src/swipe/components/SquadCart.tsx`
    - Show floating badge with cart count
    - Expand to show list of selected members
    - Allow removing individual members
    - Provide "Review Squad" action button
    - Show toast notification when cart is full and user tries to add
    - _Requirements: 5.1, 5.3, 5.4, 5.7, 10.2_

  - [x] 5.5 Implement CartReview component
    - Create `client/src/swipe/components/CartReview.tsx`
    - Group selected members by role, roles ordered alphabetically
    - Candidates within each group ordered by addedAt timestamp
    - Show gap indicators for roles with zero selections
    - Allow removing members from review screen (updates gap indicators)
    - Provide "Done" and "Back to Swiping" buttons
    - Disable "Done" button when cart is empty
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_


- [~] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement container component and integrate into App
  - [~] 7.1 Implement SwipeSquadSelector container component
    - Create `client/src/swipe/components/SwipeSquadSelector.tsx`
    - Orchestrate useRoles, useCandidates, and useSquadCart hooks
    - Manage selectedRole state and filter candidates via filterCandidatesByRole
    - Coordinate transitions between role selection, swiping, and cart review
    - Handle loading state with loading indicator
    - Handle error state with error banner and retry button
    - Show toast when cart full and user swipes down
    - Render as full-screen overlay
    - Wire onClose prop to close and return to home page
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.6, 10.1, 10.2, 10.4_

  - [~] 7.2 Integrate SwipeSquadSelector into App.tsx
    - Add "Swipe to Build" button to App.tsx with gradient styling (pink-500 to purple-600)
    - Add state to toggle SwipeSquadSelector overlay visibility
    - Render SwipeSquadSelector conditionally with onClose handler
    - Place button between search section and wizard separator
    - _Requirements: 1.1, 1.4_

- [~] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases using Vitest
- The project already has Vitest configured with jsdom environment and React Testing Library
- fast-check needs to be added as a dev dependency (`npm install -D fast-check`)
- No external gesture library is needed — custom hook uses native Pointer Events API
- All candidate/role data comes from existing API endpoints; no backend work required

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "1.4", "2.1", "2.2"] },
    { "id": 3, "tasks": ["2.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3", "5.4", "5.5"] },
    { "id": 6, "tasks": ["5.6"] },
    { "id": 7, "tasks": ["7.1"] },
    { "id": 8, "tasks": ["7.2", "7.3"] },
    { "id": 9, "tasks": ["8.1"] }
  ]
}
```
