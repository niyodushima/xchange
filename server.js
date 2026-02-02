// WebRTC signaling relay
socket.on("offer", ({ roomId, offer }) => {
  const room = rooms.get(roomId);
  if (!room || !offer) return;

  if (socket.id === room.host) {
    // Host sends offer → forward to all viewers
    room.viewers.forEach((viewerId) => {
      io.to(viewerId).emit("offer", offer);
    });
  } else {
    // Viewer sends offer → forward to host
    if (room.host) io.to(room.host).emit("offer", offer);
  }
});

socket.on("answer", ({ roomId, answer }) => {
  const room = rooms.get(roomId);
  if (!room || !answer) return;

  if (socket.id === room.host) {
    // Host sends answer → forward to all viewers
    room.viewers.forEach((viewerId) => {
      io.to(viewerId).emit("answer", answer);
    });
  } else {
    // Viewer sends answer → forward to host
    if (room.host) io.to(room.host).emit("answer", answer);
  }
});

socket.on("ice-candidate", ({ roomId, candidate }) => {
  const room = rooms.get(roomId);
  if (!room || !candidate) return;

  if (socket.id === room.host) {
    // Host sends ICE → forward to all viewers
    room.viewers.forEach((viewerId) => {
      io.to(viewerId).emit("ice-candidate", candidate);
    });
  } else {
    // Viewer sends ICE → forward to host
    if (room.host) io.to(room.host).emit("ice-candidate", candidate);
  }
});
