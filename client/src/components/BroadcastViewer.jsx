import React, { useEffect } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import ChatPanel from "./ChatPanel";
import HeartsOverlay from "./HeartsOverlay";
import "./VideoChat.css";

export default function BroadcastViewer({ username = "Viewer" }) {
  const {
    localVideoRef,
    remoteVideoRef,
    messages,
    sendChatMessage,
    callActive,
    joinRoom,
    viewerCount,
    formattedTime,
    sendHeart,
    startCall,
    endCall,
  } = useWebRTC("viewer", username);

  // Auto‑join the demo room when component mounts
  useEffect(() => {
    joinRoom("demo-room");
  }, [joinRoom]);

  return (
    <div className="vc-stage">
      {/* Video tiles */}
      <div className="vc-videos">
        {/* Local viewer video */}
        <div className="vc-video">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <div className="vc-label">🎥 {username} (You)</div>
        </div>

        {/* Remote host video */}
        <div className="vc-video">
          <video ref={remoteVideoRef} autoPlay playsInline />
          <div className="vc-label">
            {callActive ? "Host live" : "Waiting for host…"}
          </div>
          <HeartsOverlay onHeart={sendHeart} />
        </div>
      </div>

      {/* Controls */}
      <div className="vc-controls">
        <button
          onClick={callActive ? endCall : startCall}
          className="primary"
        >
          {callActive ? "Leave" : "Join Live"}
        </button>
        <div className="vc-stats">
          ⏱ {formattedTime()} • 👥 {viewerCount}
        </div>
      </div>

      {/* Chat panel */}
      <ChatPanel
        messages={messages}
        sendMessage={sendChatMessage}
        username={username}
      />
    </div>
  );
}
