import React, { useEffect, useState, useCallback } from "react";
import "./HeartsOverlay.css";

export default function HeartsOverlay({ onHeart, incomingReactions = [] }) {
  const [hearts, setHearts] = useState([]);

  // ✅ Stable triggerHeart function
  const triggerHeart = useCallback(
    (emoji = "❤️") => {
      const id = Date.now() + Math.random();
      setHearts((prev) => [...prev, { id, emoji }]);
      if (onHeart) onHeart(emoji);
      // Remove after animation
      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== id));
      }, 3000);
    },
    [onHeart]
  );

  // Listen for keyboard shortcut (optional)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "h") triggerHeart("❤️");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [triggerHeart]);

  // ✅ Trigger hearts when incoming reactions arrive
  useEffect(() => {
    if (incomingReactions.length > 0) {
      const latest = incomingReactions[incomingReactions.length - 1];
      triggerHeart(latest.emoji);
    }
  }, [incomingReactions, triggerHeart]);

  return (
    <div className="hearts-overlay">
      <button className="heart-button" onClick={() => triggerHeart("❤️")}>
        ❤️
      </button>
      {hearts.map((h) => (
        <span key={h.id} className="heart" style={{ animationDuration: "3s" }}>
          {h.emoji}
        </span>
      ))}
    </div>
  );
}
