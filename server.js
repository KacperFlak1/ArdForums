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
let messages = [];

// Signup
app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "User already exists" });
  }
  users.push({ username, password });
  return res.json({ success: true });
});

// Login
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

  // Send history
  socket.on("join", (username) => {
    socket.username = username;
    socket.emit("chat history", messages);
  });

  // New messages
  socket.on("chat message", (msg) => {
    const newMsg = { user: socket.username, text: msg, time: new Date().toISOString() };
    messages.push(newMsg);
    if (messages.length > 50) messages.shift();
    io.emit("chat message", newMsg);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Running on http://localhost:${PORT}`));
