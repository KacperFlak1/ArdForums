import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// In-memory posts (seed one so you can see it immediately)
let posts = [
  {
    title: "Welcome to the forum",
    author: "Admin",
    image: "",
    context: "This is a seeded welcome post. Create your own with the New Post button!",
    time: new Date().toISOString()
  }
];

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  // send history
  socket.emit("post history", posts);

  socket.on("new post", (post) => {
    console.log("received new post:", post);
    // basic validation
    if (!post.title || !post.context) return;

    // normalize
    const newPost = {
      title: String(post.title).slice(0, 200),
      author: post.author ? String(post.author).slice(0,100) : "Anonymous",
      image: post.image ? String(post.image).slice(0,1000) : "",
      context: String(post.context).slice(0,5000),
      time: new Date().toISOString()
    };

    posts.push(newPost);
    if (posts.length > 100) posts.shift(); // keep last 100

    io.emit("new post", newPost);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
