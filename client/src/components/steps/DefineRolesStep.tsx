import React, { useEffect, useState, useCallback } from 'react';
import { getRoles, updateRoles, RoleWithSkills, RolePayload, RoleSkillPayload } from '../../api/squadRequests';

export interface DefineRolesStepProps {
  squadRequestId: string;
  onCompleted: () => void;
}

/** Internal state for a skill entry (predefined or custom). */
interface SkillEntry {
  skillId: string | null;
  name: string;
  category: 'mandatory' | 'preferred';
  requiredProficiency: 1 | 2 | 3;
  isCustom: boolean;
  customDescription?: string;
}

/** Internal state for a selected role. */
interface SelectedRole {
  roleId: string;
  roleName: string;
  skills: SkillEntry[];
  customSkillInput: string;
}

/**
 * ProficiencySelector — interactive 3-dot selector for proficiency levels (1–3).
 */
function ProficiencySelector({
  level,
  onChange,
}: {
  level: 1 | 2 | 3;
  onChange: (level: 1 | 2 | 3) => void;
}) {
  return (
    <span className="inline-flex items-center gap-1" role="group" aria-label="Proficiency level selector">
      {([1, 2, 3] as const).map((dot) => (
        <button
          key={dot}
          type="button"
          onClick={() => onChange(dot)}
          className={`h-3 w-3 rounded-full border-2 transition-colors ${
            dot <= level
              ? 'bg-indigo-500 border-indigo-500'
              : 'bg-white border-gray-300 hover:border-indigo-300'
          }`}
          aria-label={`Set proficiency to ${dot}`}
          aria-pressed={dot <= level}
          data-testid={`proficiency-dot-${dot}`}
        />
      ))}
    </span>
  );
}

export const DefineRolesStep: React.FC<DefineRolesStepProps> = ({
  squadRequestId,
  onCompleted,
}) => {
  const [availableRoles, setAvailableRoles] = useState<RoleWithSkills[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<SelectedRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch available roles on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchRoles() {
      try {
        setLoading(true);
        const roles = await getRoles();
        if (!cancelled) {
          setAvailableRoles(roles);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load roles. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchRoles();
    return () => { cancelled = true; };
  }, []);

  /** Toggle a role selection. */
  const toggleRole = useCallback((role: RoleWithSkills) => {
    setSelectedRoles((prev) => {
      const existing = prev.find((r) => r.roleId === role.id);
      if (existing) {
        // Deselect
        return prev.filter((r) => r.roleId !== role.id);
      }
      // Select — populate with predefined skills, defaulting to preferred and proficiency 1
      const skills: SkillEntry[] = role.skills.map((rs) => ({
        skillId: rs.skillId,
        name: rs.skill.name,
        category: 'preferred' as const,
        requiredProficiency: 1 as const,
        isCustom: false,
      }));
      return [...prev, { roleId: role.id, roleName: role.name, skills, customSkillInput: '' }];
    });
    // Clear validation error for this role
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[role.id];
      return next;
    });
  }, []);

  /** Update a skill's category (mandatory/preferred) for a role. */
  const updateSkillCategory = useCallback(
    (roleId: string, skillIndex: number, category: 'mandatory' | 'preferred') => {
      setSelectedRoles((prev) =>
        prev.map((r) => {
          if (r.roleId !== roleId) return r;
          const skills = [...r.skills];
          skills[skillIndex] = { ...skills[skillIndex], category };
          return { ...r, skills };
        })
      );
    },
    []
  );

  /** Update a skill's proficiency level for a role. */
  const updateSkillProficiency = useCallback(
    (roleId: string, skillIndex: number, level: 1 | 2 | 3) => {
      setSelectedRoles((prev) =>
        prev.map((r) => {
          if (r.roleId !== roleId) return r;
          const skills = [...r.skills];
          skills[skillIndex] = { ...skills[skillIndex], requiredProficiency: level };
          return { ...r, skills };
        })
      );
    },
    []
  );

  /** Update the custom skill input text for a role. */
  const updateCustomSkillInput = useCallback((roleId: string, value: string) => {
    setSelectedRoles((prev) =>
      prev.map((r) => (r.roleId === roleId ? { ...r, customSkillInput: value } : r))
    );
  }, []);

  /** Add a custom skill to a role. */
  const addCustomSkill = useCallback((roleId: string) => {
    setSelectedRoles((prev) =>
      prev.map((r) => {
        if (r.roleId !== roleId) return r;
        const description = r.customSkillInput.trim();
        if (description.length < 1 || description.length > 200) return r;
        const newSkill: SkillEntry = {
          skillId: null,
          name: description,
          category: 'preferred',
          requiredProficiency: 1,
          isCustom: true,
          customDescription: description,
        };
        return {
          ...r,
          skills: [...r.skills, newSkill],
          customSkillInput: '',
        };
      })
    );
    // Clear validation error for this role
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[roleId];
      return next;
    });
  }, []);

  /** Remove a custom skill from a role. */
  const removeCustomSkill = useCallback((roleId: string, skillIndex: number) => {
    setSelectedRoles((prev) =>
      prev.map((r) => {
        if (r.roleId !== roleId) return r;
        const skills = r.skills.filter((_, i) => i !== skillIndex);
        return { ...r, skills };
      })
    );
  }, []);

  /** Validate: at least one skill per selected role. */
  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (selectedRoles.length === 0) {
      setError('Please select at least one role.');
      return false;
    }
    for (const role of selectedRoles) {
      if (role.skills.length === 0) {
        errors[role.roleId] = 'Each role requires at least one associated skill.';
      }
    }
    setValidationErrors(errors);
    setError(null);
    return Object.keys(errors).length === 0;
  }, [selectedRoles]);

  /** Submit roles to the API. */
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setSubmitting(true);
    setError(null);
    try {
      const rolesPayload: RolePayload[] = selectedRoles.map((role) => ({
        roleId: role.roleId,
        skills: role.skills.map((skill): RoleSkillPayload => ({
          skillId: skill.skillId,
          name: skill.name,
          category: skill.category,
          requiredProficiency: skill.requiredProficiency,
          isCustom: skill.isCustom,
          customDescription: skill.isCustom ? skill.customDescription : undefined,
        })),
      }));

      await updateRoles(squadRequestId, rolesPayload);
      onCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save roles. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedRoles, squadRequestId, onCompleted, validate]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500" data-testid="define-roles-loading">
        <p>Loading roles...</p>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="define-roles-step">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Define Roles & Skills</h2>
      <p className="text-sm text-gray-500 mb-6">
        Select required roles and configure skills with proficiency levels.
      </p>

      {error && (
        <div
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
          data-testid="define-roles-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Role checkboxes */}
      <div className="space-y-4">
        {availableRoles.map((role) => {
          const isSelected = selectedRoles.some((r) => r.roleId === role.id);
          const selectedRole = selectedRoles.find((r) => r.roleId === role.id);

          return (
            <div
              key={role.id}
              className={`border rounded-lg transition-colors ${
                isSelected ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200'
              }`}
              data-testid={`role-card-${role.id}`}
            >
              {/* Role header with checkbox */}
              <label className="flex items-center gap-3 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleRole(role)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  data-testid={`role-checkbox-${role.id}`}
                />
                <span className="font-medium text-gray-700 capitalize">{role.name}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {role.skills.length} predefined skills
                </span>
              </label>

              {/* Expanded skills section */}
              {isSelected && selectedRole && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  {/* Validation error */}
                  {validationErrors[role.id] && (
                    <p
                      className="text-red-500 text-sm mt-2"
                      data-testid={`role-error-${role.id}`}
                    >
                      {validationErrors[role.id]}
                    </p>
                  )}

                  {/* Skills list */}
                  <div className="mt-3 space-y-2">
                    {selectedRole.skills.map((skill, skillIndex) => (
                      <div
                        key={`${skill.skillId ?? 'custom'}-${skillIndex}`}
                        className="flex items-center gap-3 p-2 bg-white rounded border border-gray-100"
                        data-testid={`skill-row-${role.id}-${skillIndex}`}
                      >
                        {/* Skill name */}
                        <span className="text-sm text-gray-700 flex-1 truncate">
                          {skill.name}
                          {skill.isCustom && (
                            <span className="ml-1 text-xs text-gray-400">(custom)</span>
                          )}
                        </span>

                        {/* Mandatory/Preferred toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            updateSkillCategory(
                              role.id,
                              skillIndex,
                              skill.category === 'mandatory' ? 'preferred' : 'mandatory'
                            )
                          }
                          className={`px-2 py-0.5 text-xs rounded-full font-medium transition-colors ${
                            skill.category === 'mandatory'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                          data-testid={`skill-category-${role.id}-${skillIndex}`}
                          aria-label={`Toggle category: currently ${skill.category}`}
                        >
                          {skill.category}
                        </button>

                        {/* Proficiency selector */}
                        <ProficiencySelector
                          level={skill.requiredProficiency}
                          onChange={(level) =>
                            updateSkillProficiency(role.id, skillIndex, level)
                          }
                        />

                        {/* Remove button for custom skills */}
                        {skill.isCustom && (
                          <button
                            type="button"
                            onClick={() => removeCustomSkill(role.id, skillIndex)}
                            className="text-gray-400 hover:text-red-500 text-sm"
                            aria-label={`Remove custom skill: ${skill.name}`}
                            data-testid={`remove-skill-${role.id}-${skillIndex}`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add custom skill */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={selectedRole.customSkillInput}
                      onChange={(e) => updateCustomSkillInput(role.id, e.target.value)}
                      placeholder="Add custom skill (1-200 chars)"
                      maxLength={200}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      data-testid={`custom-skill-input-${role.id}`}
                    />
                    <button
                      type="button"
                      onClick={() => addCustomSkill(role.id)}
                      disabled={
                        selectedRole.customSkillInput.trim().length < 1 ||
                        selectedRole.customSkillInput.trim().length > 200
                      }
                      className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      data-testid={`add-custom-skill-btn-${role.id}`}
                    >
                      + Add
                    </button>
                  </div>
                  {selectedRole.customSkillInput.trim().length > 200 && (
                    <p className="text-red-500 text-xs mt-1">
                      Custom skill description must be 1–200 characters.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || selectedRoles.length === 0}
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="define-roles-submit"
        >
          {submitting ? 'Saving...' : 'Save Roles & Continue'}
        </button>
      </div>
    </div>
  );
};

export default DefineRolesStep;
