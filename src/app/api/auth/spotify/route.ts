import { NextResponse } from 'next/server'

const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
].join(' ')

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const returnTo = searchParams.get('returnTo') || '/'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: `${baseUrl}/api/auth/callback/spotify`,
    scope: SCOPES,
    state: encodeURIComponent(returnTo),
  })

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params}`
  )
}
