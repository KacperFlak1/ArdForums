import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Store messages in memory
let messages = [];

io.on("connection", (socket) => {
  console.log("✅ A user connected");

  // Send chat history
  socket.emit("chat history", messages);

  // Listen for messages
  socket.on("chat message", (msg) => {
    const newMsg = { text: msg, time: new Date().toISOString() };
    messages.push(newMsg);

    // Keep only last 50
    if (messages.length > 50) messages.shift();

    io.emit("chat message", newMsg);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
