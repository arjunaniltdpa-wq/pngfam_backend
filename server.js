require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { connectDB } = require("./lib/db");
const pngRoutes = require("./routes/pngRoutes");
const PngImage = require("./models/PngImage");

const app = express();

const homeRoutes = require("./routes/homeRoutes");

const compression = require("compression");

/* CORS */
app.use(cors({ origin: "*" }));

app.use(express.json());

app.use(compression());

/* OG routes */
const ogRoutes = require("./routes/ogRoutes");
app.use("/api/og", ogRoutes);

/* Connect DB */
connectDB();

/* Redirect old query URLs */
app.get("/image", (req, res) => {
  if (req.query.slug) {
    return res.redirect(301, `/image/${req.query.slug}`);
  }
  res.redirect("/");
});

const fs = require("fs");

const getVariant = (text, total) => {
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  return Math.abs(hash % total);
};

app.get("/image/:slug", async (req, res) => {

  res.set("Cache-Control", "public, max-age=86400");
  
  const png = await PngImage.findOne({
    slug: req.params.slug
  }).lean();

  if (!png) {
    return res.status(404).send("Not found");
  }

  const relatedPngs = await PngImage.find({
    tags: { $in: png.tags || [] },
    slug: { $ne: png.slug }
  })
  .limit(12)
  .lean();
  const relatedHtml = relatedPngs.map(item => `

  <a href="/image/${item.slug}" class="card-link">

    <div class="card">

      <div class="card-image">

        <img
          loading="lazy"
          decoding="async"
          width="300"
          height="300"
          src="${item.thumbUrl}"
          alt="${item.title} transparent PNG">

      </div>

      <div class="card-title">
        ${item.title}
      </div>

    </div>

  </a>

  `).join("");


  // Load your existing HTML file
  let html = fs.readFileSync(
    path.join(__dirname, "public", "image.html"),
    "utf-8"
  );
  html = html.replace(
    '<link rel="canonical" id="canonicalLink" href="">',
    `<link rel="canonical" href="https://www.pngfam.com/image/${png.slug}">`

  );
  html = html.replace(
    '<meta property="og:description" content="Download high-quality PNG with transparent background.">',
    `<meta property="og:description" content="Download ${png.title} PNG with transparent background in HD quality.">`
  );

  // Inject SEO (IMPORTANT)
  const titleTemplates = [

    `${png.title} Transparent PNG Background Image`,
    `Free ${png.title} PNG HD Download`,
    `${png.title} Cutout PNG for Graphic Design`,
    `${png.title} Isolated Transparent PNG`,
    `${png.title} High Resolution PNG Asset`,
    `${png.title} Transparent Background Graphic`,
    `${png.title} PNG Clipart for Creative Projects`,
    `${png.title} Premium Transparent PNG Image`,
    `${png.title} PNG Free Download`,
    `${png.title} HD Transparent Background PNG`,
    `${png.title} Transparent PNG for Designers`,
    `${png.title} Ultra HD PNG Image`,
    `${png.title} Transparent Graphic Resource`,
    `${png.title} PNG with Transparent Background`,
    `${png.title} Commercial Use Transparent PNG`,
    `${png.title} Professional PNG Graphic`,
    `${png.title} Transparent Cutout Image`,
    `${png.title} Creative Transparent PNG Asset`,
    `${png.title} PNG Design Resource`,
    `${png.title} Editable Transparent PNG`,
    `${png.title} Transparent PNG for Photoshop`,
    `${png.title} High Quality PNG Image`,
    `${png.title} Background Removed PNG`,
    `${png.title} Transparent Artwork PNG`,
    `${png.title} Isolated Graphic PNG`,
    `${png.title} Transparent PNG for Websites`,
    `${png.title} Free Transparent Graphic`,
    `${png.title} Premium PNG Download`,
    `${png.title} Transparent PNG for Branding`,
    `${png.title} HD PNG Graphic Asset`

  ];

  html = html.replace(
    "<title>Free Transparent PNG Images Download HD</title>",

    `<title>${
      titleTemplates[
        getVariant(png.slug, titleTemplates.length)
      ]
    }</title>`
  );

  html = html.replace(
    '<meta property="og:title" content="Free Transparent PNG Image Download">',
    `<meta property="og:title" content="${png.title} PNG Transparent Background">`
  );

  html = html.replace(
    /<meta property="og:image" content=".*?">/,
    `<meta property="og:image" content="${png.previewUrl || png.originalUrl}">`
  );

  html = html.replace(
    /<meta property="og:image:secure_url" content=".*?">/,
    `<meta property="og:image:secure_url" content="${png.previewUrl || png.originalUrl}">`
  );

  html = html.replace(
    /<meta name="twitter:image" content=".*?">/,
    `<meta name="twitter:image" content="${png.previewUrl || png.originalUrl}">`
  );

  html = html.replace(
    /<meta property="og:url" content=".*?">/,
    `<meta property="og:url" content="https://www.pngfam.com/image/${png.slug}">`
  );

  html = html.replace(
    /<meta name="twitter:title" content=".*?">/,
    `<meta name="twitter:title" content="${png.title} PNG Transparent Background">`
  );

  html = html.replace(
    /<meta name="twitter:description" content=".*?">/,
    `<meta name="twitter:description" content="Download ${png.title} PNG with transparent background in HD quality.">`
  );

  html = html.replace(
    '<meta property="og:url" content="">',
    `<meta property="og:url" content="https://www.pngfam.com/image/${png.slug}">`
  );

  html = html.replace(
    'content="Download high-quality transparent PNG images in HD resolution. Free PNG images for graphic design, websites, and creative projects."',
    `content="${
    [
    `Download ${png.title} PNG with transparent background in HD quality.`,
    `Free ${png.title} transparent PNG image for graphic design and websites.`,
    `${png.title} PNG free download with transparent background.`,
    `High-quality ${png.title} transparent PNG image in HD resolution.`,
    `${png.title} PNG transparent background for creative projects and digital design.`
    ][getVariant(png.slug, 5)]
    }"`
  );

  html = html.replace(

  "{{MAIN_IMAGE}}",

  `
  <div class="image-preview checker-bg">

    <picture>

      <source
        type="image/webp"
        srcset="${png.previewUrl || png.originalUrl}">

      <img
        id="mainPreview"
        itemprop="image"
        src="${png.originalUrl}"
        alt="${png.title} transparent PNG"
        width="1200"
        height="1200"
        fetchpriority="high"
        loading="eager"
        decoding="async"
        style="width:100%;height:auto;display:block;">

    </picture>

    <p class="image-caption">

      ${png.title}
      transparent PNG image with high-quality isolated background.

    </p>

  </div>
  `

  );
  const h1Templates = [

    `${png.title} PNG Transparent Background`,
    `${png.title} Transparent PNG Image`,
    `${png.title} PNG Free Download`,
    `${png.title} HD Transparent PNG`,
    `${png.title} PNG Background Transparent`

  ];
  html = html.replace(

  "{{TITLE}}",

  h1Templates[
    getVariant(
      png.slug,
      h1Templates.length
    )
  ]

  );

  const generateDescription = (png) => {

    const title = png.title;
    const tags = png.tags || [];

    const keywords =
      tags.slice(0, 8).join(", ");

    let category = "design asset";
    let usage = "graphic design projects";

    const lower =
      title.toLowerCase();

    /* =========================
      SEO TITLES (30)
    ========================= */

    const seoTitles = [

      `${title} Transparent PNG Image`,
      `${title} PNG Free Download`,
      `${title} HD Transparent Background PNG`,
      `${title} Isolated PNG Graphic`,
      `${title} Transparent Background Image`,
      `${title} High Resolution PNG Asset`,
      `${title} Transparent PNG for Designers`,
      `${title} Professional PNG Graphic`,
      `${title} Transparent Cutout PNG`,
      `${title} PNG Graphic Resource`,
      `${title} Premium Transparent PNG`,
      `${title} Creative PNG Asset`,
      `${title} Transparent PNG Download`,
      `${title} PNG with Transparent Background`,
      `${title} Commercial Use PNG`,
      `${title} Transparent Artwork PNG`,
      `${title} PNG for Photoshop`,
      `${title} Ultra HD Transparent PNG`,
      `${title} PNG for Creative Projects`,
      `${title} Isolated Transparent Image`,
      `${title} Background Removed PNG`,
      `${title} Transparent Graphic Resource`,
      `${title} Free Transparent Graphic`,
      `${title} High Quality Transparent PNG`,
      `${title} Professional Design PNG`,
      `${title} Transparent PNG for Branding`,
      `${title} Designer Resource PNG`,
      `${title} Transparent PNG Illustration`,
      `${title} Studio Quality PNG`,
      `${title} Editable Transparent PNG`

    ];

    /* =========================
      INTRO LINES (30)
    ========================= */

    const introLines = [

      `Download high-resolution ${title} transparent PNG image with clean transparent background.`,

      `Explore premium ${title} PNG image optimized for creative design projects.`,

      `Free transparent ${title} PNG graphic with sharp details and isolated background.`,

      `${title} PNG transparent background image suitable for modern digital design workflows.`,

      `Professional ${title} transparent PNG asset for branding, websites and creative media.`,

      `${title} transparent PNG image available in high quality for free download.`,

      `Creative ${title} PNG graphic designed for professional editing and visual content.`,

      `Discover ultra HD ${title} PNG with isolated transparent background.`,

      `${title} PNG resource perfect for designers, creators and digital artists.`,

      `Download premium quality ${title} transparent image for branding and media projects.`,

      `${title} isolated PNG image with clean cutout edges and transparent background.`,

      `Free high-quality ${title} PNG suitable for modern graphic workflows.`,

      `${title} PNG clipart optimized for commercial and personal projects.`,

      `Professional transparent ${title} image for websites, thumbnails and presentations.`,

      `${title} transparent PNG graphic with studio-quality cutout details.`,

      `Download editable ${title} PNG image with transparent background.`,

      `${title} PNG file ideal for posters, social media and digital branding.`,

      `Transparent ${title} graphic asset designed for creative professionals.`,

      `${title} HD PNG image with sharp transparent cutout.`,

      `Free ${title} PNG download optimized for Photoshop and editing software.`,

      `${title} transparent image resource for designers and content creators.`,

      `Download clean transparent ${title} PNG artwork in ultra HD quality.`,

      `${title} transparent PNG optimized for websites and digital media.`,

      `Professional-grade ${title} PNG image for commercial design projects.`,

      `Transparent ${title} PNG image for branding, advertising and editing.`,

      `${title} PNG asset with high-quality isolated transparent background.`,

      `Download premium ${title} transparent PNG with crisp details.`,

      `${title} PNG image crafted for modern visual design projects.`,

      `Free ultra HD ${title} transparent graphic resource.`,

      `${title} isolated transparent PNG ideal for creative compositions.`

    ];

    /* =========================
      DESIGNER LINES (30)
    ========================= */

    const designerLines = [

      `Ideal for graphic designers, marketers and creative studios.`,
      `Perfect for branding presentations and social media graphics.`,
      `Useful for website banners, posters and creative compositions.`,
      `Designed for professional digital artwork and editing workflows.`,
      `Suitable for Photoshop edits, thumbnails and commercial designs.`,
      `Optimized for content creators and creative agencies.`,
      `Perfect for advertising campaigns and branding visuals.`,
      `Useful for print design and online creative projects.`,
      `Suitable for creative professionals and visual designers.`,
      `Ideal for digital art and multimedia presentations.`,
      `Designed for modern UI design and promotional media.`,
      `Perfect for YouTube thumbnails and social media creatives.`,
      `Useful for web design and transparent overlays.`,
      `Suitable for modern visual communication projects.`,
      `Ideal for business graphics and digital campaigns.`,
      `Perfect for online stores and branding assets.`,
      `Useful for editorial design and visual storytelling.`,
      `Optimized for creative branding workflows.`,
      `Ideal for professional presentations and marketing.`,
      `Perfect for posters and graphic compositions.`,
      `Suitable for commercial creative projects.`,
      `Designed for high-end digital media production.`,
      `Useful for premium visual branding.`,
      `Ideal for modern graphic assets and layouts.`,
      `Perfect for transparent visual effects and overlays.`,
      `Suitable for promotional graphics and advertisements.`,
      `Designed for creators, editors and agencies.`,
      `Useful for digital marketing materials.`,
      `Perfect for cinematic design compositions.`,
      `Ideal for scalable creative workflows.`

    ];

    /* =========================
      CATEGORY DETECTION
    ========================= */

    if (
      lower.includes("shirt") ||
      lower.includes("hoodie") ||
      lower.includes("fashion")
    ) {

      category = "fashion apparel";

      usage =
        "fashion branding, clothing mockups, print-on-demand projects, apparel advertisements and streetwear presentations";
    }

    else if (
      lower.includes("car") ||
      lower.includes("bike")
    ) {

      category = "automotive graphic";

      usage =
        "automotive branding, racing posters, transport graphics, YouTube thumbnails and vehicle design projects";
    }

    else if (
      lower.includes("anime")
    ) {

      category = "anime artwork";

      usage =
        "anime edits, manga artwork, gaming thumbnails, wallpapers and Japanese themed creative projects";
    }

    else if (
      lower.includes("flower") ||
      lower.includes("rose")
    ) {

      category = "floral graphic";

      usage =
        "greeting cards, floral branding, wedding invitations, wallpapers and botanical design projects";
    }

    else if (
      lower.includes("logo")
    ) {

      category = "logo graphic";

      usage =
        "branding projects, company presentations, websites, business graphics and marketing materials";
    }

    else if (
      lower.includes("food")
    ) {

      category = "food graphic";

      usage =
        "restaurant branding, menu designs, food advertisements, delivery apps and culinary presentations";
    }

    else if (
      lower.includes("gaming") ||
      lower.includes("game")
    ) {

      category = "gaming graphic";

      usage =
        "gaming thumbnails, streaming overlays, esports branding, wallpapers and gaming content creation";
    }

    else if (
      lower.includes("abstract")
    ) {

      category = "abstract artwork";

      usage =
        "modern graphic design, website backgrounds, posters, creative branding and digital artwork";
    }

    return `
    
    <div class="seo-article">

      <h2>
        ${seoTitles[getVariant(title, seoTitles.length)]}
      </h2>

      <p>
        ${introLines[getVariant(title + "intro", introLines.length)]}

        This ${category} is suitable for ${usage}.

        ${designerLines[getVariant(title + "designer", designerLines.length)]}
      </p>

      <h3>
        PNG Specifications
      </h3>

      <table class="seo-table">

        <tr>
          <td>File Format</td>
          <td>PNG</td>
        </tr>

        <tr>
          <td>Background</td>
          <td>Transparent</td>
        </tr>

        <tr>
          <td>Resolution</td>
          <td>${png.width} × ${png.height}</td>
        </tr>

        <tr>
          <td>Category</td>
          <td>${category}</td>
        </tr>

      </table>

      <h3>
        Popular Uses
      </h3>

      <ul class="seo-list">

        <li>Graphic design</li>
        <li>Social media creatives</li>
        <li>Website design</li>
        <li>YouTube thumbnails</li>
        <li>Branding projects</li>

      </ul>

      <h3>
        Related Keywords
      </h3>

      <p class="keyword-cloud">
        ${keywords}
      </p>

      <h3>
        People Also Search
      </h3>

      <div class="related-searches">

        ${(tags || []).slice(0, 6).map(tag => `
          <a href="/search?q=${encodeURIComponent(tag)}">
            ${tag} transparent PNG
          </a>
        `).join("")}

      </div>

    </div>

    `;
  };

  const dynamicLinks = (png.tags || [])
    .slice(0, 6)
    .map(tag => {

      return `
        <a class="tag-link"
        href="/search?q=${encodeURIComponent(tag)}">
        ${tag}
        </a>
      `;

    })
    .join("");
    
    html = html.replace(
      '<div id="dynamicSeoContent"></div>',
      generateDescription(png)
    );

  const keywordLinks = `
    <div class="seo-links">

      <a href="/search?q=${encodeURIComponent(png.title)}">
        More ${png.title} PNG
      </a>

      ${dynamicLinks}

    </div>
  `;

  html = html.replace(
    "</div>\n\n      <a class=\"download-btn\"",
    `${keywordLinks}
    
        <a class="download-btn"`
  );

  const schema = {
    "@context": "https://schema.org",

    "@type": "ImageObject",

    "representativeOfPage": true,

    "name": png.title,

    "description":
      `Download ${png.title} PNG with transparent background in HD quality.`,

    "image": png.previewUrl || png.originalUrl,

    "caption":
    `${png.title} transparent PNG image`,

    "headline":
    `${png.title} PNG Transparent Background`,

    "contentUrl":
      png.originalUrl,

    "thumbnailUrl":
      png.thumbUrl || png.previewUrl,

    "width":
      png.width || 1200,

    "height":
      png.height || 1200,

    "encodingFormat":
      "image/png",

    "license":
      "https://www.pngfam.com/license",

    "acquireLicensePage":
      "https://www.pngfam.com/license",

    "url":
      `https://www.pngfam.com/image/${png.slug}`,

    "creditText":
      "PNGfam",

    "copyrightNotice":
      "PNGfam",

    "keywords":
      png.tags?.join(", "),

    "genre":
      "Transparent PNG",

    "inLanguage":
      "en",

    "isAccessibleForFree":
      true,

    "author": {
      "@type": "Organization",
      "name": "PNGfam"
    },

    "creator": {
      "@type": "Organization",
      "name": "PNGfam"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.pngfam.com/image/${png.slug}`
    },
    
    "embedUrl":
    `https://www.pngfam.com/image/${png.slug}`,

    "publisher": {
      "@type": "Organization",

      "name": "PNGfam",

      "logo": {
        "@type": "ImageObject",

        "url":
          "https://www.pngfam.com/images/logo.png"
      }
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.pngfam.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "PNG Images",
        "item": "https://www.pngfam.com/search?q=png"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": png.title,
        "item": `https://www.pngfam.com/image/${png.slug}`
      }
    ]
  };

  html = html.replace(

  '<div class="grid"></div>',

  `<div class="grid">
  ${relatedHtml}
  </div>`

  );

  html = html.replace(
    "</head>",
    `
  <link rel="image_src"
  href="${png.previewUrl || png.originalUrl}">

    <script type="application/ld+json">
  ${JSON.stringify(schema)}
  </script>

  <script type="application/ld+json">
  ${JSON.stringify(breadcrumbSchema)}
  </script>

  <link rel="preload"
  as="image"
  href="${png.previewUrl || png.originalUrl}"
  fetchpriority="high">

  </head>`
  );

  const tagsHtml = (png.tags || [])

  .map(tag => `

  <a
  class="tag-link"
  href="/search?q=${encodeURIComponent(tag)}">

  ${tag}

  </a>

  `).join("");

  html = html.replace(

  '<div class="tags"></div>',

  `<div class="tags">
  ${tagsHtml}
  </div>`

  );

  html = html.replace(

  "{{BREADCRUMB}}",

  png.title

  );

  html = html.replace(
  '{{DIMENSIONS}}',
  `${png.width} × ${png.height}`
  );

    res.send(html);
});

// 🔥 CATEGORY PAGE ROUTE
app.get("/category/:name", async (req, res) => {
  const category = req.params.name.replace(/-/g, " ");

  const pngs = await PngImage.find({
    title: { $regex: category, $options: "i" }
  })
  .limit(100)
  .lean();

  let html = fs.readFileSync(
    path.join(__dirname, "public", "category.html"),
    "utf-8"
  );

  let gridHTML = "";

  pngs.forEach(png => {
    gridHTML += `
      <a href="/image/${png.slug}" class="card-link">
        <div class="card png-bg">
          <div class="card-image">
            <img src="${png.thumbUrl}" alt="${png.title}" loading="lazy">
          </div>
          <div class="card-title">${png.title}</div>
        </div>
      </a>
    `;
  });

  html = html.replace("{{CATEGORY_TITLE}}", category.toUpperCase());
  const categoryLower =
  category.toLowerCase();

  let categoryDescription =
  `Browse high-quality ${category} transparent PNG images with isolated backgrounds for creative projects, branding, websites and graphic design workflows.`;

  let categoryUsage =
  `Perfect for graphic designers, content creators, digital artists and branding professionals.`;

  if (
    categoryLower.includes("car")
  ) {

    categoryDescription =
    `Explore premium car PNG images with transparent backgrounds in HD quality. Download sports cars, luxury vehicles, racing graphics and automotive transparent PNG assets for creative projects.`;

    categoryUsage =
    `Perfect for automotive branding, racing posters, transport graphics, wallpapers and YouTube thumbnails.`;
  }

  else if (
    categoryLower.includes("anime")
  ) {

    categoryDescription =
    `Discover high-quality anime PNG images with transparent backgrounds for edits, wallpapers and digital artwork.`;

    categoryUsage =
    `Suitable for anime edits, manga artwork, gaming content, streaming graphics and Japanese themed creative projects.`;
  }

  else if (
    categoryLower.includes("logo")
  ) {

    categoryDescription =
    `Download transparent logo PNG images in HD quality for branding and business projects.`;

    categoryUsage =
    `Perfect for websites, business presentations, brand identity systems and marketing graphics.`;
  }

  else if (
    categoryLower.includes("flower")
  ) {

    categoryDescription =
    `Browse beautiful flower PNG images with transparent backgrounds for floral and decorative designs.`;

    categoryUsage =
    `Ideal for wedding invitations, greeting cards, wallpapers, botanical artwork and decorative branding.`;
  }

  else if (
    categoryLower.includes("gaming")
  ) {

    categoryDescription =
    `Explore gaming PNG images with transparent backgrounds for esports, streaming and gaming content creation.`;

    categoryUsage =
    `Perfect for gaming thumbnails, streaming overlays, esports branding and YouTube content.`;
  }

  const categorySeo = `

  <section class="category-seo">

    <h1>
      ${category.toUpperCase()} PNG Images
    </h1>

    <p>
      ${categoryDescription}
    </p>

    <p>
      ${categoryUsage}
    </p>

    <div class="category-keywords">

      <a href="/search?q=${encodeURIComponent(category)} png">
        ${category} PNG
      </a>

      <a href="/search?q=${encodeURIComponent(category)} transparent png">
        ${category} transparent PNG
      </a>

      <a href="/search?q=${encodeURIComponent(category)} hd png">
        ${category} HD PNG
      </a>

      <a href="/search?q=${encodeURIComponent(category)} background removed png">
        ${category} background removed PNG
      </a>

    </div>

  </section>

  <section class="category-grid">

    ${gridHTML}

  </section>

  `;

  html = html.replace(
    "{{GRID}}",
    categorySeo
  );
  res.send(html);
});

/* Static frontend */
app.use(express.static(path.join(__dirname, "public")));
app.use("/", homeRoutes);

/* API */
app.use("/api/pngs", pngRoutes);
/* =========================
   XML ESCAPE HELPER
========================= */
const escapeXml = (str = "") =>
  str.replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&apos;");


/* =========================
   STATIC PAGES SITEMAP
========================= */
app.get("/sitemap-static.xml", (req, res) => {
  res.set("Content-Type", "application/xml");
  res.set("Cache-Control", "public, max-age=86400");

  const baseUrl = "https://www.pngfam.com";
  const now = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy-policy</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.2</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.2</priority>
  </url>
  <url>
    <loc>${baseUrl}/license</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.2</priority>
  </url>
  <url>
    <loc>${baseUrl}/dmca</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.2</priority>
  </url>
</urlset>`;

  res.send(xml);
});


/* =========================
   IMAGE SITEMAP (PAGINATED - SEO ULTRA)
========================= */
app.get("/sitemap-images-:page.xml", async (req, res) => {
  try {
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=43200");
    res.set("Last-Modified", new Date().toUTCString());

    const page = parseInt(req.params.page) || 1;
    const limit = 100;
    const skip = (page - 1) * limit;

    const totalImages = await PngImage.countDocuments();
    if (skip >= totalImages) {
      return res.status(404).send("Not Found");
    }
    const pngs = await PngImage.find({})
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit)
      .select("slug updatedAt originalUrl")
      .lean();

    const baseUrl = "https://www.pngfam.com";

    const fixUrl = (url) => {
      if (!url) return "";
      if (url.startsWith("http")) return url;
      if (!url.startsWith("/")) url = "/" + url;
      return `https://cdn.pngfam.com${url}`;
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    pngs.forEach((png) => {
      const cleanTitle = png.slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());

      const originalUrl = fixUrl(png.originalUrl);

      // preview (checker background webp)
      const previewUrl = originalUrl
        .replace("/originals/", "/previews/")
        .replace(".png", ".webp");

      // optional small thumbnail
      const thumbUrl = previewUrl.replace("/previews/", "/thumbs/");

      const caption =
      `${cleanTitle} transparent PNG image with high-quality transparent background.`;

      const ageDays = (Date.now() - new Date(png.updatedAt)) / (1000 * 60 * 60 * 24);
      const changefreq = ageDays < 30 ? "weekly" : "yearly";

      xml += `
  <url>
    <loc>${baseUrl}/image/${escapeXml(png.slug)}</loc>
    <lastmod>${png.updatedAt?.toISOString() || new Date().toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>0.8</priority>

    <image:image>
      <image:loc>${escapeXml(previewUrl)}</image:loc>
      <image:title>${escapeXml(cleanTitle)}</image:title>
      <image:caption>${escapeXml(caption)}</image:caption>
      <image:license>${baseUrl}/license</image:license>
    </image:image>

  </url>`;
    });

    xml += `
</urlset>`;

    res.send(xml);

  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});


/* =========================
   MAIN SITEMAP INDEX
========================= */
app.get("/sitemap.xml", async (req, res) => {
  res.set("Content-Type", "application/xml");
  res.set("Cache-Control", "public, max-age=86400");
  res.set("Last-Modified", new Date().toUTCString());

  const baseUrl = "https://www.pngfam.com";
  const totalImages = await PngImage.countDocuments();
  const limit = 100;
  const totalPages = Math.ceil(totalImages / limit);
  const now = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`;

  for (let i = 1; i <= totalPages; i++) {
    xml += `
  <sitemap>
    <loc>${baseUrl}/sitemap-images-${i}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`;
  }

  xml += `
</sitemapindex>`;

  res.send(xml);
});

/* =========================
   START SERVER (RENDER FIX)
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 PNG backend running on port ${PORT}`);
});
