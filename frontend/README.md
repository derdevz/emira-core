# Emira Frontend

React frontend for the Emira clicker game.

## Pages

- `/` - clicker home, Freighter login panel, game stats
- `/museum` - NFT museum and collection widgets
- `/market` - market items and tap upgrades
- `/profile` - player profile and wallet status
- `/leaderboard` - seasonal leaderboard

## Scripts

```powershell
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Docker

```powershell
docker compose up --build -d
```

## Freighter

The app detects Freighter on load. If access was already granted, it reads the active address and network. If access is
missing, the user can connect from the navbar, home page wallet panel, or profile page.

Wallet actions currently implemented:

- connect with Freighter
- show network and shortened address
- copy full address
- request wallet switch/reconnect
- local disconnect from the app state
