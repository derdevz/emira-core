# Emira Backend

This backend is the hybrid read/write layer for Emira Core.

## Purpose

- keep fast-changing gameplay state off-chain
- expose leaderboard, profile, and market read models
- prepare Soroban / Stellar transaction payloads for the frontend
- reconcile Freighter-signed XLM actions with local game state
- validate Telegram Mini App sessions and wallet linking
- expose a single config surface for web, promo, and Telegram clients

## Current Scope

- health endpoint
- public app config endpoint
- Telegram auth scaffold endpoint
- session inspection endpoint
- wallet link scaffold endpoint
- mock profile endpoint
- mock leaderboard endpoint
- mock market listing endpoint
- tap/progress mutation scaffold
- market purchase preparation scaffold

## Current API

- `GET /health`
- `GET /api/v1/config`
- `POST /api/v1/auth/telegram`
- `GET /api/v1/auth/session`
- `POST /api/v1/wallet/link`
- `GET /api/v1/wallet/link/:playerId`
- `GET /api/v1/profile/:player`
- `GET /api/v1/leaderboard`
- `GET /api/v1/market/listings`
- `POST /api/v1/progress/tap`
- `POST /api/v1/market/prepare-buy`

## Planned Hybrid Role

- `Neaf-Web`: promo and funnel, reads public backend summaries
- `Emira Core Web`: primary game, Freighter-first wallet surface
- `Telegram Mini App`: retention surface, Telegram auth + WalletConnect
- `Soroban`: durable market and reward state

## Run

```bash
cd backend
cp .env.example .env
npm run dev
```

Default URL:

```text
http://localhost:8080
```
