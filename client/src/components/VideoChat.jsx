import React from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import ChatPanel from "./ChatPanel";
import HeartsOverlay from "./HeartsOverlay";
import "./VideoChat.css";

export default function VideoChat({ username = "Guest" }) {
  const {
    localVideoRef,
    remoteStream,
    messages,
    sendChatMessage,
    sendReaction,
    nextMatch,
  } = useWebRTC(username);

  return (
    <div className="vc-stage">
      <div className="vc-controls">
        <button className="primary" onClick={nextMatch}>
          🔄 Next
        </button>
      </div>

      <div className="vc-videos">
        <div className="vc-video">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <span className="vc-label">Me</span>
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
            <span className="vc-label">Partner</span>
            <HeartsOverlay onHeart={sendReaction} />
          </div>
        )}
      </div>

      <ChatPanel
        messages={messages}
        sendMessage={sendChatMessage}
        username={username}
      />
    </div>
  );
}
