# Server

This package contains the Express.js backend for Finance AI Manager. It is the primary application API for the React client and the only service that should read and write core finance data in MongoDB for the MVP.

## Scope

Included in this scaffold:

- Express app with ES modules
- MongoDB connection via Mongoose
- placeholder API routes
- Mongoose models aligned with `docs/database-schema.md`

Not included yet:

- authentication
- Excel import
- AI integration
- deployment configuration
- business-heavy controller logic

## Structure

```text
server/
  package.json
  .env.example
  src/
    app.js
    index.js
    config/
      db.js
    controllers/
    models/
    routes/
    services/
```

## Environment Variables

Create a local `.env` file from `.env.example`.

Required:

- `PORT`
- `MONGODB_URI`

## Run Locally

```bash
npm install
npm run dev
```

The server will start on `http://localhost:4000` by default.

## Initial API Endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/jars`
- `GET /api/transactions`
- `GET /api/debts`

These endpoints currently return placeholder responses so the backend skeleton can be connected incrementally.
