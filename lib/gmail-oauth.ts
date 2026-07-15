import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

const algorithm = 'aes-256-gcm';

export type GmailConnection = {
  accessToken: string;
  refreshToken?: string;
  ownerId: string;
};

export type GmailOAuthState = {
  nonce: string;
  ownerId: string;
};

function getKey() {
  const secret = process.env.GOOGLE_GMAIL_CLIENT_SECRET;
  if (!secret) throw new Error('Missing GOOGLE_GMAIL_CLIENT_SECRET.');
  return createHash('sha256').update(secret).digest();
}

export function getGmailOAuthConfig() {
  const clientId = process.env.GOOGLE_GMAIL_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri)
    throw new Error('Gmail OAuth is not configured.');
  return { clientId, clientSecret, redirectUri };
}

export function createNonce() {
  return randomBytes(32).toString('base64url');
}

export function seal(value: GmailConnection | GmailOAuthState) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    'base64url'
  );
}

export function unseal<T>(value?: string): T | null {
  if (!value) return null;
  try {
    const payload = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv(
      algorithm,
      getKey(),
      payload.subarray(0, 12)
    );
    decipher.setAuthTag(payload.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([
        decipher.update(payload.subarray(28)),
        decipher.final(),
      ]).toString('utf8')
    ) as T;
  } catch {
    return null;
  }
}
