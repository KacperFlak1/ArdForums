import express from "express";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const SQLiteStore = SQLiteStoreFactory(session);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new SQLiteStore({ db: "sessions.db", dir: __dirname }),
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// Fake posts for now
const posts = [
  {
    username: "AdminGuy",
    title: "Welcome to the Forum!",
    content: "This is our first post in classic forum style.",
    img: null,
    pfp: "/uploads/admin.png",
    badges: ["admin"],
  },
  {
    username: "CoolUser",
    title: "Hello World",
    content: "Glad to be here. Love the retro vibe!",
    img: null,
    pfp: "/uploads/user.png",
    badges: ["vip"],
  },
];

// Routes
app.get("/", (req, res) => {
  res.render("index", { posts });
});

app.get("/post/:id", (req, res) => {
  const post = posts[req.params.id];
  if (!post) return res.status(404).send("Post not found");
  res.render("post", { post });
});

// Run server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
