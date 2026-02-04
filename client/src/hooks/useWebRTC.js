import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SIGNALING_URL =
  process.env.REACT_APP_SIGNALING_URL || "https://zazza-backend.onrender.com";

const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

export function useWebRTC(role = "viewer", username = "Guest") {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const pendingCandidates = useRef([]);

  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [callActive, setCallActive] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // ✅ Array of remote streams
  const [remoteStreams, setRemoteStreams] = useState([]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers });

    pc.ontrack = (event) => {
      console.log("Remote track received:", event.track.kind);
      const stream = event.streams[0];

      setRemoteStreams((prev) => {
        const exists = prev.find((s) => s.id === stream.id);
        if (exists) {
          return prev.map((s) => (s.id === stream.id ? stream : s));
        }
        return [...prev, stream];
      });
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
        const senders = pcRef.current.getSenders().map((s) => s.track);
        localStreamRef.current.getTracks().forEach((track) => {
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
        stream.getTracks().forEach((track) => {
          pcRef.current.addTrack(track, stream);
          console.log("Adding track:", track.kind);
        });
      }
      return stream;
    } catch (err) {
      console.error("Media access failed:", err);
      alert("Media access failed: " + err.message);
      return null;
    }
  };

  useEffect(() => {
    const socket = io(SIGNALING_URL, { path: "/socket.io" });
    socketRef.current = socket;

    socket.on("room-joined", async ({ roomId: joined }) => {
      setRoomId(joined);
      if (!pcRef.current) pcRef.current = createPeerConnection();
      if (role === "host") await startLocalVideoIfNotStarted();
    });

    socket.on("offer", async (offer) => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      pcRef.current = createPeerConnection();

      if (role === "viewer") await startLocalVideoIfNotStarted();

      await pcRef.current.setRemoteDescription(offer);

      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer });
      setCallActive(true);

      pendingCandidates.current.forEach(async (c) => {
        try { await pcRef.current.addIceCandidate(c); } catch {}
      });
      pendingCandidates.current = [];
    });

    socket.on("answer", async (answer) => {
      if (pcRef.current && pcRef.current.signalingState === "have-local-offer") {
        await pcRef.current.setRemoteDescription(answer);
        setCallActive(true);
      }
    });

    socket.on("ice-candidate", async (candidate) => {
      if (pcRef.current) {
        if (pcRef.current.remoteDescription) {
          try { await pcRef.current.addIceCandidate(candidate); } catch {}
        } else {
          pendingCandidates.current.push(candidate);
        }
      }
    });

    socket.on("chat-message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("viewer-count", (count) => setViewerCount(count));
    socket.on("session-time", (seconds) => {
      if (role !== "host") setSecondsElapsed(seconds);
    });

    return () => {
      socket.disconnect();
    };
  }, [role, roomId, createPeerConnection]);

  // ✅ Define helpers
  const joinRoom = async (targetRoomId) => {
    if (!targetRoomId) return;
    socketRef.current?.emit("join-room", { roomId: targetRoomId, role, name: username });
    setRoomId(targetRoomId);
    if (!pcRef.current) pcRef.current = createPeerConnection();
    if (role === "host") await startLocalVideoIfNotStarted();
  };

  const startCall = async () => {
    if (!roomId || callActive) return;
    if (pcRef.current) { try { pcRef.current.close(); } catch {}; pcRef.current = null; }
    pcRef.current = createPeerConnection();

    await startLocalVideoIfNotStarted();

    const offer = await pcRef.current.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pcRef.current.setLocalDescription(offer);
    socketRef.current?.emit("offer", { roomId, offer });
    setCallActive(true);
    setSecondsElapsed(0);
  };

  const endCall = () => {
    setCallActive(false);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setRemoteStreams([]);

    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    pendingCandidates.current = [];
  };

  const sendChatMessage = (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed || !roomId) return;
    const msg = { roomId, user: username, text: trimmed, timestamp: Date.now() };
    socketRef.current?.emit("chat-message", msg);
  };

  const sendHeart = () => {
    if (!roomId) return;
    socketRef.current?.emit("heart", { roomId });
  };

  const formattedTime = () => {
    const m = Math.floor(secondsElapsed / 60).toString().padStart(2, "0");
    const s = (secondsElapsed % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ✅ Return everything
  return {
    localVideoRef,
    remoteStreams,   // array of remote streams
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
