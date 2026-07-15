import { NextRequest, NextResponse } from 'next/server';
import { getMessages, isConnected } from '@/lib/whatsapp-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId || userId.length > 128)
    return NextResponse.json({ error: 'Missing user.' }, { status: 400 });
  if (!isConnected(userId))
    return NextResponse.json(
      { error: 'WhatsApp is not connected.' },
      { status: 401 }
    );
  return NextResponse.json({ messages: getMessages(userId) });
}
