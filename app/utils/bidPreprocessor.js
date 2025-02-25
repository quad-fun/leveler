/**
 * Bid document preprocessor to reduce token usage before sending to OpenAI
 */

// Common boilerplate text patterns to remove
const BOILERPLATE_PATTERNS = [
    /This document is confidential and proprietary\.(.*?)\./is,
    /Copyright © \d{4}(.*?)\. All rights reserved\./is,
    /For internal use only\./i,
    /Please read the terms and conditions\./i,
    /Disclaimer:(.*?)(?:\n\n|\n|$)/is,
    /www\.[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,
    /Page \d+ of \d+/g,
    /Document ID: [A-Z0-9-]+/g,
    /Version: \d+\.\d+/g
  ];
  
  /**
   * Main preprocessing function to reduce token usage
   * @param {Array} fileContents Array of {name, content} objects
   * @param {Object} options Preprocessing options
   * @returns {Array} Processed file contents
   */
  export function preprocessBidDocuments(fileContents, options = {}) {
    const defaults = {
      maxContentLength: 10000, // Characters per document
      removeBoilerplate: true,
      extractKeyInfo: true,
      summarizeLongSections: true
    };
  
    const settings = { ...defaults, ...options };
    
    return fileContents.map(file => {
      let processedContent = file.content;
      const fileExt = getFileExtension(file.name).toLowerCase();
      const fileName = file.name;
      
      // Track token reduction
      const originalLength = processedContent.length;
      
      // Remove common boilerplate text
      if (settings.removeBoilerplate) {
        processedContent = removeBoilerplateText(processedContent);
      }
      
      // Extract key information based on file type
      if (settings.extractKeyInfo) {
        processedContent = extractKeyInformation(processedContent, fileExt, fileName);
      }
      
      // Summarize long sections
      if (settings.summarizeLongSections) {
        processedContent = summarizeLongContent(processedContent, settings.maxContentLength);
      }
      
      // Always ensure content is within maximum length
      if (processedContent.length > settings.maxContentLength) {
        processedContent = truncateWithContext(processedContent, settings.maxContentLength);
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
   * Get file extension from filename
   */
  function getFileExtension(filename) {
    return filename.split('.').pop();
  }
  
  /**
   * Remove common boilerplate text
   */
  function removeBoilerplateText(content) {
    let cleaned = content;
    
    // Apply each boilerplate pattern
    BOILERPLATE_PATTERNS.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    
    return cleaned.trim();
  }
  
  /**
   * Extract key information based on file type
   */
  function extractKeyInformation(content, fileExt, fileName) {
    // For PDFs and scanned documents that might have been converted to text
    if (fileName.toLowerCase().includes('bid') || fileName.toLowerCase().includes('proposal')) {
      // Extract key sections by looking for common headers
      let keyInfo = '';
      
      // Look for pricing sections
      const pricingMatch = content.match(/(?:Price|Pricing|Cost|Costs|Budget|Financial)(.*?)(?:\n\s*\n|\n\s*$|$)/is);
      if (pricingMatch) {
        keyInfo += `PRICING INFORMATION:\n${pricingMatch[0]}\n\n`;
      }
      
      // Look for timeline/schedule
      const timelineMatch = content.match(/(?:Timeline|Schedule|Timeframe|Deadline|Milestones)(.*?)(?:\n\s*\n|\n\s*$|$)/is);
      if (timelineMatch) {
        keyInfo += `TIMELINE INFORMATION:\n${timelineMatch[0]}\n\n`;
      }
      
      // Look for materials/resources
      const materialsMatch = content.match(/(?:Materials|Resources|Equipment|Supplies)(.*?)(?:\n\s*\n|\n\s*$|$)/is);
      if (materialsMatch) {
        keyInfo += `MATERIALS INFORMATION:\n${materialsMatch[0]}\n\n`;
      }
      
      // Look for labor information
      const laborMatch = content.match(/(?:Labor|Workforce|Personnel|Staffing|Manpower)(.*?)(?:\n\s*\n|\n\s*$|$)/is);
      if (laborMatch) {
        keyInfo += `LABOR INFORMATION:\n${laborMatch[0]}\n\n`;
      }
      
      // If we found key information, return it with some context, otherwise return original content
      if (keyInfo.length > 0) {
        return `BID DOCUMENT EXTRACTION FROM: ${fileName}\n\n${keyInfo}\nADDITIONAL CONTEXT: The original document contained ${content.length} characters. This is an extract of the key pricing, timeline, materials, and labor information.`;
      }
    }
    
    // For spreadsheets and other structured documents - just return original for now
    // In a more advanced system, you might parse these specifically
    return content;
  }
  
  /**
   * Summarize long content sections to reduce tokens
   */
  function summarizeLongContent(content, maxLength) {
    // If content is already short enough, return it as is
    if (content.length <= maxLength) {
      return content;
    }
    
    // Split into paragraphs
    const paragraphs = content.split(/\n\s*\n/);
    
    // If we have many paragraphs, keep only the most important ones
    if (paragraphs.length > 15) {
      // Keep introduction (first 2 paragraphs)
      const intro = paragraphs.slice(0, 2);
      
      // Look for key paragraphs containing important terms
      const keyTerms = ['price', 'cost', 'bid', 'timeline', 'schedule', 'materials', 'labor', 'total', 'proposal', 'offer', 'payment', 'quality', 'warranty'];
      
      const keyParagraphs = paragraphs.filter(para => {
        const paraLower = para.toLowerCase();
        return keyTerms.some(term => paraLower.includes(term));
      });
      
      // Keep conclusion (last paragraph)
      const conclusion = paragraphs.slice(-1);
      
      // Combine the selected paragraphs
      const summaryContent = [
        ...intro,
        ...(keyParagraphs.length > 0 ? keyParagraphs : paragraphs.slice(2, 5)),
        ...conclusion
      ].join('\n\n');
      
      // Note the summarization performed
      return summaryContent + `\n\n(Note: This is a summarized version of the original document which contained ${paragraphs.length} paragraphs. Only the introduction, key information, and conclusion are included.)`;
    }
    
    // If not many paragraphs, just truncate with context
    return truncateWithContext(content, maxLength);
  }
  
  /**
   * Truncate content while preserving context
   */
  function truncateWithContext(content, maxLength) {
    // If already under max length, return as is
    if (content.length <= maxLength) {
      return content;
    }
    
    // Reserve some space for the truncation notice
    const reservedSpace = 120;
    const effectiveMaxLength = maxLength - reservedSpace;
    
    // Take first part
    const firstPart = content.substring(0, Math.floor(effectiveMaxLength * 0.65));
    
    // Take last part
    const lastPart = content.substring(content.length - Math.floor(effectiveMaxLength * 0.35));
    
    // Combine with truncation notice
    return `${firstPart}\n\n[...TRUNCATED... (${content.length - effectiveMaxLength} characters removed to reduce token count)...]\n\n${lastPart}`;
  }