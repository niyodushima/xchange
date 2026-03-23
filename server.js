const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Mount auth routes
app.use("/api/auth", authRoutes);

// ✅ Load environment variables in development
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (err) {
    console.warn("dotenv not installed, skipping...");
  }
}

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("✅ Backend is running");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/socket.io",
});

// ✅ Queue for matchmaking
const waitingUsers = [];

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // ✅ Find a match
  socket.on("find-match", ({ name }) => {
    if (waitingUsers.length > 0) {
      const partnerId = waitingUsers.shift();

      // Decide roles: first in queue = offerer, new joiner = answerer
      io.to(socket.id).emit("matched", { partnerId, role: "answerer" });
      io.to(partnerId).emit("matched", { partnerId: socket.id, role: "offerer" });

      console.log(`Matched ${socket.id} (answerer) with ${partnerId} (offerer)`);
    } else {
      waitingUsers.push(socket.id);
      console.log(`${name || "Guest"} is waiting for a match`);
    }
  });

  // ✅ Offer/Answer exchange
  socket.on("offer", ({ to, offer }) => {
    if (to && offer) io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    if (to && answer) io.to(to).emit("answer", { from: socket.id, answer });
  });

  // ✅ ICE candidates
  socket.on("ice-candidate", ({ to, candidate }) => {
    if (to && candidate) io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  // ✅ Chat messages
  socket.on("chat-message", (msg) => {
    if (msg?.partnerId) io.to(msg.partnerId).emit("chat-message", msg);
  });

  // ✅ Reactions
  socket.on("reaction", (reaction) => {
    if (reaction?.partnerId) io.to(reaction.partnerId).emit("reaction", reaction);
  });

  // ✅ Disconnect cleanup
  socket.on("disconnect", () => {
    const idx = waitingUsers.indexOf(socket.id);
    if (idx !== -1) waitingUsers.splice(idx, 1);
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Matchmaking server running on ${PORT}`));
