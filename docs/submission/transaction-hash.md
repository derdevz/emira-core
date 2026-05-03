# Test Transaction Hash

This file records the real Stellar / Soroban testnet transactions produced for Emira Core validation on 2026-05-03.

## Status

Validated on Stellar testnet.

## Contract IDs

- `emira_marketplace`: `CBRKJVWTTF5DO2ZVIDOP3TSBTPYQXHGQIPA4ANFI7WKG4X65Y3MCCXJI`
- `emira_rewards`: `CCO434MY5ASOQIJALSN2KINXVEQMJKCW3HRMVRZSF2MOXUI7O3V4WTJD`

## Verified transaction hashes

- Marketplace upload: `07f4f26164870b4110deee7001eee0faaa4b8f5bd8c20fc350fb16674aa28a36`
- Marketplace deploy: `a025b5e75ba66744f197912a8f1e0d83cee7f9d3d33fe92375f9a73b531ca28c`
- Marketplace init: `9059e4423aa6c9bd7d379a1736dbf5015cb84091aeb02c0c0568e05d7a587df5`
- Rewards upload: `b25f7fbcffcc9b381e80578abf2b5334531b977532633a24f2ef40cd79c97b32`
- Rewards deploy: `a3a33e1004ef366c0240b7c3e782c9d2fe5c620558225ef8fd42822c353d8d51`
- Rewards init: `2a62f4aabc67eb25a4d44bec9e286d9bdab15291a561048707b34de7e7a5095f`

```text
9059e4423aa6c9bd7d379a1736dbf5015cb84091aeb02c0c0568e05d7a587df5
```

## Verification notes

- `emira_marketplace.get_config()` returned `settlement_asset = XLM` with the expected admin/operator.
- `emira_rewards.get_config()` returned the expected admin, reward pool, and max claim values.
- These transactions were executed with a temporary isolated Stellar testnet identity via Stellar CLI to validate the on-chain deployment path in this repository.
