// File: app/features/preprocessing/constants.js
export const BOILERPLATE_PATTERNS = [
    /CONFIDENTIAL DOCUMENT\s*-*\s*.*/gi,
    /Page \d+ of \d+/gi,
    /Document ID:?\s*[A-Z0-9-]+/gi,
    /Revision:?\s*[A-Z0-9-]+/gi,
    /Date:?\s*\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/gi
  ];
  
  export const LEGAL_BOILERPLATE = [
    /In accordance with standard construction practices/gi,
    /as per the specifications outlined in/gi,
    /as defined in the contract documents/gi,
    /subject to the terms and conditions/gi
  ];
  
  export const KEY_SECTIONS = [
    'PRICING',
    'COST BREAKDOWN',
    'SCOPE OF WORK',
    'SCHEDULE',
    'MATERIALS',
    'LABOR',
    'EQUIPMENT'
  ];
  
  