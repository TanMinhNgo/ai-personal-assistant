import { NextRequest, NextResponse } from 'next/server';
import { type GmailConnection, unseal } from '@/lib/gmail-oauth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const connection = unseal<GmailConnection>(
    request.cookies.get('gmail_connection')?.value
  );

  return NextResponse.json({ connected: Boolean(connection?.accessToken) });
}
