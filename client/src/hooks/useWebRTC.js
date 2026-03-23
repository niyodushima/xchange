import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SIGNALING_URL =
  process.env.REACT_APP_SIGNALING_URL || "https://zazza-backend.onrender.com";

const iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  // Add TURN for reliability if needed:
  // { urls: "turn:your-turn-server", username: "user", credential: "pass" }
];

export function useWebRTC(username = "Guest") {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);

  const [remoteStream, setRemoteStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [partnerId, setPartnerId] = useState(null);

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

  const createPeerConnection = (partnerId, stream) => {
    const pc = new RTCPeerConnection({ iceServers });

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    pc.ontrack = (event) => {
      console.log("✅ Remote track received:", event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", {
          to: partnerId,
          candidate: event.candidate,
        });
      }
    };

    pcRef.current = pc;
    return pc;
  };

  useEffect(() => {
    const socket = io(SIGNALING_URL, { path: "/socket.io" });
    socketRef.current = socket;

    startLocalVideo();

    // ✅ Request a match immediately
    socket.emit("find-match", { name: username });

    // ✅ Matched with partner and role
    socket.on("matched", async ({ partnerId, role }) => {
      console.log("Matched with partner:", partnerId, "Role:", role);
      setPartnerId(partnerId);
      const stream = await startLocalVideo();
      const pc = createPeerConnection(partnerId, stream);

      if (role === "offerer") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { to: partnerId, offer });
      }
    });

    socket.on("offer", async ({ from, offer }) => {
      console.log("📩 Received offer from", from);
      setPartnerId(from);
      const stream = await startLocalVideo();
      const pc = createPeerConnection(from, stream);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    });

    socket.on("answer", async ({ from, answer }) => {
      console.log("📩 Received answer from", from);
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on("ice-candidate", async ({ from, candidate }) => {
      console.log("📩 Received ICE candidate");
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate", err);
        }
      }
    });

    // ✅ Chat
    socket.on("chat-message", (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.disconnect();
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [username]);

  // ✅ Helpers
  const sendChatMessage = (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed || !partnerId) return;
    const msg = { user: username, text: trimmed, timestamp: Date.now(), partnerId };
    socketRef.current?.emit("chat-message", msg);
  };

  const sendReaction = (emoji) => {
    if (!partnerId) return;
    const reaction = { user: username, emoji, timestamp: Date.now(), partnerId };
    socketRef.current?.emit("reaction", reaction);
  };

  const nextMatch = () => {
    // End current call and request a new match
    pcRef.current?.close();
    pcRef.current = null;
    setRemoteStream(null);
    setMessages([]);
    socketRef.current?.emit("find-match", { name: username });
  };

  return {
    localVideoRef,
    remoteStream,
    messages,
    sendChatMessage,
    sendReaction,
    nextMatch,
  };
}
