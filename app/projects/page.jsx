// app/projects/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Calendar, Building, FileText, ChevronRight } from 'lucide-react';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    // Fetch projects from API
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // app/projects/page.jsx - Update handleCreateProject function

const handleCreateProject = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newProject.name.trim()) {
      alert('Please enter a project name');
      return;
    }
  
    try {
      // Add totalBudget to the form data
      const projectToCreate = {
        ...newProject,
        totalBudget: newProject.totalBudget ? parseFloat(newProject.totalBudget) : null
      };
  
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectToCreate)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }
      
      const createdProject = await response.json();
      
      // Add to list instead of redirecting
      setProjects(prevProjects => [createdProject, ...prevProjects]);
      setNewProject({ name: '', description: '', location: '', totalBudget: '' });
      setShowNewProject(false);
    } catch (error) {
      console.error('Error creating project:', error);
      alert(`Failed to create project: ${error.message}`);
    }
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
      ) : error ? (
        <div className="text-center py-20 bg-red-50 rounded-lg text-red-700">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
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
              href={`/projects/${project._id}`}  // Note: Using _id from MongoDB
              key={project._id}  // Note: Using _id from MongoDB
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