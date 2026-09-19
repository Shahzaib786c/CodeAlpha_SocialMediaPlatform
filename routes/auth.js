const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * Optional domain restriction.
 *
 * Set ALLOWED_EMAIL_DOMAINS in .env as a comma separated list, e.g.
 *   ALLOWED_EMAIL_DOMAINS=gmail.com
 *   ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com,university.edu
 * Leave it empty and any valid email address is accepted.
 */
const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const emailDomainCheck = (value) => {
  if (!allowedDomains.length) return true;
  const domain = String(value).toLowerCase().split('@')[1] || '';
  if (allowedDomains.includes(domain)) return true;
  const list =
    allowedDomains.length === 1
      ? `@${allowedDomains[0]}`
      : allowedDomains.map((d) => `@${d}`).join(', ');
  throw new Error(`Please register with ${list}`);
};

// Signs a token that carries only the user id
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// Turns express-validator errors into a single readable message
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return true;
  }
  return false;
};

/**
 * @route   POST /api/auth/register
 * @desc    Create a new account and return a token
 * @access  Public
 */
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be 3-20 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers and underscores'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .bail()
      .custom(emailDomainCheck),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const { fullName, username, email, password } = req.body;

      const existing = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
      });
      if (existing) {
        const field = existing.email === email.toLowerCase() ? 'Email' : 'Username';
        return res.status(400).json({ message: `${field} is already taken` });
      }

      const user = await User.create({ fullName, username, email, password });

      res.status(201).json({
        token: generateToken(user._id),
        user: user.toPublicProfile(user._id),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error while registering' });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate with email + password
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const { email, password } = req.body;

      // password is select:false in the schema, so ask for it explicitly
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      res.json({
        token: generateToken(user._id),
        user: user.toPublicProfile(user._id),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error while logging in' });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Return the logged-in user (used to restore a session on page load)
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user.toPublicProfile(req.user._id) });
});

module.exports = router;
