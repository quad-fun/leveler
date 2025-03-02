import OpenAI from 'openai';
import { preprocessBidDocuments } from '../../../utils/simpleBidPreprocessor';
import { logTokenUsage, estimateTokens } from '../../../utils/tokenTracker';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const FORCE_MOCK_DATA = false; // Override environment setting

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request) {
  try {
    const body = await request.json();
    const { bidId, projectId } = body;
    
    if (!bidId) {
      return Response.json({ 
        error: 'Invalid request',
        message: 'No bid ID provided' 
      }, { status: 400 });
    }
    
    // Get the bid from the database
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    const bid = await db.collection("bids").findOne({ 
      _id: new ObjectId(bidId),
      projectId: projectId
    });
    
    if (!bid) {
      return Response.json({ 
        error: 'Bid not found',
        message: 'Could not find the specified bid' 
      }, { status: 404 });
    }
    
    // For demo purposes, we'll use sample data since we don't have the actual file content in the DB
    // In a real application, you would store the file content or have a way to retrieve it
    
    // Sample bid data based on the bid name
    let sampleContent = "";
    if (bid.name.includes("bid_sample_1")) {
      sampleContent = `Project Bid Proposal
Urban Horizon Development - Residential Complex
Submitted by: Quantum Urban Builders Date: February 13, 2025 Project Reference:
QUB-2025-002
Executive Summary
Quantum Urban Builders presents a comprehensive proposal for the Urban Horizon
Development, leveraging our innovative approach to modern urban residential construction. With
a commitment to excellence and cutting-edge design, we aim to transform urban living spaces.
Project Scope
Proposed Development
- 22-story residential tower
- Total development area: 3.2 acres
- Estimated unit count: 265 residential units
- Smart technology-integrated living spaces
- Rooftop community garden and recreational area
- Semi-underground parking facility with electric vehicle charging stations
Bid Breakdown
Total Project Estimated Cost: $82,300,000`;
    } else if (bid.name.includes("bid_sample_2")) {
      sampleContent = `Project Bid Proposal
Urban Horizon Development - Residential Complex
Submitted by: Horizon Global Developments Date: February 13, 2025 Project Reference:
HGD-2025-003
Executive Summary
Horizon Global Developments presents a comprehensive proposal for the Urban Horizon
Development, combining our international expertise with local architectural insights. Our
approach focuses on creating a landmark residential complex that sets new standards in urban
living.
Project Scope
Proposed Development
- 25-story residential tower
- Total development area: 3.7 acres
- Estimated unit count: 295 residential units
- Integrated wellness center
- Multi-level commercial and community spaces
- Advanced parking management system
- Sky bridges connecting different building zones
Bid Breakdown
Total Project Estimated Cost: $91,200,000`;
    } else if (bid.name.includes("bid_sample_3")) {
      sampleContent = `Project Bid Proposal
Urban Horizon Development - Residential Complex
Submitted by: Sustainable Urban Solutions Inc. Date: February 13, 2025 Project Reference:
SUS-2025-004
Executive Summary
Sustainable Urban Solutions Inc. presents a groundbreaking proposal for the Urban Horizon
Development, emphasizing community-centric design, technological innovation, and
environmental stewardship. Our approach goes beyond traditional construction to create a living
ecosystem that adapts to residents' evolving needs.
Project Scope
Proposed Development
- 23-story residential tower
- Total development area: 3.6 acres
- Estimated unit count: 275 residential units
- Community innovation hub
- Collaborative work and learning spaces
- Automated parking system
- Urban agricultural integration
- Comprehensive wellness and recreation facilities
Bid Breakdown
Total Project Estimated Cost: $88,750,000`;
    } else {
      sampleContent = `Project Bid Proposal
Urban Horizon Development - Residential Complex
Submitted by: ${bid.bidder} Date: February 13, 2025
Executive Summary
This is a sample bid document for demonstration purposes.
Bid Breakdown
Total Project Estimated Cost: $85,000,000`;
    }
    
    const fileContents = [{
      name: bid.name,
      content: sampleContent
    }];
    
    // Log original content size
    const totalOriginalChars = fileContents.reduce((sum, file) => sum + file.content.length, 0);
    const estOriginalTokens = estimateTokens(totalOriginalChars);
    
    // Preprocess the bid documents
    const maxContentLength = 10000; // Characters per document
    const preprocessedContents = preprocessBidDocuments(fileContents, maxContentLength);
    
    // Log processed content size
    const totalProcessedChars = preprocessedContents.reduce((sum, file) => sum + file.content.length, 0);
    const estProcessedTokens = estimateTokens(totalProcessedChars);
    
    const prompt = `Analyze this construction bid and provide a comparison in the following exact JSON format:
{
  "summary": {
    "recommendedBid": "string - name of recommended bid",
    "totalCost": number - cost of recommended bid in dollars (DO NOT format with commas or $ signs),
    "reasoning": "string - brief 1-2 sentence explanation"
  },
  "bidComparison": [
    {
      "bidder": "string - name from filename or document",
      "totalCost": number - total bid amount in dollars (DO NOT format with commas or $ signs)",
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

Bid document to analyze:

${preprocessedContents[0].content}`;

    const analysisResults = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a construction bid analysis expert analyzing a bid document.

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
    
    const result = JSON.parse(analysisResults.choices[0].message.content);
    
    // Track token usage
    logTokenUsage(
      '/api/analyze-bids/by-id', 
      estProcessedTokens, 
      estimateTokens(JSON.stringify(result)), 
      'gpt-4-turbo-preview'
    );
    
    return Response.json(result);

  } catch (error) {
    console.error('Bid analysis error:', error);
    return Response.json({ 
      error: 'Failed to analyze bid',
      message: error.message,
      retryIn: 60
    }, { status: error.status || 500 });
  }
}