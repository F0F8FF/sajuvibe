import type { SpotifyPlaylist } from './types'

interface SpotifyTokenResponse {
  access_token: string
}

interface SpotifyImage {
  url: string
}

interface SpotifyPlaylistItem {
  id: string
  name: string
  description: string
  external_urls: { spotify: string }
  images: SpotifyImage[]
  tracks: { total: number }
}

let cachedToken: { value: string; expiresAt: number } | null = null

async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value
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
    body: 'grant_type=client_credentials',
  })

  const data: SpotifyTokenResponse & { expires_in: number } = await res.json()
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
  return data.access_token
}

async function searchOnce(token: string, query: string): Promise<SpotifyPlaylist[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=3&market=KR`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  const items: SpotifyPlaylistItem[] = (data.playlists?.items || []).filter(Boolean)

  return items.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    url: p.external_urls.spotify,
    imageUrl: p.images?.[0]?.url || '',
    tracksTotal: p.tracks?.total || 0,
  }))
}

export async function searchSpotifyPlaylists(
  terms: string[]
): Promise<SpotifyPlaylist[]> {
  const token = await getSpotifyToken()

  // 각 키워드로 검색 후 합치기 (중복 제거)
  const results = await Promise.all(
    terms.slice(0, 3).map((term) => searchOnce(token, term))
  )

  const seen = new Set<string>()
  const merged: SpotifyPlaylist[] = []

  for (const list of results) {
    for (const item of list) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        merged.push(item)
      }
    }
  }

  return merged.slice(0, 6)
}
