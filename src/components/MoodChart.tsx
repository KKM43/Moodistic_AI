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
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#fff"
        stroke="#c4674a"
        strokeWidth={2.5}
      />
      <text
        x={cx}
        y={cy + 5}
        textAnchor="middle"
        fontSize={18}
        dominantBaseline="middle"
      >
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
        Mood: <strong>{d.displayMood}/5</strong>
        {d.mismatch !== "honest" && " (adjusted)"}
      </p>
      {d.mismatch === "masked" && (
        <p className="tooltip-masked">
          ⚠️ Words suggest lower mood than selected
        </p>
      )}
      {d.mismatch === "reverse_masked" && (
        <p className="tooltip-positive">✨ Words sound more positive</p>
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
      const recentEntries = [...entries].slice(0, 10).reverse();
      const results: ChartPoint[] = [];

      for (const entry of recentEntries) {
        const mismatch = await checkMoodMismatch(
          entry.content,
          entry.mood_score,
        );

        results.push({
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
            entry.content.slice(0, 65) +
            (entry.content.length > 65 ? "..." : ""),
          mismatch,
        });

        await new Promise((resolve) => setTimeout(resolve, 280));
      }

      setChartData(results);
      setLoading(false);
    };

    buildChartData();
  }, [entries]);

  if (loading)
    return <div className="chart-empty">Analyzing mood patterns...</div>;
  if (chartData.length < 2) {
    return (
      <div className="chart-empty">
        Write at least 2 entries to see your trend 🌱
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

      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0e8df" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#a89880" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 12, fill: "#a89880" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={3}
            stroke="#e8ddd0"
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          <Line
            type="natural"
            dataKey="mood"
            stroke="#c4674a"
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{ r: 7, fill: "#c4674a" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
