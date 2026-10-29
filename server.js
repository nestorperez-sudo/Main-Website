const express = require("express");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "frontend")));

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

app.listen(3000, () => console.log("Running on http://localhost:3000"));