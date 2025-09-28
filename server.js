import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(bodyParser.json());

// In-memory storage
let users = []; // { username, password }
let threads = {
  general: [],
};

app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "User already exists" });
  }
  users.push({ username, password });
  return res.json({ success: true });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
  }
  return res.json({ success: true, username });
});

// Socket.io
io.on("connection", (socket) => {
  console.log("✅ A user connected");

  socket.on("join", (username) => {
    socket.username = username;
    socket.thread = "general"; // default
    socket.join("general");
    socket.emit("chat history", { thread: "general", messages: threads.general });
  });

  // Switch threads
  socket.on("switch thread", (threadName) => {
    if (!threads[threadName]) threads[threadName] = [];
    socket.leave(socket.thread);
    socket.thread = threadName;
    socket.join(threadName);
    socket.emit("chat history", { thread: threadName, messages: threads[threadName] });
  });

  // Create thread
  socket.on("create thread", (threadName) => {
    if (!threads[threadName]) threads[threadName] = [];
    io.emit("thread list", Object.keys(threads));
  });

  // Handle messages
  socket.on("chat message", (msg) => {
    const newMsg = {
      user: socket.username,
      text: msg,
      time: new Date().toISOString(),
    };
    threads[socket.thread].push(newMsg);
    if (threads[socket.thread].length > 50) threads[socket.thread].shift();
    io.to(socket.thread).emit("chat message", newMsg);
  });
});
 
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Running on http://localhost:${PORT}`));
