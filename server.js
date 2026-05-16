require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { connectDB } = require("./lib/db");
const pngRoutes = require("./routes/pngRoutes");
const PngImage = require("./models/PngImage");

const app = express();

const homeRoutes = require("./routes/homeRoutes");

/* CORS */
app.use(cors({ origin: "*" }));

app.use(express.json());

/* OG routes */
const ogRoutes = require("./routes/ogRoutes");
app.use("/api/og", ogRoutes);

app.use("/", homeRoutes);

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
  const png = await PngImage.findOne({ slug: req.params.slug });
  
  if (!png) {
    return res.status(404).send("Not found");
  }

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
  html = html.replace(
    "<title>Free Transparent PNG Images Download HD</title>",
    `<title>${
        [
          `${png.title} Transparent PNG Background Image`,
          `Free ${png.title} PNG HD Download`,
          `${png.title} Cutout PNG for Graphic Design`,
          `${png.title} Isolated Transparent PNG`,
          `${png.title} High Resolution PNG Asset`,
          `${png.title} Transparent Background Graphic`,
          `${png.title} PNG Clipart for Creative Projects`,
          `${png.title} Premium Transparent PNG Image`
        ][getVariant(png.slug, 5)]
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

  // Inject IMAGE + TITLE directly (CRITICAL)
  html = html.replace(
    /<img id="mainPreview"[^>]*>/,
    `<img id="mainPreview"
      src="${png.previewUrl || png.originalUrl}"
      alt="${
      [
      `${png.title} transparent PNG`,
      `${png.title} PNG free download`,
      `${png.title} high quality transparent image`,
      `${png.title} PNG background transparent`,
      `${png.title} cutout PNG image`
      ][getVariant(png.slug, 5)]
      }"
      width="1200"
      height="1200"
      loading="eager"
      decoding="async"
      style="width:100%;height:auto;display:block;">`
  );

  html = html.replace(
    "<h1>Free Transparent PNG Image</h1>",
    `<h1>${
      [
        `${png.title} PNG Transparent Background`,
        `${png.title} Transparent PNG Image`,
        `${png.title} PNG Free Download`,
        `${png.title} HD Transparent PNG`,
        `${png.title} PNG Background Transparent`
      ][getVariant(png.slug, 5)]
    }</h1>`
  );

  const tagsHTML = (png.tags || [])
    .map(tag =>
      `<a href="/search?q=${encodeURIComponent(tag)}">${tag}</a>`
    )
    .join("");

  html = html.replace(
    '<div class="tags"></div>',
    `<div class="tags">${tagsHTML}</div>`
  );

  const generateDescription = (title, tags = []) => {

    const keywords =
      tags.slice(0, 5).join(", ");

    const intros = [
      `Download high-quality ${title} PNG with transparent background.`,
      `Explore premium ${title} transparent PNG graphics.`,
      `Free HD ${title} PNG image for creative design projects.`,
      `${title} transparent PNG isolated on clean background.`,
      `Professional ${title} PNG asset for websites and branding.`
    ];

    const usage = [
      `Suitable for graphic design, websites, advertising, UI design, social media creatives, thumbnails and branding.`,
      `Perfect for posters, YouTube thumbnails, presentations, apps, mockups and digital marketing.`,
      `Optimized for designers, content creators, developers and commercial creative workflows.`,
      `Ideal for web projects, visual design systems, product mockups and digital artwork.`,
      `Useful for commercial graphics, online stores, banners, mobile apps and presentations.`
    ];

    const quality = [
      `Features clean transparent edges and high-resolution quality.`,
      `Includes sharp details with professionally optimized transparent cutout.`,
      `Designed with ultra HD clarity and smooth transparent borders.`,
      `Provides crisp transparent rendering suitable for modern digital media.`,
      `High-quality transparent PNG with professional visual optimization.`
    ];

    return `
      ${intros[getVariant(title, intros.length)]}
      ${usage[getVariant(title + "a", usage.length)]}
      ${quality[getVariant(title + "b", quality.length)]}
      Keywords: ${keywords}.
    `;
  };

  html = html.replace(
    /<p id="seoText">.*?<\/p>/,
    `<p id="seoText">${generateDescription(png.title)}</p>`
  );

  const dynamicLinks = (png.tags || [])
    .slice(0, 6)
    .map(tag => {

      return `
        <a href="/search?q=${encodeURIComponent(tag)}">
          ${tag} PNG
        </a>
      `;

    })
    .join("");

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

    "contentUrl":
      png.originalUrl || png.previewUrl,

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
    "</head>",
    `
  <script type="application/ld+json">
  ${JSON.stringify(schema)}
  </script>

  <script type="application/ld+json">
  ${JSON.stringify(breadcrumbSchema)}
  </script>

  </head>`
  );

    res.send(html);
});

/* Static frontend */
app.use(express.static(path.join(__dirname, "public")));


// 🔥 CATEGORY PAGE ROUTE
app.get("/category/:name", async (req, res) => {
  const category = req.params.name.replace(/-/g, " ");

  const pngs = await PngImage.find({
    title: { $regex: category, $options: "i" }
  }).limit(100);

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
  html = html.replace("{{GRID}}", gridHTML);

  res.send(html);
});

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

    const page = parseInt(req.params.page) || 1;
    const limit = 5000;
    const skip = (page - 1) * limit;

    const totalImages = await PngImage.countDocuments();
    if (skip >= totalImages) {
      return res.status(404).send("Not Found");
    }

    const pngs = await PngImage.find({})
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit)
      .select("slug updatedAt originalUrl");

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

      const keywords = [
        "graphic design",
        "web design",
        "advertisements",
        "social media posts",
        "presentations",
        "posters",
        "UI/UX design",
        "branding",
        "digital marketing",
        "creative projects"
      ].join(", ");

      const caption = `Download high-quality ${cleanTitle} PNG with transparent background in ultra HD resolution. 
      Free ${cleanTitle} transparent PNG perfect for graphic design, web design, advertisements, social media posts, presentations, posters, thumbnails, UI/UX design, branding, digital marketing and creative projects. 
      This premium royalty-free PNG image features sharp details, clean cutout edges and optimized colors suitable for designers, developers, bloggers and marketers. 
      Use this ${cleanTitle} PNG image for websites, apps, YouTube thumbnails, product mockups, presentations and professional marketing creatives requiring transparent background graphics.`;
      
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
  res.set("Cache-Control", "public, max-age=3600");

  const baseUrl = "https://www.pngfam.com";
  const totalImages = await PngImage.countDocuments();
  const limit = 5000;
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
