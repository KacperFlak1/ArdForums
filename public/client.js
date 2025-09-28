const socket = io();
let currentUser = null;

const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const toggleAuth = document.getElementById("toggleAuth");
const modalTitle = document.getElementById("modalTitle");
const authError = document.getElementById("authError");
const chatUI = document.getElementById("chatUI");

let isLogin = true; // toggle between login/signup

// Toggle between login/signup
toggleAuth.addEventListener("click", (e) => {
  e.preventDefault();
  isLogin = !isLogin;
  modalTitle.textContent = isLogin ? "Login" : "Sign Up";
  toggleAuth.innerHTML = isLogin
    ? "Don’t have an account? <a href='#'>Sign up</a>"
    : "Already have an account? <a href='#'>Login</a>";
  authError.textContent = "";
});

// Handle form submit
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch(isLogin ? "/login" : "/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    currentUser = username;
    authModal.style.display = "none";
    chatUI.style.display = "block";
    socket.emit("join", currentUser);
  } catch (err) {
    authError.textContent = err.message;
  }
});

// --- Chat functionality ---
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");

// Load history
socket.on("chat history", (history) => {
  history.forEach((msg) => addMessage(msg));
});

// New messages
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

// Render helper
function addMessage(msg) {
  const item = document.createElement("li");
  const time = new Date(msg.time).toLocaleTimeString();
  item.textContent = `${msg.user} [${time}]: ${msg.text}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}
