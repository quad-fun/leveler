// app/api/projects/[id]/analyze-bids/route.js
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { preprocessBidDocuments } from '../../../../utils/simpleBidPreprocessor';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { bidIds, fileContents } = await request.json();
    
    // Validate project ID
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // Check if project exists
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Validate bid IDs
    if (!bidIds || !Array.isArray(bidIds) || bidIds.length === 0) {
      return Response.json({ error: 'No bid IDs provided' }, { status: 400 });
    }
    
    // Convert bid IDs to ObjectIds and validate
    const validBidIds = bidIds.filter(bidId => ObjectId.isValid(bidId));
    if (validBidIds.length === 0) {
      return Response.json({ error: 'No valid bid IDs provided' }, { status: 400 });
    }
    
    // Find the bids
    const bids = await db.collection("bids")
      .find({ 
        _id: { $in: validBidIds.map(id => new ObjectId(id)) },
        projectId: id
      })
      .toArray();
    
    if (bids.length === 0) {
      return Response.json({ error: 'No matching bids found' }, { status: 404 });
    }
    
    // Update bid statuses to 'processing'
    await db.collection("bids").updateMany(
      { _id: { $in: bids.map(bid => bid._id) } },
      { $set: { status: 'processing', processingStartedAt: new Date() } }
    );
    
    // Process file contents if provided
    let processedContents = [];
    if (fileContents && Array.isArray(fileContents) && fileContents.length > 0) {
      // Preprocess the bid documents
      processedContents = preprocessBidDocuments(fileContents);
    }
    
    // Implement actual analysis logic here
    // For demonstration, we're simulating the analysis process
    
    // Process each bid
    const results = [];
    for (const bid of bids) {
      try {
        // Simulate API call to OpenAI or other analysis service
        // In a real implementation, you would use the processedContents
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
        
        // Generate mock analysis results
        const analysisResults = {
          summary: {
            recommendedBid: bid.bidder,
            totalCost: bid.totalCost || Math.floor(Math.random() * 50000000) + 70000000,
            reasoning: "Based on competitive pricing and comprehensive service offerings."
          },
          bidComparison: [
            {
              bidder: bid.bidder,
              totalCost: bid.totalCost || Math.floor(Math.random() * 50000000) + 70000000,
              keyComponents: {
                materials: Math.floor(Math.random() * 20000000) + 30000000,
                labor: Math.floor(Math.random() * 10000000) + 20000000,
                overhead: Math.floor(Math.random() * 5000000) + 10000000
              }
            }
          ],
          risks: [
            "Timeline may be optimistic given the scope",
            "Potential material cost escalation not fully addressed",
            "Contingency budget lower than industry standard"
          ],
          recommendations: [
            "Request detailed breakdown of labor costs",
            "Clarify warranty terms and conditions",
            "Consider phased approach to mitigate timeline risks"
          ]
        };
        
        // Update bid with analysis results
        await db.collection("bids").updateOne(
          { _id: bid._id },
          { 
            $set: { 
              status: 'analyzed', 
              analysisResults,
              totalCost: analysisResults.bidComparison[0].totalCost,
              keyComponents: analysisResults.bidComparison[0].keyComponents,
              analyzedAt: new Date()
            } 
          }
        );
        
        results.push({
          bidId: bid._id.toString(),
          bidder: bid.bidder,
          status: 'analyzed',
          success: true
        });
      } catch (error) {
        console.error(`Error analyzing bid ${bid._id}:`, error);
        
        // Update bid status to error
        await db.collection("bids").updateOne(
          { _id: bid._id },
          { $set: { status: 'error', error: error.message } }
        );
        
        results.push({
          bidId: bid._id.toString(),
          bidder: bid.bidder,
          status: 'error',
          success: false,
          error: error.message
        });
      }
    }
    
    return Response.json({
      success: true,
      message: `Processed ${results.length} bids`,
      results
    });
  } catch (error) {
    console.error('Batch analysis error:', error);
    return Response.json({ 
      error: 'Failed to analyze bids',
      message: error.message
    }, { status: 500 });
  }
}