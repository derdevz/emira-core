import { postgresEnabled } from './db.mjs';

export function createRuntimeConfig() {
  const telegramBotUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'emira_test_bot';
  const telegramWebAppUrl = process.env.TELEGRAM_WEBAPP_URL ?? 'https://example.com/telegram';
  const telegramStartapp = process.env.TELEGRAM_STARTAPP ?? 'emira-core';
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN ?? '';

  return {
    stellarNetwork: process.env.STELLAR_NETWORK ?? 'testnet',
    sorobanRpcUrl: process.env.SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
    horizonUrl: process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org',
    marketplaceAddress: process.env.STELLAR_MARKETPLACE_ADDRESS ?? 'GCZGKZXINPUV6PMBHWOGKX4B2LAB4PUUOFSV4KJ765C6ZQXZNRDDF6SB',
    marketContractId: process.env.SOROBAN_MARKET_CONTRACT_ID ?? 'CBRKJVWTTF5DO2ZVIDOP3TSBTPYQXHGQIPA4ANFI7WKG4X65Y3MCCXJI',
    rewardsContractId: process.env.SOROBAN_REWARDS_CONTRACT_ID ?? 'CCO434MY5ASOQIJALSN2KINXVEQMJKCW3HRMVRZSF2MOXUI7O3V4WTJD',
    telegramBotUsername,
    telegramBotToken,
    telegramWebAppUrl,
    telegramStartapp,
    walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID ?? '',
    sessionJwtSecret: process.env.SESSION_JWT_SECRET ?? 'change-me',
    allowTelegramMock: process.env.ALLOW_TELEGRAM_MOCK === 'true',
    telegramLaunchUrl: telegramBotUsername
      ? `https://t.me/${telegramBotUsername}?startapp=${encodeURIComponent(telegramStartapp)}`
      : null,
    storageMode: postgresEnabled() ? 'postgres' : 'file',
  };
}
