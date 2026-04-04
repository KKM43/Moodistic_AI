import { useState, useEffect } from "react";

type BreathPhase = "inhale" | "hold" | "exhale" | "rest";

interface Phase {
  label: string;
  duration: number;
  instruction: string;
}

const PHASES: Record<BreathPhase, Phase> = {
  inhale: {
    label: "Breathe In",
    duration: 4,
    instruction: "Slowly in through your nose",
  },
  hold: { label: "Hold", duration: 7, instruction: "Hold gently — no tension" },
  exhale: {
    label: "Breathe Out",
    duration: 8,
    instruction: "Slowly out through your mouth",
  },
  rest: { label: "Rest", duration: 1, instruction: "Just rest" },
};

const PHASE_ORDER: BreathPhase[] = ["inhale", "hold", "exhale", "rest"];

type View = "acknowledge" | "breathing" | "help";

export default function CrisisSupport() {
  const [view, setView] = useState<View>("acknowledge");
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [countdown, setCountdown] = useState(PHASES.inhale.duration);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (view !== "breathing") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setPhase((currentPhase) => {
            const currentIndex = PHASE_ORDER.indexOf(currentPhase);
            const nextIndex = (currentIndex + 1) % PHASE_ORDER.length;
            const nextPhase = PHASE_ORDER[nextIndex];
            if (nextPhase === "inhale") setCycles((c) => c + 1);
            setCountdown(PHASES[nextPhase].duration);
            return nextPhase;
          });
          return PHASES[phase].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [view, phase]);

  const circleScale = phase === "inhale" || phase === "hold" ? 1.4 : 1.0;
  const circleColor =
    phase === "inhale" || phase === "hold" ? "#667eea" : "#68d391";

  return (
    <div className="crisis-card">
      {view === "acknowledge" && (
        <div className="animate-in">
          <div className="crisis-header">
            <span className="crisis-icon">💙</span>
            <div>
              <h3 className="crisis-title">I hear you</h3>
            </div>
          </div>

          <p className="crisis-message">
            What you just wrote took courage. You don't have to carry this alone
            — and you don't have to figure out what to do next right now. Just
            pick what feels right in this moment.
          </p>

          <div className="crisis-choices">
            <button
              className="crisis-choice-btn choice-breathe"
              onClick={() => setView("breathing")}
            >
              <span className="choice-icon">🌬️</span>
              <div>
                <p className="choice-title">Help me calm down first</p>
                <p className="choice-sub">A short breathing exercise</p>
              </div>
            </button>

            <button
              className="crisis-choice-btn choice-help"
              onClick={() => setView("help")}
            >
              <span className="choice-icon">🤝</span>
              <div>
                <p className="choice-title">I need to talk to someone</p>
                <p className="choice-sub">Free helplines, available now</p>
              </div>
            </button>
          </div>

          <p className="crisis-footer">
            If you're in immediate danger, call <strong>112</strong>.
          </p>
        </div>
      )}

      {view === "breathing" && (
        <div className="animate-in">
          <div className="crisis-header">
            <span className="crisis-icon">🌬️</span>
            <div>
              <h3 className="crisis-title">4 — 7 — 8 breathing</h3>
              <p className="crisis-subtitle">
                Used by therapists worldwide to calm the nervous system
              </p>
            </div>
          </div>

          <div className="breath-container">
            <div
              className="breath-circle"
              style={{
                transform: `scale(${circleScale})`,
                background: circleColor,
                transition: `transform ${PHASES[phase].duration}s ease-in-out, background 0.5s ease`,
              }}
            />
            <div className="breath-label-wrap">
              <p className="breath-phase">{PHASES[phase].label}</p>
              <p className="breath-count">{countdown}</p>
            </div>
          </div>

          <p className="breath-instruction">{PHASES[phase].instruction}</p>

          {cycles > 0 && (
            <p className="breath-cycles">
              {cycles} {cycles === 1 ? "cycle" : "cycles"} — you're doing great
            </p>
          )}

          <div className="breath-actions">
            <button className="breath-help-btn" onClick={() => setView("help")}>
              I still need to talk to someone →
            </button>
          </div>

          <button
            className="btn-ghost"
            style={{ marginTop: "8px", fontSize: "12px" }}
            onClick={() => setView("acknowledge")}
          >
            ← Back
          </button>
        </div>
      )}

      {view === "help" && (
        <div className="animate-in">
          <div className="crisis-header">
            <span className="crisis-icon">🤝</span>
            <div>
              <h3 className="crisis-title">Real people, right now</h3>
              <p className="crisis-subtitle">
                These are free. Confidential. They've heard it all.
              </p>
            </div>
          </div>

          <div className="crisis-resources">
            <a className="crisis-link primary" href="tel:9152987821">
              📞 iCall India — 9152987821
            </a>

            <a className="crisis-link" href="tel:9999666555">
              📞 Vandrevala Foundation — 9999666555
            </a>

            <a className="crisis-link" href="tel:18005990019">
              📞 Kiran Mental Health Helpline — 1800-599-0019
            </a>

            <a
              className="crisis-link"
              href="https://icallhelpline.org"
              target="_blank"
              rel="noreferrer"
            >
              🌐 icallhelpline.org — Chat support
            </a>
          </div>

          <p className="crisis-footer">
            If you're in immediate danger, call <strong>112</strong> or go to
            your nearest hospital.
          </p>

          <button
            className="btn-ghost"
            style={{ marginTop: "12px", fontSize: "12px" }}
            onClick={() => setView("acknowledge")}
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
