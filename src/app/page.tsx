'use client'

import { useState } from 'react'
import type { BirthFormData, AnalyzeResponse } from '@/lib/types'
import BirthForm from '@/components/BirthForm'
import ResultDisplay from '@/components/ResultDisplay'

type View = 'form' | 'loading' | 'result'

export default function Home() {
  const [view, setView] = useState<View>('form')
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: BirthFormData) => {
    setView('loading')
    setError(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '분석 실패')
      }

      const data2: AnalyzeResponse = await res.json()
      setResult(data2)
      setView('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
      setView('form')
    }
  }

  const handleReset = () => {
    setView('form')
    setResult(null)
  }

  return (
    <main className="relative min-h-screen">
      {/* 별 배경 */}
      <div className="stars-bg" />

      {/* 콘텐츠 */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 헤더 */}
        <header className="pt-8 pb-4 text-center px-4">
          <button
            onClick={handleReset}
            className="inline-block cursor-pointer"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl">✦</span>
              <h1
                className="text-3xl md:text-4xl font-black tracking-tight"
                style={{
                  background:
                    'linear-gradient(135deg, #c084fc 0%, #818cf8 50%, #22d3ee 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                사주 바이브
              </h1>
              <span className="text-3xl">✦</span>
            </div>
            <p
              className="text-sm"
              style={{ color: 'rgba(148, 163, 184, 0.8)' }}
            >
              사주팔자로 알아보는 나만의 음악 취향
            </p>
          </button>
        </header>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          {view === 'form' && (
            <BirthForm onSubmit={handleSubmit} error={error} />
          )}

          {view === 'loading' && <LoadingView />}

          {view === 'result' && result && (
            <ResultDisplay result={result} onReset={handleReset} />
          )}
        </div>

        {/* 푸터 */}
        <footer className="text-center py-6 px-4">
          <p className="text-xs" style={{ color: 'rgba(100, 116, 139, 0.7)' }}>
            Made by:{' '}
            <a
              href="https://github.com/F0F8FF"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-400 transition-colors underline"
            >
              @F0F8FF
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}

function LoadingView() {
  const messages = [
    '사주팔자를 계산하는 중...',
    '오행의 기운을 읽는 중...',
    'AI가 음악 바이브를 분석하는 중...',
    '플레이리스트를 찾는 중...',
  ]

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16">
      {/* 별 로딩 애니메이션 */}
      <div className="relative w-28 h-28">
        <div
          className="absolute inset-0 rounded-full pulse-glow"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-4 rounded-full pulse-glow"
          style={{
            animationDelay: '0.5s',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl">☯</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p
          className="text-lg font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {messages[Math.floor(Date.now() / 1000) % messages.length]}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          잠시만 기다려주세요
        </p>
      </div>

      {/* 로딩 바 */}
      <div
        className="w-48 h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background:
              'linear-gradient(to right, #6366f1, #8b5cf6, #22d3ee)',
            animation: 'loading-bar 2s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}
