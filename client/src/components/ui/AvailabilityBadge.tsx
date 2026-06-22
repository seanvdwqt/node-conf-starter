import React from 'react';

export type AvailabilityStatus = 'available' | 'partially_available' | 'unavailable';

export interface AvailabilityBadgeProps {
  status: AvailabilityStatus;
}

const statusConfig: Record<AvailabilityStatus, { label: string; classes: string }> = {
  available: {
    label: 'Available',
    classes: 'bg-green-100 text-green-800 border-green-300',
  },
  partially_available: {
    label: 'Partial',
    classes: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  unavailable: {
    label: 'Unavailable',
    classes: 'bg-red-100 text-red-800 border-red-300',
  },
};

/**
 * Availability indicator badge with colour coding:
 * Green for available, Amber for partially_available, Red for unavailable.
 */
export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({ status }) => {
  const { label, classes } = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}
      aria-label={`Availability: ${label}`}
    >
      <span
        className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
          status === 'available'
            ? 'bg-green-500'
            : status === 'partially_available'
              ? 'bg-amber-500'
              : 'bg-red-500'
        }`}
      />
      {label}
    </span>
  );
};
