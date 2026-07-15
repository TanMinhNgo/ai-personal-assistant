import { NextRequest, NextResponse } from 'next/server';
import { startPairing } from '@/lib/whatsapp-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { userId, phone } = (await request.json().catch(() => ({}))) as { userId?: string; phone?: string };
  if (!userId || userId.length > 128) return NextResponse.json({ error: 'Sign in before connecting WhatsApp.' }, { status: 401 });
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return NextResponse.json({ error: 'Enter a valid phone number with country code.' }, { status: 400 });

  try {
    const result = await startPairing(userId, digits);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[whatsapp] pair error', error);
    return NextResponse.json({ error: 'Could not start the WhatsApp connection.' }, { status: 500 });
  }
}
