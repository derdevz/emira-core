# Stellar Testnet Deploy

This repo includes a full Soroban build and deploy path for `emira_marketplace` and `emira_rewards`.

## Required environment

```bash
export STELLAR_SECRET_KEY="S..."
export STELLAR_KEY_ALIAS="emira-testnet"
export STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
export MARKET_SETTLEMENT_OPERATOR="G..."
export MARKET_MIN_PRICE_STROOPS="1000000"
export REWARDS_POOL="100000000"
export REWARDS_MAX_CLAIM="5000000"
```

## Build contracts

```bash
./scripts/build-soroban.sh
```

## Deploy and initialize

```bash
./scripts/deploy-testnet.sh
```

The script:

- builds both contracts
- ensures a local Stellar CLI identity exists
- deploys both WASM artifacts to Soroban testnet
- initializes:
  - `emira_marketplace(admin, settlement_operator, min_price_stroops)`
  - `emira_rewards(admin, reward_pool, max_claim_per_call)`

## Verify a transaction hash

```bash
./scripts/verify-testnet-tx.sh <TX_HASH>
```

## Notes

- Production deployment still requires real testnet credentials and funded accounts.
- `emira_marketplace` is state-oriented and expects XLM settlement to be signed in the wallet layer.
- `emira_rewards` is designed for hybrid flows where off-chain validation decides when reward claims are permitted.
