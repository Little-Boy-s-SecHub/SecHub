# SecHub

[![CI](https://github.com/Little-Boy-s-SecHub/SecHub/actions/workflows/ci.yml/badge.svg)](https://github.com/Little-Boy-s-SecHub/SecHub/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://sechub-academy.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-VPS-blue?logo=linux&logoColor=white)](https://api.littleboys.biz/actuator/health)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Prerequisites

| Tool | Version |
|---|---|
| Java | 17+ |
| Node.js | 20+ |
| Docker | Latest |
| PostgreSQL | 15+ |

## Setup

### 1. Clone

```bash
git clone https://github.com/Little-Boy-s-SecHub/SecHub.git
cd SecHub
```

### 2. Database

```bash
docker run -d --name sechub-db \
  -e POSTGRES_DB=sechub_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=change-me \
  -p 5432:5432 postgres:15
```

### 3. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set OPENAI_API_KEY, database credentials, JWT secret
./mvnw spring-boot:run
```

API available at `http://localhost:8888`.

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | **Required.** OpenAI API key for lab generation. |
| `OPENAI_MODEL` | Model to use (default: `gpt-4o-mini`) |
| `SPRING_DATASOURCE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT token signing (min 32 chars) |
| `SYNC_TOKEN` | Token for GitHub content sync endpoint |
| `LAB_GENERATED_ROOT` | Path where generated lab code is stored |

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:3000`.

## Testing

```bash
# Frontend
cd frontend
npm run test
npm run test:coverage
npm run lint

# Backend
cd backend
./mvnw test

# Performance (k6)
cd performance
.\run-k6.ps1          # Windows
k6 run k6/smoke.js    # Linux/Mac
```
