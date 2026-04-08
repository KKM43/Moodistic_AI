import type { JournalEntry } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function getInsights(entries: JournalEntry[]): Promise<string> {
  if (!entries.length) return "";


  const trimmed = entries.slice(0, 5).map((e) => ({
    mood: e.mood_score,
    summary: (e.ai_response || "").slice(0, 80),
  }));

  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: JSON.stringify(trimmed),
        },
      ],
      systemPrompt: `
You are analyzing a user's journaling patterns.

Goal:
Give 2–3 short, human insights about their emotional patterns.

Tone:
- "I'm noticing..." style
- Warm, slightly personal
- Not robotic
- Not too long

Rules:
- Max 3 sentences total
- No bullet points
- No advice
- No therapy language
- Just observations

Examples:
- "I'm noticing your mood dips a bit mid-week."
- "You seem to carry stress quietly sometimes."
- "There’s a pattern of feeling better after expressing things."

Keep it simple and real.
      `,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Insights error");

  return data.content;
}