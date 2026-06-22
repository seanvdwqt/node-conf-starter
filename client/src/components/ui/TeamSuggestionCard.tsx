import React, { useState } from 'react';
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
  previousProjects?: { name: string; role: string }[];
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
 * Hovering over a member row reveals a tooltip with their projects and skill levels.
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
          <MemberRow key={member.candidateId} member={member} />
        ))}
      </div>

      {/* Click hint */}
      <p className="mt-3 text-center text-xs text-indigo-500">Click to use this team</p>
    </button>
  );
};

// ---------------------------------------------------------------------------
// Member row with hover tooltip
// ---------------------------------------------------------------------------

interface MemberRowProps {
  member: TeamMember;
}

/**
 * Individual member row that shows a tooltip on hover with their
 * skill proficiency levels and previous projects.
 */
function MemberRow({ member }: MemberRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

      {/* Hover tooltip with projects and skill details */}
      {hovered && (
        <div
          className="absolute left-1/2 bottom-full -translate-x-1/2 mb-2 z-50 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg pointer-events-none"
          role="tooltip"
        >
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="h-2 w-2 rotate-45 border-b border-r border-gray-200 bg-white" />
          </div>

          <p className="text-xs font-semibold text-gray-800">{member.name}</p>
          <p className="text-xs text-gray-500 mb-2">
            {member.role} · {member.yearsExperience} yrs experience · {member.currentTeam}
          </p>

          {/* Skills breakdown */}
          {member.matchedSkills.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Skills &amp; Proficiency</p>
              <div className="space-y-0.5">
                {member.matchedSkills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{skill.name}</span>
                    <ProficiencyIndicator level={skill.proficiency} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous projects */}
          {member.previousProjects && member.previousProjects.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Recent Projects</p>
              <ul className="space-y-0.5">
                {member.previousProjects.slice(0, 3).map((project) => (
                  <li key={`${project.name}-${project.role}`} className="text-xs text-gray-600">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-gray-400"> — {project.role}</span>
                  </li>
                ))}
                {member.previousProjects.length > 3 && (
                  <li className="text-xs text-gray-400 italic">
                    +{member.previousProjects.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {member.matchedSkills.length === 0 && !member.previousProjects?.length && (
            <p className="text-xs text-gray-400 italic">No additional details available</p>
          )}
        </div>
      )}
    </div>
  );
}
