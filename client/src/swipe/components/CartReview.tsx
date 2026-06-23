import React from 'react';
import type { CartItem, Role } from '../types';

/**
 * Swipe Squad Selector — CartReview component
 *
 * Full-screen review panel showing all selected squad members grouped by role.
 * Displays gap indicators for unfilled roles, allows removing members,
 * and provides "Done" and "Back to Swiping" actions.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

export interface CartReviewProps {
  items: CartItem[];
  roles: Role[];
  onRemove: (candidateId: string) => void;
  onDone: () => void;
  onBack: () => void;
}

/**
 * Groups cart items by role name, with roles ordered alphabetically
 * and candidates within each group ordered by addedAt timestamp ascending.
 */
function groupByRole(
  items: CartItem[],
  roles: Role[]
): { roleName: string; displayName: string; items: CartItem[] }[] {
  // Build a map of role name -> display name from the roles list
  const roleDisplayMap = new Map<string, string>();
  for (const role of roles) {
    roleDisplayMap.set(role.name, role.displayName);
  }

  // Group items by their role field
  const grouped = new Map<string, CartItem[]>();
  for (const item of items) {
    const existing = grouped.get(item.role) ?? [];
    existing.push(item);
    grouped.set(item.role, existing);
  }

  // Collect all unique role names from both the system roles and cart items
  const allRoleNames = new Set<string>();
  for (const role of roles) {
    allRoleNames.add(role.name);
  }
  for (const item of items) {
    allRoleNames.add(item.role);
  }

  // Sort role names alphabetically and build result
  const sortedRoleNames = Array.from(allRoleNames).sort((a, b) =>
    a.localeCompare(b)
  );

  return sortedRoleNames.map((roleName) => {
    const roleItems = (grouped.get(roleName) ?? []).sort(
      (a, b) => a.addedAt - b.addedAt
    );
    return {
      roleName,
      displayName: roleDisplayMap.get(roleName) ?? roleName,
      items: roleItems,
    };
  });
}

export const CartReview: React.FC<CartReviewProps> = ({
  items,
  roles,
  onRemove,
  onDone,
  onBack,
}) => {
  const isEmpty = items.length === 0;
  const groups = groupByRole(items, roles);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Review Squad</h2>
        <span className="text-sm text-gray-500">
          {items.length} member{items.length !== 1 ? 's' : ''} selected
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {isEmpty ? (
          <div className="text-center py-12 text-gray-500" role="status">
            <p>
              No candidates selected yet. Add at least one candidate to
              finalise.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.roleName}>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {group.displayName}
              </h3>

              {group.items.length === 0 ? (
                <div
                  className="border-2 border-dashed border-amber-400 rounded-lg p-3 bg-amber-50 text-amber-700 text-sm"
                  role="alert"
                >
                  No {group.displayName} selected
                </div>
              ) : (
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item.candidateId}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.candidateName}
                        </p>
                        <p className="text-sm text-gray-500">{item.role}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item.candidateId)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                        aria-label={`Remove ${item.candidateName}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Back to Swiping
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={isEmpty}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isEmpty
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          Done
        </button>
      </div>
    </div>
  );
};
