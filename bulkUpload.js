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

      // 🔑 SEO-based filename (LIKE YOUR IMAGE SITE)
      const timestamp = Date.now();
      const baseName = `${timestamp}-${seo.slug}`;

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
        originalUrl,
        previewUrl,
        thumbUrl,
        width,
        height
      });

      console.log("✅ Uploaded:", baseName);
    }

    console.log("🎉 BULK UPLOAD COMPLETED");
    process.exit(0);

  } catch (err) {
    console.error("❌ Bulk upload failed:", err);
    process.exit(1);
  }
})();
