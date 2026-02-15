const express = require("express");
const router = express.Router();
const PngImage = require("../models/PngImage");

const CDN = "https://cdn.pngfam.com";

const addSlash = (url) => {
  if (!url) return "";
  return url.startsWith("/") ? url : "/" + url;
};

router.get("/:slug", async (req, res) => {
  try {
    const png = await PngImage.findOne({ slug: req.params.slug });
    if (!png) return res.status(404).send("Not found");

    const imageUrl = CDN + addSlash(png.previewUrl || png.originalUrl);

    const html = `
      <html>
        <head>
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
        </head>
        <body>
          <img src="${imageUrl}" />
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
