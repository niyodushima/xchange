if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (err) {
    console.warn("dotenv not installed in production, skipping...");
  }
}

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("✅ Zazza backend is running");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/socket.io",
});

// In-memory room state
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  socket.on("join-room", ({ roomId, role, name }) => {
    if (!roomId || !role) return;
    socket.join(roomId);

    const existing = rooms.get(roomId) || { host: null, viewers: new Set() };
    if (role === "host") {
      existing.host = socket.id;
    } else {
      existing.viewers.add(socket.id);
    }
    rooms.set(roomId, existing);

    io.to(socket.id).emit("room-joined", { roomId, role });
    io.to(roomId).emit("viewer-count", existing.viewers.size);
  });

  // WebRTC signaling relay
  socket.on("offer", ({ roomId, offer }) => {
    const room = rooms.get(roomId);
    if (!room || !offer) return;

    if (socket.id === room.host) {
      room.viewers.forEach((viewerId) => {
        io.to(viewerId).emit("offer", offer);
      });
    } else {
      if (room.host) io.to(room.host).emit("offer", offer);
    }
  });

  socket.on("answer", ({ roomId, answer }) => {
    const room = rooms.get(roomId);
    if (!room || !answer) return;

    if (socket.id === room.host) {
      room.viewers.forEach((viewerId) => {
        io.to(viewerId).emit("answer", answer);
      });
    } else {
      if (room.host) io.to(room.host).emit("answer", answer);
    }
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    const room = rooms.get(roomId);
    if (!room || !candidate) return;

    if (socket.id === room.host) {
      room.viewers.forEach((viewerId) => {
        io.to(viewerId).emit("ice-candidate", candidate);
      });
    } else {
      if (room.host) io.to(room.host).emit("ice-candidate", candidate);
    }
  });

  // Chat relay
  socket.on("chat-message", (msg) => {
    if (!msg || !msg.roomId) return;
    io.to(msg.roomId).emit("chat-message", msg);
  });

  socket.on("heart", ({ roomId }) => {
    if (!roomId) return;
    socket.to(roomId).emit("heart");
  });

  socket.on("session-time", ({ roomId, seconds }) => {
    if (!roomId) return;
    io.to(roomId).emit("session-time", seconds);
  });

  socket.on("disconnect", () => {
    for (const [roomId, room] of rooms.entries()) {
      let changed = false;
      if (room.host === socket.id) {
        room.host = null;
        changed = true;
      }
      if (room.viewers.has(socket.id)) {
        room.viewers.delete(socket.id);
        changed = true;
      }
      if (changed) {
        rooms.set(roomId, room);
        io.to(roomId).emit("viewer-count", room.viewers.size);
      }
    }
    console.log("❌ Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
