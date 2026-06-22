/**
 * API Client — Typed fetch wrappers for squad assembly endpoints.
 *
 * Base URL is configurable via the API_BASE_URL constant (defaults to http://localhost:3001/api).
 * All functions throw ApiError on non-2xx responses, preserving the server error structure.
 *
 * Requirements: 10.2
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

// ---------------------------------------------------------------------------
// Types — Request / Response payloads
// ---------------------------------------------------------------------------

/** Field-level validation error from the server. */
export interface FieldError {
  field: string;
  message: string;
}

/** Structured error envelope returned by the server. */
export interface ApiErrorBody {
  code: string;
  message: string;
  errors?: FieldError[];
  currentState?: string;
  requiredCondition?: string;
}

/** Squad request creation payload. */
export interface CreateSquadRequestPayload {
  title: string;
  businessUnit: string;
  objective: string;
  urgency: 'low' | 'medium' | 'high';
  startDate: string; // ISO date string
  durationWeeks: number;
  requiredCapacity: number;
}

/** Skill within a role definition. */
export interface RoleSkillPayload {
  skillId: string | null;
  name: string;
  category: 'mandatory' | 'preferred';
  requiredProficiency?: number;
  isCustom?: boolean;
  customDescription?: string;
}

/** Role with its skills for the update roles endpoint. */
export interface RolePayload {
  roleId: string;
  skills: RoleSkillPayload[];
}

/** Candidate selection for saving the proposed squad. */
export interface SquadSelectionPayload {
  roleId: string;
  candidateId: string;
}

/** Matched skill in a recommendation result. */
export interface MatchedSkill {
  name: string;
  proficiency: number;
  requiredProficiency: number;
}

/** Score breakdown entry for a single rule. */
export interface ScoreBreakdownEntry {
  rule: string;
  weight: number;
  contribution: number;
}

/** Previous project for a candidate. */
export interface CandidateProject {
  name: string;
  role: string;
}

/** Candidate recommendation result. */
export interface RecommendedCandidate {
  candidateId: string;
  name: string;
  matchScore: number;
  availability: 'available' | 'partially_available' | 'unavailable';
  workload: 'normal' | 'high';
  matchedSkills: MatchedSkill[];
  yearsExperience: number;
  currentTeam: string;
  previousProjects: CandidateProject[];
  explanation: string;
  scoreBreakdown: ScoreBreakdownEntry[];
}

/** Shortlist for a single role. */
export interface RoleShortlist {
  roleId: string;
  roleName: string;
  candidates: RecommendedCandidate[];
  hasGap: boolean;
}

/** Full recommendation response. */
export interface RecommendationResponse {
  shortlists: RoleShortlist[];
}

/** Squad request returned from the server. */
export interface SquadRequestResponse {
  id: string;
  title: string;
  businessUnit: string;
  objective: string;
  urgency: string;
  startDate: string;
  durationWeeks: number;
  requiredCapacity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  roles?: unknown[];
  selections?: unknown[];
}

/** Role with associated skills from GET /api/roles. */
export interface RoleWithSkills {
  id: string;
  name: string;
  skills: Array<{
    id: string;
    roleId: string;
    skillId: string;
    skill: {
      id: string;
      name: string;
      category: string;
    };
  }>;
}

/** Candidate skill record. */
export interface CandidateSkillRecord {
  id: string;
  candidateId: string;
  skillId: string;
  proficiency: number;
  skill: {
    id: string;
    name: string;
    category: string;
  };
}

/** Candidate from GET /api/candidates. */
export interface CandidateResponse {
  id: string;
  name: string;
  email: string;
  currentRole: string;
  businessUnit: string;
  capacityFree: number;
  currentWorkload: number;
  yearsExperience: number;
  currentTeam: string;
  createdAt: string;
  skills: CandidateSkillRecord[];
  projects: Array<{
    id: string;
    candidateId: string;
    projectName: string;
    rolePlayed: string;
  }>;
}

/** Finalise response. */
export interface FinaliseResponse {
  id: string;
  status: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

/**
 * Typed API error thrown when the server returns a non-2xx response.
 * Preserves the server error structure (code, message, errors array).
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly errors?: FieldError[];
  public readonly currentState?: string;
  public readonly requiredCondition?: string;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.errors = body.errors;
    this.currentState = body.currentState;
    this.requiredCondition = body.requiredCondition;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let body: ApiErrorBody;
    try {
      const json = await response.json();
      body = json.error ?? {
        code: 'UNKNOWN_ERROR',
        message: json.message ?? response.statusText,
      };
    } catch {
      body = {
        code: 'UNKNOWN_ERROR',
        message: response.statusText || `Request failed with status ${response.status}`,
      };
    }
    throw new ApiError(response.status, body);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Create a new squad request.
 * POST /api/squad-requests → 201
 */
export async function createSquadRequest(
  data: CreateSquadRequestPayload,
): Promise<SquadRequestResponse> {
  return request<SquadRequestResponse>('/squad-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update roles and skills for a squad request.
 * PATCH /api/squad-requests/:id/roles → 200
 */
export async function updateRoles(
  id: string,
  roles: RolePayload[],
): Promise<SquadRequestResponse> {
  return request<SquadRequestResponse>(`/squad-requests/${encodeURIComponent(id)}/roles`, {
    method: 'PATCH',
    body: JSON.stringify({ roles }),
  });
}

/**
 * Trigger the scoring engine and get ranked candidate recommendations.
 * POST /api/squad-requests/:id/recommend → 200
 */
export async function getRecommendations(id: string): Promise<RecommendationResponse> {
  return request<RecommendationResponse>(
    `/squad-requests/${encodeURIComponent(id)}/recommend`,
    { method: 'POST' },
  );
}

/**
 * Save the proposed squad selections.
 * PATCH /api/squad-requests/:id/squad → 200
 */
export async function saveSquad(
  id: string,
  selections: SquadSelectionPayload[],
): Promise<SquadRequestResponse> {
  return request<SquadRequestResponse>(`/squad-requests/${encodeURIComponent(id)}/squad`, {
    method: 'PATCH',
    body: JSON.stringify({ selections }),
  });
}

/**
 * Finalise a squad request (close it).
 * POST /api/squad-requests/:id/finalise → 200
 */
export async function finaliseRequest(id: string): Promise<FinaliseResponse> {
  return request<FinaliseResponse>(
    `/squad-requests/${encodeURIComponent(id)}/finalise`,
    { method: 'POST' },
  );
}

/**
 * Get all available roles with their predefined skills.
 * GET /api/roles → 200
 */
export async function getRoles(): Promise<RoleWithSkills[]> {
  return request<RoleWithSkills[]>('/roles', { method: 'GET' });
}

/**
 * Get all candidates in the talent pool.
 * GET /api/candidates → 200
 */
export async function getCandidates(): Promise<CandidateResponse[]> {
  return request<CandidateResponse[]>('/candidates', { method: 'GET' });
}
