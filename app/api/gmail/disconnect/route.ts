import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Clears the encrypted per-browser Gmail session cookie set by the callback.
export function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('gmail_connection');
  return response;
}
