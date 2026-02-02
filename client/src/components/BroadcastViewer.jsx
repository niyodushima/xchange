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

  useEffect(() => {
    // Join the demo room on mount
    joinRoom("demo-room");
  }, [joinRoom]);

  return (
    <div className="vc-stage">
      <div className="vc-videos">
        {/* Local camera */}
        <div className="vc-video">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <div className="vc-label">🎥 {username} (You)</div>
        </div>

        {/* Remote host camera */}
        <div className="vc-video">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted   // ✅ ensures autoplay works without user gesture
            onLoadedMetadata={() => console.log("Remote video loaded (viewer)")}
            onPlay={() => console.log("Remote video playing (viewer)")}
          />
          <div className="vc-label">
            {callActive ? "Host live" : "Waiting for host…"}
          </div>
          <HeartsOverlay onHeart={sendHeart} />
        </div>
      </div>

      <div className="vc-controls">
        <button onClick={callActive ? endCall : startCall} className="primary">
          {callActive ? "Leave" : "Join Live"}
        </button>
        <div className="vc-stats">⏱ {formattedTime()} • 👥 {viewerCount}</div>
      </div>

      <ChatPanel
        messages={messages}
        sendMessage={sendChatMessage}
        username={username}
      />
    </div>
  );
}
