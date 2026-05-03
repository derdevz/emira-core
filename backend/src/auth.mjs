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
