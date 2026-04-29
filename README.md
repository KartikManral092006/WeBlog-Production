# WeBlog

A full-stack blogging platform for publishing long-form posts, discovering content, and building reader-writer communities. WeBlog combines a polished Next.js interface with an Express API, PostgreSQL persistence, Prisma ORM, cookie-based authentication, and Google OAuth.
Visit Here:- [**WeBlog**]('https://we-blog-production-zbr9.vercel.app/')

## Highlights

- Built a complete blog workflow with create, edit, draft, publish, schedule, and delete support
- Implemented authentication with JWT HTTP-only cookies and Google OAuth redirects
- Added personalized feeds, public exploration, topic filtering, and post categorization
- Supported engagement features including likes, comments, bookmarks, follows, read history, and notifications
- Designed profile pages with avatar, bio, and social link management
- Containerized the frontend and backend with Docker Compose for repeatable local setup

## Tech Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style components
- Backend: Node.js, Express, Prisma ORM
- Database: PostgreSQL, with support for Neon or local Postgres
- Auth: JWT sessions in HTTP-only cookies, Google OAuth 2.0
- Tooling: Docker Compose, npm, Prisma Client

## Architecture

```text
WeBlog
├── frontend/        Next.js app, UI components, auth context, API client
├── backend/         Express API, route handlers, controllers, services
├── backend/prisma/  Prisma schema and database models
└── docker-compose.yml
```

The frontend talks to the backend through `/api/v1` routes. In Docker, Next.js rewrites API requests to the backend service. Authentication is stored in secure HTTP-only cookies, keeping session tokens out of client-side JavaScript.

## Features

### Authentication

- Email/password registration and login
- Google OAuth sign-in
- Persistent sessions with JWT cookies
- Authenticated `/me` endpoint for session restore

### Writing

- Rich blog editor
- Draft and published post states
- Private and public visibility
- Scheduled publishing fields
- Preview image support

### Discovery

- Explore feed
- Personalized For You feed
- Topic and search-based browsing
- Content preview cards

### Community

- Likes and comments
- Bookmark lists
- Follow and unfollow authors
- Notifications for relevant activity
- Reading history

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database, either local or hosted
- Docker Desktop, optional but recommended

### Environment Variables

Create `backend/.env`:

```env
PORT=8080
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=replace-with-a-strong-secret
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
COOKIE_SECURE=false
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_REDIRECT_URL=http://localhost:8080/api/v1/auth/google/callback
```

Optional `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_PATH=/api/v1
```

For Google OAuth, add this redirect URI in Google Cloud Console:

```text
http://localhost:8080/api/v1/auth/google/callback
```

### Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Database Setup

From `backend/`:

```bash
npx prisma generate
npx prisma db push
```

### Run Without Docker

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`

### Run With Docker

From the repository root:

```bash
docker compose up --build -d
```

This starts:

- `weblog-frontend` on `http://localhost:3000`
- `weblog-backend` on `http://localhost:8080`

Stop services:

```bash
docker compose down
```

### Optional Local Postgres

Start the bundled Postgres service:

```bash
docker compose --profile localdb up -d db
```

Use this database URL in `backend/.env` when running inside Docker:

```env
DATABASE_URL=postgresql://weblog:weblog@db:5432/weblog
DIRECT_URL=postgresql://weblog:weblog@db:5432/weblog
```

Then start the app:

```bash
docker compose up --build -d backend frontend
```

### Useful Commands

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Frontend production build
cd frontend && npm run build

# Docker status
docker compose ps
```

