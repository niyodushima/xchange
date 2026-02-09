import React, { useState } from "react";
import "./ReactionsOverlay.css";

const EMOJIS = ["❤️", "👏", "🎉", "😂", "😍"];

export default function ReactionsOverlay({ onReact }) {
  const [reactions, setReactions] = useState([]);

  const triggerReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setReactions((prev) => [...prev, { id, emoji }]);
    onReact?.(emoji);

    // Remove after animation
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  return (
    <div className="reactions-overlay">
      <div className="reaction-buttons">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="reaction-button"
            onClick={() => triggerReaction(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>

      {reactions.map((r) => (
        <span key={r.id} className="reaction-float">{r.emoji}</span>
      ))}
    </div>
  );
}
