# Emira Roadmap

## Phase 1 - Frontend Foundation

- Separate game pages for home, NFT museum, market, profile, and leaderboard.
- Freighter detection and wallet login.
- Wallet abstraction layer for Freighter and WalletConnect.
- Wallet menu actions: copy address, switch wallet, local disconnect.
- Dockerized frontend runtime.
- Frontend CI for lint and production build.

## Phase 2 - Backend Foundation

- Telegram auth validation.
- Session tokens and wallet-link records.
- Player progress API.
- Server-authoritative tap and energy logic.
- Daily task and streak system.
- Leaderboard read model.
- Market preparation endpoint for Freighter-signed XLM purchases.
- Public promo metrics endpoint for Neaf-Web.

## Phase 3 - Soroban Contracts

- Reward vault contract.
- Season registry contract.
- NFT collection or NFT ownership integration.
- Claim transaction builder.
- Contract event indexing.
- WalletConnect purchase flow for Telegram/mobile.

## Phase 4 - Economy And Anti-Cheat

- Rate limiting and suspicious session detection.
- Snapshot based reward calculation.
- Claimable balance reconciliation.
- Admin tools for seasons and reward pools.

## Phase 5 - Production Readiness

- Error tracking.
- API observability.
- Contract deployment scripts.
- Database migrations.
- Staging and production deployment workflows.
- Telegram Mini App packaging and release flow.
