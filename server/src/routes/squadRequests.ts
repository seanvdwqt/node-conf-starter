/**
 * Squad Requests API Routes
 *
 * Endpoints for the squad assembly workflow:
 * - POST   /squad-requests              — create a new squad request
 * - PATCH  /squad-requests/:id/roles    — update roles and skills
 * - POST   /squad-requests/:id/recommend — trigger scoring engine
 * - PATCH  /squad-requests/:id/squad    — save proposed squad selections
 * - POST   /squad-requests/:id/finalise — finalise the request
 * - GET    /roles                       — list all roles with skills
 * - GET    /candidates                  — list all candidates in the pool
 * - POST   /squad-search                — instant squad search via natural-language query
 *
 * Requirements: 1.1, 1.3, 1.7, 3.1, 5.1, 7.1, 7.3, 8.3, 11.3, 11.4, 11.6, 11.8
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import {
  create,
  updateRoles,
  saveSquad,
  finalise,
  NotFoundError,
  ValidationFailedError,
  InvalidStateError,
} from '../services/squadRequest.service.js';
import { generateRecommendations } from '../services/scoring.service.js';
import { parseQuery } from '../search/queryParser.js';
import { composeTeams } from '../search/teamComposer.js';
import type { CandidateContext, CandidateSkillInfo, CandidateProjectInfo, ProficiencyLevel } from '../scoring/types.js';

export const squadRequestsRouter = Router();

// --- Helper: map service errors to HTTP responses ---

function handleServiceError(err: unknown, res: Response): void {
  if (err instanceof ValidationFailedError) {
    res.status(400).json({
      error: {
        code: err.code,
        message: err.message,
        errors: err.errors,
      },
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof InvalidStateError) {
    res.status(409).json({
      error: {
        code: err.code,
        message: err.message,
        currentState: err.currentState,
        requiredCondition: err.requiredCondition,
      },
    });
    return;
  }

  // Unexpected error
  console.error('[INTERNAL_ERROR]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

// --- POST /squad-requests ---

squadRequestsRouter.post('/squad-requests', async (req: Request, res: Response) => {
  try {
    const squadRequest = await create(req.body);
    res.status(201).json(squadRequest);
  } catch (err) {
    handleServiceError(err, res);
  }
});

// --- PATCH /squad-requests/:id/roles ---

squadRequestsRouter.patch('/squad-requests/:id/roles', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;

    if (!roles || !Array.isArray(roles)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: [{ field: 'roles', message: 'roles must be a non-empty array' }],
        },
      });
      return;
    }

    const updated = await updateRoles(id, roles);
    res.status(200).json(updated);
  } catch (err) {
    handleServiceError(err, res);
  }
});

// --- POST /squad-requests/:id/recommend ---

squadRequestsRouter.post('/squad-requests/:id/recommend', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify the request exists first
    const existing = await prisma.squadRequest.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Squad request with id "${id}" not found`,
        },
      });
      return;
    }

    const result = await generateRecommendations(id);

    // Update status to "recommended"
    await prisma.squadRequest.update({
      where: { id },
      data: { status: 'recommended' },
    });

    res.status(200).json(result);
  } catch (err) {
    handleServiceError(err, res);
  }
});

// --- PATCH /squad-requests/:id/squad ---

squadRequestsRouter.patch('/squad-requests/:id/squad', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { selections } = req.body;

    if (!selections || !Array.isArray(selections)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: [{ field: 'selections', message: 'selections must be an array' }],
        },
      });
      return;
    }

    const updated = await saveSquad(id, selections);
    res.status(200).json(updated);
  } catch (err) {
    handleServiceError(err, res);
  }
});

// --- POST /squad-requests/:id/finalise ---

squadRequestsRouter.post('/squad-requests/:id/finalise', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await finalise(id);
    res.status(200).json(result);
  } catch (err) {
    handleServiceError(err, res);
  }
});

// --- GET /roles ---

squadRequestsRouter.get('/roles', async (_req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });
    res.status(200).json(roles);
  } catch (err) {
    handleServiceError(err, res);
  }
});

// --- GET /candidates ---

squadRequestsRouter.get('/candidates', async (_req: Request, res: Response) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        projects: true,
      },
    });
    res.status(200).json(candidates);
  } catch (err) {
    handleServiceError(err, res);
  }
});

// --- POST /squad-search ---

squadRequestsRouter.post('/squad-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    // Handle empty/missing query gracefully
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(200).json({
        parsed: { roles: [], skills: [], urgency: null, signals: [] },
        suggestions: [],
        message: 'No matches found. Try specifying roles or skills.',
      });
      return;
    }

    // 1. Parse the query string
    const parsed = parseQuery(query);

    // 2. If no roles and no skills are extracted, return helpful message
    if (parsed.roles.length === 0 && parsed.skills.length === 0) {
      res.status(200).json({
        parsed,
        suggestions: [],
        message: 'No matches found. Try specifying roles or skills.',
      });
      return;
    }

    // 3. Fetch all candidates from DB
    const dbCandidates = await prisma.candidate.findMany({
      where: { businessUnit: 'Digital Platforms' },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        projects: true,
      },
    });

    // 3b. Build a skill name → ID lookup map for accurate scoring
    const allSkills = await prisma.skill.findMany();
    const skillIdMap = new Map<string, string>();
    for (const skill of allSkills) {
      skillIdMap.set(skill.name.toLowerCase(), skill.id);
    }

    // 4. Map to CandidateContext objects
    const candidates: CandidateContext[] = dbCandidates.map((c) => {
      const skills: CandidateSkillInfo[] = c.skills.map((cs) => ({
        skillId: cs.skill.id,
        name: cs.skill.name,
        proficiency: cs.proficiency as ProficiencyLevel,
      }));

      const projects: CandidateProjectInfo[] = c.projects.map((cp) => ({
        projectName: cp.projectName,
        rolePlayed: cp.rolePlayed,
      }));

      return {
        id: c.id,
        name: c.name,
        currentRole: c.currentRole,
        businessUnit: c.businessUnit,
        skills,
        capacityFree: c.capacityFree,
        currentWorkload: c.currentWorkload,
        yearsExperience: c.yearsExperience,
        currentTeam: c.currentTeam,
        projects,
      };
    });

    // 5. Call composeTeams
    const suggestions = composeTeams(candidates, parsed, undefined, skillIdMap);

    // 6. Return parsed criteria + suggestions
    res.status(200).json({ parsed, suggestions });
  } catch (err) {
    handleServiceError(err, res);
  }
});
