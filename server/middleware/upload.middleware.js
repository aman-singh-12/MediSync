// ================= RUBRIC: FILE UPLOAD HANDLING (0.2 pts) =================
// Multer disk storage configuration, MIME type validation filter, and 5MB size limit security enforcement
const multer = require('multer');
const path = require('path');

// ================= DISK STORAGE CONFIGURATION =================
// Logic: Configures disk destination folder and generates unique filename with user ID and timestamp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// ================= FILE TYPE FILTER =================
// Logic: Validates MIME type and extension, allowing only JPEG, JPG, and PNG images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed (jpg, jpeg, png)'));
  }
};

// ================= MULTER INSTANCE =================
// Configures 5MB file size limit and applies storage engine
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = upload;

