import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { JournalEntry } from "../types";
import { checkMoodMismatch } from "../lib/retrieval";

interface Props {
  entries: JournalEntry[];
}

interface ChartPoint {
  date: string;
  mood: number;
  displayMood: number;
  preview: string;
  mismatch: "masked" | "reverse_masked" | "honest";
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const EMOJIS: Record<number, string> = {
    1: "😞",
    2: "😕",
    3: "😐",
    4: "🙂",
    5: "😊",
  };
  const icon =
    payload.mismatch === "masked"
      ? "⚠️"
      : payload.mismatch === "reverse_masked"
        ? "✨"
        : EMOJIS[payload.displayMood];

  return (
    <g>
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={16}>
        {icon}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-date">{d.date}</p>
      <p className="tooltip-mood">
        Mood: {d.displayMood}/5
        {d.mismatch !== "honest" ? " (selected)" : ""}
      </p>
      {d.mismatch === "masked" && (
        <p className="tooltip-masked">
          ⚠️ Your words suggest you were feeling harder than this score shows
        </p>
      )}
      {d.mismatch === "reverse_masked" && (
        <p className="tooltip-positive">
          ✨ Your words sound more positive — maybe things are better than you
          think?
        </p>
      )}
      <p className="tooltip-preview">{d.preview}</p>
    </div>
  );
};

export default function MoodChart({ entries }: Props) {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entries.length === 0) {
      setLoading(false);
      return;
    }

    const buildChartData = async () => {
      setLoading(true);

      // Analysing all entries
      const results = await Promise.all(
        [...entries].reverse().map(async (entry) => {
          const mismatch = await checkMoodMismatch(
            entry.content,
            entry.mood_score,
          );
          return {
            date: new Date(entry.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            }),
            mood:
              mismatch === "masked"
                ? 2
                : mismatch === "reverse_masked"
                  ? 4
                  : entry.mood_score,
            displayMood: entry.mood_score,
            preview:
              entry.content.slice(0, 60) +
              (entry.content.length > 60 ? "..." : ""),
            mismatch,
          };
        }),
      );

      setChartData(results);
      setLoading(false);
    };

    buildChartData();
  }, [entries]);

  if (loading) {
    return <div className="chart-empty">Analysing your mood patterns...</div>;
  }

  if (chartData.length < 2) {
    return (
      <div className="chart-empty">
        Write at least 2 entries to see your mood trend 🌱
      </div>
    );
  }

  const avgMood = (
    chartData.reduce((sum, d) => sum + d.mood, 0) / chartData.length
  ).toFixed(1);

  return (
    <div className="chart-wrap">
      <div className="chart-meta">
        <span className="chart-avg">
          Average mood: <strong>{avgMood}/5</strong>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#a0aec0" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 12, fill: "#a0aec0" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={3} stroke="#e8ddd0" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#c4674a"
            strokeWidth={2.5}
            dot={<CustomDot />}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
