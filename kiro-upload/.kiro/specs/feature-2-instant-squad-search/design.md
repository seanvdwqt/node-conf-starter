# Design: Instant Squad Search

## Architecture

Client-side search bar with debounced input → Server-side query parsing + scoring → Pre-composed team suggestions returned to client.

### Pipeline
```
User Input ("2 engineers with React, urgent")
  → POST /api/squad-search { query: string }
  → Query Parser (server/src/search/queryParser.ts)
     • Extract roles via synonym mapping (longest-first matching)
     • Extract skills via keyword matching + abbreviation map
     • Extract urgency via signal detection
     • Track matched ranges to prevent double-counting
  → Team Composer (server/src/search/teamComposer.ts)
     • Build RequestContext from parsed criteria
     • Score all candidates per role using existing scoring engine
     • Compose up to 5 team combinations (vary first-role candidate)
     • Calculate combined team score (average of member scores)
     • Generate one-line explanation
  → Response: { parsed, suggestions }
```

### Key Components

**Backend:**
- `queryParser.ts` — Tokenizer with synonym maps, abbreviation maps, regex-based extraction
- `teamComposer.ts` — Invokes scoring engine, composes teams, deduplicates

**Frontend:**
- `InstantSquadSearch.tsx` — Search bar, debounce (300ms), example chips, results display
- `TeamSuggestionCard.tsx` — Team card with members, scores, explanation

### Integration with Wizard
- When a suggestion is selected, `App.tsx` passes it to `SquadWizard` via `initialSuggestion` prop
- Wizard jumps to step 4 with pre-populated candidates

### Synonym Coverage
- Roles: 6 canonical roles with 40+ synonyms (dev, QA, BA, PM, PO, scrum master, etc.)
- Skills: 30+ predefined skills + abbreviation map (node→Node.js, ts→TypeScript, api→REST APIs)
- Urgency: 3 levels with multi-word signal detection

### Error Handling
- Empty/whitespace query → return empty results with helpful message
- No roles/skills extracted → return parsed + empty suggestions + message
- Scoring failures → handled by existing engine fault tolerance
