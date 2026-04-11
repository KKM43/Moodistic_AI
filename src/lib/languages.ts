import type { AppLanguage, LanguageOption } from '../types'

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: 'EN'
  }
]

export const LANGUAGE_INSTRUCTIONS: Record<AppLanguage, string> = {
  en: '' 
}

export const OPENING_MESSAGES: Record<AppLanguage, string> = {
  en: "hey... I'm right here with you. what's been on your mind?"
}

export const UI_STRINGS: Record<AppLanguage, {
  newSession: string
  pastSessions: string
  insights: string
  signOut: string
  startSession: string
  endSession: string
  howFeeling: string
  typeHere: string
  notSureWrite: string
  sessionSaved: string
  startNew: string
}> = {
  en: {
    newSession: '✏️ New Session',
    pastSessions: '📖 Past Sessions',
    insights: '📈 Insights',
    signOut: 'Sign Out',
    startSession: 'Start Session →',
    endSession: 'End & Save Session',
    howFeeling: 'How are you feeling?',
    typeHere: 'Type here... press Enter to send',
    notSureWrite: '💭 not sure what to write?',
    sessionSaved: 'Session saved',
    startNew: 'Start a New Session'
  }
}