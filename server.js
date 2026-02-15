require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { connectDB } = require("./lib/db");
const pngRoutes = require("./routes/pngRoutes");

const app = express();

/* 🌍 Allow production domain later */
app.use(cors({
  origin: "*", // later change to your domain
}));

app.use(express.json());

// connect database
connectDB();

/* Serve frontend */
app.use(express.static(path.join(__dirname, "public")));

/* API routes */
app.use("/api/pngs", pngRoutes);

/* 🔥 SPA fallback (important for /image/slug URLs) */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PNG backend running on port ${PORT}`);
});
