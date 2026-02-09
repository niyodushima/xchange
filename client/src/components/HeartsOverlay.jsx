import React, { useState } from "react";
import "./HeartsOverlay.css";

export default function HeartsOverlay({ onHeart }) {
  const [hearts, setHearts] = useState([]);

  const triggerHeart = () => {
    const id = Date.now();
    setHearts((prev) => [...prev, id]);
    onHeart?.();

    // Remove after animation
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h !== id));
    }, 2000);
  };

  return (
    <div className="hearts-overlay">
      <button className="heart-button" onClick={triggerHeart}>❤️</button>
      {hearts.map((id) => (
        <span key={id} className="heart-float">❤️</span>
      ))}
    </div>
  );
}
