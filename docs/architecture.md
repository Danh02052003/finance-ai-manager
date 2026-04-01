# Architecture Overview

## Goal

The system is a monorepo-based personal finance platform built around a 6-jars budgeting workflow that currently exists in Excel. The MVP architecture separates user interface, core business API, and future AI processing into clear subprojects while keeping MongoDB Atlas as the single source of truth.

## High-Level System Architecture

```text
React Client
    |
    v
Express API
    |
    +--> MongoDB Atlas
    |
    +--> FastAPI AI Service
             |
             v
        AI analysis / advice workflows
```

## Request Flow

### 1. Standard finance data flow

1. The React client sends requests to the Express backend.
2. The Express backend validates input and applies finance-domain rules.
3. The Express backend reads and writes MongoDB collections.
4. The backend returns normalized response data to the client.

This is the default path for MVP features such as:

- monthly income tracking
- jar allocation tracking
- transaction recording
- jar debt tracking

### 2. Future AI advice flow

1. The React client requests advice-related functionality through the Express backend.
2. The Express backend gathers the necessary finance context from MongoDB.
3. The Express backend calls the FastAPI AI service with a defined payload.
4. The FastAPI service performs analysis and returns structured advice output.
5. The Express backend stores relevant logs or advice metadata in MongoDB.
6. The React client renders the advice result.

For the MVP phase, the AI service should remain optional and non-blocking to core finance operations.

## Service Boundaries

### React (`client/`)

Owns:

- UI rendering
- local page state
- API consumption
- presentation of reports, jars, transactions, and advice

Does not own:

- persistence logic
- finance validation rules
- direct database access
- AI orchestration rules

### Express (`server/`)

Owns:

- main application API
- request validation
- finance-domain workflows
- database read and write operations
- coordination with the AI service

Does not own:

- browser UI
- model inference logic
- long-term prompt experimentation inside the UI

### FastAPI (`ai-service/`)

Owns:

- AI-oriented processing endpoints
- analysis pipelines
- advice generation contracts
- future model/provider abstraction

Does not own:

- canonical transaction storage
- primary business CRUD
- authentication or session management

### MongoDB Atlas

Owns:

- all persistent finance data
- cross-feature historical records
- AI advice logs and related metadata

MongoDB is the single source of truth. The AI service should not become a competing storage layer for finance records.

## Why a Monorepo

The monorepo approach is used because it fits the current project stage and deployment model.

Benefits:

- single place for architecture and product documentation
- easier coordination across client, server, and AI service
- simpler onboarding for one developer or a small team
- easier shared conventions for data contracts and environment setup
- lower operational overhead than managing multiple repos

This choice also supports incremental delivery. The backend and AI service stay clearly separated by folder and responsibility, but the repository remains easy to navigate and evolve during MVP development.

## MVP Architectural Principles

- Keep the Express backend as the primary application entry point.
- Keep MongoDB schemas simple and aligned with Excel-to-app migration.
- Avoid premature distributed-system patterns.
- Add AI features only after core financial data flows are stable.
- Design boundaries now so deployment to Vercel and Render stays straightforward later.

## Deployment Shape

- `client` deployed to Vercel
- `server` deployed to Render
- `ai-service` deployed to Render
- `MongoDB Atlas` remains the managed database layer

This deployment model allows the frontend, core backend, and AI service to scale independently without splitting the codebase into multiple repositories.
