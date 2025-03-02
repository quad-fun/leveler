// app/utils/pdfUtils.js
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Set up the worker for PDF.js
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extract text content from a PDF buffer
 * @param {Buffer|ArrayBuffer} pdfBuffer - PDF buffer data
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPDF(pdfBuffer) {
  try {
    // Convert to Uint8Array if needed
    let uint8Array;
    if (pdfBuffer instanceof Buffer) {
      uint8Array = new Uint8Array(pdfBuffer);
    } else if (pdfBuffer instanceof ArrayBuffer) {
      uint8Array = new Uint8Array(pdfBuffer);
    } else {
      uint8Array = pdfBuffer;
    }

    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF document loaded with ${pdf.numPages} pages`);
    
    // Extract text from all pages
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}/${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map(item => item.str).join(' ');
      fullText += textItems + '\n\n';
    }
    
    console.log(`Successfully extracted ${fullText.length} characters of text from PDF`);
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

/**
 * Detect if the content is binary PDF data
 * @param {string|Buffer} content - Content to check
 * @returns {boolean} - True if content appears to be binary PDF data
 */
export function isBinaryPDF(content) {
  // If it's a buffer, convert to string representation
  if (content instanceof Buffer) {
    // Check first 5 bytes for PDF signature
    return content.slice(0, 5).toString('ascii').includes('%PDF-');
  }
  
  // If string is very short and doesn't have text indicators, likely binary
  if (typeof content === 'string') {
    if (content.length < 500) {
      // Check for PDF signature
      if (content.startsWith('%PDF-')) return true;
      
      // Check if content has mostly non-printable characters
      const nonPrintableCount = Array.from(content).filter(c => {
        const code = c.charCodeAt(0);
        return code < 32 || code > 126;
      }).length;
      
      // If more than 30% non-printable, likely binary
      if (nonPrintableCount / content.length > 0.3) return true;
    }
  }
  
  return false;
}

/**
 * Convert base64 string to buffer
 * @param {string} base64 - Base64 string
 * @returns {Buffer} - Buffer
 */
export function base64ToBuffer(base64) {
  return Buffer.from(base64, 'base64');
}
