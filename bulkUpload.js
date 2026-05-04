require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const { processPNG } = require("./lib/imageProcessor");
const { uploadToR2 } = require("./lib/r2");
const { generateSEOFromFilename } = require("./lib/seoGenerator");
const PngImage = require("./models/PngImage");

(async () => {
  try {
    // 1️⃣ MongoDB connect
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected (bulk upload)");

    // 2️⃣ image-to-upload folder
    const folder = path.join(__dirname, "image-to-upload");

    if (!fs.existsSync(folder)) {
      console.error("❌ image-to-upload folder not found");
      process.exit(1);
    }

    const files = fs
      .readdirSync(folder)
      .filter(f => f.toLowerCase().endsWith(".png"));

    console.log(`📦 Total PNG files found: ${files.length}`);

    if (files.length === 0) {
      console.log("⚠️ No PNG files found");
      process.exit(0);
    }

    let processed = 0;

    // 3️⃣ Process each PNG
    for (const file of files) {
      console.log(`🖼️ Processing (${processed + 1}/${files.length}):`, file);

      const filePath = path.join(folder, file);
      const buffer = fs.readFileSync(filePath);

      // ORIGINAL NAME (KEEP THIS)
      const originalName = path.basename(file, ".png");

      // SEO from filename
      const seo = generateSEOFromFilename(originalName);

      // 🔥 SEO SLUG (USED FOR URL ONLY)
      let baseName = originalName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")   // clean
        .replace(/-+/g, "-")           // remove duplicate dashes
        .replace(/^-|-$/g, "");        // trim

      // optional: remove junk words like pngfam if needed
      baseName = baseName.replace(/pngfam/g, "");

      // 🔥 ensure important SEO words exist
      if (!baseName.includes("transparent")) {
        baseName += "-transparent";
      }
      if (!baseName.includes("png")) {
        baseName += "-png";
      }

      // ensure unique slug
      let counter = 1;
      while (await PngImage.findOne({ slug: baseName })) {
        baseName = `${seo.slug}-${counter}`;
        counter++;
      }

      // Image processing
      const { preview, thumb, width, height } = await processPNG(buffer);

      // Upload to R2
      const originalUrl = await uploadToR2(
        `originals/${baseName}.png`,
        buffer,
        "image/png"
      );

      const previewUrl = await uploadToR2(
        `previews/${baseName}.webp`,
        preview,
        "image/webp"
      );

      const thumbUrl = await uploadToR2(
        `thumbs/${baseName}.webp`,
        thumb,
        "image/webp"
      );

      // 🔥 CLEAN TITLE FROM ORIGINAL NAME (NO WORD LOSS)
      const cleanTitle = originalName
        .replace(/[-_]+/g, " ")
        .replace(/\bpngfam\b/gi, "") // remove pngfam only
        .replace(/\s+/g, " ")
        .trim();

      await PngImage.create({
        ...seo,
        title: cleanTitle, // ✅ OVERRIDE TITLE
        slug: baseName,
        originalName,
        originalUrl,
        previewUrl,
        thumbUrl,
        width,
        height
      });

      // ✅ DELETE FILE AFTER SUCCESS
      fs.unlinkSync(filePath);

      processed++;
      console.log(`✅ Uploaded (${processed}/${files.length}): ${baseName}`);
    }

    console.log("🎉 BULK UPLOAD COMPLETED");

    // Google ping
    const axios = require("axios");

    async function pingGoogle() {
      try {
        await axios.get("https://www.google.com/ping?sitemap=https://www.pngfam.com/sitemap.xml");
        console.log("🚀 Google pinged successfully");
      } catch (err) {
        console.error("Ping failed", err.message);
      }
    }

    await pingGoogle();

    process.exit(0);

  } catch (err) {
    console.error("❌ Bulk upload failed:", err);
    process.exit(1);
  }

})();