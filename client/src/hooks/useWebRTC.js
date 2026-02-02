import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SIGNALING_URL =
  process.env.REACT_APP_SIGNALING_URL || "https://zazza-backend.onrender.com";

const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

export function useWebRTC(role = "viewer", username = "Guest") {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);   // ✅ audio ref
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const pendingCandidates = useRef([]);

  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [callActive, setCallActive] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers });

    pc.ontrack = (event) => {
      console.log("Remote track received:", event.track.kind);

      const existingTracks = remoteStreamRef.current.getTracks();
      if (!existingTracks.find((t) => t.id === event.track.id)) {
        remoteStreamRef.current.addTrack(event.track);
        console.log("Added new remote track:", event.track.kind);
      }

      // ✅ Bind audio separately
      if (event.track.kind === "audio" && remoteAudioRef.current) {
        const audioStream = new MediaStream([event.track]);
        remoteAudioRef.current.srcObject = audioStream;
        console.log("Bound remote audio to audio element");
      }

      // ✅ Bind video (muted for autoplay)
      if (event.track.kind === "video" && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        console.log("Bound remote video to video element");
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        socketRef.current?.emit("ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    return pc;
  }, [roomId]);

  const startLocalVideoIfNotStarted = async () => {
    if (localStreamRef.current) {
      if (pcRef.current) {
        const senders = pcRef.current.getSenders().map(s => s.track);
        localStreamRef.current.getTracks().forEach(track => {
          if (!senders.includes(track)) {
            pcRef.current.addTrack(track, localStreamRef.current);
            console.log("Adding track:", track.kind);
          }
        });
      }
      return localStreamRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      if (pcRef.current) {
        const senders = pcRef.current.getSenders().map(s => s.track);
        stream.getTracks().forEach(track => {
          if (!senders.includes(track)) {
            pcRef.current.addTrack(track, stream);
            console.log("Adding track:", track.kind);
          }
        });
      }
      return stream;
    } catch (err) {
      console.error("Media access failed:", err);
      alert("Media access failed: " + err.message);
      return null;
    }
  };

  // ... (rest of signaling logic unchanged)
  const sendChatMessage = (text) => { ... }; const sendHeart = () => { ... }; const formattedTime = () => { ... }; const joinRoom = async (targetRoomId) => { ... }; const startCall = async () => { ... }; const endCall = () => { ... };
  return {
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,   // ✅ return audio ref
    messages,
    sendChatMessage,
    callActive,
    formattedTime,
    joinRoom,
    startCall,
    endCall,
    viewerCount,
    sendHeart,
  };
}
