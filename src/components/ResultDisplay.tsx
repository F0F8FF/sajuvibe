'use client'

import type { AnalyzeResponse, PillarData, ElementBalance, SongRecommendation } from '@/lib/types'
import SpotifyPlayer from '@/components/SpotifyPlayer'

interface Props {
  result: AnalyzeResponse
  onReset: () => void
}

const ELEMENT_KR: Record<string, string> = {
  tree: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
}

const ELEMENT_EMOJI: Record<string, string> = {
  tree: '🌿',
  fire: '🔥',
  earth: '🪨',
  metal: '⚔',
  water: '💧',
}

export default function ResultDisplay({ result, onReset }: Props) {
  const { saju, ai } = result
  const totalElements = Object.values(saju.elementCounts).reduce(
    (a, b) => a + b,
    0
  )

  const handleShare = () => {
    const text = `나의 사주 바이브 🎵\n\n사주: ${saju.pillars.map((p) => p.ganzi).join(' ')}\n주요 오행: ${ELEMENT_KR[saju.dominantElement]} ${ELEMENT_EMOJI[saju.dominantElement]}\n음악 장르: ${ai.genres.slice(0, 3).join(', ')}\n\n${window.location.href}`
    navigator.clipboard.writeText(text).then(() => alert('클립보드에 복사됐어요! 🎉'))
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* 결과 헤더 */}
      <div className="text-center fade-up">
        <div className="text-5xl mb-3">{ai.emoji || '✨'}</div>
        <h2
          className="text-2xl font-black mb-1"
          style={{
            background: `linear-gradient(135deg, ${ai.colors?.[0] || '#c084fc'} 0%, ${ai.colors?.[1] || '#818cf8'} 50%, ${ai.colors?.[2] || '#22d3ee'} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          나의 사주 바이브
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {saju.pillars.map((p) => p.ganzi).join(' · ')}
        </p>
      </div>

      {/* 사주 4기둥 */}
      <div className="glass-card p-5 fade-up fade-up-delay-1">
        <SectionTitle>사주팔자 (四柱八字)</SectionTitle>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[...saju.pillars].reverse().map((p) => (
            <PillarCard key={p.label} pillar={p} />
          ))}
        </div>
      </div>

      {/* 오행 분포 */}
      <div className="glass-card p-5 fade-up fade-up-delay-2">
        <SectionTitle>오행 분포</SectionTitle>
        <div className="mt-3 space-y-2.5">
          {Object.entries(saju.elementCounts)
            .filter(([, v]) => v > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([element, count]) => (
              <ElementBar
                key={element}
                element={element}
                count={count}
                total={totalElements}
                isDominant={element === saju.dominantElement}
              />
            ))}
        </div>
      </div>

      {/* AI 분석 */}
      <div className="glass-card p-5 fade-up fade-up-delay-3">
        <SectionTitle>AI 사주 분석</SectionTitle>
        <div className="mt-3 space-y-4">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'rgba(139,92,246,0.8)' }}
            >
              성격 & 기질
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'rgba(224,224,255,0.85)' }}
            >
              {ai.personality}
            </p>
          </div>
          <div
            className="h-px"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'rgba(34,211,238,0.8)' }}
            >
              🎵 음악 바이브
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'rgba(224,224,255,0.85)' }}
            >
              {ai.musicVibe}
            </p>
          </div>
        </div>
      </div>

      {/* 추천 장르 */}
      <div className="glass-card p-5 fade-up fade-up-delay-4">
        <SectionTitle>추천 음악 장르</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {ai.genres?.map((genre, i) => (
            <GenreTag
              key={genre}
              genre={genre}
              color={ai.colors?.[i % 3]}
            />
          ))}
        </div>

        {/* 지금 바로 들어보기 */}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(148,163,184,0.7)' }}
          >
            지금 바로 들어보기
          </p>
          <div className="space-y-2">
            {ai.genres?.slice(0, 4).map((genre) => (
              <div key={genre} className="flex items-center gap-2">
                <span className="text-xs w-20 flex-shrink-0 truncate" style={{ color: 'rgba(200,180,255,0.8)' }}>
                  {genre}
                </span>
                <div className="flex gap-1.5">
                  <a
                    href={`https://open.spotify.com/search/${encodeURIComponent(genre + ' playlist')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-opacity hover:opacity-75"
                    style={{ background: 'rgba(29,185,84,0.15)', border: '1px solid rgba(29,185,84,0.3)', color: '#1DB954' }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
                    Spotify
                  </a>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(genre + ' 플레이리스트')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-opacity hover:opacity-75"
                    style={{ background: 'rgba(255,0,0,0.12)', border: '1px solid rgba(255,0,0,0.25)', color: '#ff6b6b' }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" /></svg>
                    YouTube
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spotify 플레이어 */}
      <div className="fade-up fade-up-delay-4">
        <SpotifyPlayer genres={ai.genres ?? []} songs={ai.songs ?? []} />
      </div>

      {/* 사주 맞춤 곡 추천 */}
      {ai.songs?.length > 0 && (
        <div className="glass-card p-5 fade-up fade-up-delay-4">
          <SectionTitle>사주 맞춤 추천곡</SectionTitle>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            이 사주의 에너지와 딱 어울리는 곡들이에요
          </p>
          <div className="space-y-2">
            {ai.songs.map((song, i) => (
              <SongCard key={i} song={song} index={i} color={ai.colors?.[i % 3]} />
            ))}
          </div>
        </div>
      )}

      {/* 오행 균형 음악 추천 */}
      {ai.balanceRecommendations?.length > 0 && (
        <div className="glass-card p-5 fade-up fade-up-delay-4">
          <SectionTitle>오행 균형 처방 🌿</SectionTitle>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            부족한 오행을 채워주는 음악이에요. 들으면 에너지 균형에 도움이 돼요.
          </p>
          <div className="space-y-3">
            {ai.balanceRecommendations.map((rec) => (
              <BalanceCard key={rec.element} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* 색상 팔레트 */}
      {ai.colors?.length > 0 && (
        <div className="glass-card p-5 fade-up fade-up-delay-4">
          <SectionTitle>나의 사주 컬러 팔레트</SectionTitle>
          <div className="mt-3 flex gap-3">
            {ai.colors.map((color, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full h-16 rounded-xl"
                  style={{ background: color }}
                />
                <span
                  className="text-[10px] font-mono"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {color}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-3 pb-8 fade-up fade-up-delay-4">
        <button
          onClick={handleShare}
          className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all glass-card glass-card-hover"
          style={{ color: 'rgba(200,180,255,0.9)' }}
        >
          📋 결과 공유하기
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
          style={{
            background:
              'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
            border: '1px solid rgba(139,92,246,0.4)',
            color: '#e9d5ff',
          }}
        >
          ↩ 다시 분석
        </button>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-xs font-bold uppercase tracking-widest"
      style={{ color: 'rgba(148,163,184,0.7)' }}
    >
      {children}
    </h3>
  )
}

function PillarCard({ pillar }: { pillar: PillarData }) {
  return (
    <div
      className={`flex flex-col items-center py-3 px-2 rounded-xl element-bg-${pillar.element}`}
      style={{ border: '1px solid' }}
    >
      <span
        className="text-[10px] font-semibold mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {pillar.label}
      </span>
      <span
        className={`text-2xl font-black element-${pillar.element}`}
      >
        {pillar.ganzi}
      </span>
      <span
        className="text-[10px] mt-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {ELEMENT_KR[pillar.element]?.split('(')[0] || ''}
      </span>
      <span
        className="text-[10px]"
        style={{ color: 'rgba(148,163,184,0.5)' }}
      >
        {pillar.sipsin || '-'}
      </span>
    </div>
  )
}

function ElementBar({
  element,
  count,
  total,
  isDominant,
}: {
  element: string
  count: number
  total: number
  isDominant: boolean
}) {
  const pct = Math.round((count / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
        <span className="text-sm">{ELEMENT_EMOJI[element]}</span>
        <span
          className={`text-xs font-semibold element-${element}`}
        >
          {ELEMENT_KR[element]}
        </span>
      </div>
      <div
        className="flex-1 h-2.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className={`h-full rounded-full element-bar-${element} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-1.5 w-12 flex-shrink-0">
        <span
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          {count}개
        </span>
        {isDominant && (
          <span className="text-[10px] text-yellow-400">★</span>
        )}
      </div>
    </div>
  )
}

function GenreTag({ genre, color }: { genre: string; color?: string }) {
  return (
    <span
      className="px-3 py-1.5 rounded-full text-sm font-semibold"
      style={{
        background: color
          ? `${color}22`
          : 'rgba(139,92,246,0.15)',
        border: `1px solid ${color ? `${color}44` : 'rgba(139,92,246,0.3)'}`,
        color: color || '#c084fc',
      }}
    >
      {genre}
    </span>
  )
}

function SongCard({ song, index, color }: { song: SongRecommendation; index: number; color?: string }) {
  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${song.artist}`)}`

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/5"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      {/* 번호 */}
      <span
        className="text-xs font-bold w-5 flex-shrink-0 pt-0.5 text-center"
        style={{ color: color || 'rgba(139,92,246,0.7)' }}
      >
        {index + 1}
      </span>

      {/* 곡 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {song.title}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            — {song.artist}
          </span>
        </div>
        <p
          className="text-[11px] mt-0.5 leading-relaxed"
          style={{ color: 'rgba(148,163,184,0.65)' }}
        >
          {song.reason}
        </p>
      </div>

      {/* 링크 버튼 */}
      <div className="flex gap-1.5 flex-shrink-0 pt-0.5">
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Spotify에서 듣기"
          className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-75"
          style={{ background: 'rgba(29,185,84,0.15)', color: '#1DB954' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </a>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="YouTube에서 듣기"
          className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-75"
          style={{ background: 'rgba(255,0,0,0.12)', color: '#ff6b6b' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
          </svg>
        </a>
      </div>
    </div>
  )
}

const ELEMENT_BALANCE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  tree:  { bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)',  text: '#4ade80' },
  fire:  { bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.25)',  text: '#fb923c' },
  earth: { bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.25)',   text: '#eab308' },
  metal: { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', text: '#94a3b8' },
  water: { bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.25)',  text: '#60a5fa' },
}

function BalanceCard({ rec }: { rec: ElementBalance }) {
  const colors = ELEMENT_BALANCE_COLORS[rec.element] ?? ELEMENT_BALANCE_COLORS.earth

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{rec.emoji}</span>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-bold mb-1"
            style={{ color: colors.text }}
          >
            {ELEMENT_KR[rec.element] ?? rec.element} 보충
          </p>
          <p
            className="text-xs leading-relaxed mb-3"
            style={{ color: 'rgba(224,224,255,0.75)' }}
          >
            {rec.reason}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {rec.genres.map((g) => (
              <span
                key={g}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  background: `${colors.text}18`,
                  border: `1px solid ${colors.text}33`,
                  color: colors.text,
                }}
              >
                {g}
              </span>
            ))}
          </div>
          {/* 구체적인 곡 추천 */}
          {rec.songs?.length > 0 && (
            <div
              className="mt-3 pt-3 space-y-1.5"
              style={{ borderTop: `1px solid ${colors.border}` }}
            >
              {rec.songs.map((song, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] w-4 flex-shrink-0 pt-0.5 text-center" style={{ color: colors.text }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold" style={{ color: 'rgba(224,224,255,0.9)' }}>
                      {song.title}
                    </span>
                    <span className="text-[11px] ml-1" style={{ color: 'rgba(148,163,184,0.7)' }}>
                      — {song.artist}
                    </span>
                    {song.reason && (
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(148,163,184,0.55)' }}>
                        {song.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0 pt-0.5">
                    <a
                      href={`https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity"
                      style={{ background: 'rgba(29,185,84,0.15)', color: '#1DB954' }}
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
                    </a>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${song.artist}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity"
                      style={{ background: 'rgba(255,0,0,0.12)', color: '#ff6b6b' }}
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" /></svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
