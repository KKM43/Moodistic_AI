export const JOURNAL_PROMPTS = [
  // Emotional check-in
  "What's one thing that's been quietly bothering you lately?",
  "Describe how you're feeling right now in 3 words.",
  "What emotion have you been avoiding this week?",
  "What's taking up the most space in your head today?",
  "If your mood were weather right now, what would it be?",

  // Reflection
  "What would you tell a close friend who was feeling exactly like you are?",
  "What's one small thing that went okay today, even if everything else didn't?",
  "What's something you've been carrying alone that you haven't said out loud?",
  "What do you wish someone would ask you right now?",
  "What's one thing you did this week that you're quietly proud of?",

  // Student specific
  "What's stressing you out most about studies right now?",
  "Are you being too hard on yourself about something?",
  "What would 'good enough' look like for you today?",
  "What's one thing you keep putting off — and what's really stopping you?",
  "When did you last feel genuinely okay? What was different then?",

  // Low energy / rough days
  "You don't have to be okay. What's actually going on?",
  "What do you need right now that you're not getting?",
  "What's one tiny thing that might make today slightly better?",
  "What are you most scared of right now?",
  "What would feel like relief today, even just a little?"
]


export function getRandomPrompts(count: number = 3): string[] {
  const shuffled = [...JOURNAL_PROMPTS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}