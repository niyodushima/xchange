import React, { useEffect } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import ChatPanel from "./ChatPanel";
import HeartsOverlay from "./HeartsOverlay";
import "./VideoChat.css";

export default function BroadcastViewer({ username = "Viewer" }) {
  const {
    localVideoRef,
    remoteStreams,   // ✅ array of remote streams
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
    // Viewer joins the demo room once
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

        {/* Render all remote participants */}
        <div className="vc-remote-grid">
          {remoteStreams.map((stream) => (
            <div key={stream.id} className="vc-video">
              <video
                autoPlay
                playsInline
                muted   // keep muted for autoplay
                ref={(el) => {
                  if (el) el.srcObject = stream;
                }}
                onLoadedMetadata={() =>
                  console.log("Remote video loaded (viewer)")
                }
                onPlay={() => console.log("Remote video playing (viewer)")}
              />
              <audio
                autoPlay
                playsInline
                controls={false}
                ref={(el) => {
                  if (el) el.srcObject = stream;
                }}
                onLoadedMetadata={() =>
                  console.log("Remote audio loaded (viewer)")
                }
                onPlay={() => console.log("Remote audio playing (viewer)")}
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
