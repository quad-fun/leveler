// app/api/analyze-bids/route.js
import OpenAI from 'openai';
import { preprocessBidDocuments } from '../../utils/simpleBidPreprocessor';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced logging function
function logStep(message, data) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    if (typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  }
}

// Estimate tokens from character count
function estimateTokens(text) {
  const charCount = typeof text === 'string' ? text.length : text;
  // GPT models average ~4 chars per token for English text
  return Math.ceil(charCount / 4);
}

async function analyzeWithRetry(prompt, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      logStep(`Starting analysis attempt ${attempt + 1} of ${maxRetries}`);
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
6. ALL numeric values in the bidComparison and keyComponents sections must be provided as numbers, not strings.

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

      const content = completion.choices[0].message.content;
      try {
        const parsedContent = JSON.parse(content);
        logStep("Successfully parsed analysis response", {
          summary: parsedContent.summary,
          firstBidComparison: parsedContent.bidComparison[0]
        });
        return parsedContent;
      } catch (parseError) {
        logStep("Error parsing JSON response", { error: parseError.message, content });
        throw parseError;
      }
    } catch (error) {
      logStep(`API error on attempt ${attempt + 1}`, { error: error.message });
      
      if (error.status === 429) {
        const retryAfter = error.headers?.get('retry-after') || 60;
        logStep(`Rate limited. Waiting ${retryAfter} seconds before retry`);
        await sleep(retryAfter * 1000);
        continue;
      }
      
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(request) {
  const startTime = Date.now();
  let bidId = null;
  
  try {
    const body = await request.json();
    const { fileContents, bidId: bodyBidId } = body;
    bidId = bodyBidId;
    
    logStep("Received analysis request", { 
      bidId,
      fileCount: fileContents?.length || 0,
      firstFileName: fileContents?.[0]?.name
    });
    
    // Validate input
    if (!fileContents || !Array.isArray(fileContents) || fileContents.length === 0) {
      logStep("Invalid fileContents", { fileContents });
      return Response.json({ 
        error: 'Invalid input', 
        message: 'fileContents must be a non-empty array' 
      }, { status: 400 });
    }
    
    if (!bidId) {
      logStep("Missing bidId");
      return Response.json({ 
        error: 'Invalid input', 
        message: 'bidId is required' 
      }, { status: 400 });
    }
    
    // Check if bidId is valid
    if (!ObjectId.isValid(bidId)) {
      logStep("Invalid bidId format", { bidId });
      return Response.json({ 
        error: 'Invalid bid ID', 
        message: 'Provided bidId is not a valid ObjectId' 
      }, { status: 400 });
    }
    
    // Update bid status to 'processing'
    try {
      const client = await clientPromise;
      const db = client.db("bidleveling");
      
      logStep("Updating bid status to processing", { bidId });
      await db.collection("bids").updateOne(
        { _id: new ObjectId(bidId) },
        { $set: { status: 'processing', updatedAt: new Date() } }
      );
      
      // Fetch original bid to log details
      const originalBid = await db.collection("bids").findOne({ _id: new ObjectId(bidId) });
      logStep("Original bid details", { 
        bidder: originalBid?.bidder,
        name: originalBid?.name,
        status: originalBid?.status
      });
    } catch (dbError) {
      logStep("Error updating bid status", { error: dbError.message });
      // Continue with analysis even if we couldn't update the status
    }
    
    // Log original content size
    const totalOriginalChars = fileContents.reduce((sum, file) => sum + file.content.length, 0);
    const estOriginalTokens = estimateTokens(totalOriginalChars);
    logStep(`Original content stats`, {
      chars: totalOriginalChars,
      tokens: estOriginalTokens,
      fileCount: fileContents.length
    });
    
    // Preprocess the bid documents
    const maxContentLength = 10000; // Characters per document
    const preprocessedContents = preprocessBidDocuments(fileContents, maxContentLength);
    
    // Log processed content size
    const totalProcessedChars = preprocessedContents.reduce((sum, file) => sum + file.content.length, 0);
    const estProcessedTokens = estimateTokens(totalProcessedChars);
    const tokenReduction = ((estOriginalTokens - estProcessedTokens) / estOriginalTokens * 100).toFixed(1);
    
    logStep(`Processed content stats`, {
      chars: totalProcessedChars,
      tokens: estProcessedTokens,
      reduction: `${tokenReduction}%`
    });
    
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

Remember: 
1. Construction projects typically cost in the MILLIONS of dollars. Be careful not to misinterpret cost figures.
2. ALL numeric values MUST be actual numbers, not strings (no quotes around numbers).
3. Do not include commas or currency symbols in numeric values.

Bid documents to analyze:

${preprocessedContents.map((file, index) => `
--- BID DOCUMENT ${index + 1}: ${file.name} ---
${file.content}
`).join('\n\n')}`;

    // Log final prompt size
    const promptTokens = estimateTokens(prompt);
    logStep(`Final prompt stats`, { tokens: promptTokens });
    
    try {
      // Send to OpenAI for analysis
      logStep("Sending to OpenAI for analysis");
      const analysis = await analyzeWithRetry(prompt);
      
      // Sanitize the analysis to ensure numbers are numbers, not strings
      sanitizeAnalysis(analysis);
      
      logStep("Analysis results", { 
        summary: analysis.summary,
        totalCost: analysis.summary.totalCost,
        totalCostType: typeof analysis.summary.totalCost,
        bidComparisonCount: analysis.bidComparison.length
      });
      
      // After analyzing the bid, update the bid record with results
      try {
        const client = await clientPromise;
        const db = client.db("bidleveling");
        
        // Find the current bid to get its bidder name
        const currentBid = await db.collection("bids").findOne({ _id: new ObjectId(bidId) });
        
        if (currentBid) {
          // For single bid analysis, use the first item in the comparison array
          const bidDetails = analysis.bidComparison[0];
          
          logStep("Matching bidder information", {
            currentBidder: currentBid.bidder,
            analysisFirstBidder: bidDetails?.bidder,
            totalCost: bidDetails?.totalCost,
            totalCostType: typeof bidDetails?.totalCost
          });
          
          // Log detailed key components to debug issues
          if (bidDetails?.keyComponents) {
            logStep("Key components", {
              materials: bidDetails.keyComponents.materials,
              materialsType: typeof bidDetails.keyComponents.materials,
              labor: bidDetails.keyComponents.labor,
              laborType: typeof bidDetails.keyComponents.labor,
              overhead: bidDetails.keyComponents.overhead,
              overheadType: typeof bidDetails.keyComponents.overhead
            });
          }
          
          // Update the bid with analysis results
          const updateResult = await db.collection("bids").updateOne(
            { _id: new ObjectId(bidId) },
            { 
              $set: { 
                status: 'analyzed',
                totalCost: bidDetails?.totalCost,
                keyComponents: bidDetails?.keyComponents || {
                  materials: null,
                  labor: null,
                  overhead: null
                },
                analysisResults: analysis,
                analyzedAt: new Date()
              } 
            }
          );
          
          logStep("Database update result", {
            matched: updateResult.matchedCount,
            modified: updateResult.modifiedCount
          });
        }
        
        logStep(`Bid ${bidId} successfully analyzed and updated`);
      } catch (dbError) {
        logStep('Error updating bid with analysis results', { error: dbError.message });
      }
      
      const totalTime = (Date.now() - startTime) / 1000;
      logStep(`Analysis completed in ${totalTime.toFixed(2)} seconds`);
      
      return Response.json({
        success: true,
        message: 'Bid analyzed successfully',
        bidId,
        result: analysis
      });

    } catch (error) {
      logStep('Error in analysis step', { error: error.message });
      
      // Update bid status to error
      try {
        const client = await clientPromise;
        const db = client.db("bidleveling");
        
        await db.collection("bids").updateOne(
          { _id: new ObjectId(bidId) },
          { $set: { status: 'error', errorMessage: error.message, updatedAt: new Date() } }
        );
      } catch (dbError) {
        logStep('Error updating bid status to error', { error: dbError.message });
      }
      
      return Response.json({ 
        error: 'Failed to analyze bid',
        message: error.message
      }, { status: 500 });
    }
  } catch (error) {
    logStep('Bid analysis error', { error: error.message });
    
    // Try to update bid status to error
    if (bidId && ObjectId.isValid(bidId)) {
      try {
        const client = await clientPromise;
        const db = client.db("bidleveling");
        
        await db.collection("bids").updateOne(
          { _id: new ObjectId(bidId) },
          { $set: { status: 'error', errorMessage: error.message, updatedAt: new Date() } }
        );
      } catch (dbError) {
        logStep('Error updating bid status after general error', { error: dbError.message });
      }
    }
    
    return Response.json({ 
      error: 'Failed to analyze bids',
      message: error.message,
      retryIn: 60
    }, { status: error.status || 500 });
  }
}

// Function to sanitize analysis and ensure numbers are numbers, not strings
function sanitizeAnalysis(analysis) {
  // Fix summary totalCost if it's a string
  if (analysis.summary && typeof analysis.summary.totalCost === 'string') {
    try {
      analysis.summary.totalCost = Number(analysis.summary.totalCost.replace(/[$,]/g, ''));
    } catch (e) {
      logStep("Error converting summary totalCost to number", { 
        value: analysis.summary.totalCost,
        error: e.message
      });
    }
  }
  
  // Fix bidComparison totalCost and keyComponents if they're strings
  if (analysis.bidComparison && Array.isArray(analysis.bidComparison)) {
    analysis.bidComparison.forEach(bid => {
      if (typeof bid.totalCost === 'string') {
        try {
          bid.totalCost = Number(bid.totalCost.replace(/[$,]/g, ''));
        } catch (e) {
          logStep("Error converting bid totalCost to number", { 
            bidder: bid.bidder,
            value: bid.totalCost,
            error: e.message
          });
        }
      }
      
      if (bid.keyComponents) {
        ['materials', 'labor', 'overhead'].forEach(component => {
          if (typeof bid.keyComponents[component] === 'string') {
            try {
              bid.keyComponents[component] = Number(bid.keyComponents[component].replace(/[$,]/g, ''));
            } catch (e) {
              logStep(`Error converting ${component} to number`, { 
                bidder: bid.bidder,
                value: bid.keyComponents[component],
                error: e.message
              });
            }
          }
        });
      }
    });
  }
}