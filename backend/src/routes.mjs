import { createOpaqueId, createSessionToken, parseTelegramInitData, verifySessionToken } from './auth.mjs';
import { ensureTelegramPlayer, findPlayer, listings, playerProgress, players, sessionStore, walletLinks } from './data.mjs';

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(payload));
}

function notFound(response) {
  json(response, 404, { error: 'Not found' });
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let data = '';
    request.on('data', (chunk) => {
      data += chunk;
    });
    request.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

export async function handleRoute(request, response, config) {
  const url = new URL(request.url ?? '/', 'http://localhost');

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    response.end();
    return;
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    json(response, 200, { ok: true, service: 'emira-backend', mode: 'hybrid' });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v1/config') {
    json(response, 200, {
      mode: 'hybrid',
      chain: 'stellar',
      wallets: {
        web: ['freighter'],
        telegram: ['walletconnect'],
        mobile: ['walletconnect'],
        planned: ['passkey-smart-wallet'],
      },
      auth: {
        telegram: 'required-for-mini-app',
        walletLink: 'required-for-on-chain-actions',
      },
      settlementAsset: 'XLM',
      gameplayAsset: 'NEAF',
      network: config.stellarNetwork,
      sorobanRpcUrl: config.sorobanRpcUrl,
      horizonUrl: config.horizonUrl,
      marketplaceAddress: config.marketplaceAddress,
      marketContractId: config.marketContractId,
      surfaces: {
        promo: 'Neaf-Web',
        app: 'Emira Core Web',
        miniApp: 'Telegram Mini App',
      },
      telegram: {
        botUsername: config.telegramBotUsername,
        webAppUrl: config.telegramWebAppUrl,
      },
      walletConnect: {
        projectIdConfigured: Boolean(config.walletConnectProjectId),
      },
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/v1/auth/telegram') {
    const body = await readBody(request).catch(() => null);
    const telegramUser = parseTelegramInitData(body?.initData) ?? (body?.telegramUser && typeof body.telegramUser === 'object' ? body.telegramUser : null);
    if (!telegramUser || !telegramUser.id) {
      json(response, 400, {
        error: 'telegram initData or telegramUser required',
        hint: 'Use mock:<username> during local development until full Telegram signature validation is added.',
      });
      return;
    }

    const player = ensureTelegramPlayer(telegramUser);
    const sessionId = createOpaqueId('sess');
    const sessionRecord = {
      sid: sessionId,
      playerId: player.id,
      surface: 'telegram',
      providerPreference: 'walletconnect',
      telegramId: telegramUser.id,
      createdAt: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 3,
    };
    const token = createSessionToken(sessionRecord, config.sessionJwtSecret);
    sessionStore.set(sessionId, sessionRecord);

    json(response, 200, {
      ok: true,
      validationMode: telegramUser.validationMode ?? 'scaffold',
      player,
      session: {
        token,
        expiresAt: new Date(sessionRecord.exp).toISOString(),
        surface: sessionRecord.surface,
        preferredWallet: sessionRecord.providerPreference,
      },
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v1/auth/session') {
    const token = url.searchParams.get('token') ?? '';
    const payload = verifySessionToken(token, config.sessionJwtSecret);
    if (!payload) {
      json(response, 401, { error: 'invalid session token' });
      return;
    }

    const storedSession = sessionStore.get(payload.sid);
    const player = storedSession ? findPlayer(storedSession.playerId) : null;
    json(response, 200, {
      ok: Boolean(storedSession && player),
      session: storedSession ?? null,
      player,
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v1/leaderboard') {
    const mode = url.searchParams.get('mode') ?? 'taps';
    const sorted = [...players].sort((left, right) => {
      if (mode === 'balance') return right.balanceNeaf - left.balanceNeaf;
      if (mode === 'owned') return right.ownedCount - left.ownedCount;
      return right.taps - left.taps;
    });
    json(response, 200, { mode, items: sorted });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v1/market/listings') {
    json(response, 200, {
      settlement: 'XLM',
      network: 'Stellar',
      wallet: 'Freighter',
      items: listings,
    });
    return;
  }

  if (request.method === 'GET' && url.pathname.startsWith('/api/v1/profile/')) {
    const playerId = url.pathname.split('/').pop();
    const player = findPlayer(playerId);
    if (!player) {
      notFound(response);
      return;
    }

    json(response, 200, {
      player,
      progress: playerProgress.get(player.id) ?? null,
      walletLink: walletLinks.get(player.id) ?? null,
      chain: {
        network: config.stellarNetwork,
        wallet: player.walletAddress ? 'linked' : 'unlinked',
      },
    });
    return;
  }

  if (request.method === 'GET' && url.pathname.startsWith('/api/v1/wallet/link/')) {
    const playerId = url.pathname.split('/').pop();
    const player = findPlayer(playerId);
    if (!player) {
      notFound(response);
      return;
    }

    json(response, 200, {
      playerId: player.id,
      walletLink: walletLinks.get(player.id) ?? null,
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/v1/progress/tap') {
    const body = await readBody(request).catch(() => null);
    if (!body || typeof body.playerId !== 'string') {
      json(response, 400, { error: 'playerId required' });
      return;
    }

    const current = playerProgress.get(body.playerId);
    if (!current) {
      notFound(response);
      return;
    }

    const next = {
      ...current,
      combo: current.combo >= 25 ? 1 : current.combo + 1,
      balanceNeaf: current.balanceNeaf + current.tapPower * current.combo,
    };
    playerProgress.set(body.playerId, next);
    json(response, 200, { ok: true, progress: next });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/v1/market/prepare-buy') {
    const body = await readBody(request).catch(() => null);
    if (!body || typeof body.tokenId !== 'number' || typeof body.buyerAddress !== 'string') {
      json(response, 400, { error: 'tokenId and buyerAddress required' });
      return;
    }

    const listing = listings.find((item) => item.tokenId === body.tokenId);
    if (!listing) {
      notFound(response);
      return;
    }

    json(response, 200, {
      ok: true,
      mode: 'freighter-sign-required',
      settlement: 'XLM',
      network: config.stellarNetwork,
      buyerAddress: body.buyerAddress,
      destinationAddress: config.marketplaceAddress,
      amountXlm: listing.priceXlm,
      memoText: `EMIRA-${listing.tokenId}`,
      soroban: {
        contractId: config.marketContractId,
        nextAction: 'sign with Freighter then submit to Stellar',
      },
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/v1/wallet/link') {
    const body = await readBody(request).catch(() => null);
    const token = body?.sessionToken;
    const address = body?.address;
    const provider = body?.provider;

    if (typeof token !== 'string' || typeof address !== 'string' || typeof provider !== 'string') {
      json(response, 400, { error: 'sessionToken, address and provider required' });
      return;
    }

    const payload = verifySessionToken(token, config.sessionJwtSecret);
    if (!payload) {
      json(response, 401, { error: 'invalid session token' });
      return;
    }

    const session = sessionStore.get(payload.sid);
    if (!session) {
      json(response, 401, { error: 'session expired or missing' });
      return;
    }

    const player = findPlayer(session.playerId);
    if (!player) {
      notFound(response);
      return;
    }

    player.walletAddress = address;
    const walletLink = {
      id: createOpaqueId('wlink'),
      playerId: player.id,
      address,
      provider,
      linkedAt: new Date().toISOString(),
      network: config.stellarNetwork,
    };
    walletLinks.set(player.id, walletLink);

    json(response, 200, {
      ok: true,
      player,
      walletLink,
    });
    return;
  }

  notFound(response);
}
