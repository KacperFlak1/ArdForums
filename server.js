import express from "express";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import bcrypt from "bcrypt";
import expressLayouts from "express-ejs-layouts";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
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
const db = await open({ filename: "./data/data.db", driver: sqlite3.Database });

await db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT DEFAULT '/uploads/default.png',
  badges TEXT DEFAULT '[]'
)`);

await db.exec(`
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
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// --- Routes ---
app.get("/", async (req, res) => {
  const posts = await db.all(`
    SELECT posts.*, users.username, users.avatar, users.badges
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.id DESC
  `);

  posts.forEach(p => p.badges = JSON.parse(p.badges || "[]"));
  res.render("index", { posts });
});

app.get("/post/:id", async (req, res) => {
  const post = await db.get(`
    SELECT posts.*, users.username, users.avatar, users.badges
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?
  `, [req.params.id]);

  if (!post) return res.status(404).send("Post not found");
  post.badges = JSON.parse(post.badges || "[]");
  res.render("post", { post });
});

// --- Register/Login ---
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Missing fields");

  const hash = await bcrypt.hash(password, 8);
  try {
    const result = await db.run(
      "INSERT INTO users (username, password) VALUES (?,?)",
      [username, hash]
    );
    req.session.userId = result.lastID;
    res.redirect("/");
  } catch (err) {
    res.status(400).send("Username taken");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.get("SELECT * FROM users WHERE username=?", [username]);
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

// --- Start server ---
const PORT = process.env.PORT || 30
