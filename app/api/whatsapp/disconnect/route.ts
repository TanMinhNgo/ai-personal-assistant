import { NextRequest, NextResponse } from 'next/server';
import { disconnect } from '@/lib/whatsapp-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { userId } = (await request.json().catch(() => ({}))) as { userId?: string };
  if (!userId || userId.length > 128) return NextResponse.json({ error: 'Missing user.' }, { status: 400 });
  await disconnect(userId);
  return NextResponse.json({ ok: true });
}
