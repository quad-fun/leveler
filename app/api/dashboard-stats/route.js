// app/api/dashboard-stats/route.js
import clientPromise from '../../../lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
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
    
    return Response.json({
      totalProjects,
      activeBids: totalBids,
      recentProjects,
      recentBids
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}