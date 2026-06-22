import React from 'react';

export interface ScoreBadgeProps {
  score: number;
}

/**
 * Numeric match score badge with colour coding.
 * Green ≥70, Amber 40–69, Red <40.
 */
export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  let colorClasses: string;

  if (score >= 70) {
    colorClasses = 'bg-green-100 text-green-800 border-green-300';
  } else if (score >= 40) {
    colorClasses = 'bg-amber-100 text-amber-800 border-amber-300';
  } else {
    colorClasses = 'bg-red-100 text-red-800 border-red-300';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorClasses}`}
      aria-label={`Match score ${score}`}
    >
      {score}
    </span>
  );
};
