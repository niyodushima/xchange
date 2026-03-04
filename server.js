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

app.get("/", (req, res) => {
  res.send("✅ Backend is running");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/socket.io",
});

const rooms = new Map();

function updateViewerCount(roomId) {
  const room = rooms.get(roomId);
  const count = room ? room.size : 0;
  io.to(roomId).emit("viewer-count", count);
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // ✅ Everyone joins "main-room" by default
  socket.on("join-room", ({ roomId = "main-room", name }) => {
    socket.join(roomId);

    const existing = rooms.get(roomId) || new Set();
    existing.add(socket.id);
    rooms.set(roomId, existing);

    // Notify others
    socket.to(roomId).emit("user-joined", socket.id);

    // Confirm to this client
    io.to(socket.id).emit("room-joined", { roomId });

    // Update viewer count
    updateViewerCount(roomId);

    console.log(`${name || "Guest"} joined ${roomId}`);
  });

  // ✅ Direct offer/answer/ICE forwarding
  socket.on("offer", ({ to, offer }) => {
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  // ✅ Chat + reactions
  socket.on("chat-message", (msg) => {
    if (!msg) return;
    io.to("main-room").emit("chat-message", msg);
  });

  socket.on("reaction", (reaction) => {
    if (!reaction) return;
    io.to("main-room").emit("reaction", reaction);
  });

  // ✅ Disconnect cleanup
  socket.on("disconnect", () => {
    for (const [roomId, members] of rooms.entries()) {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        rooms.set(roomId, members);
        updateViewerCount(roomId);
      }
    }
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
