const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/notes  (with optional filters)
router.get('/notes', async (req, res) => {
  const { subject, semester, type } = req.query;

  let sql = `
    SELECT n.*, u.email AS uploader_email
    FROM notes n
    LEFT JOIN users u ON n.uploaded_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (subject)  { sql += ' AND n.subject = ?';   params.push(subject); }
  if (semester) { sql += ' AND n.semester = ?';  params.push(semester); }
  if (type)     { sql += ' AND n.type = ?';      params.push(type); }

  sql += ' ORDER BY n.created_at DESC';

  try {
    const [rows] = await db.query(sql, params);
    res.json({ success: true, notes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/upload-note  (senior only)
router.post('/upload-note', async (req, res) => {
  const { title, subject, type, semester, uploaded_by } = req.body;

  if (!title || !subject || !type || !semester || !uploaded_by) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  try {
    const [userRows] = await db.query('SELECT role FROM users WHERE id = ?', [uploaded_by]);
    if (userRows.length === 0 || userRows[0].role !== 'senior') {
      return res.status(403).json({ success: false, message: 'Only seniors can upload' });
    }

    const [result] = await db.query(
      `INSERT INTO notes (title, subject, type, semester, uploaded_by)
       VALUES (?, ?, ?, ?, ?)`,
      [title, subject, type, semester, uploaded_by]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;