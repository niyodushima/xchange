import React, { useEffect, useState, useCallback } from "react";
import "./HeartsOverlay.css";

export default function HeartsOverlay({ onHeart, incomingReactions = [] }) {
  const [hearts, setHearts] = useState([]);

  // Trigger a local reaction (emoji floats up + send to partner)
  const triggerHeart = useCallback(
    (emoji = "❤️") => {
      const id = Date.now() + Math.random();
      setHearts((prev) => [...prev, { id, emoji }]);

      // Send to partner
      if (onHeart) onHeart(emoji);

      // Remove after animation ends
      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== id));
      }, 3000);
    },
    [onHeart]
  );

  // Handle incoming reactions from partner
  useEffect(() => {
    if (incomingReactions.length > 0) {
      const latest = incomingReactions[incomingReactions.length - 1];
      triggerHeart(latest.emoji);
    }
  }, [incomingReactions, triggerHeart]);

  return (
    <div className="hearts-overlay">
      {/* Reaction buttons */}
      <div className="reaction-buttons">
        <button onClick={() => triggerHeart("❤️")}>❤️</button>
        <button onClick={() => triggerHeart("😂")}>😂</button>
        <button onClick={() => triggerHeart("🔥")}>🔥</button>
        <button onClick={() => triggerHeart("👍")}>👍</button>
      </div>

      {/* Floating emoji animations */}
      {hearts.map((h) => (
        <span key={h.id} className="heart">
          {h.emoji}
        </span>
      ))}
    </div>
  );
}
