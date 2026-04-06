const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudinaryService = {
  // Generate secure upload signature for frontend
  generateSignature: (folder = 'edutech') => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder
    };
  },

  // Upload file from server side (if needed)
  upload: async (file, folder = 'edutech') => {
    try {
      const result = await cloudinary.uploader.upload(file, {
        folder,
        resource_type: 'auto' // automatically detect video/image/raw
      });
      return result;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      throw error;
    }
  },

  // Delete file
  delete: async (publicId) => {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary Delete Error:', error);
    }
  }
};

module.exports = cloudinaryService;
