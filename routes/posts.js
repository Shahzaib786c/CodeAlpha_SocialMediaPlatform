const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Converts a post document into the shape the frontend expects,
 * including whether the current user has liked it.
 *
 * `post.author` can be null when the author's account no longer exists —
 * populate() has nothing to fill in. Callers should drop those posts with
 * hasAuthor() first, but every property access here is still guarded so a
 * single orphaned row can never take down a whole feed.
 */
const shapePost = (post, currentUser, followingIds = null) => {
  const authorId = post.author?._id ? post.author._id.toString() : null;

  return {
    _id: post._id,
    content: post.content,
    image: post.image,
    author: post.author,
    likesCount: post.likes.length,
    commentCount: post.commentCount,
    isLiked: currentUser
      ? post.likes.some((id) => id.toString() === currentUser._id.toString())
      : false,
    isOwner: Boolean(currentUser && authorId && authorId === currentUser._id.toString()),
    // Used by Explore so each post can carry its own Follow button
    isFollowingAuthor: followingIds && authorId ? followingIds.includes(authorId) : undefined,
    createdAt: post.createdAt,
  };
};

/**
 * Posts whose author has been deleted are skipped rather than rendered
 * as a blank card.
 */
const hasAuthor = (post) => Boolean(post.author && post.author._id);

/**
 * @route   GET /api/posts/feed
 * @desc    Posts from people the user follows, plus their own
 * @access  Private
 */
router.get('/feed', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const authors = [...req.user.following, req.user._id];

    const posts = await Post.find({ author: { $in: authors } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username fullName avatar');

    res.json({ posts: posts.filter(hasAuthor).map((p) => shapePost(p, req.user)), page });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while loading feed' });
  }
});

/**
 * @route   GET /api/posts/explore
 * @desc    Discover posts from people you DON'T follow yet.
 *          Logged out, it simply shows everything.
 * @access  Public (richer when authenticated)
 */
router.get('/explore', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    // Hide yourself and anyone you already follow — that's what makes
    // Explore different from the Home feed.
    const filter = req.user
      ? { author: { $nin: [...req.user.following, req.user._id] } }
      : {};

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username fullName avatar');

    // Everyone here is unfollowed by definition, so the flag is always false
    res.json({ posts: posts.filter(hasAuthor).map((p) => shapePost(p, req.user, [])), page });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while loading posts' });
  }
});

/**
 * @route   POST /api/posts
 * @desc    Create a post
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { content, image } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content cannot be empty' });
    }

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      image: (image || '').trim(),
    });

    await post.populate('author', 'username fullName avatar');
    res.status(201).json({ post: shapePost(post, req.user) });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Could not create post' });
  }
});

/**
 * @route   POST /api/posts/:id/like
 * @desc    Toggle like / unlike
 * @access  Private
 */
router.post('/:id/like', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.some((id) => id.toString() === req.user._id.toString());

    if (alreadyLiked) post.likes.pull(req.user._id);
    else post.likes.push(req.user._id);

    await post.save();

    res.json({ isLiked: !alreadyLiked, likesCount: post.likes.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while liking post' });
  }
});

/**
 * @route   GET /api/posts/:id/comments
 * @desc    All comments on a post, oldest first
 * @access  Public
 */
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: 1 })
      .populate('author', 'username fullName avatar');

    res.json({
      // Same guard as posts: a comment whose author was deleted is skipped
      comments: comments.filter((c) => c.author && c.author._id).map((c) => ({
        _id: c._id,
        text: c.text,
        author: c.author,
        isOwner: Boolean(req.user && c.author._id.toString() === req.user._id.toString()),
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while loading comments' });
  }
});

/**
 * @route   POST /api/posts/:id/comments
 * @desc    Add a comment
 * @access  Private
 */
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text: text.trim(),
    });

    // Keep the denormalised counter in sync
    post.commentCount += 1;
    await post.save();

    await comment.populate('author', 'username fullName avatar');

    res.status(201).json({
      comment: {
        _id: comment._id,
        text: comment.text,
        author: comment.author,
        isOwner: true,
        createdAt: comment.createdAt,
      },
      commentCount: post.commentCount,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Could not add comment' });
  }
});

/**
 * @route   DELETE /api/posts/comments/:commentId
 * @desc    Delete your own comment
 * @access  Private
 */
router.delete('/comments/:commentId', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting comment' });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete your own post and its comments
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting post' });
  }
});

module.exports = router;