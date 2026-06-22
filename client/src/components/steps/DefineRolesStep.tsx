import React, { useEffect, useState, useCallback } from 'react';
import { getRoles, getCandidates, updateRoles, RoleWithSkills, RolePayload, RoleSkillPayload, CandidateResponse } from '../../api/squadRequests';

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
  headcount: number;
  skills: SkillEntry[];
  customSkillInput: string;
}

/** Role colour mapping for the legend and cards. */
const ROLE_COLOURS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  architect: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  engineer: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  tester: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  'data specialist': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  'business analyst': { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
  'delivery lead': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', dot: 'bg-teal-500' },
};

const DEFAULT_COLOUR = { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-500' };

function getRoleColour(roleName: string) {
  return ROLE_COLOURS[roleName.toLowerCase()] ?? DEFAULT_COLOUR;
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
  const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<SelectedRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch available roles and candidates on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        const [roles, cands] = await Promise.all([getRoles(), getCandidates()]);
        if (!cancelled) {
          setAvailableRoles(roles);
          setCandidates(cands);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load roles. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  /** Get candidates matching a role (by currentRole field). */
  const getCandidatesForRole = useCallback((roleName: string): CandidateResponse[] => {
    return candidates.filter(
      (c) => c.currentRole.toLowerCase() === roleName.toLowerCase()
    );
  }, [candidates]);

  /** Toggle a role selection. */
  const toggleRole = useCallback((role: RoleWithSkills) => {
    setSelectedRoles((prev) => {
      const existing = prev.find((r) => r.roleId === role.id);
      if (existing) {
        return prev.filter((r) => r.roleId !== role.id);
      }
      const skills: SkillEntry[] = role.skills.map((rs) => ({
        skillId: rs.skillId,
        name: rs.skill.name,
        category: 'preferred' as const,
        requiredProficiency: 1 as const,
        isCustom: false,
      }));
      return [...prev, { roleId: role.id, roleName: role.name, headcount: 1, skills, customSkillInput: '' }];
    });
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[role.id];
      return next;
    });
  }, []);

  /** Update headcount for a role. */
  const updateHeadcount = useCallback((roleId: string, count: number) => {
    setSelectedRoles((prev) =>
      prev.map((r) => (r.roleId === roleId ? { ...r, headcount: Math.max(1, Math.min(10, count)) } : r))
    );
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
        return { ...r, skills: [...r.skills, newSkill], customSkillInput: '' };
      })
    );
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
      // For roles with headcount > 1, duplicate the role entry in the payload
      // (server's unique constraint is per squadRequestId+roleId, so we send one entry
      // and let headcount be metadata; the server handles it as a single role)
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
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Define Roles & Skills</h2>
      <p className="text-sm text-gray-500 mb-4">
        Select required roles, set headcount, and configure skills with proficiency levels.
      </p>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-2 mb-5 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <span className="text-xs font-medium text-gray-500 mr-1 self-center">Roles:</span>
        {availableRoles.map((role) => {
          const colour = getRoleColour(role.name);
          return (
            <span key={role.id} className="inline-flex items-center gap-1.5 text-xs">
              <span className={`h-2.5 w-2.5 rounded-full ${colour.dot}`} />
              <span className={`capitalize ${colour.text} font-medium`}>{role.name}</span>
            </span>
          );
        })}
      </div>

      {error && (
        <div
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
          data-testid="define-roles-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Role cards */}
      <div className="space-y-3">
        {availableRoles.map((role) => {
          const isSelected = selectedRoles.some((r) => r.roleId === role.id);
          const selectedRole = selectedRoles.find((r) => r.roleId === role.id);
          const colour = getRoleColour(role.name);
          const matchingCandidates = getCandidatesForRole(role.name);

          return (
            <div
              key={role.id}
              className={`border rounded-lg transition-colors ${
                isSelected ? `${colour.border} ${colour.bg}` : 'border-gray-200'
              }`}
              data-testid={`role-card-${role.id}`}
            >
              {/* Role header with checkbox */}
              <div className="flex items-center gap-3 p-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleRole(role)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  id={`role-check-${role.id}`}
                  data-testid={`role-checkbox-${role.id}`}
                />
                <label htmlFor={`role-check-${role.id}`} className="flex-1 cursor-pointer">
                  <span className={`font-medium capitalize ${colour.text}`}>{role.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {role.skills.length} skills · {matchingCandidates.length} available
                  </span>
                </label>

                {/* Headcount selector (only when selected) */}
                {isSelected && selectedRole && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">×</span>
                    <button
                      type="button"
                      onClick={() => updateHeadcount(role.id, selectedRole.headcount - 1)}
                      disabled={selectedRole.headcount <= 1}
                      className="h-6 w-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 text-sm"
                      aria-label="Decrease headcount"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold w-5 text-center" data-testid={`headcount-${role.id}`}>
                      {selectedRole.headcount}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateHeadcount(role.id, selectedRole.headcount + 1)}
                      disabled={selectedRole.headcount >= 10}
                      className="h-6 w-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 text-sm"
                      aria-label="Increase headcount"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded section when role is selected */}
              {isSelected && selectedRole && (
                <div className="px-3 pb-3 border-t border-gray-100/60">
                  {/* Matching candidates — scrollable horizontal strip */}
                  {matchingCandidates.length > 0 && (
                    <div className="mt-2 mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">
                        Available team members ({matchingCandidates.length})
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1" style={{ maxHeight: '120px' }}>
                        {matchingCandidates.map((candidate) => (
                          <CandidateMiniCard
                            key={candidate.id}
                            candidate={candidate}
                            colour={colour}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Validation error */}
                  {validationErrors[role.id] && (
                    <p className="text-red-500 text-sm mt-2" data-testid={`role-error-${role.id}`}>
                      {validationErrors[role.id]}
                    </p>
                  )}

                  {/* Skills list — compact */}
                  <details className="mt-2" open>
                    <summary className="text-xs font-medium text-gray-500 cursor-pointer select-none">
                      Skills configuration ({selectedRole.skills.length})
                    </summary>
                    <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                      {selectedRole.skills.map((skill, skillIndex) => (
                        <div
                          key={`${skill.skillId ?? 'custom'}-${skillIndex}`}
                          className="flex items-center gap-2 p-1.5 bg-white rounded border border-gray-100 text-sm"
                          data-testid={`skill-row-${role.id}-${skillIndex}`}
                        >
                          <span className="text-gray-700 flex-1 truncate text-xs">
                            {skill.name}
                            {skill.isCustom && (
                              <span className="ml-1 text-gray-400">(custom)</span>
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateSkillCategory(
                                role.id,
                                skillIndex,
                                skill.category === 'mandatory' ? 'preferred' : 'mandatory'
                              )
                            }
                            className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium transition-colors ${
                              skill.category === 'mandatory'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                            data-testid={`skill-category-${role.id}-${skillIndex}`}
                            aria-label={`Toggle category: currently ${skill.category}`}
                          >
                            {skill.category}
                          </button>

                          <ProficiencySelector
                            level={skill.requiredProficiency}
                            onChange={(level) => updateSkillProficiency(role.id, skillIndex, level)}
                          />

                          {skill.isCustom && (
                            <button
                              type="button"
                              onClick={() => removeCustomSkill(role.id, skillIndex)}
                              className="text-gray-400 hover:text-red-500 text-xs"
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
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={selectedRole.customSkillInput}
                        onChange={(e) => updateCustomSkillInput(role.id, e.target.value)}
                        placeholder="Add custom skill..."
                        maxLength={200}
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        data-testid={`custom-skill-input-${role.id}`}
                      />
                      <button
                        type="button"
                        onClick={() => addCustomSkill(role.id)}
                        disabled={
                          selectedRole.customSkillInput.trim().length < 1 ||
                          selectedRole.customSkillInput.trim().length > 200
                        }
                        className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        data-testid={`add-custom-skill-btn-${role.id}`}
                      >
                        + Add
                      </button>
                    </div>
                  </details>
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface CandidateMiniCardProps {
  candidate: CandidateResponse;
  colour: { bg: string; border: string; text: string; dot: string };
}

/** Compact candidate card shown in the scrollable strip. */
function CandidateMiniCard({ candidate, colour }: CandidateMiniCardProps) {
  const topSkills = candidate.skills.slice(0, 3);

  return (
    <div
      className={`flex-shrink-0 w-40 rounded-lg border p-2 ${colour.border} bg-white`}
      data-testid={`mini-candidate-${candidate.id}`}
    >
      <p className="text-xs font-semibold text-gray-800 truncate">{candidate.name}</p>
      <p className="text-[10px] text-gray-500 truncate">{candidate.currentTeam}</p>
      <div className="mt-1 flex flex-wrap gap-0.5">
        {topSkills.map((s) => (
          <span
            key={s.id}
            className={`inline-block px-1 py-0.5 rounded text-[9px] font-medium ${colour.bg} ${colour.text}`}
          >
            {s.skill.name}
          </span>
        ))}
        {candidate.skills.length > 3 && (
          <span className="text-[9px] text-gray-400">+{candidate.skills.length - 3}</span>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
        <span>{candidate.yearsExperience}y exp</span>
        <span>{candidate.capacityFree}% free</span>
      </div>
    </div>
  );
}

export default DefineRolesStep;
