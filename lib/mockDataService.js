/* // lib/mockDataService.js

// Sample mock data to use when MongoDB is unavailable
export const mockData = {
    projects: [
      {
        _id: 'mock-project-1',
        name: 'Downtown Residential Tower',
        description: 'A luxury residential tower in the downtown area.',
        location: 'Downtown Metro',
        bidCount: 3,
        totalBudget: 85000000,
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'mock-project-2',
        name: 'Westside Office Complex',
        description: 'Modern office complex with eco-friendly features.',
        location: 'West Business District',
        bidCount: 2,
        totalBudget: 56000000,
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), // 14 days ago
        updatedAt: new Date(Date.now() - 86400000).toISOString() // Yesterday
      },
      {
        _id: 'mock-project-3',
        name: 'Community Health Center',
        description: 'State-of-the-art healthcare facility for the community.',
        location: 'North Suburbs',
        bidCount: 0,
        totalBudget: 32000000,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() // 2 days ago
      }
    ],
    
    bids: [
      {
        _id: 'mock-bid-1',
        name: 'quantum_builders_bid.pdf',
        projectId: 'mock-project-1',
        bidder: 'Quantum Urban Builders',
        status: 'analyzed',
        totalCost: 82300000,
        keyComponents: {
          materials: 33600000,
          labor: 29500000,
          overhead: 19200000
        },
        submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
        analysisResults: {
          risks: [
            'Timeline may be optimistic given current supply chain issues',
            'Labor costs might increase due to ongoing shortages'
          ],
          recommendations: [
            'Request more detailed breakdown of material costs',
            'Consider schedule contingency plan for possible delays'
          ]
        }
      },
      {
        _id: 'mock-bid-2',
        name: 'sustainable_solutions_bid.pdf',
        projectId: 'mock-project-1',
        bidder: 'Sustainable Urban Solutions',
        status: 'analyzed',
        totalCost: 88750000,
        keyComponents: {
          materials: 36200000,
          labor: 31000000,
          overhead: 21550000
        },
        submittedAt: new Date(Date.now() - 6 * 86400000).toISOString(), // 6 days ago
        analysisResults: {
          risks: [
            'Higher overall cost compared to other bids',
            'Some sustainable materials may have longer lead times'
          ],
          recommendations: [
            'Evaluate long-term cost savings from sustainable elements',
            'Request clarification on material sourcing and lead times'
          ]
        }
      },
      {
        _id: 'mock-bid-3',
        name: 'horizon_global_bid.pdf',
        projectId: 'mock-project-1',
        bidder: 'Horizon Global Developments',
        status: 'analyzed',
        totalCost: 84500000,
        keyComponents: {
          materials: 34800000,
          labor: 30200000,
          overhead: 19500000
        },
        submittedAt: new Date(Date.now() - 4 * 86400000).toISOString(), // 4 days ago
        analysisResults: {
          risks: [
            'International supply chain could face customs delays',
            'Complex design elements may require specialized labor'
          ],
          recommendations: [
            'Review proposed construction timeline for feasibility',
            'Confirm availability of specialized subcontractors'
          ]
        }
      },
      {
        _id: 'mock-bid-4',
        name: 'metro_commercial_bid.pdf',
        projectId: 'mock-project-2',
        bidder: 'Metro Commercial Builders',
        status: 'analyzed',
        totalCost: 56000000,
        keyComponents: {
          materials: 23400000,
          labor: 19600000,
          overhead: 13000000
        },
        submittedAt: new Date(Date.now() - 10 * 86400000).toISOString(), // 10 days ago
        analysisResults: {
          risks: [
            'Potential underestimation of fit-out costs',
            'Timeline does not account for city permit delays'
          ],
          recommendations: [
            'Request more detailed breakdown of finish levels',
            'Discuss permitting strategy and potential delays'
          ]
        }
      },
      {
        _id: 'mock-bid-5',
        name: 'cityscape_builders_bid.pdf',
        projectId: 'mock-project-2',
        bidder: 'Cityscape Builders',
        status: 'analyzed',
        totalCost: 58200000,
        keyComponents: {
          materials: 24100000,
          labor: 20500000,
          overhead: 13600000
        },
        submittedAt: new Date(Date.now() - 9 * 86400000).toISOString(), // 9 days ago
        analysisResults: {
          risks: [
            'Higher than average labor costs',
            'Material specifications may exceed requirements'
          ],
          recommendations: [
            'Review premium material choices for value engineering',
            'Confirm labor rates against market benchmarks'
          ]
        }
      }
    ]
  };
  
  // Mock Dashboard stats
  export function getDashboardStats() {
    return {
      totalProjects: mockData.projects.length,
      activeBids: mockData.bids.length,
      recentProjects: mockData.projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3),
      recentBids: mockData.bids.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 5)
    };
  }
  
  // Get all projects
  export function getAllProjects() {
    return mockData.projects;
  }
  
  // Get project by ID
  export function getProjectById(id) {
    return mockData.projects.find(project => project._id === id);
  }
  
  // Get all bids for a project
  export function getBidsByProjectId(projectId) {
    return mockData.bids.filter(bid => bid.projectId === projectId);
  }
  
  // Get bid by ID
  export function getBidById(id) {
    return mockData.bids.find(bid => bid._id === id);
  }
  
  // Create new project
  export function createProject(projectData) {
    const newProject = {
      _id: `mock-project-${mockData.projects.length + 1}`,
      ...projectData,
      bidCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockData.projects.push(newProject);
    return newProject;
  }
  
  // Create new bid
  export function createBid(bidData) {
    const newBid = {
      _id: `mock-bid-${mockData.bids.length + 1}`,
      ...bidData,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    
    mockData.bids.push(newBid);
    
    // Update project bid count
    const project = getProjectById(bidData.projectId);
    if (project) {
      project.bidCount = (project.bidCount || 0) + 1;
      project.updatedAt = new Date().toISOString();
    }
    
    return newBid;
  } */