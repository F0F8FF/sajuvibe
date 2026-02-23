# 사주 바이브 (SajuVibe) 🌙

> 사주팔자로 알아보는 나만의 음악 취향

생년월일시를 입력하면 AI가 사주팔자의 오행(五行)과 음양(陰陽)을 분석하고,  
당신의 기질과 에너지에 어울리는 음악과 플레이리스트를 추천해드립니다.

https://saju-vibe.vercel.app

## 기능

- 사주팔자 4기둥 계산 (년주·월주·일주·시주)
- 오행 분포 시각화 (목·화·토·금·수)
- AI 성격 분석 및 음악 바이브 해석 (Gemini 2.0)
- 사주 에너지와 딱 맞는 **구체적인 곡 추천** (제목·아티스트·이유)
- **오행 균형 처방** — 부족한 오행을 채워주는 곡 추천
- Spotify Web Playback SDK — 브라우저에서 직접 재생
- Spotify / YouTube 바로가기 링크
- 사주 컬러 팔레트 생성
- 결과 공유 기능

## 기술 스택

- **Frontend**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **AI 분석**: Google Gemini 2.0 Flash
- **음악 재생**: Spotify Web Playback SDK + OAuth 2.0
- **음악 검색**: Spotify Web API / YouTube

## 아키텍처

```
사용자 입력 (생년월일시 + 성별)
    ↓
사주 계산
    → 4기둥 (년·월·일·시주) 계산
    → 오행 분포 계산
    → 부족한 오행 감지
    ↓
Google Gemini 2.0 Flash
    → 사주 기반 성격 분석
    → 음악 무드 및 장르 추천
    → 구체적인 곡 추천 (제목 + 아티스트 + 이유)
    → 오행 균형 처방 (부족한 오행별 곡 추천)
    → 컬러 팔레트 생성
    ↓
Spotify OAuth 2.0 (선택)
    → Web Playback SDK로 브라우저에서 직접 재생
    → 추천 곡명으로 정확한 트랙 검색
    ↓
결과 카드 (공유 가능)
```


