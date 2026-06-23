/**
 * Swipe Squad Selector — Type definitions
 *
 * Validates: Requirements 7.1, 9.1, 9.2, 9.3
 */

// --- Availability ---

export type Availability = 'available' | 'partially_available' | 'unavailable';

// --- Candidate Data Models ---

export interface CandidateSkill {
  id: string;
  name: string;
  category: string;
  proficiency: 1 | 2 | 3;
}

export interface CandidateProject {
  id: string;
  projectName: string;
  rolePlayed: string;
}

export interface SwipeCandidate {
  id: string;
  name: string;
  email: string;
  currentRole: string;
  businessUnit: string;
  capacityFree: number; // 0-100
  currentWorkload: number; // 0-100
  yearsExperience: number;
  currentTeam: string;
  skills: CandidateSkill[];
  projects: CandidateProject[];
  availability: Availability;
}

// --- Cart ---

export interface CartItem {
  candidateId: string;
  candidateName: string;
  role: string; // role they were browsed under
  addedAt: number; // timestamp for ordering
  candidate: SwipeCandidate; // full candidate data for review
}

// --- Roles ---

export interface RoleSkill {
  id: string;
  skillId: string;
  skill: {
    id: string;
    name: string;
    category: string;
  };
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  colour: string; // Tailwind colour class
  skills: RoleSkill[];
}

// --- Swipe Gesture ---

export interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
}

export interface SwipeOptions {
  threshold: number; // px distance to trigger swipe (default: 100)
  velocityThreshold: number; // px/ms to trigger quick flick (default: 0.5)
  preventScroll: boolean; // prevent page scroll during drag (default: true)
}

export interface SwipeState {
  offset: { x: number; y: number };
  direction: 'left' | 'right' | 'down' | null;
  isDragging: boolean;
  rotation: number; // degrees tilt based on horizontal offset
}

// --- Role Colour Mapping ---

export const ROLE_COLOUR_MAP: Record<string, string> = {
  architect: 'purple-500',
  engineer: 'blue-500',
  tester: 'green-500',
  'data specialist': 'amber-500',
  'business analyst': 'rose-500',
  'delivery lead': 'teal-500',
} as const;
