import { NextRequest, NextResponse } from 'next/server';
import {
  createGmailFetcher,
  seal,
  unseal,
  type GmailConnection,
} from '@/lib/gmail-oauth';

export const runtime = 'nodejs';

type GmailHeader = { name: string; value: string };

function headerValue(headers: GmailHeader[], name: string) {
  return (
    headers.find((header) => header.name.toLowerCase() === name.toLowerCase())
      ?.value ?? ''
  );
}

export async function POST(request: NextRequest) {
  const connection = unseal<GmailConnection>(
    request.cookies.get('gmail_connection')?.value
  );
  if (!connection?.accessToken)
    return NextResponse.json(
      { error: 'Gmail is not connected.' },
      { status: 401 }
    );

  const { messageId, body } = (await request.json().catch(() => ({}))) as {
    messageId?: string;
    body?: string;
  };
  if (!messageId || !body?.trim())
    return NextResponse.json(
      { error: 'Missing reply content.' },
      { status: 400 }
    );

  const { gapi, getRefreshedToken } = createGmailFetcher(connection);

  try {
    const originalResponse = await gapi(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Message-ID&metadataHeaders=References`
    );
    if (!originalResponse.ok)
      return NextResponse.json(
        { error: 'Could not load the original message.' },
        { status: 502 }
      );
    const original = (await originalResponse.json()) as {
      threadId?: string;
      payload?: { headers?: GmailHeader[] };
    };
    const headers = original.payload?.headers ?? [];

    const to = headerValue(headers, 'From');
    const subject = headerValue(headers, 'Subject');
    const originalMessageId = headerValue(headers, 'Message-ID');
    const references = headerValue(headers, 'References');
    const replySubject = /^re:/i.test(subject) ? subject : `Re: ${subject}`;

    const mime = [
      `To: ${to}`,
      `Subject: ${replySubject}`,
      originalMessageId ? `In-Reply-To: ${originalMessageId}` : '',
      originalMessageId
        ? `References: ${references ? `${references} ` : ''}${originalMessageId}`
        : '',
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      body,
    ]
      .filter(Boolean)
      .join('\r\n');
    const raw = Buffer.from(mime, 'utf8').toString('base64url');

    const sendResponse = await gapi(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw, threadId: original.threadId }),
      }
    );
    if (!sendResponse.ok) {
      console.error(
        '[gmail] reply send failed',
        sendResponse.status,
        await sendResponse.text()
      );
      return NextResponse.json(
        { error: 'Could not send the reply.' },
        { status: 502 }
      );
    }

    const response = NextResponse.json({ ok: true });
    const refreshed = getRefreshedToken();
    if (refreshed) {
      response.cookies.set(
        'gmail_connection',
        seal({ ...connection, accessToken: refreshed }),
        {
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        }
      );
    }
    return response;
  } catch (error) {
    console.error('[gmail] reply error', error);
    return NextResponse.json(
      { error: 'Could not send the reply.' },
      { status: 500 }
    );
  }
}
