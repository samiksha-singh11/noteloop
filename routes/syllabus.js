const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/syllabus
router.get('/syllabus', async (req, res) => {
  const { branch, semester, subject } = req.query;

  let sql = 'SELECT * FROM syllabus WHERE 1=1';
  const params = [];

  if (branch)   { sql += ' AND branch = ?';    params.push(branch); }
  if (semester) { sql += ' AND semester = ?';  params.push(semester); }
  if (subject)  { sql += ' AND subject = ?';   params.push(subject); }
  
  sql += ' ORDER BY subject ASC, unit ASC';

  try {
    const [rows] = await db.query(sql, params);
    res.json({ success: true, syllabus: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;