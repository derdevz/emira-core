# Telegram Mini App Plan

## Purpose

Telegram should be the fastest daily entry point into Emira.
It is not the replacement for the full web app; it is the retention layer.

## User Journey

1. User discovers the project from `Neaf-Web` or a Telegram channel.
2. User opens the Mini App.
3. Backend validates Telegram `initData`.
4. User starts tapping, claiming daily rewards, and browsing profile state.
5. When a real-value action is needed, the app requests wallet linking.
6. WalletConnect handles Stellar signing.
7. Soroban and Horizon settle the action.

## What Should Exist In Telegram

- home tap loop
- daily tasks
- streak and referral prompts
- profile summary
- owned NFT summary
- leaderboard snapshot
- market browse

## What Should Stay In The Full Web App

- complex market management
- deep museum browsing
- creator/admin tooling
- heavy analytics views
- debugging and architecture panels

## Wallet Model

- Web desktop: `Freighter`
- Telegram and mobile: `WalletConnect`
- Future onboarding simplification: `passkey smart wallet`

## Backend Needs

- Telegram session validation
- wallet link table
- prepared buy/list/cancel XDR endpoints
- read-model sync for profile, leaderboard, and market

## Frontend Needs

- wallet adapter abstraction
- Telegram surface detection
- reduced layout shell for Mini App
- fallback CTA to open the web app when a flow is not available in Telegram
