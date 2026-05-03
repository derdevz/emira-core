#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

: "${STELLAR_RPC_URL:=https://soroban-testnet.stellar.org}"
: "${STELLAR_NETWORK_PASSPHRASE:=Test SDF Network ; September 2015}"
: "${STELLAR_KEY_ALIAS:=emira-testnet}"

if [[ -z "${STELLAR_SECRET_KEY:-}" ]]; then
  echo "STELLAR_SECRET_KEY gerekli." >&2
  exit 1
fi

: "${MARKET_SETTLEMENT_OPERATOR:=}"
: "${MARKET_MIN_PRICE_STROOPS:=1000000}"
: "${REWARDS_POOL:=100000000}"
: "${REWARDS_MAX_CLAIM:=5000000}"

if [[ -z "$MARKET_SETTLEMENT_OPERATOR" ]]; then
  echo "MARKET_SETTLEMENT_OPERATOR gerekli." >&2
  exit 1
fi

"$ROOT_DIR/scripts/build-soroban.sh"

if ! stellar keys public-key "$STELLAR_KEY_ALIAS" >/dev/null 2>&1; then
  printf '%s\n' "$STELLAR_SECRET_KEY" | stellar keys add "$STELLAR_KEY_ALIAS"
fi

ADMIN_ADDRESS="$(stellar keys public-key "$STELLAR_KEY_ALIAS")"

MARKET_WASM="$(find .soroban/emira_marketplace -type f -name '*.wasm' | head -n 1)"
REWARDS_WASM="$(find .soroban/emira_rewards -type f -name '*.wasm' | head -n 1)"

if [[ -z "$MARKET_WASM" || -z "$REWARDS_WASM" ]]; then
  echo "WASM artifactlari bulunamadi." >&2
  exit 1
fi

echo "Deploying emira_marketplace..."
MARKET_CONTRACT_ID="$(stellar contract deploy \
  --wasm "$MARKET_WASM" \
  --source-account "$STELLAR_KEY_ALIAS" \
  --rpc-url "$STELLAR_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE")"

echo "Deploying emira_rewards..."
REWARDS_CONTRACT_ID="$(stellar contract deploy \
  --wasm "$REWARDS_WASM" \
  --source-account "$STELLAR_KEY_ALIAS" \
  --rpc-url "$STELLAR_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE")"

echo "Initializing contracts..."
stellar contract invoke \
  --id "$MARKET_CONTRACT_ID" \
  --source-account "$STELLAR_KEY_ALIAS" \
  --rpc-url "$STELLAR_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  --send yes \
  -- init \
  --admin "$ADMIN_ADDRESS" \
  --settlement-operator "$MARKET_SETTLEMENT_OPERATOR" \
  --min-price-stroops "$MARKET_MIN_PRICE_STROOPS"

stellar contract invoke \
  --id "$REWARDS_CONTRACT_ID" \
  --source-account "$STELLAR_KEY_ALIAS" \
  --rpc-url "$STELLAR_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  --send yes \
  -- init \
  --admin "$ADMIN_ADDRESS" \
  --reward-pool "$REWARDS_POOL" \
  --max-claim-per-call "$REWARDS_MAX_CLAIM"

cat <<EOF
Deployment complete.
MARKET_CONTRACT_ID=$MARKET_CONTRACT_ID
REWARDS_CONTRACT_ID=$REWARDS_CONTRACT_ID
ADMIN_ADDRESS=$ADMIN_ADDRESS
EOF
