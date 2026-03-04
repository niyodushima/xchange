import React, { useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import HeartsOverlay from "./HeartsOverlay";
import "./VideoChat.css";

export default function VideoChat({ username = "Guest" }) {
  const [gender, setGender] = useState("male");
  const [preference, setPreference] = useState("any");
  const [isFading, setIsFading] = useState(false);

  const { localVideoRef, remoteStream, sendReaction, nextMatch, reactions, partnerMeta } =
    useWebRTC(username, gender, preference);

  const handleNext = () => {
    setIsFading(true);
    setTimeout(() => {
      nextMatch();
      setIsFading(false);
    }, 600); // matches CSS fadeOut duration
  };

  return (
    <div className="vc-stage">
      <div className={`vc-videos ${isFading ? "fade-out" : ""}`}>
        <div className="vc-video">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <span className="vc-label">Me ({gender})</span>
        </div>

        {remoteStream && (
          <div className="vc-video">
            <video
              autoPlay
              playsInline
              ref={(videoEl) => {
                if (videoEl) videoEl.srcObject = remoteStream;
              }}
            />
            <span className="vc-label">
              Partner {partnerMeta?.name ? `(${partnerMeta.gender})` : ""}
            </span>
            <HeartsOverlay onHeart={sendReaction} incomingReactions={reactions} />
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
          <select value={preference} onChange={(e) => setPreference(e.target.value)}>
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <button className="primary" onClick={handleNext}>🔄 Next</button>
      </div>
    </div>
  );
}
