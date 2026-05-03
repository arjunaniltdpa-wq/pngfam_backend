function cleanText(text) {
  return text
    .replace(/[-_]/g, " ")
    .replace(/\b(png|transparent|background|pngfam)\b/gi, "") // 🔥 remove junk
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateSEOFromFilename(filename) {
  const base = cleanText(filename);

  const title = base; // clean human title
  const slug = slugify(base);

  const description =
    `Download ${base} PNG with transparent background in high resolution. ` +
    `Perfect for graphic design, websites, ads, and creative projects.`;

  const alt = base;

  const tags = [
    base,
    `${base} png`,
    `${base} transparent`,
    "png image",
    "free png"
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