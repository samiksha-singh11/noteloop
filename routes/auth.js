const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/login
router.post('/login', async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ success: false, message: 'Email and role required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    let user;
    if (rows.length === 0) {
      // Auto-register new user
      const [result] = await db.query(
        'INSERT INTO users (email, role) VALUES (?, ?)',
        [email, role]
      );
      user = { id: result.insertId, email, role };
    } else {
      user = rows[0];
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;