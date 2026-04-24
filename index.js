const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.static("public"));

// ======================
// SOCKET LOGIK
// ======================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(socket.id, "joined", room);
  });

  socket.on("send_message", (data) => {
    // data = { room, message, sender }

    io.to(data.room).emit("receive_message", data.message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ======================
// START SERVER
// ======================
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
