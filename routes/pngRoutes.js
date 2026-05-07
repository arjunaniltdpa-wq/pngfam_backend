const express = require("express");
const router = express.Router();
const PngImage = require("../models/PngImage");
const CDN = "https://cdn.pngfam.com";

/**
 * Convert any stored URL to proper CDN URL
 */
const fixUrl = (url) => {
  if (!url) return null;

  url = url.replace(/^https?:\/\/[^\/]+\.r2\.dev/i, "");

  if (!url.startsWith("/")) url = "/" + url;

  return CDN + url;
};

/**
 * GET /api/pngs
 * Grid + search
 */
router.get("/", async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const limit = parseInt(req.query.limit) || 50; // ✅ added

    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } }, // ✅ fixed
          { tags: { $regex: search, $options: "i" } }
        ]
      };
    }

    const pngs = await PngImage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit) // ✅ dynamic
      .select("slug title thumbUrl width height");

    const updated = pngs.map(png => ({
      ...png.toObject(),
      thumbUrl: fixUrl(png.thumbUrl)
    }));

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch PNGs" });
  }
});

/**
 * Download
 */
router.get("/:slug/download", async (req, res) => {
  try {
    const png = await PngImage.findOne({ slug: req.params.slug });
    if (!png) return res.status(404).json({ error: "PNG not found" });

    png.downloads = (png.downloads || 0) + 1;
    await png.save();

    const fileUrl = fixUrl(png.originalUrl);

    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error("Failed to fetch file");

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${png.slug}.png"`
    );
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", buffer.length);

    res.end(buffer);

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

/**
 * 🔥 SEARCH API
 */
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.json([]);
    }

    let results = await PngImage.find({
      $or: [
        { title: { $regex: query, $options: "i" } }, // ✅ improved
        { title: { $regex: `\\b${query}\\b`, $options: "i" } }
      ]
    }).limit(50);

    if (results.length === 0) {
      results = await PngImage.find().limit(20);
    }

    const updated = results.map(png => ({
      ...png.toObject(),
      thumbUrl: fixUrl(png.thumbUrl)
    }));

    res.json(updated);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

/**
 * 🔥 RELATED PNG IMAGES API
 */
router.get("/related/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    const current = await PngImage.findOne({ slug });

    if (!current) {
      return res.status(404).json({ error: "Image not found" });
    }

    const keyword = current.title.split(" ").slice(0, 1).join(" ");

    let related = await PngImage.find({
      slug: { $ne: slug },
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { tags: { $in: current.tags || [] } }
      ]
    }).limit(20);

    // 🔥 fallback fill
    if (related.length < 20) {
      const extra = await PngImage.find({
        slug: { $ne: slug }
      }).limit(20 - related.length);

      related = [...related, ...extra];
    }
    
    const updated = related.map(png => ({
      ...png.toObject(),
      thumbUrl: fixUrl(png.thumbUrl)
    }));

    res.json(updated);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/pngs/:slug
 */
/**
 * GET /api/pngs/:slug
 */
router.get("/:slug", async (req, res) => {

  try {

    // CLEAN SLUG
    const cleanSlug = req.params.slug
      .trim()
      .replace(/-+$/, "");

    console.log("Requested slug:", cleanSlug);

    const png = await PngImage.findOne({
      slug: cleanSlug
    });

    console.log("PNG FOUND:", png ? png.slug : "NOT FOUND");

    if (!png) {
      return res.status(404).json({
        error: "Not found"
      });
    }

    res.json({

      ...png.toObject(),

      originalUrl: fixUrl(png.originalUrl),

      previewUrl: fixUrl(png.previewUrl),

      thumbUrl: fixUrl(png.thumbUrl),

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

});

module.exports = router;