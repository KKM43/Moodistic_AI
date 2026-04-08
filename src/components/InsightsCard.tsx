interface Props {
  insights: string;
  loading: boolean;
}

export default function InsightsCard({ insights, loading }: Props) {
  return (
    <div className="insights-card">
      <h3 className="section-heading">Your patterns</h3>

      {loading ? (
        <p className="insights-loading">Looking for patterns...</p>
      ) : insights ? (
        <p className="insights-text">{insights}</p>
      ) : (
        <p className="insights-empty">
          Start journaling to see your patterns 🌱
        </p>
      )}
    </div>
  );
}
