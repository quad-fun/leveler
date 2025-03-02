import OpenAI from 'openai';
import { preprocessBidDocuments } from '../../utils/simpleBidPreprocessor';
import { logTokenUsage, estimateTokens } from '../../utils/tokenTracker';

const FORCE_MOCK_DATA = false; 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Add validation function
function validateBidContent(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  // Check for minimum content length and some key indicators
  return content.length >= 100 && (
    content.toLowerCase().includes('cost') ||
    content.toLowerCase().includes('price') ||
    content.toLowerCase().includes('bid') ||
    content.toLowerCase().includes('estimate')
  );
}

async function analyzeWithRetry(prompt, maxRetries = 3, delayMs = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1} of ${maxRetries}`);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a construction bid analysis expert comparing multiple bid documents.

IMPORTANT INSTRUCTIONS:
1. COSTS: Construction projects typically cost in the MILLIONS. "$82,300,000" means 82 million, 300 thousand dollars.
2. ACCURACY: Include full dollar amounts without rounding or formatting.
3. FAIRNESS: Evaluate each bid objectively based on all factors, not just cost.
4. COMPONENTS: Break down costs into materials, labor, and overhead when possible.
5. RISKS: Identify both bid-specific and project-wide risks.
6. RECOMMENDATIONS: Provide actionable insights for bid selection and negotiation.

Your response must follow the exact JSON format specified.`
          },
          {
            role: "user",
            content: prompt,
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      // Validate the response format
      const result = JSON.parse(completion.choices[0].message.content);
      if (!result.summary || !result.bidComparison || !Array.isArray(result.bidComparison)) {
        throw new Error('Invalid response format from OpenAI');
      }

      return result;

    } catch (error) {
      lastError = error;
      console.error(`Analysis attempt ${attempt + 1} failed:`, error.message);
      
      if (error.status === 429) {
        const retryAfter = parseInt(error.headers?.get('retry-after') || '60');
        console.log(`Rate limited. Waiting ${retryAfter} seconds...`);
        await sleep(retryAfter * 1000);
        continue;
      }
      
      // For other errors, wait before retrying
      await sleep(delayMs * (attempt + 1));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { fileContents, projectId } = body;
    
    // Input validation
    if (!fileContents || !Array.isArray(fileContents) || fileContents.length < 2) {
      return Response.json({ 
        error: 'Invalid request',
        message: 'At least two valid bid documents are required' 
      }, { status: 400 });
    }

    // Validate each bid document
    const invalidBids = fileContents.filter(file => !validateBidContent(file.content));
    if (invalidBids.length > 0) {
      return Response.json({
        error: 'Invalid bid content',
        message: `${invalidBids.length} bid(s) appear to be invalid or incomplete`
      }, { status: 400 });
    }
    
    // Log original content metrics
    const totalOriginalChars = fileContents.reduce((sum, file) => sum + file.content.length, 0);
    const estOriginalTokens = estimateTokens(totalOriginalChars);
    console.log(`Original content: ~${estOriginalTokens} tokens across ${fileContents.length} files`);
    
    // Preprocess with improved length handling
    const maxContentLength = Math.floor(12000 / fileContents.length); // Dynamically adjust per document
    const preprocessedContents = preprocessBidDocuments(fileContents, maxContentLength);
    
    // Log processing metrics
    const totalProcessedChars = preprocessedContents.reduce((sum, file) => sum + file.content.length, 0);
    const estProcessedTokens = estimateTokens(totalProcessedChars);
    const tokenReduction = ((estOriginalTokens - estProcessedTokens) / estOriginalTokens * 100).toFixed(1);
    console.log(`Processed content: ~${estProcessedTokens} tokens (${tokenReduction}% reduction)`);
    
    // Enhanced analysis prompt
    const prompt = `Compare these construction bids and provide a detailed analysis in this exact JSON format:
{
  "summary": {
    "recommendedBid": "string - name of recommended bidder",
    "totalCost": number - cost in dollars (no formatting)",
    "reasoning": "string - clear explanation of recommendation"
  },
  "bidComparison": [
    {
      "bidder": "string - bidder name",
      "totalCost": number - total in dollars (no formatting)",
      "keyComponents": {
        "materials": number - materials cost,
        "labor": number - labor cost,
        "overhead": number - overhead cost
      },
      "strengths": ["string - each key strength"],
      "weaknesses": ["string - each key weakness"]
    }
  ],
  "risks": ["string - each project-wide risk"],
  "recommendations": ["string - each actionable recommendation"]
}

IMPORTANT: 
- Construction costs are typically in MILLIONS
- Include exact dollar amounts without formatting
- Break down costs whenever possible
- Consider both cost and non-cost factors
- Identify specific risks and actionable recommendations

Bid documents to analyze:

${preprocessedContents.map((file, index) => `
=== BID DOCUMENT ${index + 1}: ${file.name} ===
${file.content}
---
`).join('\n\n')}`;

    // Log prompt metrics
    const promptTokens = estimateTokens(prompt);
    console.log(`Final prompt: ~${promptTokens} tokens`);
    
    // Analyze with enhanced error handling
    const analysis = await analyzeWithRetry(prompt);
    
    // Log token usage
    logTokenUsage(
      '/api/analyze-multiple-bids', 
      estProcessedTokens, 
      estimateTokens(JSON.stringify(analysis)), 
      'gpt-4-turbo-preview'
    );
    
    return Response.json(analysis);

  } catch (error) {
    console.error('Bid analysis error:', error);
    
    // Enhanced error response
    return Response.json({ 
      error: 'Analysis failed',
      message: error.message,
      retryIn: error.status === 429 ? 60 : 30,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: error.status || 500 });
  }
} 