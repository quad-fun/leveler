/**
 * Simple bid document preprocessor with improved cost data handling
 */

/**
 * Preprocess bid documents to reduce token usage while preserving cost information
 * @param {Array} fileContents Array of {name, content} objects
 * @param {number} maxLength Maximum content length per document
 * @returns {Array} Processed file contents
 */
export function preprocessBidDocuments(fileContents, maxLength = 10000) {
    return fileContents.map(file => {
      let processedContent = file.content;
      const originalLength = processedContent.length;
      
      // First, preserve important cost information
      const costData = extractCostInformation(processedContent);
      
      // Basic removal of common boilerplate text
      processedContent = removeBoilerplate(processedContent);
      
      // Intelligent truncation that preserves cost data
      if (processedContent.length > maxLength) {
        processedContent = truncateWithContext(processedContent, maxLength, costData);
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
   * Extract cost information from the content
   */
  function extractCostInformation(content) {
    const costData = {
      totalCost: null,
      costBreakdown: []
    };
    
    // Look for total project cost
    const totalCostRegex = /Total Project( Estimated)? Cost:?\s*\$?([\d,]+(\.\d+)?)/i;
    const totalCostMatch = content.match(totalCostRegex);
    
    if (totalCostMatch && totalCostMatch[2]) {
      costData.totalCost = totalCostMatch[0];
    }
    
    // Look for any currency values with regex 
    const currencyRegex = /\$?[\d,]+(\.\d+)?([ \t]+million| million dollars| dollars)?/g;
    let match;
    
    while ((match = currencyRegex.exec(content)) !== null) {
      const context = content.substring(
        Math.max(0, match.index - 30), 
        Math.min(content.length, match.index + match[0].length + 30)
      );
      
      costData.costBreakdown.push({
        value: match[0],
        context: context
      });
    }
    
    return costData;
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
      /Page \d+ of \d+/g
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
   * Truncate content while preserving cost information
   */
  function truncateWithContext(content, maxLength, costData) {
    // If already under max length, return as is
    if (content.length <= maxLength) {
      return content;
    }
    
    // Create a cost summary section
    let costSummary = "\n\n=== IMPORTANT COST INFORMATION ===\n";
    
    if (costData.totalCost) {
      costSummary += `Total Project Cost: ${costData.totalCost}\n\n`;
    }
    
    // Add a sample of cost values with context
    if (costData.costBreakdown.length > 0) {
      costSummary += "Cost details found in document:\n";
      
      // Only include a reasonable number of cost items
      const maxCostItems = 5;
      for (let i = 0; i < Math.min(costData.costBreakdown.length, maxCostItems); i++) {
        const item = costData.costBreakdown[i];
        costSummary += `- ${item.context.trim()}\n`;
      }
    }
    
    // Reserve space for cost summary
    const summaryLength = costSummary.length;
    const availableLength = maxLength - summaryLength;
    
    // Take first 60% and last 35% of the available space
    const firstPart = content.substring(0, Math.floor(availableLength * 0.6));
    const lastPart = content.substring(content.length - Math.floor(availableLength * 0.35));
    
    return `${firstPart}\n\n[...CONTENT TRUNCATED...]\n\n${lastPart}${costSummary}`;
  }