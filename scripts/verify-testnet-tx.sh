#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Kullanim: scripts/verify-testnet-tx.sh <tx-hash>" >&2
  exit 1
fi

: "${STELLAR_RPC_URL:=https://soroban-testnet.stellar.org}"

stellar tx fetch "$1" --rpc-url "$STELLAR_RPC_URL"
