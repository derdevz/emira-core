import http from 'node:http';
import { postgresEnabled } from './db.mjs';
import { handleRoute } from './routes.mjs';

const port = Number(process.env.PORT ?? 8080);

const config = {
  stellarNetwork: process.env.STELLAR_NETWORK ?? 'testnet',
  sorobanRpcUrl: process.env.SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  horizonUrl: process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org',
  marketplaceAddress: process.env.STELLAR_MARKETPLACE_ADDRESS ?? 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  marketContractId: process.env.SOROBAN_MARKET_CONTRACT_ID ?? 'CDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME ?? 'emira_test_bot',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramWebAppUrl: process.env.TELEGRAM_WEBAPP_URL ?? 'https://example.com/telegram',
  walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID ?? '',
  sessionJwtSecret: process.env.SESSION_JWT_SECRET ?? 'change-me',
  storageMode: postgresEnabled() ? 'postgres' : 'file',
};

const server = http.createServer(async (request, response) => {
  try {
    await handleRoute(request, response, config);
  } catch (error) {
    response.writeHead(500, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    response.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown backend error',
      }),
    );
  }
});

server.listen(port, () => {
  console.log(`Emira backend listening on http://localhost:${port}`);
});
