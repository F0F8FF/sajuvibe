export interface BirthFormData {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  gender: 'M' | 'F'
  unknownTime: boolean
}

export interface PillarData {
  label: string
  ganzi: string
  stem: string
  branch: string
  sipsin: string
  element: string
}

export interface SongRecommendation {
  title: string
  artist: string
  reason: string
}

export interface ElementBalance {
  element: string
  reason: string
  genres: string[]
  keyword: string
  emoji: string
  songs: SongRecommendation[]
}

export interface AiAnalysis {
  personality: string
  musicVibe: string
  genres: string[]
  spotifyKeywords: string[]
  colors: string[]
  emoji: string
  balanceRecommendations: ElementBalance[]
  songs: SongRecommendation[]
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  url: string
  imageUrl: string
  tracksTotal: number
}

export interface AnalyzeResponse {
  saju: {
    pillars: PillarData[]
    elementCounts: Record<string, number>
    dominantElement: string
  }
  ai: AiAnalysis
}
