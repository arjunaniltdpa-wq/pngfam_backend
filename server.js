require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { connectDB } = require("./lib/db");
const pngRoutes = require("./routes/pngRoutes");
const PngImage = require("./models/PngImage");

const app = express();

/* Root */
app.get("/", (req, res) => {
  res.send("PNGfam Backend API is running 🚀");
});

/* CORS */
app.use(cors({ origin: "*" }));

app.use(express.json());

/* OG routes */
const ogRoutes = require("./routes/ogRoutes");
app.use("/api/og", ogRoutes);

/* Connect DB */
connectDB();

/* Serve frontend */
app.use(express.static(path.join(__dirname, "public")));

/* API */
app.use("/api/pngs", pngRoutes);

/* =========================
   STATIC PAGES SITEMAP
========================= */
app.get("/sitemap-static.xml", (req, res) => {
  res.set("Content-Type", "application/xml");
  res.set("Cache-Control", "public, max-age=86400"); // 24 hours

  const baseUrl = "https://www.pngfam.com";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

    <url>
      <loc>${baseUrl}/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>

    <url>
      <loc>${baseUrl}/search</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>

    <url>
      <loc>${baseUrl}/contact</loc>
      <changefreq>yearly</changefreq>
      <priority>0.3</priority>
    </url>

    <url>
      <loc>${baseUrl}/privacy-policy</loc>
      <changefreq>yearly</changefreq>
      <priority>0.2</priority>
    </url>

    <url>
      <loc>${baseUrl}/terms</loc>
      <changefreq>yearly</changefreq>
      <priority>0.2</priority>
    </url>

    <url>
      <loc>${baseUrl}/license</loc>
      <changefreq>yearly</changefreq>
      <priority>0.2</priority>
    </url>

    <url>
      <loc>${baseUrl}/dmca</loc>
      <changefreq>yearly</changefreq>
      <priority>0.2</priority>
    </url>

  </urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});


/* =========================
   IMAGE SITEMAP (PAGINATED)
========================= */
app.get("/sitemap-images-:page.xml", async (req, res) => {
  try {
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=43200"); // 12 hours

    const page = parseInt(req.params.page) || 1;
    const limit = 5000; // recommended safe size
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
          <loc>${baseUrl}/image/${png.slug}</loc>
          <lastmod>${png.updatedAt?.toISOString() || new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
          <image:image>
            <image:loc>${fixUrl(png.originalUrl)}</image:loc>
            <image:title>${png.slug.replace(/-/g, " ")}</image:title>
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
  res.set("Content-Type", "application/xml");
  res.set("Cache-Control", "public, max-age=3600"); // 1 hour

  const baseUrl = "https://www.pngfam.com";

  const totalImages = await PngImage.countDocuments();
  const limit = 5000;
  const totalPages = Math.ceil(totalImages / limit);

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


/* Start Server */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PNG backend running on port ${PORT}`);
});
