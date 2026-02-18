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

/* =========================
   IMAGE SITEMAP (PAGINATED)
========================= */
app.get("/sitemap-images-:page.xml", async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = 5000; // Google max per sitemap
    const skip = (page - 1) * limit;

    const pngs = await PngImage.find({})
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit)
      .select("slug updatedAt originalUrl");

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
          <loc>${baseUrl}/image.html?slug=${png.slug}</loc>
          <lastmod>${png.updatedAt?.toISOString() || new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
          <image:image>
            <image:loc>${fixUrl(png.originalUrl)}</image:loc>
            <image:title>${png.slug.replace(/-/g,' ')}</image:title>
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


/* =========================
   MAIN SITEMAP INDEX
========================= */
app.get("/sitemap.xml", async (req, res) => {
  const baseUrl = "https://www.pngfam.com";

  const totalImages = await PngImage.countDocuments();
  const totalPages = Math.ceil(totalImages / 50000);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

    <sitemap>
      <loc>${baseUrl}/sitemap-static.xml</loc>
    </sitemap>`;

  for (let i = 1; i <= totalPages; i++) {
    xml += `
    <sitemap>
      <loc>${baseUrl}/sitemap-images-${i}.xml</loc>
    </sitemap>`;
  }

  xml += `
  </sitemapindex>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});
