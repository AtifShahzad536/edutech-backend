const cloudinaryService = require('./cloudinaryService');
const userRepository = require('../repositories/user.repository');
const cloudinary = require('cloudinary').v2;
const AppError = require('../utils/appError');

class UploadService {
  async uploadProfileImage(fileBuffer, mimetype, userId) {
    if (!fileBuffer) throw new AppError('Please upload an image', 400);

    const fileContent = `data:${mimetype};base64,${fileBuffer.toString('base64')}`;
    const result = await cloudinaryService.upload(fileContent, 'profile_images');

    await userRepository.updateUser(userId, { avatar: result.secure_url });
    return result.secure_url;
  }

  async uploadAssignmentFile(fileBuffer, mimetype, originalName) {
    if (!fileBuffer) throw new AppError('No file uploaded', 400);

    const fileContent = `data:${mimetype};base64,${fileBuffer.toString('base64')}`;
    const result = await cloudinaryService.upload(fileContent, 'assignments');

    return { secureUrl: result.secure_url, originalName };
  }

  async getSignedDeliveryUrl(url) {
    if (!url) throw new AppError('URL required', 400);

    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    const pathAfterUpload = url.substring(uploadIndex + 8);
    const versionRegex = /^v\d+\//;
    const publicIdWithExt = pathAfterUpload.replace(versionRegex, '');

    const resourceType = url.includes('/raw/') ? 'raw' : url.includes('/video/') ? 'video' : 'image';

    if (publicIdWithExt.toLowerCase().endsWith('.pdf')) {
      const publicIdWithoutExt = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.pdf'));
      return cloudinary.utils.download_zip_url({
        public_ids: [publicIdWithoutExt],
        resource_type: resourceType
      });
    }

    return cloudinary.utils.url(publicIdWithExt, {
      secure: true,
      sign_url: true,
      resource_type: resourceType,
      flags: "attachment"
    });
  }
}

module.exports = new UploadService();
