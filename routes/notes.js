const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// 1. Configure Cloudinary (using your .env variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configure Multer to use Cloudinary Storage (Fixed for DOCX/PPTX)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let ext = file.originalname.split('.').pop().toLowerCase();
    // Cloudinary sometimes rejects 'docx' and 'pptx' in auto mode, so we normalize them
    let format = ext === 'docx' ? 'doc' : ext === 'pptx' ? 'ppt' : ext; 
    
    return {
      folder: 'noteloop_files',
      resource_type: 'auto',
      format: format,
      allowed_formats: ['pdf', 'doc', 'ppt', 'txt']
    };
  }
});

const upload = multer({ storage: storage });

// ==========================================
// 3. Routes
// ==========================================

// GET /api/notes (Fetch all notes with optional filters)
router.get('/notes', async (req, res) => {
  const { branch, subject, semester, type } = req.query;

  let sql = `
    SELECT n.*, u.email AS uploader_email
    FROM notes n
    LEFT JOIN users u ON n.uploaded_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (branch)   { sql += ' AND n.branch = ?';    params.push(branch); }
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

// POST /api/upload-note (Upload a new file and save details)
router.post('/upload-note', upload.single('file'), async (req, res) => {
  const { branch, subject, title, type, semester, uploaded_by } = req.body;

  // Basic validation
  if (!branch || !subject || !title || !type || !semester || !uploaded_by) {
    return res.status(400).json({ success: false, message: 'All text fields required' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file' });
  }

  try {
    // Check if the user is a senior
    const [userRows] = await db.query('SELECT role FROM users WHERE id = ?', [uploaded_by]);
    if (userRows.length === 0 || userRows[0].role !== 'senior') {
      return res.status(403).json({ success: false, message: 'Only seniors can upload' });
    }

    // Cloudinary provides the secure URL in req.file.path
    const fileUrl = req.file.path;

    // Insert into database
    const [result] = await db.query(
      `INSERT INTO notes (branch, subject, title, type, semester, file_path, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [branch, subject, title, type, semester, fileUrl, uploaded_by]
    );

    res.json({ success: true, id: result.insertId, url: fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;