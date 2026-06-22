import React from 'react';

export interface ProficiencyIndicatorProps {
  level: 1 | 2 | 3;
}

/**
 * Visual dots representing skill proficiency depth (1–3).
 * Filled dots indicate the proficiency level.
 */
export const ProficiencyIndicator: React.FC<ProficiencyIndicatorProps> = ({ level }) => {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Proficiency level ${level} of 3`}>
      {[1, 2, 3].map((dot) => (
        <span
          key={dot}
          className={`inline-block h-2 w-2 rounded-full ${
            dot <= level ? 'bg-indigo-500' : 'bg-gray-200'
          }`}
        />
      ))}
    </span>
  );
};
