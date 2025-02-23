// File: __tests__/preprocessing.test.js
const { preprocessBid } = require('@/features/preprocessing');

describe('Bid Preprocessing', () => {
  const sampleBid = `
CONFIDENTIAL DOCUMENT - DO NOT DISTRIBUTE
Page 1 of 45
Document ID: BID-2024-001
Revision: A
Date: 02/23/2024

SECTION 1: PRICING DETAILS

In accordance with standard construction practices and
as per the specifications outlined in Document A-101,
the following pricing is provided:

Unit Cost: $500,000
Labor: $300,000
Materials: $200,000

Subject to the terms and conditions outlined in the contract documents.

SECTION 2: LEGAL DISCLAIMERS
... standard legal text ...

SECTION 3: SCOPE OF WORK
Project includes complete renovation of building entrance
including structural modifications and finishing work.

Page 2 of 45
CONFIDENTIAL DOCUMENT - DO NOT DISTRIBUTE
  `;

  test('removes boilerplate headers and footers', async () => {
    const { processedText } = await preprocessBid(sampleBid);
    
    expect(processedText).not.toContain('CONFIDENTIAL DOCUMENT');
    expect(processedText).not.toContain('Page 1 of 45');
    expect(processedText).not.toContain('Document ID:');
  });

  test('removes redundant legal text', async () => {
    const { processedText } = await preprocessBid(sampleBid);
    
    expect(processedText).not.toContain('In accordance with standard construction practices');
    expect(processedText).not.toContain('Subject to the terms and conditions');
  });

  test('keeps important pricing information', async () => {
    const { processedText } = await preprocessBid(sampleBid);
    
    expect(processedText).toContain('Unit Cost: $500,000');
    expect(processedText).toContain('Labor: $300,000');
    expect(processedText).toContain('Materials: $200,000');
  });

  test('keeps scope of work information', async () => {
    const { processedText } = await preprocessBid(sampleBid);
    
    expect(processedText).toContain('Project includes complete renovation');
  });

  test('calculates correct token reduction', async () => {
    const { stats } = await preprocessBid(sampleBid);
    
    expect(stats.originalTokens).toBeGreaterThan(stats.processedTokens);
    expect(stats.reductionPercent).toBeGreaterThan(0);
  });

  test('handles empty input', async () => {
    const { processedText, stats, error } = await preprocessBid('');
    
    expect(processedText).toBe('');
    expect(stats.originalTokens).toBe(0);
    expect(stats.processedTokens).toBe(0);
    expect(error).toBeDefined();
  });

  test('handles null input', async () => {
    const { processedText, stats, error } = await preprocessBid(null);
    
    expect(processedText).toBe('');
    expect(stats.originalTokens).toBe(0);
    expect(stats.processedTokens).toBe(0);
    expect(error).toBeDefined();
  });
});