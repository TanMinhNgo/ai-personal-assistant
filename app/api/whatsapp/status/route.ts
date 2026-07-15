import { NextRequest, NextResponse } from 'next/server';
import { ensureRunning } from '@/lib/whatsapp-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId || userId.length > 128)
    return NextResponse.json({
      status: 'idle',
      pairingCode: null,
      error: null,
    });
  // ensureRunning resumes a saved session after a server restart; for a live or
  // absent session it is a cheap no-op returning the current status.
  return NextResponse.json(await ensureRunning(userId));
}
