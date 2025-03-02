// app/api/analyze-bids/route.js
import OpenAI from 'openai';
import { preprocessBidDocuments } from '../../utils/simpleBidPreprocessor';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Estimate tokens from character count
function estimateTokens(text) {
  const charCount = typeof text === 'string' ? text.length : text;
  // GPT models average ~4 chars per token for English text
  return Math.ceil(charCount / 4);
}

async function analyzeWithRetry(prompt, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Analysis attempt ${attempt + 1} of ${maxRetries}`);
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a construction bid analysis expert analyzing multiple bid documents.

IMPORTANT INSTRUCTIONS ABOUT COSTS:
1. Construction projects typically cost in the MILLIONS of dollars.
2. When you see a value like "$82,300,000" this means 82 million, 300 thousand dollars.
3. Be sure to include the full dollar amounts in your analysis (don't round millions to thousands).
4. Pay special attention to the "IMPORTANT COST INFORMATION" section if present in the documents.
5. If key cost components (materials, labor, overhead) aren't explicitly stated, estimate them based on typical construction ratios.

Your response must be in the exact JSON format specified in the user's message.`
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

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI API error:', error.message);
      
      if (error.status === 429) {
        const retryAfter = error.headers?.get('retry-after') || 60;
        console.log(`Rate limited. Waiting ${retryAfter} seconds before retry ${attempt + 1}/${maxRetries}`);
        await sleep(retryAfter * 1000);
        continue;
      }
      
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { fileContents, bidId } = body;
    
    if (!fileContents || !Array.isArray(fileContents) || fileContents.length === 0) {
      return Response.json({ 
        error: 'Invalid file contents',
        message: 'File contents must be provided as an array'
      }, { status: 400 });
    }
    
    // Log the content sizes
    fileContents.forEach(file => {
      console.log(`Processing file ${file.name}, type: ${file.type || 'unknown'}, content length: ${file.content.length}`);
    });
    
    // Preprocess the bid documents
    const maxContentLength = 10000; // Characters per document
    const preprocessedContents = preprocessBidDocuments(fileContents, maxContentLength);
    
    // Log processed content size
    const totalOriginalChars = fileContents.reduce((sum, file) => sum + file.content.length, 0);
    const totalProcessedChars = preprocessedContents.reduce((sum, file) => sum + file.content.length, 0);
    const estOriginalTokens = estimateTokens(totalOriginalChars);
    const estProcessedTokens = estimateTokens(totalProcessedChars);
    
    if (estOriginalTokens > 0) {
      const tokenReduction = ((estOriginalTokens - estProcessedTokens) / estOriginalTokens * 100).toFixed(1);
      console.log(`Processed content: ~${estProcessedTokens} tokens (${tokenReduction}% reduction)`);
    } else {
      console.log(`Processed content: ~${estProcessedTokens} tokens`);
    }
    
    // Build prompt for analysis
    const prompt = `Analyze these construction bids and provide a comparison in the following exact JSON format:
{
  "summary": {
    "recommendedBid": "string - name of recommended bid",
    "totalCost": number - cost of recommended bid in dollars (DO NOT format with commas or $ signs),
    "reasoning": "string - brief 1-2 sentence explanation"
  },
  "bidComparison": [
    {
      "bidder": "string - name from filename or document",
      "totalCost": number - total bid amount in dollars (DO NOT format with commas or $ signs),
      "keyComponents": {
        "materials": number - estimated materials cost in dollars,
        "labor": number - estimated labor cost in dollars,
        "overhead": number - estimated overhead in dollars
      }
    }
  ],
  "risks": [
    "string - each major risk or concern"
  ],
  "recommendations": [
    "string - each key recommendation"
  ]
}

Remember: Construction projects typically cost in the MILLIONS of dollars. Be careful not to misinterpret cost figures.

Bid documents to analyze:

${preprocessedContents.map((file, index) => `
--- BID DOCUMENT ${index + 1}: ${file.name} ---
${file.content}
`).join('\n\n')}`;

    // Log final prompt size
    const promptTokens = estimateTokens(prompt);
    console.log(`Final prompt: ~${promptTokens} tokens`);
    
    // Send to OpenAI for analysis
    const analysis = await analyzeWithRetry(prompt);
    
    // If bidId is provided, update the bid record with results
    if (bidId) {
      try {
        console.log(`Updating bid ${bidId} with analysis results`);
        const client = await clientPromise;
        const db = client.db("bidleveling");

        await db.collection("bids").updateOne(
          { _id: new ObjectId(bidId) },
          { 
            $set: { 
              status: 'analyzed',
              totalCost: analysis.summary.totalCost,
              keyComponents: analysis.bidComparison[0].keyComponents,
              analysisResults: analysis,
              analyzedAt: new Date()
            } 
          }
        );
        
        console.log(`Successfully updated bid ${bidId} with analysis results`);
      } catch (dbError) {
        console.error('Error updating bid with analysis results:', dbError);
        // Continue anyway - we'll return the analysis even if DB update fails
      }
    }
    
    return Response.json(analysis);
  } catch (error) {
    console.error('Bid analysis error:', error);
    return Response.json({ 
      error: 'Failed to analyze bids',
      message: error.message,
      retryIn: 60
    }, { status: error.status || 500 });
  }
}