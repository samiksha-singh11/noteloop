const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');

// Allowed email domains
const ALLOWED_DOMAINS = [
  '@ug.sharda.ac.in',
  '@pg.sharda.ac.in',
  '@sharda.ac.in',
  '@gmail.com'       // for testing
];

// Basic email format check
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isAllowedEmail(email) {
  if (!EMAIL_REGEX.test(email)) return false;
  const lower = email.toLowerCase();
  return ALLOWED_DOMAINS.some(domain => lower.endsWith(domain));
}

// POST /api/signup  — create a new account
router.post('/signup', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  if (!isAllowedEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please use a valid Sharda University or Gmail email'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }

  if (role !== 'senior' && role !== 'junior') {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please log in instead.'
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (email, role, password_hash) VALUES (?, ?, ?)',
      [email.toLowerCase(), role, hash]
    );

    res.json({
      success: true,
      user: { id: result.insertId, email: email.toLowerCase(), role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/login  — authenticate existing user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  if (!isAllowedEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please use a valid Sharda University or Gmail email'
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email. Please sign up first.'
      });
    }

    const user = rows[0];

    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'This account has no password set. Please contact admin.'
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    res.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;