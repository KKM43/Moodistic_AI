import { useEffect, useState } from "react";
import type { JournalEntry } from "../types";
import { checkMoodMismatch } from "../lib/retrieval";

interface Props {
  entries: JournalEntry[];
}

export default function MoodStats({ entries }: Props) {
  const [honestEntries, setHonestEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (entries.length === 0) return;

    const correct = async () => {
      const corrected = await Promise.all(
        entries.map(async (entry) => {
          const mismatch = await checkMoodMismatch(
            entry.content,
            entry.mood_score,
          );
          return {
            ...entry,
            mood_score:
              mismatch === "masked"
                ? 2
                : mismatch === "reverse_masked"
                  ? 4
                  : entry.mood_score,
          };
        }),
      );
      setHonestEntries(corrected);
    };

    correct();
  }, [entries]);

  if (entries.length === 0) return null;

  // Using honestEntries if AI has finished else fall back to raw entries
  const data = honestEntries.length > 0 ? honestEntries : entries;

  const calcStreak = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entryDates = [
      ...new Set(
        entries.map((e) => {
          const d = new Date(e.created_at);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }),
      ),
    ].sort((a, b) => b - a);

    let streak = 0;
    let checkDate = today.getTime();

    for (const dateMs of entryDates) {
      if (dateMs === checkDate) {
        streak++;
        checkDate -= 86400000;
      } else if (dateMs === checkDate - 86400000) {
        streak++;
        checkDate = dateMs - 86400000;
      } else {
        break;
      }
    }

    return streak;
  };

  const avgMood = (
    data.reduce((sum, e) => sum + e.mood_score, 0) / data.length
  ).toFixed(1);

  const bestMood = Math.max(...data.map((e) => e.mood_score));
  const streak = calcStreak();

  const MOOD_LABELS: Record<number, string> = {
    1: "Really rough",
    2: "Not great",
    3: "Okay",
    4: "Pretty good",
    5: "Great",
  };

  const stats = [
    { label: "Total Entries", value: entries.length, icon: "📝" },
    { label: "Day Streak", value: `${streak} 🔥`, icon: "📅" },
    { label: "Average Mood", value: `${avgMood}/5`, icon: "💭" },
    { label: "Best Mood", value: MOOD_LABELS[bestMood], icon: "⭐" },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <span className="stat-icon">{stat.icon}</span>
          <span className="stat-value">{stat.value}</span>
          <span className="stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
