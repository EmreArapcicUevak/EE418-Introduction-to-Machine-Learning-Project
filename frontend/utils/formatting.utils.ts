/**
 * Utility functions for formatting and displaying data
 */

/**
 * Format price in KM with proper separators
 */
export const formatPrice = (price: number | null | undefined): string => {
  if (!price) return 'On request'
  return `${price.toLocaleString()} KM`
}

/**
 * Format price in EUR (conversion rate ~2:1)
 */
export const formatPriceEur = (price: number | null | undefined): string => {
  if (!price) return ''
  return `≈ €${Math.round(price / 2).toLocaleString()}`
}

/**
 * Format square meters
 */
export const formatSquareMeters = (size: number | null | undefined): string => {
  if (!size) return 'N/A'
  return `${size} m²`
}

/**
 * Format rooms
 */
export const formatRooms = (rooms: number | null | undefined): string => {
  if (!rooms) return 'N/A'
  return rooms === 1 ? '1 room' : `${rooms} rooms`
}

/**
 * Get deal score color based on score value
 */
export const getDealScoreColor = (score: number): string => {
  if (score >= 90) return '#10b981' // green
  if (score >= 70) return '#3b82f6' // blue
  if (score >= 50) return '#f59e0b' // orange
  return '#ef4444' // red
}

/**
 * Get deal score label
 */
export const getDealScoreLabel = (score: number): string => {
  if (score >= 90) return 'Excellent Deal'
  if (score >= 70) return 'Good Deal'
  if (score >= 50) return 'Fair Price'
  return 'Overpriced'
}

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Format date to readable string
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 7) return formatDate(dateString)
    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return 'Just now'
  } catch {
    return 'N/A'
  }
}

/**
 * Calculate price per square meter
 */
export const calculatePricePerM2 = (
  price: number | null | undefined,
  size: number | null | undefined
): number | null => {
  if (!price || !size || size === 0) return null
  return Math.round(price / size)
}

/**
 * Format price per square meter
 */
export const formatPricePerM2 = (
  price: number | null | undefined,
  size: number | null | undefined
): string => {
  const pricePerM2 = calculatePricePerM2(price, size)
  if (!pricePerM2) return 'N/A'
  return `${pricePerM2.toLocaleString()} KM/m²`
}
