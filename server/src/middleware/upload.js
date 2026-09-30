const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const urlCheck = `${req.baseUrl || ''} ${req.originalUrl || ''}`;
    const sub = urlCheck.includes('turf') ? 'turfs' : 'products';
    const dir = path.join(__dirname, '..', '..', 'uploads', sub);
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.error('Failed to create upload destination directory:', e);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    const ext = /^\.[a-z0-9]+$/i.test(rawExt) ? rawExt : '.jpg';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const isImageMime = file.mimetype && file.mimetype.startsWith('image/');
  const isImageExt = /\.(jpe?g|png|webp|gif|avif|bmp|svg)$/i.test(file.originalname || '');

  if (isImageMime || isImageExt) {
    cb(null, true);
  } else {
    const err = new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed');
    err.code = 'INVALID_FILE_TYPE';
    cb(err, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

module.exports = upload;
