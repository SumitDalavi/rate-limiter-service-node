> **NOTE:** This repository is an archival lab or partial prototype. It is not actively maintained and should not be used as a reference for production-grade deployments or performance benchmarks.


# Rate Limiter Service Node

[![Release](https://img.shields.io/github/v/release/SumitDalavi/rate-limiter-service-node?color=blue&logo=github)](https://github.com/SumitDalavi/rate-limiter-service-node/releases)
[![Release Workflow](https://github.com/SumitDalavi/rate-limiter-service-node/actions/workflows/release.yml/badge.svg)](https://github.com/SumitDalavi/rate-limiter-service-node/actions/workflows/release.yml)
[![SBOM](https://img.shields.io/badge/SBOM-SPDX%20JSON-blueviolet?logo=spdx)](https://github.com/SumitDalavi/rate-limiter-service-node/releases)

[![Release](https://img.shields.io/github/v/release/SumitDalavi/rate-limiter-service-node?color=blue&logo=github)](https://github.com/SumitDalavi/rate-limiter-service-node/releases)
[![SBOM](https://img.shields.io/badge/SBOM-SPDX%20JSON-blueviolet?logo=spdx)](https://github.com/SumitDalavi/rate-limiter-service-node/releases)

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

## Release & Security Verification

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
gh release view v0.1.0 --repo SumitDalavi/rate-limiter-service-node

# Download and inspect SBOM
gh release download v0.1.0 --repo SumitDalavi/rate-limiter-service-node --pattern "sbom.spdx.json"
cat sbom.spdx.json | jq .
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Runbook](docs/runbook.md)
- [Decisions](docs/decisions.md)
- [Changelog](docs/changelog.md)