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

const modal = document.getElementById("modal");
const openModalBtn = document.getElementById("openModal");
const closeModalBtn = document.getElementById("closeModal");

// Open modal
openModalBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

// Close modal (X button)
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Close modal if clicking outside of it
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
