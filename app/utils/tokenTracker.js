/**
 * Simple token usage tracking utility
 */

// In-memory storage for token usage (in a production app, use a database)
let tokenUsageLog = [];

/**
 * Log token usage for an API request
 * @param {String} endpoint The API endpoint used
 * @param {Number} inputTokens Estimated input tokens
 * @param {Number} outputTokens Estimated output tokens
 * @param {String} model The model used (e.g., "gpt-4-turbo")
 * @param {Boolean} success Whether the request was successful
 */
export function logTokenUsage(endpoint, inputTokens, outputTokens, model, success = true) {
  const entry = {
    timestamp: new Date().toISOString(),
    endpoint,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    model,
    success
  };
  
  tokenUsageLog.push(entry);
  
  // Keep the log to a reasonable size in memory
  if (tokenUsageLog.length > 1000) {
    tokenUsageLog = tokenUsageLog.slice(-1000);
  }
  
  console.log(`Token usage: ${inputTokens} in + ${outputTokens} out = ${inputTokens + outputTokens} total tokens (${model})`);
  
  // For production, you would store this in a database
  return entry;
}

/**
 * Estimate tokens from character count
 * @param {String|Number} text Text or character count to estimate
 * @returns {Number} Estimated token count
 */
export function estimateTokens(text) {
  // If it's already a number, assume it's a character count
  const charCount = typeof text === 'string' ? text.length : text;
  // GPT models average ~4 chars per token for English text
  return Math.ceil(charCount / 4);
}

/**
 * Get token usage statistics
 * @param {Object} options Filter options
 * @returns {Object} Usage statistics
 */
export function getTokenUsageStats(options = {}) {
  const { 
    startDate, 
    endDate, 
    model,
    endpoint 
  } = options;
  
  // Filter logs based on criteria
  let filtered = [...tokenUsageLog];
  
  if (startDate) {
    filtered = filtered.filter(entry => new Date(entry.timestamp) >= new Date(startDate));
  }
  
  if (endDate) {
    filtered = filtered.filter(entry => new Date(entry.timestamp) <= new Date(endDate));
  }
  
  if (model) {
    filtered = filtered.filter(entry => entry.model === model);
  }
  
  if (endpoint) {
    filtered = filtered.filter(entry => entry.endpoint === endpoint);
  }
  
  // Calculate statistics
  const totalInputTokens = filtered.reduce((sum, entry) => sum + entry.inputTokens, 0);
  const totalOutputTokens = filtered.reduce((sum, entry) => sum + entry.outputTokens, 0);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const requestCount = filtered.length;
  
  return {
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    requestCount,
    averagePerRequest: requestCount > 0 ? totalTokens / requestCount : 0,
    successRate: requestCount > 0 ? 
      filtered.filter(entry => entry.success).length / requestCount * 100 : 0
  };
}

/**
 * Estimated GPT-4 cost calculation (simplified)
 * @param {Number} inputTokens Input token count
 * @param {Number} outputTokens Output token count
 * @returns {Number} Estimated cost in USD
 */
export function estimateGPT4Cost(inputTokens, outputTokens) {
  // Pricing may change, so these should be configurable
  const inputPricePerK = 0.03;  // $0.03 per 1K input tokens
  const outputPricePerK = 0.06; // $0.06 per 1K output tokens
  
  const inputCost = (inputTokens / 1000) * inputPricePerK;
  const outputCost = (outputTokens / 1000) * outputPricePerK;
  
  return inputCost + outputCost;
}

// Export a monitoring middleware function for API routes
export function withTokenTracking(handler, options = {}) {
  return async (req, ...args) => {
    const startTime = Date.now();
    const { pathname } = new URL(req.url);
    const endpoint = options.endpoint || pathname;
    const model = options.model || 'gpt-4-turbo';
    
    // Clone the request to read its body for token estimation
    const reqClone = req.clone();
    let inputTokens = 0;
    
    try {
      const body = await reqClone.json();
      
      // If there's a prompt or content field, estimate tokens
      if (body.prompt) {
        inputTokens = estimateTokens(body.prompt);
      } else if (body.content) {
        inputTokens = estimateTokens(body.content);
      } else if (body.fileContents) {
        // Handle our bid analysis case
        inputTokens = estimateTokens(
          body.fileContents.reduce((sum, file) => sum + file.content.length, 0)
        );
      }
    } catch (e) {
      // Silently fail if we can't parse request body
    }
    
    try {
      // Process the request
      const response = await handler(req, ...args);
      
      // Attempt to get response size for output token estimation
      let outputTokens = 0;
      const respClone = response.clone();
      
      try {
        const respBody = await respClone.json();
        
        // Estimate based on JSON response size
        const respText = JSON.stringify(respBody);
        outputTokens = estimateTokens(respText);
      } catch (e) {
        // Use a fallback value if we can't parse response 
        outputTokens = 500; // Reasonable fallback for most responses
      }
      
      // Log the token usage
      logTokenUsage(endpoint, inputTokens, outputTokens, model, true);
      
      // Return the original response
      return response;
    } catch (error) {
      // Log failed request
      logTokenUsage(endpoint, inputTokens, 0, model, false);
      throw error;
    }
  };
}