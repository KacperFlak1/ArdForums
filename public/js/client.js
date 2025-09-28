const socket = io();

// Modal logic
const modal = document.getElementById("postModal");
const btn = document.getElementById("newPostBtn");
const span = document.querySelector(".close");

btn.onclick = () => modal.style.display = "block";
span.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

// Handle post form
document.getElementById("postForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("postTitle").value;
  const context = document.getElementById("postContent").value;
  socket.emit("new post", { title, context });
  modal.style.display = "none";
});

// Render post
function renderPost(post) {
  const postsDiv = document.getElementById("posts");
  const div = document.createElement("div");
  div.className = "post";
  const badges = JSON.parse(post.badges || "[]")
    .map(b => `<span class="badge">${b}</span>`).join(" ");
  div.innerHTML = `
    <h3>${post.title}</h3>
    <p>${post.content}</p>
    <p><strong>${post.username}</strong> ${badges} <em>${new Date(post.time).toLocaleString()}</em></p>
    ${post.signature ? `<p class="signature">-- ${post.signature}</p>` : ""}
  `;
  postsDiv.prepend(div);
}

socket.on("post history", (posts) => {
  posts.forEach(renderPost);
});

socket.on("new post", (post) => {
  renderPost(post);
});
