/**
 * Enhanced bid document preprocessor with PDF handling capabilities
 */

// Optional PDF.js import if you want to use it directly
// import * as pdfjs from 'pdfjs-dist';

/**
 * Preprocess bid documents with improved PDF handling
 * @param {Array} fileContents Array of {name, content, type} objects
 * @param {number} maxLength Maximum content length per document
 * @returns {Array} Processed file contents
 */
export function preprocessBidDocuments(fileContents, maxLength = 10000) {
  return fileContents.map(file => {
    let processedContent = file.content;
    const originalLength = processedContent.length;
    const fileType = file.type || detectFileType(file.name);
    
    console.log(`Processing file ${file.name}, type: ${fileType}, original size: ${originalLength}`);
    
    // Step 1: Handle PDF-specific preprocessing if needed
    if (fileType === 'pdf') {
      // If content is actually text extracted from PDF already, ensure it's formatted properly
      processedContent = cleanPdfExtractedText(processedContent);
    }
    
    // Step 2: Extract important information (costs, timeline, materials, labor)
    const extractedInfo = extractKeyInformation(processedContent);
    
    // Log what we found for debugging
    if (extractedInfo.totalCost) {
      console.log(`Found total cost: ${extractedInfo.totalCost}`);
    } else {
      console.warn(`No total cost found in ${file.name}!`);
    }
    
    // Step 3: Basic removal of common boilerplate text
    processedContent = removeBoilerplate(processedContent);
    
    // Step 4: Intelligent truncation that preserves critical information
    if (processedContent.length > maxLength) {
      processedContent = truncateWithContext(processedContent, maxLength, extractedInfo);
    }
    
    // Log reduction statistics
    const newLength = processedContent.length;
    const reductionPercent = ((originalLength - newLength) / originalLength * 100).toFixed(1);
    
    console.log(`Preprocessed ${file.name}: ${originalLength} → ${newLength} chars (${reductionPercent}% reduction)`);
    
    return {
      name: file.name,
      content: processedContent,
      originalSize: originalLength
    };
  });
}

/**
 * Detect file type from filename
 */
function detectFileType(filename) {
  if (!filename) return 'text';
  
  const extension = filename.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'word';
    case 'xlsx':
    case 'xls':
      return 'excel';
    default:
      return 'text';
  }
}

/**
 * Clean and format text extracted from PDFs
 */
function cleanPdfExtractedText(content) {
  if (!content) return '';
  
  // PDF extraction often has formatting issues to fix
  let cleaned = content;
  
  // Remove excessive spaces that often appear in PDF extraction
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  
  // Fix broken bullet points
  cleaned = cleaned.replace(/•\s+/g, '• ');
  
  // Fix line breaks that might have been inserted mid-sentence
  cleaned = cleaned.replace(/(\w)-\n(\w)/g, '$1$2');
  
  // Normalize newlines
  cleaned = cleaned.replace(/\r\n/g, '\n');
  
  // Remove page headers/numbers that may repeat in PDFs
  cleaned = cleaned.replace(/Page \d+ of \d+/g, '');
  cleaned = cleaned.replace(/Page \d+[\s\-–—]*[\w\s]+/g, '');
  
  return cleaned.trim();
}

/**
 * Extract key information from the content with improved PDF support
 */
function extractKeyInformation(content) {
  const extractedInfo = {
    // Cost information
    totalCost: null,
    costBreakdown: [],
    
    // Timeline information
    projectDuration: null,
    completionDate: null,
    timelineDetails: [],
    
    // Materials information
    materialsList: [],
    
    // Labor information
    laborCost: null,
    laborDetails: []
  };
  
  // IMPROVED COST EXTRACTION WITH PDF FORMAT AWARENESS
  
  // Look for total bid/project cost in various formats that appear in PDFs
  const totalCostPatterns = [
    /total bid of \$?(\d+(?:\.\d+)?)\s*(?:million|m|billion|b)?/i,
    /total project cost:?\s*\$?(\d+(?:\.\d+)?)\s*(?:million|m|billion|b)?/i,
    /propose(?:s|d)? a total (?:bid|cost) of \$?(\d+(?:\.\d+)?)\s*(?:million|m|billion|b)?/i,
    /budget allocation:(?:.|\n)*.{0,100}?total:?\s*\$?(\d+(?:\.\d+)?)\s*(?:million|m|billion|b)?/is,
    /total cost:?\s*\$?(\d+(?:\.\d+)?)\s*(?:million|m|billion|b)?/i,
    /estimate(?:d|s)? cost:?\s*\$?(\d+(?:\.\d+)?)\s*(?:million|m|billion|b)?/i
  ];
  
  // Try each pattern until we find a match
  for (const pattern of totalCostPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      // Capture the value and convert if needed (e.g., "505 million" to "505000000")
      let value = match[1];
      const fullMatch = match[0];
      
      // Check if it contains "million" or "billion" and convert accordingly
      if (fullMatch.match(/million|m/i)) {
        value = parseFloat(value) * 1000000;
      } else if (fullMatch.match(/billion|b/i)) {
        value = parseFloat(value) * 1000000000;
      }
      
      extractedInfo.totalCost = {
        originalText: fullMatch,
        value: value,
        formatted: formatCurrency(value)
      };
      
      break; // Stop after finding the first valid match
    }
  }
  
  // Look for budget/cost breakdown sections
  const budgetSectionPatterns = [
    /budget allocation:(?:.|\n)*?(?:total|contingency)/is,
    /cost allocation:(?:.|\n)*?(?:total|contingency)/is,
    /detailed cost components:(?:.|\n)*?(?:total|overhead)/is
  ];
  
  let budgetSection = '';
  for (const pattern of budgetSectionPatterns) {
    const match = content.match(pattern);
    if (match && match[0]) {
      budgetSection = match[0];
      break;
    }
  }
  
  // Extract individual cost items from budget section
  if (budgetSection) {
    // Pattern for lines with cost items: description followed by amount
    const costItemPattern = /([^:\n$]+):\s*\$?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:million|m)?/g;
    let match;
    
    while ((match = costItemPattern.exec(budgetSection)) !== null) {
      if (match[1] && match[2]) {
        let category = match[1].trim();
        let value = match[2].replace(/,/g, '');
        
        // Check if it contains "million" and convert
        if (match[0].toLowerCase().includes('million') || match[0].toLowerCase().includes(' m')) {
          value = parseFloat(value) * 1000000;
        } else {
          value = parseFloat(value);
        }
        
        extractedInfo.costBreakdown.push({
          category: category,
          value: value,
          formatted: formatCurrency(value)
        });
      }
    }
  }
  
  // Extract labor costs specifically
  const laborCostPattern = /labor:?\s*\$?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:million|m)?/i;
  const laborMatch = content.match(laborCostPattern);
  
  if (laborMatch && laborMatch[1]) {
    let value = laborMatch[1].replace(/,/g, '');
    if (laborMatch[0].toLowerCase().includes('million')) {
      value = parseFloat(value) * 1000000;
    } else {
      value = parseFloat(value);
    }
    
    extractedInfo.laborCost = {
      originalText: laborMatch[0],
      value: value,
      formatted: formatCurrency(value)
    };
  }
  
  // TIMELINE EXTRACTION
  // Look for project duration
  const durationPattern = /(?:total construction duration|project duration|total duration|completion timeline):?\s*(\d+)\s*(?:months|years)/i;
  const durationMatch = content.match(durationPattern);
  
  if (durationMatch && durationMatch[1]) {
    extractedInfo.projectDuration = {
      originalText: durationMatch[0],
      value: parseInt(durationMatch[1]),
      unit: durationMatch[0].toLowerCase().includes('month') ? 'months' : 'years'
    };
  }
  
  // Extract timeline phases
  const phasePattern = /phase\s*(\d+)\s*\(?(?:months|weeks)?\s*(\d+[-–—]?\d*)\)?:?\s*([^:\n]*)/gi;
  let phaseMatch;
  
  while ((phaseMatch = phasePattern.exec(content)) !== null) {
    if (phaseMatch[1] && phaseMatch[3]) {
      extractedInfo.timelineDetails.push({
        phase: parseInt(phaseMatch[1]),
        timeframe: phaseMatch[2],
        description: phaseMatch[3].trim()
      });
    }
  }
  
  return extractedInfo;
}

/**
 * Format currency values consistently
 */
function formatCurrency(value) {
  // Handle both number and string inputs
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  
  if (isNaN(numValue)) return 'N/A';
  
  // Format in millions for large values
  if (numValue >= 1000000) {
    return `$${(numValue / 1000000).toFixed(1)}M`;
  }
  
  // Format with commas for smaller values
  return `$${numValue.toLocaleString()}`;
}

/**
 * Remove common boilerplate text
 */
function removeBoilerplate(content) {
  let cleaned = content;
  
  // Common patterns to remove
  const patterns = [
    /This document is confidential and proprietary\.(.*?)\./is,
    /Copyright © \d{4}(.*?)\. All rights reserved\./is,
    /For internal use only\./i,
    /Please read the terms and conditions\./i,
    /Disclaimer:(.*?)(?:\n\n|\n|$)/is,
    /www\.[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,
    /Page \d+ of \d+/g,
    /Document ID: [A-Z0-9-]+/g,
    /Version: \d+\.\d+/g,
    /These three sample bids are designed to reflect different approaches.*/is
  ];
  
  // Apply each pattern
  patterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  
  return cleaned.trim();
}

/**
 * Truncate content while preserving key information
 */
function truncateWithContext(content, maxLength, extractedInfo) {
  // If already under max length, return as is
  if (content.length <= maxLength) {
    return content;
  }
  
  // Create a structured summary section
  let infoSummary = "\n\n=== KEY BID INFORMATION ===\n\n";
  
  // Cost information
  infoSummary += "## COST INFORMATION\n";
  if (extractedInfo.totalCost) {
    infoSummary += `Total Project Cost: ${extractedInfo.totalCost.formatted} (${extractedInfo.totalCost.originalText})\n`;
  }
  if (extractedInfo.costBreakdown.length > 0) {
    infoSummary += "Bid cost breakdown:\n";
    extractedInfo.costBreakdown.forEach(item => {
      infoSummary += `- ${item.category}: ${item.formatted}\n`;
    });
  }
  
  // Timeline information
  if (extractedInfo.projectDuration || extractedInfo.timelineDetails.length > 0) {
    infoSummary += "\n## TIMELINE INFORMATION\n";
    if (extractedInfo.projectDuration) {
      infoSummary += `Project Duration: ${extractedInfo.projectDuration.value} ${extractedInfo.projectDuration.unit}\n`;
    }
    if (extractedInfo.timelineDetails.length > 0) {
      infoSummary += "Project timeline phases:\n";
      extractedInfo.timelineDetails.forEach(item => {
        infoSummary += `- Phase ${item.phase}: ${item.timeframe} - ${item.description}\n`;
      });
    }
  }
  
  // Reserve space for the information summary
  const summaryLength = infoSummary.length;
  const availableLength = maxLength - summaryLength - 50; // Extra buffer for truncation notice
  
  // Take first 65% and last 30% of the available space
  const firstPart = content.substring(0, Math.floor(availableLength * 0.65));
  const lastPart = content.substring(content.length - Math.floor(availableLength * 0.3));
  
  // Try to truncate at paragraph boundaries
  const firstPartEnd = firstPart.lastIndexOf('\n\n');
  const firstPartTruncated = firstPartEnd > 0 ? firstPart.substring(0, firstPartEnd) : firstPart;
  
  const lastPartStart = lastPart.indexOf('\n\n');
  const lastPartTruncated = lastPartStart > 0 ? lastPart.substring(lastPartStart) : lastPart;
  
  return `${firstPartTruncated}\n\n[...CONTENT TRUNCATED...]\n\n${lastPartTruncated}${infoSummary}`;
}