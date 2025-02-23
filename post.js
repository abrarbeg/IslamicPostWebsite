const mongoose = require("mongoose");
const Post = require('./models/post'); // If the file is actually lowercase
const PostSchema = new mongoose.Schema({
  title: String,
  category: String,
  content: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", PostSchema);
