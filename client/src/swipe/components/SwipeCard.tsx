import React from 'react';
import type { SwipeCandidate } from '../types';

export interface SwipeCardProps {
  candidate: SwipeCandidate;
  style?: React.CSSProperties;
  isDragging?: boolean;
  direction?: 'left' | 'right' | 'down' | null;
}

/**
 * Individual candidate card displayed in the swipe stack.
 * Shows candidate details and directional hint overlays during drag.
 *
 * Validates: Requirements 7.1, 7.2
 */
export const SwipeCard: React.FC<SwipeCardProps> = ({
  candidate,
  style,
  isDragging = false,
  direction = null,
}) => {
  const topSkills = [...candidate.skills]
    .sort((a, b) => b.proficiency - a.proficiency)
    .slice(0, 5);

  const availabilityConfig: Record<string, { label: string; className: string }> = {
    available: {
      label: 'Available',
      className: 'bg-green-100 text-green-800',
    },
    partially_available: {
      label: 'Partially Available',
      className: 'bg-yellow-100 text-yellow-800',
    },
    unavailable: {
      label: 'Unavailable',
      className: 'bg-red-100 text-red-800',
    },
  };

  const availBadge = availabilityConfig[candidate.availability] ?? availabilityConfig.unavailable;

  return (
    <div
      data-testid="swipe-card"
      className="absolute inset-0 rounded-xl bg-white shadow-xl p-6 select-none overflow-hidden"
      style={style}
    >
      {/* Directional hint overlays */}
      {isDragging && direction === 'left' && (
        <div
          data-testid="hint-skip"
          className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-xl z-10 pointer-events-none"
        >
          <span className="text-red-600 text-3xl font-bold border-4 border-red-600 rounded-lg px-4 py-2 rotate-[-12deg]">
            SKIP
          </span>
        </div>
      )}
      {isDragging && direction === 'right' && (
        <div
          data-testid="hint-next"
          className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-xl z-10 pointer-events-none"
        >
          <span className="text-blue-600 text-3xl font-bold border-4 border-blue-600 rounded-lg px-4 py-2 rotate-[12deg]">
            NEXT →
          </span>
        </div>
      )}
      {isDragging && direction === 'down' && (
        <div
          data-testid="hint-add"
          className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-xl z-10 pointer-events-none"
        >
          <span className="text-green-600 text-3xl font-bold border-4 border-green-600 rounded-lg px-4 py-2">
            + ADD
          </span>
        </div>
      )}

      {/* Card content */}
      <div className="relative z-0 h-full flex flex-col">
        {/* Header: Name and Role */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{candidate.name}</h2>
          <p className="text-sm text-gray-500">{candidate.currentRole}</p>
        </div>

        {/* Skills */}
        {topSkills.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {topSkills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
                >
                  {skill.name}
                  <span className="text-amber-500" aria-label={`Proficiency ${skill.proficiency} of 3`}>
                    {'●'.repeat(skill.proficiency)}
                    {'○'.repeat(3 - skill.proficiency)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Meta information */}
        <div className="mt-auto space-y-2">
          {/* Availability badge */}
          <div className="flex items-center gap-2">
            <span
              data-testid="availability-badge"
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${availBadge.className}`}
            >
              {availBadge.label}
            </span>
          </div>

          {/* Experience and Team */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
            <span data-testid="years-experience">
              {candidate.yearsExperience} yrs experience
            </span>
            <span className="text-gray-300">|</span>
            <span data-testid="current-team">{candidate.currentTeam}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
