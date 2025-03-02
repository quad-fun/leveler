// app/api/projects/[id]/bids/[bidId]/route.js
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const FORCE_MOCK_DATA = false; // Override environment setting

export async function GET(request, { params }) {
  try {
    const { id, bidId } = params;
    
    // Validate ObjectId format for both IDs
    if (!ObjectId.isValid(id) || !ObjectId.isValid(bidId)) {
      return Response.json({ 
        error: 'Invalid ID format', 
        details: 'Both project ID and bid ID must be valid ObjectIDs' 
      }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // First check if project exists
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Then fetch the specific bid
    const bid = await db.collection("bids").findOne({ 
      _id: new ObjectId(bidId),
      projectId: id // Using id directly as the projectId reference
    });
    
    if (!bid) {
      return Response.json({ error: 'Bid not found' }, { status: 404 });
    }
    
    return Response.json(bid);
  } catch (error) {
    console.error('Error fetching bid:', error);
    return Response.json({ 
      error: 'Failed to fetch bid',
      message: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id, bidId } = params;
    const data = await request.json();
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id) || !ObjectId.isValid(bidId)) {
      return Response.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // First check if project exists
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Then check if bid exists
    const existingBid = await db.collection("bids").findOne({ 
      _id: new ObjectId(bidId),
      projectId: id // Using id directly as the projectId reference
    });
    
    if (!existingBid) {
      return Response.json({ error: 'Bid not found' }, { status: 404 });
    }
    
    // Update the bid
    const result = await db.collection("bids").updateOne(
      { _id: new ObjectId(bidId) },
      { $set: { ...data, updatedAt: new Date() } }
    );
    
    // Return the updated bid
    const updatedBid = await db.collection("bids").findOne({ _id: new ObjectId(bidId) });
    return Response.json(updatedBid);
  } catch (error) {
    console.error('Error updating bid:', error);
    return Response.json({ 
      error: 'Failed to update bid',
      message: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id, bidId } = params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id) || !ObjectId.isValid(bidId)) {
      return Response.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // Check if project exists
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Check if bid exists
    const bid = await db.collection("bids").findOne({ 
      _id: new ObjectId(bidId),
      projectId: id // Using id directly as the projectId reference
    });
    
    if (!bid) {
      return Response.json({ error: 'Bid not found' }, { status: 404 });
    }
    
    // Delete the bid
    await db.collection("bids").deleteOne({ _id: new ObjectId(bidId) });
    
    // Update project bid count
    await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      { 
        $inc: { bidCount: -1 },
        $set: { updatedAt: new Date() }
      }
    );
    
    return Response.json({ message: 'Bid deleted successfully' });
  } catch (error) {
    console.error('Error deleting bid:', error);
    return Response.json({ 
      error: 'Failed to delete bid',
      message: error.message 
    }, { status: 500 });
  }
}