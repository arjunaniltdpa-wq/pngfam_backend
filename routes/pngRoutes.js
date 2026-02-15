const express = require("express");
const router = express.Router();
const PngImage = require("../models/PngImage");

const CDN = "https://cdn.pngfam.com";

/**
 * Convert stored URL → CDN URL correctly
 * Handles:
 * 1. Full R2 dev URL
 * 2. Already relative path
 */
const fixUrl = (url) => {
  if (!url) return null;

  // remove full R2 public dev domain if present
  url = url.replace(/^https?:\/\/[^\/]+\.r2\.dev/i, "");

  // ensure leading slash
  if (!url.startsWith("/")) url = "/" + url;

  return CDN + url;
};

/**
 * GET /api/pngs
 * List PNGs (grid + search)
 */
router.get("/", async (req, res) => {
  try {
    const search = req.query.search?.trim();

    let query = {};

    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } },
        ],
      };
    }

    const pngs = await PngImage.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .select("slug title thumbUrl width height");

    const updated = pngs.map((png) => ({
      ...png.toObject(),
      thumbUrl: fixUrl(png.thumbUrl),
    }));

    res.json(updated);
  } catch (err) {
    console.error("PNG fetch/search error:", err);
    res.status(500).json({ error: "Failed to fetch PNGs" });
  }
});

/**
 * GET /api/pngs/:slug
 * Single PNG page
 */
router.get("/:slug", async (req, res) => {
  try {
    const png = await PngImage.findOne({ slug: req.params.slug });
    if (!png) return res.status(404).json({ error: "Not found" });

    res.json({
      ...png.toObject(),
      originalUrl: fixUrl(png.originalUrl),
      previewUrl: fixUrl(png.previewUrl),
      thumbUrl: fixUrl(png.thumbUrl),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/pngs/:slug/download
 * Download PNG with SEO filename
 */
router.get("/:slug/download", async (req, res) => {
  try {
    const png = await PngImage.findOne({ slug: req.params.slug });

    if (!png) {
      return res.status(404).json({ error: "PNG not found" });
    }

    // increment download count
    png.downloads = (png.downloads || 0) + 1;
    await png.save();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${png.slug}.png"`
    );
    res.setHeader("Content-Type", "image/png");

    // redirect to CDN image
    return res.redirect(fixUrl(png.originalUrl));
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

module.exports = router;
