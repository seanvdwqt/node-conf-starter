# API Specification — Rapid Squad Assembly

## Base URL

```
http://localhost:3001/api
```

All endpoints are prefixed with `/api`. The Vite dev server proxies `/api/*` from `:5173` to Express at `:3001`.

---

## Endpoints

### POST /squad-requests

Creates a new squad request with status "draft".

**Request Body:**
```json
{
  "title": "string (max 100 chars, required)",
  "businessUnit": "string (must be 'Digital Platforms')",
  "objective": "string (max 500 chars, required)",
  "urgency": "low | medium | high",
  "startDate": "ISO date string (>= today)",
  "durationWeeks": "integer 1–52",
  "requiredCapacity": "10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "title": "string",
  "businessUnit": "Digital Platforms",
  "objective": "string",
  "urgency": "medium",
  "startDate": "2025-02-01T00:00:00.000Z",
  "durationWeeks": 8,
  "requiredCapacity": 60,
  "status": "draft",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

**Errors:**
- `400 VALIDATION_ERROR` — Missing/invalid fields with `errors[]` array

---

### PATCH /squad-requests/:id/roles

Replaces roles and skills for a squad request. Deletes existing roles and creates new ones.

**Request Body:**
```json
{
  "roles": [
    {
      "roleId": "uuid",
      "skills": [
        {
          "skillId": "uuid | null",
          "name": "string",
          "category": "mandatory | preferred",
          "requiredProficiency": 1 | 2 | 3,
          "isCustom": false,
          "customDescription": "string (if isCustom)"
        }
      ]
    }
  ]
}
```

**Response:** `200 OK` — Full squad request with roles and skills included.

**Errors:**
- `400 VALIDATION_ERROR` — roles not an array
- `404 NOT_FOUND` — Squad request does not exist
- `409 INVALID_STATE` — Request not in "draft" or "recommended" state

---

### POST /squad-requests/:id/recommend

Triggers the scoring engine. Returns ranked shortlists per role.

**Request Body:** None (empty)

**Response:** `200 OK`
```json
{
  "shortlists": [
    {
      "roleId": "uuid",
      "roleName": "engineer",
      "candidates": [
        {
          "candidateId": "uuid",
          "name": "John Smith",
          "matchScore": 85.5,
          "availability": "available | partially_available",
          "workload": "normal | high",
          "matchedSkills": [
            { "name": "React", "proficiency": 3, "requiredProficiency": 2 }
          ],
          "yearsExperience": 7,
          "currentTeam": "Core Banking",
          "previousProjects": [
            { "name": "Mobile Banking v2", "role": "Senior Engineer" }
          ],
          "explanation": "This candidate brings React at expert level and Node.js at proficient level...",
          "scoreBreakdown": [
            { "rule": "skillMatch", "weight": 0.30, "contribution": 28.5 },
            { "rule": "proficiency", "weight": 0.15, "contribution": 15.0 },
            { "rule": "experience", "weight": 0.10, "contribution": 10.0 },
            { "rule": "availability", "weight": 0.20, "contribution": 20.0 },
            { "rule": "workload", "weight": 0.10, "contribution": 7.0 },
            { "rule": "urgency", "weight": 0.15, "contribution": 12.0 }
          ]
        }
      ],
      "hasGap": false
    }
  ]
}
```

**Errors:**
- `404 NOT_FOUND` — Squad request does not exist

---

### PATCH /squad-requests/:id/squad

Saves proposed squad selections. Updates status to "assembled".

**Request Body:**
```json
{
  "selections": [
    { "requestRoleId": "uuid", "candidateId": "uuid" }
  ]
}
```

**Response:** `200 OK` — Full squad request with selections.

**Errors:**
- `400 VALIDATION_ERROR` — selections not an array, or exceeds 20
- `404 NOT_FOUND` — Squad request does not exist
- `409 INVALID_STATE` — Not in "draft", "recommended", or "assembled" state

---

### POST /squad-requests/:id/finalise

Finalises the squad request. Validates all mandatory roles are filled.

**Request Body:** None

**Response:** `200 OK` — Full squad request with status "finalised".

**Errors:**
- `404 NOT_FOUND` — Squad request does not exist
- `409 INVALID_STATE` — Not in "assembled" state, or unfilled mandatory roles

---

### GET /roles

Returns all available roles with their predefined skills.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "engineer",
    "skills": [
      {
        "id": "uuid",
        "roleId": "uuid",
        "skillId": "uuid",
        "skill": { "id": "uuid", "name": "TypeScript", "category": "technical" }
      }
    ]
  }
]
```

---

### GET /candidates

Returns all candidates in the talent pool (debug/admin).

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "currentRole": "engineer",
    "businessUnit": "Digital Platforms",
    "capacityFree": 80,
    "currentWorkload": 30,
    "yearsExperience": 5,
    "currentTeam": "Payments",
    "createdAt": "ISO timestamp",
    "skills": [
      {
        "id": "uuid",
        "candidateId": "uuid",
        "skillId": "uuid",
        "proficiency": 3,
        "skill": { "id": "uuid", "name": "React", "category": "technical" }
      }
    ],
    "projects": [
      { "id": "uuid", "candidateId": "uuid", "projectName": "Project X", "rolePlayed": "Lead Dev" }
    ]
  }
]
```

---

### POST /squad-search

Instant squad search — tokenizes natural-language input and returns pre-composed team suggestions.

**Request Body:**
```json
{
  "query": "I need 2 engineers with React experience and a tester"
}
```

**Response:** `200 OK`
```json
{
  "parsed": {
    "roles": [
      { "name": "engineer", "quantity": 2 },
      { "name": "tester", "quantity": 1 }
    ],
    "skills": ["React"],
    "urgency": null,
    "signals": []
  },
  "suggestions": [
    {
      "teamScore": 78.5,
      "explanation": "Team with engineer and tester averaging 79% match",
      "members": [
        {
          "candidateId": "uuid",
          "name": "Alice Chen",
          "role": "engineer",
          "matchScore": 82.0,
          "matchedSkills": [{ "name": "React", "proficiency": 3 }],
          "availability": "available",
          "yearsExperience": 6,
          "currentTeam": "Core Banking"
        }
      ]
    }
  ]
}
```

**No-match response:**
```json
{
  "parsed": { "roles": [], "skills": [], "urgency": null, "signals": [] },
  "suggestions": [],
  "message": "No matches found. Try specifying roles or skills."
}
```

---

## Error Envelope

All errors follow this structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | INVALID_STATE | INTERNAL_ERROR",
    "message": "Human-readable description",
    "errors": [
      { "field": "title", "message": "Title is required" }
    ],
    "currentState": "draft",
    "requiredCondition": "Must be in assembled state"
  }
}
```

---

## Health Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server liveness: `{ status: "ok", timestamp }` |
| GET | `/api/health` | API health + uptime |
| GET | `/api/info` | API name, version, environment |
| POST | `/api/echo` | Echo JSON body (debug) |

---

## Authentication

None — this is a prototype with mock data only.

---

## CORS

CORS is enabled for all origins via the `cors` middleware. In production this would be restricted.
