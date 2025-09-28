const socket = io();
let currentUser = null;
let currentThread = "general";

const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const toggleAuth = document.getElementById("toggleAuth");
const modalTitle = document.getElementById("modalTitle");
const authError = document.getElementById("authError");
const chatUI = document.getElementById("chatUI");
const sidebar = document.getElementById("sidebar");

let isLogin = true;

// Toggle login/signup
toggleAuth.addEventListener("click", (e) => {
  e.preventDefault();
  isLogin = !isLogin;
  modalTitle.textContent = isLogin ? "Login" : "Sign Up";
  toggleAuth.innerHTML = isLogin
    ? "Don’t have an account? <a href='#'>Sign up</a>"
    : "Already have an account? <a href='#'>Login</a>";
  authError.textContent = "";
});

// Handle auth submit
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
    sidebar.style.display = "block";

    socket.emit("join", currentUser);
    socket.emit("create thread", "general");
  } catch (err) {
    authError.textContent = err.message;
  }
});

// Threads
const threadList = document.getElementById("threadList");
const newThreadForm = document.getElementById("newThreadForm");
const newThreadName = document.getElementById("newThreadName");

newThreadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = newThreadName.value.trim();
  if (name) {
    socket.emit("create thread", name);
    socket.emit("switch thread", name);
    newThreadName.value = "";
  }
});

socket.on("thread list", (threads) => {
  threadList.innerHTML = "";
  threads.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = "#" + t;
    li.style.cursor = "pointer";
    li.onclick = () => {
      socket.emit("switch thread", t);
      currentThread = t;
      document.getElementById("threadTitle").textContent = "#" + t;
      document.getElementById("messages").innerHTML = "";
    };
    threadList.appendChild(li);
  });
});

// Chat
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");

socket.on("chat history", (data) => {
  messages.innerHTML = "";
  data.messages.forEach((msg) => addMessage(msg));
});

socket.on("chat message", (msg) => {
  addMessage(msg);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});

function addMessage(msg) {
  const item = document.createElement("li");
  const time = new Date(msg.time).toLocaleTimeString();
  item.textContent = `${msg.user} [${time}]: ${msg.text}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}
