const express = require("express");
const fs = require("fs");
const path = require("path");
const validUrl = require("valid-url");

const app = express();

require("dotenv").config();

const dataFilePath = path.join(__dirname, "urls.json");
let urls = [];
if (fs.existsSync(dataFilePath)) {
  const data = fs.readFileSync(dataFilePath);
  urls = JSON.parse(data);
}

app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  let hasPassword;
  if (process.env.PASSWORD) {
    hasPassword = true;
  } else {
    hasPassword = false;
  }
  res.render("index", { hasPassword });
});

app.post("/api/shorten", (req, res) => {
  const url = req.body.url;
  console.log(url);
  if (!validUrl.isUri(url)) {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }
  if (req.body.password != process.env.PASSWORD && process.env.PASSWORD) {
    res.status(400).json({ error: "Invalid Password" });
    return;
  }
  const id = generateId();
  urls.push({ id, url });
  saveUrls();
  res.json({ id });
});

app.get("/:id", (req, res) => {
  const id = req.params.id;
  const urlObj = urls.find((u) => u.id === id);
  if (!urlObj) {
    res.sendStatus(404);
    return;
  }
  res.redirect(urlObj.url);
});

function generateId() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  let idLength = parseInt(process.env.ID_LENGTH) || 4;
  for (let i = 0; i < idLength; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  if (urls.find((u) => u.id === id)) {
    return generateId();
  }
  return id;
}

function saveUrls() {
  const data = JSON.stringify(urls, null, 2);
  fs.writeFileSync(dataFilePath, data);
}

app.listen(3000, () => {
  console.log("URL shortener listening on port 3000!");
});
