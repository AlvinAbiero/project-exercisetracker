const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI);

// === Routes ===
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// POST /api/users – create user
app.post("/api/users", async (req, res) => {
  const user = new User({ username: req.body.username });
  await user.save();
  res.json({ username: user.username, _id: user._id });
});

// GET /api/users – list all users
app.get("/api/users", async (req, res) => {
  const users = await User.find({}, "username _id");
  res.json(users);
});

// POST /api/users/:_id/exercises
app.post("/api/users/:_id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;
  const user = await User.findById(parseInt(req.params._id));
  if (!user) return res.json({ error: "User not found" });

  const exercise = {
    description,
    duration: parseInt(duration),
    date: date ? new Date(date) : new Date(),
  };

  user.log.push(exercise);
  await user.save();

  res.json({
    _id: user._id,
    username: user.username,
    date: exercise.date.toDateString(),
    duration: exercise.duration,
    description: exercise.description,
  });
});

// GET /api/users/:_id/logs
app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  const user = await User.findById(parseInt(req.params._id));
  if (!user) return res.json({ error: "User not found" });

  let log = user.log;

  if (from) {
    const fromDate = new Date(from);
    log = log.filter((e) => new Date(e.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    log = log.filter((e) => new Date(e.date) <= toDate);
  }

  if (limit) {
    log = log.slice(0, parseInt(limit));
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: log.lenght,
    log: log.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: new Date(e.date).toDateString(),
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
