import express from "express";
import http from "http";
import { Server } from "socket.io";
import bcrypt from "bcrypt";
import session from "express-session";
import connectSqlite3 from "connect-sqlite3";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const SQLiteStore = connectSqlite3(session);

// Ensure ./data folder exists
if (!fs.existsSync("./data")) fs.mkdirSync("./data");

// --- Session middleware ---
app.use(session({
  store: new SQLiteStore({ db: "sessions.db", dir: "./data" }),
  secret: "supersecret",
  resave: false,
  saveUninitialized: false
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// --- Database setup ---
const db = await open({ filename: "./data/data.db", driver: sqlite3.Database });

await db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    signature TEXT,
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

// --- Auth routes ---
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Missing fields");

  // Faster for free tier
  const hash = await bcrypt.hash(password, 8);

  try {
    const result = await db.run("INSERT INTO users (username, password) VALUES (?,?)", [username, hash]);
    req.session.userId = result.lastID;
    res.redirect("/");
  } catch (err) {
    res.status(400).send("Username already exists");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
  if (!user) return res.status(400).send("Invalid login");
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).send("Invalid login");
  req.session.userId = user.id;
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login.html");
});

app.get("/me", async (req, res) => {
  if (!req.session.userId) return res.json(null);
  const user = await db.get("SELECT id, username, avatar, signature, badges FROM users WHERE id = ?", [req.session.userId]);
  res.json(user);
});

// --- Socket.io ---
io.use((socket, next) => {
  session({ store: new SQLiteStore({ db: "sessions.db", dir: "./data" }), secret: "supersecret", resave: false, saveUninitialized: false })(socket.request, {}, next);
});

io.on("connection", async (socket) => {
  const req = socket.request;
  if (!req.session.userId) return;

  const user = await db.get("SELECT * FROM users WHERE id=?", [req.session.userId]);

  // Send post history
  const posts = await db.all(`
    SELECT posts.*, users.username, users.avatar, users.signature, users.badges
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.id DESC
  `);
  socket.emit("post history", posts);

  // Handle new post
  socket.on("new post", async (postData) => {
    if (!user) return;
    const time = new Date().toISOString();
    const result = await db.run(
      "INSERT INTO posts (user_id, title, content, time) VALUES (?,?,?,?)",
      [user.id, postData.title, postData.context, time]
    );

    const newPost = {
      id: result.lastID,
      user_id: user.id,
      title: postData.title,
      content: postData.context,
      time,
      username: user.username,
      avatar: user.avatar,
      signature: user.signature,
      badges: user.badges
    };

    io.emit("new post", newPost);
  });
});

// --- Start server ---
server.listen(3000, () => console.log("Server running on port 3000"));
