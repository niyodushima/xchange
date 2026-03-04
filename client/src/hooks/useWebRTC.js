import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SIGNALING_URL = process.env.REACT_APP_SIGNALING_URL || "http://localhost:4000";
const iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  // Add TURN for reliability if needed:
  // { urls: "turn:your-turn-server", username: "user", credential: "pass" }
];

export function useWebRTC(username = "Guest", gender = "male", preference = "any") {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);

  const [remoteStream, setRemoteStream] = useState(null);
  const [partnerMeta, setPartnerMeta] = useState(null);
  const [reactions, setReactions] = useState([]);

  const startLocalVideo = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const createPeerConnection = (partnerId, stream) => {
    const pc = new RTCPeerConnection({ iceServers });
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      console.log("Remote track received:", event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", { to: partnerId, candidate: event.candidate });
      }
    };

    pcRef.current = pc;
    return pc;
  };

  useEffect(() => {
    const socket = io(SIGNALING_URL, { path: "/socket.io" });
    socketRef.current = socket;
    startLocalVideo();

    socket.emit("find-match", { name: username, gender, preference });

    socket.on("matched", async ({ partnerId, role, partnerMeta }) => {
      setPartnerMeta(partnerMeta);
      const stream = await startLocalVideo();
      const pc = createPeerConnection(partnerId, stream);
      if (role === "offerer") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { to: partnerId, offer });
      }
    });

    socket.on("offer", async ({ from, offer }) => {
      console.log("Received offer from", from);
      const stream = await startLocalVideo();
      const pc = createPeerConnection(from, stream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    });

    socket.on("answer", async ({ from, answer }) => {
      console.log("Received answer from", from);
      if (pcRef.current?.signalingState === "have-local-offer") {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      console.log("Received ICE candidate");
      if (pcRef.current) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on("reaction", (reaction) => setReactions((prev) => [...prev, reaction]));

    return () => {
      socket.disconnect();
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [username, gender, preference]);

  const sendReaction = (emoji) => {
    if (!partnerMeta) return;
    const reaction = { user: username, emoji, timestamp: Date.now(), partnerId: partnerMeta.id };
    socketRef.current.emit("reaction", reaction);
  };

  const nextMatch = () => {
    pcRef.current?.close();
    pcRef.current = null;
    setRemoteStream(null);
    setReactions([]);
    socketRef.current.emit("find-match", { name: username, gender, preference });
  };

  return { localVideoRef, remoteStream, sendReaction, nextMatch, reactions, partnerMeta };
}
