import { describe, it, expect } from 'vitest';
import { getMissingRoles } from '../../src/utils/missingRoles.js';

describe('getMissingRoles', () => {
  describe('all roles filled', () => {
    it('returns empty array when every role has a selection', () => {
      const requestRoles = [
        { id: 'rr-1', roleId: 'role-eng', role: { name: 'engineer' } },
        { id: 'rr-2', roleId: 'role-test', role: { name: 'tester' } },
      ];
      const selections = [
        { requestRoleId: 'rr-1' },
        { requestRoleId: 'rr-2' },
      ];

      expect(getMissingRoles(requestRoles, selections)).toEqual([]);
    });

    it('returns empty array when roles have multiple selections each', () => {
      const requestRoles = [
        { id: 'rr-1', roleId: 'role-eng', role: { name: 'engineer' } },
      ];
      const selections = [
        { requestRoleId: 'rr-1' },
        { requestRoleId: 'rr-1' },
      ];

      expect(getMissingRoles(requestRoles, selections)).toEqual([]);
    });
  });

  describe('no roles filled', () => {
    it('returns all roles when selections is empty', () => {
      const requestRoles = [
        { id: 'rr-1', roleId: 'role-eng', role: { name: 'engineer' } },
        { id: 'rr-2', roleId: 'role-test', role: { name: 'tester' } },
      ];

      const result = getMissingRoles(requestRoles, []);

      expect(result).toEqual([
        { roleId: 'role-eng', roleName: 'engineer' },
        { roleId: 'role-test', roleName: 'tester' },
      ]);
    });
  });

  describe('partial coverage', () => {
    it('returns only the unfilled roles', () => {
      const requestRoles = [
        { id: 'rr-1', roleId: 'role-arch', role: { name: 'architect' } },
        { id: 'rr-2', roleId: 'role-eng', role: { name: 'engineer' } },
        { id: 'rr-3', roleId: 'role-test', role: { name: 'tester' } },
      ];
      const selections = [
        { requestRoleId: 'rr-2' },
      ];

      const result = getMissingRoles(requestRoles, selections);

      expect(result).toEqual([
        { roleId: 'role-arch', roleName: 'architect' },
        { roleId: 'role-test', roleName: 'tester' },
      ]);
    });
  });

  describe('edge cases', () => {
    it('returns empty array when requestRoles is empty', () => {
      expect(getMissingRoles([], [])).toEqual([]);
    });

    it('ignores selections that do not match any request role', () => {
      const requestRoles = [
        { id: 'rr-1', roleId: 'role-eng', role: { name: 'engineer' } },
      ];
      const selections = [
        { requestRoleId: 'rr-nonexistent' },
      ];

      const result = getMissingRoles(requestRoles, selections);

      expect(result).toEqual([
        { roleId: 'role-eng', roleName: 'engineer' },
      ]);
    });
  });
});
