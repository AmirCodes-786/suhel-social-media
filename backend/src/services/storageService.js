import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import config from '../config/index.js';

if (config.cloudinary.isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

// Ensure local uploads directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

export const uploadMedia = async (file, folder = 'vibehub') => {
  if (!file) return null;

  // Cloudinary upload
  if (config.cloudinary.isConfigured && file.path) {
    try {
      const isVideo = file.mimetype && file.mimetype.startsWith('video/');
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `vibehub/${folder}`,
        resource_type: isVideo ? 'video' : 'auto',
      });

      // Cleanup temp local file
      try {
        fs.unlinkSync(file.path);
      } catch {
        // Ignore cleanup failure
      }

      return result.secure_url;
    } catch (error) {
      console.warn('[StorageService] Cloudinary upload failed, falling back to local file URL:', error.message);
    }
  }

  // Local storage fallback: Return relative URL path served by Express
  const filename = path.basename(file.path);
  return `/uploads/${filename}`;
};

export default {
  uploadMedia,
};
