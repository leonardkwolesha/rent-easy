const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'rental-property',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
    resource_type: 'image',
    transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
  },
});

module.exports = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
