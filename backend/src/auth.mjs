import crypto from 'node:crypto';

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf-8'));
}

function signPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(payload, secret) {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const body = encode(payload);
  const signature = signPayload(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}

export function verifySessionToken(token, secret) {
  if (!token) return null;
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) return null;

  const expected = signPayload(`${header}.${body}`, secret);
  if (signature !== expected) return null;

  const payload = decode(body);
  if (typeof payload.exp === 'number' && Date.now() > payload.exp) return null;
  return payload;
}

export function createOpaqueId(prefix) {
  return `${prefix}_${crypto.randomBytes(10).toString('hex')}`;
}

export function parseTelegramInitData(initData) {
  if (!initData || typeof initData !== 'string') return null;

  if (initData.startsWith('mock:')) {
    const username = initData.slice(5).trim() || 'emira_player';
    return {
      id: `tg_${username}`,
      username,
      firstName: 'Emira',
      lastName: 'Player',
      validationMode: 'mock',
    };
  }

  const params = new URLSearchParams(initData);
  const rawUser = params.get('user');
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser);
    return {
      id: user.id ? String(user.id) : undefined,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      validationMode: 'unsafe-parse',
    };
  } catch {
    return null;
  }
}

function hmacSha256(key, value) {
  return crypto.createHmac('sha256', key).update(value).digest();
}

export function verifyTelegramInitData(initData, botToken) {
  if (!initData || typeof initData !== 'string' || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = hmacSha256('WebAppData', botToken);
  const signature = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (signature !== hash) return null;

  const rawUser = params.get('user');
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser);
    return {
      id: user.id ? String(user.id) : undefined,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      validationMode: 'telegram-hmac',
    };
  } catch {
    return null;
  }
}
