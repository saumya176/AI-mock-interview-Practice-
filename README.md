# AI Mock Interview

Full-stack AI-powered mock interview platform for placement preparation.

## Stack

- **Client:** React 18, Vite, Tailwind CSS, Firebase Auth, Recharts
- **Server:** Express, MongoDB (Mongoose), Gemini AI, Firebase Admin

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Firebase project with Google sign-in enabled
- Google Gemini API key

## Quick start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

**Server** — copy `server/.env.example` to `server/.env`:

```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/aimock
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
GEMINI_API_KEY=
GEMINI_FALLBACK_ENABLED=true
```

**Client** — copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

### 3. Run development servers

In two terminals:

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

### 4. Production build

```bash
npm run build:client
NODE_ENV=production npm run start:server
```

Serve `client/dist` with any static host (Vercel, Netlify, nginx) and point `VITE_API_URL` to your deployed API.

## Project structure

```
client/          React frontend (Vite)
server/          Express API
  controllers/   Route handlers
  services/      Business logic (Gemini, dashboard, interviews)
  models/        Mongoose schemas
  routes/        API routes
```

## API routes

| Route | Description |
|-------|-------------|
| `POST /api/auth/firebase` | Exchange Firebase ID token for JWT |
| `GET /api/auth/me` | Current user |
| `POST /api/ai/questions` | Generate interview questions |
| `POST /api/ai/evaluate` | Evaluate a single answer |
| `POST /api/ai/report` | Final interview report |
| `GET /api/interviews/history` | Interview history |
| `GET /api/dashboard/summary` | Dashboard stats |
| `POST /api/resume/upload` | Parse resume (PDF/DOCX) |

## Interview flow

1. Sign in with Google
2. Configure role, skills, and difficulty on **Setup**
3. Complete the **Interview** (voice or text answers)
4. View **Results** (auto-saved to MongoDB)
5. Review **History** and **Feedback**

## Security notes

- Never commit `.env` files
- Set strong `JWT_SECRET` in production
- Configure Firebase Admin credentials on the server
- Set `CLIENT_URL` to your frontend origin for CORS
- Set `NODE_ENV=production` to disable dev auth fallbacks
