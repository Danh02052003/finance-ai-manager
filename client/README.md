# Client

This package contains the React frontend for Finance AI Manager. It provides the MVP user interface for dashboard views, jar summaries, transactions, debts, and future AI-driven insights.

## Scope

Included in this scaffold:

- React app with Vite
- route-based page structure
- admin-style layout for finance screens
- thin API layer for backend communication

Not included yet:

- authentication
- heavy charts
- direct AI provider integration
- deployment configuration

## Structure

```text
client/
  index.html
  package.json
  vite.config.js
  src/
    api/
    components/
    pages/
    App.jsx
    main.jsx
    styles.css
```

## API Configuration

The frontend expects the Express backend to be available at:

- `http://localhost:4000/api`

You can override this later with:

- `VITE_API_BASE_URL`

## Run Locally

```bash
npm install
npm run dev
```

By default, Vite runs on `http://localhost:5173`.
