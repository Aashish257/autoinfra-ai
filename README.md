# AutoInfra AI — Self-Healing Cloud Deployment Platform

> A production-grade, M.Tech-level DevOps project demonstrating end-to-end cloud infrastructure automation with AI-driven self-healing capabilities.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [CI/CD Pipeline](#cicd-pipeline)
- [Self-Healing Engine](#self-healing-engine)
- [Monitoring & Observability](#monitoring--observability)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Screenshots](#screenshots)

---

## Project Overview

**AutoInfra AI** is a full-stack cloud deployment platform that automatically detects and remediates infrastructure failures in real time. Built with production-grade DevOps practices, it combines a modern web dashboard, a robust REST API, Kubernetes orchestration, and a rule-based self-healing engine — all wired into a complete CI/CD pipeline using GitHub Actions and Jenkins.

This project was built to demonstrate:

- Real-world DevOps workflows used in enterprise environments
- Container orchestration with Kubernetes (Minikube for local, production-ready manifests included)
- Automated incident response without human intervention
- Full observability with Prometheus metrics and Grafana dashboards
- Secure, role-based API with JWT authentication

---

## Key Features

| Feature | Description |
|---|---|
| **Self-Healing Engine** | Monitors deployments every 2 minutes, detects anomalies (high CPU, OOM, pod crash, error rate spike), and auto-remediates |
| **Kubernetes Integration** | Creates, scales, restarts, and rolls back real k8s deployments via `@kubernetes/client-node` |
| **Role-Based Auth** | JWT access + refresh tokens, Redis-backed token blacklisting, ADMIN / DEVELOPER / VIEWER roles |
| **Real-time Dashboard** | Next.js dashboard with live metrics charts, deployment management, healing event audit log |
| **CI/CD Pipeline** | GitHub Actions (lint → test → build → push Docker image) → Jenkins (deploy to k8s) |
| **Observability Stack** | Prometheus scraping custom business metrics + Grafana auto-provisioned dashboards + alert rules |
| **Production Patterns** | Redis caching, global error handling, Zod validation, multi-stage Docker builds, health probes |

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **React Query** (server state + auto-refetch)
- **Zustand** (auth state, persisted)
- **Recharts** (metrics visualization)
- **Axios** (interceptors + auto token refresh)

### Backend
- **Node.js + Express** (TypeScript)
- **Prisma ORM** (PostgreSQL)
- **Redis** (ioredis — caching + token blacklist)
- **Zod** (input validation)
- **prom-client** (Prometheus metrics)
- **node-cron** (scheduled health checks)
- **@kubernetes/client-node** (real k8s API calls)

### Database
- **PostgreSQL 16** (primary data store)
- **Redis 7** (cache + session blacklist)

### DevOps
- **Docker + Docker Compose** (local development)
- **Kubernetes** (Minikube local / production manifests)
- **GitHub Actions** (CI — lint, test, build, push)
- **Jenkins** (CD — deploy to k8s)
- **Prometheus** (metrics collection + alerting rules)
- **Grafana** (dashboards, auto-provisioned)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│                    Next.js Dashboard (3000)                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API
┌─────────────────────────▼───────────────────────────────────┐
│                    Express API (5000)                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  │
│  │Auth Layer│  │Deploy API│  │Healing API│  │Metrics API│  │
│  └──────────┘  └──────────┘  └───────────┘  └───────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Self-Healing Engine (Cron: 2min)           │   │
│  │  analyze metrics → decide action → execute → log     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────┬──────────────┬───────────────────┬───────────────────┘
       │              │                   │
┌──────▼─────┐ ┌──────▼─────┐   ┌────────▼────────┐
│ PostgreSQL  │ │   Redis    │   │   Kubernetes    │
│  (Prisma)   │ │ (ioredis)  │   │  (k8s client)   │
└─────────────┘ └────────────┘   └─────────────────┘
                                          │
                              ┌───────────▼──────────┐
                              │  Prometheus (9090)    │
                              │  + Alert Rules        │
                              └───────────┬──────────┘
                                          │
                              ┌───────────▼──────────┐
                              │   Grafana (3001)      │
                              │  Auto-provisioned     │
                              └──────────────────────┘
```

---

## Project Structure

```
autoinfra-ai/
├── apps/
│   ├── api/                        # Express backend
│   │   ├── src/
│   │   │   ├── config/             # db, redis, k8s, metrics, auth
│   │   │   ├── controllers/        # auth, deployment, healing
│   │   │   ├── middleware/         # authenticate, authorize, metrics, error
│   │   │   ├── routes/             # auth, deployment, healing, metrics
│   │   │   ├── services/           # auth, deployment, healing, k8s
│   │   │   ├── validators/         # Zod schemas
│   │   │   ├── jobs/               # healthCheck.job.ts (cron)
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma       # User, Deployment, HealingEvent, Metric
│   │   └── Dockerfile
│   └── web/                        # Next.js frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── login/
│       │   │   └── dashboard/      # overview, deployments, healing, cluster
│       │   ├── lib/                # axios instance, utils
│       │   ├── store/              # Zustand auth store
│       │   └── providers/          # React Query provider
│       └── Dockerfile
├── infra/
│   ├── k8s/                        # Kubernetes manifests
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── api-deployment.yaml
│   │   ├── api-service.yaml
│   │   └── monitoring/             # ServiceMonitor, RBAC
│   └── monitoring/
│       ├── prometheus.yml
│       ├── alerts.yml
│       └── grafana/
│           └── provisioning/       # Auto-provisioned datasource + dashboard
├── .github/
│   └── workflows/
│       ├── ci.yml                  # lint → test → build → push → trigger Jenkins
│       └── pr-check.yml
├── docker-compose.yml
├── .env.example
└── package.json                    # npm workspaces root
```

---

## CI/CD Pipeline

```
Developer: git push origin main
                │
                ▼
    ┌─── GitHub Actions ────────────────────────────┐
    │                                               │
    │  Job 1: Lint & Type Check                     │
    │    └── tsc --noEmit (api + web)               │
    │                                               │
    │  Job 2: Test (needs: lint)                    │
    │    └── Spins up postgres + redis services     │
    │    └── Runs Prisma migrations                 │
    │    └── Jest + Supertest (auth + health tests) │
    │                                               │
    │  Job 3: Build & Push (needs: test)            │
    │    └── Docker Buildx (layer cache: GHA)       │
    │    └── Tags: sha-abc123, branch, latest       │
    │    └── Pushes to Docker Hub                   │
    │                                               │
    │  Job 4: Trigger Jenkins (needs: build)        │
    │    └── POST /job/autoinfra-deploy/build       │
    │        with IMAGE_TAG parameter               │
    └───────────────────────────────────────────────┘
                │
                ▼
    ┌─── Jenkins Pipeline ──────────────────────────┐
    │                                               │
    │  Stage 1: Pull Image                          │
    │    └── docker pull autoinfra-api:$IMAGE_TAG   │
    │                                               │
    │  Stage 2: Deploy to Kubernetes                │
    │    └── kubectl set image deployment/...       │
    │    └── kubectl rollout status                 │
    │                                               │
    │  Stage 3: Verify                              │
    │    └── curl /health check                     │
    │                                               │
    │  Stage 4: Notify                              │
    │    └── Slack / email on success or failure    │
    └───────────────────────────────────────────────┘
```

---

## Self-Healing Engine

The core feature. Runs every 2 minutes via cron job across all active deployments.

### Healing Rules (Priority Order)

| Priority | Trigger | Condition | Action |
|---|---|---|---|
| 1 | `pod_crash` | `podCount == 0` | `restart_pod` |
| 2 | `high_error_rate` | `errorRate > 5%` | `rollback` |
| 3 | `high_cpu` | `cpuUsage > 80%` | `scale_up` |
| 4 | `high_memory` | `memUsage > 85%` | `restart_pod` |

### Healing Flow

```
Cron triggers every 2 min
        │
        ▼
Fetch latest metric snapshot for each deployment
        │
        ▼
analyzeMetrics() → returns { trigger, action } or null (healthy)
        │
        ├── null → skip (healthy)
        │
        └── anomaly detected
                │
                ▼
        Set deployment status → HEALING
        Create HealingEvent record (IN_PROGRESS)
                │
                ▼
        dispatchAction() → real kubectl call
          scale_up    → kubectl scale replicas+1
          restart_pod → kubectl rollout restart
          rollback    → delete + recreate with stable tag
                │
                ├── success → HealingEvent: RESOLVED
                │            Deployment: RUNNING
                │
                └── failure → HealingEvent: FAILED
                              Deployment: FAILED
```

---

## Monitoring & Observability

### Custom Prometheus Metrics

| Metric | Type | Description |
|---|---|---|
| `http_requests_total` | Counter | Total requests by method, route, status |
| `http_request_duration_seconds` | Histogram | Latency with p50/p95/p99 buckets |
| `autoinfra_active_deployments` | Gauge | Currently running deployments |
| `autoinfra_healing_events_total` | Counter | Healing events by trigger + action + status |
| `autoinfra_deployment_failures_total` | Counter | Failures by environment |

### Alert Rules

| Alert | Condition | Severity |
|---|---|---|
| `HighCPUUsage` | CPU > 80% for 2 min | Warning |
| `HighErrorRate` | HTTP 5xx > 5% for 1 min | Critical |
| `APIDown` | API unreachable for 30s | Critical |
| `FrequentHealingEvents` | > 0.5 heal events/sec for 2 min | Warning |

### Grafana Dashboard Panels

- HTTP Requests/sec (by route + method)
- Request Duration p95 (latency trend)
- Active Deployments (live gauge)
- Healing Events/min (rate)
- Error Rate % (gauge with threshold)
- Healing Events by Trigger (pie chart)
- Node.js Memory Usage (heap + RSS)

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login, get tokens |
| POST | `/api/auth/refresh` | — | Refresh access token |
| POST | `/api/auth/logout` | — | Blacklist refresh token |
| GET | `/api/auth/me` | Bearer | Get current user |

### Deployments

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/deployments` | Any | List deployments |
| POST | `/api/deployments` | DEVELOPER+ | Create deployment |
| GET | `/api/deployments/:id` | Any | Get single deployment |
| PATCH | `/api/deployments/:id` | DEVELOPER+ | Update deployment |
| DELETE | `/api/deployments/:id` | ADMIN | Delete deployment |
| POST | `/api/deployments/:id/deploy` | DEVELOPER+ | Trigger k8s deploy |
| GET | `/api/deployments/:id/pods` | Any | Get pod list |
| GET | `/api/deployments/:id/k8s-status` | Any | Get k8s rollout status |

### Self-Healing

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/deployments/:id/check` | DEVELOPER+ | Manual health check |
| POST | `/api/deployments/:id/metrics` | DEVELOPER+ | Inject metric snapshot |
| GET | `/api/deployments/:id/healing-events` | Any | Healing history |
| POST | `/api/deployments/global-check` | ADMIN | Check all deployments |

### System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | API + DB + Redis health |
| GET | `/metrics` | — | Prometheus scrape endpoint |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- Minikube (for Kubernetes features)

### Local Development

```bash
# Clone repo
git clone https://github.com/yourusername/autoinfra-ai.git
cd autoinfra-ai

# Install dependencies
npm install
npm install --prefix apps/api
npm install --prefix apps/web

# Setup environment
cp .env.example .env
# Edit .env with your values

# Start infrastructure
docker compose up postgres redis -d

# Run migrations
cd apps/api && npx prisma migrate dev

# Start both apps
npm run dev
```

### With Full Stack (Docker Compose)

```bash
docker compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:5000 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |
| Prisma Studio | `npx prisma studio` |

### Kubernetes (Minikube)

```bash
minikube start --driver=docker --cpus=2 --memory=4096

docker build -t autoinfra-api:latest ./apps/api
docker build -t autoinfra-web:latest ./apps/web
minikube image load autoinfra-api:latest
minikube image load autoinfra-web:latest

kubectl apply -f infra/k8s/
kubectl get all -n autoinfra
kubectl port-forward svc/autoinfra-api 5000:5000 -n autoinfra
```

---

## Environment Variables

```env
# API
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:secret@localhost:5432/autoinfra
POSTGRES_DB=autoinfra
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secret

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Database Schema

```
User ──────────── Deployment ──────────── HealingEvent
  id (uuid)          id (uuid)               id (uuid)
  email (unique)     name                    trigger
  name               imageTag                action
  password (hash)    environment             status
  role (enum)        status (enum)           resolvedAt
                     replicas
                     namespace          DeploymentMetric
                     userId (FK)            id (uuid)
                                            cpuUsage
                                            memUsage
                                            podCount
                                            errorRate
                                            recordedAt
```

---

## What I Learned

- Designing and implementing a **monorepo** with shared tooling across frontend and backend
- Building a **production-grade REST API** with proper layering (routes → controllers → services)
- Implementing **JWT authentication** with refresh token rotation and Redis-backed blacklisting
- Writing **Kubernetes manifests** and integrating real `kubectl` operations programmatically
- Designing a **rule-based self-healing engine** with automated remediation workflows
- Setting up a **full CI/CD pipeline** splitting concerns between GitHub Actions (CI) and Jenkins (CD)
- Implementing **observability** with custom Prometheus metrics and auto-provisioned Grafana dashboards
- Applying **production patterns**: Redis caching, Zod validation, multi-stage Docker builds, health probes, RBAC middleware

---

## Author

**Aashish**
M.Tech Student | DevOps & Cloud Computing

> Built as a production-grade capstone project demonstrating real-world DevOps engineering practices.
