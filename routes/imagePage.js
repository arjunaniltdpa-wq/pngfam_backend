const express = require("express");
const router = express.Router();
const PngImage = require("../models/PngImage");
const CDN = "https://cdn.pngfam.com";

const fixUrl = (url) => {
  if (!url) return null;
  url = url.replace(/^https?:\/\/[^\/]+\.r2\.dev/i, "");
  if (!url.startsWith("/")) url = "/" + url;
  return CDN + url;
};

/**
 * CLEAN PAGE URL
 * /image/:slug
 */
router.get("/:slug", async (req, res) => {
  try {
    const png = await PngImage.findOne({ slug: req.params.slug });
    if (!png) return res.status(404).send("Image not found");

    res.render("image", {
      png: {
        ...png.toObject(),
        originalUrl: fixUrl(png.originalUrl),
        previewUrl: fixUrl(png.previewUrl),
        thumbUrl: fixUrl(png.thumbUrl),
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;