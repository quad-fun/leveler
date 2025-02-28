// app/utils/fileUtils.js

/**
 * Extracts bidder name from filename using common patterns
 * @param {string} filename The name of the file
 * @returns {string} Extracted bidder name
 */
export function extractBidderFromFilename(filename) {
    // Remove file extension
    const nameWithoutExtension = filename.split('.')[0];
    
    // Replace common separators with spaces
    let bidderName = nameWithoutExtension
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\./g, ' ');
    
    // Handle common bid file naming patterns
    bidderName = bidderName
      .replace(/bid /i, '')
      .replace(/proposal /i, '')
      .replace(/quote /i, '')
      .replace(/ estimate$/i, '')
      .replace(/^from /i, '');
      
    // Capitalize first letter of each word
    bidderName = bidderName.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return bidderName.trim();
  }
  
  /**
   * Formats a file size in bytes to a human-readable string
   * @param {number} bytes File size in bytes
   * @param {number} decimals Number of decimal places to show
   * @returns {string} Formatted file size
   */
  export function formatFileSize(bytes, decimals = 0) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  /**
   * Validates file type against a list of allowed types
   * @param {File} file The file to validate
   * @param {string[]} allowedTypes Array of allowed MIME types or extensions
   * @returns {boolean} Whether the file is valid
   */
  export function validateFileType(file, allowedTypes) {
    if (!file || !allowedTypes || !allowedTypes.length) return false;
    
    // Check file extension
    const extension = file.name.split('.').pop().toLowerCase();
    
    // Check both MIME type and extension
    return allowedTypes.some(type => {
      if (type.startsWith('.')) {
        // It's an extension
        return `.${extension}` === type.toLowerCase();
      }
      
      // It's a MIME type
      return file.type.toLowerCase() === type.toLowerCase();
    });
  }
  
  /**
   * Gets appropriate icon for file type
   * @param {string} filename The name of the file
   * @returns {string} Icon name 
   */
  export function getFileTypeIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'FileText';
      case 'doc':
      case 'docx':
        return 'FileText';
      case 'xls':
      case 'xlsx':
        return 'FileSpreadsheet';
      case 'ppt':
      case 'pptx':
        return 'FilePresentation';
      case 'zip':
      case 'rar':
        return 'FileArchive';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'Image';
      default:
        return 'File';
    }
  }