const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Multer Configuration for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'C:/Users/abrar/IslamicPostWebsite/public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

module.exports = function (Post) {
    const authenticateAdmin = (req, res, next) => {
        if (req.session.authenticated) {
            return next();
        }
        res.redirect('/admin/login');
    };

    // Admin Login Page
    router.get('/login', (req, res) => {
        res.render('admin-login', { error: null });
    });

    // Admin Login Handler
    router.post('/login', (req, res) => {
        const { username, password } = req.body;
        if (username === 'admin' && password === 's1a2a3d4') {
            req.session.authenticated = true;
            res.redirect('/admin/panel');
        } else {
            res.render('admin-login', { error: 'Invalid credentials' });
        }
    });

    // Admin Panel
    router.get('/panel', authenticateAdmin, async (req, res) => {
        try {
            const posts = await Post.find().sort({ createdAt: -1 });
            res.render('admin-panel', { posts });
        } catch (error) {
            console.error('Error loading admin panel:', error);
            res.status(500).send('Error loading admin panel.');
        }
    });

    // Edit Post Route
    router.get('/edit/:id', authenticateAdmin, async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).send('Post not found');
            res.render('edit', { post });
        } catch (error) {
            console.error('Error fetching post for edit:', error);
            res.status(500).send('Error loading edit page.');
        }
    });

    // Update Post Route
    router.post('/update/:id', upload.single('image'), authenticateAdmin, async (req, res) => {
        try {
            const postId = req.params.id;
            const { title, category, content } = req.body;
            let imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;
            
            const updateData = { title, category, content };
            if (imagePath) {
                updateData.image = imagePath;
            }
            
            const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true, runValidators: true });
            if (!updatedPost) {
                return res.status(404).send('Post not found.');
            }
            console.log('Post updated successfully:', updatedPost);
            res.redirect('/admin/panel');
        } catch (error) {
            console.error('Error updating post:', error);
            res.status(500).send('Error updating post.');
        }
    });

    // Delete Post Route
    router.post('/delete/:id', authenticateAdmin, async (req, res) => {
        try {
            const postId = req.params.id;
            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).send('Post not found.');
            }
            
            if (post.image) {
                const imagePath = path.join('C:/Users/abrar/IslamicPostWebsite/public', post.image);
                console.log('Attempting to delete image file at path:', imagePath);
                
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log('Image file deleted successfully:', post.image);
                } else {
                    console.error('Image file does not exist at path:', imagePath);
                }
            }

            await Post.findByIdAndDelete(postId);
            console.log('Post deleted successfully:', postId);

            res.redirect('/admin/panel');
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).send('Error deleting post.');
        }
    });

    // Privacy Policy Route
    router.get('/privacy-policy', (req, res) => {
        res.render('privacy-policy');
    });

    // Terms and Conditions Route
    router.get('/terms-conditions', (req, res) => {
        res.render('terms-conditions');
    });

    // Logout Route
    router.get('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) console.error(err);
            res.redirect('/admin/login');
        });
    });

    return router;
};
