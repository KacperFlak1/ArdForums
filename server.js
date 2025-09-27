import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Store posts in memory
let posts = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  // Send existing posts to new client
  socket.emit("post history", posts);

  // Handle new posts
  socket.on("new post", (post) => {
    posts.push(post);

    // Limit history to last 20
    if (posts.length > 20) posts.shift();

    io.emit("new post", post); // send to everyone
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
