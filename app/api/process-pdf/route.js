// app/api/process-pdf/route.js
import { NextResponse } from 'next/server';
import * as pdfjs from 'pdfjs-dist';

// Set up the worker for PDF.js
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function POST(request) {
  try {
    // Check if the request is multipart/form-data
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      // Try to handle as JSON with base64 data
      const body = await request.json();
      
      if (!body.pdfData) {
        return NextResponse.json({ error: 'No PDF data provided' }, { status: 400 });
      }
      
      // Convert base64 to buffer
      const base64Data = body.pdfData.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      console.log(`Received PDF data (${buffer.length} bytes) for processing`);
      
      // Extract text from PDF
      const text = await extractTextFromPDF(buffer);
      
      return NextResponse.json({ 
        success: true, 
        text,
        stats: {
          extractedCharacters: text.length,
          estimatedTokens: Math.ceil(text.length / 4)
        }
      });
    }
    
    // Handle multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    console.log(`Received PDF file (${buffer.length} bytes) for processing`);
    
    // Extract text from PDF
    const text = await extractTextFromPDF(buffer);
    
    return NextResponse.json({ 
      success: true, 
      text,
      stats: {
        extractedCharacters: text.length,
        estimatedTokens: Math.ceil(text.length / 4)
      }
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ 
      error: 'Failed to process PDF',
      message: error.message
    }, { status: 500 });
  }
}

/**
 * Extract text content from a PDF buffer
 * @param {Buffer} pdfBuffer - PDF buffer data
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPDF(pdfBuffer) {
  try {
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
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