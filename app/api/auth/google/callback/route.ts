import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '/admin';

  if (!code) {
    return NextResponse.redirect(new URL('/admin?error=no_code', url.origin));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${url.origin}/api/auth/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);

    const cookieStore = cookies();
    const supabaseAccessToken = cookieStore.get('sb-access-token')?.value;
    const supabaseRefreshToken = cookieStore.get('sb-refresh-token')?.value;

    if (!supabaseAccessToken) {
      return NextResponse.redirect(new URL('/login?error=not_authenticated', url.origin));
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${supabaseAccessToken}`,
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=user_not_found', url.origin));
    }

    const expiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString();

    const { error } = await supabase
      .from('google_oauth_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiryDate,
        connected: true,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error storing tokens:', error);
      return NextResponse.redirect(new URL('/admin?error=token_storage_failed', url.origin));
    }

    return NextResponse.redirect(new URL(`${state}?google_connected=true`, url.origin));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/admin?error=oauth_failed', url.origin));
  }
}
