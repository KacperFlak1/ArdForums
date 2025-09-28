function renderPost(post) {
  const container = document.createElement("div");
  container.className = "post";

  // Author column
  const author = document.createElement("div");
  author.className = "post-author";
  const authorName = document.createElement("h4");
  authorName.textContent = post.author || "Anonymous";
  author.appendChild(authorName);

  if (post.image) {
    const avatar = document.createElement("img");
    avatar.src = post.image;
    author.appendChild(avatar);
  }

  // Content column
  const content = document.createElement("div");
  content.className = "post-content";
  const title = document.createElement("h3");
  title.textContent = post.title;
  content.appendChild(title);

  const text = document.createElement("p");
  text.textContent = post.context;
  content.appendChild(text);

  const time = document.createElement("small");
  time.textContent = new Date(post.time).toLocaleString();
  content.appendChild(time);

  container.appendChild(author);
  container.appendChild(content);

  postsDiv.prepend(container);
}
