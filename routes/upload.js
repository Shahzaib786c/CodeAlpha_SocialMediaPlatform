const express = require('express');
const { protect } = require('../middleware/auth');
const { upload, storeImage, isCloudinaryConfigured } = require('../middleware/upload');

const router = express.Router();

/**
 * @route   POST /api/upload
 * @desc    Upload one image, returns its public URL
 * @access  Private
 * @body    multipart/form-data with a field named "image"
 */
router.post('/', protect, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    // Multer errors (file too large, wrong type) arrive here
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 5 MB' : err.message;
      return res.status(400).json({ message });
    }
    if (!req.file) return res.status(400).json({ message: 'No image was uploaded' });

    try {
      const folder = req.query.type === 'avatar' ? 'echo/avatars' : 'echo/posts';
      const url = await storeImage(req.file, folder);
      res.status(201).json({ url, storage: isCloudinaryConfigured ? 'cloudinary' : 'local' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Image upload failed. Please try again.' });
    }
  });
});

module.exports = router;
