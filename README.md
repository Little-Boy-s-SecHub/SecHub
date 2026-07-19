# SecHub — AI-Powered Web Pentest Learning Platform

[![CI](https://github.com/Little-Boy-s-SecHub/SecHub/actions/workflows/ci.yml/badge.svg)](https://github.com/Little-Boy-s-SecHub/SecHub/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://sechub-academy.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Railway-purple?logo=railway)](https://railway.app/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Learn by doing, not by Googling flags.**  
> SecHub uses AI to generate unique vulnerable environments for every lab session. Each flag is different, each code structure is different — learners must actually understand the vulnerability to exploit it.

---

## 🚀 Features

| Feature | Description |
|---|---|
| **🤖 Dynamic AI Labs** | Every lab session generates unique vulnerable source code via OpenAI. Flags and code structures change per attempt — no two sessions are identical. |
| **🐳 Isolated Containers** | Each lab runs in its own Docker container. Fully sandboxed, auto-destroyed on completion or timeout. |
| **📚 83 Lessons** | Covering 11 OWASP categories from Broken Access Control to API Security. Available in English and Vietnamese. |
| **🏆 Leaderboard & Progress** | Track your learning journey. Compare progress with other learners. |
| **💡 AI Hints** | Stuck? The AI analyzes your progress and provides contextual hints without giving away the answer. |
| **🌐 Bilingual (EN/VI)** | Full i18n support. Learning materials and UI in both English and Vietnamese. |
| **✍️ Author Studio** | Create and publish your own vulnerability lessons and lab templates. |

---

## 📁 Project Structure

```
SecHub/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + Test + Build on every PR
│       └── deploy-production.yml     # Production deployment pipeline
│
├── backend/                          # Spring Boot 3.4 · Java 17
│   ├── src/main/java/com/sechub/
│   │   ├── controller/               # 15 REST endpoints
│   │   │   ├── AuthController        # Login / Register
│   │   │   ├── LabController         # Start / Stop / Submit labs
│   │   │   ├── AiController          # AI hint & generation endpoints
│   │   │   ├── SyncController        # GitHub content sync
│   │   │   ├── ProgressController    # User progress tracking
│   │   │   ├── GrowthController      # Analytics & growth metrics
│   │   │   └── ...                   # 9 more controllers
│   │   ├── service/
│   │   │   ├── OpenAiService         # GPT integration for lab generation
│   │   │   ├── LabService            # Lab lifecycle management
│   │   │   ├── DockerService         # Container orchestration
│   │   │   ├── LabArtifactService    # Generated code management
│   │   │   ├── LabTemplateCatalog    # Vulnerability templates
│   │   │   └── ...                   # 20+ service classes
│   │   ├── entity/                   # JPA entities
│   │   ├── repository/               # Spring Data repos
│   │   ├── security/                 # JWT auth filters
│   │   ├── dto/                      # Request/Response DTOs
│   │   └── config/                   # App configuration
│   ├── .env.example                  # Environment variable template
│   ├── Dockerfile                    # Backend container image
│   └── pom.xml                       # Maven dependencies
│
├── frontend/                         # Next.js 16 · React 19 · TypeScript
│   └── src/
│       ├── app/
│       │   ├── labs/                  # Lab browser & simulator
│       │   ├── learning/             # Learning path view
│       │   ├── leaderboard/          # Rankings
│       │   ├── author/               # Content authoring studio
│       │   ├── profile/              # User profile
│       │   ├── vulnerabilities/      # Vulnerability reference
│       │   ├── login/ & register/    # Authentication pages
│       │   └── review/               # Peer review system
│       ├── components/               # Reusable UI components
│       ├── context/                  # Auth & Language providers
│       ├── translations/             # EN/VI i18n strings
│       ├── lib/                      # API client & utilities
│       └── utils/                    # Helper functions
│
└── performance/
    └── k6/                           # Load & stress test scripts
```

---

## 🛠️ Local Development Setup

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Java | 17+ | Backend runtime |
| Node.js | 20+ | Frontend runtime |
| Docker | Latest | Lab container orchestration |
| PostgreSQL | 15+ | Primary database |

### 1. Clone & Setup

```bash
git clone https://github.com/Little-Boy-s-SecHub/SecHub.git
cd SecHub
```

### 2. Database

```bash
# Start PostgreSQL via Docker
docker run -d --name sechub-db \
  -e POSTGRES_DB=sechub_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=change-me \
  -p 5432:5432 postgres:15
```

### 3. Backend (Spring Boot)

```bash
cd backend

# Copy and configure environment variables
cp .env.example .env
# Edit .env — set your OPENAI_API_KEY, database credentials, JWT secret

# Run the backend
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8888`.

**Key environment variables** (see [.env.example](backend/.env.example)):

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Required. Your OpenAI API key for lab generation. |
| `OPENAI_MODEL` | Model to use (default: `gpt-4o-mini`) |
| `SPRING_DATASOURCE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT token signing (min 32 chars) |
| `SYNC_TOKEN` | Token for GitHub content sync endpoint |
| `LAB_GENERATED_ROOT` | Path where generated lab code is stored |

### 4. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run test              # Run unit tests
npm run test:coverage     # With coverage report
npm run lint              # ESLint check
```

### Backend
```bash
cd backend
./mvnw test               # JUnit tests
```

### Performance (k6)
```bash
cd performance
# Windows
.\run-k6.ps1
# Linux/Mac
k6 run k6/smoke.js
```

---

## 🏗️ Architecture Overview

See the [Organization Profile](https://github.com/Little-Boy-s-SecHub/.github/blob/main/profile/README.md) for the full system architecture diagram showing how the AI generation, Docker orchestration, and data sync pipelines work together.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Ensure all tests pass (`npm run test` and `./mvnw test`)
4. Ensure CI passes (lint + test + build)
5. Submit a Pull Request

---

## 📜 License

This project is built for the [Open AI Build Week Hackathon](https://openai.devpost.com/resources).
