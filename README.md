# Rate Limiter Service Node 🚦

[![CI Pipeline](https://github.com/SumitDalavi/rate-limiter-service-node/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/SumitDalavi/rate-limiter-service-node/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/SumitDalavi/rate-limiter-service-node?color=0969da&label=release&logo=github)](https://github.com/SumitDalavi/rate-limiter-service-node/releases)
[![Release Workflow](https://github.com/SumitDalavi/rate-limiter-service-node/actions/workflows/release.yml/badge.svg)](https://github.com/SumitDalavi/rate-limiter-service-node/actions/workflows/release.yml)
[![GHCR Container](https://img.shields.io/badge/ghcr.io-v0.2.0-blue?logo=docker&logoColor=white)](https://github.com/SumitDalavi/rate-limiter-service-node/pkgs/container/rate-limiter-service-node)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![SBOM](https://img.shields.io/badge/SBOM-SPDX%202.3-blueviolet?logo=spdx)](https://github.com/SumitDalavi/rate-limiter-service-node/releases/tag/v0.2.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A fast, Redis-backed Sliding Window rate limiter built with **TypeScript**, **Express**, and **ioredis**. 

*(Note: This is the Node.js implementation of Project 20, built alongside the Go version).*

## Overview
This service provides a centralized `/check` endpoint for API gateways or microservices to verify if a given request exceeds its rate limit. It uses an atomic Lua script executing within Redis to accurately maintain sliding window limits without race conditions.

## Setup & Execution

### 1. Using Docker Compose (Recommended)
This will spin up both the Node.js API and a Redis instance automatically:
```bash
docker-compose up --build
```

### 2. Local Setup
Ensure you have Redis running locally on port 6379, then run:
```bash
npm install
npm run dev
```

### 3. API Usage
```bash
curl -X POST http://localhost:3000/check \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "user_123", "endpoint": "/api/v1/data"}'
```

**Successful Response (200 OK):**
```json
{
  "allowed": true,
  "remaining": 99
}
```

**Rate Limited Response (429 Too Many Requests):**
```json
{
  "allowed": false,
  "error": "Too Many Requests",
  "retryAfter": 60
}
```

### 4. Running Tests
```bash
npm test
```

## 🔒 Release & Security Verification

The project includes an automated DevSecOps release pipeline (`.github/workflows/release.yml`) triggered on semantic version tags (`v*.*.*`).

Each release automatically:
1. Executes test suite gates.
2. Builds the container image.
3. Performs vulnerability scanning via Trivy.
4. Generates an SPDX SBOM (`sbom.spdx.json`) using Anchore Syft.
5. Publishes a GitHub Release with attached SBOM.

### Verifying the Release
```bash
# Verify release via GitHub CLI
gh release view v0.2.0 --repo SumitDalavi/rate-limiter-service-node

# Download and inspect SBOM
gh release download v0.2.0 --repo SumitDalavi/rate-limiter-service-node --pattern "sbom.spdx.json"
cat sbom.spdx.json | jq .
```

## 🚀 Progressive Credential Loading & Execution Tiers

This project implements **Progressive Credential Loading (PCL)**, allowing it to run immediately out-of-the-box without external dependencies while seamlessly upgrading as credentials are provided.

### Tier 1: Zero-Config Mock Mode (Default)
Ideal for CI, testing, and rapid local evaluation.
- **Execution:** Run with default configuration (`cp .env.example .env`). Zero API keys, databases, or cloud credentials required.
- **Fallback Behavior:** In-memory caches, deterministic offline heuristics, mock vector embeddings, and local mock storage are automatically used.
- **Health Verification:** Endpoints report `{"mode": "mock"}` for unconfigured dependencies.

### Tier 2: Local Development with Live Services
Connect specific external services while keeping others mocked.
- **Execution:** Provide credentials in `.env` for the services you want active (e.g., `REDIS_URL, DEFAULT_WINDOW_SECONDS, DEFAULT_MAX_REQUESTS`).
- **Progressive Upgrade:** The runtime inspects environment variables on boot and dynamically promotes only configured modules to live mode.
- **Safe Fallback:** Any missing credentials automatically remain on mock fallbacks with no crashes or missing service errors.

### Tier 3: Production Hardened
Enterprise deployment with production-grade backends, security scans, and container distributions.
- **OCI Container Image:** Pre-built, multi-arch image on GitHub Container Registry:
  ```bash
  docker pull ghcr.io/sumitdalavi/rate-limiter-service-node:v0.2.0
  ```
- **Production Orchestration:** Mount secrets via Kubernetes Secrets or cloud secret managers with atomic config reload support.
- **Release Verification:** Checksums and SPDX SBOM available on [GitHub Releases](https://github.com/SumitDalavi/rate-limiter-service-node/releases).

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Runbook](docs/runbook.md)
- [Decisions](docs/decisions.md)
- [Changelog](docs/changelog.md)

## 👨‍💻 Author

**Sumit Dalavi** — Senior DevSecOps / Platform Engineer
[GitHub](https://github.com/SumitDalavi) | [LinkedIn](https://in.linkedin.com/in/sumit-dalavi-762838129)

---
*Built with a focus on robust patterns, not toy demos.*
