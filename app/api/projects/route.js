// Simple in-memory data store for development
// In production, replace with a database
let projects = [
    {
      id: 'p1',
      name: 'Downtown Residential Tower',
      description: 'A 22-story residential building with 265 units and ground-floor retail',
      location: 'Downtown Metro',
      createdAt: '2025-01-15T12:00:00Z',
      bidCount: 3,
      totalBudget: 85000000
    },
    {
      id: 'p2',
      name: 'Westside Office Complex',
      description: 'Modern office space with 3 buildings and underground parking',
      location: 'West Business District',
      createdAt: '2025-01-20T09:30:00Z',
      bidCount: 2,
      totalBudget: 56000000
    },
    {
      id: 'p3',
      name: 'Riverside Mixed-Use Development',
      description: 'Combined residential and commercial space along the riverfront',
      location: 'Riverside',
      createdAt: '2025-02-05T14:15:00Z',
      bidCount: 0,
      totalBudget: null
    }
  ];
  
  // Helper to generate a unique ID
  function generateId() {
    return 'p' + Math.random().toString(36).substring(2, 9);
  }
  
  // GET handler for listing projects
  export async function GET() {
    try {
      // Sort projects by creation date (newest first)
      const sortedProjects = [...projects].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      return Response.json(sortedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      return Response.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
  }
  
  // POST handler for creating a new project
  export async function POST(request) {
    try {
      const data = await request.json();
      
      // Validate required fields
      if (!data.name || !data.name.trim()) {
        return Response.json(
          { error: 'Project name is required' },
          { status: 400 }
        );
      }
      
      // Create a new project object
      const newProject = {
        id: generateId(),
        name: data.name,
        description: data.description || '',
        location: data.location || '',
        createdAt: new Date().toISOString(),
        bidCount: 0,
        totalBudget: null
      };
      
      // Add to the projects array
      projects.push(newProject);
      
      return Response.json(newProject, { status: 201 });
    } catch (error) {
      console.error('Error creating project:', error);
      return Response.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }
}