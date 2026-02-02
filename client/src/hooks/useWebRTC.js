import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SIGNALING_URL =
  process.env.REACT_APP_SIGNALING_URL || "https://zazza-backend.onrender.com";

const TURN_URLS = (process.env.REACT_APP_TURN_URLS || "")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);
const TURN_USERNAME = process.env.REACT_APP_TURN_USERNAME || "";
const TURN_CREDENTIAL = process.env.REACT_APP_TURN_CREDENTIAL || "";

const iceServers =
  TURN_URLS.length
    ? [{ urls: TURN_URLS, username: TURN_USERNAME, credential: TURN_CREDENTIAL }]
    : [{ urls: "stun:stun.l.google.com:19302" }];

export function useWebRTC(role = "viewer", username = "Guest") {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
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

  // Host emits time; viewers mirror it.
  useEffect(() => {
    let interval;
    if (callActive && role === "host") {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;
          if (roomId) socketRef.current?.emit("session-time", { roomId, seconds: next });
          return next;
        });
      }, 1000);
    } else if (!callActive) {
      setSecondsElapsed(0);
    }
    return () => clearInterval(interval);
  }, [callActive, role, roomId]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers });

    pc.ontrack = (event) => {
      console.log("Remote track received:", event.track.kind);
      remoteStreamRef.current.addTrack(event.track);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        console.log("ICE candidate:", event.candidate);
        socketRef.current?.emit("ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    return pc;
  }, [roomId]);

  const startLocalVideoIfNotStarted = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      if (pcRef.current) {
        const senders = pcRef.current.getSenders().map((s) => s.track);
        stream.getTracks().forEach((track) => {
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

  useEffect(() => {
    const socket = io(SIGNALING_URL, { path: "/socket.io" });
    socketRef.current = socket;

    const handleChat = (msg) => setMessages((prev) => [...prev, msg]);

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

      await startLocalVideoIfNotStarted();
      await pcRef.current.setRemoteDescription(offer);

      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer });
      setCallActive(true);

      // flush queued ICE
      pendingCandidates.current.forEach(async (c) => {
        try {
          await pcRef.current.addIceCandidate(c);
        } catch (err) {
          console.warn("Bad ICE candidate:", err);
        }
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
          try {
            await pcRef.current.addIceCandidate(candidate);
          } catch (err) {
            console.warn("Bad ICE candidate:", err);
          }
        } else {
          pendingCandidates.current.push(candidate);
        }
      }
    });

    socket.on("chat-message", handleChat);
    socket.on("viewer-count", (count) => setViewerCount(count));
    socket.on("session-time", (seconds) => {
      if (role !== "host") setSecondsElapsed(seconds);
    });

    return () => {
      socket.off("chat-message", handleChat);
      socket.disconnect();
    };
  }, [role, roomId, createPeerConnection]);

  const joinRoom = async (targetRoomId) => {
    if (!targetRoomId) return;
    socketRef.current?.emit("join-room", { roomId: targetRoomId, role, name: username });
    setRoomId(targetRoomId);
    if (!pcRef.current) pcRef.current = createPeerConnection();
    if (role === "host") await startLocalVideoIfNotStarted();
  };

  const startCall = async () => {
    if (!roomId) return;
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pcRef.current = createPeerConnection();

    await startLocalVideoIfNotStarted();

    const offer = await pcRef.current.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pcRef.current.setLocalDescription(offer);
    console.log("Local Description (offer):", pcRef.current.localDescription);
    socketRef.current?.emit("offer", { roomId, offer });
    setCallActive(true);
    setSecondsElapsed(0);
  };

  const endCall = () => {
    setCallActive(false);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    remoteStreamRef.current = new MediaStream();
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

  return {
    localVideoRef,
    remoteVideoRef,
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
    
