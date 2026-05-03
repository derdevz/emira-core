const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed: ${response.status}`);
  }

  return data;
}

export async function fetchAppConfig() {
  return request('/api/v1/config');
}

export async function fetchLeaderboard(mode: 'taps' | 'balance' | 'owned' = 'taps') {
  const query = new URLSearchParams({ mode }).toString();
  return request(`/api/v1/leaderboard?${query}`);
}

export async function fetchMarketListings() {
  return request('/api/v1/market/listings');
}

export async function recordTap(playerId: string) {
  return request('/api/v1/progress/tap', {
    method: 'POST',
    body: JSON.stringify({ playerId }),
  });
}

export async function prepareMarketListing(input: {
  tokenId: number;
  ownerAddress: string;
  priceXlm: number;
  name: string;
  rarity: string;
  provider: string;
}) {
  return request('/api/v1/market/prepare-list', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function prepareMarketCancel(tokenId: number) {
  return request('/api/v1/market/prepare-cancel', {
    method: 'POST',
    body: JSON.stringify({ tokenId }),
  });
}

export async function authenticateTelegram(initData: string) {
  return request('/api/v1/auth/telegram', {
    method: 'POST',
    body: JSON.stringify({ initData }),
  });
}

export async function fetchSession(token: string) {
  const query = new URLSearchParams({ token }).toString();
  return request(`/api/v1/auth/session?${query}`);
}

export async function linkWallet(input: { sessionToken: string; address: string; provider: string }) {
  return request('/api/v1/wallet/link', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchProfile(playerId: string) {
  return request(`/api/v1/profile/${playerId}`);
}
