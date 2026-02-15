const express = require("express");
const router = express.Router();
const PngImage = require("../models/PngImage");

/**
 * GET /api/pngs
 * List PNGs (grid + search)
 * /api/pngs
 * /api/pngs?search=muscle
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
          { category: { $regex: search, $options: "i" } }
        ]
      };
    }

    const pngs = await PngImage.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .select("slug title thumbUrl width height");

    res.json(pngs);
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

    if (!png) {
      return res.status(404).json({ error: "PNG not found" });
    }

    res.json(png);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch PNG" });
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

    // Increment download count (optional but recommended)
    png.downloads = (png.downloads || 0) + 1;
    await png.save();

    // Force SEO filename on download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${png.slug}.png"`
    );
    res.setHeader("Content-Type", "image/png");

    // Redirect stream from R2
    return res.redirect(png.originalUrl);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Download failed" });
  }
});

module.exports = router;
