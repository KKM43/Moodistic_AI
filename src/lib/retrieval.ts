import type { JournalEntry } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'


const STOP_WORDS = new Set([
  'i', 'me', 'my', 'am', 'is', 'are', 'was', 'the', 'a', 'an',
  'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'it', 'this', 'that', 'so', 'do', 'did', 'have', 'had', 'be',
  'been', 'not', 'no', 'just', 'about', 'like', 'get', 'got', 'feel'
])


function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')   
      .split(/\s+/)               
      .filter(word =>
        word.length > 3 &&        
        !STOP_WORDS.has(word)     
      )
  )
}


function scoreEntry(currentKeywords: Set<string>, entry: JournalEntry): number {
  const entryKeywords = extractKeywords(entry.content)

  
  let keywordScore = 0
  for (const word of currentKeywords) {
    if (entryKeywords.has(word)) keywordScore++
  }

  
  const daysSince = (Date.now() - new Date(entry.created_at).getTime()) / 86400000
  const recencyBoost = daysSince < 7 ? 0.5 : 0

  return keywordScore + recencyBoost
}


export function retrieveRelevantEntries(
  currentText: string,
  allEntries: JournalEntry[],
  topK: number = 3
): JournalEntry[] {
  if (allEntries.length === 0) return []

  const currentKeywords = extractKeywords(currentText)

  
  const scored = allEntries
    .map(entry => ({
      entry,
      score: scoreEntry(currentKeywords, entry)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return scored.map(({ entry }) => entry)
}



export async function analyzeSentiment(
  text: string
): Promise<{ tone: 'positive' | 'negative' | 'neutral'; confidence: number }> {
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: text }],
        systemPrompt: `You are an emotional tone analyzer. 
Analyze the UNDERLYING emotional state of the person writing, not the surface topic.
Look for hidden frustration, sadness, desperation, or anxiety even if disguised as neutral statements.

Examples:
- "i am frustrated with low salary" → negative
- "I am very happy i got the new job" → positive  
- "why do people think my choice is bad, i am frustrated" → negative
- "feeling stuck and looking for options" → negative
- "excited about my new project" → positive

Return ONLY a JSON object: {"tone": "negative", "confidence": 0.9}
tone must be exactly: "positive", "negative", or "neutral"
confidence is 0.0 to 1.0
No explanation. No markdown. Just JSON.`
      })
    })

    const data = await response.json()
    return JSON.parse(data.content.trim())
  } catch {
    return { tone: 'neutral', confidence: 0 }
  }
}


export async function checkMoodMismatch(
  text: string,
  moodScore: number
): Promise<'masked' | 'reverse_masked' | 'honest'> {
  const { tone, confidence } = await analyzeSentiment(text)

  if (confidence < 0.6) return 'honest'  // ← lowered from 0.7 to 0.6

  if (tone === 'negative' && moodScore >= 4) return 'masked'
  if (tone === 'positive' && moodScore <= 2) return 'reverse_masked'
  return 'honest'
}



const CRISIS_SIGNALS = [
  'kill myself', 'end my life', 'take my life', 'want to die',
  'suicide', 'suicidal', 'no point living', 'better off dead',
  'cant go on', "can't go on", 'give up on life', 'end it all',
  'harm myself', 'hurt myself', 'self harm', 'cut myself',
  'not worth living', 'wish i was dead', 'want to disappear forever'
]

export function isCrisisEntry(text: string): boolean {
  const lower = text.toLowerCase()
  return CRISIS_SIGNALS.some(signal => lower.includes(signal))
}



// const DISTRESS_SIGNALS = [
//   'sad', 'crying', 'cry', 'depressed', 'depression', 'hopeless',
//   'worthless', 'lonely', 'alone', 'exhausted', 'broken', 'empty',
//   'numb', 'anxious', 'anxiety', 'panic', 'scared', 'terrified',
//   'overwhelmed', 'trapped', 'stuck', 'failing', 'failure', 'hate myself',
//   'hate my life', 'tired of everything', 'nothing matters', 'no one cares',
//   'frustrated', 'frustated', 'frustrating', 'upset', 'angry', 'furious',
//   'stressed', 'stressed out', 'cant take it', "can't take it", 'fed up',
//   'burned out', 'burnout', 'miserable', 'horrible', 'terrible', 'awful',
//   'done with', 'so done', 'hate this', 'hate my', 'unfair', 'suffocating'
// ]

// // Returns true if someone picked a high mood but wrote distressing content
// export function isMaskedMood(text: string, moodScore: number): boolean {
//   if (moodScore <= 3) return false   // low mood + sad words = honest, not masked
//   const lower = text.toLowerCase()
//   const distressCount = DISTRESS_SIGNALS.filter(s => lower.includes(s)).length
//   return distressCount >= 1          // 1+ distress signals with high mood = likely masking
// }



// const POSITIVE_SIGNALS = [
//   'happy', 'excited', 'thrilled', 'great news', 'got the job',
//   'promotion', 'achieved', 'proud', 'celebrating', 'wonderful',
//   'amazing', 'fantastic', 'blessed', 'grateful', 'so good',
//   'love it', 'best day', 'succeeded', 'passed', 'won',
//   'great news', 'good news', 'finally', 'so happy', 'really happy',
//   'very happy', 'got selected', 'got offer', 'new job', 'got the offer',
//   'cracked it', 'nailed it', 'cleared', 'selected', 'offer letter'
// ]

// Returns true if someone picked a low mood but wrote positive content
// export function isReverseMasked(text: string, moodScore: number): boolean {
//   if (moodScore >= 3) return false   // only check low mood scores
//   const lower = text.toLowerCase()
//   const positiveCount = POSITIVE_SIGNALS.filter(s => lower.includes(s)).length
//   return positiveCount >= 1          // even 1 strong positive signal is enough
// }