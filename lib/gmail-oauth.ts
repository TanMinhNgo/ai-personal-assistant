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

// Authenticated Gmail API fetcher that transparently refreshes the access token
// on a 401 using the stored refresh token. Callers persist the refreshed token
// (via getRefreshedToken) back into the sealed cookie.
export function createGmailFetcher(connection: GmailConnection) {
  let accessToken = connection.accessToken;
  let refreshedToken: string | null = null;

  async function gapi(url: string, init?: RequestInit): Promise<Response> {
    const withAuth = (): RequestInit => ({
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });
    let response = await fetch(url, withAuth());
    if (response.status === 401 && connection.refreshToken) {
      const { clientId, clientSecret } = getGmailOAuthConfig();
      const refreshResponse = await fetch(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: connection.refreshToken,
            grant_type: 'refresh_token',
          }),
        }
      );
      if (refreshResponse.ok) {
        const data = (await refreshResponse.json()) as {
          access_token?: string;
        };
        if (data.access_token) {
          accessToken = data.access_token;
          refreshedToken = data.access_token;
          response = await fetch(url, withAuth());
        }
      }
    }
    return response;
  }

  return { gapi, getRefreshedToken: () => refreshedToken };
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
