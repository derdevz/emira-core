# Emira Core

Emira is a Telegram-style clicker game prototype built for the Stellar / Soroban hackathon flow with Freighter wallet login.
The repository now contains the React frontend, a Soroban smart contract scaffold, project screenshots, and submission
artifacts for the final Rise In delivery.

## Current Scope

- Clicker game frontend with separate pages for home, NFT museum, market, profile, and leaderboard.
- Freighter wallet detection, connect flow, wallet menu, address copy, switch, and local disconnect actions.
- Soroban smart contract scaffold for reward and player progress snapshots.
- Soroban-oriented architecture notes for rewards, NFT ownership, seasonal leaderboards, and off-chain progress.
- Dockerized frontend build and runtime.
- Submission checklist, screenshots, and transaction hash placeholder.

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Freighter API
- Stellar SDK
- Docker Compose
- Rust
- Soroban SDK

## Repository Layout

```text
docs/
  architecture.md        Game, backend, Soroban, and Freighter architecture notes
  screenshots/           Project screenshots for hackathon submission
  submission/            Submission checklist and transaction hash placeholder
contracts/
  emira_rewards/         Soroban smart contract scaffold for player rewards
frontend/
  src/                   React application
  Dockerfile             Production frontend image
  nginx.conf             SPA-aware Nginx config
  package.json           Frontend scripts and dependencies
Cargo.toml               Root Rust workspace definition
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

## Soroban Contract

The repository includes a Soroban contract workspace under `contracts/emira_rewards`.

Current contract scaffold responsibilities:

- initialize a reward pool with an admin
- record player tap progress
- record owned NFT counts
- claim a reward snapshot against the pool
- read a stored player summary

This is a scaffold for hackathon progression and should be extended with real auth rules, token transfers, and tests
before production use.

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

## Hackathon Submission Files

Required repository artifacts are included here:

- English root `README.md`
- screenshot folder at `docs/screenshots/`
- transaction hash placeholder at `docs/submission/transaction-hash.md`
- submission checklist at `docs/submission/checklist.md`

Important note:

- The real Stellar testnet transaction hash must still be produced manually from Freighter and pasted into
  `docs/submission/transaction-hash.md`.
- After finalizing the repository, the GitHub repository link should be submitted through the Rise In platform.
