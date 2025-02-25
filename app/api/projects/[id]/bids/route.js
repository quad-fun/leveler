// Mock data store for bids
// In production, replace with database queries
const projectBids = {
    'p1': [
      {
        id: 'b1',
        projectId: 'p1',
        name: 'bid_sample_1.pdf',
        bidder: 'Quantum Urban Builders',
        totalCost: 82300000,
        submittedAt: '2025-01-20T09:30:00Z',
        status: 'analyzed',
        keyComponents: {
          materials: 33600000,
          labor: 31700000,
          overhead: 17000000
        }
      },
      {
        id: 'b2',
        projectId: 'p1',
        name: 'bid_sample_2.pdf',
        bidder: 'Horizon Global Developments',
        totalCost: 91200000,
        submittedAt: '2025-01-22T14:15:00Z',
        status: 'analyzed',
        keyComponents: {
          materials: 36500000,
          labor: 35400000,
          overhead: 19300000
        }
      },
      {
        id: 'b3',
        projectId: 'p1',
        name: 'bid_sample_3.pdf',
        bidder: 'Sustainable Urban Solutions',
        totalCost: 88750000,
        submittedAt: '2025-01-25T11:45:00Z',
        status: 'analyzed',
        keyComponents: {
          materials: 34600000,
          labor: 34150000,
          overhead: 20000000
        }
      }
    ],
    'p2': [
      {
        id: 'b4',
        projectId: 'p2',
        name: 'westside_bid1.pdf',
        bidder: 'Metro Commercial Builders',
        totalCost: 56000000,
        submittedAt: '2025-01-28T10:20:00Z',
        status: 'analyzed',
        keyComponents: {
          materials: 22400000,
          labor: 19600000,
          overhead: 14000000
        }
      },
      {
        id: 'b5',
        projectId: 'p2',
        name: 'westside_bid2.pdf',
        bidder: 'Urban Office Developments',
        totalCost: 61500000,
        submittedAt: '2025-01-29T16:45:00Z',
        status: 'analyzed',
        keyComponents: {
          materials: 24600000,
          labor: 21525000,
          overhead: 15375000
        }
      }
    ]
  };
  
  // Helper function to generate a unique ID
  function generateBidId() {
    return 'b' + Math.random().toString(36).substring(2, 9);
  }
  
  export async function GET(request, { params }) {
    try {
      const { id: projectId } = params;
      
      // Get the bids for the specified project
      const bids = projectBids[projectId] || [];
      
      // Sort bids by submission date (newest first)
      const sortedBids = [...bids].sort((a, b) =>
        new Date(b.submittedAt) - new Date(a.submittedAt)
      );
      
      return Response.json(sortedBids);
    } catch (error) {
      console.error('Error fetching bids:', error);
      return Response.json(
        { error: 'Failed to fetch bids' },
        { status: 500 }
      );
    }
  }
  
  export async function POST(request, { params }) {
    try {
      const { id: projectId } = params;
      const data = await request.json();
      
      // Validate required fields
      if (!data.name || !data.bidder) {
        return Response.json(
          { error: 'Bid name and bidder are required' },
          { status: 400 }
        );
      }
      
      // Create a new bid
      const newBid = {
        id: generateBidId(),
        projectId,
        name: data.name,
        bidder: data.bidder,
        totalCost: data.totalCost || null,
        submittedAt: new Date().toISOString(),
        status: 'pending', // Initial status is pending until analyzed
        keyComponents: data.keyComponents || null
      };
      
      // Initialize the project's bids array if it doesn't exist
      if (!projectBids[projectId]) {
        projectBids[projectId] = [];
      }
      
      // Add the new bid
      projectBids[projectId].push(newBid);
      
      // Update the project's bid count (in a real app, update the project record)
      // For this example, we'll just log it
      console.log(`Project ${projectId} now has ${projectBids[projectId].length} bids`);
      
      return Response.json(newBid, { status: 201 });
    } catch (error) {
      console.error('Error creating bid:', error);
      return Response.json(
        { error: 'Failed to create bid' },
        { status: 500 }
      );
    }
  }