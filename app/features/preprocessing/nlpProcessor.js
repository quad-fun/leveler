// File: app/features/preprocessing/nlpProcessor.js
import nlp from 'compromise';
import nlpDates from 'compromise-dates';

nlp.extend(nlpDates);

export function processTextWithNLP(text) {
  try {
    const doc = nlp(text);
    const topics = doc.topics().out('frequency'); // key topics
    const numbers = doc.numbers().out('array');     // extract numbers
    const dates = doc.dates().out('array');         // extract dates

    return { topics, numbers, dates };
  } catch (error) {
    console.error('NLP processing error:', error);
    throw error;
  }
}