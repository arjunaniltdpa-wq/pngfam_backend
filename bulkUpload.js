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

    // 2️⃣ image-to-upload folder (root level)
    const folder = path.join(__dirname, "image-to-upload");

    if (!fs.existsSync(folder)) {
      console.error("❌ image-to-upload folder not found");
      process.exit(1);
    }

    const files = fs
      .readdirSync(folder)
      .filter(f => f.toLowerCase().endsWith(".png"));

    if (files.length === 0) {
      console.log("⚠️ No PNG files found");
      process.exit(0);
    }

    // 3️⃣ Process each PNG
    for (const file of files) {
      console.log("🖼️ Processing:", file);

      const buffer = fs.readFileSync(path.join(folder, file));

      // SEO from filename
      const name = path.basename(file, ".png");
      const seo = generateSEOFromFilename(name);

      // 🔥 CLEAN BASE NAME (NO RANDOMNESS)
      let baseName = seo.slug;

      // ensure unique
      let counter = 1;
      while (await PngImage.findOne({ slug: baseName })) {
        baseName = `${seo.slug}-${counter}`;
        counter++;
      }

      // Image processing
      const { preview, thumb, width, height } = await processPNG(buffer);

      // Upload to R2 with SEO names
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

      // Save to MongoDB
      await PngImage.create({
        ...seo,
        slug: baseName, // 🔥 IMPORTANT
        originalUrl,
        previewUrl,
        thumbUrl,
        width,
        height
      });

      console.log("✅ Uploaded:", baseName);
    }

    console.log("🎉 BULK UPLOAD COMPLETED");

    // ✅ ping before exit (your previous version never reached this)
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