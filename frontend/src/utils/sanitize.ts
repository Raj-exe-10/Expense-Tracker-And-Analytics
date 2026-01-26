/**
 * Input Sanitization Utilities
 * Prevents XSS attacks by sanitizing user input
 */
import DOMPurify from 'dompurify';

/**
 * Sanitize plain text input (removes all HTML)
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

/**
 * Sanitize HTML content (allows safe HTML tags)
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
};

/**
 * Validate and sanitize URL
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Sanitize file name
 */
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName) return '';
  
  // Remove path traversal attempts and dangerous characters
  return fileName
    .replace(/\.\./g, '')  // Remove ..
    .replace(/\//g, '_')   // Replace / with _
    .replace(/\\/g, '_')   // Replace \ with _
    .replace(/[<>:"|?*]/g, '_')  // Replace dangerous characters
    .trim();
};
