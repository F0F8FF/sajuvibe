import { NextResponse } from 'next/server'

export interface TrackInfo {
  uri: string
  name: string
  artist: string
  albumName: string
  imageUrl: string
  durationMs: number
}

async function searchTrack(
  authHeader: string,
  query: string,
  limit = 1
): Promise<TrackInfo[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=KR`,
    { headers: { Authorization: authHeader } }
  )
  const data = await res.json()

  return (data.tracks?.items ?? []).map((item: Record<string, unknown>) => {
    const artists = item.artists as Array<{ name: string }>
    const album = item.album as { name: string; images: Array<{ url: string }> }
    return {
      uri: item.uri as string,
      name: item.name as string,
      artist: artists?.[0]?.name ?? '',
      albumName: album?.name ?? '',
      imageUrl: album?.images?.[0]?.url ?? '',
      durationMs: (item.duration_ms as number) ?? 0,
    }
  })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    return NextResponse.json({ error: 'no_token' }, { status: 401 })
  }

  const seen = new Set<string>()
  const tracks: TrackInfo[] = []

  // 모드 1: 구체적인 곡명+아티스트로 정확하게 검색
  const songsParam = searchParams.get('songs')
  if (songsParam) {
    const queries = songsParam.split('|').filter(Boolean)
    const results = await Promise.all(
      queries.map((q) => searchTrack(authHeader, q, 1))
    )
    for (const list of results) {
      for (const t of list) {
        if (!seen.has(t.uri)) {
          seen.add(t.uri)
          tracks.push(t)
        }
      }
    }
  }

  // 모드 2: 장르 키워드 검색 (곡이 없을 때 폴백)
  if (tracks.length < 5) {
    const genres = searchParams.get('genres')?.split(',').filter(Boolean) ?? []
    const results = await Promise.all(
      genres.slice(0, 3).map((g) => searchTrack(authHeader, g, 5))
    )
    for (const list of results) {
      for (const t of list) {
        if (!seen.has(t.uri)) {
          seen.add(t.uri)
          tracks.push(t)
        }
      }
    }
  }

  return NextResponse.json({ tracks: tracks.slice(0, 15) })
}
