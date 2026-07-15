import { NextRequest, NextResponse } from 'next/server';
import { getGmailOAuthConfig, seal, unseal, type GmailConnection } from '@/lib/gmail-oauth';
import type { InboxMessage } from '@/lib/integration-mcp';

export const runtime = 'nodejs';

type GmailHeader = { name: string; value: string };
type GmailPayload = { mimeType?: string; headers?: GmailHeader[]; body?: { data?: string }; parts?: GmailPayload[] };
type GmailMessage = { id: string; snippet?: string; internalDate?: string; labelIds?: string[]; payload?: GmailPayload };

function headerValue(headers: GmailHeader[], name: string) {
  return headers.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function parseSender(from: string) {
  const match = from.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>/);
  if (match) return { name: match[1].trim() || match[2].trim(), email: match[2].trim() };
  return { name: from.trim(), email: from.trim() };
}

function decode(data: string) {
  return Buffer.from(data, 'base64url').toString('utf8');
}

function findPart(payload: GmailPayload | undefined, mime: string): string | null {
  if (!payload) return null;
  if (payload.mimeType === mime && payload.body?.data) return payload.body.data;
  for (const part of payload.parts ?? []) {
    const found = findPart(part, mime);
    if (found) return found;
  }
  return null;
}

function extractBody(payload: GmailPayload | undefined, snippet: string): string[] {
  const plain = findPart(payload, 'text/plain');
  let text = plain ? decode(plain) : '';
  if (!text) {
    const html = findPart(payload, 'text/html');
    if (html) text = decode(html).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }
  if (!text && payload?.body?.data) text = decode(payload.body.data);
  if (!text) text = snippet;

  const paragraphs = text
    .split('\n')
    .filter((line) => !line.trim().startsWith('>'))
    .join('\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((paragraph) => (paragraph.length > 700 ? `${paragraph.slice(0, 700)}…` : paragraph));

  return paragraphs.length ? paragraphs : [snippet];
}

function formatTime(dateHeader: string, internalDate?: string) {
  const date = dateHeader ? new Date(dateHeader) : internalDate ? new Date(Number(internalDate)) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

export async function GET(request: NextRequest) {
  const connection = unseal<GmailConnection>(request.cookies.get('gmail_connection')?.value);
  if (!connection?.accessToken) return NextResponse.json({ error: 'Gmail is not connected.' }, { status: 401 });

  let accessToken = connection.accessToken;
  let refreshedToken: string | null = null;

  async function gapi(url: string): Promise<Response> {
    let response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (response.status === 401 && connection?.refreshToken) {
      const { clientId, clientSecret } = getGmailOAuthConfig();
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: connection.refreshToken, grant_type: 'refresh_token' }) });
      if (refreshResponse.ok) {
        const data = (await refreshResponse.json()) as { access_token?: string };
        if (data.access_token) {
          accessToken = data.access_token;
          refreshedToken = data.access_token;
          response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        }
      }
    }
    return response;
  }

  try {
    const listResponse = await gapi('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8&labelIds=INBOX');
    if (!listResponse.ok) return NextResponse.json({ error: 'Could not load inbox.' }, { status: 502 });
    const list = (await listResponse.json()) as { messages?: { id: string }[] };

    const messages: InboxMessage[] = [];
    for (const { id } of list.messages ?? []) {
      const detailResponse = await gapi(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`);
      if (!detailResponse.ok) continue;
      const message = (await detailResponse.json()) as GmailMessage;
      const headers = message.payload?.headers ?? [];
      const sender = parseSender(headerValue(headers, 'From'));
      const labelIds = message.labelIds ?? [];
      const tags: string[] = [];
      if (labelIds.includes('UNREAD')) tags.push('UNREAD');
      if (labelIds.includes('IMPORTANT')) tags.push('URGENT');

      messages.push({
        id: message.id,
        sender: sender.name,
        handle: sender.email,
        subject: headerValue(headers, 'Subject') || '(no subject)',
        preview: message.snippet ?? '',
        time: formatTime(headerValue(headers, 'Date'), message.internalDate),
        tags,
        body: extractBody(message.payload, message.snippet ?? ''),
        signature: { name: sender.name, role: '' },
      });
    }

    const response = NextResponse.json({ messages });
    if (refreshedToken) {
      response.cookies.set('gmail_connection', seal({ ...connection, accessToken: refreshedToken }), { httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    }
    return response;
  } catch (error) {
    console.error('[gmail-oauth] messages fetch error', error);
    return NextResponse.json({ error: 'Could not load inbox.' }, { status: 502 });
  }
}
