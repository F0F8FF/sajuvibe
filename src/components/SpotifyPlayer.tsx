'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { TrackInfo } from '@/app/api/spotify/tracks/route'

interface SongHint {
  title: string
  artist: string
}

interface Props {
  genres: string[]
  songs?: SongHint[]
}

type PlayerState = 'idle' | 'loading' | 'ready' | 'error'

declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume: number
      }) => SpotifySDKPlayer
    }
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

interface SpotifySDKPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, cb: (data: unknown) => void): void
  togglePlay(): Promise<void>
  nextTrack(): Promise<void>
  previousTrack(): Promise<void>
  seek(positionMs: number): Promise<void>
  getVolume(): Promise<number>
  setVolume(volume: number): Promise<void>
  getCurrentState(): Promise<SpotifySDKState | null>
}

interface SpotifySDKState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      name: string
      uri: string
      artists: Array<{ name: string }>
      album: { name: string; images: Array<{ url: string }> }
    }
  }
}

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)sp_at=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

async function getValidToken(): Promise<string | null> {
  const token = getTokenFromCookie()
  if (token) return token

  const res = await fetch('/api/spotify/refresh', { method: 'POST' })
  if (res.ok) {
    const data = await res.json()
    return data.access_token
  }
  return null
}

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function SpotifyPlayer({ genres, songs = [] }: Props) {
  const [isConnected, setIsConnected] = useState(false)
  const [playerState, setPlayerState] = useState<PlayerState>('idle')
  const [tracks, setTracks] = useState<TrackInfo[]>([])
  const [currentTrack, setCurrentTrack] = useState<SpotifySDKState['track_window']['current_track'] | null>(null)
  const [isPaused, setIsPaused] = useState(true)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const playerRef = useRef<SpotifySDKPlayer | null>(null)
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // 쿠키에서 연결 상태 확인
  useEffect(() => {
    const connected = !!getTokenFromCookie()
    setIsConnected(connected)
  }, [])

  // URL에서 spotify_connected 파라미터 감지
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('spotify_connected') === '1') {
      setIsConnected(true)
      // URL 파라미터 제거
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  const initSDK = useCallback(async () => {
    setPlayerState('loading')

    const token = await getValidToken()
    if (!token) {
      setPlayerState('error')
      return
    }

    // 트랙 먼저 로드 — 곡명 우선, 없으면 장르로 검색
    try {
      const params = new URLSearchParams()
      if (songs.length > 0) {
        params.set('songs', songs.map((s) => `${s.title} ${s.artist}`).join('|'))
      } else {
        params.set('genres', genres.join(','))
      }

      const res = await fetch(
        `/api/spotify/tracks?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      if (data.tracks?.length) {
        setTracks(data.tracks)
      }
    } catch {
      // 트랙 로드 실패해도 계속 진행
    }

    // SDK 스크립트 로드
    if (window.Spotify) {
      setupPlayer(token)
      return
    }

    window.onSpotifyWebPlaybackSDKReady = () => setupPlayer(token)

    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)
  }, [genres])

  const setupPlayer = useCallback((token: string) => {
    const player = new window.Spotify.Player({
      name: '사주 바이브 플레이어',
      getOAuthToken: async (cb) => {
        const t = await getValidToken()
        cb(t ?? token)
      },
      volume: 0.7,
    })

    player.addListener('ready', (data) => {
      const { device_id } = data as { device_id: string }
      setDeviceId(device_id)
      setPlayerState('ready')
    })

    player.addListener('not_ready', () => {
      setPlayerState('error')
    })

    player.addListener('player_state_changed', (state) => {
      if (!state) return
      const s = state as SpotifySDKState
      setCurrentTrack(s.track_window.current_track)
      setIsPaused(s.paused)
      setPosition(s.position)
      setDuration(s.duration)
    })

    player.addListener('initialization_error', () => setPlayerState('error'))
    player.addListener('authentication_error', () => setPlayerState('error'))
    player.addListener('account_error', () => {
      setPlayerState('error')
      alert('Spotify Premium 계정이 필요합니다.')
    })

    player.connect()
    playerRef.current = player
  }, [])

  // 재생 시작
  const playTracks = useCallback(async (startIndex = 0) => {
    if (!deviceId || !tracks.length) return

    const token = await getValidToken()
    if (!token) return

    setCurrentIndex(startIndex)

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: tracks.map((t) => t.uri),
        offset: { position: startIndex },
      }),
    })
  }, [deviceId, tracks])

  // 재생 시작되면 자동으로 첫 트랙 재생
  useEffect(() => {
    if (playerState === 'ready' && deviceId && tracks.length) {
      playTracks(0)
    }
  }, [playerState, deviceId, tracks.length, playTracks])

  // 진행바 업데이트
  useEffect(() => {
    if (!isPaused) {
      progressInterval.current = setInterval(() => {
        setPosition((prev) => Math.min(prev + 1000, duration))
      }, 1000)
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [isPaused, duration])

  const handleLogin = () => {
    window.location.href = `/api/auth/spotify?returnTo=${encodeURIComponent(window.location.pathname)}`
  }

  const handleToggle = () => playerRef.current?.togglePlay()
  const handleNext = () => playerRef.current?.nextTrack()
  const handlePrev = () => playerRef.current?.previousTrack()
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pos = Number(e.target.value)
    setPosition(pos)
    playerRef.current?.seek(pos)
  }

  // 미연결 상태
  if (!isConnected) {
    return (
      <div
        className="glass-card p-5"
        style={{ borderColor: 'rgba(29,185,84,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <SpotifyIcon />
          <span className="text-sm font-bold" style={{ color: '#1DB954' }}>
            Spotify로 바로 듣기
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          사주 바이브에 맞는 음악을 Spotify에서 바로 재생해드려요.
          <br />
          <span style={{ color: 'rgba(148,163,184,0.6)' }}>
            ※ Spotify Premium 계정 필요
          </span>
        </p>
        <button
          onClick={handleLogin}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: '#1DB954',
            color: '#000',
          }}
        >
          Spotify 로그인
        </button>
      </div>
    )
  }

  // 연결됨 + idle
  if (playerState === 'idle') {
    return (
      <div
        className="glass-card p-5"
        style={{ borderColor: 'rgba(29,185,84,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <SpotifyIcon />
          <span className="text-sm font-bold" style={{ color: '#1DB954' }}>
            Spotify 플레이어
          </span>
        </div>
        <button
          onClick={initSDK}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#1DB954', color: '#000' }}
        >
          ▶ 사주 바이브 재생 시작
        </button>
      </div>
    )
  }

  // 로딩
  if (playerState === 'loading') {
    return (
      <div
        className="glass-card p-5 flex items-center gap-3"
        style={{ borderColor: 'rgba(29,185,84,0.2)' }}
      >
        <SpotifyIcon />
        <div>
          <p className="text-sm font-bold" style={{ color: '#1DB954' }}>
            Spotify 연결 중...
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            플레이어를 초기화하는 중이에요
          </p>
        </div>
        <div className="ml-auto">
          <div className="w-5 h-5 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

  // 에러
  if (playerState === 'error') {
    return (
      <div
        className="glass-card p-5"
        style={{ borderColor: 'rgba(239,68,68,0.2)' }}
      >
        <p className="text-sm font-bold text-red-400 mb-1">연결 실패</p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Spotify Premium 계정이 필요하거나 연결이 끊어졌어요.
        </p>
        <button
          onClick={() => { setPlayerState('idle'); setIsConnected(false) }}
          className="text-xs underline"
          style={{ color: 'var(--text-muted)' }}
        >
          다시 시도
        </button>
      </div>
    )
  }

  // 플레이어 준비됨
  return (
    <div
      className="glass-card p-5"
      style={{ borderColor: 'rgba(29,185,84,0.25)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <SpotifyIcon />
        <span className="text-xs font-bold" style={{ color: '#1DB954' }}>
          재생 중
        </span>
      </div>

      {/* 현재 트랙 */}
      {currentTrack ? (
        <div className="flex gap-3 items-center mb-4">
          {currentTrack.album.images[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentTrack.album.images[0].url}
              alt={currentTrack.name}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl"
              style={{ background: 'rgba(29,185,84,0.15)' }}
            >
              🎵
            </div>
          )}
          <div className="min-w-0">
            <p
              className="text-sm font-bold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {currentTrack.name}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {currentTrack.artists.map((a) => a.name).join(', ')}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'rgba(148,163,184,0.5)' }}>
              {currentTrack.album.name}
            </p>
          </div>
        </div>
      ) : (
        <div className="h-14 flex items-center mb-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            트랙 로딩 중...
          </p>
        </div>
      )}

      {/* 진행 바 */}
      <div className="mb-3">
        <input
          type="range"
          min={0}
          max={duration || 1}
          value={position}
          onChange={handleSeek}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #1DB954 ${duration ? (position / duration) * 100 : 0}%, rgba(255,255,255,0.15) 0%)`,
            accentColor: '#1DB954',
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.6)' }}>
            {formatMs(position)}
          </span>
          <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.6)' }}>
            {formatMs(duration)}
          </span>
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={handlePrev}
          className="text-xl transition-opacity hover:opacity-75 active:scale-90"
          style={{ color: 'rgba(200,200,200,0.8)' }}
        >
          ⏮
        </button>
        <button
          onClick={handleToggle}
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: '#1DB954', color: '#000' }}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        <button
          onClick={handleNext}
          className="text-xl transition-opacity hover:opacity-75 active:scale-90"
          style={{ color: 'rgba(200,200,200,0.8)' }}
        >
          ⏭
        </button>
      </div>

      {/* 트랙 목록 */}
      {tracks.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'rgba(148,163,184,0.5)' }}
          >
            트랙 목록
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {tracks.map((track, i) => (
              <button
                key={track.uri}
                onClick={() => playTracks(i)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-white/5"
                style={{
                  background:
                    currentTrack?.uri === track.uri
                      ? 'rgba(29,185,84,0.1)'
                      : 'transparent',
                }}
              >
                <span
                  className="text-[10px] w-4 flex-shrink-0 text-center"
                  style={{
                    color:
                      currentTrack?.uri === track.uri
                        ? '#1DB954'
                        : 'rgba(148,163,184,0.5)',
                  }}
                >
                  {currentTrack?.uri === track.uri && !isPaused ? '♪' : i + 1}
                </span>
                {track.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.imageUrl}
                    alt={track.name}
                    className="w-7 h-7 rounded flex-shrink-0 object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p
                    className="text-xs truncate"
                    style={{
                      color:
                        currentTrack?.uri === track.uri
                          ? '#1DB954'
                          : 'var(--text-primary)',
                      fontWeight: currentTrack?.uri === track.uri ? 600 : 400,
                    }}
                  >
                    {track.name}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: 'rgba(148,163,184,0.6)' }}>
                    {track.artist}
                  </p>
                </div>
                <span
                  className="ml-auto text-[10px] flex-shrink-0"
                  style={{ color: 'rgba(148,163,184,0.4)' }}
                >
                  {formatMs(track.durationMs)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SpotifyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}
