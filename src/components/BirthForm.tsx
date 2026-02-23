'use client'

import { useState } from 'react'
import type { BirthFormData } from '@/lib/types'

interface Props {
  onSubmit: (data: BirthFormData) => void
  error: string | null
}

const currentYear = new Date().getFullYear()

export default function BirthForm({ onSubmit, error }: Props) {
  const [form, setForm] = useState({
    year: '',
    month: '',
    day: '',
    hour: '12',
    minute: '0',
    gender: 'M' as 'M' | 'F',
    unknownTime: false,
  })

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.year || !form.month || !form.day) return

    onSubmit({
      year: Number(form.year),
      month: Number(form.month),
      day: Number(form.day),
      hour: form.unknownTime ? 12 : Number(form.hour),
      minute: form.unknownTime ? 0 : Number(form.minute),
      gender: form.gender,
      unknownTime: form.unknownTime,
    })
  }

  return (
    <div className="w-full max-w-md mx-auto fade-up">

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {/* 년월일 */}
        <div>
          <label
            className="block text-xs font-semibold mb-2 uppercase tracking-widest"
            style={{ color: 'rgba(139,92,246,0.9)' }}
          >
            생년월일
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div className="relative">
              <input
                type="number"
                placeholder="년도"
                min={1930}
                max={currentYear}
                value={form.year}
                onChange={(e) => set('year', e.target.value)}
                required
                className="saju-input w-full px-3 py-3 text-center text-sm"
              />
              <span
                className="absolute -bottom-4 left-0 text-[10px] w-full text-center"
                style={{ color: 'var(--text-muted)' }}
              >
                년
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="월"
                min={1}
                max={12}
                value={form.month}
                onChange={(e) => set('month', e.target.value)}
                required
                className="saju-input w-full px-3 py-3 text-center text-sm"
              />
              <span
                className="absolute -bottom-4 left-0 text-[10px] w-full text-center"
                style={{ color: 'var(--text-muted)' }}
              >
                월
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="일"
                min={1}
                max={31}
                value={form.day}
                onChange={(e) => set('day', e.target.value)}
                required
                className="saju-input w-full px-3 py-3 text-center text-sm"
              />
              <span
                className="absolute -bottom-4 left-0 text-[10px] w-full text-center"
                style={{ color: 'var(--text-muted)' }}
              >
                일
              </span>
            </div>
          </div>
        </div>

        {/* 시간 */}
        <div className="pt-3">
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(139,92,246,0.9)' }}
            >
              태어난 시간
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.unknownTime}
                  onChange={(e) => set('unknownTime', e.target.checked)}
                />
                <div
                  className="w-8 h-4 rounded-full transition-colors"
                  style={{
                    background: form.unknownTime
                      ? 'rgba(139,92,246,0.7)'
                      : 'rgba(255,255,255,0.15)',
                  }}
                />
                <div
                  className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform"
                  style={{
                    transform: form.unknownTime
                      ? 'translateX(1.25rem)'
                      : 'translateX(0.125rem)',
                  }}
                />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                모름
              </span>
            </label>
          </div>

          {!form.unknownTime && (
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={form.hour}
                  onChange={(e) => set('hour', e.target.value)}
                  className="saju-input w-full px-3 py-3 text-center text-sm"
                />
                <span
                  className="absolute -bottom-4 left-0 text-[10px] w-full text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  시 (0-23)
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={form.minute}
                  onChange={(e) => set('minute', e.target.value)}
                  className="saju-input w-full px-3 py-3 text-center text-sm"
                />
                <span
                  className="absolute -bottom-4 left-0 text-[10px] w-full text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  분
                </span>
              </div>
            </div>
          )}
          {form.unknownTime && (
            <p
              className="text-xs text-center py-2"
              style={{ color: 'rgba(148,163,184,0.5)' }}
            >
              시간 모름 시 3주(시주 제외)로 분석됩니다
            </p>
          )}
        </div>

        {/* 성별 */}
        <div className="pt-3">
          <label
            className="block text-xs font-semibold mb-3 uppercase tracking-widest"
            style={{ color: 'rgba(139,92,246,0.9)' }}
          >
            성별
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['M', 'F'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set('gender', g)}
                className="py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background:
                    form.gender === g
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))'
                      : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${form.gender === g ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.08)'}`,
                  color:
                    form.gender === g
                      ? '#e9d5ff'
                      : 'rgba(148,163,184,0.8)',
                  boxShadow:
                    form.gender === g
                      ? '0 0 16px rgba(139,92,246,0.2)'
                      : 'none',
                }}
              >
                {g === 'M' ? '♂ 남자' : '♀ 여자'}
              </button>
            ))}
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={!form.year || !form.month || !form.day}
          className="analyze-btn w-full mt-2"
        >
          ✦ 나의 음악 바이브 분석하기
        </button>
      </form>

      {/* 예시 설명 */}
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          { emoji: '🌿', label: '목(木)', desc: '인디·어쿠스틱' },
          { emoji: '🔥', label: '화(火)', desc: '팝·댄스' },
          { emoji: '💧', label: '수(水)', desc: '재즈·감성' },
        ].map((item) => (
          <div key={item.label} className="glass-card p-3">
            <div className="text-xl mb-1">{item.emoji}</div>
            <div
              className="text-xs font-bold mb-0.5"
              style={{ color: 'rgba(200,180,255,0.9)' }}
            >
              {item.label}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
