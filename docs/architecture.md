# Emira Clicker Architecture

## Goal

Emira should feel instant like a Telegram clicker game, but only economically meaningful actions should touch Soroban.
The frontend can animate taps immediately, while the backend validates progress and Soroban records durable ownership,
claims, rewards, and NFT state.

## Core Principle

Keep high-frequency gameplay off-chain. Put low-frequency, high-value state on-chain.

## On-Chain Soroban Scope

Recommended contracts:

- `EmiraToken`: EMR token or claimable reward token.
- `RewardVault`: season reward pool, claim windows, admin-funded emissions.
- `NftCollection`: NFT minting, ownership, upgrade metadata pointer, and museum bonus eligibility.
- `SeasonRegistry`: season id, reward rules, trusted snapshot root, and claim status.

On-chain should store:

- Wallet ownership.
- NFT ownership and durable upgrades.
- Claimable season rewards.
- Reward claim status.
- Contract events for backend/indexer reconciliation.

On-chain should not store:

- Every tap.
- Raw energy changes.
- Every combo tick.
- Fast-changing leaderboard rows.
- Telegram session state.

## Backend Scope

The backend is the game authority for moment-to-moment play.

Suggested services:

- `auth-service`: Telegram init data validation, wallet linking, session tokens.
- `game-service`: tap validation, energy regen, combo rules, daily tasks, anti-cheat.
- `inventory-service`: off-chain boosters, pending NFT boxes, market inventory.
- `leaderboard-service`: season snapshots, ranks, reward eligibility.
- `chain-worker`: builds Soroban transactions, tracks submitted txs, listens to events.
- `indexer`: consumes Soroban events and updates local read models.

Suggested database tables:

- `users`: telegram id, username, created at.
- `wallet_links`: user id, Stellar address, network, verified at.
- `player_progress`: user id, balance shadow, energy, tap power, level, streak.
- `tasks`: task definitions.
- `task_progress`: user id, task id, status, reward.
- `inventory_items`: user id, item type, quantity, source.
- `nft_cache`: contract token id, owner address, metadata, bonus.
- `leaderboard_entries`: season id, user id, score, rank.
- `season_snapshots`: season id, snapshot hash/root, generated at.
- `chain_transactions`: user id, xdr hash, status, tx hash, retry count.

## Freighter Flow

Frontend flow:

1. Check whether Freighter is installed with `isConnected`.
2. Request dapp access with `setAllowed` or `requestAccess`.
3. Read the public key with `getAddress` or the address returned from `requestAccess`.
4. Read network details with `getNetworkDetails`.
5. For Soroban actions, ask the backend to prepare an XDR.
6. User signs the XDR in Freighter.
7. Frontend sends signed XDR to backend or submits it directly, depending on the operation.

Use Freighter for:

- Wallet linking.
- Claiming EMR rewards.
- Minting/opening NFT boxes.
- Buying on-chain items.
- Signing authorization entries if a contract flow requires it.

Do not use Freighter for:

- Every tap.
- Daily mission increments.
- Pure UI state.

## Reward Model

Recommended first version:

1. Gameplay earns off-chain `soft_emr`.
2. Backend validates and calculates season score.
3. At season end, backend creates a reward snapshot.
4. `SeasonRegistry` stores the snapshot root/hash.
5. Players claim on-chain EMR through Freighter.

This keeps gameplay fast and limits transaction volume.

## Anti-Cheat

Minimum server-side checks:

- Tap rate limits per device/session/user.
- Energy cannot go negative.
- Tap power only changes from owned upgrades.
- Session heartbeat and suspicious burst detection.
- Leaderboard score calculated server-side, never trusted from the client.
- Wallet claims tied to a verified Telegram user.

## Frontend Modules

Current frontend sections should map to these responsibilities:

- Ana Sayfa: instant tap loop, local feedback, current wallet status.
- NFT Muzesi: read model from backend plus on-chain ownership cache.
- Pazar: backend catalog, Freighter only for on-chain purchases.
- Profil: Telegram user, wallet link, progression stats.
- Liderlik: backend leaderboard read model.
- Altyapi: visible architecture/status panel during early development.

## Next Implementation Steps

1. Add a backend API scaffold for auth, progress, leaderboard, and chain actions.
2. Add Soroban contract workspace under `contracts/`.
3. Implement `RewardVault` and `SeasonRegistry` first.
4. Add frontend API client and replace mocked state with backend reads.
5. Add transaction builder endpoints for claim and NFT mint.
6. Add event indexer to reconcile Soroban state into the backend database.
