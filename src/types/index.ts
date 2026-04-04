

export interface JournalEntry {
  id: string
  user_id: string
  content: string
  ai_response: string
  mood_score: number
  created_at: string
}

export interface MoodLog {
  date: string
  score: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export type AppLanguage = 'en' | 'hi' | 'mr'

export interface LanguageOption {
  code: AppLanguage
  label: string
  nativeLabel: string
  flag: string
}