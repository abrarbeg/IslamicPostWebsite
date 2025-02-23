const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); // Ensure the path is correct

module.exports = function (Post) {
    router.get('/', async (req, res) => {
        try {
            const posts = await Post.find().sort({ createdAt: -1 }); // Use the imported Post model
            res.render('index', { posts });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    router.post('/like/:id', async (req, res) => {
        try {
            const postId = req.params.id;
            const post = await Post.findById(postId); // Use the imported Post model
            if (!post) return res.status(404).send('Post not found');
            post.likes += 1;
            await post.save();
            res.json({ likes: post.likes });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    });

    return router;
};