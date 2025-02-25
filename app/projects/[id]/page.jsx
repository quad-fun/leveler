'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building, Calendar, FileText, UploadCloud, ArrowLeft, ChevronRight, PieChart } from 'lucide-react';

export default function ProjectPage({ params }) {
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBids, setSelectedBids] = useState([]);

  useEffect(() => {
    // Fetch project data
    const fetchProjectData = async () => {
      setLoading(true);
      try {
        // In a production app, these would be real API calls
        // For now, we'll use our mock API routes

        // Fetch project
        const projectResponse = await fetch(`/api/projects/${params.id}`);
        if (!projectResponse.ok) {
          throw new Error('Project not found');
        }
        const projectData = await projectResponse.json();
        setProject(projectData);

        // Fetch bids for this project
        const bidsResponse = await fetch(`/api/projects/${params.id}/bids`);
        const bidsData = await bidsResponse.json();
        setBids(bidsData);
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProjectData();
    }
  }, [params.id]);

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

  const toggleBidSelection = (bidId) => {
    if (selectedBids.includes(bidId)) {
      setSelectedBids(selectedBids.filter(id => id !== bidId));
    } else {
      setSelectedBids([...selectedBids, bidId]);
    }
  };

  const handleCompare = () => {
    // In production, redirect to a comparison page
    alert(`Comparing bids: ${selectedBids.join(', ')}`);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">Project not found</h3>
          <Link href="/projects" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/projects" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Projects
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
            
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
          
          <div className="text-right">
            <div className="text-sm text-gray-500">Estimated Budget</div>
            <div className="text-xl font-semibold text-green-600">
              {formatCurrency(project.totalBudget)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Bid Submissions</h2>
        <div className="flex space-x-2">
          {selectedBids.length > 1 && (
            <button 
              onClick={handleCompare}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PieChart className="w-4 h-4 mr-2" />
              Compare Selected ({selectedBids.length})
            </button>
          )}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Upload Bid
          </button>
        </div>
      </div>
      
      {bids.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No bids yet</h3>
          <p className="text-gray-500 mt-1">Upload bids to start analyzing them</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Upload First Bid
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div 
              key={bid.id}
              className="bg-white rounded-lg shadow-sm hover:shadow transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={selectedBids.includes(bid.id)}
                    onChange={() => toggleBidSelection(bid.id)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded"
                  />
                  
                  <div className="ml-4 flex-grow">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{bid.bidder}</h3>
                        <p className="text-sm text-gray-500">
                          File: {bid.name} • Submitted: {formatDate(bid.submittedAt)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-semibold">
                          {formatCurrency(bid.totalCost)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {bid.status === 'analyzed' ? (
                            <span className="text-green-600">Analyzed</span>
                          ) : (
                            <span className="text-yellow-600">Processing</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {bid.keyComponents && (
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500">Materials:</span>{' '}
                          <span className="font-medium">{formatCurrency(bid.keyComponents.materials)}</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500">Labor:</span>{' '}
                          <span className="font-medium">{formatCurrency(bid.keyComponents.labor)}</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500">Overhead:</span>{' '}
                          <span className="font-medium">{formatCurrency(bid.keyComponents.overhead)}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Link
                        href={`/projects/${project.id}/bids/${bid.id}`}
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Upload New Bid</h2>
            <p className="text-gray-600 mb-4">
              Select a bid document to upload and analyze for {project.name}.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
              <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Drag and drop a file here, or click to browse
              </p>
              <input 
                type="file" 
                className="hidden" 
                id="bid-upload"
                accept=".pdf,.doc,.docx,.csv,.xlsx" 
              />
              <label
                htmlFor="bid-upload"
                className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer text-sm"
              >
                Browse Files
              </label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('This would upload and analyze the bid');
                  setShowUploadModal(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Upload & Analyze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}