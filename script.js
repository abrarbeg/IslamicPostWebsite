document.addEventListener('DOMContentLoaded', function () {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const posts = document.querySelectorAll('.post-card');

    function showAllPosts() {
        posts.forEach(post => {
            post.style.display = "block"; // Show all posts
        });
    }

    categoryButtons.forEach(button => {
        button.addEventListener('click', function () {
            const selectedCategory = this.getAttribute('data-category');

            if (selectedCategory === "All") {
                showAllPosts();
            } else {
                posts.forEach(post => {
                    if (post.getAttribute('data-category') === selectedCategory) {
                        post.style.display = "block"; // Show matching category
                    } else {
                        post.style.display = "none"; // Hide non-matching categories
                    }
                });
            }
        });
    });

    // Show all posts when the page loads
    showAllPosts();
});
