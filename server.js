const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ✅ use safe temp folder (works in local + deploy)
const upload = multer({ dest: "uploads/" });

// create uploads folder if not exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

let users = [];
let documents = [];

// HOME
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// REGISTER
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  const exists = users.find(u => u.username === username);

  if (exists) {
    return res.json({ message: "User already registered" });
  }

  users.push({ username, password });
  res.json({ message: "Registered successfully" });
});

// LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (user) {
    res.json({ message: "Login success" });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// UPLOAD + COMPARE
app.post("/upload", upload.single("file"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({ error: "No file" });
  }

  let text = "";

  try {
    text = fs.readFileSync(req.file.path, "utf-8");
  } catch (err) {
    console.log("Read error:", err);
    text = "";
  }

  documents.push({
    name: req.file.originalname,
    content: text
  });

  let similarity = "0%";
  let compared = "Upload one more file to compare";

  if (documents.length >= 2) {
    const file1 = documents[documents.length - 2];
    const file2 = documents[documents.length - 1];

    const sim = calculateSimilarity(file1.content, file2.content);

    similarity = sim + "%";
    compared = `${file1.name} vs ${file2.name}`;
  }

  // delete file safely
  try {
    fs.unlinkSync(req.file.path);
  } catch (err) {
    console.log("Delete error:", err);
  }

  res.json({
    message: "Upload successful ✅",
    files: documents.map(d => d.name),
    compared: compared,
    similarity: similarity
  });
});

// SIMILARITY FUNCTION
function calculateSimilarity(t1, t2) {
  const w1 = t1.split(/\s+/);
  const w2 = t2.split(/\s+/);

  let match = 0;

  w1.forEach(word => {
    if (w2.includes(word)) match++;
  });

  const total = Math.max(w1.length, w2.length);

  return ((match / total) * 100).toFixed(2);
}

// START SERVER
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log("Running on", PORT));