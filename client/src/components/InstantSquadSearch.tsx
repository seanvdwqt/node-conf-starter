import React, { useState, useRef, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single team member within a squad suggestion. */
export interface TeamMember {
  candidateId: string;
  name: string;
  role: string;
  matchScore: number;
  matchedSkills: Array<{ name: string; proficiency: number }>;
  availability: 'available' | 'partially_available';
  yearsExperience: number;
  currentTeam: string;
}

/** A pre-composed squad suggestion returned by the search API. */
export interface TeamSuggestion {
  teamScore: number;
  explanation: string;
  members: TeamMember[];
}

/** Parsed query metadata returned alongside suggestions. */
export interface ParsedQuery {
  roles: Array<{ name: string; quantity: number }>;
  skills: string[];
  urgency: 'low' | 'medium' | 'high' | null;
  signals: string[];
}

/** Full response from POST /api/squad-search. */
export interface SquadSearchResponse {
  parsed: ParsedQuery;
  suggestions: TeamSuggestion[];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface InstantSquadSearchProps {
  onSuggestionSelected: (suggestion: TeamSuggestion) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

const DEBOUNCE_MS = 300;

const EXAMPLE_QUERIES = [
  'I need 2 engineers with React and TypeScript',
  'Urgent: 1 architect and 2 engineers for cloud migration',
  'Looking for a tester with automation skills',
  'BA and delivery lead for new project',
  '3 developers with Node.js experience ASAP',
] as const;

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function squadSearch(query: string): Promise<SquadSearchResponse> {
  const response = await fetch(`${API_BASE_URL}/squad-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Squad search failed: ${response.statusText}`);
  }

  return response.json() as Promise<SquadSearchResponse>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const InstantSquadSearch: React.FC<InstantSquadSearchProps> = ({
  onSuggestionSelected,
}) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TeamSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await squadSearch(searchQuery);
      setResults(data.suggestions);

      if (data.suggestions.length === 0) {
        setError('No matches found. Try refining your query with different roles or skills.');
      }
    } catch (err) {
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      // Clear any existing debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce search
      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, DEBOUNCE_MS);
    },
    [performSearch],
  );

  const handleChipClick = useCallback(
    (exampleQuery: string) => {
      setQuery(exampleQuery);

      // Clear any existing debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Search immediately for chip selections
      performSearch(exampleQuery);
    },
    [performSearch],
  );

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => {
    // Delay blur to allow chip clicks to register
    setTimeout(() => setFocused(false), 200);
  }, []);

  const showChips = focused && query === '';

  return (
    <div className="w-full max-w-3xl mx-auto" data-testid="instant-squad-search">
      {/* Search bar */}
      <div className="relative">
        <div className="flex items-center rounded-xl border-2 border-indigo-200 bg-white shadow-lg focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
          <svg
            className="ml-4 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="I need 2 engineers with React experience and a tester, starting next week"
            className="flex-1 px-4 py-4 text-base text-gray-700 placeholder-gray-400 bg-transparent outline-none"
            data-testid="squad-search-input"
            aria-label="Search for squad members"
          />
          {loading && (
            <div className="mr-4" data-testid="squad-search-loading">
              <svg
                className="animate-spin h-5 w-5 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                aria-label="Loading search results"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Example query chips */}
      {showChips && (
        <div
          className="mt-3 flex flex-wrap gap-2"
          data-testid="squad-search-chips"
        >
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleChipClick(example)}
              className="px-3 py-1.5 text-sm rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
              data-testid="squad-search-chip"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {/* Error / no matches message */}
      {error && !loading && (
        <div
          className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm"
          data-testid="squad-search-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !loading && (
        <div className="mt-4 space-y-3" data-testid="squad-search-results">
          {results.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSuggestionSelected(suggestion)}
              className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
              data-testid="squad-search-result-card"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-indigo-700">
                  Team Score: {suggestion.teamScore}
                </span>
                <span className="text-xs text-gray-500">
                  {suggestion.members.length} member{suggestion.members.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{suggestion.explanation}</p>
              <div className="flex flex-wrap gap-2">
                {suggestion.members.map((member) => (
                  <MemberChip key={member.candidateId} member={member} />
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tooltip sub-component
// ---------------------------------------------------------------------------

interface MemberTooltipProps {
  member: TeamMember;
}

/**
 * Hover tooltip showing a team member's matched skills with proficiency dots
 * and years of experience.
 */
function MemberTooltip({ member }: MemberTooltipProps) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg pointer-events-none">
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
        <div className="h-2 w-2 rotate-45 border-b border-r border-gray-200 bg-white" />
      </div>

      <p className="text-xs font-semibold text-gray-800 mb-1">{member.name}</p>
      <p className="text-xs text-gray-500 mb-2">
        {member.role} · {member.yearsExperience} yrs experience
      </p>

      {/* Skills with proficiency dots */}
      {member.matchedSkills.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {member.matchedSkills.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center gap-1 rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-700"
              >
                {skill.name}
                <span className="inline-flex items-center gap-0.5" aria-label={`Proficiency ${skill.proficiency} of 3`}>
                  {[1, 2, 3].map((dot) => (
                    <span
                      key={dot}
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        dot <= skill.proficiency ? 'bg-indigo-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {member.matchedSkills.length === 0 && (
        <p className="text-xs text-gray-400 italic">No matched skills data</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member chip with hover tooltip
// ---------------------------------------------------------------------------

interface MemberChipProps {
  member: TeamMember;
}

function MemberChip({ member }: MemberChipProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      className="relative inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="font-medium">{member.name}</span>
      <span className="text-gray-400">·</span>
      <span className="text-indigo-600">{member.role}</span>
      <span className="text-gray-400">·</span>
      <span className="text-green-600">{member.matchScore}</span>

      {hovered && <MemberTooltip member={member} />}
    </span>
  );
}

export default InstantSquadSearch;
