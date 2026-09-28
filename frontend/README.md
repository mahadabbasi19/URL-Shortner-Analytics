# Frontend

React + TypeScript + Vite dashboard for the URL Shortener & Analytics Platform. See the [repo root README](../README.md#frontend) for the full write-up (pages, state management, design decisions).

## Local development

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL if the backend isn't on localhost:8000
npm run dev
```

Or via Docker, from the repo root: `docker compose up -d frontend` (the backend, Postgres, and Redis need to be running too — `docker compose up -d` starts everything).

## Scripts

- `npm run dev` — Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then production build
- `npm run lint` — Oxlint
