import { NextRequest, NextResponse } from 'next/server';
import { getGmailOAuthConfig, seal } from '@/lib/gmail-oauth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const failureUrl = new URL('/integrations?gmail=error', request.url);
  const code = request.nextUrl.searchParams.get('code');
  const ownerId = request.nextUrl.searchParams.get('state');
  if (!code || !ownerId || ownerId.length > 128)
    return NextResponse.redirect(failureUrl);

  try {
    const { clientId, clientSecret, redirectUri } = getGmailOAuthConfig();
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = (await tokenResponse.json()) as {
      access_token?: string;
      refresh_token?: string;
    };
    if (!tokenResponse.ok || !tokens.access_token)
      return NextResponse.redirect(failureUrl);

    const profileResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    if (!profileResponse.ok) return NextResponse.redirect(failureUrl);

    const response = NextResponse.redirect(
      new URL('/integrations?gmail=connected', request.url)
    );
    response.cookies.set(
      'gmail_connection',
      seal({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        ownerId,
      }),
      {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      }
    );
    return response;
  } catch {
    return NextResponse.redirect(failureUrl);
  }
}
