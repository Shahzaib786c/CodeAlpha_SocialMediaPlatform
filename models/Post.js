const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // speeds up feed queries filtered by author
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [500, 'Post cannot exceed 500 characters'],
    },
    image: {
      type: String,
      default: '', // optional image URL
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: {
      type: Number,
      default: 0, // denormalised so the feed doesn't need a count query per post
    },
  },
  { timestamps: true }
);

// Newest-first feed queries
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
