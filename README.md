# Darukaa.Earth — Geospatial Data Analytics Platform

A full-stack dashboard for managing and visualizing carbon and biodiversity projects: create projects, draw geographic site boundaries on an interactive map, and view per-site analytics over time.

## Architecture

```
┌─────────────────┐        HTTPS/JSON        ┌──────────────────┐
│  React (Vite)    │ ───────────────────────▶ │  FastAPI backend  │
│  Mapbox GL JS    │ ◀─────────────────────── │  JWT auth         │
│  Chart.js        │                          │  SQLAlchemy ORM   │
└─────────────────┘                          └────────┬─────────┘
                                                        │
                                              ┌─────────▼─────────┐
                                              │ Postgres + PostGIS │
                                              │ (SQLite for local  │
                                              │  zero-setup dev)   │
                                              └────────────────────┘
```

- **Frontend**: React + Vite, React Router for pages (login/register/dashboard/site detail), Mapbox GL JS + Mapbox Draw for drawing polygon site boundaries, Chart.js for time-series analytics.
- **Backend**: FastAPI, JWT-based auth (python-jose + passlib/bcrypt), SQLAlchemy ORM.
- **Database**: Defaults to SQLite for instant local setup. Swap `DATABASE_URL` to a Postgres instance with the PostGIS extension for production — the `Site.geometry` column stores GeoJSON and is designed to be swapped for a GeoAlchemy2 `Geometry("POLYGON", srid=4326)` column to get native spatial indexing/queries (`ST_Area`, `ST_Intersects`, etc).
- **CI/CD**: GitHub Actions runs lint + a backend import check + a frontend build on every push/PR to `main`. Husky + lint-staged run ESLint/Prettier on staged frontend files before every commit.

## Database schema

| Table          | Key columns                                                                 |
|----------------|------------------------------------------------------------------------------|
| `users`        | id, email (unique), hashed_password, full_name, created_at                  |
| `projects`     | id, name, description, project_type (carbon/biodiversity), owner_id (FK)    |
| `sites`        | id, name, project_id (FK), geometry (GeoJSON polygon), area_hectares         |
| `site_metrics` | id, site_id (FK), date, carbon_tons, biodiversity_index, ndvi               |

Relationships: `User 1—N Project 1—N Site 1—N SiteMetric`.

## Datasets

No real satellite/field datasets were available for this challenge, so `SiteMetric` rows are generated deterministically (seeded by `site.id`) the first time a site's analytics are requested, producing a 12-month mock time series for carbon tons, a biodiversity index, and NDVI. This keeps the analytics view fully demonstrable end-to-end without external data dependencies. In a production setting these would be ingested from real remote-sensing/field-survey pipelines and written into the same `site_metrics` table.

## Local setup

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
# API at http://localhost:8000, interactive docs at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Add a free Mapbox public token to .env (https://account.mapbox.com/access-tokens/)
npm run dev
# App at http://localhost:5173
```

### Pre-commit hooks
```bash
cd frontend
npm run prepare   # installs Husky git hooks
```

## CI/CD pipeline

`.github/workflows/ci.yml` runs on every push/PR to `main`:
1. **Backend job**: installs dependencies, runs `flake8`, and does an import sanity check on the FastAPI app.
2. **Frontend job**: `npm ci`, ESLint, and a production build.

`.github/workflows/deploy.yml` gates deployment behind CI passing. Recommended deploy targets:
- **Backend** → [Render.com](https://render.com) (Web Service, `uvicorn app.main:app --host 0.0.0.0 --port $PORT`), with a managed Postgres add-on (PostGIS supported) or a free [Supabase](https://supabase.com) Postgres instance as `DATABASE_URL`.
- **Frontend** → [Vercel](https://vercel.com), build command `npm run build`, output directory `dist`, with `VITE_API_BASE_URL` and `VITE_MAPBOX_TOKEN` set as environment variables.

Both platforms auto-deploy on push to `main` once the repo is connected in their dashboards — no extra secrets required for the default setup.

## Key trade-offs

- **SQLite-by-default, Postgres-in-prod**: chosen so anyone can clone and run the app with zero external services, while keeping a clear, documented path to real PostGIS spatial queries in production.
- **GeoJSON column instead of native `Geometry` type**: keeps the same ORM models working identically on SQLite (dev) and Postgres (prod) without conditional code paths; the column is a drop-in swap for a real PostGIS geometry column later.
- **Mock analytics generation**: prioritizes a fully working, clickable analytics experience over building a data-ingestion pipeline for which no real dataset was provided.
