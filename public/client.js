document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
  const postsDiv = document.getElementById("posts");

  // --- SETTINGS ---
  const settingsModal = document.getElementById("settingsModal");
  const openSettingsBtn = document.getElementById("openSettings");
  const closeSettingsBtn = document.getElementById("closeSettings");
  const settingsForm = document.getElementById("settingsForm");

  let userSettings = JSON.parse(localStorage.getItem("userSettings")) || {
    username: "Anonymous",
    avatarUrl: "",
    signature: ""
  };

  function saveSettings(newSettings) {
    userSettings = { ...userSettings, ...newSettings };
    localStorage.setItem("userSettings", JSON.stringify(userSettings));
  }

  openSettingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "flex";
    document.getElementById("username").value = userSettings.username;
    document.getElementById("avatarUrl").value = userSettings.avatarUrl;
    document.getElementById("signature").value = userSettings.signature;
  });
  closeSettingsBtn.addEventListener("click", () => settingsModal.style.display = "none");

  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveSettings({
      username: document.getElementById("username").value.trim() || "Anonymous",
      avatarUrl: document.getElementById("avatarUrl").value.trim(),
      signature: document.getElementById("signature").value.trim()
    });
    settingsModal.style.display = "none";
  });

  // --- POSTS ---
  const postForm = document.getElementById("postForm");

  postForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const post = {
      author: userSettings.username,
      image: userSettings.avatarUrl,
      signature: userSettings.signature,
      title: document.getElementById("title").value.trim(),
      context: document.getElementById("context").value.trim()
    };
    socket.emit("new post", post);
    postForm.reset();
    document.getElementById("modal").style.display = "none";
  });

  // --- SOCKET EVENTS ---
  socket.on("post history", (history) => {
    postsDiv.innerHTML = "";
    history.forEach(renderPost);
  });
  socket.on("new post", renderPost);

  // --- RENDER FUNCTION ---
  function renderPost(post) {
    const container = document.createElement("div");
    container.className = "post";

    const authorCol = document.createElement("div");
    authorCol.className = "post-author";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    if (post.image) {
      const img = document.createElement("img");
      img.src = post.image;
      img.style.width = "80px";
      img.style.height = "80px";
      avatar.textContent = "";
      avatar.appendChild(img);
    } else {
      avatar.textContent = post.author[0].toUpperCase();
    }
    authorCol.appendChild(avatar);

    const name = document.createElement("h4");
    name.textContent = post.author;
    authorCol.appendChild(name);

    const contentCol = document.createElement("div");
    contentCol.className = "post-content";

    const title = document.createElement("h3");
    title.textContent = post.title;
    contentCol.appendChild(title);

    const body = document.createElement("p");
    body.textContent = post.context;
    contentCol.appendChild(body);

    if (post.signature) {
      const sig = document.createElement("p");
      sig.style.borderTop = "1px dashed #555";
      sig.style.marginTop = "10px";
      sig.style.fontSize = "12px";
      sig.style.color = "#aaa";
      sig.textContent = post.signature;
      contentCol.appendChild(sig);
    }

    const time = document.createElement("small");
    time.textContent = new Date(post.time).toLocaleString();
    contentCol.appendChild(time);

    container.appendChild(authorCol);
    container.appendChild(contentCol);
    postsDiv.prepend(container);
  }

  // --- MODAL OPEN/CLOSE ---
  const modal = document.getElementById("modal");
  document.getElementById("openModal").addEventListener("click", () => modal.style.display = "flex");
  document.getElementById("closeModal").addEventListener("click", () => modal.style.display = "none");
  document.getElementById("cancelPost").addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", e => { if (e.target === modal || e.target === settingsModal) { modal.style.display = "none"; settingsModal.style.display = "none"; }});
});

// --- Badge --- //
const badgeContainer = document.createElement("div");
badgeContainer.className = "badges";

// post.badges is JSON array like ["Admin","VIP"]
(JSON.parse(post.badges || "[]")).forEach(badgeName => {
  const span = document.createElement("span");
  span.className = "badge";
  span.textContent = badgeName;
  badgeContainer.appendChild(span);
});

authorCol.appendChild(badgeContainer);

