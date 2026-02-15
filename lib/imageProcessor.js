const sharp = require("sharp");

async function processPNG(buffer) {
  const preview = await sharp(buffer)
    .resize({ width: 1200 })
    .webp({ quality: 80, alphaQuality: 100 })
    .toBuffer();

  const thumb = await sharp(buffer)
    .resize({ width: 400 })
    .webp({ quality: 65, alphaQuality: 100 })
    .toBuffer();

  const meta = await sharp(buffer).metadata();

  return {
    preview,
    thumb,
    width: meta.width,
    height: meta.height
  };
}

module.exports = { processPNG };
