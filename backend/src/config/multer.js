const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crea directory uploads se non esiste
const uploadDir = path.join(__dirname, '../uploads/procedures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurazione storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Genera nome file unico: timestamp-randomstring-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitizedBasename = basename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${sanitizedBasename}-${uniqueSuffix}${ext}`);
  },
});

// Filtro per file consentiti
const fileFilter = (req, file, cb) => {
  // Permetti solo file .txt
  const allowedExtensions = ['.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo file .txt sono consentiti'), false);
  }
};

// Configurazione multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB default
  },
});

module.exports = upload;
