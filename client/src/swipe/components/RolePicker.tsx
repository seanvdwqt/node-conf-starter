import React from 'react';
import type { Role } from '../types';
import { ROLE_COLOUR_MAP } from '../types';

/**
 * Swipe Squad Selector — RolePicker component
 *
 * Displays available roles as tappable chips/pills with role colour coding.
 * Highlights the selected role, shows badge count of cart members per role,
 * and prompts the user to select a role when none is selected.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

export interface RolePickerProps {
  roles: Role[];
  selectedRole: string | null;
  onRoleSelect: (roleId: string) => void;
  cartCountByRole: Record<string, number>;
}

/**
 * Maps a role colour key (e.g. 'purple-500') to Tailwind classes for
 * selected (filled) and unselected (outlined) states.
 */
function getColourClasses(roleName: string, isSelected: boolean) {
  const colour = ROLE_COLOUR_MAP[roleName.toLowerCase()] ?? 'gray-500';

  // Use inline style for dynamic colour since Tailwind purges dynamic classes.
  // We map known colours to their explicit Tailwind classes for purge safety.
  const colourMap: Record<string, { selected: string; unselected: string }> = {
    'purple-500': {
      selected: 'bg-purple-500 text-white border-purple-500',
      unselected: 'border-purple-500 text-purple-700 hover:bg-purple-50',
    },
    'blue-500': {
      selected: 'bg-blue-500 text-white border-blue-500',
      unselected: 'border-blue-500 text-blue-700 hover:bg-blue-50',
    },
    'green-500': {
      selected: 'bg-green-500 text-white border-green-500',
      unselected: 'border-green-500 text-green-700 hover:bg-green-50',
    },
    'amber-500': {
      selected: 'bg-amber-500 text-white border-amber-500',
      unselected: 'border-amber-500 text-amber-700 hover:bg-amber-50',
    },
    'rose-500': {
      selected: 'bg-rose-500 text-white border-rose-500',
      unselected: 'border-rose-500 text-rose-700 hover:bg-rose-50',
    },
    'teal-500': {
      selected: 'bg-teal-500 text-white border-teal-500',
      unselected: 'border-teal-500 text-teal-700 hover:bg-teal-50',
    },
  };

  const classes = colourMap[colour] ?? {
    selected: 'bg-gray-500 text-white border-gray-500',
    unselected: 'border-gray-500 text-gray-700 hover:bg-gray-50',
  };

  return isSelected ? classes.selected : classes.unselected;
}

export const RolePicker: React.FC<RolePickerProps> = ({
  roles,
  selectedRole,
  onRoleSelect,
  cartCountByRole,
}) => {
  if (roles.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500" role="status">
        No roles available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Role selection"
      >
        {roles.map((role) => {
          const isSelected = selectedRole === role.name;
          const count = cartCountByRole[role.name] ?? 0;
          const colourClasses = getColourClasses(role.name, isSelected);

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onRoleSelect(role.name)}
              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-colors ${colourClasses}`}
              aria-pressed={isSelected}
              aria-label={`${role.displayName}${count > 0 ? `, ${count} in cart` : ''}`}
            >
              {role.displayName}
              {count > 0 && (
                <span
                  className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold ${
                    isSelected
                      ? 'bg-white/30 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedRole === null && (
        <p className="text-sm text-gray-500 italic" role="status">
          Select a role to browse candidates
        </p>
      )}
    </div>
  );
};
