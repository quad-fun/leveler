// app/projects/[id]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building, Calendar, FileText, UploadCloud, ArrowLeft, ChevronRight, PieChart, X } from 'lucide-react';
import BidMultiUpload from '../../features/BidUpload';
import { useNotification } from '../../context/NotificationContext';

export default function ProjectPage({ params }) {
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBids, setSelectedBids] = useState([]);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    // Fetch project data
    const fetchProjectData = async () => {
      setLoading(true);
      setError(null);
      
      // Add a check to ensure params.id exists
      if (!params.id) {
        setError('No project ID provided');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${params.id}`);
        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project details');
        }
        const projectData = await projectResponse.json();
        setProject(projectData);

        // Fetch bids for this project
        const bidsResponse = await fetch(`/api/projects/${params.id}/bids`);
        if (!bidsResponse.ok) {
          throw new Error('Failed to fetch bids');
        }
        const bidsData = await bidsResponse.json();
        setBids(bidsData);
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [params.id]); // Depend on params.id to re-fetch if ID changes

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
    if (selectedBids.length < 2) {
      alert('Please select at least two bids to compare');
      return;
    }
    
    // Navigate to comparison page with selected bid IDs
    window.location.href = `/projects/${params.id}/compare?bids=${selectedBids.join(',')}`;
  };

  const handleUploadsComplete = async (results) => {
    // Refresh bids to show the new ones
    try {
      const response = await fetch(`/api/projects/${params.id}/bids`);
      if (!response.ok) {
        throw new Error('Failed to refresh bids');
      }
      const updatedBids = await response.json();
      setBids(updatedBids);
      setShowUploadModal(false);
      
      if (results && results.length > 0) {
        showSuccess(
          `Successfully uploaded ${results.length} bid${results.length > 1 ? 's' : ''}`,
          { details: 'The analysis process will continue in the background' }
        );
      }
    } catch (error) {
      console.error('Error refreshing bids:', error);
      showError('Failed to refresh bid list', { details: error.message });
    }
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

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-20 bg-red-50 rounded-lg">
          <h3 className="text-lg font-medium text-red-700">{error}</h3>
          <Link href="/projects" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            Back to Projects
          </Link>
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
      {/* Project header */}
      <div className="mb-6">
        <Link href="/projects" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Projects
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex items-center text-sm text-gray-500 mt-1">
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
            {project.description && (
              <p className="mt-3 text-gray-600">{project.description}</p>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 md:ml-4">
            {project.totalBudget ? (
              <div className="md:text-right">
                <div className="text-sm text-gray-500">Project Budget</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(project.totalBudget)}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Bids section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">Project Bids</h2>
          <div className="flex space-x-2">
            {selectedBids.length >= 2 && (
              <button
                onClick={handleCompare}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <PieChart className="w-4 h-4 mr-2" />
                Compare Selected ({selectedBids.length})
              </button>
            )}
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Bids
            </button>
          </div>
        </div>
        
        {bids.length === 0 ? (
          <div className="p-6 text-center">
            <div className="py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-500">No bids yet</h3>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Upload First Bid
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bids.map((bid) => (
              <div 
                key={bid._id} 
                className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={selectedBids.includes(bid._id)}
                    onChange={() => toggleBidSelection(bid._id)}
                    className="mt-1 mr-4"
                  />
                  <div>
                    <h3 className="font-medium">
                      {bid.bidder || 'Unnamed Bid'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {bid.name} • Submitted {formatDate(bid.submittedAt)}
                    </p>
                    {bid.totalCost && (
                      <p className="mt-1 text-green-600 font-medium">
                        {formatCurrency(bid.totalCost)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex items-center space-x-2">
                  {bid.status === 'analyzed' ? (
                    <Link
                      href={`/projects/${params.id}/bids/${bid._id}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      View Analysis
                    </Link>
                  ) : bid.status === 'processing' ? (
                    <button
                      disabled
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-sm flex items-center"
                    >
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                      Processing...
                    </button>
                  ) : (
                    <span className="text-yellow-600 text-sm">
                      Pending Analysis
                    </span>
                  )}
                  
                  <Link
                    href={`/projects/${params.id}/bids/${bid._id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Upload Bids</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <BidMultiUpload 
                projectId={params.id} 
                onUploadsComplete={handleUploadsComplete} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}