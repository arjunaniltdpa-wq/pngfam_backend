require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { connectDB } = require("./lib/db");
const pngRoutes = require("./routes/pngRoutes");
const PngImage = require("./models/PngImage");

const app = express();

app.get("/", (req, res) => {
  res.send("PNGfam Backend API is running 🚀");
});

/* 🌍 Allow production domain later */
app.use(cors({
  origin: "*", // later change to your domain
}));

app.use(express.json());

const ogRoutes = require("./routes/ogRoutes");
app.use("/api/og", ogRoutes);

// connect database
connectDB();

/* Serve frontend */
app.use(express.static(path.join(__dirname, "public")));

/* API routes */
app.use("/api/pngs", pngRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PNG backend running on port ${PORT}`);
});

/* Sitemap */
app.get("/sitemap-images.xml", async (req, res) => {
  try {
    const pngs = await PngImage.find().select("slug updatedAt originalUrl");

    const baseUrl = "https://www.pngfam.com";

    const fixUrl = (url) => {
      if (!url) return "";
      if (url.startsWith("http")) return url;
      if (!url.startsWith("/")) url = "/" + url;
      return `https://cdn.pngfam.com${url}`;
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    pngs.forEach(png => {
      xml += `
        <url>
          <loc>${baseUrl}/image/${png.slug}</loc>
          <lastmod>${png.updatedAt?.toISOString() || new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
          <image:image>
            <image:loc>${fixUrl(png.originalUrl)}</image:loc>
          </image:image>
        </url>`;
    });

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

app.get("/sitemap.xml", (req, res) => {
  const baseUrl = "https://www.pngfam.com";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

    <sitemap>
      <loc>${baseUrl}/sitemap-static.xml</loc>
    </sitemap>

    <sitemap>
      <loc>${baseUrl}/sitemap-images.xml</loc>
    </sitemap>

  </sitemapindex>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});
