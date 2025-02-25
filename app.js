const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const Post = require('./models/post'); // If the file is actually lowercase


const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session setup
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

// MongoDB Connection
mongoose
  .connect("mongodb+srv://abrarbeg250:<cylQDE9vIkBLt9gF>@cluster0.84aph.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Multer Setup for Image Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Middleware to check if user is logged in
const authenticateAdmin = (req, res, next) => {
  if (req.session.authenticated) return next();
  res.redirect("/admin/login");
};

// Home Route
app.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render("index", { posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send("Could not load posts.");
  }
});

// Detailed Post Page
app.get("/post/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");
    res.render("post", { post });
  } catch (error) {
    console.error("❌ Error fetching post:", error);
    res.status(500).send("Error loading post.");
  }
});

// Privacy Policy & Terms and Conditions
app.get("/privacy-policy", (req, res) => res.render("privacy-policy"));
app.get("/terms-conditions", (req, res) => res.render("terms-conditions"));

// Admin Login
app.get("/admin/login", (req, res) => res.render("admin-login", { error: null }));

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "s1a2a3d4") {
    req.session.authenticated = true;
    res.redirect("/admin/panel");
  } else {
    res.render("admin-login", { error: "Invalid credentials" });
  }
});

// Admin Panel
app.get("/admin/panel", authenticateAdmin, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render("admin-panel", { posts });
  } catch (error) {
    console.error("Error loading admin panel:", error);
    res.status(500).send("Error loading admin panel.");
  }
});

// Add New Post
app.post("/admin/add-post", authenticateAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, category, content } = req.body;
    const newPost = new Post({
      title,
      category,
      content,
      image: req.file ? "/uploads/" + req.file.filename : null,
    });

    await newPost.save();
    res.redirect("/admin/panel");
  } catch (error) {
    console.error("Error adding post:", error);
    res.status(500).send("Error adding post.");
  }
});

// Edit Post
app.get("/admin/edit/:id", authenticateAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");
    res.render("edit", { post });
  } catch (error) {
    console.error("Error fetching post for edit:", error);
    res.status(500).send("Error loading edit page.");
  }
});

// Update Post
app.post("/admin/update/:id", authenticateAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, category, content } = req.body;
    const postId = req.params.id;

    const existingPost = await Post.findById(postId);
    if (!existingPost) return res.status(404).send("Post not found.");

    const updatedData = {
      title,
      category,
      content,
      image: req.file ? "/uploads/" + req.file.filename : existingPost.image,
    };

    await Post.findByIdAndUpdate(postId, updatedData, { new: true });
    res.redirect("/admin/panel");
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).send("Error updating post.");
  }
});

// Delete Post
app.post("/admin/delete/:id", authenticateAdmin, async (req, res) => {
  try {
    const postId = req.params.id;
    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) return res.status(404).send("Post not found.");

    if (deletedPost.image) {
      const imagePath = path.join(__dirname, "public", deletedPost.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    res.redirect("/admin/panel");
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).send("Error deleting post.");
  }
});

// Admin Logout
app.get("/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/admin/login");
  });
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
