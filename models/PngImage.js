const mongoose = require("mongoose");

const PngImageSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: String,
  description: String,
  h1: String,
  alt: String,

  tags: [String],

  keywords: [String],
  category: String,

  originalUrl: String,
  previewUrl: String,
  thumbUrl: String,

  width: Number,
  height: Number,

  views: {
    type: Number,
    default: 0
  },

  downloads: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

PngImageSchema.index({
  title: "text",
  keywords: "text",
  tags: "text",
  category: "text"
});

module.exports =
  mongoose.model("PngImage", PngImageSchema);
