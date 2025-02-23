// File: app/features/preprocessing/preprocessBid.js
import { BOILERPLATE_PATTERNS, LEGAL_BOILERPLATE, KEY_SECTIONS } from './constants.js';
import { extractTextFromPDF } from './pdfextractor.js';
import { processTextWithNLP } from './nlpProcessor.js';

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
  try {
    // If the input is a PDF, extract text from it first
    if (isPdf) {
      text = await extractTextFromPDF(input);
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

    // 5. Final cleanup
    processed = basicClean(relevantSections.join('\n\n'));

    // Calculate token statistics
    const originalTokenCount = text.split(/\s+/).length;
    const processedTokenCount = processed.split(/\s+/).length;
    const reductionPercent = ((originalTokenCount - processedTokenCount) / originalTokenCount * 100).toFixed(1);

    // NLP processing on the final text
    const nlpResults = processTextWithNLP(processed);

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
    const tokenCount = safeText.trim() === '' ? 0 : safeText.split(/\s+/).length;
    return {
      processedText: safeText,
      stats: {
        originalTokens: tokenCount,
        processedTokens: tokenCount,
        reductionPercent: 0
      },
      error: error.message
    };
  }
}