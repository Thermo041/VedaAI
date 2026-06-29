# VedamAI Architecture

## Product Flow

1. Teacher signs up or signs in (email + password, JWT session cookie).
2. Teacher opens Assignments dashboard (scoped to their user id).
3. Teacher creates an assignment with file context, due date, question types, counts, marks, and instructions.
4. API saves assignment to MongoDB and enqueues BullMQ job on Redis.
5. Worker calls Gemini, parses JSON with Zod, saves structured paper + answer key to MongoDB.
6. Socket.IO emits progress (`queued` → `processing` → `completed` / `failed`).
7. Output page renders exam layout; PDF export via jsPDF.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 App Router, TypeScript, Tailwind, Zustand |
| Auth | bcryptjs + jose JWT (httpOnly cookie) |
| API | Next.js Route Handlers |
| Database | MongoDB Atlas (Mongoose) |
| Cache / jobs | Upstash Redis + BullMQ |
| Realtime | Socket.IO (custom `server.ts`) |
| AI | Google Gemini (structured JSON) |
| PDF | jsPDF |

## Models

- **School** — name, location
- **User** — name, email, passwordHash, role, schoolId
- **Assignment** — userId, schoolId, question config, generatedPaper, answerKey, status

## API Routes

| Route | Auth | Purpose |
|-------|------|---------|
| POST `/api/auth/signup` | Public | Register teacher |
| POST `/api/auth/signin` | Public | Login |
| GET `/api/auth/me` | Session | Current user |
| POST `/api/auth/logout` | Session | Logout |
| GET/POST `/api/assignments` | Required | List / create |
| GET/DELETE `/api/assignments/[id]` | Required | Read / delete |
| POST `/api/generate` | Required | Enqueue generation (202) |
| GET `/api/jobs/[id]` | Required | Job status + assignment |
| GET `/api/health` | Public | Service health |

## WebSocket Events

```json
{
  "assignmentId": "…",
  "status": "processing",
  "progress": 65,
  "message": "Generating with Gemini"
}
```

## Run

```bash
npm install
cp .env.example .env.local   # fill JWT_SECRET, MONGODB_URI, REDIS_URL, GEMINI_API_KEY
npm run dev                  # starts Next + Socket.IO + BullMQ worker
```

Server exits on startup if MongoDB or Redis cannot connect.
