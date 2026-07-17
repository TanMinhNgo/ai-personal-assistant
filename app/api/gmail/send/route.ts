import { NextRequest, NextResponse } from 'next/server';
import { createGmailFetcher, seal, unseal, type GmailConnection } from '@/lib/gmail-oauth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const connection = unseal<GmailConnection>(request.cookies.get('gmail_connection')?.value);
  if (!connection?.accessToken) return NextResponse.json({ error: 'Gmail is not connected.' }, { status: 401 });

  const { to, subject, body } = (await request.json().catch(() => ({}))) as { to?: string; subject?: string; body?: string };
  if (!to?.trim() || !body?.trim()) return NextResponse.json({ error: 'Missing recipient or message body.' }, { status: 400 });

  const { gapi, getRefreshedToken } = createGmailFetcher(connection);
  const mime = [
    `To: ${to}`,
    `Subject: ${subject?.trim() || '(no subject)'}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body,
  ].join('\r\n');
  const raw = Buffer.from(mime, 'utf8').toString('base64url');

  try {
    const sendResponse = await gapi('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    });
    if (!sendResponse.ok) {
      console.error('[gmail] send failed', sendResponse.status, await sendResponse.text());
      return NextResponse.json({ error: 'Could not send the email.' }, { status: 502 });
    }

    const response = NextResponse.json({ ok: true });
    const refreshed = getRefreshedToken();
    if (refreshed) {
      response.cookies.set('gmail_connection', seal({ ...connection, accessToken: refreshed }), { httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    }
    return response;
  } catch (error) {
    console.error('[gmail] send error', error);
    return NextResponse.json({ error: 'Could not send the email.' }, { status: 500 });
  }
}
