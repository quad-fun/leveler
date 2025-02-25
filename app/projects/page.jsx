'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Calendar, Building, FileText, ChevronRight } from 'lucide-react';

// Mock data for projects (replace with actual API call in production)
const mockProjects = [
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

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    // Simulate API call to fetch projects
    const fetchProjects = async () => {
      // In production, replace with actual API call
      // const response = await fetch('/api/projects');
      // const data = await response.json();
      
      setTimeout(() => {
        setProjects(mockProjects);
        setLoading(false);
      }, 500);
    };

    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newProject.name.trim()) {
      alert('Please enter a project name');
      return;
    }

    // In production, replace with actual API call
    // const response = await fetch('/api/projects', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newProject)
    // });
    
    // Simulate creating a new project
    const createdProject = {
      id: `p${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString(),
      bidCount: 0,
      totalBudget: null,
      ...newProject
    };
    
    setProjects([createdProject, ...projects]);
    setNewProject({ name: '', description: '', location: '' });
    setShowNewProject(false);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    
    // For millions, format as $XXM
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button
          onClick={() => setShowNewProject(!showNewProject)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>
      
      {showNewProject && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Create New Project</h2>
          <form onSubmit={handleCreateProject}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Downtown Residential Tower"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newProject.location}
                  onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Downtown Metro Area"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="2"
                placeholder="Brief description of the project"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNewProject(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
          <p className="text-gray-500 mt-1">Get started by creating your first project</p>
          <button
            onClick={() => setShowNewProject(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Link 
              href={`/projects/${project.id}`} 
              key={project.id}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{project.name}</h2>
                    <p className="text-gray-600 mt-1 text-sm">{project.description}</p>
                    
                    <div className="flex items-center text-sm text-gray-500 mt-3">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Created {formatDate(project.createdAt)}</span>
                      {project.location && (
                        <>
                          <span className="mx-2">•</span>
                          <Building className="w-4 h-4 mr-1" />
                          <span>{project.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {project.bidCount > 0 ? (
                      <div className="mr-8 text-right">
                        <div className="flex items-center text-sm text-gray-500">
                          <FileText className="w-4 h-4 mr-1" />
                          <span>{project.bidCount} {project.bidCount === 1 ? 'Bid' : 'Bids'}</span>
                        </div>
                        {project.totalBudget && (
                          <div className="text-green-600 font-medium">
                            {formatCurrency(project.totalBudget)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mr-8">
                        <span className="inline-block px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          No bids yet
                        </span>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;