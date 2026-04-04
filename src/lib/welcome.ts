import type { JournalEntry } from '../types'

export async function getWelcomeMessage(
  entries: JournalEntry[]
): Promise<string> {

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

  
  if (entries.length === 0) {
    return "Hey, welcome to MindShift! This is your private space — no judgment, no pressure. Whenever you're ready, just start talking."
  }

  const lastEntry = entries[0] 
  const daysSinceLast = Math.floor(
    (Date.now() - new Date(lastEntry.created_at).getTime()) / 86400000
  )

  const isMonday = new Date().getDay() === 1

  
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekEntries = entries.filter(e =>
    new Date(e.created_at) >= weekAgo
  )

  
  const streak = calcStreak(entries)

  const systemPrompt =
    isMonday && weekEntries.length > 0
      ? `You write short, warm Monday morning weekly reflections for a journaling app.
Rules:
- Max 2 sentences
- Acknowledge what they carried last week
- One quiet encouragement for the new week
- Lowercase, warm, like a friend
- No emojis except one at the end if natural
Context:
- Sessions last week: ${weekEntries.length}
- Average mood last week: ${(
        weekEntries.reduce((s, e) => s + e.mood_score, 0) /
        weekEntries.length
      ).toFixed(1)}/5
- Last session summary: "${lastEntry.ai_response}"
- Current streak: ${streak} days`
      : `You write short, warm, personal welcome messages for a journaling app.
Rules:
- Max 2 sentences
- Sound like a friend who genuinely remembers them — not a chatbot
- Lowercase — like a text message from a close friend
- Never be generic ("Hope you're doing well!")
- No emojis except one at the end if natural
- If they've been away a while, acknowledge it gently without guilt
- If they have a streak, mention it briefly
Context:
- Days since last session: ${daysSinceLast}
- Current streak: ${streak} days
- Last session summary: "${lastEntry.ai_response}"
- Last mood score: ${lastEntry.mood_score}/5`

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt: systemPrompt,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: 'Write a welcome back message for this user.'
          }
        ]
      })
    })

    const data = await response.json()
    return data.choices[0].message.content.trim()

  } catch {
    
    if (daysSinceLast === 0) return "Good to see you again today. Ready when you are."
    if (daysSinceLast === 1) return "You're back — glad you showed up again."
    if (daysSinceLast <= 3) return `It's been ${daysSinceLast} days. How have things been?`
    if (streak > 3) return `${streak} days in a row — that consistency matters more than you think.`
    return `It's been a little while. No pressure — just glad you're here.`
  }
}

function calcStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const entryDates = [...new Set(
    entries.map(e => {
      const d = new Date(e.created_at)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
  )].sort((a, b) => b - a)

  let streak = 0
  let checkDate = today.getTime()

  for (const dateMs of entryDates) {
    if (dateMs === checkDate) {
      streak++
      checkDate -= 86400000
    } else if (dateMs === checkDate - 86400000) {
      streak++
      checkDate = dateMs - 86400000
    } else break
  }

  return streak
}