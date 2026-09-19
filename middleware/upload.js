const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Make sure the local folder exists before anything tries to write to it
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Files are held in memory so the same buffer can go to either
 * Cloudinary or the local disk without writing a temp file first.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG, WEBP and GIF images are allowed'));
  },
});

/**
 * Sends a buffer to Cloudinary using their stream API.
 */
const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ width: 1200, crop: 'limit' }] },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });

/**
 * Writes a buffer into /uploads and returns the public path.
 */
const saveLocally = (buffer, originalName) => {
  const ext = path.extname(originalName) || '.jpg';
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
};

/**
 * Single entry point used by the routes — callers don't care where it lands.
 */
const storeImage = async (file, folder = 'echo') => {
  if (isCloudinaryConfigured) return uploadToCloudinary(file.buffer, folder);
  return saveLocally(file.buffer, file.originalname);
};

module.exports = { upload, storeImage, isCloudinaryConfigured, UPLOAD_DIR };
