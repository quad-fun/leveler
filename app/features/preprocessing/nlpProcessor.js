// File: app/features/preprocessing/nlpProcessor.js
export function processTextWithNLP(text) {
    try {
      // Simple fallback implementation in case the libraries aren't available
      // This ensures the code won't break even if NLP libraries are missing
      
      // Basic extraction of numbers (approximate)
      const numberRegex = /\$?(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)/g;
      const numbers = (text.match(numberRegex) || [])
        .map(n => n.replace(/,/g, ''))
        .map(n => n.startsWith('$') ? n.substring(1) : n);
      
      // Basic extraction of dates (approximate)
      const dateRegex = /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/g;
      const dates = text.match(dateRegex) || [];
      
      // Basic topic extraction (just get most frequent words)
      const words = text.toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 4)
        .filter(word => !['these', 'those', 'their', 'there', 'would', 'should', 'could'].includes(word));
        
      const wordFreq = {};
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
      
      const topics = Object.keys(wordFreq)
        .sort((a, b) => wordFreq[b] - wordFreq[a])
        .slice(0, 10)
        .map(word => ({ word, count: wordFreq[word] }));
      
      return { topics, numbers, dates };
    } catch (error) {
      console.error('NLP processing error:', error);
      // Return empty objects instead of throwing
      return { topics: [], numbers: [], dates: [] };
    }
  }