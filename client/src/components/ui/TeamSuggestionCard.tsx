import React from 'react';
import { ScoreBadge } from './ScoreBadge';
import { AvailabilityBadge, AvailabilityStatus } from './AvailabilityBadge';
import { ProficiencyIndicator } from './ProficiencyIndicator';

export interface TeamMember {
  candidateId: string;
  name: string;
  role: string;
  matchScore: number;
  matchedSkills: { name: string; proficiency: 1 | 2 | 3 }[];
  availability: AvailabilityStatus;
  yearsExperience: number;
  currentTeam: string;
}

export interface TeamSuggestion {
  teamScore: number;
  explanation: string;
  members: TeamMember[];
}

export interface TeamSuggestionCardProps {
  suggestion: TeamSuggestion;
  onClick: () => void;
}

/**
 * Clickable team suggestion card displaying combined team score, explanation,
 * and a list of team members with roles, individual scores, key skills with
 * proficiency dots, and availability badges.
 *
 * Clicking the card pre-populates wizard step 4 with the suggested selections.
 */
export const TeamSuggestionCard: React.FC<TeamSuggestionCardProps> = ({ suggestion, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      aria-label={`Team suggestion with score ${suggestion.teamScore}. ${suggestion.explanation}`}
    >
      {/* Header: Combined team score and explanation */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-gray-700">{suggestion.explanation}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500">Team</span>
          <ScoreBadge score={suggestion.teamScore} />
        </div>
      </div>

      {/* Team members list */}
      <div className="mt-3 space-y-2.5">
        {suggestion.members.map((member) => (
          <div
            key={member.candidateId}
            className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
          >
            {/* Member header: Name, role, score, availability */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-900">{member.name}</span>
                <span className="ml-2 text-xs text-gray-500">{member.role}</span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <ScoreBadge score={member.matchScore} />
                <AvailabilityBadge status={member.availability} />
              </div>
            </div>

            {/* Member skills with proficiency */}
            {member.matchedSkills.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {member.matchedSkills.map((skill) => (
                  <span
                    key={skill.name}
                    className="inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-xs text-gray-600"
                  >
                    {skill.name}
                    <ProficiencyIndicator level={skill.proficiency} />
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Click hint */}
      <p className="mt-3 text-center text-xs text-indigo-500">Click to use this team</p>
    </button>
  );
};
