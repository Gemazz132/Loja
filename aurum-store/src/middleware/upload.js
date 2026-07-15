'use strict';

const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Imagem principal única (compatibilidade com o que já existia)
upload.single = upload.single.bind(upload);
// Várias imagens extra de uma vez (galeria do produto) — até 6 por pedido
const uploadMultiplas = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).array('imagens', 6);

module.exports = upload;
module.exports.multiplas = uploadMultiplas;
