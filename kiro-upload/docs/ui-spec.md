# UI Specification — Rapid Squad Assembly

## Design System

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS 3 (utility-first)
- **Colour palette:** Indigo/blue primary, gradient background `from-blue-50 to-indigo-100`
- **Typography:** System fonts via Tailwind defaults
- **Layout:** Single-page application, max-width containers (`max-w-4xl`, `max-w-3xl`)
- **Cards:** White background with `rounded-lg shadow-md`
- **Error states:** `text-red-500` inline, `bg-red-50 border-red-200` alert banners

---

## Screen Map (5-Step Wizard + Search)

```
┌──────────────────────────────────────────────┐
│              Landing Page                      │
│  ┌────────────────────────────────────────┐  │
│  │     Instant Squad Search (prominent)    │  │
│  │  [search bar + example query chips]     │  │
│  │  [team suggestion cards below]          │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ─────── or use the wizard ───────          │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │     5-Step Wizard                       │  │
│  │  [step indicator bar]                   │  │
│  │  [step content area]                    │  │
│  │  [Back / Next buttons]                  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## Screen 1: Instant Squad Search

### Components
- **Header:** "Rapid Squad Assembly" (h1, `text-3xl font-bold text-indigo-700`)
- **Subtitle:** "Assemble cross-functional squads quickly"
- **Search bar:** Full-width input with placeholder example query
- **Example chips:** 3–5 clickable pre-populated queries (shown when focused + empty)
- **Results area:** Up to 5 `TeamSuggestionCard` components

### TeamSuggestionCard
- Combined team score badge
- One-line explanation
- Member list: name, role, individual match score, key skills with proficiency dots, availability badge
- Click action → pre-populates wizard step 4

### Interaction
- 300ms debounce on input
- Loading spinner while searching
- "No matches found" message for unrecognised queries

---

## Screen 2: Step 1 — Create Request

### Form Fields
| Field | Type | Validation |
|-------|------|-----------|
| Title | Text input (max 100) | Required, ≤100 chars |
| Business Unit | Disabled input ("Digital Platforms") | Fixed value |
| Objective | Textarea (max 500) | Required, ≤500 chars |
| Urgency | Dropdown (low/medium/high) | Required, default "medium" |
| Start Date | Date picker | Required, ≥ today |
| Duration (weeks) | Number input | Required, integer 1–52 |
| Required Capacity | Dropdown (10–100, step 10) | Required |

### Error Display
- Inline per field: `text-red-500 text-sm` below the input
- All previously entered data preserved on validation failure
- Submit button: "Create Request & Continue" (disabled while submitting)

---

## Screen 3: Step 2 — Define Roles & Skills

### Layout
- **Role Legend:** Horizontal strip with colour-coded dots per role
- **Role Cards:** Expandable cards with checkbox to select

### Role Card (Selected)
- Headcount selector (−/+, range 1–10)
- Candidate preview strip: horizontal scrollable mini-cards of matching candidates
- Skills configuration (collapsible `<details>` section):
  - Each skill row: name | mandatory/preferred toggle | proficiency dots (1–3) | remove button (custom only)
  - Custom skill input: text field + "Add" button

### Proficiency Selector
- 3 clickable dots: filled = active, empty = inactive
- Indigo colour for active dots

### Role Colours
| Role | Colour |
|------|--------|
| Architect | Purple |
| Engineer | Blue |
| Tester | Green |
| Data Specialist | Amber |
| Business Analyst | Rose |
| Delivery Lead | Teal |

---

## Screen 4: Step 3 — Recommendations

### Layout
- One shortlist section per role
- `FilterBar` component at the top (sort/filter by experience, proficiency, team)
- `GapIndicator` for roles with zero matches

### CandidateCard
- **Header:** Name, current role, current team
- **Score:** `ScoreBadge` (numeric 0–100, colour-coded: green ≥70, amber 40–69, red <40)
- **Skills:** Matched skills with `ProficiencyIndicator` (dots comparing candidate vs required)
- **Metadata:** Years experience, previous projects
- **Availability:** `AvailabilityBadge` (green/amber/red)
- **Workload:** Normal/high indicator
- **Explanation:** Plain-language text block
- **Score breakdown:** Expandable list of rule contributions

---

## Screen 5: Step 4 — Assemble Squad

### Layout
- Role sections with shortlist candidates
- Selected candidates highlighted
- Warning modals for risk selections (partially_available / high workload)
- Missing roles displayed prominently with `GapIndicator`
- Cannot advance until all mandatory roles have ≥1 selection

### Interactions
- Click candidate to select/deselect
- Warning popup on risk selection (dismiss or cancel)
- Running count of selections (max 20)

---

## Screen 6: Step 5 — Review & Finalise

### Layout
- Summary panel: request title, objective, urgency, dates, capacity
- Selected squad table: candidate name, role, score, availability, key skills
- Coverage status: all roles filled indicator
- Explanation text per selected candidate

### Actions
- "Back" — return to step 4
- "Reset" — clear all selections, return to step 3
- "Finalise" — confirm and close (success toast/message)

---

## Shared UI Components

### ScoreBadge
- Numeric display (0–100)
- Colour coded: `bg-green-100 text-green-700` (≥70), `bg-amber-100 text-amber-700` (40–69), `bg-red-100 text-red-700` (<40)

### AvailabilityBadge
- Text + colour: "Available" (green), "Partially Available" (amber), "Unavailable" (red)

### ProficiencyIndicator
- 1–3 dots/bars
- Filled dots indicate level; compare candidate vs required

### GapIndicator
- Warning icon + "No matching candidates for [role]"
- `bg-yellow-50 border-yellow-200 text-yellow-700`

### FilterBar
- Sort by: Match Score (default), Experience, Proficiency
- Filter by: Team assignment dropdown, minimum experience

---

## Wizard Navigation

### Step Indicator
- 5-segment progress bar at top of wizard
- Active step: `bg-indigo-600`
- Completed steps: `bg-indigo-400`
- Future steps: `bg-gray-200`
- Labels below each segment

### Navigation Buttons
- "Back" (left, disabled on step 1): `bg-gray-200 text-gray-700`
- "Next" (right, disabled on step 5): `bg-indigo-600 text-white`
- Step 5 shows "Finalise" (green) instead of "Next"

---

## Responsive Behaviour

- Primary target: desktop (1024px+)
- Cards stack vertically on smaller screens
- Horizontal scroll for candidate preview strips
- Form fields full-width on mobile

---

## Accessibility

- All interactive elements have `data-testid` attributes
- Form inputs have associated `<label>` elements
- Proficiency selector uses `role="group"` and `aria-label`
- Error messages use `role="alert"`
- Colour is never the sole indicator (text labels accompany colour coding)
