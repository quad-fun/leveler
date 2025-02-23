// File: app/api/analyze-bids/route.js
import { preprocessBid } from '@/features/preprocessing';
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function analyzeWithRetry(prompt, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a construction bid analysis expert. Provide analysis in the exact JSON format specified, with no additional text."
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
      if (error.status === 429) {
        const retryAfter = 60;
        console.log(`Rate limited. Waiting ${retryAfter} seconds before retry ${attempt + 1}/${maxRetries}`);
        await sleep(retryAfter * 1000);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

function truncateContent(content, maxLength = 15000) {
  if (content.length > maxLength) {
    return content.substring(0, maxLength) + "\n...(truncated for length)";
  }
  return content;
}

export async function POST(request) {
  console.log('API endpoint /api/analyze-bids was called');
  try {
    const body = await request.json();
    const { fileContents } = body;

    // Log the incoming data
    console.log('Received files:', fileContents.map(f => f.name));

    // Preprocess and gather stats for each bid (using await Promise.all for async processing)
    const preprocessedContents = await Promise.all(
      fileContents.map(async (file) => {
        const { processedText, stats, error } = await preprocessBid(file.content);
        
        // Log preprocessing results
        console.log(`Preprocessing stats for ${file.name}:`, {
          reduction: `${stats.reductionPercent}%`,
          originalTokens: stats.originalTokens,
          processedTokens: stats.processedTokens,
          error: error || 'none'
        });

        return {
          ...file,
          content: truncateContent(processedText),
          preprocessingStats: stats
        };
      })
    );

    // Construct prompt with preprocessed content
    const prompt = `Analyze these construction bids and provide a comparison in the following exact JSON format:
{
  "summary": {
    "recommendedBid": "string - name of recommended bid",
    "totalCost": "number - cost of recommended bid",
    "reasoning": "string - brief 1-2 sentence explanation"
  },
  "bidComparison": [
    {
      "bidder": "string - name from filename",
      "totalCost": "number",
      "keyComponents": {
        "materials": "number - estimated materials cost",
        "labor": "number - estimated labor cost",
        "overhead": "number - estimated overhead"
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

Bid documents to analyze:

${preprocessedContents.map((file, index) => `
--- BID DOCUMENT ${index + 1}: ${file.name} ---
${file.content}
`).join('\n\n')}`;

    const analysis = await analyzeWithRetry(prompt);

    // Return analysis along with preprocessing stats
    return NextResponse.json({ 
      message: 'Analysis complete',
      data: {
        ...analysis,
        preprocessingStats: preprocessedContents.map(file => ({
          filename: file.name,
          ...file.preprocessingStats
        }))
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze bids', message: error.message },
      { status: 500 }
    );
  }
}