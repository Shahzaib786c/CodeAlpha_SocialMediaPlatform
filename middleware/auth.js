const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Pulls "Bearer <token>" out of the Authorization header.
 */
const getToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.split(' ')[1];
  return null;
};

/**
 * Blocks the request unless a valid token is present.
 * Attaches the full user document to req.user.
 */
const protect = async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Not authorised, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorised, user no longer exists' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorised, token is invalid or expired' });
  }
};

/**
 * Lets the request through either way, but identifies the user if a
 * valid token happens to be there. Used on public routes that still
 * want to show "you already liked this" state.
 */
const optionalAuth = async (req, res, next) => {
  const token = getToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
  } catch (error) {
    // Invalid token on an optional route is simply ignored
  }
  next();
};

module.exports = { protect, optionalAuth };
