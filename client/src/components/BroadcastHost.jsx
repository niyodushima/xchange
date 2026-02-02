import React, { useEffect } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import ChatPanel from "./ChatPanel";
import HeartsOverlay from "./HeartsOverlay";
import "./VideoChat.css";

export default function BroadcastHost({ username = "Host" }) {
  const {
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    messages,
    sendChatMessage,
    callActive,
    formattedTime,
    joinRoom,
    startCall,
    endCall,
    viewerCount,
    sendHeart,
  } = useWebRTC("host", username);

  useEffect(() => {
    // Host joins the demo room once
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

        {/* Remote viewer camera */}
        <div className="vc-video">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => console.log("Remote video loaded (host)")}
            onPlay={() => console.log("Remote video playing (host)")}
          />
          {/* ✅ Remote audio element */}
          <audio ref={remoteAudioRef} autoPlay playsInline controls={false} onLoadedMetadata={() => console.log("Remote audio loaded (host)")}
            onPlay={() => console.log("Remote audio playing (host)")}
          />
          <div className="vc-label">
            {callActive ? "Viewer connected" : "Waiting for viewer…"}
          </div>
          <HeartsOverlay onHeart={sendHeart} />
        </div>
      </div>

      <div className="vc-controls">
        <button onClick={callActive ? endCall : startCall} className="primary">
          {callActive ? "End Call" : "Start Call"}
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
