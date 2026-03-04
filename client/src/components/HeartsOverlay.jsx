import React, { useEffect, useState } from "react";
import "./HeartsOverlay.css";

export default function HeartsOverlay({ onHeart }) {
  const [hearts, setHearts] = useState([]);

  // Add a new heart when user clicks
  const triggerHeart = (emoji = "❤️") => {
    const id = Date.now();
    setHearts((prev) => [...prev, { id, emoji }]);
    if (onHeart) onHeart(emoji);
    // Remove after animation
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 3000);
  };

  // Listen for keyboard shortcut (optional)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "h") triggerHeart("❤️");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

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
