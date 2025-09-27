const socket = io();
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");

// Load chat history when joining
socket.on("chat history", (history) => {
  history.forEach((msg) => {
    addMessage(msg);
  });
});

// Listen for new messages
socket.on("chat message", (msg) => {
  addMessage(msg);
});

// Send message
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});

// Helper: render messages
function addMessage(msg) {
  const item = document.createElement("li");
  const time = new Date(msg.time).toLocaleTimeString();
  item.textContent = `[${time}] ${msg.text}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
}
