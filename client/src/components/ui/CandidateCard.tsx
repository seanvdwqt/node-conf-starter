import React, { useState } from 'react';
import { ScoreBadge } from './ScoreBadge';
import { AvailabilityBadge, AvailabilityStatus } from './AvailabilityBadge';
import { ProficiencyIndicator } from './ProficiencyIndicator';

export interface CandidateSkill {
  name: string;
  proficiency: 1 | 2 | 3;
  requiredProficiency?: 1 | 2 | 3;
}

export interface CandidateProject {
  name: string;
  role: string;
}

export interface CandidateData {
  candidateId: string;
  name: string;
  role: string;
  matchScore: number;
  availability: AvailabilityStatus;
  workload: 'normal' | 'high';
  matchedSkills: CandidateSkill[];
  yearsExperience: number;
  currentTeam: string;
  previousProjects: CandidateProject[];
  explanation?: string;
}

export interface CandidateCardProps {
  candidate: CandidateData;
}

/**
 * Card displaying rich candidate information including name, role, skills with
 * proficiency dots, experience, current team, previous projects, score,
 * availability, and workload.
 */
export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const [showProjects, setShowProjects] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header: Name, Role, Score, Availability */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-900">{candidate.name}</h3>
          <p className="text-sm text-gray-500">{candidate.role}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <ScoreBadge score={candidate.matchScore} />
          <AvailabilityBadge status={candidate.availability} />
        </div>
      </div>

      {/* Meta: Experience, Team, Workload */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
        <span>{candidate.yearsExperience} yrs experience</span>
        <span className="text-gray-300">|</span>
        <span>{candidate.currentTeam}</span>
        {candidate.workload === 'high' && (
          <>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
              High workload
            </span>
          </>
        )}
      </div>

      {/* Skills with proficiency */}
      {candidate.matchedSkills.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium text-gray-500">Matched Skills</p>
          <div className="flex flex-wrap gap-2">
            {candidate.matchedSkills.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
              >
                {skill.name}
                <ProficiencyIndicator level={skill.proficiency} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      {candidate.explanation && (
        <p className="mt-3 text-xs leading-relaxed text-gray-600 italic">
          {candidate.explanation}
        </p>
      )}

      {/* Previous Projects (collapsible) */}
      {candidate.previousProjects.length > 0 && (
        <div className="mt-3 border-t border-gray-100 pt-2">
          <button
            type="button"
            onClick={() => setShowProjects(!showProjects)}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            aria-expanded={showProjects}
          >
            <svg
              className={`h-3 w-3 transition-transform ${showProjects ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
            Previous Projects ({candidate.previousProjects.length})
          </button>
          {showProjects && (
            <ul className="mt-2 space-y-1 pl-4">
              {candidate.previousProjects.map((project) => (
                <li key={`${project.name}-${project.role}`} className="text-xs text-gray-600">
                  <span className="font-medium">{project.name}</span>
                  <span className="text-gray-400"> — {project.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
