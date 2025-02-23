// File: app/features/preprocessing/pdfExtractor.js
import fs from 'fs';
import pdfParse from 'pdf-parse';

export async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.promises.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw error;
  }
}