import { jsPDF } from 'jspdf'

/**
 * Utility functions for optimizing, compressing, previewing, and downloading images and PDF documents.
 */

/**
 * Compresses an image File client-side before uploading.
 * Resizes the image to fit within maxWidth / maxHeight and exports a compressed Blob/File.
 * This cuts upload time by 90%+ (e.g., reduces 10MB camera photos to ~150-300KB).
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
    if (url.includes('/upload/c_') || url.includes('/upload/w_') || url.includes('/upload/f_') || url.includes('/upload/q_') || url.includes('/upload/pg_')) {
      return url
    }

    const transform = `f_auto,q_${quality},w_${width},c_${crop}`
    return url.replace('/upload/', `/upload/${transform}/`)
  }

  return url
}

/**
 * Determines whether a URL or fileType represents a PDF document.
 *
 * @param {string} url - URL or filename
 * @param {string} [fileType] - Optional explicit fileType ('PDF', 'IMAGE', etc.)
 * @returns {boolean}
 */
export function isPdfDocument(url, fileType = '') {
  if (fileType && String(fileType).toUpperCase() === 'PDF') return true
  if (!url || typeof url !== 'string') return false
  const clean = url.split('?')[0].toLowerCase()
  return clean.endsWith('.pdf') || clean.includes('.pdf/') || clean.includes('/pdf')
}

/**
 * Converts a Cloudinary PDF URL into an image URL for previewing a specific page.
 * Cloudinary can render any page of a PDF document as a crisp JPG image.
 * This completely resolves the HTTP 401 Unauthorized restriction for PDF viewing.
 *
 * @param {string} url - Original Cloudinary URL (e.g. ".../v12345/document.pdf")
 * @param {object} options
 * @param {number} options.page - Page number (1-indexed, default 1)
 * @param {number} options.width - Max preview width (default 1200)
 * @param {string|number} options.quality - Quality (default 'auto')
 * @returns {string} - Preview image URL
 */
export function getPdfPreviewUrl(url, { page = 1, width = 1200, quality = 'auto' } = {}) {
  if (!url || typeof url !== 'string') return url

  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // Replace .pdf with .jpg at the end of the public ID
    let cleanedUrl = url.replace(/\.pdf(\?.*)?$/i, '.jpg$1')

    // If no extension exists, append .jpg
    if (!cleanedUrl.endsWith('.jpg') && !cleanedUrl.endsWith('.png')) {
      cleanedUrl = cleanedUrl + '.jpg'
    }

    // Strip existing transformation if present to prevent stacking
    cleanedUrl = cleanedUrl.replace(/\/upload\/(pg_\d+,)?[^/]+\//, '/upload/')

    const transform = `pg_${page},w_${width},q_${quality}`
    return cleanedUrl.replace('/upload/', `/upload/${transform}/`)
  }

  return url
}

/**
 * Generates a fast, lightweight thumbnail image URL for the first page of a PDF document.
 *
 * @param {string} url - Cloudinary PDF or image URL
 * @param {object} options
 * @param {number} options.width - Thumbnail width in pixels (default 320)
 * @returns {string}
 */
export function getPdfThumbnailUrl(url, { width = 320 } = {}) {
  return getPdfPreviewUrl(url, { page: 1, width, quality: 'auto' })
}

/**
 * Downloads a PDF or image document safely to the client machine.
 * For Cloudinary PDFs, it fetches the rendered high-resolution page(s) and builds a clean PDF using jsPDF.
 *
 * @param {string} url - Document URL
 * @param {string} [fileName='document.pdf'] - Download target file name
 * @param {number} [pageCount=1] - Number of pages (default 1)
 */
export async function downloadDocumentFile(url, fileName = 'document.pdf', pageCount = 1) {
  if (!url) return

  const isPdf = isPdfDocument(url)
  const isCloudinary = url.includes('res.cloudinary.com') && url.includes('/upload/')

  if (isPdf && isCloudinary) {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'px' })
      let hasPage = false

      for (let p = 1; p <= pageCount; p++) {
        const pageImgUrl = getPdfPreviewUrl(url, { page: p, width: 1600, quality: 90 })
        const res = await fetch(pageImgUrl)
        if (!res.ok) break

        const blob = await res.blob()
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })

        if (hasPage) {
          doc.addPage()
        }

        const imgProps = doc.getImageProperties(base64)
        const pdfWidth = doc.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
        doc.addImage(base64, 'JPEG', 0, 0, pdfWidth, pdfHeight)
        hasPage = true
      }

      if (hasPage) {
        doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`)
        return
      }
    } catch (err) {
      console.warn('Client-side jsPDF generation failed, falling back to direct download:', err)
    }
  }

  // Fallback direct download via Blob
  try {
    const downloadUrl = isPdf && isCloudinary ? getPdfPreviewUrl(url, { page: 1, width: 1600 }) : url
    const res = await fetch(downloadUrl)
    const blob = await res.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(blobUrl)
  } catch {
    window.open(url, '_blank')
  }
}
