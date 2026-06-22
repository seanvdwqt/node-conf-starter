/**
 * Squad Request Service
 *
 * Business logic for squad request lifecycle operations:
 * create, getById, updateRoles, saveSquad, finalise.
 *
 * Enforces the "Digital Platforms" business unit restriction
 * and validates state transitions.
 *
 * Requirements: 1.1, 1.2, 1.7, 2.1, 7.1, 8.3
 */

import prisma from '../lib/prisma.js';
import { validateSquadRequest, type ValidationError } from '../validation/squadRequest.js';

const REQUIRED_BUSINESS_UNIT = 'Digital Platforms';
const MAX_SQUAD_SELECTIONS = 20;

// --- Custom error classes ---

export class NotFoundError extends Error {
  status = 404;
  code = 'NOT_FOUND';

  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationFailedError extends Error {
  status = 400;
  code = 'VALIDATION_ERROR';
  errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationFailedError';
    this.errors = errors;
  }
}

export class InvalidStateError extends Error {
  status = 409;
  code = 'INVALID_STATE';
  currentState: string;
  requiredCondition: string;

  constructor(currentState: string, requiredCondition: string) {
    super(
      `Invalid state transition: current state is "${currentState}". ${requiredCondition}`,
    );
    this.name = 'InvalidStateError';
    this.currentState = currentState;
    this.requiredCondition = requiredCondition;
  }
}

// --- Input types ---

export interface CreateSquadRequestInput {
  title: string;
  businessUnit: string;
  objective: string;
  urgency: string;
  startDate: string;
  durationWeeks: number;
  requiredCapacity: number;
}

export interface RoleSkillInput {
  skillId: string | null;
  name?: string;
  priority?: 'mandatory' | 'preferred';
  category?: 'mandatory' | 'preferred';
  requiredProficiency?: number;
  isCustom?: boolean;
  customName?: string;
  customDescription?: string;
}

export interface RoleInput {
  roleId: string;
  skills: RoleSkillInput[];
}

export interface SelectionInput {
  requestRoleId: string;
  candidateId: string;
}

// --- Service functions ---

/**
 * Creates a new squad request with status "draft".
 * Enforces business unit = "Digital Platforms".
 *
 * Requirements: 1.1, 1.2, 1.7, 2.1
 */
export async function create(data: CreateSquadRequestInput) {
  // Validate input fields
  const errors = validateSquadRequest(data);
  if (errors.length > 0) {
    throw new ValidationFailedError(errors);
  }

  // Enforce business unit restriction
  if (data.businessUnit !== REQUIRED_BUSINESS_UNIT) {
    throw new ValidationFailedError([
      {
        field: 'businessUnit',
        message: `Only the "${REQUIRED_BUSINESS_UNIT}" business unit is supported in this prototype`,
      },
    ]);
  }

  const squadRequest = await prisma.squadRequest.create({
    data: {
      title: data.title,
      businessUnit: data.businessUnit,
      objective: data.objective,
      urgency: data.urgency,
      startDate: new Date(data.startDate),
      durationWeeks: data.durationWeeks,
      requiredCapacity: data.requiredCapacity,
      status: 'draft',
    },
  });

  return squadRequest;
}

/**
 * Fetches a squad request by ID with all relations:
 * roles (with skills), selections (with candidates).
 *
 * Requirements: 1.1, 7.1
 */
export async function getById(id: string) {
  const squadRequest = await prisma.squadRequest.findUnique({
    where: { id },
    include: {
      roles: {
        include: {
          role: true,
          skills: {
            include: {
              skill: true,
            },
          },
          selections: {
            include: {
              candidate: true,
            },
          },
        },
      },
      selections: {
        include: {
          candidate: true,
          requestRole: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (!squadRequest) {
    throw new NotFoundError('SquadRequest', id);
  }

  return squadRequest;
}

/**
 * Replaces the roles and skills for a squad request.
 * Deletes existing RequestRoles (and cascading RequestSkills), then creates new ones.
 *
 * Requirements: 1.2, 2.1
 */
export async function updateRoles(id: string, roles: RoleInput[]) {
  // Verify the squad request exists
  const existing = await prisma.squadRequest.findUnique({
    where: { id },
    include: { roles: true },
  });

  if (!existing) {
    throw new NotFoundError('SquadRequest', id);
  }

  // Only allow role updates in draft or recommended state
  if (existing.status !== 'draft' && existing.status !== 'recommended') {
    throw new InvalidStateError(
      existing.status,
      'Roles can only be updated when the request is in "draft" or "recommended" state.',
    );
  }

  // Delete existing request skills first (child records)
  const existingRoleIds = existing.roles.map((r) => r.id);
  if (existingRoleIds.length > 0) {
    await prisma.requestSkill.deleteMany({
      where: { requestRoleId: { in: existingRoleIds } },
    });
  }

  // Delete existing request roles
  await prisma.requestRole.deleteMany({
    where: { squadRequestId: id },
  });

  // Create new roles with their skills
  for (const role of roles) {
    // Resolve skill IDs — for custom skills with null skillId, create a Skill record
    const resolvedSkills = [];
    for (const skill of role.skills) {
      let resolvedSkillId = skill.skillId;
      const isCustom = skill.isCustom ?? false;
      const customName = skill.customName ?? skill.customDescription ?? skill.name ?? null;

      if (!resolvedSkillId && isCustom && customName) {
        // Create or find a custom skill
        const existing = await prisma.skill.findUnique({ where: { name: customName } });
        if (existing) {
          resolvedSkillId = existing.id;
        } else {
          const created = await prisma.skill.create({
            data: { name: customName, category: 'other' },
          });
          resolvedSkillId = created.id;
        }
      }

      if (!resolvedSkillId) {
        // Skip skills without a valid ID (shouldn't happen for predefined skills)
        continue;
      }

      // Accept both 'priority' and 'category' field names from client
      const priority = skill.priority ?? skill.category ?? 'preferred';

      resolvedSkills.push({
        skillId: resolvedSkillId,
        priority,
        requiredProficiency: skill.requiredProficiency ?? 1,
        isCustom,
        customName: isCustom ? customName : null,
      });
    }

    await prisma.requestRole.create({
      data: {
        squadRequestId: id,
        roleId: role.roleId,
        skills: {
          create: resolvedSkills,
        },
      },
    });
  }

  // Return updated squad request with all relations
  return getById(id);
}

/**
 * Saves proposed squad selections (max 20 total).
 * Updates status to "assembled".
 *
 * Requirements: 7.1, 8.3
 */
export async function saveSquad(id: string, selections: SelectionInput[]) {
  // Verify the squad request exists
  const existing = await prisma.squadRequest.findUnique({
    where: { id },
    include: { selections: true },
  });

  if (!existing) {
    throw new NotFoundError('SquadRequest', id);
  }

  // Validate state — can save squad from draft, recommended, or assembled
  if (!['draft', 'recommended', 'assembled'].includes(existing.status)) {
    throw new InvalidStateError(
      existing.status,
      'Squad can only be saved when the request is in "draft", "recommended", or "assembled" state.',
    );
  }

  // Enforce max 20 selections
  if (selections.length > MAX_SQUAD_SELECTIONS) {
    throw new ValidationFailedError([
      {
        field: 'selections',
        message: `A maximum of ${MAX_SQUAD_SELECTIONS} candidates can be selected for a squad`,
      },
    ]);
  }

  // Delete existing selections and replace
  await prisma.squadSelection.deleteMany({
    where: { squadRequestId: id },
  });

  // Create new selections
  if (selections.length > 0) {
    await prisma.squadSelection.createMany({
      data: selections.map((selection) => ({
        squadRequestId: id,
        requestRoleId: selection.requestRoleId,
        candidateId: selection.candidateId,
      })),
    });
  }

  // Update status to "assembled"
  await prisma.squadRequest.update({
    where: { id },
    data: { status: 'assembled' },
  });

  return getById(id);
}

/**
 * Finalises a squad request.
 * Validates all mandatory roles are filled, sets status to "finalised".
 *
 * Requirements: 8.3
 */
export async function finalise(id: string) {
  // Fetch with roles and selections
  const existing = await prisma.squadRequest.findUnique({
    where: { id },
    include: {
      roles: {
        include: {
          selections: true,
        },
      },
      selections: true,
    },
  });

  if (!existing) {
    throw new NotFoundError('SquadRequest', id);
  }

  // Validate state — must be assembled to finalise
  if (existing.status !== 'assembled') {
    throw new InvalidStateError(
      existing.status,
      'Request must be in "assembled" state to be finalised.',
    );
  }

  // Validate all mandatory roles have at least one selected candidate
  const unfilledRoles = existing.roles.filter(
    (role) => role.selections.length === 0,
  );

  if (unfilledRoles.length > 0) {
    throw new InvalidStateError(
      existing.status,
      `All mandatory roles must have at least one selected candidate. Unfilled roles: ${unfilledRoles.length}`,
    );
  }

  // Update status to "finalised"
  await prisma.squadRequest.update({
    where: { id },
    data: { status: 'finalised' },
  });

  return getById(id);
}
