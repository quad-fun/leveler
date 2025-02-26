// app/api/dashboard-stats/route.js
import clientPromise from '../../../lib/mongodb';
import { getDashboardStats } from '../../../lib/mockDataService';

// Flag to force using mock data for testing
const FORCE_MOCK_DATA = process.env.FORCE_MOCK_DATA === 'true';

export async function GET() {
  // If mock data is forced, return it immediately
  if (FORCE_MOCK_DATA) {
    console.log('Using mock data (forced)');
    return Response.json(getDashboardStats());
  }

  try {
    // Set a short timeout for MongoDB connection attempt
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 3000)
    );
    
    // Try to connect to MongoDB with a timeout
    const client = await Promise.race([
      clientPromise,
      timeoutPromise
    ]);
    
    const db = client.db("bidleveling");
    
    // Get project count
    const totalProjects = await db.collection("projects").countDocuments();
    
    // Get bid count
    const totalBids = await db.collection("bids").countDocuments();
    
    // Get recent projects
    const recentProjects = await db.collection("projects")
      .find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();
    
    // Get recent bids
    const recentBids = await db.collection("bids")
      .find({})
      .sort({ submittedAt: -1 })
      .limit(5)
      .toArray();
    
    console.log('Successfully fetched data from MongoDB');
    
    return Response.json({
      totalProjects,
      activeBids: totalBids,
      recentProjects,
      recentBids
    });
  } catch (error) {
    console.error('Error fetching dashboard stats from MongoDB:', error);
    
    // Return mock data as a fallback
    console.log('Falling back to mock data');
    return Response.json(getDashboardStats());
  }
}