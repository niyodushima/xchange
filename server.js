const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "https://your-frontend.vercel.app", methods: ["GET", "POST"] }));
app.use(express.json());

app.get("/", (req, res) => res.send("✅ Backend is running"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] }, path: "/socket.io" });

const waitingUsers = [];

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("find-match", ({ name, avatar, filter }) => {
    if (waitingUsers.length > 0) {
      const partnerId = waitingUsers.shift();
      io.to(socket.id).emit("matched", { partnerId, role: "answerer", partnerMeta: { name, avatar, filter } });
      io.to(partnerId).emit("matched", { partnerId: socket.id, role: "offerer", partnerMeta: { name, avatar, filter } });
    } else {
      waitingUsers.push(socket.id);
    }
  });

  socket.on("offer", ({ to, offer }) => { if (to && offer) io.to(to).emit("offer", { from: socket.id, offer }); });
  socket.on("answer", ({ to, answer }) => { if (to && answer) io.to(to).emit("answer", { from: socket.id, answer }); });
  socket.on("ice-candidate", ({ to, candidate }) => { if (to && candidate) io.to(to).emit("ice-candidate", { from: socket.id, candidate }); });

  socket.on("reaction", (reaction) => { if (reaction?.partnerId) io.to(reaction.partnerId).emit("reaction", reaction); });

  socket.on("disconnect", () => {
    const idx = waitingUsers.indexOf(socket.id);
    if (idx !== -1) waitingUsers.splice(idx, 1);
    console.log("Disconnected:", socket.id);
  });
});

// ✅ Heartbeat cleanup
setInterval(() => {
  for (let i = waitingUsers.length - 1; i >= 0; i--) {
    if (!io.sockets.sockets.get(waitingUsers[i])) {
      waitingUsers.splice(i, 1);
    }
  }
}, 10000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Matchmaking server running on ${PORT}`));
