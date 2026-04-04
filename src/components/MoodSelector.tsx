const MOODS = [
  { score: 1, emoji: "😞", label: "Really rough" },
  { score: 2, emoji: "😕", label: "Not great" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "🙂", label: "Pretty good" },
  { score: 5, emoji: "😊", label: "Great" },
];

interface Props {
  selected: number;
  onChange: (score: number) => void;
}

export default function MoodSelector({ selected, onChange }: Props) {
  return (
    <div className="mood-selector">
      <p className="mood-label">How are you feeling right now?</p>
      <div className="mood-options">
        {MOODS.map((mood) => (
          <button
            key={mood.score}
            className={`mood-btn ${selected === mood.score ? "mood-selected" : ""}`}
            onClick={() => onChange(mood.score)}
            title={mood.label}
            type="button"
          >
            <span className="mood-emoji">{mood.emoji}</span>
            <span className="mood-text">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
