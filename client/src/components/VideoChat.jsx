import React, { useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import ChatPanel from "./ChatPanel";
import HeartsOverlay from "./HeartsOverlay";
import "./VideoChat.css";

export default function VideoChat({ username = "Guest" }) {
  const {
    localVideoRef,
    remoteStreams,
    messages,
    sendChatMessage,
    viewerCount,
    sendReaction,
  } = useWebRTC(username);

  const [roomInput, setRoomInput] = useState("");

  return (
    <div className="vc-stage">
      <div className="vc-controls">
        {/* Room input removed if everyone joins instantly */}
        <input
          type="text"
          placeholder="Room (optional)"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
        />
      </div>

      <div className="vc-videos">
        {/* Local video */}
        <div className="vc-video">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <span className="vc-label">Me</span>
        </div>

        {/* Remote videos */}
        {remoteStreams.map((stream, idx) => (
          <div className="vc-video" key={stream.id || idx}>
            <video
              autoPlay
              playsInline
              ref={(videoEl) => {
                if (videoEl) videoEl.srcObject = stream;
              }}
            />
            <span className="vc-label">Remote {idx + 1}</span>
            <HeartsOverlay onHeart={sendReaction} />
          </div>
        ))}
      </div>

      <div className="vc-stats">
        <span>👥 {viewerCount} viewers</span>
      </div>

      <ChatPanel
        messages={messages}
        sendMessage={sendChatMessage}
        username={username}
      />
    </div>
  );
}
