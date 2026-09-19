const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/users/search?q=term
 * @desc    Find users by username or full name
 * @access  Public
 */
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ users: [] });

    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [{ username: regex }, { fullName: regex }],
    }).limit(10);

    res.json({ users: users.map((u) => u.toPublicProfile(req.user?._id)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while searching users' });
  }
});

/**
 * @route   GET /api/users/suggestions
 * @desc    People the current user does not follow yet
 * @access  Private
 */
router.get('/suggestions', protect, async (req, res) => {
  try {
    const exclude = [...req.user.following, req.user._id];
    const users = await User.find({ _id: { $nin: exclude } })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ users: users.map((u) => u.toPublicProfile(req.user._id)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while loading suggestions' });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update the logged-in user's bio, full name or avatar
 * @access  Private
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const { fullName, bio, avatar } = req.body;

    if (fullName !== undefined) req.user.fullName = fullName.trim();
    if (bio !== undefined) req.user.bio = bio.trim();
    if (avatar !== undefined) req.user.avatar = avatar.trim();

    await req.user.save();
    res.json({ user: req.user.toPublicProfile(req.user._id) });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Could not update profile' });
  }
});

/**
 * @route   POST /api/users/:id/follow
 * @desc    Toggle follow / unfollow for a user
 * @access  Private
 */
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const targetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const alreadyFollowing = req.user.following.some((id) => id.toString() === targetId);

    if (alreadyFollowing) {
      // Unfollow: remove from both sides of the relationship
      req.user.following.pull(targetId);
      target.followers.pull(req.user._id);
    } else {
      req.user.following.push(targetId);
      target.followers.push(req.user._id);
    }

    await Promise.all([req.user.save(), target.save()]);

    // Returning BOTH counts is what lets the UI update the right number.
    // Previously only the target's follower count came back, so the client
    // had no way to know its own following count had changed.
    res.json({
      following: !alreadyFollowing,
      targetId,
      followersCount: target.followers.length,
      myFollowingCount: req.user.following.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while following user' });
  }
});

/**
 * @route   GET /api/users/:username/followers
 * @desc    People who follow this user
 * @access  Public (richer when authenticated)
 */
router.get('/:username/followers', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() }).populate(
      'followers'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ users: user.followers.map((u) => u.toPublicProfile(req.user?._id)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while loading followers' });
  }
});

/**
 * @route   GET /api/users/:username/following
 * @desc    People this user follows
 * @access  Public (richer when authenticated)
 */
router.get('/:username/following', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() }).populate(
      'following'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ users: user.following.map((u) => u.toPublicProfile(req.user?._id)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while loading following list' });
  }
});

/**
 * @route   GET /api/users/:username
 * @desc    Public profile plus that user's posts
 * @access  Public (richer when authenticated)
 */
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username fullName avatar');

    res.json({
      profile: user.toPublicProfile(req.user?._id),
      posts: posts.map((p) => ({
        _id: p._id,
        content: p.content,
        image: p.image,
        author: p.author,
        likesCount: p.likes.length,
        commentCount: p.commentCount,
        isLiked: req.user ? p.likes.some((id) => id.toString() === req.user._id.toString()) : false,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while loading profile' });
  }
});

module.exports = router;
