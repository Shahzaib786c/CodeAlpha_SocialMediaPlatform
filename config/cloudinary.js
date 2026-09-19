const { v2: cloudinary } = require('cloudinary');

/**
 * Cloudinary is optional. If the three keys are present in .env we upload
 * there; otherwise the app falls back to saving files on local disk.
 * This keeps the project runnable without anyone creating an account.
 */
const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

module.exports = { cloudinary, isCloudinaryConfigured: isConfigured };
