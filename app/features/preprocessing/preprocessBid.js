// File: app/features/preprocessing/preprocessBid.js
import { BOILERPLATE_PATTERNS, LEGAL_BOILERPLATE, KEY_SECTIONS } from './constants';
import { extractTextFromPDF } from './pdfExtractor';
import { processTextWithNLP } from './nlpProcessor';

// Helper function for basic cleaning
function basicClean(text) {
  return text
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// Helper function to remove a set of regex patterns from the text
function removePatterns(text, patterns) {
  let result = text;
  patterns.forEach(pattern => {
    result = result.replace(pattern, '');
  });
  return result;
}

// Helper function to extract key sections from the text
function extractKeySections(text) {
  const sections = text.split(/\n(?=[A-Z][A-Z\s]+:)/);
  return sections.filter(section =>
    KEY_SECTIONS.some(phrase => section.toUpperCase().includes(phrase))
  );
}

export async function preprocessBid(input, isPdf = false) {
  let text = input; // Preserve the original input for fallback
  let nlpResults = {};
  
  try {
    // If the input is a PDF, extract text from it first
    if (isPdf) {
      try {
        text = await extractTextFromPDF(input);
        if (!text) {
          console.warn('PDF extraction returned empty text, using original input');
          text = typeof input === 'string' ? input : '';
        }
      } catch (pdfError) {
        console.error('PDF extraction failed:', pdfError);
        text = typeof input === 'string' ? input : '';
      }
    }

    // Input validation
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: Expected string');
    }

    // 1. Basic cleaning
    let processed = basicClean(text);

    // 2. Remove boilerplate headers/footers
    processed = removePatterns(processed, BOILERPLATE_PATTERNS);

    // 3. Remove redundant legal text
    processed = removePatterns(processed, LEGAL_BOILERPLATE);

    // 4. Extract key sections
    const relevantSections = extractKeySections(processed);
    
    // If no key sections were found, use the entire processed text
    processed = relevantSections.length > 0 
      ? basicClean(relevantSections.join('\n\n'))
      : processed;

    // Calculate token statistics
    const originalTokenCount = text.split(/\s+/).filter(Boolean).length;
    const processedTokenCount = processed.split(/\s+/).filter(Boolean).length;
    const reductionPercent = originalTokenCount === 0 ? 0 :
      ((originalTokenCount - processedTokenCount) / originalTokenCount * 100).toFixed(1);

    // NLP processing on the final text (with error handling)
    try {
      nlpResults = processTextWithNLP(processed);
    } catch (nlpError) {
      console.error('NLP processing failed:', nlpError);
      nlpResults = { topics: [], numbers: [], dates: [] };
    }

    // Validate output
    if (!processed) {
      throw new Error('Preprocessing resulted in empty text');
    }

    return {
      processedText: processed,
      stats: {
        originalTokens: originalTokenCount,
        processedTokens: processedTokenCount,
        reductionPercent: Number(reductionPercent)
      },
      nlp: nlpResults
    };
  } catch (error) {
    console.error('Preprocessing failed:', error);
    // Ensure safe fallback: if text isn't a string, default to an empty string
    const safeText = (typeof text === 'string') ? text : '';
    const tokenCount = safeText.trim() === '' ? 0 : safeText.split(/\s+/).filter(Boolean).length;
    return {
      processedText: safeText,
      stats: {
        originalTokens: tokenCount,
        processedTokens: tokenCount,
        reductionPercent: 0
      },
      nlp: { topics: [], numbers: [], dates: [] },
      error: error.message
    };
  }
}