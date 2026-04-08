import type { JournalEntry } from "../types"

export type UserMemory = {
  tone: "short" | "medium" | "deep"
  commonThemes: string[]
  emotionalPattern: string
}

export function buildUserMemory(entries: JournalEntry[]): UserMemory {
  if (entries.length === 0) {
    return {
      tone: "medium",
      commonThemes: [],
      emotionalPattern: ""
    }
  }


  const avgLength =
    entries.reduce((sum, e) => sum + e.content.length, 0) /
    entries.length

  let tone: UserMemory["tone"] = "medium"
  if (avgLength < 300) tone = "short"
  else if (avgLength > 1000) tone = "deep"


  const text = entries.map(e => e.content.toLowerCase()).join(" ")

  const themes: string[] = []

  if (text.includes("work") || text.includes("job")) themes.push("work stress")
  if (text.includes("study") || text.includes("exam")) themes.push("academic stress")
  if (text.includes("friend") || text.includes("relationship")) themes.push("relationships")
  if (text.includes("tired") || text.includes("burnout")) themes.push("burnout")
  if (text.includes("overthink")) themes.push("overthinking")


  let emotionalPattern = ""

  if (text.includes("not enough") || text.includes("failure")) {
    emotionalPattern = "sometimes self-critical"
  } else if (text.includes("happy") || text.includes("better")) {
    emotionalPattern = "generally improving over time"
  }

  return {
    tone,
    commonThemes: themes.slice(0, 3),
    emotionalPattern
  }
}