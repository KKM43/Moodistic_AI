import { useEffect, useState } from "react";
import type { JournalEntry } from "../types";
import { getInsights } from "../lib/insights";

export function useInsights(entries: JournalEntry[]) {
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entries.length) {
      setLoading(false);
      return;
    }

    const cacheKey = `insights_${entries.length}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setInsights(cached);
      setLoading(false);
      return;
    }

    const generate = async () => {
      try {
        const result = await getInsights(entries);

        setInsights(result);
        localStorage.setItem(cacheKey, result);
      } catch {

        setInsights(getFallbackInsights(entries));
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [entries]);

  return { insights, loading };
}


function getFallbackInsights(entries: JournalEntry[]): string {
  const avg =
    entries.reduce((sum, e) => sum + e.mood_score, 0) / entries.length;

  if (avg >= 4) {
    return "I'm noticing you've been feeling quite positive lately. There’s a steady sense of balance in how you're doing.";
  }

  if (avg <= 2.5) {
    return "I'm noticing things have felt a bit heavy recently. You've still been showing up here though, which says a lot.";
  }

  return "I'm noticing your mood has been up and down lately. There’s a mix of different feelings showing up.";
}