import React, { useState } from 'react';

export type SortField = 'score' | 'experience' | 'proficiency';

export interface FilterState {
  team: string | null;
}

export interface FilterBarProps {
  teams: string[];
  onFilterChange: (filters: FilterState) => void;
  onSortChange: (sort: SortField) => void;
}

/**
 * Horizontal bar with filter/sort options for recommendation results.
 * Supports sorting by score, experience, or proficiency, and filtering by team.
 */
export const FilterBar: React.FC<FilterBarProps> = ({ teams, onFilterChange, onSortChange }) => {
  const [activeSort, setActiveSort] = useState<SortField>('score');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const handleSortChange = (sort: SortField) => {
    setActiveSort(sort);
    onSortChange(sort);
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const team = e.target.value || null;
    setSelectedTeam(e.target.value);
    onFilterChange({ team });
  };

  const sortButtons: { field: SortField; label: string }[] = [
    { field: 'score', label: 'Score' },
    { field: 'experience', label: 'Experience' },
    { field: 'proficiency', label: 'Proficiency' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Sort by:</span>
        <div className="flex gap-1">
          {sortButtons.map(({ field, label }) => (
            <button
              key={field}
              type="button"
              onClick={() => handleSortChange(field)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSort === field
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
              aria-pressed={activeSort === field}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter by team */}
      <div className="flex items-center gap-2">
        <label htmlFor="team-filter" className="text-sm font-medium text-gray-600">
          Team:
        </label>
        <select
          id="team-filter"
          value={selectedTeam}
          onChange={handleTeamChange}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All teams</option>
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
