import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- Fixed Roles ---
const ROLES = [
  "architect",
  "engineer",
  "tester",
  "data specialist",
  "business analyst",
  "delivery lead",
] as const;

// --- Skills by role (5 per role average, ~30 total) ---
const ROLE_SKILLS: Record<string, { name: string; category: string }[]> = {
  architect: [
    { name: "Solution Design", category: "technical" },
    { name: "Cloud Architecture", category: "technical" },
    { name: "System Integration", category: "technical" },
    { name: "Technical Leadership", category: "soft" },
    { name: "Security Architecture", category: "technical" },
  ],
  engineer: [
    { name: "TypeScript", category: "technical" },
    { name: "React", category: "technical" },
    { name: "Node.js", category: "technical" },
    { name: "REST APIs", category: "technical" },
    { name: "SQL", category: "technical" },
    { name: "Git", category: "technical" },
  ],
  tester: [
    { name: "Test Automation", category: "technical" },
    { name: "Performance Testing", category: "technical" },
    { name: "API Testing", category: "technical" },
    { name: "Test Strategy", category: "domain" },
    { name: "Exploratory Testing", category: "domain" },
  ],
  "data specialist": [
    { name: "Data Modelling", category: "technical" },
    { name: "ETL Pipelines", category: "technical" },
    { name: "Python", category: "technical" },
    { name: "Data Governance", category: "domain" },
    { name: "Business Intelligence", category: "domain" },
  ],
  "business analyst": [
    { name: "Requirements Gathering", category: "domain" },
    { name: "Process Mapping", category: "domain" },
    { name: "Stakeholder Management", category: "soft" },
    { name: "User Story Writing", category: "domain" },
    { name: "Data Analysis", category: "technical" },
  ],
  "delivery lead": [
    { name: "Agile Delivery", category: "domain" },
    { name: "Risk Management", category: "domain" },
    { name: "Team Coordination", category: "soft" },
    { name: "Dependency Management", category: "domain" },
    { name: "Reporting", category: "soft" },
  ],
};

// --- Teams ---
const TEAMS = [
  "Platform Core",
  "Digital Channels",
  "Data Engineering",
  "Cloud Infrastructure",
  "Mobile Banking",
  "API Services",
];

// --- Candidate first/last names ---
const FIRST_NAMES = [
  "Thabo",
  "Naledi",
  "Sipho",
  "Zanele",
  "Lungelo",
  "Ayanda",
  "Bongani",
  "Thandiwe",
  "Mandla",
  "Lindiwe",
  "Kagiso",
  "Nomvula",
  "Tshepo",
  "Palesa",
  "Sibusiso",
  "Nokuthula",
  "Lesego",
  "Mpho",
  "Kabelo",
  "Refilwe",
  "Tumelo",
  "Dineo",
  "Lerato",
  "Katlego",
  "Boitumelo",
  "Siyabonga",
  "Nompumelelo",
  "Thabang",
  "Amogelang",
  "Kamogelo",
  "Lwazi",
  "Nonhlanhla",
  "Sizwe",
  "Khanyisile",
  "Nhlanhla",
  "Busisiwe",
  "Vuyo",
  "Zinhle",
  "Mthunzi",
  "Andile",
];

const LAST_NAMES = [
  "Mokoena",
  "Nkosi",
  "Dlamini",
  "Ndlovu",
  "Mkhize",
  "Zulu",
  "Khumalo",
  "Mahlangu",
  "Sithole",
  "Radebe",
  "Molefe",
  "Maseko",
  "Cele",
  "Ngcobo",
  "Mthembu",
  "Shabalala",
  "Pillay",
  "Govender",
  "Van Wyk",
  "Botha",
];

// --- Previous project names ---
const PROJECT_NAMES = [
  "Digital Onboarding v2",
  "Payment Gateway Migration",
  "Mobile App Rewrite",
  "Core Banking API Refactor",
  "Data Lake Implementation",
  "Fraud Detection Platform",
  "Customer 360 Dashboard",
  "Microservices Decomposition",
  "Cloud Migration Phase 3",
  "Real-time Notifications",
  "Regulatory Reporting Engine",
  "Open Banking APIs",
  "DevOps Pipeline Automation",
  "Identity Verification System",
  "Lending Platform Modernisation",
  "Insurance Claims Portal",
  "Wealth Management Redesign",
  "Chatbot Integration",
  "Performance Optimisation Sprint",
  "Security Hardening Initiative",
];

const PROJECT_ROLES = [
  "Lead Engineer",
  "Senior Developer",
  "Solution Architect",
  "Technical Lead",
  "QA Lead",
  "Data Engineer",
  "Business Analyst",
  "Delivery Manager",
  "Scrum Master",
  "DevOps Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Test Automation Engineer",
  "Platform Engineer",
  "Integration Specialist",
];

// --- Deterministic pseudo-random using a simple seed-based approach ---
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const random = seededRandom(42);

function randomInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

function randomSample<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => random() - 0.5);
  return shuffled.slice(0, count);
}

async function main() {
  console.log("🌱 Seeding database...");

  // --- Seed Roles ---
  const roleRecords: Record<string, string> = {};
  for (const roleName of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roleRecords[roleName] = role.id;
  }
  console.log(`✅ Seeded ${ROLES.length} roles`);

  // --- Seed Skills (deduplicated across roles) ---
  const skillRecords: Record<string, string> = {};
  const allSkills = new Map<string, string>(); // name -> category

  for (const skills of Object.values(ROLE_SKILLS)) {
    for (const skill of skills) {
      allSkills.set(skill.name, skill.category);
    }
  }

  for (const [skillName, category] of allSkills) {
    const skill = await prisma.skill.upsert({
      where: { name: skillName },
      update: { category },
      create: { name: skillName, category },
    });
    skillRecords[skillName] = skill.id;
  }
  console.log(`✅ Seeded ${allSkills.size} skills`);

  // --- Seed RoleSkill associations ---
  let roleSkillCount = 0;
  for (const [roleName, skills] of Object.entries(ROLE_SKILLS)) {
    const roleId = roleRecords[roleName];
    for (const skill of skills) {
      const skillId = skillRecords[skill.name];
      await prisma.roleSkill.upsert({
        where: { roleId_skillId: { roleId, skillId } },
        update: {},
        create: { roleId, skillId },
      });
      roleSkillCount++;
    }
  }
  console.log(`✅ Seeded ${roleSkillCount} role-skill associations`);

  // --- Seed Candidates ---
  const allSkillNames = Array.from(allSkills.keys());
  const candidateCount = 40;
  const candidateIds: string[] = [];

  for (let i = 0; i < candidateCount; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/ /g, "")}${i}@digitalplatforms.mock`;
    const currentRole = randomPick([...ROLES]);
    const currentTeam = randomPick(TEAMS);
    const capacityFree = randomInt(20, 100);
    const currentWorkload = randomInt(10, 90);
    const yearsExperience = randomInt(1, 15);

    const candidate = await prisma.candidate.upsert({
      where: { email },
      update: {
        name,
        currentRole,
        businessUnit: "Digital Platforms",
        capacityFree,
        currentWorkload,
        yearsExperience,
        currentTeam,
      },
      create: {
        name,
        email,
        currentRole,
        businessUnit: "Digital Platforms",
        capacityFree,
        currentWorkload,
        yearsExperience,
        currentTeam,
      },
    });

    candidateIds.push(candidate.id);

    // --- Seed CandidateSkill records (3–8 skills per candidate) ---
    const skillCount = randomInt(3, 8);
    const candidateSkills = randomSample(allSkillNames, skillCount);

    for (const skillName of candidateSkills) {
      const skillId = skillRecords[skillName];
      const proficiency = randomInt(1, 3);

      await prisma.candidateSkill.upsert({
        where: { candidateId_skillId: { candidateId: candidate.id, skillId } },
        update: { proficiency },
        create: {
          candidateId: candidate.id,
          skillId,
          proficiency,
        },
      });
    }

    // --- Seed CandidateProject records (2–5 per candidate) ---
    const projectCount = randomInt(2, 5);
    const candidateProjects = randomSample(PROJECT_NAMES, projectCount);

    // Delete existing projects for this candidate to maintain idempotency
    await prisma.candidateProject.deleteMany({
      where: { candidateId: candidate.id },
    });

    for (const projectName of candidateProjects) {
      const rolePlayed = randomPick(PROJECT_ROLES);
      await prisma.candidateProject.create({
        data: {
          candidateId: candidate.id,
          projectName,
          rolePlayed,
        },
      });
    }
  }

  console.log(`✅ Seeded ${candidateCount} candidates with skills and projects`);
  console.log("🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
