import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BufferJSON, initAuthCreds, proto } from 'baileys';
import type { AuthenticationCreds, AuthenticationState } from 'baileys';

const algorithm = 'aes-256-gcm';
const sessionDir = path.join(process.cwd(), '.wa-sessions');

// The Baileys auth state (creds + signal keys) is sealed at rest with the same
// aes-256-gcm scheme used for Gmail tokens, keyed by a server-only secret.
function getKey() {
  const secret = process.env.WHATSAPP_SESSION_SECRET;
  if (!secret) throw new Error('Missing WHATSAPP_SESSION_SECRET.');
  return createHash('sha256').update(secret).digest();
}

function seal(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, getKey(), iv);
  const plaintext = JSON.stringify(value, BufferJSON.replacer);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    'base64'
  );
}

function unseal<T>(value: string): T | null {
  try {
    const payload = Buffer.from(value, 'base64');
    const decipher = createDecipheriv(
      algorithm,
      getKey(),
      payload.subarray(0, 12)
    );
    decipher.setAuthTag(payload.subarray(12, 28));
    const text = Buffer.concat([
      decipher.update(payload.subarray(28)),
      decipher.final(),
    ]).toString('utf8');
    return JSON.parse(text, BufferJSON.reviver) as T;
  } catch {
    return null;
  }
}

function sessionFile(userId: string) {
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(sessionDir, `${safe}.enc`);
}

type StoredState = {
  creds: AuthenticationCreds;
  keys: Record<string, Record<string, unknown>>;
};

async function readStore(file: string): Promise<StoredState | null> {
  try {
    return unseal<StoredState>(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Baileys auth-state adapter backed by a single encrypted file per user.
 * Writes are serialized through a chained promise so concurrent key updates
 * during the initial history sync never corrupt the sealed blob.
 */
export async function loadEncryptedAuthState(userId: string) {
  const file = sessionFile(userId);
  await fs.mkdir(sessionDir, { recursive: true });

  const stored = await readStore(file);
  const creds: AuthenticationCreds = stored?.creds ?? initAuthCreds();
  const keys: Record<string, Record<string, unknown>> = stored?.keys ?? {};

  let writing = Promise.resolve();
  const persist = () => {
    writing = writing
      .then(() => fs.writeFile(file, seal({ creds, keys })))
      .catch(() => {});
    return writing;
  };

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type, ids) => {
        const store = keys[type] ?? {};
        const data: Record<string, unknown> = {};
        for (const id of ids) {
          let value = store[id];
          if (type === 'app-state-sync-key' && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(
              value as object
            );
          }
          if (value !== undefined) data[id] = value;
        }
        return data as never;
      },
      set: async (data) => {
        for (const type of Object.keys(data)) {
          keys[type] = keys[type] ?? {};
          Object.assign(
            keys[type],
            (data as Record<string, Record<string, unknown>>)[type]
          );
        }
        await persist();
      },
    },
  };

  return {
    state,
    saveCreds: () => persist(),
    clear: () => fs.rm(file, { force: true }),
  };
}
