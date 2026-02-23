import { NextResponse } from 'next/server'
import { calculateSaju } from '@orrery/core/saju'
import { STEM_INFO, BRANCH_ELEMENT } from '@orrery/core/constants'
import { GoogleGenAI } from '@google/genai'
import type { BirthInput } from '@orrery/core/types'

const PILLAR_LABELS = ['시주', '일주', '월주', '년주']

const ELEMENT_KR: Record<string, string> = {
  tree: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { year, month, day, hour, minute, gender, unknownTime } = body

    const input: BirthInput = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      gender: gender as 'M' | 'F',
      unknownTime: unknownTime || false,
    }

    // 1. 사주 계산
    const saju = calculateSaju(input)

    // 2. 오행 분포 계산
    const elementCounts: Record<string, number> = {
      tree: 0,
      fire: 0,
      earth: 0,
      metal: 0,
      water: 0,
    }

    saju.pillars.forEach((p) => {
      const stemEl = STEM_INFO[p.pillar.stem]?.element
      if (stemEl) elementCounts[stemEl] = (elementCounts[stemEl] || 0) + 1

      const branchEl = BRANCH_ELEMENT[p.pillar.branch]
      if (branchEl) elementCounts[branchEl] = (elementCounts[branchEl] || 0) + 1
    })

    const dominantElement = Object.entries(elementCounts).sort(
      ([, a], [, b]) => b - a
    )[0][0]

    // 부족한 오행 계산 (0개 = 완전 부재, 1개 = 상대적으로 약함)
    const maxCount = Math.max(...Object.values(elementCounts))
    const lackingElements = Object.entries(elementCounts)
      .filter(([, v]) => v === 0 || (maxCount >= 3 && v === 1))
      .map(([k]) => ELEMENT_KR[k])

    // 3. 프롬프트 구성
    const pillarSummary = saju.pillars
      .map(
        (p, i) =>
          `${PILLAR_LABELS[i]}: ${p.pillar.ganzi} (십신 ${p.stemSipsin}/${p.branchSipsin}, 운성 ${p.unseong})`
      )
      .join(' | ')

    const elementSummary = Object.entries(elementCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([k, v]) => `${ELEMENT_KR[k]} ${v}개`)
      .join(', ')

    const lackingSection =
      lackingElements.length > 0
        ? `부족한 오행: ${lackingElements.join(', ')}`
        : '오행이 비교적 균형잡혀 있습니다.'

    const prompt = `다음은 사용자의 사주팔자입니다.

사주 4기둥: ${pillarSummary}
오행 분포: ${elementSummary}
${lackingSection}
성별: ${gender === 'M' ? '남성' : '여성'}

위 사주를 바탕으로 아래 JSON 형식으로만 답변해주세요:
{
  "personality": "이 사주 주인공의 기질과 성격 특징 (3-4문장, 따뜻하고 통찰력 있게)",
  "musicVibe": "이 사주와 어울리는 음악 분위기와 에너지 설명 (2-3문장)",
  "genres": ["장르1", "장르2", "장르3", "장르4"],
  "spotifyKeywords": ["english search keyword 1", "english keyword 2", "english keyword 3"],
  "colors": ["#hex1", "#hex2", "#hex3"],
  "emoji": "이 사주를 대표하는 이모지 1개",
  "songs": [
    {
      "title": "실제 존재하는 곡 제목 (정확한 원제)",
      "artist": "아티스트명 (정확한 이름)",
      "reason": "이 사주와 어울리는 이유 (1-2문장, 구체적으로)"
    }
  ],
  "balanceRecommendations": [
    {
      "element": "부족한 오행 영어명 (tree/fire/earth/metal/water 중 하나)",
      "reason": "이 오행이 부족할 때 나타나는 특징과 이 음악을 들으면 좋은 이유 (2문장)",
      "genres": ["이 오행을 채워주는 한국어 장르1", "장르2"],
      "keyword": "spotify search keyword in english for this element vibe",
      "emoji": "이 오행의 이모지",
      "songs": [
        {
          "title": "실제 존재하는 곡 제목 (정확한 원제)",
          "artist": "아티스트명",
          "reason": "이 오행을 채워주는 이유 (1문장)"
        }
      ]
    }
  ]
}

songs: 이 사주의 에너지와 정확히 어울리는 실제 존재하는 곡 6-8개.
  - 한국 곡과 외국 곡 적절히 섞기
  - 유명하거나 잘 알려진 곡 위주 (Spotify에서 검색 가능한 곡)
  - 장르가 다양하게 (이 사주의 여러 면을 표현)
  - reason은 "목(木) 기운처럼 생동감 넘치는 기타 리프가..." 같이 사주와 연결해서 구체적으로
balanceRecommendations: 부족한 오행마다 하나씩. 없으면 빈 배열([]).
  각 항목의 songs: 해당 오행 에너지를 채워주는 실제 곡 3-4개 (Spotify 검색 가능한 곡).
오행별 음악 힌트:
- 목(木/tree): 숲 소리, 자연음, 어쿠스틱 포크, 봄 감성
- 화(火/fire): 에너지 팝, 댄스, EDM, 열정
- 토(土/earth): 소울, R&B, 재즈, 안정감
- 금(金/metal): 클래식, 미니멀, 가을 감성
- 수(水/water): 빗소리, 파도, 앰비언트, 블루스

genres: 한국어 음악 장르명 3-5개
spotifyKeywords: Spotify 검색용 영어 키워드 3개
colors: 오행 에너지를 담은 아름다운 hex 색상 3개`

    // 4. Gemini 호출
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

    const systemInstruction =
      '당신은 사주팔자 전문가이자 음악 큐레이터입니다. 사주의 오행과 음양 에너지를 분석하여 음악적 취향과 성격을 연결합니다. 반드시 유효한 JSON만 반환하세요. 마크다운 코드블록(```json) 없이 순수 JSON만 반환하세요.'

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.75,
        responseMimeType: 'application/json',
      },
    })

    const aiResult = JSON.parse(response.text ?? '{}')

    return NextResponse.json({
      saju: {
        pillars: saju.pillars.map((p, i) => ({
          label: PILLAR_LABELS[i],
          ganzi: p.pillar.ganzi,
          stem: p.pillar.stem,
          branch: p.pillar.branch,
          sipsin: p.stemSipsin,
          element: STEM_INFO[p.pillar.stem]?.element || 'earth',
        })),
        elementCounts,
        dominantElement,
      },
      ai: aiResult,
    })
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
