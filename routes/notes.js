const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configure Multer (Forced 'raw' to fix PDF ACL issues)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let ext = file.originalname.split('.').pop().toLowerCase();
    let format = ext === 'docx' ? 'doc' : ext === 'pptx' ? 'ppt' : ext;
    
    return {
      folder: 'noteloop_files',
      resource_type: 'raw', // <--- This fixes the broken PDF links
      format: format,
      allowed_formats: ['pdf', 'doc', 'ppt', 'txt']
    };
  }
});

const upload = multer({ storage: storage });

// ==========================================
// 3. Routes
// ==========================================

// GET /api/notes
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

// POST /api/upload-note
router.post('/upload-note', upload.single('file'), async (req, res) => {
  const { branch, subject, title, type, semester, uploaded_by } = req.body;

  if (!branch || !subject || !title || !type || !semester || !uploaded_by) {
    return res.status(400).json({ success: false, message: 'All text fields required' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file' });
  }

  try {
    const [userRows] = await db.query('SELECT role FROM users WHERE id = ?', [uploaded_by]);
    if (userRows.length === 0 || userRows[0].role !== 'senior') {
      return res.status(403).json({ success: false, message: 'Only seniors can upload' });
    }

    const fileUrl = req.file.path;

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

// DELETE /api/notes/:id
router.delete('/notes/:id', async (req, res) => {
  const noteId = req.params.id;
  const { uploaded_by } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM notes WHERE id = ?', [noteId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const note = rows[0];

    if (note.uploaded_by !== parseInt(uploaded_by)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own notes' });
    }

    if (note.file_path) {
      const urlParts = note.file_path.split('/');
      const fileName = urlParts[urlParts.length - 1]; 
      const publicId = 'noteloop_files/' + fileName.split('.')[0];
      
      // Cloudinary requires 'raw' for PDFs/Docs
      const resourceType = note.file_path.includes('/raw/upload/') ? 'raw' : 'image';
      
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      } catch (cloudErr) {
        console.error("Cloudinary delete error (ignored):", cloudErr);
      }
    }

    await db.query('DELETE FROM notes WHERE id = ?', [noteId]);
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;