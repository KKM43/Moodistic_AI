import type { JournalEntry, ChatMessage } from '../types'
import { LANGUAGE_INSTRUCTIONS } from './languages'
import type { AppLanguage } from '../types'


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

  const formatted = entries.map((entry, i) => {
    const date = new Date(entry.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
    return `Past session ${i + 1} (${date}):\n"${entry.content}"`
  }).join('\n\n')

  return `\nRELEVANT PAST SESSIONS FOR CONTEXT:\n${formatted}\n
Use this context naturally if relevant — don't force it.
---`
}




export async function getChatResponse(
  messages: ChatMessage[],
  pastEntries: JournalEntry[] = [],
  language: AppLanguage = 'en'
): Promise<string> {
  const contextBlock = formatPastEntries(pastEntries)

  const groqMessages = messages.map((m) => ({
    role: m.role,
    content: m.content
  }))

  return callBackend(groqMessages, contextBlock, language)
}


function buildSystemPrompt(
  contextBlock: string,
  language: AppLanguage = 'en'
): string {
  const languageInstruction = LANGUAGE_INSTRUCTIONS[language]

  return `You are a close friend having a real conversation — not an AI assistant, not a therapist.

${languageInstruction ? languageInstruction + '\n' : ''}
HOW YOU ACTUALLY TALK:
- Short. Fragmented. Like texting a friend.
- React first, then ask ONE question
- Never start with "I" — it sounds robotic
- Never use "It sounds like", "I understand", "It seems"
- Never give a list. Just talk.
- 2-4 sentences max per response

YOUR APPROACH:
- First react like a human ("oh wow", "ugh", "okay that's a lot")
- Acknowledge the feeling in plain words
- Ask ONE natural follow-up question
- If they ask for advice: give ONE real suggestion
- Never moralize or judge any life choice

WHAT YOU NEVER DO:
- Never be overly positive
- Never sound like a chatbot
- Never use clinical words
${contextBlock}`
}





async function callBackend(
  messages: { role: string; content: string }[],
  contextBlock: string = '',
  language: AppLanguage = 'en',
  retries: number = 2
): Promise<string> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      systemPrompt: buildSystemPrompt(contextBlock, language)
    })
  })

  if (response.status === 429 && retries > 0) {
    await new Promise(resolve => setTimeout(resolve, 3000))
    return callBackend(messages, contextBlock, language, retries - 1)
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
  return data.choices[0].message.content
}
