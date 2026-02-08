import React, { useEffect } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import ChatPanel from "./ChatPanel";
import HeartsOverlay from "./HeartsOverlay";
import "./VideoChat.css";

export default function BroadcastViewer({ username = "Viewer" }) {
  const {
    localVideoRef,
    remoteStreams,
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
    joinRoom("demo-room");
  }, [joinRoom]);

  return (
    <div className="vc-stage">
      <div className="vc-videos">
        {/* Local camera (optional for viewer) */}
        <div className="vc-video">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <div className="vc-label">🎥 {username} (You)</div>
        </div>

        {/* Remote participants */}
        <div className="vc-remote-grid">
          {remoteStreams.map((stream) => (
            <div key={stream.id} className="vc-video">
              <video
                autoPlay
                playsInline
                ref={(el) => {
                  if (el) el.srcObject = stream;
                }}
              />
              <div className="vc-label">Participant</div>
              <HeartsOverlay onHeart={sendHeart} />
            </div>
          ))}
        </div>
      </div>

      <div className="vc-controls">
        <button onClick={callActive ? endCall : startCall} className="primary">
          {callActive ? "Leave" : "Join Live"}
        </button>
        <div className="vc-stats">
          ⏱ {formattedTime()} • 👥 {viewerCount}
        </div>
      </div>

      <ChatPanel
        messages={messages}
        sendMessage={sendChatMessage}
        username={username}
      />
    </div>
  );
}
