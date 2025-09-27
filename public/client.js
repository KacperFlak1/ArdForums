const socket = io();
const postsDiv = document.getElementById("posts");

const modal = document.getElementById("modal");
const openModalBtn = document.getElementById("openModal");
const closeModalBtn = document.getElementById("closeModal");
const postForm = document.getElementById("postForm");

// Modal open/close
openModalBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Close modal if clicking outside
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Handle form submit
postForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const post = {
    title: document.getElementById("title").value,
    image: document.getElementById("image").value,
    context: document.getElementById("context").value,
    time: new Date().toISOString(),
  };

  socket.emit("new post", post);

  postForm.reset();
  modal.style.display = "none"; // close after posting
});

// Load history
socket.on("post history", (history) => {
  postsDiv.innerHTML = "";
  history.forEach((p) => renderPost(p));
});

// Show new posts
socket.on("new post", (post) => {
  renderPost(post);
});

// Render post in UI
function renderPost(post) {
  const container = document.createElement("div");
  container.className = "post";

  const title = document.createElement("h3");
  title.textContent = post.title;

  if (post.image) {
    const img = document.createElement("img");
    img.src = post.image;
    img.alt = post.title;
    container.appendChild(img);
  }

  const context = document.createElement("p");
  context.textContent = post.context;

  const time = document.createElement("small");
  time.textContent = new Date(post.time).toLocaleString();

  container.appendChild(title);
  container.appendChild(context);
  container.appendChild(time);

  postsDiv.prepend(container);
}
