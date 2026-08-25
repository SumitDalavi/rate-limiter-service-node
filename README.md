# Rate Limiter Service Node

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
