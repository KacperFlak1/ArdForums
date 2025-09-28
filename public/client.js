// client.js
document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  const postsDiv = document.getElementById("posts");
  const modal = document.getElementById("modal");
  const openModalBtn = document.getElementById("openModal");
  const closeModalBtn = document.getElementById("closeModal");
  const cancelPostBtn = document.getElementById("cancelPost");
  const postForm = document.getElementById("postForm");
  const toggleThemeBtn = document.getElementById("toggleTheme");
  const body = document.body;

  // Debug helper
  function dbg(...args) { console.log("[client]", ...args); }

  // Theme toggle
  toggleThemeBtn.addEventListener("click", () => {
    if (body.classList.contains("dark")) {
      body.classList.remove("dark");
      body.classList.add("light");
      body.style.background = "#f4f4f4";
      body.style.color = "#111";
    } else {
      body.classList.remove("light");
      body.classList.add("dark");
      body.style.background = "";
      body.style.color = "";
    }
  });

  // Modal control
  openModalBtn.addEventListener("click", () => {
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
  });

  closeModalBtn.addEventListener("click", closeModal);
  cancelPostBtn.addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  function closeModal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    postForm.reset();
  }

  // socket events
  socket.on("connect", () => dbg("connected to server", socket.id));
  socket.on("post history", (history) => {
    dbg("got post history", history.length);
    postsDiv.innerHTML = "";
    history.forEach(renderPost);
  });

  socket.on("new post", (post) => {
    dbg("new post arrived", post);
    renderPost(post);
  });

  // Form submit
  postForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const post = {
      author: document.getElementById("author").value.trim() || "Anonymous",
      title: document.getElementById("title").value.trim(),
      image: document.getElementById("image").value.trim(),
      context: document.getElementById("context").value.trim()
    };

    if (!post.title || !post.context) {
      alert("Please enter a title and message.");
      return;
    }

    dbg("emitting new post", post);
    socket.emit("new post", post);
    closeModal();
  });

  // Render function (forum style)
  function renderPost(post) {
    const container = document.createElement("div");
    container.className = "post";

    // AUTHOR COLUMN
    const authorCol = document.createElement("div");
    authorCol.className = "post-author";

    // avatar placeholder (initials)
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    const initials = String(post.author || "A").trim().slice(0,2).toUpperCase();
    avatar.textContent = initials;
    authorCol.appendChild(avatar);

    const name = document.createElement("h4");
    name.textContent = post.author || "Anonymous";
    authorCol.appendChild(name);

    // CONTENT COLUMN
    const contentCol = document.createElement("div");
    contentCol.className = "post-content";

    const title = document.createElement("h3");
    title.textContent = post.title;
    contentCol.appendChild(title);

    const paragraph = document.createElement("p");
    paragraph.textContent = post.context;
    contentCol.appendChild(paragraph);

    // If post has an image URL, show it under the text
    if (post.image) {
      try {
        const img = document.createElement("img");
        img.src = post.image;
        img.alt = post.title;
        // show the image only after it loads (prevents broken-image empty box)
        img.addEventListener("error", () => {
          img.remove(); // remove broken image
        });
        contentCol.appendChild(img);
      } catch (err) {
        // ignore
      }
    }

    const time = document.createElement("small");
    time.textContent = new Date(post.time).toLocaleString();
    contentCol.appendChild(time);

    container.appendChild(authorCol);
    container.appendChild(contentCol);

    // newest on top
    postsDiv.prepend(container);
  }
});
