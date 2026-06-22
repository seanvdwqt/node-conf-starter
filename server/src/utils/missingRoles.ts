/**
 * Missing roles detection utility.
 *
 * Pure function that identifies unfilled mandatory roles in a proposed squad.
 * A role is considered "filled" if there is at least one selection with
 * a matching requestRoleId.
 */

export interface RequestRoleInfo {
  id: string;
  roleId: string;
  role: { name: string };
}

export interface SelectionInfo {
  requestRoleId: string;
}

export interface MissingRole {
  roleId: string;
  roleName: string;
}

/**
 * Determines which mandatory roles in a squad request have no candidates selected.
 *
 * @param requestRoles - The roles defined on the squad request, each with an id, roleId, and role name
 * @param selections - The current squad selections, each referencing a requestRoleId
 * @returns Array of unfilled roles with their roleId and roleName
 */
export function getMissingRoles(
  requestRoles: RequestRoleInfo[],
  selections: SelectionInfo[]
): MissingRole[] {
  const filledRequestRoleIds = new Set(
    selections.map((s) => s.requestRoleId)
  );

  return requestRoles
    .filter((rr) => !filledRequestRoleIds.has(rr.id))
    .map((rr) => ({
      roleId: rr.roleId,
      roleName: rr.role.name,
    }));
}
