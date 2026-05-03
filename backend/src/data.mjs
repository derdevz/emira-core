export const players = [
  {
    id: 'emira_player',
    username: '@emira_player',
    displayName: 'Emira Dreamer',
    badge: 'Yumusak Isik',
    taps: 9,
    balanceNeaf: 128450,
    ownedCount: 3,
    walletAddress: null,
  },
  {
    id: 'cloud_paws',
    username: '@cloud_paws',
    displayName: 'Cloud Paws',
    badge: 'Sabah Yildizi',
    taps: 164,
    balanceNeaf: 884200,
    ownedCount: 12,
    walletAddress: 'GCLDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  },
  {
    id: 'mint_whisker',
    username: '@mint_whisker',
    displayName: 'Mint Whisker',
    badge: 'Ay Cizgisi',
    taps: 138,
    balanceNeaf: 761040,
    ownedCount: 9,
    walletAddress: 'GMNTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  },
];

export const listings = [
  {
    tokenId: 4200,
    name: 'Açık Kahve Kedi',
    rarity: 'Common',
    owner: 'MOTTO45',
    priceXlm: 1800,
    settlement: 'XLM',
    network: 'Stellar',
    requiresFreighter: true,
  },
  {
    tokenId: 4201,
    name: 'Ateş Kedisi',
    rarity: 'Epic',
    owner: 'neafguild',
    priceXlm: 2075,
    settlement: 'XLM',
    network: 'Stellar',
    requiresFreighter: true,
  },
];

export const playerProgress = new Map(
  players.map((player) => [
    player.id,
    {
      tapPower: player.id === 'emira_player' ? 1 : 6,
      passiveIncome: player.id === 'emira_player' ? 120 : 220,
      combo: 1,
      balanceNeaf: player.balanceNeaf,
    },
  ]),
);

export const sessionStore = new Map();
export const walletLinks = new Map(
  players
    .filter((player) => player.walletAddress)
    .map((player) => [
      player.id,
      {
        playerId: player.id,
        address: player.walletAddress,
        provider: 'freighter',
        linkedAt: new Date().toISOString(),
      },
    ]),
);

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function findPlayer(identifier) {
  if (!identifier) return null;
  return players.find((item) => item.id === identifier || item.username === `@${identifier}` || item.username === identifier) ?? null;
}

export function ensureTelegramPlayer(telegramUser) {
  const username = telegramUser.username ? `@${telegramUser.username}` : `@visitor_${telegramUser.id}`;
  const existing = findPlayer(telegramUser.username) ?? players.find((item) => item.username === username) ?? null;
  if (existing) {
    return existing;
  }

  const displayNameSource = telegramUser.username || `${telegramUser.firstName ?? 'Emira'} ${telegramUser.lastName ?? 'Guest'}`;
  const next = {
    id: slugify(telegramUser.username || telegramUser.id || displayNameSource),
    username,
    displayName: displayNameSource
      .split(/[_\s]+/)
      .filter(Boolean)
      .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
      .join(' '),
    badge: 'Yeni Yolcu',
    taps: 0,
    balanceNeaf: 128450,
    ownedCount: 0,
    walletAddress: null,
    telegramId: telegramUser.id,
  };

  players.push(next);
  playerProgress.set(next.id, {
    tapPower: 1,
    passiveIncome: 120,
    combo: 1,
    balanceNeaf: next.balanceNeaf,
  });
  return next;
}
