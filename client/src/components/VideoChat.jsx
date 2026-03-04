import React, { useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import HeartsOverlay from "./HeartsOverlay";
import "./VideoChat.css";

export default function VideoChat({ username = "Guest" }) {
  const { localVideoRef, remoteStream, sendReaction, nextMatch, reactions } = useWebRTC(username);
  const [filter, setFilter] = useState("none");

  return (
    <div className="vc-stage">
      <div className="vc-videos">
        <div className="vc-video">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ filter }}
          />
          <span className="vc-label">Me</span>
        </div>

        {remoteStream && (
          <div className="vc-video">
            <video
              autoPlay
              playsInline
              style={{ filter }}
              ref={(videoEl) => {
                if (videoEl) videoEl.srcObject = remoteStream;
              }}
            />
            <span className="vc-label">Partner</span>
            <HeartsOverlay onHeart={sendReaction} incomingReactions={reactions} />
          </div>
        )}
      </div>

      <div className="vc-controls">
        <button className="primary" onClick={nextMatch}>🔄 Next</button>
        <select onChange={(e) => setFilter(e.target.value)} value={filter}>
          <option value="none">No Filter</option>
          <option value="grayscale(100%)">Grayscale</option>
          <option value="sepia(80%)">Sepia</option>
          <option value="contrast(1.5)">High Contrast</option>
          <option value="hue-rotate(90deg)">Hue Rotate</option>
          <option value="brightness(1.2)">Bright</option>
        </select>
      </div>
    </div>
  );
}
