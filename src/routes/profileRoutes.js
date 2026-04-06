const express = require('express');
const { updateProfile, importFromLinkedIn } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(protect);

router.patch('/', updateProfile);
router.post('/import-linkedin', upload.single('document'), importFromLinkedIn);

module.exports = router;
