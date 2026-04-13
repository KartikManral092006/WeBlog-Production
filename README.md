# WeBlog

WeBlog is a full-stack blogging platform built with a Next.js frontend and an Express + Prisma backend.

The app supports:
- Authentication with cookie-based sessions
- Writing, editing, publishing, and scheduling posts
- Public Explore feed and personalized For You feed
- Likes, comments, bookmarks, and read history
- Follow system with notifications (including new post notifications from followed users)
- Profile pages and social links

## Tech Stack

- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS
- Backend: Express, Prisma ORM, PostgreSQL
- Auth: JWT in HTTP-only cookies

## Project Structure

- frontend: Next.js web app
- backend: Express API + Prisma schema/client

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database (Neon or local)
- Docker Desktop (for containerized run)

## Environment Variables

Create environment files before running:

- backend/.env
- frontend/.env.local (optional, if you want a custom API base URL)

Typical backend variables include:
- DATABASE_URL
- DIRECT_URL
- JWT_SECRET
- PORT (optional, defaults to 8080)
- FRONTEND_URL (for CORS, usually http://localhost:3000)

Typical frontend variable:
- NEXT_PUBLIC_API_BASE_PATH (optional, defaults to /api/v1)

## Installation

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Prisma Setup

From backend:

```bash
cd backend
npx prisma generate
npx prisma db push
```

## Run in Development

Start backend:

```bash
cd backend
npm run dev
```

Start frontend in another terminal:

```bash
cd frontend
npm run dev
```

App URLs:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080

## Run with Docker

You can run the app with Docker Compose.

Current default Docker setup:
- `backend` reads env from `backend/.env`
- `frontend` proxies API calls to `backend`
- Database is expected from `backend/.env` (Neon by default)
- Local Postgres container is optional via profile `localdb`

### 1) Build and start

From project root:

```bash
docker compose up --build -d
```

This starts:
- `backend` (Express + Prisma)
- `frontend` (Next.js)

### 2) Open the app

- Frontend: http://localhost:3000
- Backend: http://localhost:8080

### 3) Stop containers

```bash
docker compose down
```

## Optional: run local Postgres container

If you want the Docker Postgres service too:

```bash
docker compose --profile localdb up -d db
```

If backend should use local Docker Postgres instead of Neon, set these in `backend/.env`:

```env
DATABASE_URL=postgresql://weblog:weblog@db:5432/weblog
DIRECT_URL=postgresql://weblog:weblog@db:5432/weblog
```

Then start app services:

```bash
docker compose up --build -d backend frontend
```

To remove containers and volumes:

```bash
docker compose down -v
```

## Build for Production

Frontend:

```bash
cd frontend
npm run build
npm start
```

Backend:

```bash
cd backend
npm run dev
```
