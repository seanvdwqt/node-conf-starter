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
 *
 * Requirements: 1.1, 1.3, 1.7, 3.1, 5.1, 7.1, 7.3, 8.3
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
