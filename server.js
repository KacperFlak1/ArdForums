import express from "express";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import bcrypt from "bcrypt";
import expressLayouts from "express-ejs-layouts";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!fs.existsSync("./data")) fs.mkdirSync("./data");

const app = express();
const SQLiteStore = SQLiteStoreFactory(session);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// EJS layouts
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

// --- SQLite database ---
const db = new Database("./data/data.db");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT DEFAULT '/uploads/default.png',
  badges TEXT DEFAULT '[]'
)`);

db.exec(`
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT,
  content TEXT,
  time TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);

// --- Sessions ---
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.db", dir: "./data" }),
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);

// --- Middleware to pass user data to templates ---
app.use((req, res, next) => {
  if (req.session.userId) {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.session.userId);
    if (user) {
      user.badges = JSON.parse(user.badges || "[]");
      res.locals.user = user;
    }
  }
  next();
});

// --- Routes ---
app.get("/", (req, res) => {
  const posts = db.prepare(`
    SELECT posts.*, users.username, users.avatar, users.badges
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.id DESC
  `).all();

  posts.forEach(p => p.badges = JSON.parse(p.badges || "[]"));
  res.render("index", { posts });
});

app.get("/post/:id", (req, res) => {
  const post = db.prepare(`
    SELECT posts.*, users.username, users.avatar, users.badges
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?
  `).get(req.params.id);

  if (!post) return res.status(404).send("Post not found");
  post.badges = JSON.parse(post.badges || "[]");
  res.render("post", { post });
});

// --- Login/Register page routes ---
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// --- Register/Login ---
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Missing fields");

  const hash = await bcrypt.hash(password, 8);
  try {
    const result = db.prepare("INSERT INTO users (username, password) VALUES (?,?)").run(username, hash);
    req.session.userId = result.lastInsertRowid;
    res.redirect("/");
  } catch (err) {
    res.status(400).send("Username taken");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if (!user) return res.status(400).send("Invalid login");
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).send("Invalid login");
  req.session.userId = user.id;
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// --- Post creation route ---
app.post("/create-post", (req, res) => {
  if (!req.session.userId) return res.status(401).send("Not logged in");
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).send("Missing fields");
  
  const time = new Date().toISOString();
  db.prepare("INSERT INTO posts (user_id, title, content, time) VALUES (?,?,?,?)").run(req.session.userId, title, content, time);
  res.redirect("/");
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
