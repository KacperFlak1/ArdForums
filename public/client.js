const socket = io();
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const postBtn = document.getElementById("postBtn");

// Load chat history
socket.on("chat history", (history) => {
  history.forEach((msg) => addMessage(msg));
});

// New message from server
socket.on("chat message", (msg) => {
  addMessage(msg);
});

// Post button click
postBtn.addEventListener("click", () => {
  if (input.value) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});

// Allow Enter key to send too
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    postBtn.click();
  }
});

// Helper: render messages
function addMessage(msg) {
  const item = document.createElement("li");
  const time = new Date(msg.time).toLocaleTimeString();
  item.textContent = `[${time}] ${msg.text}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}
