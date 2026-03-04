import React, { useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import HeartsOverlay from "./HeartsOverlay";
import "./VideoChat.css";

export default function VideoChat({ username = "Guest" }) {
  const [gender, setGender] = useState("male");
  const [preference, setPreference] = useState("any");
  const [isFading, setIsFading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Searching for next partner…");

  const {
    localVideoRef,
    remoteStream,
    sendReaction,
    nextMatch,
    reactions,
    partnerMeta,
  } = useWebRTC(username, gender, preference);

  const taglines = [
    "Finding your next vibe…",
    "Connecting you to explorers…",
    "Searching for a new smile…",
    "Matching you with fresh energy…",
    "Looking for your next spark…",
    "Discovering someone new…",
  ];

  const handleNext = () => {
    const randomTagline = taglines[Math.floor(Math.random() * taglines.length)];
    setLoadingMessage(randomTagline);

    setIsFading(true);
    setTimeout(() => {
      nextMatch();
      setIsFading(false);
    }, 600);
  };

  return (
    <div className="vc-stage">
      <div className={`vc-videos ${isFading ? "fade-out" : ""}`}>
        {/* Local camera */}
        <div className="vc-video">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <span className="vc-label">Me ({gender})</span>
        </div>

        {/* Partner camera */}
        {remoteStream ? (
          <div className="vc-video">
            <video
              autoPlay
              playsInline
              ref={(videoEl) => {
                if (videoEl && remoteStream) videoEl.srcObject = remoteStream;
              }}
            />
            <span className="vc-label">
              Partner {partnerMeta?.name ? `(${partnerMeta.gender})` : ""}
            </span>
            <HeartsOverlay onHeart={sendReaction} incomingReactions={reactions} />
          </div>
        ) : (
          <div className="vc-video">
            <span className="vc-label">Waiting for partner…</span>
          </div>
        )}

        {/* Loading overlay during fade-out */}
        {isFading && (
          <div className="vc-loading">
            <div className="spinner"></div>
            {loadingMessage}
          </div>
        )}
      </div>

      <div className="vc-controls">
        <label>
          I am:
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label>
          Match with:
          <select
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
          >
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <button className="primary" onClick={handleNext}>
          🔄 Next
        </button>
      </div>
    </div>
  );
}
