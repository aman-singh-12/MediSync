// Medical record routes: create, upload, and manage medical records for patients and doctors.
const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadCloud } = require('../utils/cloudinary');

const router = express.Router();
const protect = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const {
	createMedicalRecord,
	getMyMedicalRecords,
	getDoctorPatientRecords,
	updateMedicalRecord,
	deleteMedicalRecord,
	patientUploadRecord,
} = require('../controllers/medicalRecord.controller');

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only PNG, JPEG, and PDF files are allowed.'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/', protect, authorizeRoles('doctor'), createMedicalRecord);

// Patient Upload Route
router.post('/upload', protect, authorizeRoles('patient'), uploadCloud.single('file'), patientUploadRecord);

router.get('/my', protect, authorizeRoles('patient'), getMyMedicalRecords);
router.get('/doctor', protect, authorizeRoles('doctor'), getDoctorPatientRecords);
router.patch('/:id', protect, authorizeRoles('doctor'), updateMedicalRecord);
router.delete('/:id', protect, authorizeRoles('doctor', 'admin'), deleteMedicalRecord);

module.exports = router;
