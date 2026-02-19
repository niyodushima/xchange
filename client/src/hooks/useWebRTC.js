import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SIGNALING_URL =
  process.env.REACT_APP_SIGNALING_URL || "https://zazza-backend.onrender.com";

const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

export function useWebRTC(username = "Guest") {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef({}); // ✅ multiple peer connections

  const [remoteStreams, setRemoteStreams] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);

  // ✅ Start local video immediately
  const startLocalVideo = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("Media access failed:", err);
      alert("Media access failed: " + err.message);
      return null;
    }
  };

  // ✅ Create peer connection for each user
  const createPeerConnection = (userId, stream) => {
    const pc = new RTCPeerConnection({ iceServers });

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => {
        if (!prev.find((s) => s.id === remoteStream.id)) {
          return [...prev, remoteStream];
        }
        return prev;
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", {
          to: userId,
          candidate: event.candidate,
        });
      }
    };

    peersRef.current[userId] = pc;
    return pc;
  };

  useEffect(() => {
    const socket = io(SIGNALING_URL, { path: "/socket.io" });
    socketRef.current = socket;

    // ✅ Start local video immediately on mount
    startLocalVideo();

    // ✅ Everyone joins instantly into "main-room"
    socket.emit("join-room", { roomId: "main-room", name: username });

    // ✅ New user joined
    socket.on("user-joined", async (userId) => {
      const stream = await startLocalVideo();
      const pc = createPeerConnection(userId, stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { to: userId, offer });
    });

    // ✅ Handle incoming offer
    socket.on("offer", async ({ from, offer }) => {
      const stream = await startLocalVideo();
      const pc = createPeerConnection(from, stream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    });

    // ✅ Handle incoming answer
    socket.on("answer", async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // ✅ Handle ICE candidates
    socket.on("ice-candidate", async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate", err);
        }
      }
    });

    // ✅ Chat + reactions
    socket.on("chat-message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("reaction", (reaction) =>
      setReactions((prev) => [...prev, reaction])
    );

    socket.on("viewer-count", (count) => setViewerCount(count));

    return () => {
      socket.disconnect();
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
    };
  }, [username]);

  // ✅ Helpers
  const sendChatMessage = (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    const msg = { user: username, text: trimmed, timestamp: Date.now() };
    socketRef.current?.emit("chat-message", msg);
  };

  const sendReaction = (emoji) => {
    const reaction = { user: username, emoji, timestamp: Date.now() };
    socketRef.current?.emit("reaction", reaction);
    setReactions((prev) => [...prev, reaction]);
  };

  return {
    localVideoRef,
    remoteStreams,
    messages,
    reactions,
    sendChatMessage,
    sendReaction,
    viewerCount,
  };
}
