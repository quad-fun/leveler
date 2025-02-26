// app/projects/[id]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building, Calendar, FileText, UploadCloud, ArrowLeft, ChevronRight, PieChart, X, PlayCircle, Loader } from 'lucide-react';
import BidUpload from '@/app/features/BidUpload';
import UploadModal from '@/app/features/UploadModal';
import AnalyzeModal from '@/app/features/AnalyzeModal';

export default function ProjectPage({ params }) {
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBids, setSelectedBids] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file first');
      return;
    }
    
    setUploadLoading(true);
    
    try {
      // First, create a bid record in the database
      const bidMetadata = {
        name: uploadFile.name,
        bidder: uploadFile.name.split('.')[0].replace(/_/g, ' '), // Extract bidder name from filename for demo
        projectId: params.id // Use params.id directly
      };
      
      const bidResponse = await fetch(`/api/projects/${params.id}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bidMetadata),
      });
      
      if (!bidResponse.ok) {
        throw new Error('Failed to create bid record');
      }
      
      const bidData = await bidResponse.json();
      
      // Refresh bids to show the new one
      const updatedBidsResponse = await fetch(`/api/projects/${params.id}/bids`);
      const updatedBids = await updatedBidsResponse.json();
      setBids(updatedBids);
      
      setShowUploadModal(false);
      setUploadFile(null);
      
      // Show success message
      alert('Bid uploaded successfully! You can now analyze it.');
    } catch (error) {
      console.error('Error uploading bid:', error);
      alert(`Failed to upload bid: ${error.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const analyzeBid = async (bidId) => {
    // Find the bid by ID
    const bid = bids.find(b => b._id === bidId);
    if (!bid) return;
    
    try {
      // Set this specific bid to processing
      setBids(prevBids => 
        prevBids.map(b => 
          b._id === bidId ? {...b, status: 'processing'} : b
        )
      );
      
      // Get the file content and analyze
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      
      // For now, just prompt the user to select the file again
      // In production, you would store the file in a database or cloud storage
      alert(`Please select the ${bid.name} file again for analysis`);
      
      fileInput.onchange = async (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const fileContent = await file.text();
          
          const analysisResponse = await fetch(`/api/analyze-bids`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileContents: [{
                name: bid.name,
                content: fileContent
              }],
              bidId: bidId
            }),
          });
          
          if (!analysisResponse.ok) {
            throw new Error('Failed to analyze bid');
          }
          
          // Refresh bids to show the updated status
          const updatedBidsResponse = await fetch(`/api/projects/${params.id}/bids`);
          const updatedBids = await updatedBidsResponse.json();
          setBids(updatedBids);
          
          alert('Bid analyzed successfully!');
        }
      };
      
      fileInput.click();
    } catch (error) {
      console.error('Error analyzing bid:', error);
      alert(`Failed to analyze bid: ${error.message}`);
      
      // Reset the bid status
      setBids(prevBids => 
        prevBids.map(b => 
          b._id === bidId ? {...b, status: 'pending'} : b
        )
      );
    }
  };

  const refreshBids = async () => {
    const response = await fetch(`/api/projects/${params.id}/bids`);
    if (response.ok) {
      const data = await response.json();
      setBids(data);
    }
  };

  const eligibleBidCount = bids.filter(bid => bid.status !== 'analyzed' && bid.status !== 'processing').length;
  const selectedEligibleBidCount = bids.filter(bid => 
    selectedBids.includes(bid._id) && 
    bid.status !== 'analyzed' && 
    bid.status !== 'processing'
  ).length;

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
            
            {eligibleBidCount > 0 && (
              <button
                onClick={() => setShowAnalyzeModal(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                {selectedEligibleBidCount > 0 
                  ? `Analyze Selected (${selectedEligibleBidCount})`
                  : `Analyze All (${eligibleBidCount})`}
              </button>
            )}
            
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Bid
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
                    <button
                      onClick={() => analyzeBid(bid._id)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Analyze
                    </button>
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
      
      {/* Modals */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        projectId={params.id}
        onUploadComplete={(results) => {
          // Refresh bids list
          refreshBids();
          
          // Close modal
          setShowUploadModal(false);
          
          // Show success message
          alert(`Successfully uploaded ${results.length} bid${results.length !== 1 ? 's' : ''}`);
        }}
      />

      <AnalyzeModal
        isOpen={showAnalyzeModal}
        onClose={() => {
          setShowAnalyzeModal(false);
        }}
        projectId={params.id}
        bids={bids}
        selectedBids={selectedBids}
        onComplete={async (results) => {
          await refreshBids();
          setShowAnalyzeModal(false);
          setSelectedBids([]);
          const successCount = results.filter(r => r.success).length;
          alert(`Successfully analyzed ${successCount} of ${results.length} bids`);
        }}
      />
    </div>
  );
}