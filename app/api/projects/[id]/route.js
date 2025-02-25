// Mock data store for projects
// In production, replace with database queries
const projects = [
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
  
  export async function GET(request, { params }) {
    try {
      const { id } = params;
      
      // Find the project with the matching ID
      const project = projects.find(p => p.id === id);
      
      if (!project) {
        return Response.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      
      return Response.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      return Response.json(
        { error: 'Failed to fetch project' },
        { status: 500 }
      );
    }
  }
  
  export async function PUT(request, { params }) {
    try {
      const { id } = params;
      const data = await request.json();
      
      // Find the project to update
      const projectIndex = projects.findIndex(p => p.id === id);
      
      if (projectIndex === -1) {
        return Response.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      
      // Update the project
      const updatedProject = {
        ...projects[projectIndex],
        name: data.name || projects[projectIndex].name,
        description: data.description !== undefined ? data.description : projects[projectIndex].description,
        location: data.location !== undefined ? data.location : projects[projectIndex].location,
        // Don't allow updating createdAt, id, or bidCount through this endpoint
      };
      
      // Replace the old project with the updated one
      projects[projectIndex] = updatedProject;
      
      return Response.json(updatedProject);
    } catch (error) {
      console.error('Error updating project:', error);
      return Response.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }
  }
  
  export async function DELETE(request, { params }) {
    try {
      const { id } = params;
      
      // Find the project index
      const projectIndex = projects.findIndex(p => p.id === id);
      
      if (projectIndex === -1) {
        return Response.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      
      // Remove the project
      const [deletedProject] = projects.splice(projectIndex, 1);
      
      return Response.json({
        message: 'Project deleted successfully',
        project: deletedProject
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      return Response.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }
  }
  
  // Export projects for other API routes to use
  export { projects };