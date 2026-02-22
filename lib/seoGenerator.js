function cleanText(text) {
  return text
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-");
}

function generateSEOFromFilename(filename) {
  const base = cleanText(filename);

  // 🔥 CLEAN TITLE (NO "png transparent background")
  const title = base;

  const slug = slugify(base);

  const description =
    `Download ${base} PNG with transparent background in high resolution. ` +
    `Free ${base} transparent PNG perfect for graphic design, web design, presentations, posters, and creative projects.`;

  const alt = `${base} png`;

  const tags = [
    `${base} png`,
    `${base} transparent png`,
    "transparent png",
    "png image",
    "free png",
    "png download",
    "high quality png",
    "design resource"
  ];

  return {
    slug,
    title,
    description,
    h1: title,
    alt,
    tags
  };
}

module.exports = { generateSEOFromFilename };