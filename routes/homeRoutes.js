const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");

const PngImage = require("../models/PngImage");

router.get("/", async (req, res) => {

  try {

    const pngs = await PngImage.find({})
      .sort({ createdAt: -1 })
      .limit(30);

    let html = fs.readFileSync(
      path.join(__dirname, "../public/index.html"),
      "utf-8"
    );

    let gridHTML = "";

    pngs.forEach(png => {

      gridHTML += `
        <a href="/image/${png.slug}" class="card-link">
          <div class="card png-bg">

            <div class="card-image">
              <img
                src="${png.thumbUrl}"
                alt="${png.title} PNG transparent background"
                loading="lazy"
                width="400"
                height="400"
              >
            </div>

            <div class="card-title">
              ${png.title}
            </div>

          </div>
        </a>
      `;
    });

    html = html.replace(
      '<div class="masonry" id="pngGrid"></div>',
      `<div class="masonry" id="pngGrid">${gridHTML}</div>`
    );

    res.send(html);

  } catch (err) {

    console.error(err);
    res.status(500).send("Server Error");

  }

});

module.exports = router;