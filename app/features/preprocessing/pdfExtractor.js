// File: app/features/preprocessing/pdfExtractor.js
import pdfParse from 'pdf-parse';

export async function extractTextFromPDF(pdfInput) {
  try {
    // Handle different input types
    let dataBuffer;
    
    if (Buffer.isBuffer(pdfInput)) {
      // Already a buffer
      dataBuffer = pdfInput;
    } else if (typeof pdfInput === 'string') {
      // Try to interpret as base64
      try {
        dataBuffer = Buffer.from(pdfInput, 'base64');
      } catch (e) {
        // If not base64, just use the string content
        dataBuffer = Buffer.from(pdfInput);
      }
    } else if (pdfInput instanceof ArrayBuffer) {
      // Convert ArrayBuffer to Buffer
      dataBuffer = Buffer.from(pdfInput);
    } else {
      throw new Error('Unsupported PDF input format');
    }
    
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    // Return empty string instead of throwing
    return '';
  }
}