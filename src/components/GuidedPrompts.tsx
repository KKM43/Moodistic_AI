import { useState } from "react";
import { getRandomPrompts } from "../lib/prompts";

interface Props {
  onDismiss?: () => void;
}

export default function GuidedPrompts({ onDismiss }: Props) {
  const [prompts] = useState(() => getRandomPrompts(3));
  const [selected, setSelected] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const handleSelect = (prompt: string) => {
    setSelected(prompt);
    setVisible(false);
  };

  const handleDismiss = () => {
    setSelected(null);
    onDismiss?.();
  };

  return (
    <div className="prompts-wrap">
      {selected && (
        <div className="prompt-inspiration animate-in">
          <span className="inspiration-label">💭 Reflect on this</span>
          <p className="inspiration-text">"{selected}"</p>
          <button className="inspiration-dismiss" onClick={handleDismiss}>
            ✕ dismiss
          </button>
        </div>
      )}

      {!selected && (
        <button
          className="prompts-toggle"
          onClick={() => setVisible((prev) => !prev)}
        >
          {visible ? "✕ hide" : "💭 not sure what to write?"}
        </button>
      )}

      {visible && !selected && (
        <div className="prompts-list animate-in">
          <p className="prompts-hint">
            Pick one to reflect on — then write whatever comes to mind:
          </p>
          {prompts.map((prompt, i) => (
            <button
              key={i}
              className="prompt-item"
              onClick={() => handleSelect(prompt)}
            >
              <span className="prompt-arrow">→</span>
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
