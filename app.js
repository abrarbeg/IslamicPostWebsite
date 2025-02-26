require("dotenv").config(); // Load environment variables

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const Post = require("./models/post");
const { v2: cloudinary } = require("cloudinary");
const streamifier = require("streamifier");

const app = express();
const PORT = 3000;

// Cloudinary Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// MongoDB Connection
const uri = process.env.MONGODB_URI;
mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session Setup
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

// Multer Setup for Cloudinary Upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to Check if User is Logged In
const authenticateAdmin = (req, res, next) => {
  if (req.session.authenticated) return next();
  res.redirect("/admin/login");
};

// Upload Image to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream({ folder: "posts" }, (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Routes
app.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render("index", { posts });
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    res.status(500).send("Could not load posts.");
  }
});

// Admin Routes
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

app.get("/admin/panel", authenticateAdmin, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render("admin-panel", { posts });
  } catch (error) {
    console.error("❌ Error loading admin panel:", error);
    res.status(500).send("Error loading admin panel.");
  }
});

// Add New Post
app.post("/admin/add-post", authenticateAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, category, content } = req.body;
    const imageUrl = req.file ? await uploadToCloudinary(req.file.buffer) : null;
    
    const newPost = new Post({ title, category, content, image: imageUrl });
    await newPost.save();
    res.redirect("/admin/panel");
  } catch (error) {
    console.error("❌ Error adding post:", error);
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
    console.error("❌ Error fetching post for edit:", error);
    res.status(500).send("Error loading edit page.");
  }
});

// Update Post (Preserves existing image if no new image is uploaded)
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
      image: req.file ? await uploadToCloudinary(req.file.buffer) : existingPost.image, // Preserve existing image if no new image is uploaded
    };

    await Post.findByIdAndUpdate(postId, updatedData, { new: true });
    res.redirect("/admin/panel");
  } catch (error) {
    console.error("❌ Error updating post:", error);
    res.status(500).send("Error updating post.");
  }
});

// Delete Post
app.post("/admin/delete/:id", authenticateAdmin, async (req, res) => {
  try {
    const postId = req.params.id;
    const deletedPost = await Post.findByIdAndDelete(postId);
    
    if (!deletedPost) return res.status(404).send("Post not found.");
    res.redirect("/admin/panel");
  } catch (error) {
    console.error("❌ Error deleting post:", error);
    res.status(500).send("Error deleting post.");
  }
});

// Logout
app.get("/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/admin/login");
  });
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
