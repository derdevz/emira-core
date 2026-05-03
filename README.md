# Emira Core

Emira is a Telegram-style clicker game prototype built for the Stellar / Soroban hackathon flow with Freighter wallet login.
The repository now contains the React frontend, a Soroban smart contract scaffold, project screenshots, and submission
artifacts for the final Rise In delivery.

## Current Scope

- Clicker game frontend with separate pages for home, NFT museum, market, profile, and leaderboard.
- Lightweight hybrid backend scaffold for profiles, leaderboards, tap validation, and chain-preparation APIs.
- Wallet abstraction scaffold for Freighter-first web and future WalletConnect Telegram/mobile flows.
- Telegram auth, session-token, and wallet-link backend scaffold.
- Optional PostgreSQL-backed persistence with file fallback for local development.
- Freighter wallet detection, connect flow, wallet menu, address copy, switch, and local disconnect actions.
- Soroban smart contract scaffold for reward and player progress snapshots.
- Soroban marketplace contract scaffold for XLM-based Stellar market flows.
- Soroban build, deploy, and transaction verification scripts for Stellar testnet.
- Soroban-oriented architecture notes for rewards, NFT ownership, seasonal leaderboards, and off-chain progress.
- Telegram Mini App integration plan for retention gameplay and mobile wallet flows.
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
  telegram-mini-app.md   Telegram Mini App scope and wallet plan
  screenshots/           Project screenshots for hackathon submission
  submission/            Submission checklist and transaction hash placeholder
backend/
  src/                   Lightweight hybrid API scaffold
  data/                  File fallback runtime state
  package.json           Backend scripts
contracts/
  emira_marketplace/     Soroban smart contract scaffold for marketplace state
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
cd backend
npm run dev
```

Backend default URL:

```text
http://localhost:8080
```

Then in a second terminal:

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

When `POSTGRES_URL` is configured, the backend persists players, sessions, wallet links, listings, and progress in
PostgreSQL. Without it, the backend falls back to `backend/data/runtime-state.json`.

## Soroban Contract

The repository includes a Soroban contract workspace under `contracts/emira_rewards`.

Marketplace scaffold also exists under `contracts/emira_marketplace`.

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

## Telegram + Vercel Deployment

The repository is now prepared for a single-origin Vercel deployment:

- `frontend/dist` is published as the site output
- `/api/*` and `/health` are routed to the serverless entry at `api/index.mjs`
- frontend API calls default to the same origin, so `VITE_API_BASE_URL` can stay empty on Vercel
- when running on Vercel without PostgreSQL, runtime fallback data is stored in `/tmp/emira-runtime-state.json`

Recommended Vercel environment variables:

- `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBAPP_URL`
- `SESSION_JWT_SECRET`
- `WALLETCONNECT_PROJECT_ID`
- `VITE_WALLETCONNECT_PROJECT_ID`
- `VITE_TELEGRAM_BOT_USERNAME`
- `VITE_TELEGRAM_WEBAPP_URL`
- `VITE_STELLAR_NETWORK`
- `VITE_SOROBAN_RPC_URL`
- `VITE_STELLAR_HORIZON_URL`
- `VITE_STELLAR_MARKETPLACE_ADDRESS`
- `VITE_SOROBAN_MARKET_CONTRACT_ID`
- `VITE_SOROBAN_REWARDS_CONTRACT_ID`
- `SOROBAN_REWARDS_CONTRACT_ID`
- `ALLOW_TELEGRAM_MOCK=false`

After the first Vercel deploy, set the Telegram Mini App URL in BotFather to the exact production URL, for example:

```text
https://your-vercel-domain.vercel.app
```

If you want persistence across deployments and cold starts, configure `POSTGRES_URL`.

## Environment

Copy the example file before local development:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Key frontend variables:

- `VITE_API_BASE_URL`: backend API URL, leave empty for same-origin Vercel deploy or set `http://localhost:8080` for local backend
- `VITE_STELLAR_NETWORK`: expected Stellar network, default `testnet`
- `VITE_SOROBAN_RPC_URL`: Soroban RPC URL
- `VITE_WALLETCONNECT_PROJECT_ID`: WalletConnect project id for Telegram/mobile surfaces
- `VITE_TELEGRAM_BOT_USERNAME`: Mini App bot username
- `VITE_TELEGRAM_WEBAPP_URL`: public Telegram Mini App URL
- `VITE_SOROBAN_MARKET_CONTRACT_ID`: live marketplace contract id
- `VITE_SOROBAN_REWARDS_CONTRACT_ID`: live rewards contract id

Key backend variables:

- `PORT`: backend port
- `STELLAR_NETWORK`: expected network for chain actions
- `SOROBAN_RPC_URL`: Soroban RPC URL
- `STELLAR_HORIZON_URL`: Horizon URL for transaction submission
- `STELLAR_MARKETPLACE_ADDRESS`: destination account for XLM market settlement
- `SOROBAN_MARKET_CONTRACT_ID`: marketplace contract id for prepared on-chain actions
- `SOROBAN_REWARDS_CONTRACT_ID`: rewards contract id for backend chain metadata
- `TELEGRAM_BOT_USERNAME`: Telegram bot username used by the Mini App
- `TELEGRAM_WEBAPP_URL`: Telegram Mini App URL
- `WALLETCONNECT_PROJECT_ID`: WalletConnect project id for mobile / Telegram signing
- `TELEGRAM_BOT_TOKEN`: Telegram WebApp validation token
- `SESSION_JWT_SECRET`: backend session signing secret
- `POSTGRES_URL`: persistent database connection string
- `DATA_FILE`: optional local runtime state file path, not needed on Vercel unless you want a custom tmp path
- `ALLOW_TELEGRAM_MOCK`: keep `false` in production; only enable for local testing

## Planned Backend And Contract Direction

High-frequency gameplay state should stay off-chain in the backend:

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
See [docs/telegram-mini-app.md](docs/telegram-mini-app.md) for the Telegram Mini App scope.
See [docs/deploy-testnet.md](docs/deploy-testnet.md) for the Soroban testnet deployment flow.

Backend API now also includes:

- `POST /api/v1/auth/telegram`
- `GET /api/v1/auth/session`
- `POST /api/v1/wallet/link`
- `GET /api/v1/wallet/link/:playerId`

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

- Real Stellar testnet deploy and init transaction hashes are now recorded in
  `docs/submission/transaction-hash.md`.
- After finalizing the repository, the GitHub repository link should be submitted through the Rise In platform.
