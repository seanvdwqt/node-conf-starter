import React from 'react';

export interface GapIndicatorProps {
  roles: string[];
}

/**
 * Warning banner indicating unfilled roles/skills.
 * Displays a yellow/orange warning with an icon and the list of missing roles.
 */
export const GapIndicator: React.FC<GapIndicatorProps> = ({ roles }) => {
  if (roles.length === 0) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4"
      role="alert"
      aria-label="Coverage gap warning"
    >
      <svg
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        <h3 className="text-sm font-semibold text-amber-800">Coverage Gap</h3>
        <p className="mt-1 text-sm text-amber-700">
          No suitable candidates found for:{' '}
          {roles.map((role, i) => (
            <span key={role}>
              <span className="font-medium">{role}</span>
              {i < roles.length - 1 && ', '}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};
