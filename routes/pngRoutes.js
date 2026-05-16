const express = require("express");
const router = express.Router();
const PngImage = require("../models/PngImage");
const Fuse = require("fuse.js");
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
    const skip = parseInt(req.query.skip) || 0;

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
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
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
/**
 * 🔥 SMART SEARCH API
 */
router.get("/search", async (req, res) => {
  try {

    const query =
      req.query.q?.trim().toLowerCase();

    /* =========================
      NORMALIZE WORDS
    ========================= */

    const words =
      query.split(" ");

    const normalizedWords =
      words.map(word => {

        // cars -> car
        if (word.endsWith("s")) {
          return word.slice(0, -1);
        }

        return word;
      });

    const normalizedQuery =
      normalizedWords.join(" ");

    /* =========================
       SMART TEXT SEARCH
    ========================= */

    let results = await PngImage.find(

      {
        $text: {
          $search: normalizedQuery
        }
      },

      {
        score: {
          $meta: "textScore"
        }
      }

      );

    /* =========================
       EXACT MATCH BOOST
    ========================= */

    const cleanQuery =
      query.toLowerCase();

    results = results.sort((a, b) => {

      const aExact =
        a.title?.toLowerCase() === cleanQuery
          ? 100
          : 0;

      const bExact =
        b.title?.toLowerCase() === cleanQuery
          ? 100
          : 0;

      return (
        ((b.score || 0) + bExact) -
        ((a.score || 0) + aExact)
      );
    });

    /* =========================
      SORT TYPE
    ========================= */

    const sortType =
      req.query.sort || "relevant";

    /* DEFAULT RELEVANT */

    if (sortType === "relevant") {

      results = results.sort((a, b) => {

        return (
          (b.score || 0) -
          (a.score || 0)
        );
      });
    }

    /* NEWEST */

    else if (sortType === "newest") {

      results = results.sort((a, b) => {

        return (
          new Date(b.createdAt) -
          new Date(a.createdAt)
        );
      });
    }

    /* POPULAR */

    else if (sortType === "popular") {

      results = results.sort((a, b) => {

        return (
          (b.downloads || 0) -
          (a.downloads || 0)
        );
      });
    }
    /* LIMIT */

    results =
      results.slice(0, 50);

    /* =========================
      FUZZY SEARCH FALLBACK
    ========================= */

    if (results.length === 0) {

      const allImages =
        await PngImage.find({})
        .limit(1000);

      const fuse =
        new Fuse(allImages, {

          keys: [
            "title",
            "tags",
            "keywords",
            "category"
          ],

          threshold: 0.35,

          includeScore: true
        });

      const fuzzyResults =
        fuse.search(normalizedQuery)
        
      results =
        fuzzyResults
          .slice(0, 30)
          .map(r => r.item);
    }

    /* =========================
       FIX CDN URLS
    ========================= */

    const updated = results.map(png => ({

      ...png.toObject(),

      thumbUrl: fixUrl(png.thumbUrl)

    }));

    res.set("Cache-Control", "no-store");
    res.json(updated);
    
  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Search failed"
    });
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

    const words =
      current.title
        .split(" ")
        .filter(w => w.length > 2)
        .slice(0, 4);

    const regex =
      words.join("|");

    let related = await PngImage.find({
      slug: { $ne: slug },
      title: {
        $regex: regex,
        $options: "i"
      }
    })
    .limit(20);

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

module.exports = router;