# Emira Core

Emira is a Telegram-style clicker game planned around Stellar Soroban smart contracts and Freighter wallet login.
The current repository contains the React frontend, a root-level Docker setup, and architecture notes for the next
backend and contract layers.

## Current Scope

- Clicker game frontend with separate pages for home, NFT museum, market, profile, and leaderboard.
- Freighter wallet detection, connect flow, wallet menu, address copy, switch, and local disconnect actions.
- Soroban-oriented architecture notes for rewards, NFT ownership, seasonal leaderboards, and off-chain progress.
- Dockerized frontend build and runtime.

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Freighter API
- Stellar SDK
- Docker Compose

## Repository Layout

```text
docs/
  architecture.md        Game, backend, Soroban, and Freighter architecture notes
frontend/
  src/                   React application
  Dockerfile             Production frontend image
  nginx.conf             SPA-aware Nginx config
  package.json           Frontend scripts and dependencies
docker-compose.yml       Root Docker entrypoint
```

## Local Development

```powershell
cd frontend
npm install
npm run dev
```

The Vite app will run on the port printed by Vite, usually `http://localhost:5173`.

## Docker

```powershell
docker compose up --build -d
```

Open:

```text
http://localhost:5173
```

## GitHub Pages

The repository includes a Pages deployment workflow for the frontend.
The deploy build enables `VITE_USE_HASH_ROUTER=true`, so direct refreshes and deep links work on GitHub Pages without
server-side rewrite rules.

## Environment

Copy the example file before local development:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Key variables:

- `VITE_API_BASE_URL`: backend API URL, default `http://localhost:8080`
- `VITE_STELLAR_NETWORK`: expected Stellar network, default `testnet`
- `VITE_SOROBAN_RPC_URL`: Soroban RPC URL

## Planned Backend And Contract Direction

High-frequency gameplay state should stay off-chain:

- taps
- energy
- combo
- daily tasks
- live leaderboard calculations

Soroban should store durable economic state:

- reward claims
- NFT ownership
- season reward snapshots
- vault funding and claim status

See [docs/architecture.md](docs/architecture.md) for the detailed plan.
See [docs/roadmap.md](docs/roadmap.md) for the staged development roadmap.

## GitHub Workflow

The repository includes:

- `frontend-ci.yml` for install, lint, and build validation on pull requests and pushes to `main`
- `deploy-pages.yml` for GitHub Pages deployment from `main`
