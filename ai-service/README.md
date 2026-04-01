# AI Service

This package contains the FastAPI-based AI service for Finance AI Manager. Its role is to provide analysis-oriented endpoints for financial insights while remaining separate from the core Express API.

## Scope

Included in this scaffold:

- FastAPI application structure
- environment-based configuration
- MongoDB connection placeholder
- placeholder insight endpoints for future analysis workflows

Not included yet:

- OpenAI or any paid AI provider integration
- deployment configuration
- direct ownership of finance CRUD
- production LLM orchestration

## Service Boundaries

This service should:

- analyze finance context provided by the main backend
- generate structured insight responses
- later host model or prompt orchestration logic

This service should not:

- become the primary CRUD API
- replace the Express backend
- become the source of truth for transactions, jars, incomes, or debts

MongoDB remains the single source of truth for persisted finance data.

## Structure

```text
ai-service/
  README.md
  requirements.txt
  .env.example
  app/
    main.py
    config/
      db.py
      settings.py
    routes/
      health.py
      insights.py
    services/
      insights_service.py
```

## Endpoints

- `GET /health`
- `POST /insights/summary`
- `POST /insights/spending-anomalies`
- `POST /insights/savings-suggestions`

## Run Locally

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
