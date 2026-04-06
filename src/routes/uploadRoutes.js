const express = require('express');
const multer = require('multer');
const { getUploadSignature } = require('../controllers/paymentController');
const { uploadProfileImage, uploadAssignmentFile, getSignedDeliveryUrl } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for assignments
});

router.get('/signature', protect, getUploadSignature);
router.get('/signed-url', protect, getSignedDeliveryUrl);
router.post('/profile-image', protect, upload.single('image'), uploadProfileImage);
router.post('/assignment-file', protect, upload.single('file'), uploadAssignmentFile);

module.exports = router;
