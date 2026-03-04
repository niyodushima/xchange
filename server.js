const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

app.get("/", (req, res) => res.send("✅ Backend is running"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] }, path: "/socket.io" });

const waitingUsers = [];

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("find-match", ({ name, gender, preference }) => {
    // Try to find a partner that matches preference
    const idx = waitingUsers.findIndex(
      (u) =>
        (preference === "any" || u.gender === preference) &&
        (u.preference === "any" || gender === u.preference)
    );

    if (idx !== -1) {
      const partner = waitingUsers.splice(idx, 1)[0];
      io.to(socket.id).emit("matched", {
        partnerId: partner.id,
        role: "answerer",
        partnerMeta: partner,
      });
      io.to(partner.id).emit("matched", {
        partnerId: socket.id,
        role: "offerer",
        partnerMeta: { id: socket.id, name, gender, preference },
      });
      console.log(`Matched ${socket.id} with ${partner.id}`);
    } else {
      waitingUsers.push({ id: socket.id, name, gender, preference });
      console.log(`${name || "Guest"} is waiting for a match`);
    }
  });

  socket.on("offer", ({ to, offer }) => { if (to && offer) io.to(to).emit("offer", { from: socket.id, offer }); });
  socket.on("answer", ({ to, answer }) => { if (to && answer) io.to(to).emit("answer", { from: socket.id, answer }); });
  socket.on("ice-candidate", ({ to, candidate }) => { if (to && candidate) io.to(to).emit("ice-candidate", { from: socket.id, candidate }); });

  socket.on("reaction", (reaction) => { if (reaction?.partnerId) io.to(reaction.partnerId).emit("reaction", reaction); });

  socket.on("disconnect", () => {
    const idx = waitingUsers.findIndex((u) => u.id === socket.id);
    if (idx !== -1) waitingUsers.splice(idx, 1);
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Matchmaking server running on ${PORT}`));
