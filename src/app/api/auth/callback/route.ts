import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const tokenRes = await fetch('https://auth.monday.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.MONDAY_CLIENT_ID,
      client_secret: process.env.MONDAY_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
    }),
  });

  const tokenData = await tokenRes.json();
  console.log('Token response:', tokenData);
  
  if (tokenData.access_token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/demo?token=${tokenData.access_token}`
    );
  }

  return NextResponse.json({ error: 'Failed to get token', details: tokenData }, { status: 400 });
}