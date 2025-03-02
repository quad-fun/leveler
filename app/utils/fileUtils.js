/**
 * Utility functions for file handling in the BidUpload component
 */

/**
 * Extract a bidder name from a filename
 * @param {string} filename - The filename to extract from
 * @returns {string} The extracted bidder name
 */
export function extractBidderFromFilename(filename) {
  if (!filename) return 'Unknown Bidder';
  
  // Remove file extension
  let name = filename.split('.')[0];
  
  // Replace underscores and hyphens with spaces
  name = name.replace(/[_-]/g, ' ');
  
  // Handle common filename prefixes
  name = name.replace(/^bid_/i, '')
             .replace(/^proposal_/i, '')
             .replace(/^quote_/i, '');
  
  // Capitalize words
  name = name.split(' ')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
             .join(' ');
  
  return name || 'Unknown Bidder';
}

/**
 * Format a file size in bytes to a human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Validate if a file type is allowed
 * @param {File} file - The file to validate
 * @param {string[]} allowedTypes - Array of allowed file extensions or MIME types
 * @returns {boolean} Whether the file type is allowed
 */
export function validateFileType(file, allowedTypes) {
  if (!file || !allowedTypes || !allowedTypes.length) return false;
  
  // Check by file extension
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (allowedTypes.includes(extension)) return true;
  
  // Check by MIME type
  return allowedTypes.includes(file.type);
}

/**
 * Get an icon name based on file type
 * @param {string} filename - The filename to check
 * @returns {string} Icon name to use
 */
export function getFileTypeIcon(filename) {
  if (!filename) return 'File';
  
  const extension = filename.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'FileText';
    case 'doc':
    case 'docx':
      return 'FileText';
    case 'xls':
    case 'xlsx':
    case 'csv':
      return 'FileSpreadsheet';
    case 'zip':
    case 'rar':
    case '7z':
      return 'FileArchive';
    default:
      return 'File';
  }
}