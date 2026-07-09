export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Returns the correct image src for rendering.
 * Handles both legacy base64 data URIs and new /uploads/ paths.
 */
export function getImageSrc(imageUrl) {
  if (!imageUrl) return null
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) return imageUrl
  return `${API_URL}${imageUrl}`
}
