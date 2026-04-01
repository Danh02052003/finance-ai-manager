# Finance AI Manager

Finance AI Manager is a production-oriented personal finance web app based on an existing Excel-driven workflow. The initial goal of this repository is to establish a clean monorepo structure, shared project documentation, and a practical developer setup for building the MVP.

The product is centered around a 6-jars personal finance model. It will track monthly income, jar allocations, transactions, jar-to-jar debt, and future AI-generated financial advice. MongoDB is the single source of truth across the system.

## Monorepo Structure

```text
finance-ai-manager/
  client/
  server/
  ai-service/
  docs/
  .gitignore
  README.md
```

## Service Responsibilities

### `client/`

- React frontend application
- Displays dashboards, monthly finance views, jar balances, and advice results
- Calls the Express API for core app data
- May call the AI-facing backend endpoints only through the main backend or approved service flow

### `server/`

- Express.js backend
- Main application API for the frontend
- Owns business workflows for finance data, validation, and persistence
- Connects to MongoDB Atlas
- Coordinates with the AI service when advice features are added

### `ai-service/`

- Python FastAPI service
- Dedicated to future AI-related capabilities
- Will handle prompt orchestration, analysis pipelines, and advice generation
- Should remain isolated from core CRUD responsibilities

### `docs/`

- Architecture and data design documentation
- Import planning for future Excel migration
- Source of truth for early project decisions

## Deployment Plan

- `client` -> Vercel
- `server` -> Render
- `ai-service` -> Render
- `MongoDB Atlas` -> managed database already provisioned

This split keeps frontend hosting optimized for static or SPA delivery, while backend and AI services can scale independently based on traffic and workload.

## Development Flow

1. Define architecture and MongoDB schema first.
2. Scaffold backend API in `server/`.
3. Scaffold React app in `client/`.
4. Add FastAPI AI service contracts in `ai-service/`.
5. Connect React -> Express -> MongoDB for MVP finance flows.
6. Add AI advice workflows after core data flows are stable.
7. Add Excel import only after manual data workflows are validated.

## Current Scope

Included now:

- Monorepo structure
- Architecture documentation
- MongoDB collection design
- Environment file templates
- Draft Excel import plan
- MVP Excel import from the web UI

Not included yet:

- Authentication
- Payment features
- Deployment configuration
- Excel import implementation
- Paid AI provider integration
- Production application code

## Working Principles

- Keep the MVP simple and operationally clear.
- Use MongoDB as the only database.
- Avoid premature microservice complexity.
- Keep AI features isolated from core finance data management.
- Prefer clear boundaries and maintainable folders over heavy abstraction.

## Excel Import MVP

The app now includes an MVP Excel import flow:

1. Open the frontend import page at `/import`
2. Drag and drop or select an `.xlsx` or `.xls` file
3. The frontend uploads the file to `POST /api/import/excel`
4. The Express backend parses supported sheets and saves normalized data to MongoDB
5. The UI shows detected sheets, inserted counts, skipped rows, warnings, and errors

Supported sheet types in this MVP:

- `6 hũ` for monthly incomes and jar allocations
- `Tháng X` sheets for transactions
- `Nợ quỹ` for jar debts

Unsupported or unrecognized sheets are ignored safely and reported as warnings.
