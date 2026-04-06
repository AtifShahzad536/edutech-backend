const cloudinaryService = require('../services/cloudinaryService');
const User = require('../models/User');

// @desc    Upload profile image
// @route   POST /api/uploads/profile-image
// @access  Private
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }

    // Convert Buffer to Data URI
    const fileContent = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const result = await cloudinaryService.upload(fileContent, 'profile_images');

    // Update User
    const user = await User.findById(req.user.id);
    user.avatar = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      data: result.secure_url
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload assignment file
// @route   POST /api/uploads/assignment-file
// @access  Private
const uploadAssignmentFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileContent = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinaryService.upload(fileContent, 'assignments');

    res.status(200).json({
      success: true,
      data: result.secure_url,
      originalName: req.file.originalname
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get signed URL for cloudinary resource
// @route   GET /api/uploads/signed-url
// @access  Private
const getSignedDeliveryUrl = async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'URL required' });

    const cloudinary = require('cloudinary').v2;

    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) {
      return res.json({ success: true, url });
    }

    const pathAfterUpload = url.substring(uploadIndex + 8);
    const versionRegex = /^v\d+\//;
    const publicIdWithExt = pathAfterUpload.replace(versionRegex, '');

    const resourceType = url.includes('/raw/') ? 'raw' : 
                         url.includes('/video/') ? 'video' : 'image';

    // If it's a PDF, Cloudinary "Strict Settings" often entirely block direct delivery.
    // We bypass this entirely by robustly generating a secure ZIP archive for the PDF.
    if (publicIdWithExt.toLowerCase().endsWith('.pdf')) {
      const publicIdWithoutExt = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.pdf'));
      const zipUrl = cloudinary.utils.download_zip_url({
        public_ids: [publicIdWithoutExt],
        resource_type: resourceType
      });
      return res.status(200).json({ success: true, url: zipUrl });
    }

    const signedUrl = cloudinary.utils.url(publicIdWithExt, {
      secure: true,
      sign_url: true,
      resource_type: resourceType,
      flags: "attachment"
    });

    res.status(200).json({ success: true, url: signedUrl });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadProfileImage,
  uploadAssignmentFile,
  getSignedDeliveryUrl
};
