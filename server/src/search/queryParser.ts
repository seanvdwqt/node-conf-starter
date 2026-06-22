/**
 * Query Parser / Tokenizer for Instant Squad Search.
 *
 * Tokenizes a natural-language input string into structured criteria:
 * - Role keywords (mapped to predefined roles via synonym matching)
 * - Skill keywords (matched against the predefined skill list)
 * - Quantity indicators (e.g. "2 engineers" → engineer × 2)
 * - Urgency signals (e.g. "urgent", "ASAP", "immediately")
 *
 * Uses case-insensitive matching with synonym mapping.
 * All processing is keyword-based — no AI, ML, or external NLP services.
 *
 * Requirements: 11.3, 11.8
 */

import type { UrgencyLevel } from '../scoring/types.js';

/** A parsed role with its requested quantity */
export interface ParsedRole {
  name: string;
  quantity: number;
}

/** The structured output of the query parser */
export interface ParsedQuery {
  roles: ParsedRole[];
  skills: string[];
  urgency: UrgencyLevel | null;
  signals: string[];
}

/**
 * Synonym mapping for role keywords.
 * Maps common abbreviations and variations to canonical role names.
 */
const ROLE_SYNONYMS: Record<string, string> = {
  architect: 'architect',
  architects: 'architect',
  'solution architect': 'architect',
  'solutions architect': 'architect',
  'technical architect': 'architect',
  'cloud architect': 'architect',
  'system architect': 'architect',
  'systems architect': 'architect',

  engineer: 'engineer',
  engineers: 'engineer',
  developer: 'engineer',
  developers: 'engineer',
  dev: 'engineer',
  devs: 'engineer',
  'software engineer': 'engineer',
  'software engineers': 'engineer',
  'frontend developer': 'engineer',
  'frontend engineer': 'engineer',
  'backend developer': 'engineer',
  'backend engineer': 'engineer',
  'full stack': 'engineer',
  fullstack: 'engineer',
  'full-stack': 'engineer',
  coder: 'engineer',
  programmer: 'engineer',
  programmers: 'engineer',

  tester: 'tester',
  testers: 'tester',
  qa: 'tester',
  'qa engineer': 'tester',
  'qa engineers': 'tester',
  'quality assurance': 'tester',
  'quality engineer': 'tester',
  'quality engineers': 'tester',
  'test engineer': 'tester',
  'test engineers': 'tester',
  'test analyst': 'tester',
  'test analysts': 'tester',
  'automation engineer': 'tester',
  'automation tester': 'tester',
  sdet: 'tester',

  'data specialist': 'data specialist',
  'data specialists': 'data specialist',
  'data engineer': 'data specialist',
  'data engineers': 'data specialist',
  'data analyst': 'data specialist',
  'data analysts': 'data specialist',
  'data scientist': 'data specialist',
  dba: 'data specialist',
  'database administrator': 'data specialist',
  'bi developer': 'data specialist',
  'bi analyst': 'data specialist',

  'business analyst': 'business analyst',
  'business analysts': 'business analyst',
  ba: 'business analyst',
  analyst: 'business analyst',
  analysts: 'business analyst',
  'systems analyst': 'business analyst',
  'system analyst': 'business analyst',
  'requirements analyst': 'business analyst',
  'product analyst': 'business analyst',

  'delivery lead': 'delivery lead',
  'delivery leads': 'delivery lead',
  'delivery manager': 'delivery lead',
  'delivery managers': 'delivery lead',
  'scrum master': 'delivery lead',
  'scrum masters': 'delivery lead',
  'project manager': 'delivery lead',
  'project managers': 'delivery lead',
  'product owner': 'delivery lead',
  'product owners': 'delivery lead',
  pm: 'delivery lead',
  po: 'delivery lead',
  'agile coach': 'delivery lead',
  'team lead': 'delivery lead',
  'team leads': 'delivery lead',
  'tech lead': 'delivery lead',
  'tech leads': 'delivery lead',
};

/**
 * Predefined skill keywords for matching.
 * Case-insensitive matching is used.
 */
const SKILL_KEYWORDS: string[] = [
  'Solution Design',
  'Cloud Architecture',
  'System Integration',
  'Technical Leadership',
  'Security Architecture',
  'TypeScript',
  'React',
  'Node.js',
  'REST APIs',
  'SQL',
  'Git',
  'Test Automation',
  'Performance Testing',
  'API Testing',
  'Test Strategy',
  'Exploratory Testing',
  'Data Modelling',
  'ETL Pipelines',
  'Python',
  'Data Governance',
  'Business Intelligence',
  'Requirements Gathering',
  'Process Mapping',
  'Stakeholder Management',
  'User Story Writing',
  'Data Analysis',
  'Agile Delivery',
  'Risk Management',
  'Team Coordination',
  'Dependency Management',
  'Reporting',
];

/**
 * Urgency signal keywords mapped to urgency levels.
 * Ordered by specificity — multi-word signals checked first via includes.
 */
const HIGH_URGENCY_SIGNALS = ['right now', 'right away', 'high priority', 'asap', 'immediately', 'urgent', 'urgently', 'critical'];
const MEDIUM_URGENCY_SIGNALS = ['next week', 'soon'];
const LOW_URGENCY_SIGNALS = ['when possible', 'no rush', 'low priority'];

/**
 * Common skill abbreviations mapped to canonical skill names.
 */
const SKILL_ABBREVIATIONS: Record<string, string> = {
  node: 'Node.js',
  nodejs: 'Node.js',
  ts: 'TypeScript',
  api: 'REST APIs',
  apis: 'REST APIs',
  etl: 'ETL Pipelines',
  agile: 'Agile Delivery',
  cloud: 'Cloud Architecture',
  security: 'Security Architecture',
};

/**
 * Parses a natural-language query string into structured search criteria.
 *
 * @param query - The raw user input text
 * @returns A ParsedQuery with extracted roles, skills, urgency, and signals
 */
export function parseQuery(query: string): ParsedQuery {
  const result: ParsedQuery = {
    roles: [],
    skills: [],
    urgency: null,
    signals: [],
  };

  if (!query || query.trim().length === 0) {
    return result;
  }

  const normalised = query.toLowerCase().trim();

  // --- Extract urgency signals ---
  result.urgency = extractUrgency(normalised, result.signals);

  // --- Extract roles with quantities ---
  result.roles = extractRoles(normalised);

  // --- Extract skill keywords ---
  result.skills = extractSkills(normalised);

  return result;
}

/**
 * Extract urgency level and populate signals array.
 */
function extractUrgency(normalised: string, signals: string[]): UrgencyLevel | null {
  for (const signal of HIGH_URGENCY_SIGNALS) {
    if (normalised.includes(signal)) {
      signals.push(signal);
      return 'high';
    }
  }
  for (const signal of MEDIUM_URGENCY_SIGNALS) {
    if (normalised.includes(signal)) {
      signals.push(signal);
      return 'medium';
    }
  }
  for (const signal of LOW_URGENCY_SIGNALS) {
    if (normalised.includes(signal)) {
      signals.push(signal);
      return 'low';
    }
  }
  return null;
}

/**
 * Extract roles from the input, including quantity indicators.
 * Handles patterns like "2 engineers", "an architect", "a tester".
 * Uses range tracking to prevent double-counting when both plural and
 * singular synonyms would match the same text span.
 */
function extractRoles(normalised: string): ParsedRole[] {
  const roleMap = new Map<string, number>();
  // Track matched character ranges to avoid double-counting
  const matchedRanges: { start: number; end: number }[] = [];

  function overlaps(start: number, end: number): boolean {
    return matchedRanges.some((r) => start < r.end && end > r.start);
  }

  // Sort synonyms by length (longest first) so multi-word synonyms match first
  const sortedSynonyms = Object.keys(ROLE_SYNONYMS).sort(
    (a, b) => b.length - a.length,
  );

  for (const synonym of sortedSynonyms) {
    const escaped = escapeRegex(synonym);
    const canonicalRole = ROLE_SYNONYMS[synonym];

    // Try quantity pattern: "2 engineers"
    const qtyRegex = new RegExp(`(\\d+)\\s+${escaped}\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = qtyRegex.exec(normalised)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (!overlaps(start, end)) {
        const qty = parseInt(match[1], 10);
        const existing = roleMap.get(canonicalRole) ?? 0;
        roleMap.set(canonicalRole, Math.max(existing, qty));
        matchedRanges.push({ start, end });
      }
    }

    // Try article pattern: "an architect", "a tester"
    const articleRegex = new RegExp(`\\b(?:an?|one)\\s+${escaped}\\b`, 'gi');
    while ((match = articleRegex.exec(normalised)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (!overlaps(start, end)) {
        if (!roleMap.has(canonicalRole)) {
          roleMap.set(canonicalRole, 1);
        }
        matchedRanges.push({ start, end });
      }
    }

    // Try standalone mention: "architect", "tester"
    const standaloneRegex = new RegExp(`\\b${escaped}\\b`, 'gi');
    while ((match = standaloneRegex.exec(normalised)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (!overlaps(start, end)) {
        if (!roleMap.has(canonicalRole)) {
          roleMap.set(canonicalRole, 1);
        }
        matchedRanges.push({ start, end });
      }
    }
  }

  return Array.from(roleMap.entries()).map(([name, quantity]) => ({ name, quantity }));
}

/**
 * Extract skills from the input using case-insensitive matching
 * against the predefined skill list and common abbreviations.
 */
function extractSkills(normalised: string): string[] {
  const matched: string[] = [];

  // Direct skill name matching
  for (const skill of SKILL_KEYWORDS) {
    const skillLower = skill.toLowerCase();
    if (skillLower.includes(' ')) {
      // Multi-word skill: substring match
      if (normalised.includes(skillLower)) {
        matched.push(skill);
      }
    } else {
      // Single-word skill: word boundary match
      const regex = new RegExp(`\\b${escapeRegex(skillLower)}\\b`, 'i');
      if (regex.test(normalised)) {
        matched.push(skill);
      }
    }
  }

  // Abbreviation matching
  for (const [abbrev, skillName] of Object.entries(SKILL_ABBREVIATIONS)) {
    if (!matched.includes(skillName)) {
      const regex = new RegExp(`\\b${escapeRegex(abbrev)}\\b`, 'i');
      if (regex.test(normalised)) {
        matched.push(skillName);
      }
    }
  }

  return matched;
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
