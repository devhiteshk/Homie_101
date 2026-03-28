# HOMIE_101 — Consolidated Backend

Single Node.js backend for all personal projects. Each service is isolated with its own DB connection and mounted under `/api/<service-name>`.

---

## Setup

```bash
cd HOMIE_101
npm install
cp .env.example .env   # fill in your values
npm run dev
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `NOTES_MONGO_URI` | MongoDB URI for Notes service |
| `JWT_SECRET` | Secret for JWT signing |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NOTES_GOOGLE_CALLBACK_URL` | Full callback URL for Google OAuth |
| `NOTES_FRONTEND_URL` | Frontend URL for post-OAuth redirect |
| `GROQ_API_KEY` | Groq API key for AI chat |
| `CSC_MONGO_URI` | MongoDB URI for Country/State/City service |

---

## Services

### Health Check

```
GET /ping
```
Response: `{ "status": "ok", "message": "HOMIE_101 is running" }`

---

## `/api/notes` — Notes Service

Base URL: `http://localhost:3000/api/notes`

Rate limit: 100 requests / 15 minutes per IP

### Authentication

#### Sign Up
```
POST /api/notes/auth/signup
```
Body:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "yourpassword"
}
```
Response `201`: `{ "message": "User created successfully" }`

---

#### Login
```
POST /api/notes/auth/login
```
Body:
```json
{
  "email": "john@example.com",
  "password": "yourpassword"
}
```
Response `200`: `{ "token": "<jwt>" }`

---

#### Google OAuth — Initiate
```
GET /api/notes/auth/google
```
Redirects to Google login. No body required.

---

#### Google OAuth — Callback
```
GET /api/notes/auth/google/callback
```
Handled by Google. On success, redirects to `NOTES_FRONTEND_URL?token=<jwt>`.

---

### Projects

> All project routes require `Authorization: Bearer <token>` header.

#### Create Project
```
POST /api/notes/projects
```
Body: `{ "name": "My Project" }`
Response `201`: `{ "_id": "...", "name": "My Project", "user": "..." }`

---

#### List Projects
```
GET /api/notes/projects
```
Response `200`: Array of projects belonging to the authenticated user.

---

#### Delete Project
```
DELETE /api/notes/projects/:id
```
Response `200`: `{ "message": "1 project(s) deleted" }`

---

### Files

> All file routes require `Authorization: Bearer <token>` header.

#### Create File
```
POST /api/notes/files
```
Body:
```json
{
  "name": "diagram.excalidraw",
  "projectId": "<project_id>"
}
```
Response `201`: File object.

---

#### Get Files by Project
```
GET /api/notes/files/by-project/:projectId
```
Response `200`: Array of files in the project.

---

#### Get File by ID
```
GET /api/notes/files/:id
```
Response `200`: File object with populated project.

---

#### Update File
```
PUT /api/notes/files/:id
```
Body:
```json
{
  "name": "updated-name",
  "content": "{\"elements\": []}"
}
```
Response `200`: Updated file object.

---

#### Delete File
```
DELETE /api/notes/files/:id
```
Response `200`: `{ "message": "1 file(s) deleted" }`

---

### AI Chat (Excalidraw)

> Requires `Authorization: Bearer <token>` header.

#### Chat
```
POST /api/notes/chat
```
Body: `{ "message": "draw a flowchart with 3 steps" }`

Response `200`:
```json
{
  "elements": [
    { "type": "rectangle", "x": 100, "y": 100, "width": 200, "height": 100 }
  ],
  "message": "Created your requested query on canvas"
}
```

---

## `/api/csc` — Country State City Service

Base URL: `http://localhost:3000/api/csc`

Rate limit: 15 requests / 60 minutes per IP (public API)

#### Search
```
GET /api/csc/search?search=<query>&limit=15&offSet=0
```

| Param | Required | Default | Description |
|---|---|---|---|
| `search` | yes | — | Search term (min 2 chars) |
| `limit` | no | 15 | Max results to return |
| `offSet` | no | 0 | Pagination offset |

Response `200`:
```json
{
  "success": true,
  "results": [
    { "_id": "...", "csc": "India > Maharashtra > Mumbai" }
  ]
}
```

Response `400` (search too short):
```json
{ "success": false, "message": "Search must be at least 2 characters" }
```

---

## Adding a New Service

1. Create `src/services/<service-name>/index.js` — export an async function `(app) => {}`
2. Connect its own DB via `connectDB('name', process.env.YOUR_MONGO_URI)`
3. Mount routes under `/api/<service-name>`
4. Register it in `src/index.js`:
   ```js
   await require('./services/<service-name>')(app);
   ```
5. Add env vars to `.env.example`

---

## Project Structure

```
HOMIE_101/
├── src/
│   ├── index.js                  # Entry point
│   ├── config/
│   │   └── db.js                 # Multi-connection DB manager
│   └── services/
│       ├── notes/                # Notes + Excalidraw service
│       │   ├── index.js
│       │   ├── config/passport.js
│       │   ├── middlewares/auth.js
│       │   ├── models/index.js
│       │   └── routes/
│       │       ├── auth.js
│       │       ├── project.js
│       │       ├── file.js
│       │       └── gpt.js
│       └── csc/                  # Country State City service
│           ├── index.js
│           ├── models/index.js
│           └── routes/search.js
├── .env.example
├── package.json
└── README.md
```
