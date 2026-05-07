const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");

router.get("/", async (req, res) => {

  try {

    let html = fs.readFileSync(
      path.join(__dirname, "../public/index.html"),
      "utf-8"
    );

    res.send(html);

  } catch (err) {

    console.error(err);
    res.status(500).send("Server Error");

  }

});

module.exports = router;