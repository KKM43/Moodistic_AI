import type { JournalEntry, ChatMessage } from '../types'
import { LANGUAGE_INSTRUCTIONS } from './languages'
import type { AppLanguage } from '../types'
import { detectUserStyle } from './personality'
import type { UserMemory } from './memory'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const userMessageCounts = new Map<string, { count: number, date: string }>()

export function checkRateLimit(userId: string): boolean {
  const today = new Date().toDateString()
  const current = userMessageCounts.get(userId)

  if (!current || current.date !== today) {
    userMessageCounts.set(userId, { count: 1, date: today })
    return true
  }

  if (current.count >= 20) return false

  current.count++
  return true
}



function formatPastEntries(entries: JournalEntry[]): string {
  if (entries.length === 0) return ''

  const formatted = entries.map((entry) => {
    const date = new Date(entry.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })

    return `- (${date}) mood:${entry.mood_score} — ${entry.ai_response.slice(0, 100)}`
  }).join('\n')

  return `\nPAST CONTEXT:\n${formatted}\n---`
}



export async function getChatResponse(
  messages: ChatMessage[],
  pastEntries: JournalEntry[] = [],
  language: AppLanguage = 'en',
  userMemory?: UserMemory

): Promise<string> {
  const contextBlock = formatPastEntries(pastEntries)


  const recentMessages = messages.slice(-6)

  const userStyle = detectUserStyle(messages)

  const groqMessages = recentMessages.map((m) => ({
    role: m.role,
    content: m.content.slice(0, 200)
  }))

  return callBackend(groqMessages, contextBlock, language, userStyle, userMemory)
}



const REACTION_STYLES = ['soft', 'empathetic', 'casual', 'quiet']

const styleInstructionMap = {
  short: `
User writes briefly.
- Keep replies short (1-2 lines)
- Be casual and direct
- Don’t ask deep questions every time
`,
  medium: `
User writes normally.
- Keep balanced responses
`,
  deep: `
User writes in detail.
- Respond with more depth and reflection
- It's okay to be slightly longer (3-4 lines)
- Ask thoughtful questions
`
}

function buildSystemPrompt(
  contextBlock: string,
  language: AppLanguage = 'en',
  userStyle: 'short' | 'medium' | 'deep' = 'medium',
  userMemory?: UserMemory
): string {
  const languageInstruction = LANGUAGE_INSTRUCTIONS[language]
  const randomStyle =
    REACTION_STYLES[Math.floor(Math.random() * REACTION_STYLES.length)]

  const memoryBlock = userMemory
    ? `
USER MEMORY:
- Communication style: ${userMemory.tone}
- Common themes: ${userMemory.commonThemes.join(", ") || "none yet"}
- Emotional pattern: ${userMemory.emotionalPattern || "still learning"}

Use this subtly:
- Don't repeat it directly
- Let it influence tone and understanding
`
    : ""

  return `
IDENTITY:
You are MindShift — a journaling companion inside the app the user is currently using.

You are not an external person.
You are not a therapist or coach.
You are the app itself, present with the user in their private space.

If the user refers to "this app":
- Respond naturally like: "yeah, that's me 🙂"
- Never act confused about what the app is

Your role:
- Be calm, emotionally present
- Help users process thoughts, not fix everything
- Feel like a quiet, understanding presence

${languageInstruction ? languageInstruction + '\n' : ''}
${memoryBlock}

STYLE:
Tone: ${randomStyle}
${styleInstructionMap[userStyle]}

- Talk like real texting. Natural and slightly imperfect
- Usually 2–4 sentences (vary it)
- Sometimes ask a question, sometimes don’t
- It's okay to be casual: "hmm", "...", "idk"

BEHAVIOR:
- React emotionally first
- Validate without sounding clinical
- Stay with their feeling — don’t rush to fix
- Advice should be small, optional, and human

FIRST MESSAGE RULE:
If this is the first user message:
- Be a bit warmer than usual
- Acknowledge that they opened up
- Don’t ask too many questions immediately

QUESTIONS:
- Ask something specific to what they said
- Avoid generic questions

AVOID:
- "I understand", "It sounds like", "You should"
- Over-explaining or analyzing
- Robotic phrasing

MEMORY:
- If past context exists, use it subtly and naturally

FLOW:
- Sometimes just respond without asking a question
- Vary how you start replies
- Sometimes sit with the feeling instead of moving forward

${contextBlock}
`
}



async function callBackend(
  messages: { role: string; content: string }[],
  contextBlock: string = '',
  language: AppLanguage = 'en',
  userStyle: 'short' | 'medium' | 'deep' = 'medium',
  userMemory?: UserMemory,
  retries: number = 2
): Promise<string> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      systemPrompt: buildSystemPrompt(contextBlock, language, userStyle, userMemory)
    })
  })

  if (response.status === 429 && retries > 0) {
    await new Promise(resolve => setTimeout(resolve, 3000))
    return callBackend(messages, contextBlock, language, userStyle)
  }

  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Server error')

  return data.content
}



export async function getSessionSummary(
  messages: ChatMessage[]
): Promise<string> {
  const conversation = messages
    .map(m => `${m.role === 'user' ? 'User' : 'MindShift'}: ${m.content}`)
    .join('\n')

  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: conversation }],
      systemPrompt: `Summarize this journaling conversation in 2 sentences.
Capture what the person was feeling and any shift or insight that emerged.
Write it in second person ("You were feeling...").
No markdown. Just plain text.`
    })
  })

  const data = await response.json()

  if (!response.ok) return ''
  return data.content
}