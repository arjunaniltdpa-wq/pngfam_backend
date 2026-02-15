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

  const slug = slugify(`${base} png transparent background`);

  const title = `${base} PNG Transparent Background`;
  const h1 = title;

  /* 🔥 STRONG SEO DESCRIPTION */
  const description =
    `Download ${base} PNG with transparent background in high resolution. ` +
    `Free ${base} transparent PNG perfect for graphic design, web design, presentations, posters, and creative projects. ` +
    `High-quality ${base} PNG image available for free download and commercial use.`;

  const alt = `${base} png transparent background`;

  const tags = [
    `${base} png`,
    `${base} transparent png`,
    "transparent png",
    "png image",
    "free png",
    "png download",
    "transparent background",
    "high quality png",
    "design resource"
  ];

  return {
    slug,
    title,
    description,
    h1,
    alt,
    tags
  };
}

module.exports = { generateSEOFromFilename };
