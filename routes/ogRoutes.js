const express = require("express");
const router = express.Router();
const PngImage = require("../models/PngImage");

const CDN = "https://cdn.pngfam.com";

const addSlash = (url) => {
  if (!url) return "";
  return url.startsWith("/") ? url : "/" + url;
};

const escapeHtml = (str = "") =>
  str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[m]);

router.get("/:slug", async (req, res) => {
  try {
    const png = await PngImage.findOne({ slug: req.params.slug });
    if (!png) return res.status(404).send("Not found");

    const safeTitle = escapeHtml(png.title);
    const imageUrl = CDN + addSlash(png.previewUrl || png.originalUrl);
    const pageUrl = `https://www.pngfam.com/image/${png.slug}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="index, follow, max-image-preview:large">

<title>${safeTitle} – Free Transparent PNG Download</title>

<meta name="description" content="Download ${safeTitle} PNG with transparent background. Free for commercial use.">

<link rel="canonical" href="${pageUrl}" />

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="${safeTitle} PNG Free Download">
<meta property="og:description" content="Download ${safeTitle} transparent PNG for free.">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="${png.width || 1200}">
<meta property="og:image:height" content="${png.height || 630}">
<meta property="og:image:alt" content="${safeTitle} transparent PNG">
<meta property="og:url" content="${pageUrl}">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle} PNG Free Download">
<meta name="twitter:description" content="Download ${safeTitle} transparent PNG for free.">
<meta name="twitter:image" content="${imageUrl}">
<meta name="twitter:image:alt" content="${safeTitle} transparent PNG">

<link rel="image_src" href="${imageUrl}">

<style>
  body {
    margin:0;
    width:1200px;
    height:630px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:Arial;
    background:
      linear-gradient(45deg,#eee 25%,transparent 25%),
      linear-gradient(-45deg,#eee 25%,transparent 25%),
      linear-gradient(45deg,transparent 75%,#eee 75%),
      linear-gradient(-45deg,transparent 75%,#eee 75%);
    background-size:40px 40px;
    background-position:0 0,0 20px,20px -20px,-20px 0;
  }
  img {
    max-width:80%;
    max-height:80%;
    object-fit:contain;
  }
</style>

<script>
  (function () {
    var ua = navigator.userAgent.toLowerCase();

    var isBot =
      /bot|crawler|spider|crawling/.test(ua) ||
      ua.includes("facebookexternalhit") ||
      ua.includes("twitterbot") ||
      ua.includes("whatsapp") ||
      ua.includes("pinterest") ||
      ua.includes("slackbot") ||
      ua.includes("discordbot");

    if (!isBot) {
      window.location.replace("/m/image/${png.slug}");
    }
  })();
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "name": "${safeTitle}",
  "contentUrl": "${imageUrl}",
  "url": "${pageUrl}",
  "width": "${png.width || 1200}",
  "height": "${png.height || 630}",
  "license": "https://www.pngfam.com/license"
}
</script>

</head>
<body>
  <img src="${imageUrl}" alt="${safeTitle}" />
</body>
</html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(html);

  } catch (err) {
    res.status(500).send("Error");
  }
});

module.exports = router;