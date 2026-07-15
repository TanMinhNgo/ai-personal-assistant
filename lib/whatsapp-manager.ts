import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
} from 'baileys';
import type { ConnectionState, WAMessage, WASocket } from 'baileys';
import pino from 'pino';
import type { InboxMessage } from '@/lib/integration-mcp';
import { loadEncryptedAuthState } from '@/lib/whatsapp-session';

type AuthAdapter = Awaited<ReturnType<typeof loadEncryptedAuthState>>;
type WAStatus = 'idle' | 'pairing' | 'connected' | 'disconnected';

type WASession = {
  sock: WASocket | null;
  status: WAStatus;
  pairingCode: string | null;
  phone: string;
  error: string | null;
  starting: boolean;
  messages: Map<string, { msg: WAMessage; ts: number }>;
  auth: AuthAdapter;
};

// Baileys holds a live WebSocket that must outlive individual HTTP requests, so
// the session map is cached on globalThis to survive Next.js dev hot-reloads and
// be shared across route modules. This is the app's only long-lived server state.
const globalRef = globalThis as unknown as {
  __waSessions?: Map<string, WASession>;
};
const sessions = (globalRef.__waSessions ??= new Map<string, WASession>());
const logger = pino({ level: 'silent' });

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

async function spawnSocket(userId: string, phone: string): Promise<WASocket> {
  const session = sessions.get(userId)!;
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: session.auth.state,
    logger,
    browser: ['OmniMind', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
  });
  session.sock = sock;
  sock.ev.on('creds.update', session.auth.saveCreds);
  sock.ev.on('connection.update', (update) =>
    handleConnection(userId, phone, update)
  );
  sock.ev.on('messages.upsert', ({ messages }) => ingest(userId, messages));
  sock.ev.on('messaging-history.set', ({ messages }) =>
    ingest(userId, messages)
  );
  return sock;
}

function handleConnection(
  userId: string,
  phone: string,
  update: Partial<ConnectionState>
) {
  const session = sessions.get(userId);
  if (!session) return;
  const { connection, lastDisconnect } = update;

  if (connection === 'open') {
    session.status = 'connected';
    session.pairingCode = null;
    session.error = null;
  }

  if (connection === 'close') {
    const statusCode = (
      lastDisconnect?.error as { output?: { statusCode?: number } } | undefined
    )?.output?.statusCode;
    if (statusCode === DisconnectReason.loggedOut) {
      session.status = 'disconnected';
      session.sock = null;
      void session.auth.clear();
    } else {
      // Transient close — recreate the socket reusing the saved creds. Never
      // request a new pairing code here (the device is already registered).
      void restart(userId, phone);
    }
  }
}

async function restart(userId: string, phone: string) {
  const session = sessions.get(userId);
  if (!session || session.status === 'connected') return;
  await delay(2000);
  try {
    await spawnSocket(userId, phone);
  } catch (error) {
    session.error = errorMessage(error);
  }
}

export async function startPairing(userId: string, rawPhone: string) {
  const existing = sessions.get(userId);
  if (existing?.status === 'connected')
    return { status: 'connected' as WAStatus, pairingCode: null, error: null };
  if (existing?.starting)
    return {
      status: existing.status,
      pairingCode: existing.pairingCode,
      error: existing.error,
    };

  const phone = rawPhone.replace(/\D/g, '');
  const auth = await loadEncryptedAuthState(userId);
  const session: WASession = {
    sock: null,
    status: 'pairing',
    pairingCode: null,
    phone,
    error: null,
    starting: true,
    messages: existing?.messages ?? new Map(),
    auth,
  };
  sessions.set(userId, session);

  try {
    const sock = await spawnSocket(userId, phone);
    if (!sock.authState.creds.registered) {
      await delay(3000); // let the WebSocket come up before requesting the code
      session.pairingCode = await sock.requestPairingCode(phone);
    }
  } catch (error) {
    session.error = errorMessage(error);
    session.status = 'disconnected';
  }
  session.starting = false;
  return {
    status: session.status,
    pairingCode: session.pairingCode,
    error: session.error,
  };
}

export function getStatus(userId: string) {
  const session = sessions.get(userId);
  if (!session)
    return { status: 'idle' as WAStatus, pairingCode: null, error: null };
  return {
    status: session.status,
    pairingCode: session.pairingCode,
    error: session.error,
  };
}

// Re-spawn a socket from a previously saved (registered) session after a server
// restart — reuses the encrypted creds, so no new pairing code is needed.
export async function ensureRunning(userId: string) {
  if (sessions.get(userId)) return getStatus(userId);
  const auth = await loadEncryptedAuthState(userId);
  if (!auth.state.creds.registered)
    return { status: 'idle' as WAStatus, pairingCode: null, error: null };
  const phone = (auth.state.creds.me?.id ?? '')
    .split(/[:@]/)[0]
    .replace(/\D/g, '');
  const session: WASession = {
    sock: null,
    status: 'pairing',
    pairingCode: null,
    phone,
    error: null,
    starting: false,
    messages: new Map(),
    auth,
  };
  sessions.set(userId, session);
  try {
    await spawnSocket(userId, phone);
  } catch (error) {
    session.status = 'disconnected';
    session.error = errorMessage(error);
  }
  return getStatus(userId);
}

export function isConnected(userId: string) {
  return sessions.get(userId)?.status === 'connected';
}

export async function disconnect(userId: string) {
  const session = sessions.get(userId);
  if (session) {
    try {
      await session.sock?.logout();
    } catch {
      /* already gone */
    }
    try {
      session.sock?.end(undefined);
    } catch {
      /* already gone */
    }
    await session.auth.clear();
    sessions.delete(userId);
  } else {
    // No live socket (e.g. after a server restart) — still clear the sealed file.
    const auth = await loadEncryptedAuthState(userId);
    await auth.clear();
  }
  return { ok: true };
}

function ingest(userId: string, messages: WAMessage[]) {
  const session = sessions.get(userId);
  if (!session) return;
  for (const message of messages) {
    const id = message.key?.id;
    const jid = message.key?.remoteJid;
    if (!id || !jid || jid === 'status@broadcast') continue;
    session.messages.set(id, {
      msg: message,
      ts: Number(message.messageTimestamp ?? 0),
    });
  }
  // Keep the buffer bounded — drop the oldest beyond ~500 entries.
  if (session.messages.size > 500) {
    const oldest = [...session.messages.entries()]
      .sort((a, b) => a[1].ts - b[1].ts)
      .slice(0, session.messages.size - 500);
    for (const [key] of oldest) session.messages.delete(key);
  }
}

function messageText(message: WAMessage): string {
  const content = message.message;
  return (
    content?.conversation ??
    content?.extendedTextMessage?.text ??
    content?.imageMessage?.caption ??
    content?.videoMessage?.caption ??
    content?.documentMessage?.caption ??
    ''
  );
}

function toInboxMessage(message: WAMessage, ts: number): InboxMessage | null {
  const jid = message.key?.remoteJid;
  if (!jid) return null;
  const isGroup = jid.endsWith('@g.us');
  const number = jid.split('@')[0];
  const text = messageText(message);
  const name = message.pushName || (isGroup ? 'Group chat' : number);
  const timeLabel = ts
    ? new Date(ts * 1000).toLocaleString([], {
        hour: '2-digit',
        minute: '2-digit',
        month: 'numeric',
        day: 'numeric',
      })
    : '';

  return {
    id: message.key?.id ?? `${jid}:${ts}`,
    sender: name,
    handle: isGroup ? `${number} · group` : `+${number}`,
    subject: (text || '(media message)').slice(0, 60),
    preview: message.key?.fromMe
      ? `You: ${text}`.slice(0, 120)
      : text.slice(0, 120),
    time: timeLabel,
    tags: message.key?.fromMe ? [] : ['UNREAD'],
    body: [text || '(non-text message)'],
    signature: { name, role: isGroup ? 'WhatsApp group' : 'WhatsApp contact' },
  };
}

// Collapse the buffer to the most recent message per chat — a conversation list.
export function getMessages(userId: string): InboxMessage[] {
  const session = sessions.get(userId);
  if (!session) return [];
  const latestPerChat = new Map<string, { msg: WAMessage; ts: number }>();
  for (const entry of session.messages.values()) {
    const jid = entry.msg.key?.remoteJid;
    if (!jid || jid === 'status@broadcast') continue;
    const prev = latestPerChat.get(jid);
    if (!prev || entry.ts > prev.ts) latestPerChat.set(jid, entry);
  }
  return [...latestPerChat.values()]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 20)
    .map((entry) => toInboxMessage(entry.msg, entry.ts))
    .filter((message): message is InboxMessage => message !== null);
}
