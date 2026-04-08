import type { AppLanguage, LanguageOption } from '../types'

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: 'EN'
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    flag: '🇮🇳'
  },
  {
    code: 'mr',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    flag: 'MR'
  }
]

export const LANGUAGE_INSTRUCTIONS: Record<AppLanguage, string> = {
  en: '',
  hi: `IMPORTANT: Respond entirely in Hindi (हिन्दी).
Use informal, warm Hindi like you'd text a close friend.
If the user writes in Roman script (English letters for Hindi words like "kya chal raha hai"),
understand it as Hindi and respond in proper Hindi script.
Examples of tone:
- "यार, यह सुनकर मन भारी हो गया। क्या हुआ असल में?"
- "अरे, यह तो बहुत अच्छी बात है! कैसा लग रहा है अभी?"
- "समझ सकता हूँ, ऐसे में बहुत मुश्किल होती है।"
Never mix English sentences — pure conversational Hindi only.`,

  mr: `IMPORTANT: Respond entirely in Marathi (मराठी).
Use informal, warm Marathi like you'd text a close friend from Maharashtra.
If the user writes in Roman script (English letters for Marathi words like "tu kasa ahes"), 
understand it as Marathi and respond in proper Marathi script.
Examples of tone:
- "अरे यार, हे ऐकून मन जड झालं. नक्की काय झालं?"
- "हे तर खूपच छान आहे! आत्ता कसं वाटतंय?"
- "समजतं मला, अशा वेळी खूप कठीण असतं."
Never mix English sentences — pure conversational Marathi only.`
}

export const OPENING_MESSAGES: Record<AppLanguage, string> = {
  en: "hey... I'm right here with you. what's been on your mind?",

  hi: "हां... मैं यहीं हूँ तुम्हारे साथ। क्या चल रहा है दिमाग में?",

  mr: "हं... मी इथेच आहे तुझ्यासोबत. काय चाललंय मनात?"
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
  },
  hi: {
    newSession: '✏️ नई बातचीत',
    pastSessions: '📖 पुरानी बातचीत',
    insights: '📈 अंतर्दृष्टि',
    signOut: 'लॉग आउट',
    startSession: 'शुरू करें →',
    endSession: 'सेव करके बंद करें',
    howFeeling: 'अभी कैसा महसूस हो रहा है?',
    typeHere: 'यहाँ लिखो... Enter दबाओ',
    notSureWrite: '💭 समझ नहीं आ रहा क्या लिखें?',
    sessionSaved: 'बातचीत सेव हो गई',
    startNew: 'नई बातचीत शुरू करें'
  },
  mr: {
    newSession: '✏️ नवीन संवाद',
    pastSessions: '📖 जुने संवाद',
    insights: '📈 अंतर्दृष्टी',
    signOut: 'लॉग आउट',
    startSession: 'सुरू करा →',
    endSession: 'सेव करून बंद करा',
    howFeeling: 'आत्ता कसं वाटतंय?',
    typeHere: 'इथे लिहा... Enter दाबा',
    notSureWrite: '💭 काय लिहावं समजत नाही?',
    sessionSaved: 'संवाद सेव झाला',
    startNew: 'नवीन संवाद सुरू करा'
  }
}