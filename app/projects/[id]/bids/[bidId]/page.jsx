'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building, Calendar, FileText, UploadCloud, ArrowLeft, ChevronRight, PieChart } from 'lucide-react';

export default function ProjectPage({ params }) {
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBids, setSelectedBids] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    // Fetch project data
    const fetchProjectData = async () => {
      setLoading(true);
      setError(null);
      
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
    if (selectedBids.length < 2) {
      alert('Please select at least two bids to compare');
      return;
    }
    
    // Navigate to comparison page with selected bid IDs
    window.location.href = `/projects/${project._id}/compare?bids=${selectedBids.join(',')}`;
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
        projectId: project._id,
        status: 'pending'
      };
      
      const bidResponse = await fetch(`/api/projects/${project._id}/bids`, {
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
      const updatedBidsResponse = await fetch(`/api/projects/${project._id}/bids`);
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
          const updatedBidsResponse = await fetch(`/api/projects/${project._id}/bids`);
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
      {/* Rest of your component's JSX remains the same */}
      {/* ... */}
    </div>
  );
}