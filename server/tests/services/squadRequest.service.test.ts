import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  create,
  getById,
  updateRoles,
  saveSquad,
  finalise,
  NotFoundError,
  ValidationFailedError,
  InvalidStateError,
} from '../../src/services/squadRequest.service.js';

// Mock prisma
vi.mock('../../src/lib/prisma.js', () => {
  const mockPrisma = {
    squadRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    requestSkill: {
      deleteMany: vi.fn(),
    },
    requestRole: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    squadSelection: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
  return { default: mockPrisma };
});

// Import the mocked prisma
import prisma from '../../src/lib/prisma.js';
const mockPrisma = vi.mocked(prisma, true);

// Helper to create valid input
function validInput() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    title: 'Test Squad Request',
    businessUnit: 'Digital Platforms',
    objective: 'Build a new feature',
    urgency: 'medium',
    startDate: tomorrow.toISOString().split('T')[0],
    durationWeeks: 4,
    requiredCapacity: 50,
  };
}

describe('squadRequest.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('creates a squad request with status "draft"', async () => {
      const input = validInput();
      const createdRecord = {
        id: 'uuid-1',
        ...input,
        startDate: new Date(input.startDate),
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.squadRequest.create.mockResolvedValue(createdRecord);

      const result = await create(input);

      expect(result.status).toBe('draft');
      expect(mockPrisma.squadRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: input.title,
          businessUnit: 'Digital Platforms',
          status: 'draft',
        }),
      });
    });

    it('throws ValidationFailedError for invalid input', async () => {
      const input = { ...validInput(), title: '' };
      await expect(create(input)).rejects.toThrow(ValidationFailedError);
    });

    it('throws ValidationFailedError for wrong business unit', async () => {
      const input = { ...validInput(), businessUnit: 'Other Unit' };
      await expect(create(input)).rejects.toThrow(ValidationFailedError);
    });

    it('enforces business unit "Digital Platforms"', async () => {
      const input = { ...validInput(), businessUnit: 'Marketing' };
      try {
        await create(input);
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationFailedError);
        expect((err as ValidationFailedError).errors[0].field).toBe('businessUnit');
      }
    });
  });

  describe('getById', () => {
    it('returns squad request with all relations', async () => {
      const mockResult = {
        id: 'uuid-1',
        title: 'Test',
        businessUnit: 'Digital Platforms',
        objective: 'Test',
        urgency: 'medium',
        startDate: new Date(),
        durationWeeks: 4,
        requiredCapacity: 50,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [],
        selections: [],
      };

      mockPrisma.squadRequest.findUnique.mockResolvedValue(mockResult);

      const result = await getById('uuid-1');

      expect(result.id).toBe('uuid-1');
      expect(mockPrisma.squadRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        include: expect.objectContaining({
          roles: expect.any(Object),
          selections: expect.any(Object),
        }),
      });
    });

    it('throws NotFoundError when request does not exist', async () => {
      mockPrisma.squadRequest.findUnique.mockResolvedValue(null);

      await expect(getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateRoles', () => {
    it('replaces roles for a draft request', async () => {
      const existing = {
        id: 'uuid-1',
        title: 'Test',
        businessUnit: 'Digital Platforms',
        objective: 'Test',
        urgency: 'medium',
        startDate: new Date(),
        durationWeeks: 4,
        requiredCapacity: 50,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [{ id: 'role-1', squadRequestId: 'uuid-1', roleId: 'r1' }],
      };

      // First call for existence check
      mockPrisma.squadRequest.findUnique
        .mockResolvedValueOnce(existing)
        // Second call from getById at the end
        .mockResolvedValueOnce({ ...existing, roles: [], selections: [] });

      mockPrisma.requestSkill.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.requestRole.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.requestRole.create.mockResolvedValue({
        id: 'new-role-1',
        squadRequestId: 'uuid-1',
        roleId: 'role-id',
      });

      const roles = [
        {
          roleId: 'role-id',
          skills: [{ skillId: 'skill-1', priority: 'mandatory' as const }],
        },
      ];

      await updateRoles('uuid-1', roles);

      expect(mockPrisma.requestSkill.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.requestRole.deleteMany).toHaveBeenCalledWith({
        where: { squadRequestId: 'uuid-1' },
      });
      expect(mockPrisma.requestRole.create).toHaveBeenCalled();
    });

    it('throws NotFoundError for nonexistent request', async () => {
      mockPrisma.squadRequest.findUnique.mockResolvedValue(null);

      await expect(updateRoles('nonexistent', [])).rejects.toThrow(NotFoundError);
    });

    it('throws InvalidStateError for finalised request', async () => {
      mockPrisma.squadRequest.findUnique.mockResolvedValue({
        id: 'uuid-1',
        title: 'Test',
        businessUnit: 'Digital Platforms',
        objective: 'Test',
        urgency: 'medium',
        startDate: new Date(),
        durationWeeks: 4,
        requiredCapacity: 50,
        status: 'finalised',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [],
      });

      await expect(updateRoles('uuid-1', [])).rejects.toThrow(InvalidStateError);
    });
  });

  describe('saveSquad', () => {
    it('saves selections and updates status to "assembled"', async () => {
      const existing = {
        id: 'uuid-1',
        title: 'Test',
        businessUnit: 'Digital Platforms',
        objective: 'Test',
        urgency: 'medium',
        startDate: new Date(),
        durationWeeks: 4,
        requiredCapacity: 50,
        status: 'recommended',
        createdAt: new Date(),
        updatedAt: new Date(),
        selections: [],
      };

      mockPrisma.squadRequest.findUnique
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ ...existing, status: 'assembled', roles: [], selections: [] });

      mockPrisma.squadSelection.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.squadSelection.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.squadRequest.update.mockResolvedValue({ ...existing, status: 'assembled' });

      const selections = [
        { requestRoleId: 'rr-1', candidateId: 'c-1' },
        { requestRoleId: 'rr-2', candidateId: 'c-2' },
      ];

      await saveSquad('uuid-1', selections);

      expect(mockPrisma.squadSelection.deleteMany).toHaveBeenCalledWith({
        where: { squadRequestId: 'uuid-1' },
      });
      expect(mockPrisma.squadSelection.createMany).toHaveBeenCalled();
      expect(mockPrisma.squadRequest.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { status: 'assembled' },
      });
    });

    it('throws ValidationFailedError when exceeding max 20 selections', async () => {
      const existing = {
        id: 'uuid-1',
        title: 'Test',
        businessUnit: 'Digital Platforms',
        objective: 'Test',
        urgency: 'medium',
        startDate: new Date(),
        durationWeeks: 4,
        requiredCapacity: 50,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        selections: [],
      };

      mockPrisma.squadRequest.findUnique.mockResolvedValue(existing);

      const selections = Array.from({ length: 21 }, (_, i) => ({
        requestRoleId: `rr-${i}`,
        candidateId: `c-${i}`,
      }));

      await expect(saveSquad('uuid-1', selections)).rejects.toThrow(ValidationFailedError);
    });

    it('throws InvalidStateError for finalised request', async () => {
      mockPrisma.squadRequest.findUnique.mockResolvedValue({
        id: 'uuid-1',
        title: 'Test',
        businessUnit: 'Digital Platforms',
        objective: 'Test',
        urgency: 'medium',
        startDate: new Date(),
        durationWeeks: 4,
        requiredCapacity: 50,
        status: 'finalised',
        createdAt: new Date(),
        updatedAt: new Date(),
        selections: [],
      });

      await expect(saveSquad('uuid-1', [])).rejects.toThrow(InvalidStateError);
    });
  });

  describe('finalise', () => {
    it('sets status to "finalised" when all roles have selections', async () => {
      const existing = {
        id: 'uuid-1',
        title: 'Test',
        businessUnit: 'Digital Platforms',
        objective: 'Test',
        urgency: 'medium',
        startDate: new Date(),
        durationWeeks: 4,
        requiredCapacity: 50,
        status: 'assembled',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          { id: 'rr-1', squadRequestId: 'uuid-1', roleId: 'r1', selections: [{ id: 's-1' }] },
        ],
        selections: [{ id: 's-1' }],
      };

      mockPrisma.squadRequest.findUnique
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ ...existing, status: 'finalised', roles: [], selections: [] });

      mockPrisma.squadRequest.update.mockResolvedValue({ ...existing, status: 'finalised' });

      const result = await finalise('uuid-1');

      expect(mockPrisma.squadRequest.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { status: 'finalised' },
      });
    });

    it('throws InvalidStateError when not in assembled state', async () => {
      mockPrisma.squadRequest.findUnique.mockResolvedValue({
        id: 'uuid-1',
        title: 'Test',
        businessUnit: 'Digital Platforms',
        objective: 'Test',
        urgency: 'medium',
        startDate: new Date(),
        durationWeeks: 4,
        requiredCapacity: 50,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [],
        selections: [],
      });

      await expect(finalise('uuid-1')).rejects.toThrow(InvalidStateError);
    });

    it('throws InvalidStateError when mandatory roles are unfilled', async () => {
      mockPrisma.squadRequest.findUnique.mockResolvedValue({
        id: 'uuid-1',
        title: 'Test',
        businessUnit: 'Digital Platforms',
        objective: 'Test',
        urgency: 'medium',
        startDate: new Date(),
        durationWeeks: 4,
        requiredCapacity: 50,
        status: 'assembled',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [
          { id: 'rr-1', squadRequestId: 'uuid-1', roleId: 'r1', selections: [] },
        ],
        selections: [],
      });

      await expect(finalise('uuid-1')).rejects.toThrow(InvalidStateError);
    });

    it('throws NotFoundError for nonexistent request', async () => {
      mockPrisma.squadRequest.findUnique.mockResolvedValue(null);

      await expect(finalise('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});
