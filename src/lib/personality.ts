type UserStyle = 'short' | 'medium' | 'deep'

export function detectUserStyle(
  messages: { role: string; content: string }[]
): UserStyle {
  const userMessages = messages.filter(m => m.role === 'user')

  if (userMessages.length === 0) return 'medium'

  const recent = userMessages.slice(-5)

  const avgLength =
    recent.reduce((sum, m) => sum + m.content.length, 0) / recent.length

  const hasShortPhrases = recent.some(
    m => m.content.trim().split(/\s+/).length <= 4
  )

  const hasEmojis = recent.some(m =>
    /[\u{1F600}-\u{1F64F}]/u.test(m.content)
  )


  if (avgLength < 40 || hasShortPhrases || hasEmojis) return 'short'
  if (avgLength > 120) return 'deep'

  return 'medium'
}