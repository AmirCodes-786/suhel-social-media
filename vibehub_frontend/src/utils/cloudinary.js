/**
 * Cloudinary URL transformation helpers
 * Used to optimize image payload sizes for mobile networks.
 */

export const getCloudinaryUrl = (originalUrl, options = {}) => {
  if (!originalUrl || !originalUrl.includes('res.cloudinary.com')) {
    return originalUrl;
  }

  const { width = 'auto', quality = 'auto', format = 'webp', crop = 'scale' } = options;
  
  // Avoid modifying video URLs which often have different parameters, though format=webp works for some, 
  // generally videos are requested as .mp4 or handled by VibeVideoPlayer natively.
  if (originalUrl.includes('/video/upload/')) {
    // Basic video optimization
    const parts = originalUrl.split('/upload/');
    if (parts.length !== 2) return originalUrl;
    if (parts[1].startsWith('q_') || parts[1].startsWith('f_')) return originalUrl;
    return `${parts[0]}/upload/q_auto,f_auto/${parts[1]}`;
  }

  const parts = originalUrl.split('/upload/');
  if (parts.length !== 2) return originalUrl;
  
  // Don't double-transform if already transformed
  if (parts[1].startsWith('c_') || parts[1].startsWith('w_') || parts[1].startsWith('q_') || parts[1].startsWith('f_')) {
    return originalUrl; 
  }

  let transformString = `f_${format},q_${quality}`;
  
  if (width && width !== 'auto') {
    transformString += `,c_${crop},w_${width}`;
  }

  return `${parts[0]}/upload/${transformString}/${parts[1]}`;
};

export const getOptimizedProfilePic = (url) => getCloudinaryUrl(url, { width: 150, crop: 'fill' });
export const getOptimizedThumbnail = (url) => getCloudinaryUrl(url, { width: 400, crop: 'fill' });
export const getOptimizedFeedImage = (url) => getCloudinaryUrl(url, { width: 800 });
export const getOptimizedLightboxImage = (url) => getCloudinaryUrl(url, { width: 1600 });
