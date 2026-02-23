import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('sp_rt')?.value

  if (!refreshToken) {
    return NextResponse.json({ error: 'no_refresh_token' }, { status: 401 })
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
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  const data = await res.json()

  if (!data.access_token) {
    return NextResponse.json({ error: 'refresh_failed' }, { status: 401 })
  }

  const response = NextResponse.json({ access_token: data.access_token })
  response.cookies.set('sp_at', data.access_token, {
    httpOnly: false,
    maxAge: data.expires_in,
    path: '/',
    sameSite: 'lax',
  })

  return response
}
