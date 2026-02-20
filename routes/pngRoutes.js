const express = require("express");
const router = express.Router();
const PngImage = require("../models/PngImage");
const CDN = "https://cdn.pngfam.com";

/**
 * Convert any stored URL to proper CDN URL
 */
const fixUrl = (url) => {
  if (!url) return null;

  // remove full R2 dev domain if stored
  url = url.replace(/^https?:\/\/[^\/]+\.r2\.dev/i, "");

  // ensure leading slash
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

    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } }
        ]
      };
    }

    const pngs = await PngImage.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
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
 * GET /api/pngs/:slug
 */
router.get("/:slug", async (req, res) => {
  try {
    const png = await PngImage.findOne({ slug: req.params.slug });
    if (!png) return res.status(404).json({ error: "Not found" });

    // Get raw path (without CDN)
    let rawOriginal = png.originalUrl || "";

    rawOriginal = rawOriginal.replace(/^https?:\/\/[^\/]+/i, "");

    if (!rawOriginal.startsWith("/")) rawOriginal = "/" + rawOriginal;

    const originalUrl = CDN + rawOriginal;

    // Build preview + thumb safely
    const previewPath = rawOriginal
      .replace("/originals/", "/previews/")
      .replace(".png", ".webp");

    const thumbPath = previewPath.replace("/previews/", "/thumbs/");

    const previewUrl = CDN + previewPath;
    const thumbUrl = CDN + thumbPath;

    res.json({
      ...png.toObject(),
      originalUrl,
      previewUrl,
      thumbUrl,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
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

    // fetch file from CDN
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error("Failed to fetch file");

    // convert to buffer (IMPORTANT)
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // force download headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${png.slug}.png"`
    );
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", buffer.length);

    // send file directly (no redirect, no pipe)
    res.end(buffer);

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

module.exports = router;
