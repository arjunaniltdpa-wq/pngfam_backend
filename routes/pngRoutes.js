const express = require("express");
const router = express.Router();
const PngImage = require("../models/PngImage");

const CDN = "https://cdn.pngfam.com";

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

    // 🔥 Attach CDN prefix to thumbnails
    const updated = pngs.map(png => ({
      ...png.toObject(),
      thumbUrl: png.thumbUrl ? CDN + png.thumbUrl : null
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
      originalUrl: png.originalUrl ? CDN + png.originalUrl : null,
      previewUrl: png.previewUrl ? CDN + png.previewUrl : null,
      thumbUrl: png.thumbUrl ? CDN + png.thumbUrl : null,
    });

  } catch (err) {
    console.error("Single PNG error:", err);
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

    // Increment download count
    png.downloads = (png.downloads || 0) + 1;
    await png.save();

    // SEO filename
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${png.slug}.png"`
    );
    res.setHeader("Content-Type", "image/png");

    // 🔥 Redirect to CDN image instead of local path
    return res.redirect(CDN + png.originalUrl);

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

module.exports = router;
