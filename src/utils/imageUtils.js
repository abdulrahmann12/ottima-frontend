/**
 * Utility functions for optimizing, compressing, and transforming image files and URLs.
 */

/**
 * Compresses an image File client-side before uploading.
 * Resizes the image to fit within maxWidth / maxHeight and exports a compressed Blob/File.
 * This prevents UI lag and cuts upload time by 90%+ (e.g., reduces 10MB phone camera photos to ~150-300KB).
 *
 * @param {File} file - The original File object selected by the user
 * @param {object} options
 * @param {number} options.maxWidth - Max width in pixels (default 1600)
 * @param {number} options.maxHeight - Max height in pixels (default 1600)
 * @param {number} options.quality - Compression quality 0.0 to 1.0 (default 0.82)
 * @returns {Promise<File>} - Compressed File object (or original if not an image or already small)
 */
export async function compressImageFile(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = {}) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file // Return non-image files (e.g. PDFs) unchanged
  }

  // GIFs or SVGs should not be compressed via canvas
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }

  // If already under 350KB, no need for heavy compression
  if (file.size < 350 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onerror = () => resolve(file)
    reader.onload = (readerEvent) => {
      const img = new Image()
      img.onerror = () => resolve(file)
      img.onload = () => {
        try {
          let { width, height } = img

          // Calculate aspect ratio-preserving dimensions
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            } else {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            resolve(file)
            return
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                resolve(file)
                return
              }

              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, outputType === 'image/jpeg' ? '.jpg' : '.png'), {
                type: outputType,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            },
            outputType,
            quality
          )
        } catch {
          resolve(file)
        }
      }
      img.src = readerEvent.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Optimizes Cloudinary image URLs with automatic format (WebP/AVIF),
 * automatic quality compression, and responsive dimension limits.
 * This prevents browser freezing and huge bandwidth consumption when
 * rendering user-uploaded high-resolution camera photos.
 *
 * @param {string} url - Original image URL
 * @param {object} options
 * @param {number} options.width - Max width in pixels (default 800)
 * @param {string|number} options.quality - Cloudinary quality setting (default 'auto')
 * @param {string} options.crop - Crop mode (default 'limit')
 * @returns {string} - Optimized image URL
 */
export function optimizeCloudinaryUrl(url, { width = 800, quality = 'auto', crop = 'limit' } = {}) {
  if (!url || typeof url !== 'string') return url

  // Only apply to Cloudinary upload URLs
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // If already contains transformation params, do not re-transform
    if (url.includes('/upload/c_') || url.includes('/upload/w_') || url.includes('/upload/f_') || url.includes('/upload/q_')) {
      return url
    }

    const transform = `f_auto,q_${quality},w_${width},c_${crop}`
    return url.replace('/upload/', `/upload/${transform}/`)
  }

  return url
}
