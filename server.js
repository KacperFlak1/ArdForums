import express from "express";
import http from "http";
import { Server } from "socket.io";
import bcrypt from "bcrypt";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const SQLiteStore = SQLiteStoreFactory(session);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Use SQLite session store ---
app.use(session({
  store: new SQLiteStore({ db: "sessions.db", dir: "./data" }), // store sessions in ./data/sessions.db
  secret: "supersecret",
  resave: false,
  saveUninitialized: false
}));

// Static files
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
// ... (same as before: register, login, logout, /me)

// --- Socket.io ---
// Same socket.io setup as before
