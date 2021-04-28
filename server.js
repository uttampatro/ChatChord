// const path = require('path')
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  leaveUser,
  getRoomUsers
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// connect to frontend
app.use(express.static("public"));

//run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    //welcome current user
    socket.emit(
      "message",
      formatMessage("Admin", `Welcome ${user.username} to ChatChord!`)
    );

    //broadcast when user connect
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage("Admin", `${user.username} has joined the chat`)
      );

    //send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  //run when client disconnect
  socket.on("disconnect", () => {
    const user = leaveUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage("Admin", `${user.username} has left the chat`)
      );
      //send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => console.log(`Server is up and running on ${port}`));
