import React, { useEffect } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import ChatPanel from "./ChatPanel";
import HeartsOverlay from "./HeartsOverlay";
import "./VideoChat.css";

export default function BroadcastHost({ username = "Host" }) {
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
  } = useWebRTC("host", username);

  useEffect(() => {
    // Host joins the demo room once
    joinRoom("demo-room");
  }, [joinRoom]);

  return (
    <div className="vc-stage">
      <div className="vc-videos">
        {/* Host camera */}
        <div className="vc-video">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <div className="vc-label">🎥 {username} (Host)</div>
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
                  console.log("Remote video loaded (host)")
                }
                onPlay={() => console.log("Remote video playing (host)")}
              />
              <audio
                autoPlay
                playsInline
                controls={false}
                ref={(el) => {
                  if (el) el.srcObject = stream;
                }}
                onLoadedMetadata={() =>
                  console.log("Remote audio loaded (host)")
                }
                onPlay={() => console.log("Remote audio playing (host)")}
              />
              <div className="vc-label">Viewer</div>
              <HeartsOverlay onHeart={sendHeart} />
            </div>
          ))}
        </div>
      </div>

      <div className="vc-controls">
        <button onClick={callActive ? endCall : startCall} className="primary">
          {callActive ? "End Call" : "Start Call"}
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
