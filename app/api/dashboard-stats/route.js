// app/api/dashboard-stats/route.js
import clientPromise from '../../../lib/mongodb';
import { getDashboardStats } from '../../../lib/mockDataService';

// Flag to force using mock data for testing
const FORCE_MOCK_DATA = process.env.FORCE_MOCK_DATA === 'true';

export async function GET() {
  // Better logging
  console.log('Dashboard stats API route called');
  
  // If mock data is forced, return it immediately
  if (FORCE_MOCK_DATA) {
    console.log('Using mock projects data (forced)');
    return Response.json(getDashboardStats());
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Set a short timeout for MongoDB connection attempt
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000)
    );
    
    // Try to connect to MongoDB with a timeout
    let client;
    try {
      client = await Promise.race([
        clientPromise,
        timeoutPromise
      ]);
      console.log('MongoDB client connected successfully');
    } catch (connectionError) {
      console.error('Error connecting to MongoDB:', connectionError);
      // Return mock data as a fallback
      console.log('Falling back to mock projects data due to connection error');
      return Response.json(getDashboardStats());
    }
    
    const db = client.db("bidleveling");
    console.log('Database accessed successfully');
    
    // Wrap each database operation in try/catch
    try {
      // Get project count
      const totalProjects = await db.collection("projects").countDocuments();
      console.log(`Found ${totalProjects} projects`);
      
      // Get bid count
      const totalBids = await db.collection("bids").countDocuments();
      console.log(`Found ${totalBids} bids`);
      
      // Get recent projects
      const recentProjects = await db.collection("projects")
        .find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();
      console.log(`Retrieved ${recentProjects.length} recent projects`);
      
      // Get recent bids
      const recentBids = await db.collection("bids")
        .find({})
        .sort({ submittedAt: -1 })
        .limit(5)
        .toArray();
      console.log(`Retrieved ${recentBids.length} recent bids`);
      
      console.log('Successfully fetched all data from MongoDB');
      
      return Response.json({
        totalProjects,
        activeBids: totalBids,
        recentProjects,
        recentBids
      });
    } catch (dbOperationError) {
      console.error('Error performing database operations:', dbOperationError);
      // Return mock data as a fallback
      console.log('Falling back to mock projects data due to database operation error');
      return Response.json(getDashboardStats());
    }
  } catch (error) {
    console.error('Error fetching dashboard stats from MongoDB:', error);
    
    // Return mock data as a fallback
    console.log('Falling back to mock data due to unhandled error');
    return Response.json(getDashboardStats());
  }
}