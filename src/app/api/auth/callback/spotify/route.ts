import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const returnTo = state ? decodeURIComponent(state) : '/'

  if (!code) {
    return NextResponse.redirect(`${baseUrl}${returnTo}?spotify_error=1`)
  }

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${baseUrl}/api/auth/callback/spotify`,
    }),
  })

  const data = await res.json()

  if (!data.access_token) {
    return NextResponse.redirect(`${baseUrl}${returnTo}?spotify_error=1`)
  }

  const response = NextResponse.redirect(
    `${baseUrl}${returnTo}?spotify_connected=1`
  )

  // access_token: JS에서 읽어야 하므로 httpOnly=false
  response.cookies.set('sp_at', data.access_token, {
    httpOnly: false,
    maxAge: data.expires_in,
    path: '/',
    sameSite: 'lax',
  })

  // refresh_token: 서버에서만 사용하므로 httpOnly=true
  if (data.refresh_token) {
    response.cookies.set('sp_rt', data.refresh_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    })
  }

  return response
}
