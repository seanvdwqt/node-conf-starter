-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "currentRole" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL,
    "capacityFree" INTEGER NOT NULL,
    "currentWorkload" INTEGER NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "currentTeam" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CandidateProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "rolePlayed" TEXT NOT NULL,
    CONSTRAINT "CandidateProject_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RoleSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    CONSTRAINT "RoleSkill_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RoleSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CandidateSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiency" INTEGER NOT NULL,
    CONSTRAINT "CandidateSkill_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CandidateSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SquadRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "durationWeeks" INTEGER NOT NULL,
    "requiredCapacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RequestRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "squadRequestId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    CONSTRAINT "RequestRole_squadRequestId_fkey" FOREIGN KEY ("squadRequestId") REFERENCES "SquadRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RequestRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RequestSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestRoleId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "requiredProficiency" INTEGER NOT NULL DEFAULT 1,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "customName" TEXT,
    CONSTRAINT "RequestSkill_requestRoleId_fkey" FOREIGN KEY ("requestRoleId") REFERENCES "RequestRole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RequestSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SquadSelection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "squadRequestId" TEXT NOT NULL,
    "requestRoleId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SquadSelection_squadRequestId_fkey" FOREIGN KEY ("squadRequestId") REFERENCES "SquadRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SquadSelection_requestRoleId_fkey" FOREIGN KEY ("requestRoleId") REFERENCES "RequestRole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SquadSelection_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RoleSkill_roleId_skillId_key" ON "RoleSkill"("roleId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateSkill_candidateId_skillId_key" ON "CandidateSkill"("candidateId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestRole_squadRequestId_roleId_key" ON "RequestRole"("squadRequestId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "SquadSelection_squadRequestId_requestRoleId_candidateId_key" ON "SquadSelection"("squadRequestId", "requestRoleId", "candidateId");
